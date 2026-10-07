import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateDefaultClinicAndBranch } from "@/lib/clinicBranch";
import { logAuditForRequest } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const branchId = searchParams.get("branchId");
    const query = searchParams.get("query") || "";
    const filter = searchParams.get("filter"); // 'low_stock', 'expiring', 'all'

    const whereClause: any = {
      AND: [
        branchId && branchId !== "ALL" ? { branchId } : {},
        category && category !== "ALL" ? { category: { name: category } } : {},
        query
          ? {
              OR: [
                { name: { contains: query } },
                { sku: { contains: query } },
                { barcode: { contains: query } },
                { batchNumber: { contains: query } },
              ],
            }
          : {},
      ],
    };

    const limit = Math.min(Math.max(1, Number(searchParams.get("limit") || 100)), 200);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const skip = (page - 1) * limit;

    const items = await db.inventoryItem.findMany({
      where: whereClause,
      include: {
        category: true,
        branch: true,
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: skip,
    });

    // Compute stats
    const totalItems = items.length;
    const lowStockItems = items.filter((it) => it.quantity <= it.minStockAlert).length;
    const totalValue = items.reduce((acc, it) => acc + it.quantity * it.salePrice, 0);
    const totalCostValue = items.reduce((acc, it) => acc + it.quantity * it.unitCost, 0);

    return NextResponse.json({
      items,
      stats: {
        totalItems,
        lowStockItems,
        totalValue,
        totalCostValue,
      },
    });
  } catch (error) {
    console.error("Failed to load inventory:", error);
    return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      categoryName = "Medications",
      branchId,
      quantity = 0,
      minStockAlert = 5,
      unitCost = 0,
      salePrice = 0,
      batchNumber,
      expiryDate,
      barcode,
      sku,
      isPosAvailable = true,
    } = body;

    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanCategory = typeof categoryName === "string" ? categoryName.trim() : "";
    const cleanBatch = typeof batchNumber === "string" && batchNumber.trim() ? batchNumber.trim() : `BCH-${new Date().getFullYear()}-01`;
    const parsedQuantity = Number(quantity);
    const parsedMinStock = Number(minStockAlert);
    const parsedUnitCost = Number(unitCost);
    const parsedSalePrice = Number(salePrice);
    if (!cleanName || cleanName.length > 120) {
      return NextResponse.json({ error: "Item name is required (maximum 120 characters)" }, { status: 400 });
    }
    if (!cleanCategory || cleanCategory.length > 60 || cleanBatch.length > 80) {
      return NextResponse.json({ error: "A valid category and batch number are required" }, { status: 400 });
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0 || parsedQuantity > 1000000 ||
        !Number.isInteger(parsedMinStock) || parsedMinStock < 0 || parsedMinStock > 1000000) {
      return NextResponse.json({ error: "Quantity and stock threshold must be non-negative whole numbers" }, { status: 400 });
    }
    if (![parsedUnitCost, parsedSalePrice].every((value) => Number.isFinite(value) && value >= 0 && value <= 100000000)) {
      return NextResponse.json({ error: "Prices must be valid non-negative amounts" }, { status: 400 });
    }
    if (parsedSalePrice < parsedUnitCost) {
      return NextResponse.json({ error: "Retail price cannot be below cost price" }, { status: 400 });
    }
    if (expiryDate && (!Number.isFinite(new Date(expiryDate).getTime()) || new Date(expiryDate) < new Date(new Date().toDateString()))) {
      return NextResponse.json({ error: "Expiry date must be a valid date in the future" }, { status: 400 });
    }

    const { clinic, branch } = await getOrCreateDefaultClinicAndBranch(branchId);

    // Find or create category
    let category = await db.inventoryCategory.findFirst({
      where: { name: cleanCategory },
    });
    if (!category) {
      category = await db.inventoryCategory.create({
        data: {
          name: cleanCategory,
          code: cleanCategory.toUpperCase().replace(/\s+/g, "_"),
        },
      });
    }

    const generatedSku = sku || `SKU-${Date.now().toString().slice(-6)}`;
    const generatedBarcode = barcode || `622${Date.now().toString().slice(-10)}`;

    const newItem = await db.inventoryItem.create({
      data: {
        clinicId: clinic.id,
        branchId: branch.id,
        categoryId: category.id,
        name: cleanName,
        sku: generatedSku,
        barcode: generatedBarcode,
        quantity: parsedQuantity,
        minStockAlert: parsedMinStock,
        unitCost: parsedUnitCost,
        salePrice: parsedSalePrice,
        batchNumber: cleanBatch,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isPosAvailable: Boolean(isPosAvailable),
      },
      include: {
        category: true,
        branch: true,
      },
    });

    // Mandatory Audit Log
    await logAuditForRequest(req, {
      clinicId: clinic.id,
      userId: "inventory-manager",
      userName: "Inventory Controller",
      userRole: "MANAGER",
      action: "CREATE",
      entity: "Inventory",
      entityId: newItem.id,
      details: `Added new item: ${newItem.name} (Qty: ${newItem.quantity}, Batch: ${newItem.batchNumber})`,
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error) {
    console.error("Failed to add inventory item:", error);
    return NextResponse.json({ error: "Failed to add inventory item" }, { status: 500 });
  }
}
