"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Building2,
  DollarSign,
  Clock,
  Palette,
  CheckCircle2,
  Save,
  RotateCcw,
  FileCheck,
} from "lucide-react";

const DEFAULTS = {
  name: "PetPals Veterinary Clinic (عيادة بت بالز البيطرية)",
  taxId: "419-820-112",
  commercialId: "91048-Cairo",
  phone: "+20 100 123 4567",
  email: "admin@petpals-vet.com",
  address: "24 El-Tahrir St, Dokki, Giza, Egypt",
  currency: "EGP",
  taxRate: 14,
  receiptFooter:
    "Thank you for trusting PetPals! Medications sold are non-refundable once opened. For 24/7 emergencies call +20 100 123 4567.",
  slotDurationMinutes: 20,
  openingTime: "09:00",
  closingTime: "23:00",
  themePrimary: "#0F766E",
};

export default function ClinicSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(DEFAULTS);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/clinic")
      .then((r) => r.json())
      .then((data) => {
        if (data.clinic) {
          setForm({
            name: data.clinic.name,
            taxId: data.clinic.taxId,
            commercialId: data.clinic.commercialId,
            phone: data.clinic.phone,
            email: data.clinic.email,
            address: data.clinic.address,
            currency: data.clinic.currency,
            taxRate: data.clinic.taxRate,
            receiptFooter: data.clinic.receiptFooter,
            slotDurationMinutes: data.clinic.slotDurationMinutes,
            openingTime: data.clinic.openingTime,
            closingTime: data.clinic.closingTime,
            themePrimary: data.clinic.themePrimary,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/clinic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setForm(DEFAULTS);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-40 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in">
      {/* Toast Notification */}
      {savedSuccess && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <div className="text-xs">
            <p className="font-bold">تم حفظ إعدادات العيادة بنجاح!</p>
            <p className="text-emerald-100 text-[11px]">All branding, invoices, and scheduling preferences updated.</p>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Clinic Profile &amp; Global Settings (إعدادات وهوية العيادة)
            </h1>
            <Badge variant="brand" dot>SaaS Multi-Tenant</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure clinic identity, official tax credentials, currency, invoice footer policies, and appointment duration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={handleReset} leftIcon={<RotateCcw className="w-4 h-4 text-slate-400" />}>
            Reset Defaults
          </Button>
          <Button size="sm" variant="primary" onClick={handleSave} leftIcon={<Save className="w-4 h-4" />} disabled={saving}>
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Official Identity & Tax */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-dark-border">
            <Building2 className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Official Clinic Identity &amp; Tax Registration (بيانات العيادة الرسمية)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinic Display Name (اسم المنشأة في الفواتير والتقارير)
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tax Registration No (الرقم الضريبي)
              </label>
              <input
                type="text"
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Commercial Registry No (السجل التجاري)
              </label>
              <input
                type="text"
                value={form.commercialId}
                onChange={(e) => setForm({ ...form, commercialId: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Hotline / WhatsApp Phone
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Clinic Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Headquarters Address (عنوان المقر الرئيسي)
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Financial & POS Preferences */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-dark-border">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Currency, Invoicing &amp; VAT Settings (الإعدادات المالية والفواتير)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Currency (العملة الأساسية)
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100 font-bold"
              >
                <option value="EGP">Egyptian Pound (EGP - ج.م)</option>
                <option value="USD">US Dollar (USD - $)</option>
                <option value="SAR">Saudi Riyal (SAR - ر.س)</option>
                <option value="AED">UAE Dirham (AED - د.إ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                VAT Tax Rate (نسبة ضريبة القيمة المضافة %)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.taxRate}
                onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Invoice &amp; Thermal Receipt Policy Footer (شروط وملاحظات ذيل الفاتورة)
              </label>
              <textarea
                rows={2}
                value={form.receiptFooter}
                onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Scheduling & Consultation Slots */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-dark-border">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Appointment Scheduling &amp; Working Hours (مواعيد العمل والكشوفات)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Consultation Slot Duration (مدة الكشف)
              </label>
              <select
                value={String(form.slotDurationMinutes)}
                onChange={(e) => setForm({ ...form, slotDurationMinutes: Number(e.target.value) })}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100"
              >
                <option value="15">15 Minutes (Express)</option>
                <option value="20">20 Minutes (Standard)</option>
                <option value="30">30 Minutes (Comprehensive)</option>
                <option value="45">45 Minutes (Specialty / Surgery)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinic Opens (بداية العمل)
              </label>
              <input
                type="time"
                value={form.openingTime}
                onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinic Closes (نهاية العمل)
              </label>
              <input
                type="time"
                value={form.closingTime}
                onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>
          </div>
        </Card>

        {/* Section 4: Brand Accent Theme */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-dark-border">
            <Palette className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Visual Identity &amp; Accent Palette (اللون المميز للمنظومة)
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { color: "#0F766E", label: "Medical Teal (افتراضي)" },
              { color: "#1E3A5F", label: "Navy Slate (كحلي)" },
              { color: "#7C3AED", label: "Royal Purple (بنفسجي)" },
              { color: "#059669", label: "Emerald Green (زمردي)" },
            ].map((p) => (
              <button
                key={p.color}
                type="button"
                onClick={() => setForm({ ...form, themePrimary: p.color })}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 ${
                  form.themePrimary === p.color
                    ? "border-brand-600 bg-brand-50 dark:bg-brand-950/50 shadow-sm"
                    : "border-slate-200 dark:border-dark-border hover:bg-slate-50"
                }`}
              >
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-slate-800 dark:text-slate-200">{p.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />} disabled={saving}>
            {saving ? "Saving..." : "Save Clinic Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
