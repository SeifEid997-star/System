"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CLINICAL_TEMPLATES } from "@/lib/clinicalTemplates";
import { RadiologyViewerModal } from "@/components/medical/RadiologyViewerModal";
import {
  Stethoscope,
  Plus,
  Search,
  UploadCloud,
  FileText,
  Eye,
  Trash2,
  CheckCircle2,
  Receipt,
  Store,
  Printer,
  Sparkles,
  Thermometer,
  Activity,
  Heart,
  Scale,
  ShieldCheck,
  Calendar,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface PrescriptionRow {
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string;
}

export default function MedicalCasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCase, setActiveCase] = useState<any | null>(null);
  const [viewerFile, setViewerFile] = useState<any | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);

  // Form State for consultation
  const [vitalTemp, setVitalTemp] = useState("38.6");
  const [vitalWeight, setVitalWeight] = useState("28.5");
  const [vitalHeart, setVitalHeart] = useState("110");
  const [vitalResp, setVitalResp] = useState("24");
  const [vitalBcs, setVitalBcs] = useState("5/9");
  const [diagnosis, setDiagnosis] = useState("Canine Parvoviral Enteritis (CPV)");
  const [symptoms, setSymptoms] = useState("Persistent vomiting, lethargy, decreased appetite for 2 days.");
  const [treatmentPlan, setTreatmentPlan] = useState("IV fluid rehydration, anti-emetic therapy, prophylactic antibiotics.");
  const [isVisibleToClient, setIsVisibleToClient] = useState(true);

  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([
    {
      medicationName: "Cerenia (Maropitant Citrate)",
      dosage: "1 mg/kg SC",
      frequency: "Once daily",
      durationDays: 5,
      instructions: "Administer subcutaneously for persistent vomiting.",
    },
    {
      medicationName: "Amoxiclav 250mg",
      dosage: "12.5 mg/kg",
      frequency: "Every 12 hours",
      durationDays: 7,
      instructions: "Give with light soft food.",
    },
  ]);

  const [attachments, setAttachments] = useState([
    {
      fileName: "Max_Thoracic_Lateral_XRay.dcm",
      fileUrl: "/placeholder-xray.png",
      fileType: "XRAY",
      uploadedBy: "Dr. Omar Khaled",
      date: "Today, 10:20 AM",
    },
    {
      fileName: "CBC_Complete_Blood_Count.pdf",
      fileUrl: "/placeholder-lab.pdf",
      fileType: "LAB_REPORT",
      uploadedBy: "Dr. Sara Mostafa",
      date: "Today, 09:45 AM",
    },
  ]);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/medical-cases");
      const data = await res.json();
      if (data.cases) {
        setCases(data.cases);
        if (data.cases.length > 0 && !activeCase) {
          setActiveCase(data.cases[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    const tmpl = CLINICAL_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;
    setDiagnosis(tmpl.diagnosis);
    setSymptoms(tmpl.symptoms);
    setTreatmentPlan(tmpl.treatmentPlan);
    setPrescriptions(tmpl.recommendedPrescriptions);
  };

  const addPrescriptionRow = () => {
    setPrescriptions((prev) => [
      ...prev,
      {
        medicationName: "",
        dosage: "",
        frequency: "Every 12 hours",
        durationDays: 5,
        instructions: "",
      },
    ]);
  };

  const removePrescriptionRow = (index: number) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePrescriptionChange = (index: number, field: keyof PrescriptionRow, value: any) => {
    setPrescriptions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachments((prev) => [
        ...prev,
        {
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
          fileType: file.name.endsWith(".pdf") ? "LAB_REPORT" : "XRAY",
          uploadedBy: "Dr. Omar Khaled",
          date: "Just now",
        },
      ]);
    }
  };

  const [saveToast, setSaveToast] = useState("");
  const [savingCase, setSavingCase] = useState(false);

  const handleSaveCase = async (caseStatus = "COMPLETED") => {
    setSavingCase(true);
    try {
      const payload = {
        status: caseStatus,
        diagnosis,
        symptoms,
        treatmentPlan,
        temperature: parseFloat(vitalTemp),
        weightKg: parseFloat(vitalWeight) || 0,
        heartRate: parseInt(vitalHeart) || 0,
        respirationRate: parseInt(vitalResp) || 0,
        bcs: vitalBcs,
        isVisibleToClient,
        prescriptions,
      };

      if (!activeCase?.id) throw new Error("Select a medical case before saving.");
      const res = await fetch(`/api/medical-cases/${activeCase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveToast("تم حفظ وتحديث الكشف الطبي والروشتة بنجاح في قاعدة البيانات!");
        fetchCases();
      } else {
        const error = await res.json().catch(() => ({}));
        setSaveToast(error.error || "تعذر حفظ التغييرات. راجع البيانات وحاول مرة أخرى.");
      }
    } catch (e) {
      setSaveToast(e instanceof Error ? e.message : "تعذر حفظ الكشف الطبي.");
    } finally {
      setSavingCase(false);
      setTimeout(() => setSaveToast(""), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 animate-fade-in">
      {/* Save Notification Toast */}
      {saveToast && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <div className="text-xs">
            <p className="font-bold">تم الحفظ بنجاح!</p>
            <p className="text-emerald-100 text-[11px]">{saveToast}</p>
          </div>
        </div>
      )}
      {/* Radiology File Viewer Modal */}
      <RadiologyViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        file={viewerFile}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Medical Cases &bull; Clinical Workspace
            </h1>
            <Badge variant="brand" dot>
              Full EMR Engine
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete electronic medical records with Vital Signs, diagnostic templates, structured prescriptions, and real Radiology/Lab viewer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/operations/reception">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Admit New Patient
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cases Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Consultation Cases
              </span>
              <Badge variant="brand">Live</Badge>
            </div>

            <div className="space-y-2">
              {(cases.length > 0
                ? cases
                : [
                    {
                      id: "cs-1",
                      caseNumber: "CASE-2026-0042",
                      pet: "Max (Golden Retriever)",
                      owner: "Mohamed El-Sayed",
                      status: "IN_PROGRESS",
                      diagnosis: "Canine Parvoviral Enteritis",
                      date: "Today, 10:15 AM",
                    },
                  ]
              ).map((c: any) => {
                const isSelected = activeCase?.id === c.id || activeCase?.caseNumber === c.caseNumber || (!activeCase && c.id === "cs-1");
                const petName = c.animal?.name || c.pet || "Patient";
                const ownerName = c.animal?.owner?.name || c.owner || "Owner";
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveCase(c);
                      if (c.diagnosis) setDiagnosis(c.diagnosis);
                      if (c.symptoms) setSymptoms(c.symptoms);
                      if (c.treatmentPlan) setTreatmentPlan(c.treatmentPlan);
                      if (c.weightKg) setVitalWeight(String(c.weightKg));
                      if (c.heartRate) setVitalHeart(String(c.heartRate));
                      if (c.prescriptionItems && c.prescriptionItems.length > 0) {
                        setPrescriptions(
                          c.prescriptionItems.map((p: any) => ({
                            medicationName: p.medicationName,
                            dosage: p.dosage || "1 tab",
                            frequency: p.frequency || "Every 12 hours",
                            durationDays: p.durationDays || 5,
                            instructions: p.instructions || "",
                          }))
                        );
                      }
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-brand-50/80 border-brand-500 shadow-md dark:bg-brand-950/40 dark:border-brand-500"
                        : "bg-white dark:bg-dark-card border-slate-100 dark:border-dark-border hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-400">
                        {c.caseNumber}
                      </span>
                      <Badge
                        variant={c.status === "COMPLETED" ? "success" : "warning"}
                        className="text-[10px]"
                        dot
                      >
                        {c.status}
                      </Badge>
                    </div>
                    <div className="font-bold text-xs text-slate-800 dark:text-white mt-1">
                      {petName} <span className="text-[10px] text-slate-400 font-normal">({ownerName})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {c.diagnosis || "Under Examination"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Pre-Built Clinical Templates Card */}
          <Card className="p-4 bg-gradient-to-br from-slate-50 to-brand-50/20 dark:from-dark-card dark:to-brand-950/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Clinical Diagnosis Templates
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              One-click auto-fill for common pet diseases, treatment plans, and dosages:
            </p>

            <div className="grid grid-cols-1 gap-1.5">
              {CLINICAL_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => applyTemplate(tmpl.id)}
                  className="w-full text-left px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-brand-50 dark:hover:bg-brand-950/50 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-between"
                >
                  <span className="truncate">{tmpl.name}</span>
                  <Badge variant="brand" className="text-[10px] ml-1">
                    {tmpl.species}
                  </Badge>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Clinical Consultation Workspace (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Case Header */}
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-dark-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-brand-700 dark:text-brand-400">
                    CASE-2026-0042
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    &bull; Max (Golden Retriever, 28.5 kg)
                  </span>
                  <Badge variant="warning" dot>
                    In Progress
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Owner: Mohamed El-Sayed (+20 100 777 6655) &bull; Attending Vet: Dr. Omar Khaled
                </p>
              </div>

              {/* Toggle: Client Portal Visibility */}
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Visible in Client Portal
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVisibleToClient}
                    onChange={(e) => setIsVisibleToClient(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>
            </div>

            {/* 1. Vital Signs Grid */}
            <div className="mt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                1. Vital Signs & Body Condition
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-dark-border">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                    <span>Temp (°C)</span>
                  </div>
                  <input
                    type="text"
                    value={vitalTemp}
                    onChange={(e) => setVitalTemp(e.target.value)}
                    className="w-full mt-1 bg-transparent font-bold text-sm text-slate-900 dark:text-white border-b border-transparent focus:border-brand-500 outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-dark-border">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <Scale className="w-3.5 h-3.5 text-brand-600" />
                    <span>Weight (kg)</span>
                  </div>
                  <input
                    type="text"
                    value={vitalWeight}
                    onChange={(e) => setVitalWeight(e.target.value)}
                    className="w-full mt-1 bg-transparent font-bold text-sm text-slate-900 dark:text-white border-b border-transparent focus:border-brand-500 outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-dark-border">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Heart (bpm)</span>
                  </div>
                  <input
                    type="text"
                    value={vitalHeart}
                    onChange={(e) => setVitalHeart(e.target.value)}
                    className="w-full mt-1 bg-transparent font-bold text-sm text-slate-900 dark:text-white border-b border-transparent focus:border-brand-500 outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-dark-border">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <Activity className="w-3.5 h-3.5 text-sky-500" />
                    <span>Resp (bpm)</span>
                  </div>
                  <input
                    type="text"
                    value={vitalResp}
                    onChange={(e) => setVitalResp(e.target.value)}
                    className="w-full mt-1 bg-transparent font-bold text-sm text-slate-900 dark:text-white border-b border-transparent focus:border-brand-500 outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-dark-border">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <span>BCS (1-9)</span>
                  </div>
                  <select
                    value={vitalBcs}
                    onChange={(e) => setVitalBcs(e.target.value)}
                    className="w-full mt-1 bg-transparent font-bold text-xs text-slate-900 dark:text-white border-none outline-none"
                  >
                    <option value="3/9">3/9 (Underweight)</option>
                    <option value="4/9">4/9 (Lean)</option>
                    <option value="5/9">5/9 (Ideal)</option>
                    <option value="6/9">6/9 (Overweight)</option>
                    <option value="7/9">7/9 (Heavy)</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* 2. Diagnosis & Treatment Notes */}
          <Card className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
              2. Clinical Examination & Diagnosis
            </span>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Definitive Diagnosis *
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Gastroenteritis, Parvovirus, Dermatitis..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Symptoms & Findings
                  </label>
                  <textarea
                    rows={3}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Treatment & Clinic Procedures
                  </label>
                  <textarea
                    rows={3}
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* 3. Structured Prescription Medications */}
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  3. Prescription Medications (الروشتة العلاجية المنظمة)
                </h4>
                <p className="text-xs text-slate-400">Structured dosage and client instructions</p>
              </div>
              <Button size="sm" variant="outline" onClick={addPrescriptionRow} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Drug
              </Button>
            </div>

            <div className="space-y-3 mt-4">
              {prescriptions.map((rx, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-dark-border grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                >
                  <div className="sm:col-span-4">
                    <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Drug Name</label>
                    <input
                      type="text"
                      value={rx.medicationName}
                      placeholder="e.g. Cerenia 24mg"
                      onChange={(e) => handlePrescriptionChange(idx, "medicationName", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-xs font-medium text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Dosage</label>
                    <input
                      type="text"
                      value={rx.dosage}
                      placeholder="1 tab"
                      onChange={(e) => handlePrescriptionChange(idx, "dosage", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Frequency</label>
                    <select
                      value={rx.frequency}
                      onChange={(e) => handlePrescriptionChange(idx, "frequency", e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                    >
                      <option value="Once daily">Once daily (كل 24 ساعة)</option>
                      <option value="Every 12 hours">Every 12 hours (مرتين يومياً)</option>
                      <option value="Every 8 hours">Every 8 hours (3 مرات يومياً)</option>
                      <option value="As needed">As needed (عند اللزوم)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Days</label>
                    <input
                      type="number"
                      value={rx.durationDays}
                      onChange={(e) => handlePrescriptionChange(idx, "durationDays", parseInt(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-1 text-right pt-4">
                    <button
                      type="button"
                      onClick={() => removePrescriptionRow(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 4. REAL FILE UPLOAD (Lab Results & Radiology X-Ray) — Solves Old Flaw! */}
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    4. Radiology &amp; Laboratory Real Files (الأشعة والتحاليل)
                  </h4>
                  <Badge variant="success" dot>
                    Real Upload &amp; Viewer Fixed
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Inspect digital X-Rays with color inversion and view blood test reports
                </p>
              </div>

              {/* Upload Input */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.dcm"
                />
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors">
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload X-Ray / Lab PDF
                </span>
              </label>
            </div>

            {/* Attachments List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {attachments.map((file, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-dark-border flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {file.fileName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {file.fileType} &bull; {file.date}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setViewerFile(file);
                      setIsViewerOpen(true);
                    }}
                    className="p-2 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-brand-700 dark:text-brand-300 hover:bg-brand-50 transition-colors shadow-sm"
                    title="Open in Radiology Viewer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Action Bar (Direct Invoice & POS & Print) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                size="md"
                variant="primary"
                onClick={() => handleSaveCase("COMPLETED")}
                disabled={savingCase}
                leftIcon={savingCase ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              >
                {savingCase ? "Saving to Database..." : "Save & Complete Case (حفظ الكشف)"}
              </Button>
              <Button
                size="md"
                variant="outline"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Rx / Summary
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/operations/invoices">
                <Button size="md" variant="secondary" leftIcon={<Receipt className="w-4 h-4" />}>
                  Create Invoice
                </Button>
              </Link>
              <Link href="/operations/pos">
                <Button size="md" variant="amber" leftIcon={<Store className="w-4 h-4" />}>
                  Direct POS Sale
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
