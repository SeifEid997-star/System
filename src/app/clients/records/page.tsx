"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, Plus, Dog, Contact } from "lucide-react";
import Link from "next/link";

interface ClientRecord {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  petsCount: number;
  petsNames: string;
  lastVisit: string;
  nextAppt: string;
  balance: number;
  openTickets: number;
}

export default function ClientRecordsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/clients");
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        if (!cancelled) setClients(json.clients || []);
      } catch {
        if (!cancelled) setError("Could not load client records.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredClients = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search) ||
          c.petsNames.toLowerCase().includes(search.toLowerCase())
      ),
    [clients, search]
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Client Records &amp; Accounts (سجلات العملاء)
            </h1>
            <Badge variant="brand" dot>
              {clients.length} Registered Owners
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pet owners directory, registered animals, accounts receivable balances, and open support tickets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/operations/reception">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Register New Client
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, phone, or pet name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-slate-500">{error}</div>
        ) : filteredClients.length === 0 ? (
          <EmptyState
            icon={<Contact className="w-10 h-10 text-slate-400 dark:text-slate-500" />}
            title="No clients found"
            description={
              search
                ? "Try a different search term."
                : "No client records yet — register a new client from Reception."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-dark-border">
                  <th className="py-3.5 px-5">Client Name</th>
                  <th className="py-3.5 px-4">Phone / WhatsApp</th>
                  <th className="py-3.5 px-4">Registered Pets</th>
                  <th className="py-3.5 px-4">Last Visit</th>
                  <th className="py-3.5 px-4">Next Appointment</th>
                  <th className="py-3.5 px-4 text-right">Account Balance</th>
                  <th className="py-3.5 px-4 text-center">Support Tickets</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/60 dark:hover:bg-dark-hover/40 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 dark:text-white">{client.name}</div>
                      <div className="text-[11px] text-slate-400">{client.email || "No email on file"}</div>
                    </td>
                    <td className="py-4 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {client.phone}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <Dog className="w-3.5 h-3.5 text-brand-600" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {client.petsNames}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-500">{client.lastVisit}</td>
                    <td className="py-4 px-4 font-semibold text-brand-700 dark:text-brand-400">
                      {client.nextAppt}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`font-bold ${
                          client.balance > 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {client.balance > 0 ? `${client.balance.toLocaleString()} EGP Due` : "Zero Balance"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge variant={client.openTickets > 0 ? "warning" : "neutral"} dot className="text-[10px]">
                        {client.openTickets > 0 ? `${client.openTickets} Open` : "None Open"}
                      </Badge>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link href="/operations/reception">
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2.5">
                          New Visit
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
