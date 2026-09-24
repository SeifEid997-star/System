"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  GitBranch,
  Plus,
  Building2,
  Phone,
  MapPin,
  Users,
  Calendar,
  DollarSign,
} from "lucide-react";

interface BranchVM {
  id: string;
  name: string;
  address: string;
  phone: string;
  staffCount: number;
  todayAppointments: number;
  status: string;
  active: boolean;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchVM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState("");
  const [newBranch, setNewBranch] = useState({
    name: "",
    address: "",
    phone: "",
    staffCount: 4,
    status: "OPERATIONAL",
  });

  const loadBranches = useCallback(async () => {
    try {
      const res = await fetch("/api/branches");
      const data = await res.json();
      setBranches(data.branches || []);
    } catch (err) {
      console.error("Failed to load branches:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBranch.name,
          address: newBranch.address || "Cairo, Egypt",
          phone: newBranch.phone || "+20 2 0000 0000",
          status: newBranch.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create branch");

      setBranches((prev) => [...prev, data.branch]);
      setIsModalOpen(false);
      setNewBranch({ name: "", address: "", phone: "", staffCount: 4, status: "OPERATIONAL" });
      setSuccessToast(`تمت إضافة فرع "${data.branch.name}" بنجاح وتفعيله على الشبكة!`);
      setTimeout(() => setSuccessToast(""), 4000);
    } catch (err) {
      console.error(err);
      alert("تعذر حفظ الفرع، حاول مرة أخرى.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (branch: BranchVM) => {
    try {
      const res = await fetch(`/api/branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !branch.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBranches((prev) =>
        prev.map((b) => (b.id === branch.id ? { ...b, active: data.branch.active } : b))
      );
    } catch (err) {
      console.error(err);
      alert("تعذر تحديث حالة الفرع.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Success Notification */}
      {successToast && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <div className="text-xs">
            <p className="font-bold">تم حفظ الفرع بنجاح!</p>
            <p className="text-emerald-100 text-[11px]">{successToast}</p>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Clinic Branches &amp; Facilities (فروع المنظومة)
            </h1>
            <Badge variant="brand">{branches.length} Active Locations</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centralized multi-branch control: staff rosters, inter-branch stock dispatch, and shared medical records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Open New Branch
          </Button>
        </div>
      </div>

      {/* Branches Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {branches.map((b) => (
          <Card key={b.id} hoverEffect className={`flex flex-col justify-between ${!b.active ? "opacity-60" : ""}`}>
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{b.name}</h3>
                    <span className="text-[10px] text-slate-400">HQ Connected</span>
                  </div>
                </div>
                <Badge variant={b.status === "PRIMARY" ? "brand" : "success"} dot className="text-[10px]">
                  {b.active ? b.status : "INACTIVE"}
                </Badge>
              </div>

              <div className="space-y-2 mt-4 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{b.address}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{b.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-dark-border text-xs">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 block">Active Staff</span>
                  <span className="font-bold text-slate-900 dark:text-white">{b.staffCount} Members</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 block">Today&apos;s Bookings</span>
                  <span className="font-bold text-brand-700 dark:text-brand-400">{b.todayAppointments} Patients</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border text-right">
              <Button
                size="sm"
                variant={b.active ? "outline" : "primary"}
                className="w-full text-xs"
                onClick={() => handleToggleActive(b)}
              >
                {b.active ? "Deactivate Branch" : "Reactivate Branch"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      )}

      {/* NEW BRANCH MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-600/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Open New Clinic Branch (إضافة فرع جديد)
                  </h3>
                  <p className="text-xs text-slate-400">Connect a new facility to PetPals Multi-Branch SaaS</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Branch Name &amp; Label (اسم الفرع) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heliopolis Branch (فرع مصر الجديدة)"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Physical Address (العنوان بالتفصيل) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15 Baghdad St, Korba, Heliopolis, Cairo"
                  value={newBranch.address}
                  onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Direct Phone (الهاتف)
                  </label>
                  <input
                    type="text"
                    placeholder="+20 2 2415 8888"
                    value={newBranch.phone}
                    onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Staff Count (عدد الكادر)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newBranch.staffCount}
                    onChange={(e) => setNewBranch({ ...newBranch, staffCount: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Branch Tier (نوع الفرع)
                </label>
                <select
                  value={newBranch.status}
                  onChange={(e) => setNewBranch({ ...newBranch, status: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="OPERATIONAL">Operational Satellite Clinic (فرع تشغيلي)</option>
                  <option value="PRIMARY">Regional Hub / Hospital (مركز رئيسي)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-dark-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save & Activate Branch"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
