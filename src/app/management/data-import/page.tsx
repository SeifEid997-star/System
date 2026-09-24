"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  ArrowRight,
  FileText,
  Trash2,
  Check,
} from "lucide-react";

interface ImportRow {
  id: string;
  clientName: string;
  phone: string;
  nationalId: string;
  animalName: string;
  species: string;
  breed: string;
  gender: string;
  microchip: string;
  status: "VALID" | "WARNING";
  notes?: string;
}

const SAMPLE_ROWS: ImportRow[] = [
  {
    id: "1",
    clientName: "Mohamed Mostafa",
    phone: "+20 101 234 5678",
    nationalId: "28805120102911",
    animalName: "Rocky",
    species: "Canine",
    breed: "Rottweiler",
    gender: "Male",
    microchip: "900-118-000-882-101",
    status: "VALID",
  },
  {
    id: "2",
    clientName: "Nouran El-Gazzar",
    phone: "+20 112 345 6789",
    nationalId: "29411020104822",
    animalName: "Simba",
    species: "Feline",
    breed: "Persian",
    gender: "Male",
    microchip: "900-118-000-449-302",
    status: "VALID",
  },
  {
    id: "3",
    clientName: "Ashraf Gamal",
    phone: "+20 120 987 6543",
    nationalId: "28003150101928",
    animalName: "Lucy",
    species: "Canine",
    breed: "Labrador Retriever",
    gender: "Female",
    microchip: "900-118-000-115-492",
    status: "VALID",
  },
  {
    id: "4",
    clientName: "Dalia Helmy",
    phone: "+20 109 876 5432",
    nationalId: "29107080103381",
    animalName: "Cleo",
    species: "Feline",
    breed: "Siamese",
    gender: "Female",
    microchip: "900-118-000-993-210",
    status: "VALID",
  },
  {
    id: "5",
    clientName: "Tamer Badawy",
    phone: "+20 114 555 1212",
    nationalId: "28609200100412",
    animalName: "Kodiak",
    species: "Canine",
    breed: "Husky",
    gender: "Male",
    microchip: "900-118-000-551-784",
    status: "VALID",
  },
];

export default function DataImportPage() {
  const [rows, setRows] = useState<ImportRow[]>(SAMPLE_ROWS);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Download Sample Template CSV
  const handleDownloadTemplate = () => {
    const csvContent = `Client Name,Phone Number,National ID,Animal Name,Species,Breed,Gender,Microchip Number
Ahmed Hassan,+20 100 000 0001,29001010100000,Buddy,Canine,Golden Retriever,Male,900-118-000-000-001
Mariam Ali,+20 111 000 0002,29502020100000,Bella,Feline,Shirazi,Female,900-118-000-000-002
Sherif Zaki,+20 122 000 0003,28803030100000,Oscar,Canine,German Shepherd,Male,900-118-000-000-003
`;
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Qlinic_Migration_Template.csv");
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        alert("File appears empty or missing rows.");
        return;
      }

      // Skip header row
      const parsed: ImportRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
        if (cols.length >= 4) {
          parsed.push({
            id: `row-${i}`,
            clientName: cols[0] || "Unknown Client",
            phone: cols[1] || "+20 100 000 0000",
            nationalId: cols[2] || "",
            animalName: cols[3] || "Unnamed Pet",
            species: cols[4] || "Canine",
            breed: cols[5] || "",
            gender: cols[6] || "Male",
            microchip: cols[7] || "",
            status: cols[1] && cols[3] ? "VALID" : "WARNING",
          });
        }
      }

      if (parsed.length > 0) {
        setRows(parsed);
        setImportSuccess(null);
      }
    };
    reader.readAsText(file);
  };

  // Run Real DB Import
  const handleExecuteImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    setProgress(20);

    try {
      setProgress(50);
      const res = await fetch("/api/data-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: rows }),
      });

      setProgress(85);
      const data = await res.json();

      if (res.ok) {
        setProgress(100);
        setImportSuccess(`Successfully imported ${data.importedCount} records into PetPals SQLite database!`);
      } else {
        alert(data.error || "Failed to import records.");
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleClear = () => {
    setRows([]);
    setImportSuccess(null);
  };

  const handleLoadSample = () => {
    setRows(SAMPLE_ROWS);
    setImportSuccess(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Data Migration &amp; Bulk Import Wizard (استيراد وترحيل البيانات)
            </h1>
            <Badge variant="brand" dot>Prisma Live Engine</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Migrate legacy clinic records: Upload CSV/Excel sheets of Clients and Animals with live column validation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadTemplate}
            leftIcon={<Download className="w-4 h-4 text-emerald-600" />}
          >
            Download CSV Template
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleLoadSample}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Load Sample Dataset
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {importSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-200 animate-slide-up">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">عملية الترحيل تمت بنجاح!</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">{importSuccess}</p>
            </div>
          </div>
          <Badge variant="success">DB Synchronized</Badge>
        </div>
      )}

      {/* Upload Drop Zone Card */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border-2 border-dashed border-slate-200 dark:border-dark-border p-8 text-center hover:border-brand-500 transition-colors">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center mx-auto shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Upload Clients &amp; Patients CSV Spreadsheet
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports CSV exported from legacy software, VetPort, Idexx, or Microsoft Excel.
            </p>
          </div>
          <div className="pt-2">
            <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Select CSV File from Computer</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Pre-Import Validation & Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border">
        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-slate-400 block">Total Records</span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">{rows.length} Rows</span>
          </div>
          <div>
            <span className="text-slate-400 block">Ready to Import</span>
            <span className="font-extrabold text-emerald-600 text-sm">
              {rows.filter((r) => r.status === "VALID").length} Valid
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Warnings / Review</span>
            <span className="font-extrabold text-amber-500 text-sm">
              {rows.filter((r) => r.status === "WARNING").length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {rows.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              className="text-xs"
            >
              Clear
            </Button>
          )}

          <Button
            size="sm"
            variant="primary"
            onClick={handleExecuteImport}
            disabled={importing || rows.length === 0}
            leftIcon={importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          >
            {importing ? `Importing (${progress}%)...` : `Execute Import into Database (${rows.length})`}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {importing && (
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-brand-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Live Data Preview Table */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-card-light dark:shadow-card-dark overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-brand-600" />
            Live Preview &amp; Schema Mapping
          </h3>
          <Badge variant="brand">Automated Field Detection</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-dark-border">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">National ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Species &amp; Breed</th>
                <th className="py-3 px-4">Microchip No</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No records loaded. Click &quot;Load Sample Dataset&quot; or upload a CSV above.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-dark-hover/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{r.clientName}</td>
                    <td className="py-3.5 px-4 font-mono">{r.phone}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{r.nationalId || "-"}</td>
                    <td className="py-3.5 px-4 font-extrabold text-brand-700 dark:text-brand-400">
                      {r.animalName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {r.species} ({r.breed})
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{r.microchip || "-"}</td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={r.status === "VALID" ? "success" : "warning"} className="text-[10px]">
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
