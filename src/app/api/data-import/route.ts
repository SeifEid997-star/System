import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getOrCreateDefaultClinicAndBranch } from "@/lib/clinicBranch";
import { logAuditForRequest } from "@/lib/audit";
import { cleanText, isValidEmail, isValidPhone } from "@/lib/validation";

export const maxDuration = 60; // Allow up to 60 seconds on serverless environments

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["OWNER", "MANAGER"]);
    if (auth.errorResponse) return auth.errorResponse;
    const caller = auth.user;

    const body = await req.json().catch(() => ({}));
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0 || records.length > 1000) {
      return NextResponse.json(
        { error: "Provide between 1 and 1000 records for import" },
        { status: 400 }
      );
    }
    const speciesAllowed = ["Canine", "Feline", "Avian", "Exotic"];
    const gendersAllowed = ["Male", "Female", "Neutered Male", "Spayed Female"];
    const invalidRow = records.findIndex((item: any) => !item || cleanText(item.clientName, 120).length < 2 ||
      !isValidPhone(item.phone) || cleanText(item.animalName, 100).length < 1 ||
      (item.email && !isValidEmail(item.email)) || (item.species && !speciesAllowed.includes(item.species)) ||
      (item.gender && !gendersAllowed.includes(item.gender)) ||
      (item.weightKg !== undefined && item.weightKg !== "" && (!Number.isFinite(Number(item.weightKg)) || Number(item.weightKg) < 0 || Number(item.weightKg) > 2000)));
    if (invalidRow !== -1) return NextResponse.json({ error: `Invalid or incomplete data in row ${invalidRow + 1}` }, { status: 400 });

    const { clinic } = await getOrCreateDefaultClinicAndBranch();
    const clinicId = caller.clinicId || clinic.id;

    // Process in sequential chunks of 50 to avoid connection pool exhaustion
    const CHUNK_SIZE = 50;
    let importedCount = 0;

    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      const chunkImported = await db.$transaction(async (tx) => {
        let count = 0;
        for (const item of chunk) {
          const cleanPhone = item.phone.trim();
          let owner = await tx.owner.findFirst({
            where: { clinicId, phone: cleanPhone },
          });

          if (!owner) {
            owner = await tx.owner.create({
              data: {
                clinicId,
                name: cleanText(item.clientName, 120),
                phone: cleanPhone,
                email: item.email ? item.email.trim().toLowerCase() : null,
                address: item.address ? cleanText(item.address, 240) : null,
                nationalId: item.nationalId || null,
              },
            });
          }

          const cleanPetName = cleanText(item.animalName, 100);
          const existingAnimal = await tx.animal.findFirst({
            where: { clinicId, ownerId: owner.id, name: cleanPetName },
          });

          if (!existingAnimal) {
            await tx.animal.create({
              data: {
                clinicId,
                ownerId: owner.id,
                name: cleanPetName,
                species: item.species || "Canine",
                breed: item.breed || null,
                gender: item.gender || "Male",
                microchipNumber: item.microchip || null,
                weightKg: item.weightKg !== undefined && item.weightKg !== "" ? Number(item.weightKg) : 0,
                notes: "Imported via Qlinic Data Import Wizard",
              },
            });
            count++;
          }
        }
        return count;
      }, { timeout: 30000 });

      importedCount += chunkImported;
    }

    // Record audit log
    await logAuditForRequest(req, {
      clinicId,
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: "CREATE",
      entity: "Animal",
      details: `Bulk imported ${importedCount} client and animal records into clinic database.`,
    });

    return NextResponse.json({
      success: true,
      importedCount,
      errors: [],
    });
  } catch (error: any) {
    console.error("Data import error:", error);
    return NextResponse.json(
      { error: "Failed to process import data" },
      { status: 500 }
    );
  }
}
