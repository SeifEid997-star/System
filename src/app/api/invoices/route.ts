import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditForRequest } from "@/lib/audit";
import { cleanText, finiteAmount } from "@/lib/validation";

class InventoryUnavailableError extends Error {}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const query = searchParams.get("query") || "";

    const invoices = await db.invoice.findMany({
      where: {
        AND: [
          status && status !== "ALL" ? { status } : {},
          query
            ? {
                OR: [
                  { invoiceNumber: { contains: query } },
                  { customerName: { contains: query } },
                  { customerPhone: { contains: query } },
                ],
              }
            : {},
        ],
      },
      include: {
        items: true,
        payments: true,
        animal: true,
        owner: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName = "Walk-in Cash Customer",
      customerPhone,
      ownerId,
      animalId,
      medicalCaseId,
      items = [],
      subtotal = 0,
      discount = 0,
      tax = 0,
      total = 0,
      paidAmount = 0,
      paymentMethod = "CASH", // CASH, CREDIT_CARD, BANK_TRANSFER, VODAFONE_CASH, INSTAPAY, MULTIPLE
      type = "POS_RECEIPT",
      notes,
    } = body;

    const cleanCustomer = cleanText(customerName, 160);
    const numericSubtotal = Number(subtotal);
    const numericDiscount = Number(discount);
    const numericTax = Number(tax);
    const numericTotal = Number(total);
    const numericPaid = Number(paidAmount);
    const paymentMethods = ["CASH", "CREDIT_CARD", "BANK_TRANSFER", "VODAFONE_CASH", "INSTAPAY", "MULTIPLE"];
    const validItems = Array.isArray(items) && items.length > 0 && items.length <= 100 && items.every((item: any) =>
      item && typeof item === "object" && cleanText(item.name, 160).length >= 1 &&
      finiteAmount(item.price) && Number(item.price) > 0 && Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0 && Number(item.quantity) <= 10000 &&
      ["SERVICE", "INVENTORY", "MEDICATION", "PRODUCT"].includes(String(item.type || "SERVICE").toUpperCase())
    );
    const expectedSubtotal = validItems ? items.reduce((sum: number, item: any) => sum + Number(item.price) * Number(item.quantity), 0) : NaN;
    if (!cleanCustomer || !validItems || ![numericSubtotal, numericDiscount, numericTax, numericTotal, numericPaid].every((n) => finiteAmount(n)) ||
        numericDiscount > numericSubtotal || numericPaid > numericTotal || !paymentMethods.includes(paymentMethod) ||
        Math.abs(expectedSubtotal - numericSubtotal) > 0.02 || Math.abs(numericTotal - (numericSubtotal - numericDiscount + numericTax)) > 0.02) {
      return NextResponse.json({ error: "Invoice items, prices, discounts, tax, payment, and totals must be valid and consistent" }, { status: 400 });
    }

    const clinic = await db.clinic.findFirst();
    if (!clinic) return NextResponse.json({ error: "Clinic not found" }, { status: 400 });

    if (customerPhone !== undefined && customerPhone !== null && customerPhone !== "" && !/^[+\d().\s-]{7,25}$/.test(String(customerPhone))) {
      return NextResponse.json({ error: "Enter a valid customer phone number" }, { status: 400 });
    }
    if (ownerId) {
      const owner = await db.owner.findFirst({ where: { id: ownerId, clinicId: clinic.id } });
      if (!owner) return NextResponse.json({ error: "Customer not found in this clinic" }, { status: 400 });
    }
    if (animalId) {
      const animal = await db.animal.findFirst({ where: { id: animalId, clinicId: clinic.id, ...(ownerId ? { ownerId } : {}) } });
      if (!animal) return NextResponse.json({ error: "Patient not found for this customer" }, { status: 400 });
    }
    if (medicalCaseId && !(await db.medicalCase.findFirst({ where: { id: medicalCaseId, clinicId: clinic.id } }))) {
      return NextResponse.json({ error: "Medical case not found in this clinic" }, { status: 400 });
    }

    const branch = await db.branch.findFirst({ where: { clinicId: clinic.id } });
    if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 400 });

    const count = await db.invoice.count({ where: { clinicId: clinic.id } });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1001).padStart(6, "0")}`;

    const dueAmount = Math.max(0, Math.round((numericTotal - numericPaid + Number.EPSILON) * 100) / 100);
    const status = dueAmount === 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID";

    const invoice = await db.$transaction(async (tx) => {
      const inventoryLines = items.filter((item: any) => String(item.type || "").toUpperCase() === "INVENTORY" && !String(item.id || "").startsWith("custom-"));
      for (const item of inventoryLines) {
        if (typeof item.id !== "string" || !item.id) throw new Error("A stock item is missing its inventory reference");
        const changed = await tx.inventoryItem.updateMany({
          where: { id: item.id, clinicId: clinic.id, branchId: branch.id, quantity: { gte: Number(item.quantity) } },
          data: { quantity: { decrement: Number(item.quantity) } },
        });
        if (changed.count !== 1) throw new InventoryUnavailableError(`Insufficient or unavailable stock for ${cleanText(item.name, 160)}`);
      }
      const invoice = await tx.invoice.create({
      data: {
        clinicId: clinic.id,
        branchId: branch.id,
        invoiceNumber,
        customerName: cleanCustomer,
        customerPhone,
        ownerId,
        animalId,
        medicalCaseId,
        status,
        subtotal: numericSubtotal,
        discount: numericDiscount,
        tax: numericTax,
        total: numericTotal,
        paidAmount: numericPaid,
        dueAmount,
        paymentMethod,
        type,
        notes,
        items: {
          create: items.map((item: any) => ({
            itemType: item.type || "SERVICE",
            // Saved catalog records keep their link; one-off custom sale lines do not.
            referenceId: item.id?.startsWith("custom-") ? null : item.id || null,
            description: cleanText(item.name, 160),
            quantity: Number(item.quantity),
            unitPrice: Number(item.price),
            discount: parseFloat(item.discount) || 0,
            total: Number(item.price) * Number(item.quantity),
          })),
        },
        payments: {
          create: paidAmount > 0 ? [
            {
              amount: parseFloat(paidAmount),
              paymentMethod,
              receivedBy: "Reception Desk",
              notes: `Initial payment via ${paymentMethod}`,
            },
          ] : [],
        },
      },
      include: {
        items: true,
        payments: true,
      },
      });
      return invoice;
    });

    // Mandatory Audit Log
    await logAuditForRequest(req, {
      clinicId: clinic.id,
      userId: "staff-pos",
      userName: "Receptionist - POS",
      userRole: "RECEPTIONIST",
      action: "CREATE",
      entity: "Invoice",
      entityId: invoice.id,
      details: `Generated ${type} #${invoiceNumber} for ${customerName} total ${total} EGP via ${paymentMethod}`,
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error("Failed to generate invoice:", error);
    if (error instanceof InventoryUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
