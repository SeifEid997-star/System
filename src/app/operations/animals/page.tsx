"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Dog,
  Cat,
  Search,
  Plus,
  Calendar,
  Stethoscope,
  Phone,
  User,
  History,
  QrCode,
  FileText,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";

interface AnimalRecord {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string;
  color: string | null;
  weightKg: number | null;
  microchipNumber: string | null;
  isNeutered: boolean;
  owner: {
    id: string;
    name: string;
    phone: string;
  };
  medicalCases: Array<{
    id: string;
    caseNumber: string;
    status: string;
    diagnosis: string | null;
    createdAt: string;
  }>;
  appointments: Array<{
    id: string;
    appointmentDate: string;
    type: string;
    status: string;
  }>;
}

export default function AnimalsPage() {
  const [animals, setAnimals] = useState<AnimalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("ALL");
  const [activeAnimal, setActiveAnimal] = useState<AnimalRecord | null>(null);

  useEffect(() => {
    const fetchAnimals = async () => {
      setLoading(true);
      try {
        const url = `/api/animals?query=${encodeURIComponent(search)}&species=${selectedSpecies}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.animals) {
          setAnimals(data.animals);
          if (data.animals.length > 0 && !activeAnimal) {
            setActiveAnimal(data.animals[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching animals:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchAnimals, 200);
    return () => clearTimeout(timer);
  }, [search, selectedSpecies]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Animals Registry &bull; Medical Timeline
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete database of patients, pedigree records, microchip IDs, and unified clinical history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/operations/reception">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Register Patient
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-dark-card p-4 rounded-2xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, microchip, breed, owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        {/* Species Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {["ALL", "Canine", "Feline", "Avian", "Exotic"].map((sp) => (
            <button
              key={sp}
              type="button"
              onClick={() => setSelectedSpecies(sp)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedSpecies === sp
                  ? "bg-brand-700 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {sp === "ALL" ? "All Species" : sp}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Layout: List on Left, Comprehensive Timeline Profile on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Animals List Column */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Registered Patients ({animals.length})
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : animals.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border">
              <Dog className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No animals found</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {animals.map((pet) => {
                const isSelected = activeAnimal?.id === pet.id;
                return (
                  <div
                    key={pet.id}
                    onClick={() => setActiveAnimal(pet)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-brand-50/80 border-brand-500 shadow-md dark:bg-brand-950/40 dark:border-brand-500"
                        : "bg-white dark:bg-dark-card border-slate-100 dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {pet.species === "Feline" ? <Cat className="w-5 h-5" /> : <Dog className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {pet.name}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {pet.breed || pet.species} &bull; {pet.gender}
                          </p>
                        </div>
                      </div>
                      <Badge variant="neutral" className="text-[10px]">
                        {pet.weightKg ? `${pet.weightKg} kg` : "N/A"}
                      </Badge>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-dark-border/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {pet.owner.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {pet.owner.phone}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Animal Profile & Medical Timeline */}
        <div className="lg:col-span-2">
          {activeAnimal ? (
            <div className="space-y-6">
              {/* Profile Card Header */}
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-dark-border">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-700 to-teal-500 flex items-center justify-center text-white text-2xl font-black shadow-md">
                      {activeAnimal.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                          {activeAnimal.name}
                        </h2>
                        <Badge variant="brand">{activeAnimal.species}</Badge>
                        {activeAnimal.isNeutered && (
                          <Badge variant="success">Neutered</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {activeAnimal.breed || "Purebred"} &bull; {activeAnimal.gender} &bull; Microchip:{" "}
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                          {activeAnimal.microchipNumber || "Not chipped"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/operations/medical-cases?animalId=${activeAnimal.id}`}>
                      <Button size="sm" variant="primary" leftIcon={<Stethoscope className="w-3.5 h-3.5" />}>
                        New Case
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" leftIcon={<QrCode className="w-3.5 h-3.5" />}>
                      Pet Passport
                    </Button>
                  </div>
                </div>

                {/* Patient Summary Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-dark-border">
                    <span className="text-[11px] text-slate-400 font-medium">Recorded Weight</span>
                    <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {activeAnimal.weightKg ? `${activeAnimal.weightKg} kg` : "Pending"}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-dark-border">
                    <span className="text-[11px] text-slate-400 font-medium">Owner Name</span>
                    <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                      {activeAnimal.owner.name}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-dark-border">
                    <span className="text-[11px] text-slate-400 font-medium">WhatsApp Contact</span>
                    <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 font-mono text-xs pt-1">
                      {activeAnimal.owner.phone}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-dark-border">
                    <span className="text-[11px] text-slate-400 font-medium">Total Past Cases</span>
                    <div className="text-base font-bold text-brand-700 dark:text-brand-400 mt-0.5">
                      {activeAnimal.medicalCases.length} consultations
                    </div>
                  </div>
                </div>
              </Card>

              {/* Unified Medical Timeline */}
              <Card className="p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-border">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-brand-600" />
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Unified Medical Timeline
                    </h3>
                  </div>
                  <Badge variant="brand" dot>
                    Chronological Log
                  </Badge>
                </div>

                <div className="mt-6 relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
                  {activeAnimal.medicalCases.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No recorded medical history yet. Click &ldquo;New Case&rdquo; to start the first consultation.
                    </div>
                  ) : (
                    activeAnimal.medicalCases.map((cs) => (
                      <div key={cs.id} className="relative group">
                        {/* Timeline Node Dot */}
                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-brand-600 border-4 border-white dark:border-dark-card shadow-sm" />

                        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-dark-border group-hover:border-brand-500/40 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-400">
                              {cs.caseNumber}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(cs.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>

                          <h5 className="font-semibold text-xs text-slate-900 dark:text-white mt-1">
                            Diagnosis: {cs.diagnosis || "General Consultation"}
                          </h5>

                          <div className="mt-3 flex items-center justify-between">
                            <Badge
                              variant={cs.status === "COMPLETED" ? "success" : "warning"}
                              className="text-[10px]"
                            >
                              {cs.status}
                            </Badge>

                            <Link href="/operations/medical-cases">
                              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
                                View Full Case Details <ChevronRight className="w-3 h-3" />
                              </span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border">
              <p className="text-xs text-slate-400">Select an animal from the left to view timeline</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
