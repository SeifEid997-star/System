"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Store,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  Printer,
  X,
  User,
  Sparkles,
  Barcode,
} from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  barcode: string;
  type: "INVENTORY" | "SERVICE";
}

const FALLBACK_CATALOG_ITEMS: ProductItem[] = [
  { id: "p-1", name: "Bravecto Chewable Dog 20-40kg", category: "Medications", price: 850, stock: 4, barcode: "6221009988772", type: "INVENTORY" },
  { id: "p-2", name: "Rabisin Vaccine 10 Doses", category: "Vaccines", price: 450, stock: 3, barcode: "6221009988771", type: "INVENTORY" },
  { id: "p-3", name: "Amoxiclav 250mg Suspension", category: "Medications", price: 160, stock: 6, barcode: "6221009988773", type: "INVENTORY" },
  { id: "p-4", name: "Royal Canin Gastrointestinal 2kg", category: "Pet Food", price: 1100, stock: 12, barcode: "6221009988774", type: "INVENTORY" },
  { id: "p-5", name: "Frontline Plus Spot-On Feline", category: "Anti-Parasitics", price: 380, stock: 18, barcode: "6221009988775", type: "INVENTORY" },
  { id: "p-6", name: "General Health Consultation", category: "Services", price: 350, stock: 999, barcode: "SRV-CONSULT", type: "SERVICE" },
  { id: "p-7", name: "Comprehensive 8-in-1 Vaccine Shot", category: "Services", price: 650, stock: 999, barcode: "SRV-VAC-8", type: "SERVICE" },
  { id: "p-8", name: "Ultrasonic Dental Scaling & Polish", category: "Services", price: 1200, stock: 999, barcode: "SRV-DENTAL", type: "SERVICE" },
  { id: "p-9", name: "Full Spa & Hygienic Grooming", category: "Services", price: 450, stock: 999, barcode: "SRV-GROOM", type: "SERVICE" },
];

interface CartItem extends ProductItem {
  quantity: number;
}

export default function PosPage() {
  const [catalog, setCatalog] = useState<ProductItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerType, setCustomerType] = useState<"WALKIN" | "REGISTERED">("WALKIN");
  const [customerName, setCustomerName] = useState("Walk-in Cash Customer");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [applyTax, setApplyTax] = useState(true);

  // Custom Quick Add Item modal
  const [isCustomItemOpen, setIsCustomItemOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customCategory, setCustomCategory] = useState("Services");
  const [customQuantity, setCustomQuantity] = useState(1);
  const [saveToCatalog, setSaveToCatalog] = useState(true);

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("CASH");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingCustomItem, setIsSavingCustomItem] = useState(false);
  const [customItemError, setCustomItemError] = useState("");

  // The old POS list was held only in page memory. The catalog now loads
  // from the local SQLite database shared by Inventory and Services.
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [inventoryResponse, servicesResponse] = await Promise.all([
          fetch("/api/inventory"),
          fetch("/api/services"),
        ]);
        const [inventoryData, servicesData] = await Promise.all([
          inventoryResponse.json(),
          servicesResponse.json(),
        ]);
        const inventory: ProductItem[] = (inventoryData.items || [])
          .filter((item: any) => item.isPosAvailable !== false)
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            category: item.category?.name || "Medications",
            price: item.salePrice || 0,
            stock: item.quantity ?? 0,
            barcode: item.barcode || item.sku || `INV-${item.id?.slice(-4)}`,
            type: "INVENTORY" as const,
          }));
        const services: ProductItem[] = (servicesData.services || [])
          .filter((service: any) => service.isActive !== false)
          .map((service: any) => ({
            id: service.id,
            name: service.name,
            category: service.category?.name || "Services",
            price: service.price || 0,
            stock: 999,
            barcode: `SRV-${(service.id || "0000").slice(-6).toUpperCase()}`,
            type: "SERVICE" as const,
          }));
        const combined = [...inventory, ...services];
        setCatalog(combined.length > 0 ? combined : FALLBACK_CATALOG_ITEMS);
      } catch (error) {
        console.error("Failed to load POS catalog:", error);
        setCatalog(FALLBACK_CATALOG_ITEMS);
      }
    };
    loadCatalog();
  }, []);

  // Cart operations
  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCreateCustomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customPrice) return;

    setIsSavingCustomItem(true);
    setCustomItemError("");
    const priceNum = parseFloat(customPrice) || 0;
    let newItem: ProductItem = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      price: priceNum,
      stock: 999,
      barcode: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      type: customCategory === "Services" ? "SERVICE" : "INVENTORY",
    };

    try {
      if (saveToCatalog) {
        const endpoint = newItem.type === "SERVICE" ? "/api/services" : "/api/inventory";
        const payload = newItem.type === "SERVICE"
          ? { name: newItem.name, categoryName: customCategory, price: priceNum }
          : { name: newItem.name, categoryName: customCategory, quantity: 0, salePrice: priceNum, barcode: newItem.barcode };
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Could not save the item to the catalog");

        const saved = data.service || data.item;
        newItem = newItem.type === "SERVICE"
          ? { ...newItem, id: saved.id, category: saved.category.name, price: saved.price }
          : { ...newItem, id: saved.id, category: saved.category.name, price: saved.salePrice, stock: saved.quantity, barcode: saved.barcode || saved.sku };
        setCatalog((prev) => [newItem, ...prev]);
      }

      setCart((prev) => [{ ...newItem, quantity: customQuantity }, ...prev]);
      setCustomName("");
      setCustomPrice("");
      setCustomQuantity(1);
      setIsCustomItemOpen(false);
    } catch (error) {
      console.error("Failed to save custom POS item:", error);
      setCustomItemError(error instanceof Error ? error.message : "Could not save the item. Try again.");
    } finally {
      setIsSavingCustomItem(false);
    }
  };

  // Calculations
  const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = roundMoney((subtotal * discountPercent) / 100);
  const taxableAmount = roundMoney(subtotal - discountAmount);
  const taxAmount = applyTax ? roundMoney(taxableAmount * 0.14) : 0;
  const total = roundMoney(taxableAmount + taxAmount);

  const handleOpenCheckout = () => {
    setPaidAmount(Math.round(total));
    setIsCheckoutOpen(true);
  };

  const handleCompleteSale = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        customerName,
        items: cart,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total,
        paidAmount,
        paymentMethod: selectedPaymentMethod,
        type: "POS_RECEIPT",
      };

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setReceiptData(data.invoice);
        setIsCheckoutOpen(false);
        setIsReceiptOpen(true);
        setCart([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCatalog = catalog.filter((item) => {
    const matchCat = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Point of Sale &bull; Fast Register (كاشير العيادة)
            </h1>
            <Badge variant="amber" dot>
              Multi-Payment Enabled
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Accept Cash, Visa/Mastercard, InstaPay, Vodafone Cash, and Bank Transfer with instant thermal receipt.
          </p>
        </div>

        {/* Customer Quick Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-dark-card p-1.5 rounded-2xl border border-slate-200 dark:border-dark-border">
          <button
            type="button"
            onClick={() => {
              setCustomerType("WALKIN");
              setCustomerName("Walk-in Cash Customer");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              customerType === "WALKIN"
                ? "bg-brand-700 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Walk-in Customer
          </button>
          <button
            type="button"
            onClick={() => {
              setCustomerType("REGISTERED");
              setCustomerName("Mohamed El-Sayed (Max)");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              customerType === "REGISTERED"
                ? "bg-brand-700 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Registered Patient
          </button>
        </div>
      </div>

      {/* POS Grid: Catalog (8 Cols) + Live Cart (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Catalog Items Column */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Scan barcode or type product / service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {/* Categories Ribbon */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              {["ALL", ...Array.from(new Set(catalog.map((item) => item.category)))].map((cat) => (
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

            {/* Quick Add Custom Item Button */}
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsCustomItemOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs shrink-0 shadow-sm"
            >
              + Add Custom Item
            </Button>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {filteredCatalog.map((prod) => (
              <div
                key={prod.id}
                onClick={() => addToCart(prod)}
                className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border hover:border-brand-500/50 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      {prod.category}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {prod.type === "SERVICE" ? "Service" : `${prod.stock} in stock`}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2 group-hover:text-brand-600 transition-colors line-clamp-2">
                    {prod.name}
                  </h4>

                  <div className="font-mono text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Barcode className="w-3 h-3" />
                    <span>{prod.barcode}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border flex items-center justify-between">
                  <div className="text-base font-extrabold text-slate-900 dark:text-white">
                    {prod.price.toLocaleString()} <span className="text-xs font-normal text-slate-400">EGP</span>
                  </div>

                  <div className="w-7 h-7 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center group-hover:bg-brand-700 group-hover:text-white transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Cart Sidebar (4 Cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-dark-card p-5 rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark sticky top-20 flex flex-col justify-between min-h-[580px]">
            <div>
              {/* Cart Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Current Order
                    </h3>
                    <p className="text-[11px] text-slate-400">{customerName}</p>
                  </div>
                </div>
                <Badge variant="brand">{cart.length} items</Badge>
              </div>

              {/* Cart Items List */}
              <div className="mt-4 space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <Store className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Cart is empty. Click items on the left to add.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-dark-border flex items-center justify-between text-xs"
                    >
                      <div className="max-w-[150px]">
                        <div className="font-bold text-slate-800 dark:text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.price} EGP &times; {item.quantity}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white dark:bg-dark-card rounded-lg border border-slate-200 dark:border-dark-border">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded-l-lg"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-bold text-slate-800 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded-r-lg"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Discount & VAT Options */}
              {cart.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">Discount / الخصم (%)</span>
                    <div className="flex items-center gap-1.5">
                      {[0, 5, 10, 15, 20].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => setDiscountPercent(pct)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                            discountPercent === pct
                              ? "bg-brand-700 text-white border-brand-700 shadow-xs"
                              : "border-slate-200 text-slate-600 dark:border-dark-border hover:bg-slate-100"
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                      <div className="flex items-center gap-1 ml-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                          className="w-12 px-1.5 py-0.5 rounded border border-slate-200 dark:border-dark-border text-center text-xs font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800"
                          placeholder="%"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Apply 14% VAT</span>
                    <input
                      type="checkbox"
                      checked={applyTax}
                      onChange={(e) => setApplyTax(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Financials & Checkout Button */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-dark-border space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Subtotal</span>
                <span>{subtotal.toLocaleString()} EGP</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-600 font-medium">
                  <span>Discount ({discountPercent}%)</span>
                  <span>- {discountAmount.toLocaleString()} EGP</span>
                </div>
              )}

              {applyTax && (
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>VAT (14%)</span>
                  <span>+ {taxAmount.toLocaleString()} EGP</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-dark-border">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Grand Total
                </span>
                <span className="text-xl font-black text-brand-700 dark:text-brand-400">
                  {Math.round(total).toLocaleString()} EGP
                </span>
              </div>

              <Button
                size="lg"
                variant="amber"
                disabled={cart.length === 0}
                onClick={handleOpenCheckout}
                className="w-full font-bold shadow-lg shadow-amber-500/25 mt-2"
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ADD CUSTOM ITEM / SERVICE MODAL */}
      {isCustomItemOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add Custom Item / Service (إضافة بند يدوي)
                </h3>
                <p className="text-xs text-slate-400">Add any unlisted product or clinical fee directly to this sale</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomItemOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Item or Service Description (اسم البند أو الخدمة) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Wound Dressing / Emergency Fee"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Price in EGP (السعر) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    placeholder="e.g. 250"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border font-bold text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity (الكمية)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customQuantity}
                    onChange={(e) => setCustomQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border font-bold text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category (التصنيف)
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white outline-none"
                >
                  <option value="Services">Services (خدمات إكلينيكية وعامة)</option>
                  <option value="Medications">Medications (أدوية وعلاجات)</option>
                  <option value="Vaccines">Vaccines (تطعيمات)</option>
                  <option value="Pet Food">Pet Food (أطعمة ومكملات)</option>
                  <option value="Anti-Parasitics">Anti-Parasitics (مضادات طفيليات)</option>
                  <option value="Consumables">Consumables (مستهلكات طبية)</option>
                  <option value="Other">Other (أخرى)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-dark-border flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-white">
                    Save to Catalog Permanently?
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Keep in the product grid for future fast one-click sales
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={saveToCatalog}
                  onChange={(e) => setSaveToCatalog(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
              </div>

              {customItemError && (
                <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{customItemError}</p>
              )}

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="submit"
                  size="md"
                  variant="primary"
                  disabled={isSavingCustomItem}
                  className="w-full font-bold shadow-md shadow-brand-700/20"
                >
                  {isSavingCustomItem ? "Saving..." : `Add to Cart (${customPrice ? `${(parseFloat(customPrice) || 0) * customQuantity} EGP` : "0 EGP"})`}
                </Button>
                <Button
                  type="button"
                  size="md"
                  variant="outline"
                  onClick={() => setIsCustomItemOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MULTI-PAYMENT CHECKOUT MODAL (Fixes Cash-only limitation) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Select Payment Method (طريقة الدفع)
                </h3>
                <p className="text-xs text-slate-400">Total payable: {Math.round(total).toLocaleString()} EGP</p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Method Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: "CASH", label: "Cash (نقداً)", icon: Banknote, color: "text-emerald-600" },
                { id: "CREDIT_CARD", label: "Visa / Card", icon: CreditCard, color: "text-sky-600" },
                { id: "INSTAPAY", label: "InstaPay (إنستاباي)", icon: Smartphone, color: "text-amber-500" },
                { id: "VODAFONE_CASH", label: "Vodafone Cash", icon: Smartphone, color: "text-rose-600" },
                { id: "BANK_TRANSFER", label: "Bank Wire", icon: Building, color: "text-purple-600" },
                { id: "MULTIPLE", label: "Split / Multi", icon: Sparkles, color: "text-brand-600" },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = selectedPaymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(m.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-brand-50 border-brand-500 shadow-sm dark:bg-brand-950/60 dark:border-brand-500"
                        : "border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${m.color}`} />
                    <span className="text-xs font-bold text-slate-800 dark:text-white mt-2 block">
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Amount Paid Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount Received (المبلغ المستلم)
              </label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border font-mono font-bold text-base text-slate-900 dark:text-white"
              />
              {paidAmount > total && (
                <div className="text-xs font-semibold text-emerald-600 mt-1">
                  Change to return: {(paidAmount - total).toLocaleString()} EGP
                </div>
              )}
            </div>

            <Button
              size="lg"
              variant="primary"
              isLoading={isSubmitting}
              onClick={handleCompleteSale}
              className="w-full font-bold shadow-lg shadow-brand-700/20"
            >
              Complete Sale &amp; Print Receipt
            </Button>
          </div>
        </div>
      )}

      {/* 80mm THERMAL RECEIPT MODAL */}
      {isReceiptOpen && receiptData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white text-slate-900 rounded-3xl p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="text-base font-black uppercase tracking-wider">PetPals Veterinary</h2>
              <p className="text-[11px] text-slate-500">24 El-Tahrir St, Dokki, Giza</p>
              <p className="text-[11px] text-slate-500">Tax ID: 618-921-304 &bull; Tel: 01001234567</p>
            </div>

            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Receipt: {receiptData.invoiceNumber}</span>
              <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="text-[11px] text-slate-600">
              Customer: {receiptData.customerName}
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
              {receiptData.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span className="truncate max-w-[180px]">{item.description} &times;{item.quantity}</span>
                  <span className="font-bold">{item.total} EGP</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-right">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{receiptData.subtotal} EGP</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (14%):</span>
                <span>{receiptData.tax} EGP</span>
              </div>
              <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-300">
                <span>TOTAL:</span>
                <span>{receiptData.total} EGP</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                <span>Payment Method:</span>
                <span className="font-bold uppercase">{receiptData.paymentMethod}</span>
              </div>
            </div>

            <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[11px] text-slate-500">
              Thank you for trusting PetPals! 🐾
              <br />
              نتمنى لحيوانكم الأليف دوام الصحة والعافية
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button size="sm" variant="primary" onClick={() => window.print()} className="w-full" leftIcon={<Printer className="w-4 h-4" />}>
                Print Receipt (80mm)
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsReceiptOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
