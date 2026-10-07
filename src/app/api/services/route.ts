import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateDefaultClinicAndBranch } from "@/lib/clinicBranch";
import { logAuditForRequest } from "@/lib/audit";
import { cleanText, finiteAmount } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const query = searchParams.get("query") || "";

    const services = await db.service.findMany({
      where: {
        AND: [
          category && category !== "ALL" ? { category: { name: category } } : {},
          query ? { name: { contains: query } } : {},
        ],
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Failed to load services:", error);
    return NextResponse.json({ error: "Failed to load services" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      categoryName = "Consultation",
      price = 0,
      cost = 0,
      durationMinutes = 30,
      linkedInventoryItemId,
    } = body;

    const cleanName = cleanText(name, 120);
    const cleanCategory = cleanText(categoryName, 60);
    const numericPrice = Number(price);
    const numericCost = Number(cost);
    const numericDuration = Number(durationMinutes);
    if (cleanName.length < 2 || !cleanCategory || !Number.isInteger(numericDuration) || numericDuration < 1 || numericDuration > 1440 ||
        !finiteAmount(numericPrice) || !finiteAmount(numericCost)) {
      return NextResponse.json({ error: "Enter a service name, valid category, non-negative prices, and duration from 1 to 1440 minutes" }, { status: 400 });
    }

    const { clinic } = await getOrCreateDefaultClinicAndBranch();

    let category = await db.serviceCategory.findFirst({
      where: { name: cleanCategory },
    });
    if (!category) {
      category = await db.serviceCategory.create({
        data: {
          name: cleanCategory,
          code: cleanCategory.toUpperCase().replace(/\s+/g, "_"),
        },
      });
    }

    const service = await db.service.create({
      data: {
        clinicId: clinic.id,
        categoryId: category.id,
        name: cleanName,
        price: numericPrice,
        cost: numericCost,
        durationMinutes: numericDuration,
        linkedInventoryItemId: linkedInventoryItemId || null,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    await logAuditForRequest(req, {
      clinicId: clinic.id,
      userId: "clinic-manager",
      userName: "Clinic Manager",
      userRole: "MANAGER",
      action: "CREATE",
      entity: "Settings",
      entityId: service.id,
      details: `Created clinic service: ${service.name} for ${service.price} EGP`,
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("Failed to add service:", error);
    return NextResponse.json({ error: "Failed to add service" }, { status: 500 });
  }
}
