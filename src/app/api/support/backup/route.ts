import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditForRequest } from "@/lib/audit";

// Exports a genuine snapshot of the clinic's data (password hashes are
// intentionally excluded from the User export for safety).
export async function GET(req: NextRequest) {
  try {
    const clinic = await db.clinic.findFirst();
    if (!clinic) return NextResponse.json({ error: "Clinic not found" }, { status: 400 });

    const [
      branches,
      users,
      owners,
      animals,
      appointments,
      medicalCases,
      invoices,
      inventory,
      auditLogs,
      tickets,
    ] = await Promise.all([
      db.branch.findMany(),
      db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          jobTitle: true,
          isActive: true,
          createdAt: true,
        },
      }),
      db.owner.findMany(),
      db.animal.findMany(),
      db.appointment.findMany(),
      db.medicalCase.findMany(),
      db.invoice.findMany({ include: { items: true, payments: true } }),
      db.inventoryItem.findMany(),
      db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
      db.clientTicket.findMany(),
    ]);

    const backup = {
      generatedAt: new Date().toISOString(),
      clinic,
      counts: {
        branches: branches.length,
        users: users.length,
        owners: owners.length,
        animals: animals.length,
        appointments: appointments.length,
        medicalCases: medicalCases.length,
        invoices: invoices.length,
        inventory: inventory.length,
        auditLogs: auditLogs.length,
        tickets: tickets.length,
      },
      data: {
        branches,
        users,
        owners,
        animals,
        appointments,
        medicalCases,
        invoices,
        inventory,
        auditLogs,
        tickets,
      },
    };

    await logAuditForRequest(req, {
      clinicId: clinic.id,
      userId: "system-backup",
      userName: "System Backup",
      userRole: "SYSTEM",
      action: "EXPORT",
      entity: "Backup",
      details: `Full data backup exported (${Object.values(backup.counts).reduce((a, b) => a + b, 0)} total rows)`,
    });

    const filename = `PetPals_System_Backup_${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Backup export failed:", error);
    return NextResponse.json({ error: "Failed to generate backup" }, { status: 500 });
  }
}
