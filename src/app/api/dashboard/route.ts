import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function timeAgo(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export async function GET(_req: NextRequest) {
  try {
    const clinic = await db.clinic.findFirst();
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 400 });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 6); // last 7 days incl. today

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const oneWeekAgo = new Date(startOfToday);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const soonExpiry = new Date(now);
    soonExpiry.setDate(soonExpiry.getDate() + 30);

    const [
      totalAnimals,
      newAnimalsThisWeek,
      todayAppointmentsRaw,
      unpaidInvoices,
      pendingReminders,
      upcomingReminders,
      lowStockItems,
      recentAuditLogsRaw,
      weekInvoices,
      monthInvoices,
      monthExpenses,
      services,
    ] = await Promise.all([
      db.animal.count(),
      db.animal.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      db.appointment.findMany({
        where: { appointmentDate: { gte: startOfToday, lte: endOfToday } },
        include: {
          animal: { include: { owner: true } },
          veterinarian: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      db.invoice.findMany({
        where: { status: { in: ["UNPAID", "PARTIAL"] } },
        select: { dueAmount: true },
      }),
      db.reminder.count({ where: { status: "PENDING" } }),
      db.reminder.findMany({
        where: { status: "PENDING" },
        include: { animal: true, owner: true },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      db.inventoryItem.findMany({
        where: {
          OR: [
            { expiryDate: { lte: soonExpiry, gte: now } },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: 12,
      }),
      db.auditLog.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.invoice.findMany({
        where: { createdAt: { gte: startOfWeek }, status: { not: "VOIDED" } },
        select: { createdAt: true, total: true, paidAmount: true },
      }),
      db.invoice.findMany({
        where: { createdAt: { gte: startOfMonth }, status: { not: "VOIDED" } },
        include: { items: true },
      }),
      db.expense.findMany({
        where: { createdAt: { gte: startOfMonth } },
        select: { amount: true },
      }),
      db.service.findMany({ select: { id: true, cost: true } }),
    ]);

    // Also pull all low-stock-by-quantity items separately (can't easily OR a field-to-field
    // comparison in the query above across sqlite via Prisma, so filter in JS for that half).
    const allInventory = await db.inventoryItem.findMany({
      select: {
        id: true,
        name: true,
        quantity: true,
        minStockAlert: true,
        batchNumber: true,
        expiryDate: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const stockAlertsMap = new Map<string, any>();
    for (const item of allInventory) {
      if (item.quantity <= item.minStockAlert) {
        stockAlertsMap.set(item.id, {
          name: item.name,
          qty: item.quantity,
          minQty: item.minStockAlert,
          batch: item.batchNumber || "—",
          status: item.quantity <= item.minStockAlert / 2 ? "CRITICAL_LOW" : "LOW_STOCK",
        });
      }
    }
    for (const item of lowStockItems) {
      if (!stockAlertsMap.has(item.id)) {
        stockAlertsMap.set(item.id, {
          name: item.name,
          qty: item.quantity,
          minQty: item.minStockAlert,
          batch: item.batchNumber || "—",
          status: "NEAR_EXPIRY",
        });
      }
    }
    const stockAlerts = Array.from(stockAlertsMap.values()).slice(0, 6);

    // ---- Today appointments shaping ----
    const todayAppointments = todayAppointmentsRaw.map((apt) => ({
      id: apt.id,
      time: apt.appointmentTime,
      petName: apt.animal.name,
      species: apt.animal.species,
      owner: apt.animal.owner.name,
      type: apt.type,
      vet: apt.veterinarian ? apt.veterinarian.name : "Unassigned",
      status: apt.status,
    }));
    const completedToday = todayAppointments.filter((a) => a.status === "COMPLETED").length;
    const inProgressToday = todayAppointments.filter((a) => a.status === "IN_PROGRESS").length;

    // ---- Unpaid invoices ----
    const unpaidTotal = unpaidInvoices.reduce((s, i) => s + i.dueAmount, 0);
    const unpaidCount = unpaidInvoices.length;

    // ---- Reminders ----
    const reminderList = upcomingReminders.map((r) => ({
      id: r.id,
      petName: r.animal.name,
      owner: r.owner.name,
      type: r.reminderType,
      dueDate: r.dueDate.toISOString(),
      channel: r.channel,
    }));

    // ---- Audit logs ----
    const recentAuditLogs = recentAuditLogsRaw.map((log) => ({
      id: log.id,
      user: log.userName,
      role: log.userRole || log.user?.role || "STAFF",
      action: log.action,
      entity: `${log.entity}${log.entityId ? "" : ""}`,
      details: log.details,
      time: timeAgo(log.createdAt),
    }));

    // ---- Weekly revenue chart (last 7 days, invoiced vs collected) ----
    const dayBuckets: { day: string; revenue: number; collected: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfToday);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      dayBuckets.push({ day: label, revenue: 0, collected: 0 });
    }
    for (const inv of weekInvoices) {
      const diffDays = Math.floor((inv.createdAt.getTime() - startOfWeek.getTime()) / 86400000);
      if (diffDays >= 0 && diffDays < 7) {
        dayBuckets[diffDays].revenue += inv.total;
        dayBuckets[diffDays].collected += inv.paidAmount;
      }
    }

    // ---- Month profitability ----
    const svcCostMap = new Map(services.map((s) => [s.id, s.cost]));
    let netSales = 0;
    let cogs = 0;
    for (const inv of monthInvoices) {
      netSales += inv.total;
      for (const item of inv.items) {
        if (item.itemType === "SERVICE" && item.referenceId) {
          cogs += (svcCostMap.get(item.referenceId) || 0) * item.quantity;
        }
      }
    }
    const grossProfit = netSales - cogs;
    const operatingExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const netOperatingProfit = grossProfit - operatingExpenses;
    const grossMarginPct = netSales > 0 ? Math.round((grossProfit / netSales) * 1000) / 10 : 0;
    const operatingMarginPct = netSales > 0 ? Math.round((netOperatingProfit / netSales) * 1000) / 10 : 0;

    return NextResponse.json({
      clinicName: clinic.name,
      currency: clinic.currency,
      kpis: {
        totalAnimals,
        newAnimalsThisWeek,
        todayAppointmentsCount: todayAppointments.length,
        completedToday,
        inProgressToday,
        unpaidTotal,
        unpaidCount,
        pendingReminders,
      },
      todayAppointments,
      reminders: reminderList,
      stockAlerts,
      recentAuditLogs,
      weeklyRevenue: dayBuckets,
      profitability: {
        netSales,
        cogs,
        grossProfit,
        grossMarginPct,
        operatingExpenses,
        netOperatingProfit,
        operatingMarginPct,
      },
    });
  } catch (error) {
    console.error("Failed to load live dashboard data, returning clean fallback:", error);
    const clinic = await db.clinic.findFirst().catch(() => null);
    return NextResponse.json({
      clinicName: clinic?.name || "PetPals Veterinary Clinic",
      currency: clinic?.currency || "EGP",
      kpis: {
        totalAnimals: 0,
        newAnimalsThisWeek: 0,
        todayAppointmentsCount: 0,
        completedToday: 0,
        inProgressToday: 0,
        unpaidTotal: 0,
        unpaidCount: 0,
        pendingReminders: 0,
      },
      todayAppointments: [],
      reminders: [],
      stockAlerts: [],
      recentAuditLogs: [],
      weeklyRevenue: [
        { day: "Sat", revenue: 0, collected: 0 },
        { day: "Sun", revenue: 0, collected: 0 },
        { day: "Mon", revenue: 0, collected: 0 },
        { day: "Tue", revenue: 0, collected: 0 },
        { day: "Wed", revenue: 0, collected: 0 },
        { day: "Thu", revenue: 0, collected: 0 },
        { day: "Fri", revenue: 0, collected: 0 },
      ],
      profitability: {
        netSales: 0,
        cogs: 0,
        grossProfit: 0,
        grossMarginPct: 0,
        operatingExpenses: 0,
        netOperatingProfit: 0,
        operatingMarginPct: 0,
      },
    });
  }
}
