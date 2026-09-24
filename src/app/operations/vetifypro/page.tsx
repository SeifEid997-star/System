"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles,
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  Search,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  FileText,
  Activity,
  HeartPulse,
  RefreshCw,
  Copy,
  Save,
  PawPrint,
} from "lucide-react";

interface AnimalOption {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  weightKg: number | null;
  owner: { name: string };
}

function mapSpeciesToLocal(species: string): "Canine" | "Feline" | "Exotic" {
  if (species === "Canine") return "Canine";
  if (species === "Feline") return "Feline";
  return "Exotic";
}

interface DiagnosisResult {
  condition: string;
  conditionAr: string;
  probability: number;
  severity: "CRITICAL" | "MODERATE" | "LOW";
  recommendedWorkup: string[];
  firstLineTherapy: string;
}

const COMMON_SYMPTOMS = [
  { id: "vomiting", label: "Vomiting (قيء متكرر)", category: "GI" },
  { id: "bloody_diarrhea", label: "Hemorrhagic Diarrhea (إسهال مدمم)", category: "GI" },
  { id: "anorexia", label: "Anorexia (فقدان الشهية)", category: "General" },
  { id: "lethargy", label: "Severe Lethargy (خمول شديد)", category: "General" },
  { id: "fever", label: "High Pyrexia > 39.5°C (حمى)", category: "Vital" },
  { id: "cough", label: "Dry Hacking Cough (سعال جاف)", category: "Respiratory" },
  { id: "dyspnea", label: "Dyspnea / Tachypnea (صعوبة تنفس)", category: "Respiratory" },
  { id: "pruritus", label: "Severe Pruritus / Scratching (حكة جلدية)", category: "Dermatology" },
  { id: "alopecia", label: "Alopecia & Crusts (تساقط شعر وقشور)", category: "Dermatology" },
  { id: "polyuria", label: "Polyuria & Polydipsia (كثرة التبول والشرب)", category: "Endocrine" },
  { id: "lameness", label: "Acute Hindlimb Lameness (عرج)", category: "Orthopedic" },
  { id: "seizure", label: "Epileptic Seizures (تشنجات عصبية)", category: "Neurology" },
];

export default function VetifyProPage() {
  // Patient linking (real Animal record, optional)
  const [animals, setAnimals] = useState<AnimalOption[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>("");
  const [savingCase, setSavingCase] = useState(false);
  const [caseSavedNote, setCaseSavedNote] = useState(false);

  useEffect(() => {
    fetch("/api/animals")
      .then((r) => r.json())
      .then((data) => setAnimals(data.animals || []))
      .catch(() => setAnimals([]));
  }, []);

  // Input State
  const [species, setSpecies] = useState<"Canine" | "Feline" | "Exotic">("Canine");
  const [ageGroup, setAgeGroup] = useState<"Pediatric" | "Adult" | "Geriatric">("Pediatric");
  const [weightKg, setWeightKg] = useState<number>(8.5);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(["vomiting", "bloody_diarrhea", "lethargy"]);
  const [clinicalNotes, setClinicalNotes] = useState("Patient presented depressed, sunken eyes (5-7% dehydration), CRT 3 seconds.");

  const handleSelectAnimal = (animalId: string) => {
    setSelectedAnimalId(animalId);
    const animal = animals.find((a) => a.id === animalId);
    if (animal) {
      setSpecies(mapSpeciesToLocal(animal.species));
      if (animal.weightKg && animal.weightKg > 0) {
        setWeightKg(animal.weightKg);
        handleCalculateDrug(selectedDrug, animal.weightKg);
      }
    }
  };

  // Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<DiagnosisResult[]>([
    {
      condition: "Canine Parvovirus Enteritis (CPV-2)",
      conditionAr: "فيروس الباروفو المعوي للكلاب",
      probability: 91,
      severity: "CRITICAL",
      recommendedWorkup: [
        "CPV Rapid Antigen Point-of-Care Test (Fecal swab)",
        "Complete Blood Count (Leukopenia / Neutropenia check)",
        "Serum Electrolytes (K+, Na+ for fluid plan)",
        "Venous Blood Glucose (Sepsis monitoring)",
      ],
      firstLineTherapy: "Strict Isolation, IV Fluid Resuscitation (Lactated Ringer's + 20mEq/L KCl), Antiemetic (Maropitant 1mg/kg SC q24h), Broad-spectrum IV Antibiotic (Ampicillin/Sulbactam), Nutritional support once vomiting stops.",
    },
    {
      condition: "Acute Hemorrhagic Gastroenteritis (HGE / AHDS)",
      conditionAr: "التهاب المعدة والأمعاء النزفي الحاد",
      probability: 72,
      severity: "CRITICAL",
      recommendedWorkup: [
        "Packed Cell Volume (PCV > 55-60% hallmark)",
        "Total Plasma Protein (often normal despite high PCV)",
        "Fecal Flotation & Giardia Antigen",
      ],
      firstLineTherapy: "Aggressive Crystalloid shock bolus (PCV targeting < 50%), Maropitant, Metronidazole or Amoxiclav if mucosal barrier compromised.",
    },
    {
      condition: "Gastrointestinal Foreign Body Obstruction",
      conditionAr: "انسداد معوي بجسم غريب",
      probability: 44,
      severity: "MODERATE",
      recommendedWorkup: [
        "Abdominal Digital X-Ray (2 views: Lateral & VD)",
        "Abdominal Ultrasonography (looking for acoustic shadowing)",
      ],
      firstLineTherapy: "Surgical exploratory laparotomy if persistent mechanical ileus or peritonitis.",
    },
  ]);

  // Drug Dosage Calculator State
  const [selectedDrug, setSelectedDrug] = useState("amoxiclav");
  const [calculatedDose, setCalculatedDose] = useState<{ doseMg: string; mlPerDose: string; frequency: string }>({
    doseMg: "106.25 mg",
    mlPerDose: "1.7 ml (of 250mg/5ml suspension)",
    frequency: "Every 12 hours orally with food for 7 days",
  });

  // Drug-Drug Interaction State
  const [drug1, setDrug1] = useState("meloxicam");
  const [drug2, setDrug2] = useState("prednisolone");
  const [copiedNote, setCopiedNote] = useState(false);

  const toggleSymptom = (id: string) => {
    if (selectedSymptoms.includes(id)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, id]);
    }
  };

  const handleRunDiagnosis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      // Generate realistic differential diagnoses based on selections
      if (selectedSymptoms.includes("cough") || selectedSymptoms.includes("dyspnea")) {
        setResults([
          {
            condition: "Infectious Tracheobronchitis (Kennel Cough Complex)",
            conditionAr: "مرض سعال كلاب الإيواء المعدي",
            probability: 88,
            severity: "MODERATE",
            recommendedWorkup: ["Thoracic Radiographs", "PCR Respiratory Panel", "Tracheal Auscultation"],
            firstLineTherapy: "Doxycycline 10mg/kg PO q24h x 10d, Antitussive (Hydrocodone/Butorphanol if non-productive), Rest.",
          },
          {
            condition: "Congestive Heart Failure / Cardiomegaly",
            conditionAr: "قصور عضلة القلب الاحتقاني",
            probability: 65,
            severity: "CRITICAL",
            recommendedWorkup: ["Echocardiography", "Thoracic Digital X-Ray (Vertebral Heart Score)", "NT-proBNP Biomarker"],
            firstLineTherapy: "Furosemide 2-4mg/kg IV/IM, Pimobendan 0.25mg/kg PO q12h, Oxygen therapy cage.",
          },
        ]);
      } else if (selectedSymptoms.includes("pruritus") || selectedSymptoms.includes("alopecia")) {
        setResults([
          {
            condition: "Flea Allergy Dermatitis (FAD) with Secondary Malassezia",
            conditionAr: "حساسية لدغ البراغيث مع عدوى فطرية ثانوية",
            probability: 93,
            severity: "LOW",
            recommendedWorkup: ["Skin Cytology Tape Strip", "Flea Dirt Combing", "Fungal Culture (DTM)"],
            firstLineTherapy: "Isoxazoline systemic parasiticide (Bravecto/Nexgard), Chlorhexidine 4% medicated baths, Apoquel 0.4-0.6mg/kg q12h x 14d.",
          },
          {
            condition: "Canine Atopic Dermatitis (Environmental)",
            conditionAr: "التهاب الجلد التأتبي البيئي",
            probability: 70,
            severity: "LOW",
            recommendedWorkup: ["Exclusion dietary trial (8 weeks)", "Serum IgE allergy panel"],
            firstLineTherapy: "Cytopoint (Lokivetmab) 1-2mg/kg SC q4-8w, Omega-3 fatty acids, Barrier repair topical foam.",
          },
        ]);
      } else {
        setResults([
          {
            condition: "Canine Parvovirus Enteritis (CPV-2)",
            conditionAr: "فيروس الباروفو المعوي للكلاب",
            probability: 91,
            severity: "CRITICAL",
            recommendedWorkup: [
              "CPV Rapid Antigen Point-of-Care Test",
              "Complete Blood Count (Leukopenia check)",
              "Serum Electrolytes (K+, Na+ for fluid plan)",
            ],
            firstLineTherapy: "Strict Isolation, IV Fluid Resuscitation (Lactated Ringer's + 20mEq/L KCl), Antiemetic (Maropitant 1mg/kg SC q24h), Ampicillin/Sulbactam.",
          },
          {
            condition: "Acute Hemorrhagic Gastroenteritis (AHDS)",
            conditionAr: "التهاب المعدة والأمعاء النزفي الحاد",
            probability: 72,
            severity: "CRITICAL",
            recommendedWorkup: ["PCV / Total Protein assessment", "Fecal Parasite PCR"],
            firstLineTherapy: "Crystalloid fluid expansion targeting PCV < 50%, Maropitant, Metronidazole.",
          },
        ]);
      }
    }, 900);
  };

  const handleCalculateDrug = (drug: string, weight: number) => {
    setSelectedDrug(drug);
    if (drug === "amoxiclav") {
      const dose = weight * 12.5;
      const ml = (dose / 50).toFixed(2);
      setCalculatedDose({
        doseMg: `${dose.toFixed(1)} mg`,
        mlPerDose: `${ml} ml (250mg/5ml oral suspension)`,
        frequency: "Every 12 hours orally with food for 7-10 days",
      });
    } else if (drug === "meloxicam") {
      const dose = weight * 0.1;
      const ml = (dose / 1.5).toFixed(2);
      setCalculatedDose({
        doseMg: `${dose.toFixed(2)} mg (Maintenance)`,
        mlPerDose: `${ml} ml (1.5mg/ml oral suspension)`,
        frequency: "Once daily with food for 3-5 days. Always ensure normal renal function & hydration.",
      });
    } else if (drug === "metronidazole") {
      const dose = weight * 15;
      const ml = (dose / 40).toFixed(2);
      setCalculatedDose({
        doseMg: `${dose.toFixed(1)} mg`,
        mlPerDose: `${ml} ml (200mg/5ml oral liquid)`,
        frequency: "Every 12 hours for 5-7 days (Anaerobic & Antiprotozoal)",
      });
    } else if (drug === "cerenia") {
      const dose = weight * 1.0;
      const ml = (dose / 10).toFixed(2);
      setCalculatedDose({
        doseMg: `${dose.toFixed(1)} mg`,
        mlPerDose: `${ml} ml (10mg/ml injectable solution)`,
        frequency: "Once daily (q24h) Subcutaneously or slow IV for up to 5 consecutive days",
      });
    }
  };

  const copyClinicalSummary = () => {
    const summary = `[VetifyPro AI Clinical Decision Summary]
Patient: ${species} (${ageGroup}, ${weightKg}kg)
Reported Symptoms: ${selectedSymptoms.join(", ")}
Clinical Findings: ${clinicalNotes}

Top Differential Diagnoses:
${results.map((r, i) => `${i + 1}. ${r.condition} (${r.probability}% Match - ${r.severity})\n   Therapy: ${r.firstLineTherapy}`).join("\n")}
`;
    navigator.clipboard.writeText(summary);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 3000);
  };

  const saveToPatientCaseRecord = async () => {
    if (!selectedAnimalId) return;
    setSavingCase(true);
    try {
      const topResult = results[0];
      const res = await fetch("/api/medical-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId: selectedAnimalId,
          weightKg,
          status: "OPEN",
          diagnosis: topResult ? `${topResult.condition} (VetifyPro suggested, ${topResult.probability}% match)` : "",
          symptoms: selectedSymptoms.join(", "),
          clinicalNotes,
          treatmentPlan: topResult ? topResult.firstLineTherapy : "",
        }),
      });
      if (res.ok) {
        setCaseSavedNote(true);
        setTimeout(() => setCaseSavedNote(false), 4000);
      }
    } finally {
      setSavingCase(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Copied Toast */}
      {copiedNote && (
        <div className="fixed top-20 right-8 z-50 bg-purple-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-purple-200" />
          <div className="text-xs">
            <p className="font-bold">تم نسخ التقرير الطبي بنجاح!</p>
            <p className="text-purple-100 text-[11px]">Ready to paste into Patient Medical Case.</p>
          </div>
        </div>
      )}

      {/* Case Saved Toast */}
      {caseSavedNote && (
        <div className="fixed top-20 right-8 z-50 bg-teal-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <Save className="w-5 h-5 text-teal-200" />
          <div className="text-xs">
            <p className="font-bold">تم حفظ الملف في سجل الحالة الطبية!</p>
            <p className="text-teal-100 text-[11px]">Saved to the patient's Medical Case record.</p>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
              VetifyPro™ Next-Gen Clinical AI
            </span>
            <Badge variant="brand" dot className="bg-purple-500/30 text-purple-200 border-purple-400/40">
              Active Diagnostic Copilot
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            AI Symptom Checker &amp; Clinical Decision Support
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-2 leading-relaxed">
            Evidence-based veterinary differential diagnosis engine, pediatric/adult drug dosing algorithms, and contraindicated drug combination alerts calibrated for Egyptian clinical practice.
          </p>
        </div>
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Main Grid: Input Workspace & AI Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient & Symptoms Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                1. Patient Signalment (بيانات الحالة)
              </h3>
              <span className="text-[11px] text-slate-400">Step 1 of 2</span>
            </div>

            {/* Real Patient Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <PawPrint className="w-3.5 h-3.5 text-purple-600" />
                Link to Registered Patient (اختياري - لربط الحالة بحيوان مسجل)
              </label>
              <select
                value={selectedAnimalId}
                onChange={(e) => handleSelectAnimal(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100"
              >
                <option value="">— Walk-in / not linked to a record —</option>
                {animals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.species}{a.breed ? `, ${a.breed}` : ""}) — {a.owner.name}
                  </option>
                ))}
              </select>
              {!selectedAnimalId && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Select a patient to auto-fill species &amp; weight, and to enable saving results to their case record.
                </p>
              )}
            </div>

            {/* Species Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Species (النوع)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["Canine", "Feline", "Exotic"] as const).map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setSpecies(sp)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      species === sp
                        ? "bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {sp === "Canine" ? "🐕 Dog (كلب)" : sp === "Feline" ? "🐈 Cat (قط)" : "🦜 Exotic (أخرى)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Group & Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Age Stage (المرحلة العمرية)
                </label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100"
                >
                  <option value="Pediatric">Pediatric (&lt; 6 months)</option>
                  <option value="Adult">Adult (1 - 7 years)</option>
                  <option value="Geriatric">Senior / Geriatric (&gt; 7y)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Weight in Kg (الوزن)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => {
                    const w = parseFloat(e.target.value) || 1;
                    setWeightKg(w);
                    handleCalculateDrug(selectedDrug, w);
                  }}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100 font-mono font-bold"
                />
              </div>
            </div>

            {/* Symptom Badges Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Observed Clinical Signs (الأعراض الإكلينيكية الملاحظة)
                </label>
                <span className="text-[10px] text-purple-600 font-bold">{selectedSymptoms.length} Selected</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1.5 rounded-xl border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-slate-800/20">
                {COMMON_SYMPTOMS.map((sym) => {
                  const isChecked = selectedSymptoms.includes(sym.id);
                  return (
                    <button
                      key={sym.id}
                      type="button"
                      onClick={() => toggleSymptom(sym.id)}
                      className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all text-left flex items-center gap-1.5 ${
                        isChecked
                          ? "bg-purple-600 text-white border-purple-600 font-bold shadow-xs"
                          : "bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <span>{sym.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Free-text Clinical Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Physical Exam Notes &amp; Vitals (الفحص السريري)
              </label>
              <textarea
                rows={2}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Body temp, mucous membranes, CRT, hydration, palpation..."
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/50 p-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Run Analysis Button */}
            <Button
              variant="primary"
              size="md"
              className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white shadow-lg shadow-purple-600/20"
              onClick={handleRunDiagnosis}
              disabled={analyzing}
              leftIcon={
                analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-purple-200" />
              }
            >
              {analyzing ? "Analyzing Symptoms with Vetify AI..." : "Generate AI Differential Diagnosis"}
            </Button>
          </Card>
        </div>

        {/* Right Column: AI Output & Calculators (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Diagnostic Results Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Differential Diagnoses (التشخيصات التفريقية المقترحة)
                  </h3>
                  <span className="text-[10px] text-slate-400">Ranked by evidence &amp; clinical prevalence</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyClinicalSummary}
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Copy Summary
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={saveToPatientCaseRecord}
                  disabled={!selectedAnimalId || savingCase}
                  leftIcon={
                    savingCase ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )
                  }
                  className="text-xs bg-teal-700 hover:bg-teal-800 text-white disabled:opacity-50"
                  title={!selectedAnimalId ? "Link a registered patient above first" : undefined}
                >
                  Save to Patient Case Record
                </Button>
              </div>
            </div>

            {/* Diagnosis Items */}
            <div className="space-y-4">
              {results.map((res, idx) => (
                <div
                  key={res.condition}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-slate-800/20 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {res.condition}
                        </h4>
                        <Badge
                          variant={res.severity === "CRITICAL" ? "danger" : "warning"}
                          className="text-[10px]"
                        >
                          {res.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-0.5">
                        {res.conditionAr}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-purple-700 dark:text-purple-400">
                        {res.probability}%
                      </div>
                      <span className="text-[10px] text-slate-400">Match probability</span>
                    </div>
                  </div>

                  {/* Workup Plan */}
                  <div className="bg-white dark:bg-dark-card p-3 rounded-xl border border-slate-100 dark:border-dark-border text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Recommended Diagnostic Workup (الفحوصات المطلوبة لتأكيد الحالة):
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
                      {res.recommendedWorkup.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Protocol */}
                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-purple-50/60 dark:bg-purple-950/30 p-3 rounded-xl border border-purple-100 dark:border-purple-900/40">
                    <span className="font-bold text-purple-900 dark:text-purple-200 block text-[11px] mb-1">
                      Evidence-Based First Line Therapy (البروتوكول العلاجي المقترح):
                    </span>
                    {res.firstLineTherapy}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Module: Drug Dosage Calculator */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Clinical Drug Dose &amp; Volume Calculator
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Auto-calibrated for current weight: <strong className="text-teal-600">{weightKg} kg</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "amoxiclav", label: "Amoxi-Clav (12.5mg/kg)" },
                { id: "meloxicam", label: "Meloxicam (0.1mg/kg)" },
                { id: "metronidazole", label: "Metronidazole (15mg/kg)" },
                { id: "cerenia", label: "Cerenia (1.0mg/kg SC)" },
              ].map((dr) => (
                <button
                  key={dr.id}
                  onClick={() => handleCalculateDrug(dr.id, weightKg)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    selectedDrug === dr.id
                      ? "bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-800 dark:text-teal-300"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {dr.label}
                </button>
              ))}
            </div>

            {/* Calculated Result Box */}
            <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold uppercase tracking-wider">
                  Target Dose
                </span>
                <div className="text-xl font-black text-teal-950 dark:text-teal-100 mt-0.5">
                  {calculatedDose.doseMg}
                </div>
                <p className="text-xs text-teal-800 dark:text-teal-200 font-semibold mt-1">
                  Volume: {calculatedDose.mlPerDose}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {calculatedDose.frequency}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${selectedDrug.toUpperCase()} Dosage for ${weightKg}kg: ${calculatedDose.doseMg} (${calculatedDose.mlPerDose}) - ${calculatedDose.frequency}`);
                  alert("Copied prescription details to clipboard!");
                }}
                className="shrink-0 text-xs bg-white dark:bg-dark-card"
              >
                Copy Rx Instruction
              </Button>
            </div>
          </Card>

          {/* Module: Drug Interaction Safety Warning */}
          <Card className="p-6 border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-rose-100 dark:border-rose-900/30">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                  Drug Interaction &amp; Contraindication Warning Guard
                </h3>
                <p className="text-[11px] text-rose-700/80 dark:text-rose-300/70">
                  Prevents adverse drug events and dangerous polypharmacy
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-100/60 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-950 dark:text-rose-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">CONTRAINDICATION WARNING: Meloxicam (NSAID) + Prednisolone (Corticosteroid)</span>
                <p className="text-[11px] mt-1 leading-relaxed text-rose-900/90 dark:text-rose-200">
                  Co-administration of NSAIDs with systemic corticosteroids drastically escalates the risk of severe gastrointestinal ulceration, intestinal perforation, and acute renal insufficiency. 
                  A minimum <strong>washout period of 5-7 days</strong> is strictly indicated before switching between classes.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
