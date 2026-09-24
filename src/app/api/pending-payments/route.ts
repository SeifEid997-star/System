import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const invoices = await db.invoice.findMany({
      where: { status: { in: ["PARTIAL", "UNPAID"] } },
      include: { animal: true },
      orderBy: { createdAt: "desc" },
    });

    const shaped = invoices.map((inv) => ({
      id: inv.id,
      source: "OVERDUE_INVOICE" as const,
      description: `${inv.type === "POS_RECEIPT" ? "POS Receipt" : "Invoice"} ${inv.invoiceNumber} (${inv.status})`,
      client: inv.customerName,
      phone: inv.customerPhone || "",
      pet: inv.animal ? inv.animal.name : "—",
      date: inv.createdAt,
      estimatedAmount: inv.dueAmount,
    }));

    return NextResponse.json({ items: shaped });
  } catch (error) {
    console.error("Failed to fetch pending payments:", error);
    return NextResponse.json({ error: "Failed to fetch pending payments" }, { status: 500 });
  }
}
