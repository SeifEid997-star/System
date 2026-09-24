import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditForRequest } from "@/lib/audit";
import { cleanText, validDate } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "ALL"; // ALL, TODAY, OVERDUE

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {};
    if (filter === "TODAY") {
      where.dueDate = { gte: startOfDay, lte: endOfDay };
    } else if (filter === "OVERDUE") {
      where.dueDate = { lt: startOfDay };
      where.status = "PENDING";
    }

    const reminders = await db.reminder.findMany({
      where,
      include: { animal: true, owner: true },
      orderBy: { dueDate: "asc" },
    });

    const now = new Date();
    const shaped = reminders.map((r) => ({
      id: r.id,
      patientName: r.animal.name,
      species: r.animal.species,
      ownerName: r.owner.name,
      ownerPhone: r.owner.phone,
      type: r.reminderType,
      description: r.notes || `${r.reminderType} reminder`,
      dueDate: r.dueDate.toISOString(),
      status: r.status,
      isOverdue: r.dueDate < startOfDay && r.status === "PENDING",
    }));

    return NextResponse.json({ reminders: shaped });
  } catch (error) {
    console.error("Failed to fetch reminders:", error);
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { animalId, reminderType, dueDate, channel, notes } = body;
    const reminderTypes = ["VACCINATION", "DEWORMING", "FOLLOW_UP", "CHECKUP", "BIRTHDAY"];
    const channels = ["WHATSAPP", "SMS", "EMAIL", "APP_NOTIFICATION"];

    if (typeof animalId !== "string" || !animalId || !validDate(dueDate) ||
        (reminderType && !reminderTypes.includes(reminderType)) || (channel && !channels.includes(channel)) ||
        (notes !== undefined && (typeof notes !== "string" || notes.trim().length > 500))) {
      return NextResponse.json({ error: "animalId and dueDate are required" }, { status: 400 });
    }

    const animal = await db.animal.findUnique({ where: { id: animalId } });
    if (!animal) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

    const clinic = await db.clinic.findFirst();
    if (!clinic) return NextResponse.json({ error: "Clinic not found" }, { status: 400 });

    const reminder = await db.reminder.create({
      data: {
        clinicId: clinic.id,
        animalId: animal.id,
        ownerId: animal.ownerId,
        reminderType: reminderType || "VACCINATION",
        dueDate: new Date(dueDate),
        channel: channel || "WHATSAPP",
        notes: notes || null,
      },
      include: { animal: true, owner: true },
    });

    await logAuditForRequest(req, {
      clinicId: clinic.id,
      userId: "reminders-engine",
      userName: "Reminders Coordinator",
      userRole: "RECEPTIONIST",
      action: "CREATE",
      entity: "Animal",
      entityId: reminder.id,
      details: `Scheduled ${reminder.reminderType} reminder for ${reminder.animal.name}`,
    });

    return NextResponse.json({
      success: true,
      reminder: {
        id: reminder.id,
        patientName: reminder.animal.name,
        species: reminder.animal.species,
        ownerName: reminder.owner.name,
        ownerPhone: reminder.owner.phone,
        type: reminder.reminderType,
        description: reminder.notes || `${reminder.reminderType} reminder`,
        dueDate: reminder.dueDate.toISOString(),
        status: reminder.status,
        isOverdue: false,
      },
    });
  } catch (error) {
    console.error("Failed to create reminder:", error);
    return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 });
  }
}
