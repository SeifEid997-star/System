import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditForRequest } from "@/lib/audit";

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, priority } = body;

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    if (status === undefined && priority === undefined) {
      return NextResponse.json({ error: "Provide a status or priority to update" }, { status: 400 });
    }

    const existing = await db.clientTicket.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const updated = await db.clientTicket.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(priority !== undefined ? { priority } : {}),
      },
    });

    await logAuditForRequest(req, {
      clinicId: existing.clinicId,
      userId: "reception-desk",
      userName: "Reception",
      userRole: "RECEPTIONIST",
      action: "UPDATE",
      entity: "ClientTicket",
      entityId: updated.id,
      details:
        status !== undefined
          ? `Ticket for ${existing.owner.name} marked as ${status}`
          : `Ticket priority for ${existing.owner.name} set to ${priority}`,
    });

    return NextResponse.json({
      success: true,
      ticket: { id: updated.id, status: updated.status, priority: updated.priority },
    });
  } catch (error) {
    console.error("Failed to update client ticket:", error);
    return NextResponse.json({ error: "Failed to update client ticket" }, { status: 500 });
  }
}
