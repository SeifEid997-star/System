"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Trash2,
  ShieldAlert,
  Database,
  ArrowRight,
  Sparkles,
  Building2,
  Check,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

export default function ResetDatabasePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code !== "RESET-PETPALS") {
      setError("Please type the exact confirmation phrase: RESET-PETPALS");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/reset-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationCode: code }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Failed to execute reset.");
      }
    } catch (err: any) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Factory Reset &amp; Clinic Delivery Clean Slate (تصفير قاعدة البيانات للتسليم)
            </h1>
            <Badge variant="danger" dot>Owner Restricted</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Zero-out demo records, test invoices, and simulated patients to hand over a 100% clean database to the clinic.
          </p>
        </div>
      </div>

      {/* Success Completion View */}
      {result ? (
        <Card className="p-8 border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-center space-y-6 animate-slide-up">
          <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-600/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              تم تصفير المنظومة بنجاح وجاهزة للتسليم للعيادة!
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              All demo patients, invoices, boarding records, and appointments have been purged. Clinic branches, staff credentials, and catalog items are preserved.
            </p>
          </div>

          {/* Purged Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border">
              <span className="text-slate-400 block text-[10px]">Purged Patients</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                {result.deleted.animals} Animals
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border">
              <span className="text-slate-400 block text-[10px]">Purged Invoices</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                {result.deleted.invoices} Invoices
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border">
              <span className="text-slate-400 block text-[10px]">Purged Cases</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                {result.deleted.medicalCases} Medical Cases
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/operations/reception">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to Reception (Ready for First Patient)
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        /* Reset Confirmation Form */
        <div className="space-y-6">
          {/* Warning Banner */}
          <Card className="p-6 border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                  Critical Warning: Permanent Production Reset
                </h3>
                <p className="text-xs text-rose-800/80 dark:text-rose-300/80 leading-relaxed">
                  This action permanently truncates all clinical operational data in `prisma/dev.db`. Use this exclusively before handing off the system to a new clinic customer to ensure they receive a pristine, confidential, and empty database.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-rose-100 dark:border-rose-900/30 text-xs">
              <div className="space-y-1 text-rose-900 dark:text-rose-200">
                <span className="font-bold block text-[11px]">Tables that WILL be deleted (0 rows):</span>
                <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                  <li>Client &amp; Owner accounts (`Owner`)</li>
                  <li>Animal patient files (`Animal`)</li>
                  <li>Invoices, receipts, payments (`Invoice`)</li>
                  <li>Medical cases, soap notes (`MedicalCase`)</li>
                  <li>Appointments &amp; Boarding reservations</li>
                </ul>
              </div>

              <div className="space-y-1 text-emerald-900 dark:text-emerald-200">
                <span className="font-bold block text-[11px]">Configurations that WILL be PRESERVED:</span>
                <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                  <li>Clinic Identity &amp; Tax settings (`Clinic`)</li>
                  <li>Clinic Branches (`Branch`)</li>
                  <li>Staff accounts &amp; RBAC credentials (`User`)</li>
                  <li>Services &amp; Pricing catalog (`Service`)</li>
                  <li>Medications &amp; Vaccines inventory template</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Interactive Form */}
          <Card className="p-6 sm:p-8 space-y-6">
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                  To confirm, type <span className="font-mono text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">RESET-PETPALS</span> in the box below:
                </label>
                <input
                  type="text"
                  required
                  placeholder="RESET-PETPALS"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError(null);
                  }}
                  className="w-full text-sm font-mono font-bold tracking-wider rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-shake">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-dark-border">
                <Link href="/settings/clinic">
                  <Button variant="outline" size="sm">
                    Cancel &amp; Return
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={loading || code !== "RESET-PETPALS"}
                  className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20"
                  leftIcon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                >
                  {loading ? "Zeroing Out Database..." : "Execute Factory Reset (تصفير الداتابيز للتسليم)"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
