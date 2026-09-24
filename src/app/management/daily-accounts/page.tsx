"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  FileSpreadsheet,
  Calendar,
  DollarSign,
  TrendingUp,
  Download,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";

interface DailyRow {
  date: string;
  invoices: number;
  invoiced: number;
  collected: number;
  due: number;
  efficiency: number;
}

export default function DailyAccountsPage() {
  const [dailyData, setDailyData] = useState<DailyRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportedNotice, setExportedNotice] = useState(false);

  const loadDailyAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts/daily?days=14");
      const data = await res.json();
      setDailyData(data.dailyData || []);
    } catch (err) {
      console.error("Failed to load daily accounts:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDailyAccounts();
  }, [loadDailyAccounts]);

  const totalInvoiced = dailyData.reduce((acc, it) => acc + it.invoiced, 0);
  const totalCollected = dailyData.reduce((acc, it) => acc + it.collected, 0);
  const totalDue = dailyData.reduce((acc, it) => acc + it.due, 0);

  const handleExportExcel = () => {
    try {
      const headers = "Date,Invoices Count,Invoiced (EGP),Collected (EGP),Remaining Due (EGP),Collection Rate (%)\n";
      const rows = dailyData
        .map(
          (d) =>
            `"${d.date}",${d.invoices},${d.invoiced},${d.collected},${d.due},${d.efficiency}%`
        )
        .join("\n");

      const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PetPals_Daily_Accounts_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 200);

      setExportedNotice(true);
      setTimeout(() => setExportedNotice(false), 5000);
    } catch (e) {
      console.error(e);
      alert("Export failed. Please check browser permissions.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Toast Notification */}
      {exportedNotice && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <div className="text-xs">
            <p className="font-bold">تم تصدير ملف الإكسيل بنجاح!</p>
            <p className="text-emerald-100 text-[11px]">PetPals_Daily_Accounts.csv has been downloaded.</p>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Daily Accounts &amp; Revenue Ledger (الحسابات والإيرادات اليومية)
            </h1>
            <Badge variant="brand" dot>Live Ledger</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Historical day-by-day revenue reconciliation: Total invoiced, cash collected, remaining balance, and efficiency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            leftIcon={<Download className="w-4 h-4" />}
            className="hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 font-semibold"
          >
            Export Accounts (Excel)
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card hoverEffect>
          <span className="text-xs text-slate-400 font-medium">Total Invoiced (مفوتر)</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {totalInvoiced.toLocaleString()} <span className="text-xs font-normal">EGP</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Gross clinical sales</p>
        </Card>

        <Card hoverEffect>
          <span className="text-xs text-slate-400 font-medium">Total Collected (محصّل فعلي)</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {totalCollected.toLocaleString()} <span className="text-xs font-normal">EGP</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Cash, Cards &amp; InstaPay in hand</p>
        </Card>

        <Card hoverEffect>
          <span className="text-xs text-slate-400 font-medium">Accounts Receivable (متبقي آجل)</span>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {totalDue.toLocaleString()} <span className="text-xs font-normal">EGP</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Uncollected client balances</p>
        </Card>
      </div>

      {/* Daily Accounts Table */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : dailyData.length === 0 ? (
        <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border p-10 text-center text-xs text-slate-400">
          No invoices recorded yet in this period.
        </div>
      ) : (
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-dark-border">
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-4 text-center">Invoices Count</th>
                <th className="py-3.5 px-4 text-right">Invoiced (مفوتر)</th>
                <th className="py-3.5 px-4 text-right">Collected (محصّل)</th>
                <th className="py-3.5 px-4 text-right">Remaining Due (متبقي)</th>
                <th className="py-3.5 px-5 text-center">Collection Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {dailyData.map((d) => (
                <tr key={d.date} className="hover:bg-slate-50/60 dark:hover:bg-dark-hover/40 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">
                    {d.date}
                  </td>
                  <td className="py-4 px-4 text-center font-semibold">
                    {d.invoices}
                  </td>
                  <td className="py-4 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                    {d.invoiced.toLocaleString()} EGP
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {d.collected.toLocaleString()} EGP
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                    {d.due > 0 ? `${d.due.toLocaleString()} EGP` : "-"}
                  </td>
                  <td className="py-4 px-5 text-center">
                    <Badge
                      variant={d.efficiency === 100 ? "success" : "warning"}
                      className="text-[10px]"
                    >
                      {d.efficiency}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
