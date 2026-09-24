import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditForRequest } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reservationId = searchParams.get("reservationId");
    if (!reservationId) {
      return NextResponse.json({ error: "reservationId is required" }, { status: 400 });
    }

    const logs = await db.boardingDailyLog.findMany({
      where: { reservationId },
      orderBy: { logDate: "desc" },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Failed to fetch boarding daily logs:", error);
    return NextResponse.json({ error: "Failed to fetch boarding daily logs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reservationId, generalCondition, appetiteFed, medicationsGiven, notes, loggedBy } = body;

    if (!reservationId) {
      return NextResponse.json({ error: "reservationId is required" }, { status: 400 });
    }

    const reservation = await db.boardingReservation.findUnique({
      where: { id: reservationId },
      include: { animal: { include: { owner: true } } },
    });
    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const log = await db.boardingDailyLog.create({
      data: {
        reservationId,
        generalCondition: generalCondition || "Good",
        appetiteFed: appetiteFed !== undefined ? Boolean(appetiteFed) : true,
        medicationsGiven: medicationsGiven !== undefined ? Boolean(medicationsGiven) : true,
        notes: notes || null,
        loggedBy: loggedBy || "Staff",
      },
    });

    const clinic = await db.clinic.findFirst();
    if (clinic) {
      await logAuditForRequest(req, {
        clinicId: clinic.id,
        userId: "boarding-desk",
        userName: "Boarding Coordinator",
        userRole: "RECEPTIONIST",
        action: "CREATE",
        entity: "Boarding",
        entityId: log.id,
        details: `Daily care log added for ${reservation.animal.name}: ${log.generalCondition}`,
      });
    }

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error("Failed to create boarding daily log:", error);
    return NextResponse.json({ error: "Failed to create boarding daily log" }, { status: 500 });
  }
}
