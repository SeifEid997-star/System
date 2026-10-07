import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce OWNER role directly from verified DB session
    const auth = await requireRole(req, ["OWNER"]);
    if (auth.errorResponse) return auth.errorResponse;
    const caller = auth.user;

    const body = await req.json().catch(() => ({}));
    const { confirmationCode, password } = body;

    if (confirmationCode !== "RESET-PETPALS") {
      return NextResponse.json(
        { error: "Invalid confirmation code. Please enter RESET-PETPALS exactly." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Owner password is required to confirm factory reset." },
        { status: 400 }
      );
    }

    // 2. Re-verify Owner's password for safety
    const ownerRecord = await db.user.findUnique({
      where: { id: caller.id },
      select: { passwordHash: true },
    });

    if (!ownerRecord || !verifyPassword(password, ownerRecord.passwordHash)) {
      return NextResponse.json(
        { error: "Incorrect password. Factory reset authorization denied." },
        { status: 401 }
      );
    }

    const clinicId = caller.clinicId;

    // 3. Execute safe clinic-scoped zero-out transaction
    const [
      deletedInvoices,
      deletedCases,
      deletedAppointments,
      deletedAnimals,
      deletedOwners,
    ] = await db.$transaction([
      db.invoice.deleteMany({ where: { clinicId } }),
      db.medicalCase.deleteMany({ where: { clinicId } }),
      db.appointment.deleteMany({ where: { clinicId } }),
      db.animal.deleteMany({ where: { clinicId } }),
      db.owner.deleteMany({ where: { clinicId } }),
    ]);

    // 4. Record audit log using verified caller identity
    await logAudit({
      clinicId,
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: "DELETE",
      entity: "Settings",
      entityId: clinicId,
      details: `FACTORY RESET EXECUTED by ${caller.name} (${caller.email}). Deleted ${deletedOwners.count} owners, ${deletedAnimals.count} animals, ${deletedInvoices.count} invoices, ${deletedCases.count} medical cases.`,
    });

    return NextResponse.json({
      success: true,
      message: "Database successfully zeroed out for production clinic delivery.",
      deleted: {
        owners: deletedOwners.count,
        animals: deletedAnimals.count,
        appointments: deletedAppointments.count,
        medicalCases: deletedCases.count,
        invoices: deletedInvoices.count,
      },
    });
  } catch (error: any) {
    console.error("Factory reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset database" },
      { status: 500 }
    );
  }
}
