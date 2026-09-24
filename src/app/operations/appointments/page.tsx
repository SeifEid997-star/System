"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface RawAppointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  type: string;
  status: string;
  reason: string | null;
  animal: {
    name: string;
    species: string;
    owner: { name: string; phone: string } | null;
  } | null;
  veterinarian: { name: string } | null;
}

interface AppointmentItem {
  id: string;
  time: string;
  dateLabel: string;
  dateKey: string;
  petName: string;
  species: string;
  owner: string;
  phone: string;
  type: string;
  vet: string;
  status: string;
}

const STATUS_OPTIONS = ["ALL", "SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function labelForDate(dateKey: string, todayKey: string, tomorrowKey: string) {
  if (dateKey === todayKey) return "Today";
  if (dateKey === tomorrowKey) return "Tomorrow";
  return new Date(dateKey).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function badgeVariant(status: string): "success" | "brand" | "danger" | "warning" {
  if (status === "COMPLETED") return "success";
  if (status === "IN_PROGRESS") return "brand";
  if (status === "CANCELLED" || status === "NO_SHOW") return "danger";
  return "warning";
}

export default function AppointmentsPage() {
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);

    fetch(`/api/appointments?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        const raw: RawAppointment[] = data.appointments || [];
        const today = new Date();
        const todayKey = toDateKey(today);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowKey = toDateKey(tomorrow);

        const mapped: AppointmentItem[] = raw.map((a) => {
          const dKey = toDateKey(new Date(a.appointmentDate));
          return {
            id: a.id,
            time: a.appointmentTime,
            dateLabel: labelForDate(dKey, todayKey, tomorrowKey),
            dateKey: dKey,
            petName: a.animal?.name || "Unknown",
            species: a.animal?.species || "-",
            owner: a.animal?.owner?.name || "-",
            phone: a.animal?.owner?.phone || "-",
            type: a.type,
            vet: a.veterinarian?.name || "Unassigned",
            status: a.status,
          };
        });

        setAppointments(mapped);
      })
      .catch((err) => console.error("Failed to load appointments:", err))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  // Build the visible week (Mon-Sun) around today + weekOffset, with real counts.
  const weekDays = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun..6=Sat
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset + weekOffset * 7);

    const todayKey = toDateKey(now);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = toDateKey(d);
      return {
        key,
        name: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: appointments.filter((a) => a.dateKey === key).length,
        active: key === todayKey,
      };
    });
  }, [appointments, weekOffset]);

  const visibleAppointments = useMemo(() => {
    if (viewMode !== "calendar") return appointments;
    // In calendar mode, show appointments for the currently displayed week.
    const weekKeys = new Set(weekDays.map((d) => d.key));
    return appointments.filter((a) => weekKeys.has(a.dateKey));
  }, [appointments, weekDays, viewMode]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Appointments &bull; Visual Schedule
            </h1>
            <Badge variant="brand" dot>
              Live Data
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time appointment calendar with doctor assignment, schedule management, and instant case opening.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-700 dark:text-slate-300 px-3 py-2 outline-none focus:border-brand-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All Statuses" : s.replace("_", " ")}
              </option>
            ))}
          </select>

          {/* Toggle View Mode */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-dark-border">
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "calendar"
                  ? "bg-white dark:bg-dark-card text-brand-700 dark:text-brand-300 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-white dark:bg-dark-card text-brand-700 dark:text-brand-300 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Table List
            </button>
          </div>

          <Link href="/operations/reception">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Book Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* Week Navigation Header (Calendar View Mode) */}
      {viewMode === "calendar" && (
        <div className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-2 hover:text-brand-600"
              >
                Today
              </button>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days Ribbon */}
          <div className="grid grid-cols-7 gap-2 mt-3">
            {weekDays.map((d) => (
              <div
                key={d.key}
                className={`p-3 rounded-2xl text-center border transition-all cursor-pointer ${
                  d.active
                    ? "bg-brand-50 text-brand-800 border-brand-500 font-bold shadow-sm dark:bg-brand-950/60 dark:text-brand-300"
                    : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <div className="text-[11px] uppercase tracking-wider">{d.name}</div>
                <div className="text-base font-bold my-0.5">{d.date.split(" ")[1]}</div>
                <div className="text-[10px] font-semibold opacity-75">{d.count} appointments</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : visibleAppointments.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            No appointments found for this view.
          </p>
        </Card>
      ) : viewMode === "calendar" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleAppointments.map((apt) => (
            <Card key={apt.id} hoverEffect className="relative overflow-hidden flex flex-col justify-between">
              <div
                className={`absolute top-0 left-0 w-1.5 h-full ${
                  apt.status === "COMPLETED"
                    ? "bg-emerald-500"
                    : apt.status === "IN_PROGRESS"
                    ? "bg-brand-600"
                    : apt.status === "CANCELLED" || apt.status === "NO_SHOW"
                    ? "bg-rose-500"
                    : "bg-amber-500"
                }`}
              />

              <div>
                <div className="flex items-center justify-between pl-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Clock className="w-3.5 h-3.5 text-brand-600" />
                    <span>{apt.time}</span>
                    <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                    <span className="text-slate-400 font-medium">{apt.dateLabel}</span>
                  </div>
                  <Badge variant={badgeVariant(apt.status)} dot>
                    {apt.status.replace("_", " ")}
                  </Badge>
                </div>

                <div className="mt-3 pl-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {apt.petName}
                    </h4>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                      {apt.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {apt.species} &bull; Owner: {apt.owner}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border pl-2 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Vet: <span className="font-semibold text-slate-700 dark:text-slate-200">{apt.vet}</span>
                </div>

                <Link href="/operations/medical-cases">
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                    Consultation
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100 dark:border-dark-border pb-2">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Owner</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Veterinarian</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {visibleAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/70 dark:hover:bg-dark-hover/50">
                    <td className="py-3 text-slate-500 dark:text-slate-400">{apt.dateLabel}</td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">{apt.time}</td>
                    <td className="py-3">
                      <div className="font-bold text-slate-800 dark:text-white">{apt.petName}</div>
                      <div className="text-[10px] text-slate-400">{apt.species}</div>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{apt.owner}</td>
                    <td className="py-3 font-medium">{apt.type}</td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{apt.vet}</td>
                    <td className="py-3">
                      <Badge variant={badgeVariant(apt.status)} dot>
                        {apt.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Link href="/operations/medical-cases">
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2.5">
                          Open Case
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
