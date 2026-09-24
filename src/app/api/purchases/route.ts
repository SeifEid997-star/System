import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditForRequest } from "@/lib/audit";
import { cleanText, finiteAmount } from "@/lib/validation";

function shapePurchase(p: any) {
  return {
    id: p.id,
    poNumber: p.poNumber,
    supplier: p.supplier.name,
    supplierId: p.supplierId,
    date: p.createdAt.toISOString(),
    itemsCount: p.itemsCount,
    totalAmount: p.totalAmount,
    paidAmount: p.paidAmount,
    status: p.status,
    paymentStatus: p.paymentStatus,
    branch: p.branch.name,
    branchId: p.branchId,
  };
}

export async function GET(req: NextRequest) {
  try {
    const purchases = await db.purchase.findMany({
      include: { supplier: true, branch: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ purchases: purchases.map(shapePurchase) });
  } catch (error) {
    console.error("Failed to fetch purchases:", error);
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supplierId, branchId, poNumber, itemsCount, totalAmount, paidAmount } = body;
    const cleanPoNumber = cleanText(poNumber, 60);
    const count = itemsCount === undefined ? 1 : Number(itemsCount);
    const total = Number(totalAmount);
    const paid = paidAmount === undefined ? 0 : Number(paidAmount);

    if (typeof supplierId !== "string" || !supplierId || typeof branchId !== "string" || !branchId || cleanPoNumber.length < 2 ||
        !Number.isInteger(count) || count < 1 || count > 100000 || !finiteAmount(total) || total <= 0 || !finiteAmount(paid) || paid > total) {
      return NextResponse.json(
        { error: "supplierId, branchId and poNumber are required" },
        { status: 400 }
      );
    }

    const clinic = await db.clinic.findFirst();
    if (!clinic) return NextResponse.json({ error: "Clinic not found" }, { status: 400 });
    const supplier = await db.supplier.findFirst({ where: { id: supplierId, clinicId: clinic.id } });
    if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

    const branch = await db.branch.findFirst({ where: { id: branchId, clinicId: clinic.id } });
    if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

    const paymentStatus = paid >= total && total > 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";

    const purchase = await db.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          clinicId: clinic.id,
          branchId,
          supplierId,
          poNumber: cleanPoNumber,
          itemsCount: count,
          totalAmount: total,
          paidAmount: paid,
          paymentStatus,
        },
        include: { supplier: true, branch: true },
      });

      // Any unpaid remainder is added to the supplier's outstanding balance.
      const remainder = total - paid;
      if (remainder !== 0) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: { outstandingBalance: { increment: remainder } },
        });
      }

      return created;
    });

    await logAuditForRequest(req, {
      clinicId: clinic.id,
      userId: "purchasing-desk",
      userName: "Purchasing Coordinator",
      userRole: "ACCOUNTANT",
      action: "CREATE",
      entity: "Purchase",
      entityId: purchase.id,
      details: `Recorded purchase ${purchase.poNumber} from ${purchase.supplier.name} (${total.toLocaleString()} EGP)`,
    });

    return NextResponse.json({ success: true, purchase: shapePurchase(purchase) });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Purchase/PO number already exists" }, { status: 409 });
    }
    console.error("Failed to record purchase:", error);
    return NextResponse.json({ error: "Failed to record purchase" }, { status: 500 });
  }
}
