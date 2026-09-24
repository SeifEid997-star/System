"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ShoppingBag,
  Plus,
  Search,
  Truck,
  Building,
  Calendar,
  DollarSign,
  Receipt,
  CheckCircle2,
  X,
} from "lucide-react";

interface PurchaseVM {
  id: string;
  poNumber: string;
  supplier: string;
  supplierId: string;
  date: string;
  itemsCount: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  branch: string;
  branchId: string;
}

interface OptionVM {
  id: string;
  name: string;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseVM[]>([]);
  const [suppliers, setSuppliers] = useState<OptionVM[]>([]);
  const [branches, setBranches] = useState<OptionVM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSupplierId, setNewSupplierId] = useState("");
  const [newBranchId, setNewBranchId] = useState("");
  const [newPoNumber, setNewPoNumber] = useState(`PO-${Date.now()}`);
  const [newTotal, setNewTotal] = useState("");
  const [newPaid, setNewPaid] = useState("");
  const [newItemsCount, setNewItemsCount] = useState(4);

  const loadData = useCallback(async () => {
    try {
      const [purchasesRes, suppliersRes, branchesRes] = await Promise.all([
        fetch("/api/purchases"),
        fetch("/api/suppliers"),
        fetch("/api/branches"),
      ]);
      const purchasesData = await purchasesRes.json();
      const suppliersData = await suppliersRes.json();
      const branchesData = await branchesRes.json();

      setPurchases(purchasesData.purchases || []);
      const supplierOptions: OptionVM[] = (suppliersData.suppliers || []).map((s: any) => ({
        id: s.id,
        name: s.name,
      }));
      const branchOptions: OptionVM[] = (branchesData.branches || []).map((b: any) => ({
        id: b.id,
        name: b.name,
      }));
      setSuppliers(supplierOptions);
      setBranches(branchOptions);
      setNewSupplierId((prev) => prev || supplierOptions[0]?.id || "");
      setNewBranchId((prev) => prev || branchOptions[0]?.id || "");
    } catch (err) {
      console.error("Failed to load purchases:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierId || !newBranchId || isSaving) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: newSupplierId,
          branchId: newBranchId,
          poNumber: newPoNumber,
          itemsCount: newItemsCount,
          totalAmount: parseFloat(newTotal) || 0,
          paidAmount: parseFloat(newPaid) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record purchase");

      setPurchases((prev) => [data.purchase, ...prev]);
      setIsAddModalOpen(false);
      setNewTotal("");
      setNewPaid("");
      setNewPoNumber(`PO-${Date.now()}`);
    } catch (err) {
      console.error(err);
      alert("تعذر حفظ فاتورة الشراء، حاول مرة أخرى.");
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
              Purchases &amp; Supplier Invoices (فواتير المشتريات)
            </h1>
            <Badge variant="brand" dot>Supplier Ledger</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Record supplier invoices and balances. Add received quantities through the Inventory stock forms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            disabled={suppliers.length === 0 || branches.length === 0}
          >
            Record Purchase Invoice
          </Button>
        </div>
      </div>

      {/* Purchases Table */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : (
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-dark-border">
                <th className="py-3.5 px-5">Purchase #</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Branch</th>
                <th className="py-3.5 px-4 text-center">Items</th>
                <th className="py-3.5 px-4 text-right">Total (EGP)</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-center">Stock Status</th>
                <th className="py-3.5 px-5 text-center">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {purchases.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/60 dark:hover:bg-dark-hover/40 transition-colors">
                  <td className="py-4 px-5 font-mono font-bold text-brand-700 dark:text-brand-400">
                    {po.poNumber}
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                    {po.supplier}
                  </td>
                  <td className="py-4 px-4 text-slate-500">
                    {new Date(po.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                  </td>
                  <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                    {po.branch}
                  </td>
                  <td className="py-4 px-4 text-center font-medium">
                    {po.itemsCount} SKUs
                  </td>
                  <td className="py-4 px-4 text-right font-black text-slate-900 dark:text-white">
                    {po.totalAmount.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {po.paidAmount.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Badge variant="success" dot className="text-[10px]">
                      {po.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-5 text-center">
                    <Badge
                      variant={po.paymentStatus === "PAID" ? "success" : "warning"}
                      className="text-[10px]"
                    >
                      {po.paymentStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
      {/* RECORD PURCHASE INVOICE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Record Supplier Purchase Invoice
                </h3>
                <p className="text-xs text-slate-400">Add wholesale supplier order to clinic accounts &amp; stock</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPurchase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supplier Company *
                </label>
                <select
                  value={newSupplierId}
                  onChange={(e) => setNewSupplierId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Invoice / PO # *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPoNumber}
                    onChange={(e) => setNewPoNumber(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Receiving Branch
                  </label>
                  <select
                    value={newBranchId}
                    onChange={(e) => setNewBranchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Amount (EGP) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 18500"
                    value={newTotal}
                    onChange={(e) => setNewTotal(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border font-bold text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Paid (EGP)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={newPaid}
                    onChange={(e) => setNewPaid(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border font-bold text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  SKU Items Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={newItemsCount}
                  onChange={(e) => setNewItemsCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button type="submit" size="md" variant="primary" className="w-full font-bold shadow-md shadow-brand-700/20" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Record Purchase Invoice"}
                </Button>
                <Button type="button" size="md" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
