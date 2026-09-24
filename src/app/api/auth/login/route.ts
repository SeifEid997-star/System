import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { logAudit } from "@/lib/audit";
import { AUTH_COOKIE_NAME, createSessionToken, SESSION_MAX_AGE_SECONDS } from "@/lib/authSession";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: String(email).toLowerCase() },
      include: { branch: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await logAudit({
      clinicId: user.clinicId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: "LOGIN",
      entity: "Auth",
      entityId: user.id,
      details: `${user.name} signed in`,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        jobTitle: user.jobTitle || user.role,
        branch: user.branch?.name || "All Branches",
      },
    });
    response.cookies.set(AUTH_COOKIE_NAME, createSessionToken(user.id, user.role), {
      httpOnly: true,
      secure: process.env.AUTH_COOKIE_SECURE === "true",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
