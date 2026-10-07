import { NextRequest, NextResponse } from "next/server";
import { db } from "./db";
import { AUTH_COOKIE_NAME, verifySessionToken } from "./authSession";

export interface AuthenticatedUser {
  id: string;
  clinicId: string;
  branchId: string | null;
  name: string;
  email: string;
  role: string;
  jobTitle: string | null;
  isActive: boolean;
}

export type AuthResult =
  | { user: AuthenticatedUser; errorResponse: null }
  | { user: null; errorResponse: NextResponse };

/**
 * Validates the session from the cookie and retrieves the verified user from the database.
 * Does not trust client-supplied headers or role claims in tokens alone.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session?.userId) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        clinicId: true,
        branchId: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) return null;
    return user;
  } catch (error) {
    console.error("[Auth] Database error verifying user session:", error);
    return null;
  }
}

/**
 * Requires a valid authenticated session. Returns 401 response if not authenticated.
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }
  return { user, errorResponse: null };
}

/**
 * Requires the user to have one of the specified roles based on their live DB record.
 * Returns 401 if unauthenticated, 403 if role is insufficient.
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: string[]
): Promise<AuthResult> {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth;

  const user = auth.user;
  if (!allowedRoles.includes(user.role)) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: `Forbidden: requires one of [${allowedRoles.join(", ")}]` },
        { status: 403 }
      ),
    };
  }

  return { user, errorResponse: null };
}
