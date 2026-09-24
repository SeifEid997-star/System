import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditForRequest } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const validStatuses = ["PENDING", "SENT", "COMPLETED", "DISMISSED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const existing = await db.reminder.findUnique({
      where: { id },
      include: { animal: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    const updated = await db.reminder.update({
      where: { id },
      data: { status },
      include: { animal: true, owner: true },
    });

    await logAuditForRequest(req, {
      clinicId: existing.clinicId,
      userId: "reminders-engine",
      userName: "Reminders Coordinator",
      userRole: "RECEPTIONIST",
      action: "UPDATE",
      entity: "Animal",
      entityId: updated.id,
      details: `Reminder for ${updated.animal.name} marked as ${status}`,
    });

    return NextResponse.json({
      success: true,
      reminder: {
        id: updated.id,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("Failed to update reminder:", error);
    return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 });
  }
}
