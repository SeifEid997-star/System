import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateDefaultClinicAndBranch } from "@/lib/clinicBranch";
import { requireRole } from "@/lib/auth";
import { logAuditForRequest } from "@/lib/audit";
import { cleanText, isValidEmail, isValidPhone } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const { clinic } = await getOrCreateDefaultClinicAndBranch();
    return NextResponse.json({ clinic });
  } catch (error) {
    console.error("Failed to fetch clinic settings:", error);
    return NextResponse.json({ error: "Failed to fetch clinic settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["OWNER", "MANAGER"]);
    if (auth.errorResponse) return auth.errorResponse;
    const caller = auth.user;

    const body = await req.json();
    const {
      name,
      taxId,
      commercialId,
      phone,
      email,
      address,
      currency,
      taxRate,
      receiptFooter,
      slotDurationMinutes,
      openingTime,
      closingTime,
      themePrimary,
    } = body;

    const textLimits: Record<string, number> = { name: 120, taxId: 60, commercialId: 60, phone: 40, email: 254, address: 240, receiptFooter: 500, openingTime: 5, closingTime: 5, themePrimary: 7 };
    for (const [key, limit] of Object.entries(textLimits)) {
      const value = body[key];
      if (value !== undefined && (typeof value !== "string" || value.length > limit || ((key === "name" || key === "address") && !value.trim()))) {
        return NextResponse.json({ error: `Invalid ${key}` }, { status: 400 });
      }
    }
    if ((name !== undefined && cleanText(name, 120).length < 2) || !isValidEmail(email) || (phone !== undefined && !isValidPhone(phone)) ||
        (currency !== undefined && !["EGP", "USD", "SAR", "AED"].includes(currency)) ||
        (taxRate !== undefined && (!Number.isFinite(Number(taxRate)) || Number(taxRate) < 0 || Number(taxRate) > 100)) ||
        (slotDurationMinutes !== undefined && ![15, 20, 30, 45].includes(Number(slotDurationMinutes))) ||
        (openingTime !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(openingTime)) ||
        (closingTime !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(closingTime)) ||
        (openingTime && closingTime && openingTime >= closingTime) ||
        (themePrimary !== undefined && !/^#[0-9a-f]{6}$/i.test(themePrimary))) {
      return NextResponse.json({ error: "Clinic settings contain an invalid email, phone, currency, tax rate, time, duration, or color" }, { status: 400 });
    }

    const { clinic } = await getOrCreateDefaultClinicAndBranch();

    const updated = await db.clinic.update({
      where: { id: clinic.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(taxId !== undefined ? { taxId } : {}),
        ...(commercialId !== undefined ? { commercialId } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(currency !== undefined ? { currency } : {}),
        ...(taxRate !== undefined ? { taxRate: parseFloat(taxRate) } : {}),
        ...(receiptFooter !== undefined ? { receiptFooter } : {}),
        ...(slotDurationMinutes !== undefined ? { slotDurationMinutes: parseInt(slotDurationMinutes) } : {}),
        ...(openingTime !== undefined ? { openingTime } : {}),
        ...(closingTime !== undefined ? { closingTime } : {}),
        ...(themePrimary !== undefined ? { themePrimary } : {}),
      },
    });

    await logAuditForRequest(req, {
      clinicId: updated.id,
      userId: "settings-admin",
      userName: "Clinic Administrator",
      userRole: "OWNER",
      action: "UPDATE",
      entity: "Settings",
      entityId: updated.id,
      details: `Updated clinic profile & global settings`,
    });

    return NextResponse.json({ success: true, clinic: updated });
  } catch (error) {
    console.error("Failed to update clinic settings:", error);
    return NextResponse.json({ error: "Failed to update clinic settings" }, { status: 500 });
  }
}
