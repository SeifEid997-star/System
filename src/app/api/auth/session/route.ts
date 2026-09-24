import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/authSession";

export async function GET(request: NextRequest) {
  const session = verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  try {
    const user = await db.user.findUnique({ where: { id: session.userId }, include: { branch: true } });
    if (!user?.isActive) {
      const response = NextResponse.json({ user: null }, { status: 401 });
      response.cookies.delete(AUTH_COOKIE_NAME);
      return response;
    }
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        jobTitle: user.jobTitle || user.role,
        branch: user.branch?.name || "All Branches",
      },
    });
  } catch (error) {
    console.error("Session lookup failed:", error);
    return NextResponse.json({ error: "Unable to verify session" }, { status: 500 });
  }
}
