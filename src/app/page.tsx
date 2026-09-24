"use client";

import React, { useEffect, useState } from "react";
import { RevenueAreaChart } from "@/components/charts/RevenueAreaChart";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import {
  Dog,
  CalendarCheck,
  Receipt,
  BellRing,
  ArrowUpRight,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  Stethoscope,
  Plus,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  clinicName: string;
  currency: string;
  kpis: {
    totalAnimals: number;
    newAnimalsThisWeek: number;
    todayAppointmentsCount: number;
    completedToday: number;
    inProgressToday: number;
    unpaidTotal: number;
    unpaidCount: number;
    pendingReminders: number;
  };
  todayAppointments: {
    id: string;
    time: string;
    petName: string;
    species: string;
    owner: string;
    type: string;
    vet: string;
    status: string;
  }[];
  reminders: { id: string; petName: string; owner: string; type: string; dueDate: string }[];
  stockAlerts: { name: string; qty: number; minQty: number; batch: string; status: string }[];
  recentAuditLogs: { id: string; user: string; role: string; action: string; entity: string; time: string; details?: string | null }[];
  weeklyRevenue: { day: string; revenue: number; collected: number }[];
  profitability: {
    netSales: number;
    cogs: number;
    grossProfit: number;
    grossMarginPct: number;
    operatingExpenses: number;
    netOperatingProfit: number;
    operatingMarginPct: number;
  };
}

function formatMoney(n: number, currency: string) {
  return `${currency} ${Math.round(n).toLocaleString()}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError("Could not load live clinic data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-7 pb-12 animate-fade-in">
        <Skeleton className="h-36 w-full rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 w-full rounded-3xl lg:col-span-2" />
          <Skeleton className="h-80 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        {error || "No dashboard data available."}
      </div>
    );
  }

  const kpiStats = [
    {
      title: "Total Animals",
      value: data.kpis.totalAnimals.toLocaleString(),
      subtext: `${data.kpis.newAnimalsThisWeek} added this week`,
      change: `+${data.kpis.newAnimalsThisWeek}`,
      changeType: "positive" as const,
      icon: Dog,
    },
    {
      title: "Today's Appointments",
      value: String(data.kpis.todayAppointmentsCount),
      subtext: `${data.kpis.completedToday} completed today`,
      change: `${data.kpis.inProgressToday} in progress`,
      changeType: "neutral" as const,
      icon: CalendarCheck,
    },
    {
      title: "Unpaid Invoices",
      value: formatMoney(data.kpis.unpaidTotal, data.currency),
      subtext: `${data.kpis.unpaidCount} pending`,
      change: `${data.kpis.unpaidCount} pending`,
      changeType: "warning" as const,
      icon: Receipt,
    },
    {
      title: "Upcoming Reminders",
      value: String(data.kpis.pendingReminders),
      subtext: "Via WhatsApp & SMS",
      change: "Auto-Scheduled",
      changeType: "positive" as const,
      icon: BellRing,
    },
  ];

  const firstName = user?.name?.split(" ").slice(0, 2).join(" ") || "there";

  return (
    <div className="space-y-7 pb-12 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-700 via-brand-800 to-navy-800 p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-brand-900/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-72 h-72 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-3 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {user?.branch || data.clinicName} &bull; Live Operations
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-brand-100/90 mt-1 max-w-xl">
            You have {data.kpis.todayAppointmentsCount} appointment
            {data.kpis.todayAppointmentsCount === 1 ? "" : "s"} scheduled today. Operating margin
            is at {data.profitability.operatingMarginPct}% this month.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Link href="/operations/medical-cases">
            <Button
              variant="outline"
              size="md"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md shadow-none"
              leftIcon={<Stethoscope className="w-4 h-4" />}
            >
              Medical Cases
            </Button>
          </Link>
          <Link href="/operations/pos">
            <Button variant="amber" size="md" leftIcon={<Plus className="w-4 h-4" />}>
              New Sale / POS
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {kpiStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} hoverEffect className="flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {stat.title}
                  </p>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
                    {stat.value}
                  </h3>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-100 dark:border-brand-800/50 flex items-center justify-center text-brand-700 dark:text-brand-300">
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border/60 flex items-center justify-between text-xs">
                <span className="text-slate-400 dark:text-slate-400">{stat.subtext}</span>
                <Badge
                  variant={
                    stat.changeType === "positive"
                      ? "success"
                      : stat.changeType === "warning"
                      ? "warning"
                      : "neutral"
                  }
                  dot
                >
                  {stat.change}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Analytics & Financials Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueAreaChart data={data.weeklyRevenue} />
        </div>

        <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Profitability Summary
                </h3>
                <p className="text-xs text-slate-400">Current Month Performance</p>
              </div>
              <Badge variant="brand" dot>
                Live {data.currency}
              </Badge>
            </div>

            <div className="space-y-4 mt-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Net Sales
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatMoney(data.profitability.netSales, data.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Cost of Goods (COGS)
                </span>
                <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                  - {formatMoney(data.profitability.cogs, data.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200 dark:border-dark-border">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Gross Profit
                </span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatMoney(data.profitability.grossProfit, data.currency)} (
                  {data.profitability.grossMarginPct}%)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Operating Expenses
                </span>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  - {formatMoney(data.profitability.operatingExpenses, data.currency)}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-dark-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Net Operating Profit
                  </span>
                  <span className="text-base font-black text-brand-700 dark:text-brand-300">
                    {formatMoney(data.profitability.netOperatingProfit, data.currency)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-brand-600 to-emerald-500 h-full rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, data.profitability.operatingMarginPct))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
                  <span>Operating Margin</span>
                  <span className="text-brand-700 dark:text-brand-400 font-bold">
                    {data.profitability.operatingMarginPct}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-dark-border flex items-center justify-between">
            <Link
              href="/management/analytics"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400 flex items-center gap-1 group"
            >
              <span>View Full Analytics Report</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Two Columns: Today's Appointments & Low Stock / Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-border">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Today&apos;s Appointments
              </h3>
              <p className="text-xs text-slate-400">
                {data.todayAppointments.length} total appointments scheduled
              </p>
            </div>
            <Link href="/operations/appointments">
              <Button size="sm" variant="outline" rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                View Calendar
              </Button>
            </Link>
          </div>

          {data.todayAppointments.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No appointments scheduled for today yet.
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold border-b border-slate-100 dark:border-dark-border pb-2">
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Patient & Species</th>
                    <th className="pb-3">Owner</th>
                    <th className="pb-3">Reason</th>
                    <th className="pb-3">Veterinarian</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                  {data.todayAppointments.map((apt) => (
                    <tr
                      key={apt.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-dark-hover/50 transition-colors"
                    >
                      <td className="py-3.5 font-bold text-slate-900 dark:text-white">{apt.time}</td>
                      <td className="py-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {apt.petName}
                        </div>
                        <div className="text-[11px] text-slate-400">{apt.species}</div>
                      </td>
                      <td className="py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                        {apt.owner}
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                          {apt.type}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400">{apt.vet}</td>
                      <td className="py-3.5">
                        <Badge
                          variant={
                            apt.status === "COMPLETED"
                              ? "success"
                              : apt.status === "IN_PROGRESS"
                              ? "brand"
                              : apt.status === "CANCELLED" || apt.status === "NO_SHOW"
                              ? "danger"
                              : "neutral"
                          }
                          dot
                        >
                          {apt.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-right">
                        <Link href="/operations/medical-cases">
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2.5">
                            Open Case
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Stock Alerts + Audit Log Live Banner */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Inventory Alerts
                </h4>
              </div>
              <Link
                href="/catalogues/inventory"
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
              >
                Manage Stock
              </Link>
            </div>

            <div className="space-y-3 mt-4">
              {data.stockAlerts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  All stock levels are healthy.
                </p>
              ) : (
                data.stockAlerts.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-dark-border flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Batch: {item.batch} &bull; Min: {item.minQty}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        {item.qty} left
                      </span>
                      <div>
                        <Badge
                          variant={item.status === "CRITICAL_LOW" ? "danger" : "warning"}
                          className="text-[10px] py-0 px-1.5"
                        >
                          {item.status === "CRITICAL_LOW"
                            ? "Critical"
                            : item.status === "NEAR_EXPIRY"
                            ? "Expiring"
                            : "Reorder"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Audit Activity (Live)
                </h4>
              </div>
              <Badge variant="success" dot>
                User ID Fixed
              </Badge>
            </div>

            <div className="space-y-3 mt-4">
              {data.recentAuditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No recent activity yet.</p>
              ) : (
                data.recentAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="text-xs pb-3 border-b border-slate-100 dark:border-dark-border/60 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-brand-700 dark:text-brand-400">{log.user}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{log.time}</span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                      {log.action}
                      {log.details ? `: ${log.details}` : ""}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Entity: {log.entity}</div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border text-center">
              <Link
                href="/management/audit-log"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-1"
              >
                <span>View Full Audit History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
