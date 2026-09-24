"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  LifeBuoy,
  Plus,
  Server,
  Database,
  Download,
  CheckCircle2,
  Clock,
  Send,
  Printer,
  Barcode,
  ShieldCheck,
  XCircle,
} from "lucide-react";

interface SupportTicket {
  id: string;
  ticketNumber: string;
  client: string;
  pet: string;
  subject: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  time: string;
}

interface ClientOption {
  id: string;
  name: string;
  phone: string;
}

interface HealthData {
  status: string;
  responseMs: number;
  tables: Record<string, number>;
  totalRows: number;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [clientsForForm, setClientsForForm] = useState<ClientOption[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloadedNotice, setDownloadedNotice] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [newTicket, setNewTicket] = useState({
    ownerId: "",
    subject: "",
    priority: "HIGH",
    message: "",
  });

  async function loadTickets() {
    try {
      const res = await fetch("/api/clients/tickets");
      const json = await res.json();
      setTickets(json.tickets || []);
    } catch {
      // leave tickets as-is; UI shows empty state
    } finally {
      setTicketsLoading(false);
    }
  }

  async function loadHealth() {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/support/health");
      const json = await res.json();
      setHealth(json);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
    loadHealth();
    fetch("/api/clients")
      .then((r) => r.json())
      .then((json) => {
        setClientsForForm(
          (json.clients || []).map((c: any) => ({ id: c.id, name: c.name, phone: c.phone }))
        );
      })
      .catch(() => {});
  }, []);

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      const res = await fetch("/api/support/backup");
      if (!res.ok) throw new Error("Backup failed");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : `PetPals_System_Backup_${new Date().toISOString().slice(0, 10)}.json`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 200);

      setDownloadedNotice(true);
      setTimeout(() => setDownloadedNotice(false), 4000);
    } catch {
      // silently ignore; button remains available to retry
    } finally {
      setDownloadingBackup(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.message.trim() || !newTicket.ownerId) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/clients/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });
      const json = await res.json();
      if (res.ok && json.ticket) {
        setTickets((prev) => [json.ticket, ...prev]);
        setIsModalOpen(false);
        setNewTicket({ ownerId: "", subject: "", priority: "HIGH", message: "" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: SupportTicket["status"]) => {
    const prev = tickets;
    setTickets((cur) => cur.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      const res = await fetch(`/api/clients/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) setTickets(prev);
    } catch {
      setTickets(prev);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {downloadedNotice && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <div className="text-xs">
            <p className="font-bold">تم تحميل نسخة احتياطية من النظام بنجاح!</p>
            <p className="text-emerald-100 text-[11px]">Live database snapshot downloaded.</p>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Client Support &amp; System Health (الدعم الفني وحالة النظام)
            </h1>
            <Badge variant="success" dot>Live</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Client support tickets, live database health, and full-data backup export.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadBackup}
            disabled={downloadingBackup}
            leftIcon={<Download className="w-4 h-4 text-brand-600" />}
          >
            {downloadingBackup ? "Preparing Export..." : "Download Database Backup (.JSON)"}
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Client Ticket
          </Button>
        </div>
      </div>

      {/* System Health Diagnostics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Local SQLite Engine</span>
            <Database className={`w-4 h-4 ${health?.status === "OPERATIONAL" ? "text-emerald-600" : "text-rose-600"}`} />
          </div>
          <div className={`text-xl font-black mt-1 ${health?.status === "OPERATIONAL" ? "text-emerald-600" : "text-rose-600"}`}>
            {healthLoading ? "Checking..." : health?.status === "OPERATIONAL" ? "Operational" : "Degraded"}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            dev.db • {health ? Object.keys(health.tables).length : "—"} Tables synced
          </p>
        </Card>

        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Next.js Full-Stack</span>
            <Server className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">Healthy</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Response time: {healthLoading ? "…" : health ? `${health.responseMs}ms` : "n/a"}
          </p>
        </Card>

        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Records Stored</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-indigo-600 mt-1">
            {healthLoading ? "…" : health ? health.totalRows.toLocaleString() : "—"}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all core tables</p>
        </Card>

        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Audit Trail Security</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-black text-teal-600 mt-1">Enforced</div>
          <p className="text-[11px] text-slate-400 mt-1">Zero-null user IDs</p>
        </Card>
      </div>

      {/* Support Tickets Table */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-brand-600" />
            Client Support Tickets (تذاكر دعم العملاء)
          </h3>
          <Badge variant="brand">{tickets.length} Registered Tickets</Badge>
        </div>

        {ticketsLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={<LifeBuoy className="w-10 h-10 text-slate-400 dark:text-slate-500" />}
            title="No support tickets yet"
            description="Client support tickets will appear here as they're submitted."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-dark-border">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Client &amp; Pet</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Created</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-dark-hover/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {t.ticketNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{t.client}</div>
                      <div className="text-[11px] text-slate-400">{t.pet}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 max-w-xs">
                      {t.subject}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={t.priority === "URGENT" ? "danger" : t.priority === "HIGH" ? "warning" : "neutral"}
                        className="text-[10px]"
                      >
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value as SupportTicket["status"])}
                        className="text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 px-2 py-1 text-slate-700 dark:text-slate-200"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-mono">{t.time}</td>
                    <td className="py-3.5 px-4 text-right">
                      {t.status !== "RESOLVED" && t.status !== "CLOSED" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs px-2.5"
                          onClick={() => handleStatusChange(t.id, "RESOLVED")}
                        >
                          Mark Resolved
                        </Button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Done
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Troubleshooting Guides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card hoverEffect className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 font-bold text-xs">
            <Printer className="w-4 h-4" />
            <span>Thermal Receipt Setup</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            In Chrome/Edge print dialog, set Paper Size to 80mm / 3 inch roll and Margins to &quot;None&quot; for crisp thermal output.
          </p>
        </Card>

        <Card hoverEffect className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 font-bold text-xs">
            <Barcode className="w-4 h-4" />
            <span>USB Barcode Scanners</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Standard USB and Bluetooth 1D/2D scanners operate in HID keyboard mode and require zero additional driver setup.
          </p>
        </Card>

        <Card hoverEffect className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 font-bold text-xs">
            <Database className="w-4 h-4" />
            <span>Data Backups</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Your clinic data is stored locally in `prisma/dev.db`. Use the button above anytime to export a full JSON snapshot.
          </p>
        </Card>
      </div>

      {/* NEW SUPPORT TICKET MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-600/20">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Submit Client Support Ticket
                  </h3>
                  <p className="text-xs text-slate-400">Saved directly to the clinic database</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Client *
                </label>
                <select
                  required
                  value={newTicket.ownerId}
                  onChange={(e) => setNewTicket({ ...newTicket, ownerId: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100"
                >
                  <option value="">Select a client...</option>
                  {clientsForForm.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Issue Summary / Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Question about invoice #1084"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Priority Level
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100 font-bold"
                >
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Description
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe step-by-step what occurred..."
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-dark-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
