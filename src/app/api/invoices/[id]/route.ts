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
    const { status, notes } = body;
    const validStatuses = ["PAID", "PARTIAL", "UNPAID", "VOIDED", "REFUNDED"];
    if ((status !== undefined && !validStatuses.includes(status)) ||
        (notes !== undefined && (typeof notes !== "string" || notes.length > 1000)) ||
        (status === undefined && notes === undefined)) {
      return NextResponse.json({ error: "Provide a valid invoice status or notes" }, { status: 400 });
    }

    const existing = await db.invoice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const updated = await db.invoice.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status, dueAmount: status === "VOIDED" ? 0 : existing.dueAmount } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    const clinic = await db.clinic.findFirst();
    if (clinic) {
      await logAuditForRequest(req, {
        clinicId: clinic.id,
        userId: "accounts-desk",
        userName: "Accounts Manager",
        userRole: "ACCOUNTANT",
        action: status === "VOIDED" ? "INVOICE_VOID" : "UPDATE",
        entity: "Invoice",
        entityId: updated.id,
        details: `Invoice ${updated.invoiceNumber} status set to ${updated.status}`,
      });
    }

    return NextResponse.json({ success: true, invoice: updated });
  } catch (error) {
    console.error("Failed to update invoice:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}
