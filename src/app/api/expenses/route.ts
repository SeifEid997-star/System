import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateDefaultClinicAndBranch } from "@/lib/clinicBranch";
import { requireRole } from "@/lib/auth";
import { logAuditForRequest } from "@/lib/audit";
import { cleanText, finiteAmount } from "@/lib/validation";

function shapeExpense(e: any) {
  return {
    id: e.id,
    category: e.category,
    description: e.description,
    amount: e.amount,
    date: e.createdAt.toISOString(),
    branch: e.branch?.name || "All Branches",
    branchId: e.branchId,
    recordedBy: e.recordedBy,
    method: e.method,
  };
}

export async function GET(req: NextRequest) {
  try {
    const expenses = await db.expense.findMany({
      include: { branch: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ expenses: expenses.map(shapeExpense) });
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json({ expenses: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["OWNER", "MANAGER", "ACCOUNTANT"]);
    if (auth.errorResponse) return auth.errorResponse;
    const caller = auth.user;

    const body = await req.json();
    const { category, description, amount, method, branchId } = body;
    const cleanDescription = cleanText(description, 240);

    if (!cleanDescription || !finiteAmount(amount) || Number(amount) <= 0) {
      return NextResponse.json({ error: "A description and a positive valid amount are required" }, { status: 400 });
    }

    const { clinic, branch } = await getOrCreateDefaultClinicAndBranch(branchId);

    const expense = await db.expense.create({
      data: {
        clinicId: caller.clinicId || clinic.id,
        branchId: branch.id,
        category: category || "Rent & Facilities",
        description: cleanDescription,
        amount: Number(amount),
        method: method || "Cash",
        recordedBy: caller.name,
      },
      include: { branch: true },
    });

    await logAuditForRequest(req, {
      clinicId: caller.clinicId || clinic.id,
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: "CREATE",
      entity: "Expense",
      entityId: expense.id,
      details: `Recorded ${expense.category} expense: ${expense.description} (${expense.amount.toLocaleString()} EGP)`,
    });

    return NextResponse.json({ success: true, expense: shapeExpense(expense) });
  } catch (error) {
    console.error("Failed to record expense:", error);
    return NextResponse.json({ error: "Failed to record expense" }, { status: 500 });
  }
}
