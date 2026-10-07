import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateDefaultClinicAndBranch } from "@/lib/clinicBranch";
import { logAuditForRequest } from "@/lib/audit";
import { cleanText, finiteAmount, validDate } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const sessions = await db.groomingSession.findMany({
      include: { animal: { include: { owner: true } } },
      orderBy: { scheduledAt: "desc" },
    });

    const shaped = sessions.map((s) => ({
      id: s.id,
      pet: s.animal.name,
      species: s.animal.breed || s.animal.species,
      owner: s.animal.owner.name,
      phone: s.animal.owner.phone,
      service: s.service,
      stylist: s.stylist,
      time: s.scheduledAt,
      price: s.price,
      status: s.status,
    }));

    return NextResponse.json({ sessions: shaped });
  } catch (error) {
    console.error("Failed to fetch grooming sessions:", error);
    return NextResponse.json({ sessions: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { animalId, service, stylist, scheduledAt, price, branchId, notes } = body;
    const cleanService = cleanText(service, 120);
    const cleanStylist = cleanText(stylist || "Groomer", 120);
    const scheduled = scheduledAt || new Date().toISOString();

    if (typeof animalId !== "string" || !animalId || cleanService.length < 2 || !cleanStylist || !validDate(scheduled) ||
        (price !== undefined && !finiteAmount(price))) {
      return NextResponse.json({ error: "Choose a patient, enter a service, and provide a valid date and non-negative price" }, { status: 400 });
    }

    const { clinic, branch } = await getOrCreateDefaultClinicAndBranch(branchId);

    const animal = await db.animal.findFirst({ where: { id: animalId, clinicId: clinic.id } });
    if (!animal) return NextResponse.json({ error: "Patient not found in this clinic" }, { status: 404 });

    const session = await db.groomingSession.create({
      data: {
        clinicId: clinic.id,
        branchId: branch.id,
        animalId,
        service: cleanService,
        stylist: cleanStylist,
        scheduledAt: new Date(scheduled),
        price: price === undefined ? 0 : Number(price),
        notes,
      },
      include: { animal: { include: { owner: true } } },
    });

    await logAuditForRequest(req, {
      clinicId: clinic.id,
      userId: "grooming-desk",
      userName: "Grooming Coordinator",
      userRole: "RECEPTIONIST",
      action: "CREATE",
      entity: "Grooming",
      entityId: session.id,
      details: `Booked grooming session for ${session.animal.name}: ${service}`,
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        pet: session.animal.name,
        species: session.animal.breed || session.animal.species,
        owner: session.animal.owner.name,
        phone: session.animal.owner.phone,
        service: session.service,
        stylist: session.stylist,
        time: session.scheduledAt,
        price: session.price,
        status: session.status,
      },
    });
  } catch (error) {
    console.error("Failed to create grooming session:", error);
    return NextResponse.json({ error: "Failed to create grooming session" }, { status: 500 });
  }
}
