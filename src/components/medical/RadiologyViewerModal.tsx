"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  SunMoon,
  Download,
  Eye,
  FileCheck,
} from "lucide-react";

interface RadiologyViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedBy?: string;
  } | null;
}

export function RadiologyViewerModal({
  isOpen,
  onClose,
  file,
}: RadiologyViewerModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [inverted, setInverted] = useState(false);

  if (!isOpen || !file) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const toggleInvert = () => setInverted((prev) => !prev);
  const resetControls = () => {
    setZoom(1);
    setRotation(0);
    setInverted(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700/70 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
        {/* Top Control Bar */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-300">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {file.fileName}
                </h3>
                <Badge variant="brand" className="text-[10px]">
                  {file.fileType}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400">
                Uploaded by: {file.uploadedBy || "Veterinarian"} &bull; DICOM/JPEG Image Viewer
              </p>
            </div>
          </div>

          {/* Radiology Tool Controls */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-700">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleRotate}
              title="Rotate 90°"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1" />
            <button
              onClick={toggleInvert}
              title="Invert Contrast (Radiology Bone Inspection)"
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium ${
                inverted
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              <SunMoon className="w-4 h-4" />
              <span>Invert</span>
            </button>
            <button
              onClick={resetControls}
              className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded transition-colors"
            >
              Reset
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Canvas */}
        <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-black/60 p-6 select-none">
          <div
            className="transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              filter: inverted ? "invert(1) contrast(1.4)" : "none",
            }}
          >
            {/* If SVG / Canvas mock or image */}
            <div className="relative max-w-full max-h-[70vh] flex flex-col items-center">
              {/* High definition stylized X-Ray demonstration graphic */}
              <div className="w-[520px] h-[380px] bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-8 relative shadow-2xl">
                <div className="absolute top-4 left-4 text-left font-mono text-[10px] text-slate-500">
                  <div>PATIENT: MAX (CANINE)</div>
                  <div>ID: 900118000234567</div>
                  <div>LATERAL THORACIC VIEW</div>
                  <div>kV: 68 | mAs: 3.2</div>
                </div>

                <div className="absolute bottom-4 right-4 text-right font-mono text-[10px] text-brand-400">
                  PETPALS RADIOLOGY LAB
                </div>

                {/* Simulated X-Ray Bone Structure */}
                <div className="w-64 h-44 border-2 border-slate-600/40 rounded-full flex items-center justify-center relative">
                  <div className="w-48 h-28 border border-white/30 rounded-3xl flex items-center justify-center">
                    <div className="space-y-1.5 w-32">
                      <div className="h-2 bg-white/40 rounded-full w-full" />
                      <div className="h-2 bg-white/50 rounded-full w-5/6" />
                      <div className="h-2 bg-white/60 rounded-full w-full" />
                      <div className="h-2 bg-white/50 rounded-full w-4/6" />
                    </div>
                  </div>
                  <div className="absolute top-2 right-6 w-12 h-12 rounded-full border border-white/40 bg-white/10" />
                </div>

                <span className="text-xs text-slate-400 mt-4 font-mono">
                  [ DICOM RADIOGRAPH VIEW &bull; HIGH RESOLUTION ]
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>Integrity Verified &bull; Tied to Case &amp; Patient Registry</span>
          </div>
          <div className="font-mono">Zoom: {Math.round(zoom * 100)}%</div>
        </div>
      </div>
    </div>
  );
}
