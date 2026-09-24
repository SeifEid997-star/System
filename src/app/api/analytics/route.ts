import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Executive BI aggregation. Everything here is derived from existing rows
// (Invoice/InvoiceItem, Expense, Appointment, MedicalCase, InventoryItem,
// Service) — no new model needed, same approach as /api/accounts/daily.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Math.min(Number(searchParams.get("days")) || 30, 365);
    const periodLabel = `Last ${days} Days`;

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const prevSince = new Date(since);
    prevSince.setDate(prevSince.getDate() - days);

    const [invoices, prevInvoices, expenses, appointments, medicalCases, services] =
      await Promise.all([
        db.invoice.findMany({
          where: { createdAt: { gte: since }, status: { not: "VOIDED" } },
          include: { items: true },
        }),
        db.invoice.findMany({
          where: { createdAt: { gte: prevSince, lt: since }, status: { not: "VOIDED" } },
          select: { total: true },
        }),
        db.expense.findMany({
          where: { createdAt: { gte: since } },
          select: { amount: true, category: true },
        }),
        db.appointment.findMany({
          where: { createdAt: { gte: since } },
          select: { status: true },
        }),
        db.medicalCase.findMany({
          where: { createdAt: { gte: since } },
          select: { diagnosis: true },
        }),
        db.service.findMany({ include: { category: true } }),
      ]);

    const inventoryItems = await db.inventoryItem.findMany({
      select: { id: true, name: true, unitCost: true },
    });
    const invByIdMap = new Map(inventoryItems.map((i) => [i.id, i]));
    const svcByIdMap = new Map(services.map((s) => [s.id, s]));

    // ---- Profitability ----
    const grossRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const prevGrossRevenue = prevInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const revenueGrowthPct =
      prevGrossRevenue > 0
        ? Math.round(((grossRevenue - prevGrossRevenue) / prevGrossRevenue) * 1000) / 10
        : null;

    let cogs = 0;
    const deptTotals = new Map<string, number>();
    const inventoryMoved = new Map<string, { name: string; qty: number }>();

    for (const inv of invoices) {
      for (const item of inv.items) {
        if (item.itemType === "INVENTORY" && item.referenceId) {
          const invItem = invByIdMap.get(item.referenceId);
          if (invItem) {
            cogs += invItem.unitCost * item.quantity;
            const bucket = inventoryMoved.get(invItem.id) || { name: invItem.name, qty: 0 };
            bucket.qty += item.quantity;
            inventoryMoved.set(invItem.id, bucket);
          }
          const dept = "Pharmacy & Retail Sales";
          deptTotals.set(dept, (deptTotals.get(dept) || 0) + item.total);
        } else if (item.itemType === "SERVICE" && item.referenceId) {
          const svc = svcByIdMap.get(item.referenceId);
          if (svc) cogs += svc.cost * item.quantity;
          const dept = svc?.category?.name || "Other Services";
          deptTotals.set(dept, (deptTotals.get(dept) || 0) + item.total);
        } else {
          const dept = "Other Services";
          deptTotals.set(dept, (deptTotals.get(dept) || 0) + item.total);
        }
      }
    }

    const opex = expenses.reduce((sum, e) => sum + e.amount, 0);
    const grossProfit = grossRevenue - cogs;
    const grossMarginPct = grossRevenue > 0 ? Math.round((grossProfit / grossRevenue) * 1000) / 10 : 0;
    const netOperatingProfit = grossProfit - opex;
    const operatingMarginPct =
      grossRevenue > 0 ? Math.round((netOperatingProfit / grossRevenue) * 1000) / 10 : 0;

    const revenueByDepartment = Array.from(deptTotals.entries())
      .map(([dept, amount]) => ({
        dept,
        amount,
        pct: grossRevenue > 0 ? Math.round((amount / grossRevenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // ---- Appointments ----
    const totalBooked = appointments.length;
    const statusCount = (s: string) => appointments.filter((a) => a.status === s).length;
    const completed = statusCount("COMPLETED");
    const cancelled = statusCount("CANCELLED");
    const noShow = statusCount("NO_SHOW");
    const fulfillmentPct = totalBooked > 0 ? Math.round((completed / totalBooked) * 1000) / 10 : 0;
    const cancellationPct =
      totalBooked > 0 ? Math.round(((cancelled + noShow) / totalBooked) * 1000) / 10 : 0;

    // ---- Inventory turnover ----
    const topMovingInventory = Array.from(inventoryMoved.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
    const activeSkuCount = inventoryItems.length;
    const totalUnitsSold = Array.from(inventoryMoved.values()).reduce((sum, i) => sum + i.qty, 0);
    const avgStockPerSku =
      activeSkuCount > 0
        ? await db.inventoryItem
            .aggregate({ _avg: { quantity: true } })
            .then((r) => r._avg.quantity || 0)
        : 0;
    const turnoverRatio =
      avgStockPerSku > 0 && activeSkuCount > 0
        ? Math.round((totalUnitsSold / (avgStockPerSku * activeSkuCount)) * 10) / 10
        : 0;

    // ---- Clinical ----
    const diagnosedCases = medicalCases.filter((c) => c.diagnosis && c.diagnosis.trim());
    const diagnosisCount = new Map<string, number>();
    for (const c of diagnosedCases) {
      const key = c.diagnosis!.trim();
      diagnosisCount.set(key, (diagnosisCount.get(key) || 0) + 1);
    }
    const topDiagnoses = Array.from(diagnosisCount.entries())
      .map(([diagnosis, cases]) => ({
        diagnosis,
        cases,
        pct:
          diagnosedCases.length > 0
            ? Math.round((cases / diagnosedCases.length) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 8);

    return NextResponse.json({
      periodLabel,
      generatedAt: new Date().toISOString(),
      profitability: {
        grossRevenue,
        revenueGrowthPct,
        cogs,
        grossProfit,
        grossMarginPct,
        opex,
        netOperatingProfit,
        operatingMarginPct,
        revenueByDepartment,
      },
      appointments: {
        totalBooked,
        completed,
        cancelled,
        noShow,
        fulfillmentPct,
        cancellationPct,
      },
      inventory: {
        topMoving: topMovingInventory,
        activeSkuCount,
        turnoverRatio,
      },
      clinical: {
        topDiagnoses,
        totalDiagnosedCases: diagnosedCases.length,
      },
    });
  } catch (error) {
    console.error("Failed to build analytics report:", error);
    return NextResponse.json({ error: "Failed to build analytics report" }, { status: 500 });
  }
}
