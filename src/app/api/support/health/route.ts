import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const start = performance.now();
    const [
      clinicCount,
      branchCount,
      userCount,
      ownerCount,
      animalCount,
      appointmentCount,
      invoiceCount,
      inventoryCount,
      auditLogCount,
      ticketCount,
    ] = await Promise.all([
      db.clinic.count(),
      db.branch.count(),
      db.user.count(),
      db.owner.count(),
      db.animal.count(),
      db.appointment.count(),
      db.invoice.count(),
      db.inventoryItem.count(),
      db.auditLog.count(),
      db.clientTicket.count(),
    ]);
    const responseMs = Math.round((performance.now() - start) * 10) / 10;

    const totalRows =
      clinicCount +
      branchCount +
      userCount +
      ownerCount +
      animalCount +
      appointmentCount +
      invoiceCount +
      inventoryCount +
      auditLogCount +
      ticketCount;

    return NextResponse.json({
      status: "OPERATIONAL",
      responseMs,
      checkedAt: new Date().toISOString(),
      tables: {
        Clinic: clinicCount,
        Branch: branchCount,
        User: userCount,
        Owner: ownerCount,
        Animal: animalCount,
        Appointment: appointmentCount,
        Invoice: invoiceCount,
        InventoryItem: inventoryCount,
        AuditLog: auditLogCount,
        ClientTicket: ticketCount,
      },
      totalRows,
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { status: "DEGRADED", error: "Database did not respond" },
      { status: 500 }
    );
  }
}
