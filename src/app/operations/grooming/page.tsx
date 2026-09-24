"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Scissors,
  Plus,
  Receipt,
  X,
} from "lucide-react";
import Link from "next/link";

interface GroomingSessionRow {
  id: string;
  pet: string;
  species: string;
  owner: string;
  phone: string;
  service: string;
  stylist: string;
  time: string;
  price: number;
  status: string;
}

interface AnimalOption {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  owner: { name: string };
}

export default function GroomingPage() {
  const [sessions, setSessions] = useState<GroomingSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [animals, setAnimals] = useState<AnimalOption[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    animalId: "",
    service: "",
    stylist: "Ahmed - Groomer",
    price: "",
  });

  const loadSessions = () => {
    setLoading(true);
    fetch("/api/grooming")
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const openModal = async () => {
    setShowModal(true);
    if (animals.length === 0) {
      const res = await fetch("/api/animals");
      const data = await res.json();
      setAnimals(data.animals || []);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.animalId || !form.service) return;
    setSaving(true);
    try {
      const res = await fetch("/api/grooming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId: form.animalId,
          service: form.service,
          stylist: form.stylist,
          price: parseFloat(form.price) || 0,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ animalId: "", service: "", stylist: "Ahmed - Groomer", price: "" });
        loadSessions();
      }
    } finally {
      setSaving(false);
    }
  };

  const markCompleted = async (id: string) => {
    await fetch(`/api/grooming/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    loadSessions();
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Grooming &amp; Spa (صالون تجميل الحيوانات)
            </h1>
            <Badge variant="brand" dot>Live Salon Queue</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Grooming sessions, nail clipping, hygienic cuts, and direct cashier billing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openModal}>
            Book Grooming
          </Button>
        </div>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-3xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">
          No grooming sessions booked yet. Click "Book Grooming" to add the first one.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {sessions.map((sess) => (
            <Card key={sess.id} hoverEffect className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-brand-600" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{sess.pet}</span>
                  </div>
                  <Badge
                    variant={
                      sess.status === "COMPLETED"
                        ? "success"
                        : sess.status === "IN_PROGRESS"
                        ? "brand"
                        : "warning"
                    }
                    dot
                  >
                    {sess.status}
                  </Badge>
                </div>

                <div className="space-y-2 mt-3 text-xs">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {sess.service}
                  </div>
                  <div className="text-slate-400">
                    Owner: {sess.owner} &bull; {sess.phone}
                  </div>
                  <div className="text-slate-400">
                    Stylist: <span className="text-slate-700 dark:text-slate-300 font-medium">{sess.stylist}</span>
                  </div>
                  <div className="text-brand-700 dark:text-brand-400 font-bold">
                    {formatTime(sess.time)}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border flex items-center justify-between">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {sess.price} EGP
                </span>

                <div className="flex items-center gap-2">
                  {sess.status !== "COMPLETED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => markCompleted(sess.id)}
                    >
                      Mark Done
                    </Button>
                  )}
                  <Link href="/operations/pos">
                    <Button size="sm" variant="amber" className="h-8 text-xs" leftIcon={<Receipt className="w-3.5 h-3.5" />}>
                      Collect &amp; Bill
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-card rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Book Grooming Session</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleBook} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Pet</label>
                <select
                  required
                  value={form.animalId}
                  onChange={(e) => setForm({ ...form, animalId: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5"
                >
                  <option value="">Select pet...</option>
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.breed || a.species}) — {a.owner.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Service</label>
                <input
                  required
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                  placeholder="Full Luxury Grooming & Bath"
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Stylist</label>
                  <input
                    value={form.stylist}
                    onChange={(e) => setForm({ ...form, stylist: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Price (EGP)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5"
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={saving}>
                {saving ? "Booking..." : "Confirm Booking"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
