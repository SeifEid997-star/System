"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Layers,
  Search,
  Plus,
  Clock,
  Link as LinkIcon,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  X,
  Stethoscope,
} from "lucide-react";

interface ServiceRecord {
  id: string;
  name: string;
  price: number;
  cost: number;
  durationMinutes: number;
  isActive: boolean;
  linkedInventoryItemId: string | null;
  category: {
    name: string;
  };
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    categoryName: "Consultation",
    price: "350",
    cost: "50",
    durationMinutes: "30",
    linkedItemName: "None",
  });

  useEffect(() => {
    fetchServices();
  }, [search, selectedCategory]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/services?query=${encodeURIComponent(search)}&category=${selectedCategory}`
      );
      const data = await res.json();
      if (data.services) {
        setServices(data.services);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        fetchServices();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const categories = [
    "ALL",
    "Consultation",
    "Vaccines",
    "Surgeries",
    "Grooming",
    "Boarding",
    "Lab",
    "Radiology",
    "Anti-Parasitics",
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Clinical Services Catalogue (كتالوج الخدمات الطبية)
            </h1>
            <Badge variant="brand" dot>
              Inventory Linked
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standard pricing, procedure durations, cost margins, and optional automatic inventory deduction upon completion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Service
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search service by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Categories Ribbon */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-brand-700 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-dark-border">
                <th className="py-3.5 px-5">Service Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4 text-right">Standard Price</th>
                <th className="py-3.5 px-4 text-right">Procedure Cost</th>
                <th className="py-3.5 px-4 text-right">Profit Margin</th>
                <th className="py-3.5 px-4">Inventory Link (Auto Deduct)</th>
                <th className="py-3.5 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading clinical services...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No services found in this category.
                  </td>
                </tr>
              ) : (
                services.map((srv) => {
                  const margin = srv.price > 0 ? Math.round(((srv.price - srv.cost) / srv.price) * 100) : 100;
                  return (
                    <tr
                      key={srv.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-dark-hover/40 transition-colors"
                    >
                      <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">
                        {srv.name}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="neutral" className="text-[10px]">
                          {srv.category?.name || "Consultation"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {srv.durationMinutes} mins
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                        {srv.price.toLocaleString()} EGP
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-slate-500">
                        {srv.cost.toLocaleString()} EGP
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        +{margin}%
                      </td>
                      <td className="py-4 px-4">
                        {srv.category.name === "Vaccines" ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-brand-600 bg-brand-50 dark:bg-brand-950/50 px-2 py-0.5 rounded-md border border-brand-200/50">
                            <LinkIcon className="w-3 h-3" />
                            Deducts 1 Dose from Stock
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">No stock item</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <Badge variant="success" dot className="text-[10px]">
                          Active
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD SERVICE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add Clinical Service
                </h3>
                <p className="text-xs text-slate-400">Define procedure pricing and duration</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abdominal Ultrasound Exam"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.categoryName}
                    onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Vaccines">Vaccines</option>
                    <option value="Surgeries">Surgeries</option>
                    <option value="Grooming">Grooming</option>
                    <option value="Boarding">Boarding</option>
                    <option value="Lab">Lab Tests</option>
                    <option value="Radiology">Radiology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Retail Price (EGP) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border font-bold text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Procedure Cost (EGP)
                  </label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <Button type="submit" size="md" variant="primary" className="w-full font-bold shadow-md shadow-brand-700/20">
                Save Clinical Service
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
