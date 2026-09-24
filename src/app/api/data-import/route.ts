import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditForRequest } from "@/lib/audit";
import { cleanText, isValidEmail, isValidPhone } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    const clinic = await db.clinic.findFirst();
    if (!clinic) {
      return NextResponse.json(
        { error: "Clinic record not found" },
        { status: 404 }
      );
    }

    const importedCount = await db.$transaction(async (tx) => {
      let imported = 0;
      for (const item of records) {
        // Upsert Owner by phone
        let owner = await tx.owner.findFirst({
          where: {
            clinicId: clinic.id,
            phone: item.phone.trim(),
          },
        });

        if (!owner) {
          owner = await tx.owner.create({
            data: {
              clinicId: clinic.id,
              name: cleanText(item.clientName, 120),
              phone: item.phone.trim(),
              email: item.email ? item.email.trim().toLowerCase() : null,
              address: item.address ? cleanText(item.address, 240) : null,
              nationalId: item.nationalId || null,
            },
          });
        }

        // Create Animal
        const existingAnimal = await tx.animal.findFirst({ where: { clinicId: clinic.id, ownerId: owner.id, name: cleanText(item.animalName, 100) } });
        if (existingAnimal) continue;
        await tx.animal.create({
          data: {
            clinicId: clinic.id,
            ownerId: owner.id,
            name: cleanText(item.animalName, 100),
            species: item.species || "Canine",
            breed: item.breed || null,
            gender: item.gender || "Male",
            microchipNumber: item.microchip || null,
            weightKg: item.weightKg !== undefined && item.weightKg !== "" ? Number(item.weightKg) : 0,
            notes: "Imported via Qlinic Data Import Wizard",
          },
        });

        imported++;
      }
      return imported;
    });

    // Record audit log
    await logAuditForRequest(req, {
      clinicId: clinic.id,
      userId: "usr-import-admin",
      userName: "Import Admin",
      userRole: "ADMIN",
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
      { error: "Failed to process import data", details: error.message },
      { status: 500 }
    );
  }
}
