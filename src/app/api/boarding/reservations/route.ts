import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditForRequest } from "@/lib/audit";
import { finiteAmount, validDate } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");
    const status = searchParams.get("status");

    const where: any = {};
    if (roomId) where.roomId = roomId;
    if (status) where.status = status;

    const reservations = await db.boardingReservation.findMany({
      where,
      include: { animal: { include: { owner: true } }, room: true },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({
      reservations: reservations.map((r) => ({
        id: r.id,
        roomId: r.roomId,
        roomNumber: r.room.roomNumber,
        animalId: r.animalId,
        petName: r.animal.name,
        owner: r.animal.owner.name,
        startDate: r.startDate.toISOString(),
        endDate: r.endDate.toISOString(),
        dailyRate: r.dailyRate,
        status: r.status,
        specialInstructions: r.specialInstructions,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch boarding reservations:", error);
    return NextResponse.json({ error: "Failed to fetch boarding reservations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, animalId, startDate, endDate, dailyRate, specialInstructions } = body;

    if (typeof roomId !== "string" || !roomId || typeof animalId !== "string" || !animalId || !validDate(startDate) || !validDate(endDate) ||
        new Date(endDate) <= new Date(startDate) || (dailyRate !== undefined && (!finiteAmount(dailyRate) || Number(dailyRate) <= 0)) ||
        (specialInstructions !== undefined && (typeof specialInstructions !== "string" || specialInstructions.length > 1000))) {
      return NextResponse.json(
        { error: "roomId, animalId, startDate and endDate are required" },
        { status: 400 }
      );
    }

    const room = await db.boardingRoom.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (!room.isActive) return NextResponse.json({ error: "Room is not available" }, { status: 409 });

    const existingActive = await db.boardingReservation.findFirst({
      where: { roomId, status: "ACTIVE", startDate: { lt: new Date(endDate) }, endDate: { gt: new Date(startDate) } },
    });
    if (existingActive) {
      return NextResponse.json({ error: "Room is already occupied" }, { status: 409 });
    }

    const clinic = await db.clinic.findFirst();
    if (!clinic) return NextResponse.json({ error: "Clinic not found" }, { status: 400 });
    const animal = await db.animal.findFirst({
      where: { id: animalId, clinicId: clinic.id },
      include: { owner: true },
    });
    if (!animal) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

    const reservation = await db.boardingReservation.create({
      data: {
        roomId,
        animalId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        dailyRate: dailyRate === undefined ? room.pricePerDay : Number(dailyRate),
        specialInstructions: specialInstructions || null,
      },
      include: { animal: { include: { owner: true } }, room: true },
    });

    await logAuditForRequest(req, {
        clinicId: clinic.id,
        userId: "boarding-desk",
        userName: "Boarding Coordinator",
        userRole: "RECEPTIONIST",
        action: "CREATE",
        entity: "Boarding",
        entityId: reservation.id,
        details: `Checked in ${reservation.animal.name} to ${reservation.room.roomNumber}`,
      });

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        roomId: reservation.roomId,
        animalId: reservation.animalId,
        petName: reservation.animal.name,
        owner: reservation.animal.owner.name,
        startDate: reservation.startDate.toISOString(),
        endDate: reservation.endDate.toISOString(),
        dailyRate: reservation.dailyRate,
        status: reservation.status,
      },
    });
  } catch (error) {
    console.error("Failed to create boarding reservation:", error);
    return NextResponse.json({ error: "Failed to create boarding reservation" }, { status: 500 });
  }
}
