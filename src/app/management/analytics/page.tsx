"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  DollarSign,
  Calendar,
  Package,
  Stethoscope,
  Download,
  Printer,
  X,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";

interface AnalyticsReport {
  periodLabel: string;
  generatedAt: string;
  profitability: {
    grossRevenue: number;
    revenueGrowthPct: number | null;
    cogs: number;
    grossProfit: number;
    grossMarginPct: number;
    opex: number;
    netOperatingProfit: number;
    operatingMarginPct: number;
    revenueByDepartment: { dept: string; amount: number; pct: number }[];
  };
  appointments: {
    totalBooked: number;
    completed: number;
    cancelled: number;
    noShow: number;
    fulfillmentPct: number;
    cancellationPct: number;
  };
  inventory: {
    topMoving: { name: string; qty: number }[];
    activeSkuCount: number;
    turnoverRatio: number;
  };
  clinical: {
    topDiagnoses: { diagnosis: string; cases: number; pct: number }[];
    totalDiagnosedCases: number;
  };
}

export default function AnalyticsPage() {
  const [activeReport, setActiveReport] = useState<
    "profitability" | "appointments" | "inventory" | "clinical"
  >("profitability");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [exportedNotice, setExportedNotice] = useState(false);
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/analytics?days=30")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleExportCSV = () => {
    if (!report) return;
    const { profitability: p, appointments: a, inventory: inv, clinical: c } = report;

    const rows: string[] = ["Report,Metric,Value,Period"];
    rows.push(`Profitability,Gross Revenue,${p.grossRevenue.toFixed(0)} EGP,${report.periodLabel}`);
    rows.push(`Profitability,COGS,${p.cogs.toFixed(0)} EGP,${report.periodLabel}`);
    rows.push(`Profitability,Gross Profit,${p.grossProfit.toFixed(0)} EGP,${report.periodLabel}`);
    rows.push(`Profitability,Gross Margin,${p.grossMarginPct}%,${report.periodLabel}`);
    rows.push(`Profitability,Operating Expenses,${p.opex.toFixed(0)} EGP,${report.periodLabel}`);
    rows.push(`Profitability,Net Operating Profit,${p.netOperatingProfit.toFixed(0)} EGP,${report.periodLabel}`);
    rows.push(`Appointments,Total Booked,${a.totalBooked},${report.periodLabel}`);
    rows.push(`Appointments,Completed,${a.completed},${report.periodLabel}`);
    rows.push(`Appointments,Cancelled,${a.cancelled},${report.periodLabel}`);
    rows.push(`Appointments,No-Shows,${a.noShow},${report.periodLabel}`);
    inv.topMoving.forEach((item, i) => {
      rows.push(`Inventory,Top Item #${i + 1},${item.name} (${item.qty} units),${report.periodLabel}`);
    });
    c.topDiagnoses.forEach((d, i) => {
      rows.push(`Clinical,Top Diagnosis #${i + 1},${d.diagnosis} (${d.cases} Cases),${report.periodLabel}`);
    });

    const csvContent = rows.join("\n") + "\n";
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = `Qlinic_Executive_BI_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(el);
    el.click();
    setTimeout(() => {
      document.body.removeChild(el);
      URL.revokeObjectURL(url);
    }, 200);

    setExportedNotice(true);
    setTimeout(() => setExportedNotice(false), 4000);
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (loading || !report) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const { profitability: p, appointments: a, inventory: inv, clinical: c } = report;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Toast Notification */}
      {exportedNotice && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <div className="text-xs">
            <p className="font-bold">تم تصدير تقرير BI بنجاح!</p>
            <p className="text-emerald-100 text-[11px]">Qlinic_Executive_BI_Report.csv downloaded.</p>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Executive Analytics &amp; Clinical BI (التقارير الإدارية والتحليلية)
            </h1>
            <Badge variant="brand" dot>Live Intelligence</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            In-depth analytics for Clinic Profitability, Appointment flow, Inventory turnover, and Medical procedures — {report.periodLabel}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsReportModalOpen(true)}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Full BI Report (PDF / Print)
          </Button>
        </div>
      </div>

      {/* 4 Report Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: "profitability", label: "1. Profitability (الربحية)", icon: DollarSign },
          { id: "appointments", label: "2. Appointments (المواعيد)", icon: Calendar },
          { id: "inventory", label: "3. Inventory (المخزون)", icon: Package },
          { id: "clinical", label: "4. Clinical (الإكلينيكي)", icon: Stethoscope },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as any)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                isActive
                  ? "bg-brand-50 border-brand-500 shadow-sm dark:bg-brand-950/60 dark:border-brand-500 font-bold text-brand-800 dark:text-brand-300"
                  : "bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4 text-brand-600 shrink-0" />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* REPORT 1: PROFITABILITY */}
      {activeReport === "profitability" && (
        <div className="space-y-6 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card hoverEffect>
              <span className="text-xs text-slate-400 font-medium">Gross Revenue</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {formatCurrency(p.grossRevenue)}
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                {p.revenueGrowthPct === null
                  ? "No data for prior period"
                  : `${p.revenueGrowthPct >= 0 ? "+" : ""}${p.revenueGrowthPct}% vs prior period`}
              </p>
            </Card>

            <Card hoverEffect>
              <span className="text-xs text-slate-400 font-medium">Cost of Goods (COGS)</span>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {formatCurrency(p.cogs)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Medications, vaccines &amp; service costs</p>
            </Card>

            <Card hoverEffect>
              <span className="text-xs text-slate-400 font-medium">Gross Profit</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(p.grossProfit)}
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">{p.grossMarginPct}% Gross Margin</p>
            </Card>

            <Card hoverEffect>
              <span className="text-xs text-slate-400 font-medium">Net Operating Profit</span>
              <div className="text-2xl font-black text-brand-700 dark:text-brand-300 mt-1">
                {formatCurrency(p.netOperatingProfit)}
              </div>
              <p className="text-[11px] text-brand-600 font-semibold mt-1">{p.operatingMarginPct}% Operating Margin</p>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              Revenue Breakdown by Department
            </h4>
            {p.revenueByDepartment.length === 0 ? (
              <p className="text-xs text-slate-400">No invoiced revenue in this period yet.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {p.revenueByDepartment.map((row) => (
                  <div
                    key={row.dept}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-dark-border"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{row.dept}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(row.amount)}
                      </span>
                      <Badge variant="brand">{row.pct}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* REPORT 2: APPOINTMENTS */}
      {activeReport === "appointments" && (
        <div className="space-y-6 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card hoverEffect>
              <span className="text-xs text-slate-400 font-medium">Total Booked</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{a.totalBooked}</div>
              <p className="text-[11px] text-slate-400 mt-1">{report.periodLabel}</p>
            </Card>
            <Card hoverEffect>
              <span className="text-xs text-slate-400 font-medium">Completed</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{a.completed}</div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">{a.fulfillmentPct}% Fulfillment rate</p>
            </Card>
            <Card hoverEffect>
              <span className="text-xs text-slate-400 font-medium">Cancelled</span>
              <div className="text-2xl font-black text-amber-500 mt-1">{a.cancelled}</div>
              <p className="text-[11px] text-slate-400 mt-1">Patient/clinic cancelled</p>
            </Card>
            <Card hoverEffect>
              <span className="text-xs text-slate-400 font-medium">No-Shows</span>
              <div className="text-2xl font-black text-rose-500 mt-1">{a.noShow}</div>
              <p className="text-[11px] text-rose-500 font-semibold mt-1">{a.cancellationPct}% Cancellation + no-show rate</p>
            </Card>
          </div>
        </div>
      )}

      {/* REPORT 3: INVENTORY */}
      {activeReport === "inventory" && (
        <div className="space-y-6 animate-slide-up">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Top Fast-Moving Medical Stock
              </h4>
              <span className="text-[11px] text-slate-400">
                {inv.activeSkuCount} active SKUs • {inv.turnoverRatio}x turnover
              </span>
            </div>
            {inv.topMoving.length === 0 ? (
              <p className="text-xs text-slate-400">No inventory items sold through invoices in this period yet.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {inv.topMoving.map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-dark-border"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{row.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 dark:text-white">{row.qty} units sold</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* REPORT 4: CLINICAL */}
      {activeReport === "clinical" && (
        <div className="space-y-6 animate-slide-up">
          <Card className="p-6">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              Top Clinical Diagnoses ({c.totalDiagnosedCases} diagnosed cases)
            </h4>
            {c.topDiagnoses.length === 0 ? (
              <p className="text-xs text-slate-400">No medical cases with a recorded diagnosis in this period yet.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {c.topDiagnoses.map((row) => (
                  <div
                    key={row.diagnosis}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-dark-border"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{row.diagnosis}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 dark:text-white">{row.cases} Cases</span>
                      <Badge variant="brand">{row.pct}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* EXECUTIVE BI REPORT MODAL (PRINT & EXPORT PREVIEW) */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-600/20">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Executive BI &amp; Clinical Intelligence Report
                  </h2>
                  <p className="text-xs text-slate-500">
                    {report.periodLabel} • Generated: {new Date(report.generatedAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Report Sheet */}
            <div className="space-y-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-dark-border print:bg-white print:p-0 print:border-none">
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white dark:bg-dark-card rounded-xl border border-slate-100 dark:border-dark-border">
                  <span className="text-[11px] text-slate-400 font-medium">Gross Revenue</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {formatCurrency(p.grossRevenue)}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {p.revenueGrowthPct === null ? "—" : `${p.revenueGrowthPct >= 0 ? "+" : ""}${p.revenueGrowthPct}%`}
                  </span>
                </div>
                <div className="p-4 bg-white dark:bg-dark-card rounded-xl border border-slate-100 dark:border-dark-border">
                  <span className="text-[11px] text-slate-400 font-medium">Gross Margin</span>
                  <div className="text-lg font-black text-emerald-600 mt-1">{p.grossMarginPct}%</div>
                </div>
                <div className="p-4 bg-white dark:bg-dark-card rounded-xl border border-slate-100 dark:border-dark-border">
                  <span className="text-[11px] text-slate-400 font-medium">Completed Visits</span>
                  <div className="text-lg font-black text-brand-600 mt-1">{a.completed}</div>
                  <span className="text-[10px] text-emerald-600 font-bold">{a.fulfillmentPct}% Attendance</span>
                </div>
                <div className="p-4 bg-white dark:bg-dark-card rounded-xl border border-slate-100 dark:border-dark-border">
                  <span className="text-[11px] text-slate-400 font-medium">Inventory Turnover</span>
                  <div className="text-lg font-black text-indigo-600 mt-1">{inv.turnoverRatio}x</div>
                  <span className="text-[10px] text-slate-400">{inv.activeSkuCount} SKUs active</span>
                </div>
              </div>

              {/* Breakdown Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-dark-card rounded-xl border border-slate-100 dark:border-dark-border">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Key Financial Performance
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-dark-border">
                      <span className="text-slate-500">Gross Clinical Invoicing</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{formatCurrency(p.grossRevenue)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-dark-border">
                      <span className="text-slate-500">Cost of Goods (COGS)</span>
                      <span className="font-bold text-rose-600">-{formatCurrency(p.cogs)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-dark-border">
                      <span className="text-slate-500">Operating Expenses (OPEX)</span>
                      <span className="font-bold text-amber-600">-{formatCurrency(p.opex)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 font-bold text-emerald-600">
                      <span>Net Operating Income</span>
                      <span>{formatCurrency(p.netOperatingProfit)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-dark-card rounded-xl border border-slate-100 dark:border-dark-border">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Top Medical Diagnoses &amp; Procedures
                  </h4>
                  {c.topDiagnoses.length === 0 ? (
                    <p className="text-[11px] text-slate-400">No diagnosed cases in this period yet.</p>
                  ) : (
                    <div className="space-y-1.5 text-xs">
                      {c.topDiagnoses.slice(0, 4).map((row) => (
                        <div key={row.diagnosis} className="flex justify-between py-1 border-b border-slate-100 dark:border-dark-border">
                          <span className="text-slate-500">{row.diagnosis}</span>
                          <span className="font-bold">{row.cases} Cases ({row.pct}%)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-400">
                Ready for internal audit and shareholder presentation.
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
                >
                  Export CSV Data
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePrintReport}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Print / Save as PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
