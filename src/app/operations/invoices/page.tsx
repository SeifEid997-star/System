"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Receipt,
  Search,
  Plus,
  Printer,
  FileDown,
  Eye,
  RotateCcw,
  Ban,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import Link from "next/link";

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string | null;
  status: "PAID" | "PARTIAL" | "UNPAID" | "VOIDED" | "REFUNDED";
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  type: string;
  createdAt: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    createdAt: string;
  }>;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isA4ModalOpen, setIsA4ModalOpen] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [search, statusFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices?status=${statusFilter}&query=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.invoices) {
        setInvoices(data.invoices);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Invoices &amp; Receipts (الفواتير والمقبوضات)
            </h1>
            <Badge variant="brand" dot>
              A4 &amp; 80mm Print
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete billing ledger, partial payments history, thermal receipts, and formal A4 clinic invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/operations/pos">
            <Button size="sm" variant="amber" leftIcon={<Plus className="w-4 h-4" />}>
              New POS Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice #, client name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {["ALL", "PAID", "PARTIAL", "UNPAID", "VOIDED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? "bg-brand-700 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Data Table */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-dark-border">
                <th className="py-3.5 px-5">Invoice #</th>
                <th className="py-3.5 px-4">Date &amp; Time</th>
                <th className="py-3.5 px-4">Client / Patient</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4 text-right">Total (EGP)</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Balance Due</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No invoices match your query.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-dark-hover/40 transition-colors">
                    <td className="py-4 px-5 font-mono font-bold text-brand-700 dark:text-brand-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(inv.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {inv.customerName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {inv.customerPhone || "N/A"}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="neutral" className="uppercase font-mono text-[10px]">
                        {inv.paymentMethod}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                      {inv.total.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {inv.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-rose-600 dark:text-rose-400">
                      {inv.dueAmount > 0 ? inv.dueAmount.toLocaleString() : "0"}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge
                        variant={
                          inv.status === "PAID"
                            ? "success"
                            : inv.status === "PARTIAL"
                            ? "warning"
                            : "danger"
                        }
                        dot
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setIsA4ModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                          title="View & Print A4 Clinic Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* A4 OFFICIAL CLINIC INVOICE MODAL */}
      {isA4ModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-3xl bg-white text-slate-900 rounded-3xl p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Actions */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Official Clinic Invoice Preview
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="primary" onClick={() => window.print()} leftIcon={<Printer className="w-4 h-4" />}>
                  Print A4
                </Button>
                <button
                  onClick={() => setIsA4ModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable A4 Content */}
            <div className="border border-slate-200 rounded-2xl p-6 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-brand-700 text-white font-black text-xl flex items-center justify-center">
                      Q
                    </div>
                    <span className="text-xl font-extrabold text-slate-900">PetPals Veterinary Clinic</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">24 El-Tahrir St, Dokki, Giza, Egypt</p>
                  <p className="text-xs text-slate-500">Tax ID: 618-921-304 &bull; Hotline: +20 100 123 4567</p>
                </div>

                <div className="text-right font-mono">
                  <h3 className="text-lg font-black text-brand-700">INVOICE</h3>
                  <p className="text-xs text-slate-600 mt-0.5">#{selectedInvoice.invoiceNumber}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Bill To */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-400 block mb-0.5">BILLED TO:</span>
                  <div className="font-bold text-slate-900">{selectedInvoice.customerName}</div>
                  <div className="text-slate-500">{selectedInvoice.customerPhone || "Dokki Branch Walk-in"}</div>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-400 block mb-0.5">PAYMENT METHOD:</span>
                  <div className="font-bold text-slate-900 uppercase">{selectedInvoice.paymentMethod}</div>
                  <Badge variant={selectedInvoice.status === "PAID" ? "success" : "danger"}>
                    {selectedInvoice.status}
                  </Badge>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-center">Qty</th>
                    <th className="pb-2 text-right">Unit Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-medium">{it.description}</td>
                      <td className="py-2.5 text-center">{it.quantity}</td>
                      <td className="py-2.5 text-right">{it.unitPrice} EGP</td>
                      <td className="py-2.5 text-right font-bold">{it.total} EGP</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-3 border-t border-slate-200">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{selectedInvoice.subtotal} EGP</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>VAT (14%):</span>
                    <span>{selectedInvoice.tax} EGP</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Total Amount:</span>
                    <span>{selectedInvoice.total} EGP</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-600 font-bold">
                    <span>Paid Amount:</span>
                    <span>{selectedInvoice.paidAmount} EGP</span>
                  </div>
                  {selectedInvoice.dueAmount > 0 && (
                    <div className="flex justify-between text-xs text-rose-600 font-bold">
                      <span>Remaining Balance Due:</span>
                      <span>{selectedInvoice.dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
