import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const species = searchParams.get("species") || "";

    const limit = Math.min(Math.max(1, Number(searchParams.get("limit") || 100)), 200);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const skip = (page - 1) * limit;

    const animals = await db.animal.findMany({
      where: {
        AND: [
          species && species !== "ALL" ? { species } : {},
          query
            ? {
                OR: [
                  { name: { contains: query } },
                  { breed: { contains: query } },
                  { microchipNumber: { contains: query } },
                  { owner: { name: { contains: query } } },
                  { owner: { phone: { contains: query } } },
                ],
              }
            : {},
        ],
      },
      include: {
        owner: true,
        medicalCases: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        appointments: {
          orderBy: { appointmentDate: "desc" },
          take: 3,
        },
        reminders: {
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: skip,
    });

    return NextResponse.json({ animals });
  } catch (error) {
    console.error("Failed to fetch animals:", error);
    return NextResponse.json({ error: "Failed to fetch animals" }, { status: 500 });
  }
}
