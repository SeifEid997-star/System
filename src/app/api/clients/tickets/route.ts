import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditForRequest } from "@/lib/audit";

function timeAgo(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // OPEN, IN_PROGRESS, RESOLVED, CLOSED
    const priority = searchParams.get("priority"); // LOW, MEDIUM, HIGH, URGENT

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tickets = await db.clientTicket.findMany({
      where,
      include: {
        owner: {
          include: {
            animals: { select: { name: true, species: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const shaped = tickets.map((t) => {
      const pet = t.owner.animals[0];
      return {
        id: t.id,
        ticketNumber: `TKT-${t.id.slice(-4).toUpperCase()}`,
        client: t.owner.name,
        pet: pet ? `${pet.name} (${pet.species})` : "No pet on file",
        subject: t.subject,
        message: t.message,
        priority: t.priority,
        status: t.status,
        time: timeAgo(t.createdAt),
      };
    });

    return NextResponse.json({ tickets: shaped });
  } catch (error) {
    console.error("Failed to fetch client tickets:", error);
    return NextResponse.json({ error: "Failed to fetch client tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ownerId, subject, message, priority } = body;

    const cleanSubject = typeof subject === "string" ? subject.trim() : "";
    const cleanMessage = typeof message === "string" ? message.trim() : "";
    const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    if (typeof ownerId !== "string" || !ownerId || !cleanSubject || cleanSubject.length > 160 || !cleanMessage || cleanMessage.length > 5000 ||
        (priority !== undefined && !validPriorities.includes(priority))) {
      return NextResponse.json(
        { error: "Select a client, enter a subject (up to 160 characters) and message (up to 5000 characters), and use a valid priority" },
        { status: 400 }
      );
    }

    const owner = await db.owner.findUnique({
      where: { id: ownerId },
      include: { animals: { select: { name: true, species: true }, take: 1 } },
    });
    if (!owner) return NextResponse.json({ error: "Owner not found" }, { status: 404 });

    const clinic = await db.clinic.findFirst();
    if (!clinic) return NextResponse.json({ error: "Clinic not found" }, { status: 400 });

    const ticket = await db.clientTicket.create({
      data: {
        clinicId: clinic.id,
        ownerId: owner.id,
        subject: cleanSubject,
        message: cleanMessage,
        priority: priority || "MEDIUM",
      },
    });

    await logAuditForRequest(req, {
      clinicId: clinic.id,
      userId: "client-portal",
      userName: "Client Portal",
      userRole: "RECEPTIONIST",
      action: "CREATE",
      entity: "ClientTicket",
      entityId: ticket.id,
      details: `New ticket from ${owner.name}: ${ticket.subject}`,
    });

    const pet = owner.animals[0];
    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticketNumber: `TKT-${ticket.id.slice(-4).toUpperCase()}`,
        client: owner.name,
        pet: pet ? `${pet.name} (${pet.species})` : "No pet on file",
        subject: ticket.subject,
        message: ticket.message,
        priority: ticket.priority,
        status: ticket.status,
        time: "Just now",
      },
    });
  } catch (error) {
    console.error("Failed to create client ticket:", error);
    return NextResponse.json({ error: "Failed to create client ticket" }, { status: 500 });
  }
}
