"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Receipt,
  Stethoscope,
  Calendar,
  Home,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface PendingItem {
  id: string;
  source: "MEDICAL_CASE" | "APPOINTMENT" | "BOARDING" | "OVERDUE_INVOICE";
  description: string;
  client: string;
  phone: string;
  pet: string;
  date: string;
  estimatedAmount: number;
}

export default function PendingPaymentsPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/pending-payments")
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleWaive = async (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "VOIDED", notes: "Waived from Pending Payments queue" }),
    });
  };

  const totalUnbilled = items.reduce((acc, it) => acc + it.estimatedAmount, 0);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Pending Payments (المدفوعات المعلقة وغير المفوترة)
            </h1>
            <Badge variant="danger" dot>
              {items.length} Items Unbilled
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Invoices left partially paid or unpaid, requiring follow-up or settlement.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-600/30 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Total Unbilled Revenue</div>
            <div className="text-base font-extrabold text-amber-600 dark:text-amber-400">
              {totalUnbilled.toLocaleString()} EGP
            </div>
          </div>
        </div>
      </div>

      {/* Pending Items Table */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-dark-border">
                <th className="py-3.5 px-5">Source &amp; Description</th>
                <th className="py-3.5 px-4">Client &amp; Phone</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Est. Amount</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-3 px-5">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    All completed services have been invoiced! Zero revenue pending.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-dark-hover/40 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        {item.source === "MEDICAL_CASE" ? (
                          <Stethoscope className="w-4 h-4 text-brand-600 flex-shrink-0" />
                        ) : item.source === "BOARDING" ? (
                          <Home className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        ) : (
                          <Calendar className="w-4 h-4 text-sky-500 flex-shrink-0" />
                        )}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.description}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{item.client}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.phone}</div>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {item.pet}
                    </td>
                    <td className="py-4 px-4 text-slate-400">{formatDate(item.date)}</td>
                    <td className="py-4 px-4 text-right font-black text-slate-900 dark:text-white">
                      {item.estimatedAmount.toLocaleString()} EGP
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href="/operations/pos">
                          <Button size="sm" variant="amber" className="h-7 text-xs px-2.5" leftIcon={<Receipt className="w-3.5 h-3.5" />}>
                            Bill Now
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleWaive(item.id)}
                          className="h-7 text-xs px-2 text-slate-400 hover:text-rose-500"
                          title="Waive / Dismiss"
                        >
                          Waive
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
