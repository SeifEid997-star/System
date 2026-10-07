import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateDefaultClinicAndBranch } from "@/lib/clinicBranch";
import { logAuditForRequest } from "@/lib/audit";
import { cleanText, isValidEmail, isValidPhone } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const suppliers = await db.supplier.findMany({
      orderBy: { createdAt: "desc" },
    });

    const shaped = suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email || "",
      city: s.city,
      outstandingBalance: s.outstandingBalance,
      paymentTerms: s.paymentTerms,
      active: s.isActive,
    }));

    return NextResponse.json({ suppliers: shaped });
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
    return NextResponse.json({ suppliers: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, contactPerson, phone, email, city, paymentTerms } = body;
    const cleanName = cleanText(name, 120);
    const cleanPhone = typeof phone === "string" ? phone.trim() : "";

    if (cleanName.length < 2 || !isValidPhone(cleanPhone) || !isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a supplier name, valid phone number, and valid email address" }, { status: 400 });
    }

    const { clinic } = await getOrCreateDefaultClinicAndBranch();

    const supplier = await db.supplier.create({
      data: {
        clinicId: clinic.id,
        name: cleanName,
        category: category || "Pharmaceuticals & Vaccines",
        contactPerson: contactPerson || "General Representative",
        phone: cleanPhone,
        email: typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null,
        city: city || "Cairo, Egypt",
        paymentTerms: paymentTerms || "Net 30 Days",
      },
    });

    await logAuditForRequest(req, {
      clinicId: clinic.id,
      userId: "purchasing-desk",
      userName: "Purchasing Coordinator",
      userRole: "ACCOUNTANT",
      action: "CREATE",
      entity: "Supplier",
      entityId: supplier.id,
      details: `Registered new supplier: ${supplier.name}`,
    });

    return NextResponse.json({
      success: true,
      supplier: {
        id: supplier.id,
        name: supplier.name,
        category: supplier.category,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email || "",
        city: supplier.city,
        outstandingBalance: supplier.outstandingBalance,
        paymentTerms: supplier.paymentTerms,
        active: supplier.isActive,
      },
    });
  } catch (error) {
    console.error("Failed to create supplier:", error);
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
