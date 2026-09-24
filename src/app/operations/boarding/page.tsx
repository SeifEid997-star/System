"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Home,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  Send,
  User,
  Heart,
  Utensils,
  Pill,
  Sparkles,
  Receipt,
  Phone,
  Eye,
  X,
} from "lucide-react";
import Link from "next/link";

interface BoardingRoomVM {
  id: string;
  roomNumber: string;
  type: "STANDARD" | "DELUXE" | "SUITE" | "ISOLATION";
  pricePerDay: number;
  status: "OCCUPIED" | "VACANT" | "CLEANING";
  reservationId: string | null;
  currentPet?: {
    animalId: string;
    name: string;
    species: string;
    owner: string;
    phone: string;
    checkIn: string;
    checkOut: string;
    days: number;
    dailyRate: number;
  };
}

interface AnimalOption {
  id: string;
  name: string;
  species: string;
  owner: { name: string };
}

export default function BoardingPage() {
  const [rooms, setRooms] = useState<BoardingRoomVM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<BoardingRoomVM | null>(null);

  const [animals, setAnimals] = useState<AnimalOption[]>([]);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [roomError, setRoomError] = useState("");
  const [roomForm, setRoomForm] = useState({ roomNumber: "", roomType: "STANDARD", capacity: 1, pricePerDay: 250 });
  const [isSavingReservation, setIsSavingReservation] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    roomId: "",
    animalId: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    dailyRate: 250,
    specialInstructions: "",
  });

  // Daily Log form state for the currently viewed active stay
  const [morningFed, setMorningFed] = useState(true);
  const [eveningFed, setEveningFed] = useState(true);
  const [medsGiven, setMedsGiven] = useState(true);
  const [petCondition, setPetCondition] = useState("Energetic and playful, ate full portion.");
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [isSavingLog, setIsSavingLog] = useState(false);

  // Caregiver Todo tasks (internal checklist, not part of the data model)
  const [todoTasks, setTodoTasks] = useState([
    { id: 1, text: "Morning park walk & relief (20 mins)", done: true },
    { id: 2, text: "Administer Joint Supplement Chews with breakfast", done: true },
    { id: 3, text: "Evening grooming brush & ear inspection", done: false },
    { id: 4, text: "Sanitize water bowl & fresh refill", done: false },
  ]);

  const toggleTask = (id: number) => {
    setTodoTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const loadRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/boarding/rooms");
      const data = await res.json();
      const list: BoardingRoomVM[] = data.rooms || [];
      setRooms(list);
      setSelectedRoom((prev) => {
        if (prev) {
          const refreshed = list.find((r) => r.id === prev.id);
          if (refreshed) return refreshed;
        }
        return list.find((r) => r.status === "OCCUPIED") || null;
      });
    } catch (err) {
      console.error("Failed to load boarding rooms:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const openReservationModal = (room?: BoardingRoomVM) => {
    setReservationForm((prev) => ({
      ...prev,
      roomId: room?.id || rooms.find((r) => r.status === "VACANT")?.id || "",
      dailyRate: room?.pricePerDay || prev.dailyRate,
    }));
    if (animals.length === 0) {
      fetch("/api/animals")
        .then((res) => res.json())
        .then((data) => setAnimals(data.animals || []))
        .catch((err) => console.error("Failed to load animals:", err));
    }
    setIsReservationModalOpen(true);
  };

  const handleRoomClick = (room: BoardingRoomVM) => {
    if (room.status === "OCCUPIED") {
      setSelectedRoom(room);
    } else {
      openReservationModal(room);
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationForm.roomId || !reservationForm.animalId || isSavingReservation) return;

    setIsSavingReservation(true);
    try {
      const res = await fetch("/api/boarding/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservationForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create reservation");

      setIsReservationModalOpen(false);
      await loadRooms();
    } catch (err) {
      console.error(err);
      alert("تعذر إنشاء الحجز، حاول مرة أخرى.");
    } finally {
      setIsSavingReservation(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingRoom) return;
    setRoomError("");
    setIsSavingRoom(true);
    try {
      const res = await fetch("/api/boarding/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create room");
      setIsRoomModalOpen(false);
      setRoomForm({ roomNumber: "", roomType: "STANDARD", capacity: 1, pricePerDay: 250 });
      await loadRooms();
    } catch (err) {
      setRoomError(err instanceof Error ? err.message : "Could not create room. Try again.");
    } finally {
      setIsSavingRoom(false);
    }
  };

  const handleSendWhatsappUpdate = async () => {
    if (!selectedRoom?.reservationId || isSavingLog) return;

    setIsSavingLog(true);
    try {
      const res = await fetch("/api/boarding/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: selectedRoom.reservationId,
          generalCondition: petCondition,
          appetiteFed: morningFed && eveningFed,
          medicationsGiven: medsGiven,
          notes: petCondition,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save daily log");

      setWhatsappSent(true);
      setTimeout(() => setWhatsappSent(false), 3000);
    } catch (err) {
      console.error(err);
      alert("تعذر حفظ السجل اليومي، حاول مرة أخرى.");
    } finally {
      setIsSavingLog(false);
    }
  };

  const activeStay = selectedRoom?.currentPet;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Pet Boarding &bull; Hotel Management (فندقة الحيوانات)
            </h1>
            <Badge variant="brand" dot>
              Room Calendar &amp; Daily Logs
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual room occupancy calendar, daily caregiver logs, and boarding billing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => { setRoomError(""); setIsRoomModalOpen(true); }}
          >
            Add Boarding Room
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => openReservationModal()}
          >
            New Reservation
          </Button>
        </div>
      </div>

      {/* 1. VISUAL ROOM OCCUPANCY CALENDAR */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-border">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Room Occupancy Visual Grid (إشغال الغرف المرئي)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Occupied
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Vacant
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Cleaning
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
          {rooms.map((room) => {
            const isSelected = selectedRoom?.id === room.id;
            return (
              <div
                key={room.id}
                onClick={() => handleRoomClick(room)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-brand-50/70 border-brand-500 shadow-md dark:bg-brand-950/40"
                    : "bg-white dark:bg-dark-card border-slate-100 dark:border-dark-border hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {room.roomNumber}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        room.status === "OCCUPIED"
                          ? "bg-rose-500"
                          : room.status === "CLEANING"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {room.type} &bull; {room.pricePerDay} EGP/day
                  </div>

                  {room.currentPet ? (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                      <div className="font-semibold text-slate-800 dark:text-white">
                        {room.currentPet.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{room.currentPet.species}</div>
                      <div className="text-[10px] text-brand-600 font-semibold mt-1">
                        Out: {room.currentPet.checkOut}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 text-center text-xs text-slate-400 font-medium py-2">
                      Ready for booking
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-dark-border text-right">
                  <span className="text-[11px] font-semibold text-brand-600 hover:underline">
                    {room.status === "OCCUPIED" ? "View Stay Log" : "Assign Guest"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </Card>

      {/* 2. RESERVATION DETAILS, FINANCIALS & DAILY CARE LOG */}
      {activeStay && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Financials & Daily Care Todo (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Financial Breakdown */}
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Stay Financials &bull; {activeStay.name}
              </h4>
              <Badge variant="brand">{activeStay.days} Days</Badge>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>
                  Room Rate ({activeStay.dailyRate} EGP &times; {activeStay.days} days)
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {(activeStay.dailyRate * activeStay.days).toLocaleString()} EGP
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-dark-border">
                <span>Total Boarding Charge</span>
                <span className="text-brand-700 dark:text-brand-400">
                  {(activeStay.dailyRate * activeStay.days).toLocaleString()} EGP
                </span>
              </div>

              <Link href="/operations/invoices">
                <Button size="sm" variant="secondary" className="w-full mt-2 font-bold" leftIcon={<Receipt className="w-4 h-4" />}>
                  Create Boarding Invoice
                </Button>
              </Link>
            </div>
          </Card>

          {/* Caregiver Internal Todo Checklist */}
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Daily Care Tasks &amp; Schedule
              </h4>
              <span className="text-[11px] text-slate-400">Shift Todo</span>
            </div>

            <div className="space-y-2 mt-4">
              {todoTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => toggleTask(t.id)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs transition-colors ${
                    t.done
                      ? "bg-slate-50 border-slate-200 text-slate-400 line-through dark:bg-slate-800/30 dark:border-dark-border"
                      : "bg-white border-slate-200 text-slate-800 font-medium dark:bg-dark-card dark:border-dark-border dark:text-slate-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => {}}
                    className="w-3.5 h-3.5 rounded text-brand-600"
                  />
                  <span>{t.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Daily Log & WhatsApp Owner Update (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Daily Pet Care Log (السجل الصحي والغذائي اليومي)
                </h4>
                <p className="text-xs text-slate-400">Logged by attending kennel supervisor</p>
              </div>
              <Badge variant="success" dot>Today&apos;s Check</Badge>
            </div>

            <div className="space-y-4 mt-4">
              {/* Nutrition & Medication Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-dark-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-white">
                    <Utensils className="w-4 h-4 text-brand-600" />
                    <span>Morning Meal</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={morningFed}
                    onChange={(e) => setMorningFed(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-dark-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-white">
                    <Utensils className="w-4 h-4 text-amber-500" />
                    <span>Evening Meal</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={eveningFed}
                    onChange={(e) => setEveningFed(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-dark-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-white">
                    <Pill className="w-4 h-4 text-rose-500" />
                    <span>Meds Given</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={medsGiven}
                    onChange={(e) => setMedsGiven(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600"
                  />
                </div>
              </div>

              {/* Condition notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Daily Behavior &amp; Condition Observations
                </label>
                <textarea
                  rows={3}
                  value={petCondition}
                  onChange={(e) => setPetCondition(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* AUTOMATED WHATSAPP NOTIFICATION PREVIEW */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    <Send className="w-4 h-4 text-emerald-600" />
                    <span>Daily Stay Update Preview</span>
                  </div>
                  <Badge variant="neutral">Preview only</Badge>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-dark-card border border-emerald-100 text-xs text-slate-700 dark:text-slate-200 font-mono">
                  &ldquo;Hello {activeStay.owner}! 🐾 Daily PetPals Hotel update for {activeStay.name}:
                  Meals enjoyed ✅, Medication administered ✅, Condition: {petCondition}. He is doing wonderfully!&rdquo;
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSendWhatsappUpdate}
                  disabled={isSavingLog}
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  {isSavingLog
                    ? "Saving..."
                    : whatsappSent
                    ? "Daily Log Saved"
                    : "Save Daily Care Log"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      )}

      {/* NEW RESERVATION MODAL */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Boarding Room</h3>
                <p className="text-xs text-slate-500">Add a room to the occupancy grid before booking a stay.</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setIsRoomModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              {roomError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{roomError}</p>}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Room Number *</label>
                <input required minLength={1} maxLength={40} value={roomForm.roomNumber} onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Room Type</label>
                  <select value={roomForm.roomType} onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white">
                    <option value="STANDARD">Standard</option><option value="DELUXE">Deluxe</option><option value="SUITE">Suite</option><option value="ISOLATION">Isolation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Capacity</label>
                  <input type="number" required min="1" max="100" step="1" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rate / Day (EGP)</label>
                  <input type="number" required min="0.01" max="100000000" step="0.01" value={roomForm.pricePerDay} onChange={(e) => setRoomForm({ ...roomForm, pricePerDay: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-dark-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsRoomModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSavingRoom}>{isSavingRoom ? "Saving..." : "Save Room"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReservationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                New Boarding Reservation (حجز فندقة جديد)
              </h3>
              <button
                onClick={() => setIsReservationModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Room *
                </label>
                <select
                  required
                  value={reservationForm.roomId}
                  onChange={(e) => {
                    const room = rooms.find((r) => r.id === e.target.value);
                    setReservationForm({
                      ...reservationForm,
                      roomId: e.target.value,
                      dailyRate: room?.pricePerDay || reservationForm.dailyRate,
                    });
                  }}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select a room...</option>
                  {rooms
                    .filter((r) => r.status !== "OCCUPIED")
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.roomNumber} &bull; {r.type} &bull; {r.pricePerDay} EGP/day
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pet *
                </label>
                <select
                  required
                  value={reservationForm.animalId}
                  onChange={(e) => setReservationForm({ ...reservationForm, animalId: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select a pet...</option>
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.species}) &mdash; {a.owner.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Check-in *
                  </label>
                  <input
                    type="date"
                    required
                    value={reservationForm.startDate}
                    onChange={(e) => setReservationForm({ ...reservationForm, startDate: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Check-out *
                  </label>
                  <input
                    type="date"
                    required
                    value={reservationForm.endDate}
                    onChange={(e) => setReservationForm({ ...reservationForm, endDate: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Daily Rate (EGP)
                </label>
                <input
                  type="number"
                  min="0"
                  value={reservationForm.dailyRate}
                  onChange={(e) =>
                    setReservationForm({ ...reservationForm, dailyRate: Number(e.target.value) })
                  }
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Special Instructions
                </label>
                <textarea
                  rows={2}
                  value={reservationForm.specialInstructions}
                  onChange={(e) =>
                    setReservationForm({ ...reservationForm, specialInstructions: e.target.value })
                  }
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-dark-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReservationModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSavingReservation}>
                  {isSavingReservation ? "Saving..." : "Confirm Check-in"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
