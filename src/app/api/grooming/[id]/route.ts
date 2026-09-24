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
    const validStatuses = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) return NextResponse.json({ error: "Invalid grooming status" }, { status: 400 });

    const existing = await db.groomingSession.findUnique({ where: { id }, include: { animal: true } });
    if (!existing) {
      return NextResponse.json({ error: "Grooming session not found" }, { status: 404 });
    }

    const updated = await db.groomingSession.update({
      where: { id },
      data: { status },
    });

    const clinic = await db.clinic.findFirst();
    if (clinic) {
      await logAuditForRequest(req, {
        clinicId: clinic.id,
        userId: "grooming-desk",
        userName: "Grooming Coordinator",
        userRole: "RECEPTIONIST",
        action: "UPDATE",
        entity: "Grooming",
        entityId: updated.id,
        details: `Updated grooming session for ${existing.animal.name} to ${status}`,
      });
    }

    return NextResponse.json({ success: true, session: updated });
  } catch (error) {
    console.error("Failed to update grooming session:", error);
    return NextResponse.json({ error: "Failed to update grooming session" }, { status: 500 });
  }
}
