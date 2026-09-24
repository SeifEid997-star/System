import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditForRequest } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { confirmationCode, userId = "usr-owner-omar" } = body;

    if (confirmationCode !== "RESET-PETPALS") {
      return NextResponse.json(
        { error: "Invalid confirmation code. Please enter RESET-PETPALS exactly." },
        { status: 400 }
      );
    }

    const clinic = await db.clinic.findFirst();
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Execute safe zero-out transaction
    const [
      deletedInvoices,
      deletedBoarding,
      deletedCases,
      deletedAppointments,
      deletedAnimals,
      deletedOwners,
    ] = await db.$transaction([
      db.invoice.deleteMany({ where: { clinicId: clinic.id } }),
      db.boardingReservation.deleteMany({}),
      db.medicalCase.deleteMany({ where: { clinicId: clinic.id } }),
      db.appointment.deleteMany({ where: { clinicId: clinic.id } }),
      db.animal.deleteMany({ where: { clinicId: clinic.id } }),
      db.owner.deleteMany({ where: { clinicId: clinic.id } }),
    ]);

    // Record initialization audit log
    await logAuditForRequest(req, {
      clinicId: clinic.id,
      userId: userId,
      userName: "Clinic Owner",
      userRole: "OWNER",
      action: "DELETE",
      entity: "Settings",
      details: `FACTORY RESET EXECUTED: Zeroed out database for clinic delivery. Deleted ${deletedOwners.count} owners, ${deletedAnimals.count} animals, ${deletedInvoices.count} invoices, ${deletedCases.count} medical cases.`,
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
        boarding: deletedBoarding.count,
      },
    });
  } catch (error: any) {
    console.error("Factory reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset database", details: error.message },
      { status: 500 }
    );
  }
}
