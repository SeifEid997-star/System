import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditForRequest } from "@/lib/audit";
import { cleanText, finiteAmount } from "@/lib/validation";

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dayCount(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export async function GET() {
  try {
    const rooms = await db.boardingRoom.findMany({
      include: {
        reservations: {
          where: { status: "ACTIVE" },
          include: { animal: { include: { owner: true } } },
          orderBy: { startDate: "desc" },
          take: 1,
        },
      },
      orderBy: { roomNumber: "asc" },
    });

    const shaped = rooms.map((r) => {
      const active = r.reservations[0];
      return {
        id: r.id,
        roomNumber: r.roomNumber,
        type: r.roomType,
        pricePerDay: r.pricePerDay,
        status: !r.isActive ? "CLEANING" : active ? "OCCUPIED" : "VACANT",
        reservationId: active?.id || null,
        currentPet: active
          ? {
              animalId: active.animalId,
              name: active.animal.name,
              species: active.animal.species,
              owner: active.animal.owner.name,
              phone: active.animal.owner.phone,
              checkIn: fmtDate(active.startDate),
              checkOut: fmtDate(active.endDate),
              days: dayCount(active.startDate, active.endDate),
              dailyRate: active.dailyRate,
            }
          : undefined,
      };
    });

    return NextResponse.json({ rooms: shaped });
  } catch (error) {
    console.error("Failed to fetch boarding rooms:", error);
    return NextResponse.json({ error: "Failed to fetch boarding rooms" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomNumber, roomType, capacity, pricePerDay } = body;
    const cleanRoomNumber = cleanText(roomNumber, 40);
    const roomTypes = ["STANDARD", "DELUXE", "SUITE", "ISOLATION"];
    const numericCapacity = capacity === undefined ? 1 : Number(capacity);
    const numericPrice = pricePerDay === undefined ? 250 : Number(pricePerDay);

    if (!cleanRoomNumber || (roomType && !roomTypes.includes(roomType)) || !Number.isInteger(numericCapacity) || numericCapacity < 1 || numericCapacity > 100 ||
        !finiteAmount(numericPrice) || numericPrice <= 0) {
      return NextResponse.json({ error: "Enter a room number, valid room type, capacity, and positive daily rate" }, { status: 400 });
    }

    const duplicate = await db.boardingRoom.findFirst({ where: { roomNumber: cleanRoomNumber } });
    if (duplicate) return NextResponse.json({ error: "Room number already exists" }, { status: 409 });

    const room = await db.boardingRoom.create({
      data: {
        roomNumber: cleanRoomNumber,
        roomType: roomType || "STANDARD",
        capacity: numericCapacity,
        pricePerDay: numericPrice,
      },
    });

    const clinic = await db.clinic.findFirst();
    if (clinic) {
      await logAuditForRequest(req, {
        clinicId: clinic.id,
        userId: "boarding-desk",
        userName: "Boarding Coordinator",
        userRole: "RECEPTIONIST",
        action: "CREATE",
        entity: "Boarding",
        entityId: room.id,
        details: `Added new boarding room: ${room.roomNumber}`,
      });
    }

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        roomNumber: room.roomNumber,
        type: room.roomType,
        pricePerDay: room.pricePerDay,
        status: "VACANT",
      },
    });
  } catch (error) {
    console.error("Failed to create boarding room:", error);
    return NextResponse.json({ error: "Failed to create boarding room" }, { status: 500 });
  }
}
