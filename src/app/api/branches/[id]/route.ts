import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditForRequest } from "@/lib/audit";
import { cleanText, isValidPhone } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, address, phone, status, active } = body;

    const validStatus = status === undefined || ["PRIMARY", "OPERATIONAL"].includes(status);
    if ((name !== undefined && cleanText(name, 120).length < 2) ||
        (address !== undefined && !cleanText(address, 240)) ||
        (phone !== undefined && !isValidPhone(phone)) || !validStatus ||
        (active !== undefined && typeof active !== "boolean")) {
      return NextResponse.json({ error: "Invalid branch name, address, phone, status, or active flag" }, { status: 400 });
    }

    const existing = await db.branch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const updated = await db.branch.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(status !== undefined ? { tier: status } : {}),
        ...(active !== undefined ? { isActive: Boolean(active) } : {}),
      },
    });

    const clinic = await db.clinic.findFirst();
    if (clinic) {
      await logAuditForRequest(req, {
        clinicId: clinic.id,
        userId: "branch-manager",
        userName: "Branch Administrator",
        userRole: "MANAGER",
        action: "UPDATE",
        entity: "Settings",
        entityId: updated.id,
        details:
          active !== undefined
            ? `${active ? "Activated" : "Deactivated"} branch: ${updated.name}`
            : `Updated branch details: ${updated.name}`,
      });
    }

    return NextResponse.json({
      success: true,
      branch: {
        id: updated.id,
        name: updated.name,
        address: updated.address,
        phone: updated.phone,
        status: updated.tier,
        active: updated.isActive,
      },
    });
  } catch (error) {
    console.error("Failed to update branch:", error);
    return NextResponse.json({ error: "Failed to update branch" }, { status: 500 });
  }
}
