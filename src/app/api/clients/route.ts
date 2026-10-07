import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateDefaultClinicAndBranch } from "@/lib/clinicBranch";
import { logAuditForRequest } from "@/lib/audit";

function formatDateLabel(date: Date) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDate = new Date(date);
  startOfDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startOfDate.getTime() - startOfToday.getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  if (diffDays === 1) return "Tomorrow";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";

    const limit = Math.min(Math.max(1, Number(searchParams.get("limit") || 100)), 200);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const skip = (page - 1) * limit;

    const owners = await db.owner.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query } },
              { phone: { contains: query } },
              { email: { contains: query } },
            ],
          }
        : undefined,
      include: {
        animals: { select: { id: true, name: true, species: true, breed: true } },
        clientTickets: {
          where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: skip,
    });

    const ownerIds = owners.map((o) => o.id);
    const animalIds = owners.flatMap((o) => o.animals.map((a) => a.id));

    const now = new Date();

    const [lastAppointments, nextAppointments] = await Promise.all([
      db.appointment.findMany({
        where: {
          animalId: { in: animalIds },
          appointmentDate: { lte: now },
          status: { in: ["COMPLETED", "IN_PROGRESS"] },
        },
        orderBy: { appointmentDate: "desc" },
        select: { animalId: true, appointmentDate: true, type: true },
      }),
      db.appointment.findMany({
        where: {
          animalId: { in: animalIds },
          appointmentDate: { gt: now },
          status: { in: ["SCHEDULED", "CONFIRMED"] },
        },
        orderBy: { appointmentDate: "asc" },
        select: { animalId: true, appointmentDate: true, type: true },
      }),
    ]);

    // Map animal -> owner
    const animalOwnerMap = new Map<string, string>();
    for (const o of owners) {
      for (const a of o.animals) animalOwnerMap.set(a.id, o.id);
    }

    const lastVisitByOwner = new Map<string, { date: Date; type: string }>();
    for (const apt of lastAppointments) {
      const ownerId = animalOwnerMap.get(apt.animalId);
      if (!ownerId) continue;
      const existing = lastVisitByOwner.get(ownerId);
      if (!existing || apt.appointmentDate > existing.date) {
        lastVisitByOwner.set(ownerId, { date: apt.appointmentDate, type: apt.type });
      }
    }

    const nextApptByOwner = new Map<string, { date: Date; type: string }>();
    for (const apt of nextAppointments) {
      const ownerId = animalOwnerMap.get(apt.animalId);
      if (!ownerId) continue;
      const existing = nextApptByOwner.get(ownerId);
      if (!existing || apt.appointmentDate < existing.date) {
        nextApptByOwner.set(ownerId, { date: apt.appointmentDate, type: apt.type });
      }
    }

    const clients = owners.map((o) => {
      const lastVisit = lastVisitByOwner.get(o.id);
      const nextAppt = nextApptByOwner.get(o.id);
      return {
        id: o.id,
        name: o.name,
        phone: o.phone,
        email: o.email,
        petsCount: o.animals.length,
        petsNames:
          o.animals.length > 0
            ? o.animals.map((a) => `${a.name} (${a.breed || a.species})`).join(", ")
            : "No pets on file",
        lastVisit: lastVisit ? `${formatDateLabel(lastVisit.date)} (${lastVisit.type})` : "No visits yet",
        nextAppt: nextAppt ? `${formatDateLabel(nextAppt.date)} (${nextAppt.type})` : "None scheduled",
        balance: o.balance,
        openTickets: o.clientTickets.length,
      };
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Failed to fetch clients:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, address, nationalId, notes } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "name and phone are required" }, { status: 400 });
    }

    const { clinic } = await getOrCreateDefaultClinicAndBranch();

    const owner = await db.owner.create({
      data: {
        clinicId: clinic.id,
        name,
        phone,
        email: email || null,
        address: address || null,
        nationalId: nationalId || null,
        notes: notes || null,
      },
    });

    await logAuditForRequest(req, {
      clinicId: clinic.id,
      userId: "reception-desk",
      userName: "Reception",
      userRole: "RECEPTIONIST",
      action: "CREATE",
      entity: "Owner",
      entityId: owner.id,
      details: `New client record created for ${owner.name}`,
    });

    return NextResponse.json({ success: true, client: owner });
  } catch (error) {
    console.error("Failed to create client:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
