import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");
    const query = searchParams.get("query") || "";

    const logs = await db.auditLog.findMany({
      where: {
        AND: [
          action && action !== "ALL" ? { action } : {},
          entity && entity !== "ALL" ? { entity } : {},
          query
            ? {
                OR: [
                  { userName: { contains: query } },
                  { details: { contains: query } },
                  { entity: { contains: query } },
                ],
              }
            : {},
        ],
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Failed to load audit logs:", error);
    return NextResponse.json({ error: "Failed to load audit logs" }, { status: 500 });
  }
}
