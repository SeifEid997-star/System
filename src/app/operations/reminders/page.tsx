"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  BellRing,
  Plus,
  Send,
  CheckCircle2,
  Calendar,
  Clock,
  Dog,
  Phone,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Check,
} from "lucide-react";

interface ReminderItem {
  id: string;
  patientName: string;
  species: string;
  ownerName: string;
  ownerPhone: string;
  type: string;
  description: string;
  dueDate: string; // ISO string from the API
  status: "PENDING" | "SENT" | "COMPLETED" | "DISMISSED";
  isOverdue?: boolean;
}

interface AnimalOption {
  id: string;
  name: string;
  species: string;
  owner: { id: string; name: string; phone: string };
}

function formatDueDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (diffDays === 0) return `Today (${dateLabel})`;
  if (diffDays === 1) return `Tomorrow (${dateLabel})`;
  return dateLabel;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "TODAY" | "OVERDUE">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [animalQuery, setAnimalQuery] = useState("");
  const [animalResults, setAnimalResults] = useState<AnimalOption[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalOption | null>(null);

  const [newReminder, setNewReminder] = useState({
    type: "VACCINATION",
    description: "",
    dueDate: "",
  });

  const loadReminders = useCallback(async () => {
    try {
      const res = await fetch("/api/reminders");
      const data = await res.json();
      setReminders(data.reminders || []);
    } catch (err) {
      console.error("Failed to load reminders:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  // Live animal search for the "pick a patient" field in the modal
  useEffect(() => {
    if (animalQuery.trim().length < 2) {
      setAnimalResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/animals?query=${encodeURIComponent(animalQuery)}`);
        const data = await res.json();
        setAnimalResults(data.animals || []);
      } catch (err) {
        console.error("Animal search failed:", err);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [animalQuery]);

  const todayCount = reminders.filter((r) => formatDueDate(r.dueDate).startsWith("Today")).length;
  const overdueCount = reminders.filter((r) => r.isOverdue).length;

  const filteredReminders = reminders.filter((r) => {
    if (activeTab === "TODAY") return formatDueDate(r.dueDate).startsWith("Today");
    if (activeTab === "OVERDUE") return r.isOverdue;
    return true;
  });

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update reminder");
  };

  const handleSendWhatsApp = async (item: ReminderItem) => {
    const text = encodeURIComponent(
      `مرحباً أستاذ/ة ${item.ownerName}،\n` +
      `نذكركم من عيادة PetPals البيطرية بموعد ${item.description} الخاص بأليفكم (${item.patientName}).\n` +
      `الموعد المقرر: ${formatDueDate(item.dueDate)}.\n` +
      `لتأكيد الحضور أو تعديل الموعد يرجى التواصل معنا.\n` +
      `صحة أليفكم أولويتنا 🐾`
    );

    window.open(`https://api.whatsapp.com/send?phone=${item.ownerPhone.replace(/[^0-9]/g, "")}&text=${text}`, "_blank");

    setToastMessage(`تم فتح رسالة واتساب لـ ${item.ownerName}. أكمل الإرسال من واتساب.`);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleMarkCompleted = async (id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status: "COMPLETED" } : r)));
    setToastMessage("تم تحديث حالة التذكير إلى مكتمل!");
    setTimeout(() => setToastMessage(""), 3000);
    try {
      await updateStatus(id, "COMPLETED");
    } catch (err) {
      console.error(err);
      alert("تعذر تحديث الحالة على السيرفر.");
    }
  };

  const handleSendAllToday = async () => {
    const todayList = reminders.filter(
      (r) => formatDueDate(r.dueDate).startsWith("Today") && r.status !== "COMPLETED"
    );
    if (todayList.length === 0) {
      alert("No pending reminders for today.");
      return;
    }

    setToastMessage(`تم تجهيز رسائل ${todayList.length} تذكير لليوم. أكمل إرسال كل رسالة في واتساب.`);
    setTimeout(() => setToastMessage(""), 4000);

    // Opening a WhatsApp composer does not confirm delivery, so keep status pending.
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal || isSaving) return;
    const submittedDate = (e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement | null)?.value || newReminder.dueDate;
    if (!submittedDate) return;

    setIsSaving(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId: selectedAnimal.id,
          reminderType: newReminder.type,
          dueDate: submittedDate,
          channel: "WHATSAPP",
          notes: newReminder.description || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create reminder");

      setReminders((prev) => [data.reminder, ...prev]);
      setIsModalOpen(false);
      setSelectedAnimal(null);
      setAnimalQuery("");
      setNewReminder({ type: "VACCINATION", description: "", dueDate: "" });
      setToastMessage(`تمت جدولة التذكير بنجاح لـ ${data.reminder.patientName}!`);
      setTimeout(() => setToastMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "تعذر حفظ التذكير. حاول مرة أخرى.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <div className="text-xs">
            <p className="font-bold">نجحت العملية</p>
            <p className="text-emerald-100 text-[11px]">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Smart Clinical Reminders Engine (منظومة التذكيرات الذكية)
            </h1>
            <Badge variant="brand" dot>WhatsApp &amp; SMS</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated booster alerts, seasonal deworming schedules, post-operative suture removal, and wellness follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSendAllToday}
            leftIcon={<Send className="w-4 h-4 text-emerald-600" />}
          >
            Dispatch Today&apos;s Reminders
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Schedule New Reminder
          </Button>
        </div>
      </div>

      {/* Filter Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-dark-border pb-3">
        {[
          { id: "ALL", label: "All Reminders", count: reminders.length },
          { id: "TODAY", label: "Due Today", count: todayCount },
          { id: "OVERDUE", label: "Overdue", count: overdueCount },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-brand-600 text-white shadow-md shadow-brand-600/20"
                : "bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Reminders List Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : (
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-dark-border">
                <th className="py-3.5 px-5">Patient &amp; Owner</th>
                <th className="py-3.5 px-4">Reminder Type &amp; Purpose</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {filteredReminders.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-dark-hover/40 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold">
                        <Dog className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white">
                          {r.patientName} <span className="text-[10px] font-normal text-slate-400">({r.species})</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {r.ownerName} • <span className="font-mono">{r.ownerPhone}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{r.description}</div>
                    <Badge variant="neutral" className="text-[9px] mt-0.5">
                      {r.type}
                    </Badge>
                  </td>

                  <td className="py-4 px-4">
                    <span className={`font-bold ${r.isOverdue ? "text-rose-600" : "text-slate-900 dark:text-white"}`}>
                      {formatDueDate(r.dueDate)}
                    </span>
                    {r.isOverdue && (
                      <span className="block text-[10px] text-rose-500 font-semibold">Overdue Warning</span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-center">
                    <Badge
                      variant={
                        r.status === "COMPLETED"
                          ? "success"
                          : r.status === "SENT"
                          ? "brand"
                          : r.isOverdue
                          ? "danger"
                          : "warning"
                      }
                      dot
                      className="text-[10px]"
                    >
                      {r.status}
                    </Badge>
                  </td>

                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendWhatsApp(r)}
                        leftIcon={<MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                        className="text-xs"
                      >
                        WhatsApp
                      </Button>
                      {r.status !== "COMPLETED" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleMarkCompleted(r.id)}
                          leftIcon={<Check className="w-3.5 h-3.5 text-brand-600" />}
                          className="text-xs"
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* SCHEDULE REMINDER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-600/20">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Schedule New Reminder (جدولة إشعار تذكير)
                  </h3>
                  <p className="text-xs text-slate-400">Automate owner recall for care continuity</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Patient (ابحث عن اسم الحيوان) *
                </label>
                {selectedAnimal ? (
                  <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 dark:bg-brand-950/30 dark:border-brand-900 p-2.5">
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{selectedAnimal.name}</span>
                      <span className="text-slate-400"> ({selectedAnimal.species})</span>
                      <div className="text-[11px] text-slate-500">
                        {selectedAnimal.owner.name} • <span className="font-mono">{selectedAnimal.owner.phone}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAnimal(null);
                        setAnimalQuery("");
                      }}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      required
                      placeholder="اكتب اسم الحيوان أو المالك..."
                      value={animalQuery}
                      onChange={(e) => setAnimalQuery(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100"
                    />
                    {animalResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-lg">
                        {animalResults.map((a) => (
                          <button
                            type="button"
                            key={a.id}
                            onClick={() => {
                              setSelectedAnimal(a);
                              setAnimalResults([]);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-dark-hover border-b border-slate-50 dark:border-dark-border last:border-0"
                          >
                            <span className="font-bold text-slate-800 dark:text-white">{a.name}</span>
                            <span className="text-slate-400"> ({a.species}) — {a.owner.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reminder Category
                  </label>
                  <select
                    value={newReminder.type}
                    onChange={(e) => setNewReminder({ ...newReminder, type: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100"
                  >
                    <option value="VACCINATION">Vaccination Booster (تطعيم)</option>
                    <option value="DEWORMING">Deworming / Flea Care (ديدان وحشرات)</option>
                    <option value="FOLLOW_UP">Post-Op / Clinical Follow-up (متابعة)</option>
                    <option value="CHECKUP">General Checkup (فحص دوري)</option>
                    <option value="BIRTHDAY">Birthday Greeting (عيد ميلاد)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date (التاريخ) *
                  </label>
                  <input
                    type="date"
                    required
                    value={newReminder.dueDate}
                    onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {errorMessage && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">تعذر حفظ التذكير: {errorMessage}</p>}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reminder Description / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Annual Rabies Booster & General Checkup"
                  value={newReminder.description}
                  onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-dark-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={!selectedAnimal || isSaving}>
                  {isSaving ? "Saving..." : "Save Reminder"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
