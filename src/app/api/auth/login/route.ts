import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { logAudit } from "@/lib/audit";
import { AUTH_COOKIE_NAME, createSessionToken, SESSION_MAX_AGE_SECONDS } from "@/lib/authSession";
import { checkLoginRateLimit, recordFailedLoginAttempt, resetLoginRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const authSecret = process.env.AUTH_SECRET;
    if (!authSecret || authSecret.length < 32) {
      console.error("[Auth] AUTH_SECRET is missing or shorter than 32 characters.");
      return NextResponse.json(
        { error: "إعدادات السيرفر ناقصة (AUTH_SECRET)" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";
    const rateLimitKey = `${clientIp}:${String(email).toLowerCase()}`;

    const rateLimit = checkLoginRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `محاولات تسجيل دخول كثيرة جداً. يرجى الانتظار لمدة ${rateLimit.retryAfterSeconds} ثانية قبل المحاولة مجدداً.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    let user;
    try {
      user = await db.user.findUnique({
        where: { email: String(email).toLowerCase() },
        include: { branch: true },
      });
    } catch (dbError: any) {
      console.error("[Auth] Database error during login:", dbError?.code || "DB_ERROR");
      return NextResponse.json(
        { error: "قاعدة البيانات غير متاحة أو لم يتم تهيئتها" },
        { status: 503 }
      );
    }

    if (!user || !user.isActive) {
      recordFailedLoginAttempt(rateLimitKey);
      try {
        const count = await db.user.count();
        if (count === 0) {
          console.error("Database has no users. Run db:seed:production");
        }
      } catch {
        // silent
      }
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = verifyPassword(password, user.passwordHash);
    if (!valid) {
      recordFailedLoginAttempt(rateLimitKey);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    resetLoginRateLimit(rateLimitKey);

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

    const isSecure = process.env.NODE_ENV === "production" || process.env.AUTH_COOKIE_SECURE === "true";

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
      secure: isSecure,
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
