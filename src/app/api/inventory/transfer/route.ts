import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditForRequest } from "@/lib/audit";
import { finiteAmount } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemId, destinationBranchId, quantity } = body;
    const amount = Number(quantity);
    if (typeof itemId !== "string" || !itemId || typeof destinationBranchId !== "string" || !destinationBranchId ||
        !Number.isInteger(amount) || !finiteAmount(amount) || amount < 1 || amount > 1_000_000) {
      return NextResponse.json({ error: "Select an item, a destination branch, and a positive whole-number quantity" }, { status: 400 });
    }

    const clinic = await db.clinic.findFirst();
    if (!clinic) return NextResponse.json({ error: "Clinic not found" }, { status: 400 });
    const source = await db.inventoryItem.findFirst({ where: { id: itemId, clinicId: clinic.id }, include: { category: true } });
    if (!source) return NextResponse.json({ error: "Source stock item not found in this clinic" }, { status: 404 });
    if (source.branchId === destinationBranchId) return NextResponse.json({ error: "Choose a different destination branch" }, { status: 400 });
    const destination = await db.branch.findFirst({ where: { id: destinationBranchId, clinicId: clinic.id, isActive: true } });
    if (!destination) return NextResponse.json({ error: "Destination branch is unavailable" }, { status: 400 });

    const result = await db.$transaction(async (tx) => {
      const decremented = await tx.inventoryItem.updateMany({ where: { id: source.id, quantity: { gte: amount } }, data: { quantity: { decrement: amount } } });
      if (decremented.count !== 1) throw new Error("INSUFFICIENT_STOCK");
      const existing = await tx.inventoryItem.findFirst({ where: { clinicId: clinic.id, branchId: destination.id, categoryId: source.categoryId, name: source.name, batchNumber: source.batchNumber } });
      const destinationItem = existing
        ? await tx.inventoryItem.update({ where: { id: existing.id }, data: { quantity: { increment: amount } } })
        : await tx.inventoryItem.create({ data: {
            clinicId: clinic.id, branchId: destination.id, categoryId: source.categoryId,
            name: source.name, sku: `${source.sku}-TR-${Date.now().toString(36).toUpperCase()}`.slice(0, 60), barcode: null,
            quantity: amount, minStockAlert: source.minStockAlert, unitCost: source.unitCost, salePrice: source.salePrice,
            expiryDate: source.expiryDate, batchNumber: source.batchNumber, isPosAvailable: source.isPosAvailable,
          } });
      return { destinationItemId: destinationItem.id, sourceQuantity: source.quantity - amount, destinationQuantity: (existing?.quantity || 0) + amount };
    });

    await logAuditForRequest(req, { clinicId: clinic.id, userId: "inventory-manager", userName: "Inventory Controller", userRole: "MANAGER", action: "UPDATE", entity: "Inventory", entityId: source.id, details: `Transferred ${amount} ${source.name} from ${source.branchId} to ${destination.name}` });
    return NextResponse.json({ success: true, transfer: { itemId: source.id, ...result, quantity: amount } });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") return NextResponse.json({ error: "There is not enough stock at the source branch" }, { status: 409 });
    console.error("Failed to transfer inventory:", error);
    return NextResponse.json({ error: "Failed to transfer inventory" }, { status: 500 });
  }
}
