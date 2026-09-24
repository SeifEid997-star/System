"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Shield,
  Building2,
  DollarSign,
  Key,
  Lock,
  Unlock,
  Calendar,
  Download,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Server,
  RefreshCw,
  Copy,
  Users,
  HardDrive,
} from "lucide-react";
import Link from "next/link";

interface ClinicTenant {
  id: string;
  name: string;
  city: string;
  branches: number;
  patientsCount: number;
  plan: "Starter" | "Professional" | "Enterprise";
  mrrEgp: number;
  licenseKey: string;
  expiresAt: string;
  status: "ACTIVE" | "TRIAL" | "SUSPENDED";
}

const INITIAL_TENANTS: ClinicTenant[] = [
  {
    id: "cl-1",
    name: "PetPals Veterinary Clinic (عيادة بت بالز)",
    city: "Cairo (Dokki & New Cairo)",
    branches: 3,
    patientsCount: 1420,
    plan: "Enterprise",
    mrrEgp: 14500,
    licenseKey: "QLINIC-2027-PALS-9812-7710",
    expiresAt: "22-09-2027 (Active 1 Year)",
    status: "ACTIVE",
  },
  {
    id: "cl-2",
    name: "Cairo Animal Medical Center (المركز الطبي للحيوان)",
    city: "Cairo (Maadi)",
    branches: 1,
    patientsCount: 840,
    plan: "Professional",
    mrrEgp: 8500,
    licenseKey: "QLINIC-2027-CAMC-3341-9012",
    expiresAt: "15-11-2026",
    status: "ACTIVE",
  },
  {
    id: "cl-3",
    name: "Alexandria Pet Hub (مجمع الإسكندرية البيطري)",
    city: "Alexandria (Smouha)",
    branches: 2,
    patientsCount: 1100,
    plan: "Professional",
    mrrEgp: 9500,
    licenseKey: "QLINIC-2026-ALEX-1184-4421",
    expiresAt: "30-10-2026",
    status: "ACTIVE",
  },
  {
    id: "cl-4",
    name: "Zayed Vet Care (عيادة زايد للحيوانات)",
    city: "Giza (Sheikh Zayed)",
    branches: 1,
    patientsCount: 310,
    plan: "Starter",
    mrrEgp: 4500,
    licenseKey: "QLINIC-2026-ZYD-7729-1029",
    expiresAt: "01-10-2026",
    status: "TRIAL",
  },
];

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<ClinicTenant[]>(INITIAL_TENANTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [newTenant, setNewTenant] = useState({
    name: "",
    city: "",
    plan: "Professional",
    mrrEgp: 8500,
  });

  const totalMrr = tenants
    .filter((t) => t.status === "ACTIVE")
    .reduce((acc, t) => acc + t.mrrEgp, 0);

  const totalPatients = tenants.reduce((acc, t) => acc + t.patientsCount, 0);

  const toggleStatus = (id: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
          setToastMessage(
            `تم تغيير حالة ترخيص "${t.name}" إلى: ${nextStatus === "ACTIVE" ? "مفعل ✅" : "موقوف (Suspended) ⛔"}`
          );
          setTimeout(() => setToastMessage(""), 4000);
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const renewOneYear = (id: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          setToastMessage(`تم تمديد اشتراك "${t.name}" لمدة عام إضافي بنجاح!`);
          setTimeout(() => setToastMessage(""), 4000);
          return { ...t, expiresAt: "22-09-2028 (Extended +1Y)", status: "ACTIVE" };
        }
        return t;
      })
    );
  };

  const copyLicense = (key: string) => {
    navigator.clipboard.writeText(key);
    setToastMessage("تم نسخ مفتاح الترخيص (License Key) إلى الحافظة!");
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name.trim()) return;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const created: ClinicTenant = {
      id: `cl-${Date.now()}`,
      name: newTenant.name,
      city: newTenant.city || "Cairo, Egypt",
      branches: 1,
      patientsCount: 0,
      plan: newTenant.plan as any,
      mrrEgp: Number(newTenant.mrrEgp) || 8500,
      licenseKey: `QLINIC-2027-${randomSuffix}-NEW-CLINIC`,
      expiresAt: "22-09-2027 (1 Year Initial)",
      status: "ACTIVE",
    };

    setTenants([created, ...tenants]);
    setIsModalOpen(false);
    setNewTenant({ name: "", city: "", plan: "Professional", mrrEgp: 8500 });
    setToastMessage(`تم تسجيل عيادة "${created.name}" وإصدار ترخيصها بنجاح!`);
    setTimeout(() => setToastMessage(""), 4000);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-purple-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-purple-200" />
          <div className="text-xs">
            <p className="font-bold">إشعار منصة السوبر أدمن</p>
            <p className="text-purple-100 text-[11px]">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <Shield className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Qlinic SaaS Vendor &amp; License Manager
            </span>
            <Badge variant="brand" dot className="bg-purple-500/30 text-purple-200 border-purple-400/40">
              Platform SuperAdmin
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            لوحة تحكم مالك المنصة وتراخيص العيادات (Multi-Tenant Management)
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-2 leading-relaxed">
            من هنا تدير اشتراكات كل العيادات المشتركة معك، تجدد التراخيص، توقف اشتراك أي عيادة تأخرت عن السداد بضغطة زر (Kill-Switch)، وتتابع إيراداتك الشهرية المتكررة (MRR).
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Monthly Recurring Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {totalMrr.toLocaleString()} <span className="text-xs font-normal">EGP/mo</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">From active clinic subscriptions</p>
        </Card>

        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Subscribed Clinics</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {tenants.length} Clinics
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {tenants.filter((t) => t.status === "ACTIVE").length} Active • {tenants.filter((t) => t.status === "TRIAL").length} Trial
          </p>
        </Card>

        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Patient Records</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalPatients.toLocaleString()} Pets
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all tenant databases</p>
        </Card>

        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Cloud Engine Health</span>
            <Server className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-600 mt-1">100% Online</div>
          <p className="text-[11px] text-slate-400 mt-1">SQLite &bull; 0 reported downtime</p>
        </Card>
      </div>

      {/* Tenants Table */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-600" />
              العيادات المسجلة وتراخيص المنظومة (Clinic Subscriptions)
            </h3>
            <p className="text-xs text-slate-400">تحكم كامل في تفعيل أو إيقاف أي عيادة وتوليد مفاتيح الأمان</p>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-purple-700 hover:bg-purple-800 text-white"
          >
            تسجيل عيادة جديدة (Add Clinic)
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-dark-border">
                <th className="py-3.5 px-5">Clinic Name &amp; Location</th>
                <th className="py-3.5 px-4">Plan Tier</th>
                <th className="py-3.5 px-4">Subscription MRR</th>
                <th className="py-3.5 px-4">License Key</th>
                <th className="py-3.5 px-4">Expires</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Vendor Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-dark-hover/40 transition-colors">
                  <td className="py-4 px-5">
                    <div className="font-extrabold text-slate-900 dark:text-white">{t.name}</div>
                    <div className="text-[11px] text-slate-400">{t.city} • {t.branches} Branches</div>
                  </td>

                  <td className="py-4 px-4">
                    <Badge variant="brand" className="text-[10px]">
                      {t.plan}
                    </Badge>
                  </td>

                  <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                    {t.mrrEgp.toLocaleString()} EGP/mo
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg w-fit">
                      <span>{t.licenseKey}</span>
                      <button
                        onClick={() => copyLicense(t.licenseKey)}
                        className="text-purple-600 hover:text-purple-800"
                        title="Copy Key"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-medium">
                    {t.expiresAt}
                  </td>

                  <td className="py-4 px-4 text-center">
                    <Badge
                      variant={t.status === "ACTIVE" ? "success" : t.status === "TRIAL" ? "warning" : "danger"}
                      dot
                      className="text-[10px]"
                    >
                      {t.status}
                    </Badge>
                  </td>

                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => renewOneYear(t.id)}
                        className="text-xs h-7 px-2.5 text-emerald-700 dark:text-emerald-300"
                      >
                        +1 Year
                      </Button>
                      <Button
                        size="sm"
                        variant={t.status === "ACTIVE" ? "outline" : "primary"}
                        onClick={() => toggleStatus(t.id)}
                        className={`text-xs h-7 px-2.5 ${t.status === "ACTIVE" ? "text-rose-600 hover:bg-rose-50" : "bg-emerald-600"}`}
                        leftIcon={t.status === "ACTIVE" ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      >
                        {t.status === "ACTIVE" ? "Suspend (قفل)" : "Activate (تفعيل)"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER NEW CLINIC MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-700 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Add New Clinic Customer (تسجيل عيادة جديدة)
                  </h3>
                  <p className="text-xs text-slate-400">Issue an instant software license</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clinic Legal / Trade Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Pets Hospital"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City / Governorate
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Giza (Mohandessin)"
                    value={newTenant.city}
                    onChange={(e) => setNewTenant({ ...newTenant, city: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={newTenant.plan}
                    onChange={(e) => setNewTenant({ ...newTenant, plan: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100 font-bold"
                  >
                    <option value="Starter">Starter (4,500 EGP/mo)</option>
                    <option value="Professional">Professional (8,500 EGP/mo)</option>
                    <option value="Enterprise">Enterprise (14,500 EGP/mo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Fee (EGP)
                </label>
                <input
                  type="number"
                  value={newTenant.mrrEgp}
                  onChange={(e) => setNewTenant({ ...newTenant, mrrEgp: Number(e.target.value) })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100 font-mono"
                />
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
                <Button type="submit" variant="primary" size="sm" className="bg-purple-700 hover:bg-purple-800 text-white">
                  Issue License &amp; Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
