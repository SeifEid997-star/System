"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Building,
  DollarSign,
  Clock,
  X,
} from "lucide-react";

interface SupplierVM {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  outstandingBalance: number;
  paymentTerms: string;
  active: boolean;
}

export default function SuppliersPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Pharmaceuticals & Vaccines");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Cairo, Egypt");
  const [paymentTerms, setPaymentTerms] = useState("Net 30 Days");
  const [isSaving, setIsSaving] = useState(false);

  const [suppliers, setSuppliers] = useState<SupplierVM[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSuppliers = useCallback(async () => {
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          contactPerson: contactPerson || "General Representative",
          phone: phone || "+20 100 000 0000",
          email: email || null,
          city,
          paymentTerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create supplier");

      setSuppliers((prev) => [data.supplier, ...prev]);
      setIsAddModalOpen(false);
      setName("");
      setContactPerson("");
      setPhone("");
      setEmail("");
    } catch (err) {
      console.error(err);
      alert("تعذر حفظ المورد، حاول مرة أخرى.");
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
              Suppliers Directory (دليل الموردين وشركات الأدوية)
            </h1>
            <Badge variant="brand">{suppliers.length} Vendors</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pharmaceutical distributors, pet food wholesalers, and surgical supply partners.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Suppliers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {suppliers.map((sup) => (
          <Card key={sup.id} hoverEffect className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{sup.name}</h3>
                    <span className="text-[10px] text-slate-400">{sup.category}</span>
                  </div>
                </div>
                <Badge variant="success" dot className="text-[10px]">Active</Badge>
              </div>

              <div className="space-y-2 mt-4 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-slate-400">Rep:</span>
                  <span>{sup.contactPerson}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sup.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sup.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sup.city}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-dark-border flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Balance Owed</span>
                <span className={`font-bold ${sup.outstandingBalance > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {sup.outstandingBalance.toLocaleString()} EGP
                </span>
              </div>
              <Badge variant="neutral" className="text-[10px]">{sup.paymentTerms}</Badge>
            </div>
          </Card>
        ))}
      </div>
      )}
      {/* ADD SUPPLIER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add New Supplier / Distributor
                </h3>
                <p className="text-xs text-slate-400">Register pharmaceutical partner &amp; terms</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zoetis Egypt Animal Health"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Pharmaceuticals & Vaccines">Pharmaceuticals &amp; Vaccines</option>
                    <option value="Biologicals & Parasiticides">Biologicals &amp; Parasiticides</option>
                    <option value="Veterinary Clinical Diets">Veterinary Clinical Diets</option>
                    <option value="Surgical Supplies & Consumables">Surgical Supplies &amp; Consumables</option>
                    <option value="Diagnostic Kits & Lab">Diagnostic Kits &amp; Lab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Representative Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Tarek Nabil"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="010XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="orders@vendor.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    placeholder="Cairo, Egypt"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Net 30 Days">Net 30 Days</option>
                    <option value="Net 45 Days">Net 45 Days</option>
                    <option value="Immediate Cash">Immediate Cash</option>
                    <option value="50% Advance / 50% on Delivery">50% Advance / 50% on Delivery</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button type="submit" size="md" variant="primary" className="w-full font-bold shadow-md shadow-brand-700/20" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Supplier"}
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
