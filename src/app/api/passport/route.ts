import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditForRequest } from "@/lib/audit";
import { cleanText, validDate } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const animalId = searchParams.get("animalId");

    const animals = await db.animal.findMany({
      where: animalId ? { id: animalId } : { isActive: true },
      include: {
        owner: true,
        vaccinationRecords: { orderBy: { dateGiven: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const shaped = animals.map((a) => {
      const rabies = a.vaccinationRecords.find((v) => v.vaccineType === "RABIES");
      const deworming = a.vaccinationRecords.find((v) => v.vaccineType === "DEWORMING");
      return {
        id: a.id,
        name: a.name,
        species: a.species,
        breed: a.breed || "",
        gender: a.gender,
        dob: a.birthDate,
        microchip: a.microchipNumber || "",
        color: a.color || "",
        ownerName: a.owner.name,
        ownerPhone: a.owner.phone,
        ownerNationalId: a.owner.nationalId || "",
        address: a.owner.address || "",
        rabiesVaccine: rabies
          ? {
              product: rabies.productName,
              batch: rabies.batchNumber || "",
              dateGiven: rabies.dateGiven,
              validUntil: rabies.validUntil,
              vetName: rabies.vetName || "",
              vetLicense: rabies.vetLicense || "",
            }
          : null,
        deworming: deworming
          ? {
              product: deworming.productName,
              dateGiven: deworming.dateGiven,
              nextDue: deworming.validUntil,
            }
          : null,
        travelStatus:
          rabies && rabies.validUntil && new Date(rabies.validUntil) > new Date()
            ? "ELIGIBLE"
            : "PENDING_BOOSTER",
      };
    });

    return NextResponse.json({ pets: shaped });
  } catch (error) {
    console.error("Failed to fetch passport data:", error);
    return NextResponse.json({ error: "Failed to fetch passport data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { animalId, vaccineType, productName, batchNumber, dateGiven, validUntil, vetName, vetLicense, notes } = body;
    const cleanProduct = cleanText(productName, 120);
    const types = ["RABIES", "DEWORMING", "OTHER"];

    if (typeof animalId !== "string" || !animalId || !cleanProduct || !validDate(dateGiven) ||
        (vaccineType && !types.includes(vaccineType)) || (validUntil && (!validDate(validUntil) || new Date(validUntil) < new Date(dateGiven))) ||
        (batchNumber !== undefined && (typeof batchNumber !== "string" || batchNumber.length > 80)) ||
        (vetName !== undefined && (typeof vetName !== "string" || vetName.length > 120)) ||
        (vetLicense !== undefined && (typeof vetLicense !== "string" || vetLicense.length > 80)) ||
        (notes !== undefined && (typeof notes !== "string" || notes.length > 1000))) {
      return NextResponse.json({ error: "animalId, productName and dateGiven are required" }, { status: 400 });
    }

    const clinic = await db.clinic.findFirst();
    if (!clinic) return NextResponse.json({ error: "Clinic not found" }, { status: 400 });

    const animal = await db.animal.findFirst({ where: { id: animalId, clinicId: clinic.id } });
    if (!animal) return NextResponse.json({ error: "Patient not found in this clinic" }, { status: 404 });
    const record = await db.vaccinationRecord.create({
      data: {
        clinicId: clinic.id,
        animalId,
        vaccineType: vaccineType || "RABIES",
        productName: cleanProduct,
        batchNumber,
        dateGiven: new Date(dateGiven),
        validUntil: validUntil ? new Date(validUntil) : null,
        vetName,
        vetLicense,
        notes,
      },
    });

    await logAuditForRequest(req, {
      clinicId: clinic.id,
      userId: "clinical-desk",
      userName: "Attending Veterinarian",
      userRole: "VETERINARIAN",
      action: "CREATE",
      entity: "Passport",
      entityId: record.id,
      details: `Recorded ${record.vaccineType} vaccination (${productName}) for animal ${animalId}`,
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Failed to create vaccination record:", error);
    return NextResponse.json({ error: "Failed to create vaccination record" }, { status: 500 });
  }
}
