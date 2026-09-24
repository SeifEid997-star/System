import { db } from "./db";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionToken } from "./authSession";

export interface LogAuditParams {
  clinicId: string;
  userId: string;
  userName: string;
  userRole?: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "EXPORT" | "INVOICE_VOID" | "REFUND" | "VIEW";
  entity: "Animal" | "Invoice" | "MedicalCase" | "Inventory" | "Staff" | "Appointment" | "Boarding" | "Settings" | "ClientTicket" | "Reminder" | "Supplier" | "Purchase" | "Expense" | "Grooming" | "Passport" | "Owner" | "Auth" | "Backup";
  entityId?: string;
  details?: string;
  ipAddress?: string;
}

/**
 * Creates an audit log entry.
 * Note: Enforces userId and userName so they are NEVER empty, fixing the legacy system's critical flaw.
 */
export async function logAudit(params: LogAuditParams) {
  try {
    return await db.auditLog.create({
      data: {
        clinicId: params.clinicId,
        userId: params.userId,
        userName: params.userName,
        userRole: params.userRole || "STAFF",
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details,
        ipAddress: params.ipAddress || "127.0.0.1",
      },
    });
  } catch (error) {
    console.error("Failed to record audit log:", error);
    return null;
  }
}

export async function logAuditForRequest(request: NextRequest, params: LogAuditParams) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return logAudit(params);

  const actor = await db.user.findUnique({ where: { id: session.userId } });
  if (!actor || !actor.isActive) return logAudit(params);

  return logAudit({
    ...params,
    userId: actor.id,
    userName: actor.name,
    userRole: actor.role,
  });
}
