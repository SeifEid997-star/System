import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
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
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, description, amount, method, branchId } = body;
    const cleanDescription = cleanText(description, 240);

    if (!cleanDescription || !finiteAmount(amount) || Number(amount) <= 0) {
      return NextResponse.json({ error: "A description and a positive valid amount are required" }, { status: 400 });
    }

    const clinic = await db.clinic.findFirst();
    if (!clinic) return NextResponse.json({ error: "Clinic not found" }, { status: 400 });

    // Default to the clinic's first branch if none supplied, matching the page's
    // current single-branch assumption.
    let resolvedBranchId: string | null = branchId || null;
    if (!resolvedBranchId) {
      const firstBranch = await db.branch.findFirst({ where: { clinicId: clinic.id } });
      resolvedBranchId = firstBranch?.id || null;
    }
    if (resolvedBranchId && !(await db.branch.findFirst({ where: { id: resolvedBranchId, clinicId: clinic.id } }))) {
      return NextResponse.json({ error: "Branch not found in this clinic" }, { status: 400 });
    }

    const expense = await db.expense.create({
      data: {
        clinicId: clinic.id,
        branchId: resolvedBranchId,
        category: category || "Rent & Facilities",
        description: cleanDescription,
        amount: Number(amount),
        method: method || "Cash",
        recordedBy: "Active Accountant",
      },
      include: { branch: true },
    });

    await logAuditForRequest(req, {
      clinicId: clinic.id,
      userId: "accounts-desk",
      userName: "Active Accountant",
      userRole: "ACCOUNTANT",
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
