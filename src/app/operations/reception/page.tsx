"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Dog,
  Cat,
  Stethoscope,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReceptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // 1. Owner
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    ownerAddress: "",
    // 2. Animal
    petName: "",
    species: "Canine",
    breed: "",
    gender: "Male",
    birthDate: "",
    color: "",
    microchipNumber: "",
    weightKg: "",
    isNeutered: false,
    // 3. Visit
    visitType: "CONSULTATION",
    reason: "",
    isEmergency: false,
    // 4. Appointment / Assignment
    branchId: "",
    veterinarianId: "",
    immediateConsultation: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/reception", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit reception form");
      }

      setSuccessMessage(`Patient ${formData.petName} admitted successfully! Case opened.`);
      setTimeout(() => {
        if (data.medicalCase?.id) {
          router.push(`/operations/medical-cases`);
        } else {
          router.push(`/operations/animals`);
        }
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Reception Desk &bull; Quick Check-in
            </h1>
            <Badge variant="brand">Unified Screen</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Register client, patient profile, clinical triage, and admit in one single fast screen.
          </p>
        </div>

        {formData.isEmergency && (
          <Badge variant="danger" dot className="animate-pulse py-1 px-3 text-xs">
            EMERGENCY TRIAGE ACTIVE
          </Badge>
        )}
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 text-sm animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-3 text-sm animate-slide-up">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grid of 4 Core Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SECTION 1: Owner Information */}
          <Card hoverEffect className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-700" />
            <CardHeader className="pl-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">1. Pet Owner Information</CardTitle>
                  <CardDescription>Client profile & contact details</CardDescription>
                </div>
              </div>
            </CardHeader>

            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="ownerName"
                  required
                  placeholder="e.g. Ahmed Mansour"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-dark-border text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number (WhatsApp) *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      name="ownerPhone"
                      required
                      placeholder="010XXXXXXXX"
                      value={formData.ownerPhone}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-dark-border text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      name="ownerEmail"
                      placeholder="client@example.com"
                      value={formData.ownerEmail}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-dark-border text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Residential Address
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="ownerAddress"
                    placeholder="e.g. 15 Degla St, Mohandessin, Giza"
                    value={formData.ownerAddress}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-dark-border text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* SECTION 2: Animal Information */}
          <Card hoverEffect className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600" />
            <CardHeader className="pl-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Dog className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">2. Patient (Animal) Information</CardTitle>
                  <CardDescription>Species, breed, age & identification</CardDescription>
                </div>
              </div>
            </CardHeader>

            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pet Name *
                  </label>
                  <input
                    type="text"
                    name="petName"
                    required
                    placeholder="e.g. Bella"
                    value={formData.petName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-dark-border text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Species *
                  </label>
                  <select
                    name="species"
                    value={formData.species}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-dark-border text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 dark:text-white"
                  >
                    <option value="Canine">Canine (Dog)</option>
                    <option value="Feline">Feline (Cat)</option>
                    <option value="Avian">Avian (Bird)</option>
                    <option value="Exotic">Exotic / Small Mammal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Breed
                  </label>
                  <input
                    type="text"
                    name="breed"
                    placeholder="e.g. Persian / German"
                    value={formData.breed}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Neutered Male">Neutered Male</option>
                    <option value="Spayed Female">Spayed Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="weightKg"
                    placeholder="e.g. 4.5"
                    value={formData.weightKg}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Microchip Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="microchipNumber"
                    placeholder="15-digit ISO chip"
                    value={formData.microchipNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      name="isNeutered"
                      checked={formData.isNeutered}
                      onChange={handleChange}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>Neutered / Spayed (معقّم)</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* SECTION 3: Visit Details & Triage */}
          <Card hoverEffect className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-accent-gold" />
            <CardHeader className="pl-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">3. Visit Details & Chief Complaint</CardTitle>
                  <CardDescription>Reason of attendance and triage level</CardDescription>
                </div>
              </div>
            </CardHeader>

            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Visit Purpose / Department *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "CONSULTATION", label: "Consultation / Checkup" },
                    { id: "VACCINATION", label: "Vaccination Shot" },
                    { id: "SURGERY", label: "Surgery / Procedure" },
                    { id: "BOARDING", label: "Hotel Boarding" },
                    { id: "GROOMING", label: "Grooming & Spa" },
                    { id: "EMERGENCY", label: "Urgent Care" },
                  ].map((dept) => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, visitType: dept.id }))}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                        formData.visitType === dept.id
                          ? "bg-brand-50 text-brand-700 border-brand-500 shadow-sm dark:bg-brand-950/60 dark:text-brand-300"
                          : "border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-hover"
                      }`}
                    >
                      {dept.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Symptoms & Owner Complaints
                </label>
                <textarea
                  rows={3}
                  name="reason"
                  placeholder="e.g. Vomiting since yesterday, lethargy, decreased appetite..."
                  value={formData.reason}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-dark-border text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    Emergency Priority
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isEmergency"
                    checked={formData.isEmergency}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>
            </div>
          </Card>

          {/* SECTION 4: Direct Appointment & Admission */}
          <Card hoverEffect className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-600" />
            <CardHeader className="pl-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">4. Doctor Assignment & Action</CardTitle>
                  <CardDescription>Assign vet and open live case</CardDescription>
                </div>
              </div>
            </CardHeader>

            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign to Veterinarian
                </label>
                <select
                  name="veterinarianId"
                  value={formData.veterinarianId}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-dark-border text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 dark:text-white font-medium"
                >
                  <option value="">Next Available Veterinarian (Auto-assign)</option>
                  <option value="dr-omar">Dr. Omar Khaled (Chief Surgeon)</option>
                  <option value="dr-sara">Dr. Sara Mostafa (Internal Medicine)</option>
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200/70 dark:border-brand-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Immediate Consultation
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Creates an open Medical Case and enters queue right now
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    name="immediateConsultation"
                    checked={formData.immediateConsultation}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="pt-3">
                <Button
                  type="submit"
                  size="lg"
                  variant="primary"
                  isLoading={loading}
                  className="w-full font-bold shadow-lg shadow-brand-700/20"
                >
                  Confirm Check-in & Open Case
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
