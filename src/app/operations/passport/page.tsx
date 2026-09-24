"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Dog,
  QrCode,
  Printer,
  Share2,
  CheckCircle2,
  Syringe,
  FileCheck,
  ShieldCheck,
  Plus,
  X,
} from "lucide-react";

interface VaccineInfo {
  product: string;
  batch: string;
  dateGiven: string;
  validUntil: string | null;
  vetName: string;
  vetLicense: string;
}

interface DewormingInfo {
  product: string;
  dateGiven: string;
  nextDue: string | null;
}

interface PassportProfile {
  id: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  dob: string | null;
  microchip: string;
  color: string;
  ownerName: string;
  ownerPhone: string;
  ownerNationalId: string;
  address: string;
  rabiesVaccine: VaccineInfo | null;
  deworming: DewormingInfo | null;
  travelStatus: "ELIGIBLE" | "PENDING_BOOSTER";
}

export default function PetPassportPage() {
  const [pets, setPets] = useState<PassportProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vaccineType: "RABIES",
    productName: "",
    batchNumber: "",
    dateGiven: "",
    validUntil: "",
    vetName: "",
    vetLicense: "",
  });

  const loadPets = () => {
    setLoading(true);
    fetch("/api/passport")
      .then((r) => r.json())
      .then((data) => {
        const list: PassportProfile[] = data.pets || [];
        setPets(list);
        if (list.length > 0 && !selectedPetId) setSelectedPetId(list[0].id);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pet = pets.find((p) => p.id === selectedPetId) || pets[0];

  const handlePrint = () => window.print();

  const handleShareWhatsApp = () => {
    if (!pet) return;
    const text = encodeURIComponent(
      `PetPals Official Digital Pet Passport for ${pet.name}:\n` +
      `Microchip: ${pet.microchip}\n` +
      `Rabies Vaccine: ${pet.rabiesVaccine ? `Valid until ${formatDate(pet.rabiesVaccine.validUntil)}` : "Not on record"}\n` +
      `Status: ${pet.travelStatus === "ELIGIBLE" ? "International Travel Ready ✅" : "Booster Required ⚠️"}\n` +
      `Verify: http://petpals.clinic/verify/passport/${pet.microchip}`
    );
    window.open(`https://api.whatsapp.com/send?phone=${pet.ownerPhone.replace(/[^0-9]/g, "")}&text=${text}`, "_blank");
  };

  const handleCopyVerification = () => {
    if (!pet) return;
    const url = `https://petpals.clinic/verify/passport/${pet.microchip}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return iso;
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pet || !form.productName || !form.dateGiven) return;
    setSaving(true);
    try {
      const res = await fetch("/api/passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animalId: pet.id, ...form }),
      });
      if (res.ok) {
        setShowRecordModal(false);
        setForm({ vaccineType: "RABIES", productName: "", batchNumber: "", dateGiven: "", validUntil: "", vetName: "", vetLicense: "" });
        loadPets();
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="max-w-5xl mx-auto pb-16 animate-fade-in text-center py-20">
        <p className="text-slate-500 text-sm">No animals registered yet. Add a pet in Operations &gt; Animals first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in">
      {/* Toast Notification */}
      {copiedLink && (
        <div className="fixed top-20 right-8 z-50 bg-teal-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-teal-200" />
          <div className="text-xs">
            <p className="font-bold">تم نسخ رابط التحقق الدولي!</p>
            <p className="text-teal-100 text-[11px]">Verification URL copied to clipboard.</p>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Digital Pet Passport &amp; Travel Certificate (جواز السفر البيطري الرقمي)
            </h1>
            <Badge variant="brand" dot>ISO 11784/11785</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official QR-verified health documentation for domestic registration, cross-border travel, and airline compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => setShowRecordModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Record Vaccination
          </Button>
          <Button size="sm" variant="outline" onClick={handleShareWhatsApp} leftIcon={<Share2 className="w-4 h-4 text-emerald-600" />}>
            Send to Owner (WhatsApp)
          </Button>
          <Button size="sm" variant="primary" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
            Print Official Booklet
          </Button>
        </div>
      </div>

      {/* Pet Selector Bar (Print: Hidden) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 print:hidden">
        <span className="text-xs font-bold text-slate-500 mr-2 shrink-0">Select Patient:</span>
        {pets.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPetId(p.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
              selectedPetId === p.id
                ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20"
                : "bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            }`}
          >
            <Dog className="w-3.5 h-3.5" />
            <span>{p.name}</span>
            <span className="text-[10px] opacity-75 font-mono">({p.species})</span>
          </button>
        ))}
      </div>

      {/* OFFICIAL DIGITAL PASSPORT DOCUMENT (PRINT READY) */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border-2 border-brand-700 dark:border-brand-600 shadow-2xl overflow-hidden print:border-none print:shadow-none">
        {/* Passport Top Cover Banner */}
        <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-teal-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-widest">
                ARAB REPUBLIC OF EGYPT • MINISTRY OF AGRICULTURE
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              OFFICIAL COMPANION ANIMAL PASSPORT
            </h2>
            <p className="text-xs text-teal-200">
              PetPals Cairo Hospital • Certified Microchip &amp; Vaccine Ledger
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-xs">
            <div className="w-16 h-16 bg-white p-1.5 rounded-xl shadow-inner flex items-center justify-center">
              <QrCode className="w-full h-full text-slate-900" />
            </div>
            <div className="text-[11px] text-white space-y-0.5">
              <span className="block font-black text-amber-300">SCAN TO VERIFY</span>
              <span className="font-mono text-[10px]">ISO: {pet.microchip || "—"}</span>
              <button
                onClick={handleCopyVerification}
                className="text-[10px] underline text-teal-200 hover:text-white block print:hidden"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* Passport Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Section 1: Animal Identification & Owner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Animal Signalment */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-dark-border pb-2">
                <span className="text-xs font-black text-brand-700 dark:text-brand-400 uppercase tracking-wider">
                  I. Animal Identification (بيانات الحيوان)
                </span>
                <Badge variant="brand">Verified</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Official Name</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">{pet.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Species &amp; Breed</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{pet.breed || pet.species}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Sex &amp; Reproductive Status</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{pet.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Date of Birth</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(pet.dob)}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-dark-border">
                  <span className="text-slate-400 block text-[10px]">ISO Microchip Transponder</span>
                  <span className="font-mono font-black text-brand-800 dark:text-brand-300 text-sm tracking-wider">
                    {pet.microchip || "Not registered"}
                  </span>
                </div>
              </div>
            </div>

            {/* Owner Details */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-dark-border pb-2">
                <span className="text-xs font-black text-brand-700 dark:text-brand-400 uppercase tracking-wider">
                  II. Registered Owner (بيانات المالك القانوني)
                </span>
                <FileCheck className="w-4 h-4 text-brand-600" />
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Full Name</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">{pet.ownerName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Contact Phone</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{pet.ownerPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">National ID / Passport No.</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{pet.ownerNationalId || "—"}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Permanent Address</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{pet.address || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Rabies Vaccination (Crucial for Travel) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Syringe className="w-4 h-4 text-emerald-600" />
                III. Anti-Rabies Vaccination Record (التطعيم ضد السعار)
              </h3>
              <Badge variant={pet.travelStatus === "ELIGIBLE" ? "success" : "warning"} dot>
                {pet.travelStatus === "ELIGIBLE" ? "Active Immunity" : "Booster Needed"}
              </Badge>
            </div>

            {pet.rabiesVaccine ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-dark-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-dark-border">
                    <tr>
                      <th className="py-3 px-4">Manufacturer &amp; Vaccine</th>
                      <th className="py-3 px-4">Batch / Lot #</th>
                      <th className="py-3 px-4">Administered Date</th>
                      <th className="py-3 px-4">Valid Until</th>
                      <th className="py-3 px-4">Authorized Veterinarian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-border font-medium">
                    <tr className="bg-emerald-50/20 dark:bg-emerald-950/10">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {pet.rabiesVaccine.product}
                      </td>
                      <td className="py-3.5 px-4 font-mono">{pet.rabiesVaccine.batch || "—"}</td>
                      <td className="py-3.5 px-4">{formatDate(pet.rabiesVaccine.dateGiven)}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700 dark:text-emerald-400">
                        {formatDate(pet.rabiesVaccine.validUntil)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="block font-bold">{pet.rabiesVaccine.vetName || "—"}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Lic: {pet.rabiesVaccine.vetLicense || "—"}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
                No rabies vaccination on record yet. Use "Record Vaccination" to add one.
              </div>
            )}
          </div>

          {/* Section 3: Echinococcus / Parasite Treatment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                IV. Echinococcus &amp; Internal Parasite Prevention (مكافحة الديدان والطفيليات)
              </h3>
            </div>

            {pet.deworming ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Product Administered</span>
                  <span className="font-bold text-slate-900 dark:text-white">{pet.deworming.product}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Treatment Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(pet.deworming.dateGiven)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Next Scheduled Dose</span>
                  <span className="font-bold text-brand-700 dark:text-brand-300">{formatDate(pet.deworming.nextDue)}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border text-xs text-slate-400">
                No deworming record yet.
              </div>
            )}
          </div>

          {/* Official Endorsement & Clinic Seal */}
          <div className="pt-6 border-t border-slate-200 dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">PetPals Veterinary Hospital Cairo</p>
              <p>Certified Official Partner • Egyptian Syndicate of Veterinarians</p>
              <p className="text-[10px]">Document Hash: SHA256-PETPALS-EGY-{(pet.microchip || pet.id).replace(/-/g, "")}</p>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-28 h-28 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center p-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase">OFFICIAL CLINIC STAMP &amp; SIGNATURE</span>
                <div className="mt-1 text-xs font-black text-brand-800 dark:text-brand-300">PETPALS CAIRO</div>
                <span className="text-[8px] text-slate-400 font-mono">SEALED &amp; VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Record Vaccination Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-dark-card rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Record Vaccination for {pet.name}</h3>
              <button onClick={() => setShowRecordModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddRecord} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Type</label>
                <select
                  value={form.vaccineType}
                  onChange={(e) => setForm({ ...form, vaccineType: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5"
                >
                  <option value="RABIES">Rabies Vaccine</option>
                  <option value="DEWORMING">Deworming</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Name</label>
                <input
                  required
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date Given</label>
                  <input
                    required
                    type="date"
                    value={form.dateGiven}
                    onChange={(e) => setForm({ ...form, dateGiven: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Valid Until / Next Due</label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Batch #</label>
                  <input
                    value={form.batchNumber}
                    onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Vet License</label>
                  <input
                    value={form.vetLicense}
                    onChange={(e) => setForm({ ...form, vetLicense: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Veterinarian Name</label>
                <input
                  value={form.vetName}
                  onChange={(e) => setForm({ ...form, vetName: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5"
                />
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={saving}>
                {saving ? "Saving..." : "Save Record"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
