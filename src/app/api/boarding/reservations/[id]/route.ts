import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditForRequest } from "@/lib/audit";

const VALID_STATUSES = ["ACTIVE", "COMPLETED", "CANCELLED"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const existing = await db.boardingReservation.findUnique({
      where: { id },
      include: { animal: true, room: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const updated = await db.boardingReservation.update({
      where: { id },
      data: { status },
    });

    const clinic = await db.clinic.findFirst();
    if (clinic) {
      await logAuditForRequest(req, {
        clinicId: clinic.id,
        userId: "boarding-desk",
        userName: "Boarding Coordinator",
        userRole: "RECEPTIONIST",
        action: "UPDATE",
        entity: "Boarding",
        entityId: updated.id,
        details: `${existing.animal.name} boarding stay (${existing.room.roomNumber}) marked as ${status}`,
      });
    }

    return NextResponse.json({
      success: true,
      reservation: { id: updated.id, status: updated.status },
    });
  } catch (error) {
    console.error("Failed to update boarding reservation:", error);
    return NextResponse.json({ error: "Failed to update boarding reservation" }, { status: 500 });
  }
}
