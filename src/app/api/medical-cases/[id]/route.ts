import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditForRequest } from "@/lib/audit";
import { cleanText } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, diagnosis, symptoms, treatmentPlan, temperature, weightKg, heartRate, respirationRate, bcs, isVisibleToClient, prescriptions } = body;
    const allowedStatuses = ["OPEN", "IN_PROGRESS", "COMPLETED"];
    const optionalNumber = (value: unknown, min: number, max: number) => value === undefined || value === null || value === "" ||
      (Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max);
    const cleanDiagnosis = cleanText(diagnosis, 500);
    const cleanSymptoms = cleanText(symptoms ?? "", 3000);
    const cleanTreatment = cleanText(treatmentPlan ?? "", 3000);
    const validRx = prescriptions === undefined || (Array.isArray(prescriptions) && prescriptions.length <= 30 && prescriptions.every((rx: any) =>
      rx && cleanText(rx.medicationName, 120).length >= 1 && cleanText(rx.dosage, 120).length >= 1 &&
      cleanText(rx.frequency, 120).length >= 1 && Number.isInteger(Number(rx.durationDays)) && Number(rx.durationDays) >= 1 && Number(rx.durationDays) <= 365 &&
      (rx.instructions === undefined || (typeof rx.instructions === "string" && rx.instructions.length <= 1000))
    ));
    if (!allowedStatuses.includes(status) || cleanDiagnosis.length < 2 || !optionalNumber(temperature, 25, 45) ||
        !optionalNumber(weightKg, 0, 2000) || !optionalNumber(heartRate, 0, 500) || !optionalNumber(respirationRate, 0, 200) ||
        (bcs !== undefined && !["3/9", "4/9", "5/9", "6/9", "7/9"].includes(bcs)) ||
        (isVisibleToClient !== undefined && typeof isVisibleToClient !== "boolean") || !validRx) {
      return NextResponse.json({ error: "Check case status, diagnosis, vital signs, body condition, and prescription details" }, { status: 400 });
    }
    const existing = await db.medicalCase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Medical case not found" }, { status: 404 });
    const updated = await db.$transaction(async (tx) => {
      const record = await tx.medicalCase.update({
        where: { id },
        data: {
          status,
          diagnosis: cleanDiagnosis,
          symptoms: cleanSymptoms,
          treatmentPlan: cleanTreatment,
          ...(temperature !== undefined ? { temperature: temperature === "" ? null : Number(temperature) } : {}),
          ...(weightKg !== undefined ? { weightKg: weightKg === "" ? null : Number(weightKg) } : {}),
          ...(heartRate !== undefined ? { heartRate: heartRate === "" ? null : Number(heartRate) } : {}),
          ...(respirationRate !== undefined ? { respirationRate: respirationRate === "" ? null : Number(respirationRate) } : {}),
          ...(bcs !== undefined ? { bcs } : {}),
          ...(isVisibleToClient !== undefined ? { isVisibleToClient } : {}),
        },
      });
      if (prescriptions !== undefined) {
        await tx.prescriptionItem.deleteMany({ where: { caseId: id } });
        if (prescriptions.length) await tx.prescriptionItem.createMany({ data: prescriptions.map((rx: any) => ({
          caseId: id,
          medicationName: cleanText(rx.medicationName, 120),
          dosage: cleanText(rx.dosage, 120),
          frequency: cleanText(rx.frequency, 120),
          durationDays: Number(rx.durationDays),
          instructions: cleanText(rx.instructions ?? "", 1000),
        })) });
      }
      return record;
    });
    await logAuditForRequest(req, {
      clinicId: existing.clinicId,
      userId: existing.veterinarianId,
      userName: "Attending Veterinarian",
      userRole: "VETERINARIAN",
      action: "UPDATE",
      entity: "MedicalCase",
      entityId: updated.id,
      details: `Updated consultation ${existing.caseNumber}: ${updated.status}`,
    });
    return NextResponse.json({ success: true, case: updated });
  } catch (error) {
    console.error("Failed to update medical case:", error);
    return NextResponse.json({ error: "Failed to update medical case" }, { status: 500 });
  }
}
