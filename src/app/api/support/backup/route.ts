import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    // 1. Strictly require OWNER role
    const auth = await requireRole(req, ["OWNER"]);
    if (auth.errorResponse) return auth.errorResponse;
    const caller = auth.user;
    const clinicId = caller.clinicId;

    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) return NextResponse.json({ error: "Clinic not found" }, { status: 404 });

    // 2. Query data strictly scoped to this clinic
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
      db.branch.findMany({ where: { clinicId } }),
      db.user.findMany({
        where: { clinicId },
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
      db.owner.findMany({ where: { clinicId } }),
      db.animal.findMany({ where: { clinicId } }),
      db.appointment.findMany({ where: { clinicId } }),
      db.medicalCase.findMany({ where: { clinicId } }),
      db.invoice.findMany({ where: { clinicId }, include: { items: true, payments: true } }),
      db.inventoryItem.findMany({ where: { clinicId } }),
      db.auditLog.findMany({ where: { clinicId }, orderBy: { createdAt: "desc" }, take: 500 }),
      db.clientTicket.findMany({ where: { clinicId } }),
    ]);

    const backup = {
      generatedAt: new Date().toISOString(),
      generatedBy: {
        id: caller.id,
        name: caller.name,
        email: caller.email,
        role: caller.role,
      },
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

    // 3. Record audit log with caller's verified identity
    await logAudit({
      clinicId,
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: "EXPORT",
      entity: "Backup",
      entityId: clinicId,
      details: `Full system backup downloaded by Owner: ${caller.name} (${caller.email}). Contained ${owners.length} owners, ${animals.length} pets, ${invoices.length} invoices.`,
    });

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="petpals_backup_${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error("Backup export error:", error);
    return NextResponse.json({ error: "Failed to generate backup" }, { status: 500 });
  }
}
