"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  FileSpreadsheet,
  BarChart3,
  UploadCloud,
  ShoppingBag,
  Truck,
  CreditCard,
  UserCheck,
  Dog,
  CalendarCheck,
  Stethoscope,
  Receipt,
  Home,
  Scissors,
  Store,
  Sparkles,
  ClockAlert,
  BellRing,
  Package,
  Layers,
  Contact,
  LifeBuoy,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Shield,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Reception", href: "/operations/reception", icon: UserCheck, badge: "Quick", badgeColor: "bg-brand-500/10 text-brand-600" },
      { label: "Animals", href: "/operations/animals", icon: Dog },
      { label: "Appointments", href: "/operations/appointments", icon: CalendarCheck },
      { label: "Medical Cases", href: "/operations/medical-cases", icon: Stethoscope, badge: "Core", badgeColor: "bg-emerald-500/10 text-emerald-600" },
      { label: "Invoices & Receipts", href: "/operations/invoices", icon: Receipt },
      { label: "Boarding", href: "/operations/boarding", icon: Home },
      { label: "Grooming", href: "/operations/grooming", icon: Scissors },
      { label: "Point of Sale", href: "/operations/pos", icon: Store, badge: "Multi-Pay", badgeColor: "bg-amber-500/15 text-amber-600" },
      { label: "Pending Payments", href: "/operations/pending-payments", icon: ClockAlert },
      { label: "Reminders", href: "/operations/reminders", icon: BellRing, badge: "Auto", badgeColor: "bg-sky-500/10 text-sky-600" },
      { label: "VetifyPro AI", href: "/operations/vetifypro", icon: Sparkles, badge: "AI Copilot", badgeColor: "bg-purple-500/10 text-purple-600" },
      { label: "Pet Passport", href: "/operations/passport", icon: Dog, badge: "QR", badgeColor: "bg-teal-500/10 text-teal-600" },
    ],
  },
  {
    title: "Management & Finance",
    items: [
      { label: "Staff & RBAC", href: "/management/staff", icon: Users },
      { label: "Branches", href: "/management/branches", icon: GitBranch },
      { label: "Audit Log", href: "/management/audit-log", icon: ShieldCheck, badge: "Fixed", badgeColor: "bg-emerald-500/10 text-emerald-600" },
      { label: "Daily Accounts", href: "/management/daily-accounts", icon: FileSpreadsheet },
      { label: "Analytics", href: "/management/analytics", icon: BarChart3 },
      { label: "Purchases", href: "/management/purchases", icon: ShoppingBag },
      { label: "Suppliers", href: "/management/suppliers", icon: Truck },
      { label: "Expenses", href: "/management/expenses", icon: CreditCard },
      { label: "Data Import", href: "/management/data-import", icon: UploadCloud },
    ],
  },
  {
    title: "Catalogues",
    items: [
      { label: "Inventory", href: "/catalogues/inventory", icon: Package, badge: "Batches", badgeColor: "bg-brand-500/10 text-brand-600" },
      { label: "Services", href: "/catalogues/services", icon: Layers },
    ],
  },
  {
    title: "Clients",
    items: [
      { label: "Client Records", href: "/clients/records", icon: Contact },
      { label: "Client Tickets", href: "/clients/tickets", icon: LifeBuoy },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Clinic Settings", href: "/settings/clinic", icon: Settings },
      { label: "Support", href: "/support", icon: HelpCircle },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-dark-card border-r border-slate-200/80 dark:border-dark-border flex flex-col transition-colors z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-800 to-brand-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-brand-700/20 group-hover:scale-105 transition-transform">
            Q
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                Qlinic
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800/50">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[130px]">
              PetPals Cairo
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Links with Scroll */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map((section) => {
          const isCollapsed = collapsedSections[section.title];
          return (
            <div key={section.title} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                <span>{section.title}</span>
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5 mt-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                          isActive
                            ? "bg-brand-50 text-brand-700 font-semibold shadow-sm dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/40"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-dark-hover"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={cn(
                              "w-4 h-4 transition-colors",
                              isActive
                                ? "text-brand-600 dark:text-brand-400"
                                : "text-slate-400 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"
                            )}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                              item.badgeColor || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Clinic Status Banner */}
      <div className="p-4 border-t border-slate-100 dark:border-dark-border bg-slate-50/70 dark:bg-dark-card/50 m-3 rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-800 dark:text-white">
            System Online
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Local DB &bull; Multi-Tenant Ready
        </p>
      </div>
    </aside>
  );
}
