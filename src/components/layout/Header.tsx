"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Moon,
  Sun,
  Bell,
  Building2,
  ChevronDown,
  User,
  Plus,
  LogOut,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Syringe,
  X,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [activeBranch, setActiveBranch] = useState("Dokki Main Branch");
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [branchToast, setBranchToast] = useState("");

  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      title: "Rabies Booster Due",
      message: "Max (Golden Retriever) is scheduled for annual vaccination today.",
      time: "10 mins ago",
      type: "VACCINE",
      unread: true,
    },
    {
      id: "notif-2",
      title: "Low Inventory Stock Alert",
      message: "Bravecto Chewable 20-40kg reached reorder threshold (4 remaining).",
      time: "45 mins ago",
      type: "ALERT",
      unread: true,
    },
    {
      id: "notif-3",
      title: "New Client Appointment",
      message: "Bella - Feline checkup booked with Dr. Sara for 03:30 PM.",
      time: "1 hour ago",
      type: "APPOINTMENT",
      unread: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    // Check initial branch
    const savedBranch = localStorage.getItem("qlinic_active_branch");
    if (savedBranch) {
      setActiveBranch(savedBranch);
    }
  }, []);

  const handleSwitchBranch = (b: string) => {
    setActiveBranch(b);
    localStorage.setItem("qlinic_active_branch", b);
    setIsBranchMenuOpen(false);
    setBranchToast(`تم التبديل بنجاح إلى: ${b}`);
    setTimeout(() => setBranchToast(""), 3500);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  useEffect(() => {
    // Check initial theme from document or system preference
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
      setIsDark(true);
    }
  };

  const branches = [
    "Dokki Main Branch",
    "New Cairo Branch",
    "Sheikh Zayed Branch",
  ];

  return (
    <header className="h-16 bg-white dark:bg-dark-card border-b border-slate-200/80 dark:border-dark-border px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Branch Switch Notification Toast */}
      {branchToast && (
        <div className="fixed top-20 right-8 z-50 bg-teal-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-teal-200" />
          <div className="text-xs">
            <p className="font-bold">تم تغيير الفرع الحالي</p>
            <p className="text-teal-100 text-[11px]">{branchToast}</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search animals, clients, invoices, cases... (Ctrl + K)"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Quick New Button */}
        <Link href="/operations/reception">
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            New Reception
          </Button>
        </Link>

        {/* Branch Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>{activeBranch}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isBranchMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-card rounded-xl shadow-xl border border-slate-200 dark:border-dark-border py-1 z-50 animate-slide-up">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-dark-border">
                Switch Operating Facility
              </div>
              {branches.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleSwitchBranch(b)}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center justify-between ${
                    activeBranch === b
                      ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-hover"
                  }`}
                >
                  <span>{b}</span>
                  {activeBranch === b && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dark Mode Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors relative"
            title="Clinic Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
              </>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-slate-200 dark:border-dark-border p-4 z-50 animate-slide-up space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-2.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Clinic Alerts &amp; Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {unreadCount} New
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotificationsOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl border text-xs transition-colors flex items-start gap-2.5 ${
                      n.unread
                        ? "bg-brand-50/60 dark:bg-brand-950/30 border-brand-200 dark:border-brand-900/50"
                        : "bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-dark-border opacity-75"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-dark-card flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      {n.type === "VACCINE" ? (
                        <Syringe className="w-3.5 h-3.5 text-teal-600" />
                      ) : n.type === "ALERT" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Calendar className="w-3.5 h-3.5 text-brand-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2 shrink-0">
                          {n.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-dark-border text-center">
                <Link
                  href="/operations/reminders"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline block"
                >
                  View All Clinical Reminders &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Active Staff Profile & Menu */}
        <div className="relative pl-2 border-l border-slate-200 dark:border-dark-border">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {user?.name || "Dr. Omar Khaled"}
              </div>
              <div className="text-[10px] font-medium text-brand-600 dark:text-brand-400">
                {user?.jobTitle || "Clinic Owner"}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-slate-200 dark:border-dark-border p-2 z-50 animate-slide-up">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-dark-border mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                  {user?.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block truncate">
                  {user?.email}
                </span>
                <span className="inline-block mt-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  Role: {user?.role}
                </span>
              </div>

              <Link
                href="/superadmin"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>SuperAdmin SaaS Portal</span>
              </Link>

              <Link
                href="/settings/reset"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span>Zero-Out Clinic Database</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-xl transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                <span>Sign Out (تسجيل الخروج)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
