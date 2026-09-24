"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  CreditCard,
  Plus,
  Search,
  Building,
  Zap,
  Coffee,
  Wrench,
  Megaphone,
  Receipt,
  Calendar,
  DollarSign,
  X,
} from "lucide-react";

interface ExpenseVM {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  branch: string;
  recordedBy: string;
  method: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseVM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("Rent & Facilities");
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newMethod, setNewMethod] = useState("Cash");

  const loadExpenses = useCallback(async () => {
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      setExpenses(data.expenses || []);
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const totalMonthlyExpenses = expenses.reduce((acc, it) => acc + it.amount, 0);
  const rentAndPower = expenses
    .filter((e) => e.category === "Rent & Facilities" || e.category === "Utilities & Power")
    .reduce((acc, it) => acc + it.amount, 0);
  const maintenanceAndHospitality = expenses
    .filter((e) => e.category === "Maintenance" || e.category === "Staff Hospitality")
    .reduce((acc, it) => acc + it.amount, 0);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !newAmount || isSaving) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newCategory,
          description: newDesc,
          amount: parseFloat(newAmount) || 0,
          method: newMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record expense");

      setExpenses((prev) => [data.expense, ...prev]);
      setNewDesc("");
      setNewAmount("");
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("تعذر تسجيل المصروف، حاول مرة أخرى.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Operating Expenses (المصاريف التشغيلية فقط)
            </h1>
            <Badge variant="brand" dot>Strictly OPEX</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Clinic rent, electricity, maintenance, marketing, and staff meals (kept separate from wholesale purchases &amp; COGS).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Record Operating Expense
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card hoverEffect>
          <span className="text-xs text-slate-400 font-medium">Total Monthly OPEX</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {totalMonthlyExpenses.toLocaleString()} <span className="text-xs font-normal">EGP</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">All recorded expenses to date</p>
        </Card>

        <Card hoverEffect>
          <span className="text-xs text-slate-400 font-medium">Facility Rent &amp; Power</span>
          <div className="text-2xl font-extrabold text-brand-700 dark:text-brand-400 mt-1">
            {rentAndPower.toLocaleString()} <span className="text-xs font-normal">EGP</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Fixed operational costs</p>
        </Card>

        <Card hoverEffect>
          <span className="text-xs text-slate-400 font-medium">Maintenance &amp; Daily Hospitality</span>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {maintenanceAndHospitality.toLocaleString()} <span className="text-xs font-normal">EGP</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Variable clinic expenses</p>
        </Card>
      </div>

      {/* Expenses Table */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : (
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-dark-border">
                <th className="py-3.5 px-5">Expense Category</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Branch</th>
                <th className="py-3.5 px-4">Recorded By</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-5 text-right">Amount (EGP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/60 dark:hover:bg-dark-hover/40 transition-colors">
                  <td className="py-4 px-5">
                    <Badge variant="neutral" className="text-[10px]">
                      {exp.category}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                    {exp.description}
                  </td>
                  <td className="py-4 px-4 text-slate-500">
                    {new Date(exp.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                  </td>
                  <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                    {exp.branch}
                  </td>
                  <td className="py-4 px-4 text-slate-500">
                    {exp.recordedBy}
                  </td>
                  <td className="py-4 px-4 font-mono uppercase text-[10px]">
                    {exp.method}
                  </td>
                  <td className="py-4 px-5 text-right font-black text-rose-600 dark:text-rose-400">
                    - {exp.amount.toLocaleString()} EGP
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* RECORD EXPENSE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Record Operating Expense
                </h3>
                <p className="text-xs text-slate-400">OPEX only &bull; Separate from wholesale purchases</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Category *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                >
                  <option value="Rent & Facilities">Rent &amp; Facilities</option>
                  <option value="Utilities & Power">Utilities &amp; Power</option>
                  <option value="Maintenance">Maintenance &amp; Repairs</option>
                  <option value="Staff Hospitality">Staff Meals &amp; Hospitality</option>
                  <option value="Marketing & Ads">Marketing &amp; Social Ads</option>
                  <option value="Software & Tech">Software &amp; IT Subscriptions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Justification *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clinic Air Condition Service"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount in EGP *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1500"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border font-bold text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="InstaPay">InstaPay</option>
                    <option value="Vodafone Cash">Vodafone Cash</option>
                    <option value="Bank Wire">Bank Wire</option>
                  </select>
                </div>
              </div>

              <Button type="submit" size="md" variant="primary" className="w-full font-bold shadow-md shadow-brand-700/20" disabled={isSaving}>
                {isSaving ? "Saving..." : "Record Expense"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
