import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateDefaultClinicAndBranch } from "@/lib/clinicBranch";
import { logAudit } from "@/lib/audit";
import { cleanText, validDate } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");

    const appointments = await db.appointment.findMany({
      where: {
        AND: [
          branchId ? { branchId } : {},
          status && status !== "ALL" ? { status } : {},
        ],
      },
      include: {
        animal: {
          include: { owner: true },
        },
        veterinarian: true,
        branch: true,
      },
      orderBy: { appointmentDate: "asc" },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { animalId, veterinarianId, branchId, date, time, type, reason } = body;

    const cleanType = cleanText(type || "CONSULTATION", 40).toUpperCase();
    const cleanReason = cleanText(reason || "Scheduled checkup", 300);
    const appointmentDate = date || new Date().toISOString();
    if (typeof animalId !== "string" || !animalId || !validDate(appointmentDate) ||
        (time !== undefined && (typeof time !== "string" || !/^(?:[01]?\d|2[0-3]):[0-5]\d(?:\s?[AP]M)?$/i.test(time.trim()))) ||
        !["CONSULTATION", "VACCINATION", "SURGERY", "GROOMING", "CHECKUP", "BOARDING"].includes(cleanType) || !cleanReason) {
      return NextResponse.json({ error: "Choose a patient and enter a valid date, time, appointment type, and reason" }, { status: 400 });
    }

    const { clinic, branch: activeBranch } = await getOrCreateDefaultClinicAndBranch(branchId);

    const animal = await db.animal.findFirst({ where: { id: animalId, clinicId: clinic.id } });
    if (!animal) return NextResponse.json({ error: "Patient not found in this clinic" }, { status: 404 });
    let assignedVetId: string | null = null;
    if (veterinarianId) {
      const vet = await db.user.findFirst({
        where: {
          clinicId: clinic.id,
          OR: [{ id: veterinarianId }, { email: veterinarianId }],
        },
      });
      if (vet) assignedVetId = vet.id;
    }

    const appointment = await db.appointment.create({
      data: {
        clinicId: clinic.id,
        branchId: activeBranch.id,
        animalId: animalId,
        veterinarianId: assignedVetId,
        appointmentDate: new Date(appointmentDate),
        appointmentTime: time || "10:00 AM",
        type: cleanType,
        status: "SCHEDULED",
        reason: cleanReason,
      },
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ error: "Failed to schedule appointment" }, { status: 500 });
  }
}
