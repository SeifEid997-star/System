import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateDefaultClinicAndBranch } from "@/lib/clinicBranch";
import { logAuditForRequest } from "@/lib/audit";
import { cleanText, isValidPhone } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let branches = await db.branch.findMany({
      include: {
        _count: {
          select: { users: true },
        },
        appointments: {
          where: {
            appointmentDate: { gte: startOfDay, lte: endOfDay },
          },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (branches.length === 0) {
      await getOrCreateDefaultClinicAndBranch();
      branches = await db.branch.findMany({
        include: {
          _count: {
            select: { users: true },
          },
          appointments: {
            where: {
              appointmentDate: { gte: startOfDay, lte: endOfDay },
            },
            select: { id: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }

    const shaped = branches.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      phone: b.phone,
      status: b.tier,
      active: b.isActive,
      staffCount: b._count.users,
      todayAppointments: b.appointments.length,
    }));

    return NextResponse.json({ branches: shaped });
  } catch (error) {
    console.error("Failed to fetch branches:", error);
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, address, phone, status } = body;
    const cleanName = cleanText(name, 120);
    const cleanAddress = cleanText(address, 240);
    const cleanPhone = phone === undefined || phone === "" ? "+20 2 0000 0000" : phone;

    if (cleanName.length < 2 || !cleanAddress || !isValidPhone(cleanPhone)) {
      return NextResponse.json({ error: "Enter a branch name, address, and valid phone number" }, { status: 400 });
    }

    const { clinic } = await getOrCreateDefaultClinicAndBranch();

    const branch = await db.branch.create({
      data: {
        clinicId: clinic.id,
        name: cleanName,
        address: cleanAddress,
        phone: cleanPhone,
        tier: status === "PRIMARY" ? "PRIMARY" : "OPERATIONAL",
      },
    });

    await logAuditForRequest(req, {
      clinicId: clinic.id,
      userId: "branch-manager",
      userName: "Branch Administrator",
      userRole: "MANAGER",
      action: "CREATE",
      entity: "Settings",
      entityId: branch.id,
      details: `Opened new branch: ${branch.name}`,
    });

    return NextResponse.json({
      success: true,
      branch: {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        status: branch.tier,
        active: branch.isActive,
        staffCount: 0,
        todayAppointments: 0,
      },
    });
  } catch (error) {
    console.error("Failed to create branch:", error);
    return NextResponse.json({ error: "Failed to create branch" }, { status: 500 });
  }
}
