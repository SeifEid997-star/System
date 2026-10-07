import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateDefaultClinicAndBranch } from "@/lib/clinicBranch";
import { requireRole } from "@/lib/auth";
import { logAuditForRequest } from "@/lib/audit";
import { hashPassword } from "@/lib/password";
import { cleanText, isValidEmail, isValidPhone } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const query = searchParams.get("query") || "";

    const users = await db.user.findMany({
      where: {
        AND: [
          role && role !== "ALL" ? { role } : {},
          query
            ? {
                OR: [
                  { name: { contains: query } },
                  { email: { contains: query } },
                  { phone: { contains: query } },
                  { jobTitle: { contains: query } },
                ],
              }
            : {},
        ],
      },
      include: {
        branch: true,
      },
      omit: { passwordHash: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Failed to load staff:", error);
    return NextResponse.json({ error: "Failed to load staff" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      role = "VETERINARIAN",
      jobTitle,
      branchId,
      licenseNumber,
      specialization,
      experienceYears = 0,
      shift = "Morning (9 AM - 5 PM)",
      emergencyPhone,
      password,
    } = body;

    const cleanName = cleanText(name, 120);
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanPhone = typeof phone === "string" ? phone.trim() : "";
    const allowedRoles = ["OWNER", "MANAGER", "VETERINARIAN", "RECEPTIONIST", "ACCOUNTANT"];
    const years = Number(experienceYears);
    if (cleanName.length < 2 || !/\p{L}/u.test(cleanName) || !isValidEmail(cleanEmail) || !cleanEmail || !isValidPhone(cleanPhone) ||
        typeof password !== "string" || password.length < 12 || password.length > 128 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) ||
        !allowedRoles.includes(role) || !Number.isInteger(years) || years < 0 || years > 70) {
      return NextResponse.json({ error: "Enter a valid name, email, phone, role, experience, and password (12+ characters with upper/lower case and a number)" }, { status: 400 });
    }

    const auth = await requireRole(req, ["OWNER", "MANAGER"]);
    if (auth.errorResponse) return auth.errorResponse;
    const caller = auth.user;

    if (role === "OWNER" && caller.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only clinic owners can assign the OWNER role" },
        { status: 403 }
      );
    }

    const { clinic, branch } = await getOrCreateDefaultClinicAndBranch(branchId);

    if (await db.user.findUnique({ where: { email: cleanEmail } })) {
      return NextResponse.json({ error: "An account already uses this email" }, { status: 409 });
    }

    const newUser = await db.user.create({
      data: {
        clinicId: caller.clinicId || clinic.id,
        branchId: branch?.id,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash: hashPassword(password),
        role, // OWNER, MANAGER, VETERINARIAN, RECEPTIONIST, ACCOUNTANT
        jobTitle: jobTitle || "Staff Member",
        licenseNumber,
        specialization,
        experienceYears: years,
        shift,
        emergencyPhone,
        isActive: true,
      },
      include: {
        branch: true,
      },
    });

    // Mandatory Audit Log using caller's real verified identity
    await logAuditForRequest(req, {
      clinicId: caller.clinicId || clinic.id,
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: "CREATE",
      entity: "Staff",
      entityId: newUser.id,
      details: `Added new staff member: ${newUser.name} with role: ${newUser.role}`,
    });

    const { passwordHash: _passwordHash, ...safeUser } = newUser;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
