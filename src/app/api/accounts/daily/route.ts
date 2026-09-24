import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Aggregates existing Invoice rows into a day-by-day ledger. No new schema
// needed — everything here is derived from Invoice.total / paidAmount / dueAmount.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Math.min(Number(searchParams.get("days")) || 14, 90);

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const invoices = await db.invoice.findMany({
      where: { createdAt: { gte: since }, status: { not: "VOIDED" } },
      select: { createdAt: true, total: true, paidAmount: true, dueAmount: true },
    });

    const byDay = new Map<
      string,
      { invoices: number; invoiced: number; collected: number; due: number }
    >();

    for (const inv of invoices) {
      const key = inv.createdAt.toISOString().slice(0, 10);
      const bucket = byDay.get(key) || { invoices: 0, invoiced: 0, collected: 0, due: 0 };
      bucket.invoices += 1;
      bucket.invoiced += inv.total;
      bucket.collected += inv.paidAmount;
      bucket.due += inv.dueAmount;
      byDay.set(key, bucket);
    }

    const todayKey = new Date().toISOString().slice(0, 10);
    const yesterdayKey = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const dailyData = Array.from(byDay.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, d]) => {
        const label =
          key === todayKey
            ? `Today (${formatDate(key)})`
            : key === yesterdayKey
            ? `Yesterday (${formatDate(key)})`
            : formatDate(key);
        const efficiency = d.invoiced > 0 ? Math.round((d.collected / d.invoiced) * 1000) / 10 : 100;
        return {
          date: label,
          invoices: d.invoices,
          invoiced: d.invoiced,
          collected: d.collected,
          due: d.due,
          efficiency,
        };
      });

    return NextResponse.json({ dailyData });
  } catch (error) {
    console.error("Failed to build daily accounts ledger:", error);
    return NextResponse.json({ error: "Failed to build daily accounts ledger" }, { status: 500 });
  }
}

function formatDate(isoDay: string) {
  const d = new Date(isoDay + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
