"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  Plus,
  Search,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  Clock,
  Award,
  Lock,
  UserCheck,
  X,
} from "lucide-react";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "OWNER" | "MANAGER" | "VETERINARIAN" | "RECEPTIONIST" | "ACCOUNTANT";
  jobTitle: string | null;
  licenseNumber: string | null;
  specialization: string | null;
  experienceYears: number | null;
  shift: string | null;
  emergencyPhone: string | null;
  isActive: boolean;
  branch?: {
    name: string;
  };
}

export default function StaffPage() {
  const [staff, setStaff] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  // Add Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "VETERINARIAN",
    jobTitle: "Veterinary Physician",
    licenseNumber: "",
    specialization: "Internal Medicine",
    experienceYears: "3",
    shift: "Morning (9 AM - 5 PM)",
    emergencyPhone: "",
  });

  useEffect(() => {
    fetchStaff();
  }, [roleFilter, search]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/staff?role=${roleFilter}&query=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      if (data.users) {
        setStaff(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setFormData({ ...formData, name: "", email: "", phone: "", password: "" });
        fetchStaff();
      } else {
        setFormError(data.error || "Could not add staff member.");
      }
    } catch (e) {
      console.error(e);
      setFormError("Could not connect to the server. Try again.");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Badge variant="brand" dot>Clinic Owner (SuperAdmin)</Badge>;
      case "MANAGER":
        return <Badge variant="info" dot>Clinic Manager</Badge>;
      case "VETERINARIAN":
        return <Badge variant="success" dot>Veterinarian (MD)</Badge>;
      case "RECEPTIONIST":
        return <Badge variant="amber" dot>Receptionist</Badge>;
      case "ACCOUNTANT":
        return <Badge variant="warning" dot>Accountant</Badge>;
      default:
        return <Badge variant="neutral">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Staff &amp; Role-Based Access Control (RBAC)
            </h1>
            <Badge variant="brand" dot>
              Granular Permissions
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enforce strict security boundaries: Clinic Owner, Managers, Veterinarians, Receptionists, and Accountants.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Role Filter Tabs & Search */}
      <div className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name, title, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Roles Ribbon */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {["ALL", "OWNER", "MANAGER", "VETERINARIAN", "RECEPTIONIST", "ACCOUNTANT"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                roleFilter === r
                  ? "bg-brand-700 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {r === "ALL" ? "All Staff" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-dark-border">
                <th className="py-3.5 px-5">Staff Member</th>
                <th className="py-3.5 px-4">System Role (RBAC)</th>
                <th className="py-3.5 px-4">Branch</th>
                <th className="py-3.5 px-4">Specialization &amp; License</th>
                <th className="py-3.5 px-4">Phone / Emergency</th>
                <th className="py-3.5 px-4">Work Shift</th>
                <th className="py-3.5 px-5 text-center">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading staff...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No staff members match your criteria.
                  </td>
                </tr>
              ) : (
                staff.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-dark-hover/40 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.jobTitle || "Staff"} &bull; {u.email}</div>
                    </td>
                    <td className="py-4 px-4">{getRoleBadge(u.role)}</td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                      {u.branch?.name || "Dokki Main Branch"}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {u.specialization || "General Veterinary"}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {u.licenseNumber ? `Lic: ${u.licenseNumber}` : "Staff Support"}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono">
                      <div>{u.phone || "N/A"}</div>
                      {u.emergencyPhone && (
                        <div className="text-[10px] text-rose-500">Emg: {u.emergencyPhone}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {u.shift || "Morning (9 AM - 5 PM)"}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <Badge variant="success" dot className="text-[10px]">
                        Active
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD STAFF MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add New Staff Member
                </h3>
                <p className="text-xs text-slate-400">Assign RBAC permissions &amp; clinical schedule</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4">
              {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</p>}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="e.g. Dr. Karim Nabil"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    maxLength={254}
                    placeholder="doctor@petpals-vet.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    maxLength={25}
                    placeholder="010XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Login Password * (12+ characters, upper/lowercase and a number)
                </label>
                <input
                  type="password"
                  required
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role (RBAC Security) *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border font-bold text-xs text-slate-900 dark:text-white"
                  >
                    <option value="VETERINARIAN">Veterinarian (MD - Cases Only)</option>
                    <option value="RECEPTIONIST">Receptionist (Front Desk)</option>
                    <option value="ACCOUNTANT">Accountant (Financials Only)</option>
                    <option value="MANAGER">Clinic Manager (Full Ops)</option>
                    <option value="OWNER">Clinic Owner (SuperAdmin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Surgeon"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    License # (Syndicate ID)
                  </label>
                  <input
                    type="text"
                    placeholder="EG-VET-XXXX"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Orthopedic Surgery"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shift
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Morning (9 AM - 5 PM)">Morning (9 AM - 5 PM)</option>
                    <option value="Evening (3 PM - 11 PM)">Evening (3 PM - 11 PM)</option>
                    <option value="Night Overtime">Night Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="010XXXXXXXX"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button type="submit" size="md" variant="primary" className="w-full font-bold shadow-md shadow-brand-700/20">
                  Save Staff Member
                </Button>
                <Button type="button" size="md" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
