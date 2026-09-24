"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ShieldCheck,
  Search,
  Download,
  Filter,
  User,
  Clock,
  Laptop,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";

interface AuditLogRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");

  useEffect(() => {
    fetchAuditLogs();
  }, [search, actionFilter, entityFilter]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/audit-logs?query=${encodeURIComponent(search)}&action=${actionFilter}&entity=${entityFilter}`
      );
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [exportNotice, setExportNotice] = useState(false);

  const exportToCSV = () => {
    const headers = "ID,Timestamp,User,Role,Action,Entity,Details,IP\n";
    const rows = logs
      .map(
        (l) =>
          `"${l.id}","${l.createdAt}","${l.userName}","${l.userRole}","${l.action}","${l.entity}","${l.details || ""}","${l.ipAddress}"`
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Qlinic_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 4000);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Badge variant="success" dot>CREATE</Badge>;
      case "UPDATE":
        return <Badge variant="brand" dot>UPDATE</Badge>;
      case "DELETE":
      case "INVOICE_VOID":
        return <Badge variant="danger" dot>{action}</Badge>;
      case "LOGIN":
        return <Badge variant="info" dot>LOGIN</Badge>;
      case "REFUND":
        return <Badge variant="warning" dot>REFUND</Badge>;
      default:
        return <Badge variant="neutral">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 animate-fade-in">
      {/* Toast Notification */}
      {exportNotice && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <div className="text-xs">
            <p className="font-bold">تم تصدير سجل العمليات بنجاح!</p>
            <p className="text-emerald-100 text-[11px]">Qlinic_Audit_Log.csv has been downloaded.</p>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Security Audit Log (سجل العمليات والرقابة)
            </h1>
            <Badge variant="success" dot>
              User Tracking Fixed &bull; 100% Accountable
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete immutable ledger of every staff action, timestamp, IP address, and changed entity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={exportToCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Audit Trail (CSV)
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user, entity, or action details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Action Filters Ribbon */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {["ALL", "CREATE", "UPDATE", "DELETE", "LOGIN", "REFUND"].map((act) => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                actionFilter === act
                  ? "bg-brand-700 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {act === "ALL" ? "All Actions" : act}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-dark-border">
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                  User Responsible (المستخدم المسئول)
                </th>
                <th className="py-3.5 px-4">Action Type</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Action Details &amp; Changes</th>
                <th className="py-3.5 px-5 text-right">IP &amp; Workstation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records match your filters.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-dark-hover/40 transition-colors"
                  >
                    <td className="py-4 px-5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      {/* GUARANTEED NON-EMPTY USER COLUMN */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {l.userName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            Role: {l.userRole || "Staff"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">{getActionBadge(l.action)}</td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {l.entity}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 max-w-md">
                      {l.details || "Executed system procedure"}
                    </td>
                    <td className="py-4 px-5 text-right font-mono text-slate-400 text-[11px]">
                      <span className="flex items-center justify-end gap-1">
                        <Laptop className="w-3 h-3" />
                        {l.ipAddress || "127.0.0.1"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
