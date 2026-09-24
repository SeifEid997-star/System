"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  ArrowLeftRight,
  Barcode,
  TrendingUp,
  Building2,
  DollarSign,
  Filter,
  CheckCircle2,
  X,
  Store,
} from "lucide-react";

interface InventoryRecord {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  quantity: number;
  minStockAlert: number;
  unitCost: number;
  salePrice: number;
  expiryDate: string | null;
  batchNumber: string | null;
  isPosAvailable: boolean;
  category: {
    name: string;
  };
  branch: {
    id: string;
    name: string;
  };
}

interface BranchOption { id: string; name: string; active: boolean }

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    totalCostValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [stockStatusFilter, setStockStatusFilter] = useState("ALL");

  // Add Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferItem, setTransferItem] = useState<InventoryRecord | null>(null);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [destinationBranchId, setDestinationBranchId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState(1);
  const [transferError, setTransferError] = useState("");
  const [isSavingTransfer, setIsSavingTransfer] = useState(false);

  // New Item Form State
  const [formData, setFormData] = useState({
    name: "",
    categoryName: "Medications",
    quantity: "10",
    minStockAlert: "5",
    unitCost: "150",
    salePrice: "350",
    batchNumber: "BCH-2026-05",
    expiryDate: "2027-06-30",
    barcode: "",
    sku: "",
    isPosAvailable: true,
  });

  useEffect(() => {
    fetchInventory();
  }, [search, selectedCategory, selectedBranch]);

  useEffect(() => {
    fetch("/api/branches").then((res) => res.json()).then((data) => setBranches((data.branches || []).filter((branch: BranchOption) => branch.active))).catch((err) => console.error("Failed to load branches:", err));
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/inventory?query=${encodeURIComponent(search)}&category=${selectedCategory}&branchId=${selectedBranch}`
      );
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        fetchInventory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openTransferModal = (item: InventoryRecord | null = null) => {
    setTransferItem(item);
    setTransferQuantity(1);
    setTransferError("");
    setDestinationBranchId(branches.find((branch) => branch.id !== item?.branch.id)?.id || "");
    setIsTransferModalOpen(true);
  };

  const handleTransferStock = async () => {
    if (!transferItem || isSavingTransfer) return;
    setIsSavingTransfer(true);
    setTransferError("");
    try {
      const res = await fetch("/api/inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: transferItem.id, destinationBranchId, quantity: transferQuantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to transfer stock");
      setIsTransferModalOpen(false);
      setTransferItem(null);
      await fetchInventory();
    } catch (error) {
      setTransferError(error instanceof Error ? error.message : "Could not transfer stock. Try again.");
    } finally {
      setIsSavingTransfer(false);
    }
  };

  const filteredItems = items.filter((it) => {
    if (stockStatusFilter === "LOW") return it.quantity <= it.minStockAlert;
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Advanced Inventory &bull; Batch &amp; Barcode Management (المخزون المتطور)
            </h1>
            <Badge variant="brand" dot>
              Multi-Branch Ready
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track lot/batch numbers, expiration dates, automated reorder thresholds, barcode scanning, and inter-branch transfers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openTransferModal(items[0] || null)}
            leftIcon={<ArrowLeftRight className="w-4 h-4" />}
          >
            Transfer Between Branches
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Inventory Item
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <Card hoverEffect>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Total Stock Value (Retail)
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {stats.totalValue.toLocaleString()} <span className="text-xs font-normal">EGP</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-dark-border text-xs text-slate-400">
            Cost Basis: {stats.totalCostValue.toLocaleString()} EGP
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Low Stock Items (Alert)
              </p>
              <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {stats.lowStockItems} Items
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-dark-border text-xs text-rose-600 dark:text-rose-400 font-medium">
            Requires supplier reorder
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Active Catalog Items
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {stats.totalItems} SKUs
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-dark-border text-xs text-slate-400">
            Across 3 active branches
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Average Margin
              </p>
              <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                +62.4%
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-dark-border text-xs text-slate-400">
            Mark-up vs purchase wholesale
          </div>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Scan barcode, SKU, batch or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Categories Ribbon */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {["ALL", "Medications", "Vaccines", "Anti-Parasitics", "Pet Food"].map((cat) => (
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

      {/* Inventory Data Table */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-dark-border">
                <th className="py-3.5 px-5">Item &amp; Barcode</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Branch</th>
                <th className="py-3.5 px-4">Batch / Lot #</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4 text-center">Stock Level</th>
                <th className="py-3.5 px-4 text-right">Cost Price</th>
                <th className="py-3.5 px-4 text-right">Retail Price</th>
                <th className="py-3.5 px-4 text-center">POS Sellable</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.quantity <= item.minStockAlert;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-dark-hover/40 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Barcode className="w-3 h-3 text-slate-400" />
                          <span>{item.barcode || item.sku}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="neutral" className="text-[10px]">
                          {item.category?.name || "General"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                        {item.branch?.name || "Dokki Main"}
                      </td>
                      <td className="py-4 px-4 font-mono font-semibold text-brand-700 dark:text-brand-400">
                        {item.batchNumber || "BCH-2026-01"}
                      </td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                        {item.expiryDate
                          ? new Date(item.expiryDate).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })
                          : "Long Life"}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span
                            className={`font-black text-sm ${
                              isLow ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {item.quantity}
                          </span>
                          <span className="text-[10px] text-slate-400">/ min {item.minStockAlert}</span>
                        </div>
                        {isLow && (
                          <div className="mt-1">
                            <Badge variant="danger" className="text-[9px] py-0 px-1.5">
                              Reorder Alert
                            </Badge>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-slate-500">
                        {item.unitCost} EGP
                      </td>
                      <td className="py-4 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                        {item.salePrice} EGP
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              openTransferModal(item);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-700 hover:bg-brand-50"
                            title="Transfer Stock to another branch"
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD NEW INVENTORY ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add Inventory Item with Batch &amp; Barcode
                </h3>
                <p className="text-xs text-slate-400">Register new medical stock with lot tracking</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product / Medication Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nexgard Spectra Medium"
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
                    <option value="Medications">Medications</option>
                    <option value="Vaccines">Vaccines</option>
                    <option value="Anti-Parasitics">Anti-Parasitics</option>
                    <option value="Pet Food">Pet Food</option>
                    <option value="Consumables">Consumables</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Batch / Lot Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="BCH-2026-X"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity In-Stock
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border font-bold text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Min Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cost Price (Wholesale EGP)
                  </label>
                  <input
                    type="number"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Retail Sale Price (EGP)
                  </label>
                  <input
                    type="number"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border font-bold text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button type="submit" size="md" variant="primary" className="w-full font-bold shadow-md shadow-brand-700/20">
                  Save Item to Inventory
                </Button>
                <Button type="button" size="md" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTER-BRANCH STOCK TRANSFER MODAL (Solves Multi-branch behavior) */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Inter-Branch Stock Transfer (نقل بضاعة بين الفروع)
                </h3>
                <p className="text-xs text-slate-400">Stock is deducted from the source and received by the destination.</p>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Source Branch (الفرع المرسل)
                </label>
                <input readOnly value={transferItem?.branch.name || "Select a stock item"} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Destination Branch (الفرع المستلم)
                </label>
                <select required value={destinationBranchId} onChange={(e) => setDestinationBranchId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white">
                  <option value="">Choose destination branch...</option>
                  {branches.filter((branch) => branch.id !== transferItem?.branch.id).map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Item to Transfer
                </label>
                <input
                  type="text"
                  readOnly
                  value={transferItem ? `${transferItem.name} (${transferItem.quantity} available)` : "No source stock item"}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity to Transfer (الكمية المنقولة)
                </label>
                <input
                  type="number"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(Number(e.target.value))}
                  min="1"
                  max={transferItem?.quantity || 1}
                  step="1"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border font-bold text-xs text-slate-900 dark:text-white"
                />
              </div>

              {transferError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{transferError}</p>}

              <Button
                size="md"
                variant="primary"
                onClick={handleTransferStock}
                disabled={!transferItem || !destinationBranchId || transferQuantity < 1 || transferQuantity > (transferItem?.quantity || 0) || isSavingTransfer}
                className="w-full font-bold shadow-md shadow-brand-700/20"
              >
                {isSavingTransfer ? "Transferring..." : "Confirm Dispatch & Update Stock"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
