import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateDefaultClinicAndBranch } from "@/lib/clinicBranch";
import { logAuditForRequest } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const animalId = searchParams.get("animalId");
    const status = searchParams.get("status");

    const cases = await db.medicalCase.findMany({
      where: {
        AND: [
          animalId ? { animalId } : {},
          status && status !== "ALL" ? { status } : {},
        ],
      },
      include: {
        animal: {
          include: {
            owner: true,
          },
        },
        veterinarian: true,
        attachments: true,
        prescriptionItems: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ cases });
  } catch (error) {
    console.error("Error loading medical cases:", error);
    return NextResponse.json({ error: "Failed to load medical cases" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      animalId,
      veterinarianId,
      branchId,
      isVisibleToClient = true,
      temperature,
      weightKg,
      heartRate,
      respirationRate,
      bcs,
      diagnosis,
      symptoms,
      clinicalNotes,
      treatmentPlan,
      status = "COMPLETED",
      prescriptions = [],
      attachments = [],
    } = body;

    const { clinic, branch: activeBranch } = await getOrCreateDefaultClinicAndBranch(branchId);

    let activeVet = veterinarianId
      ? await db.user.findFirst({
          where: {
            clinicId: clinic.id,
            OR: [{ id: veterinarianId }, { email: veterinarianId }],
          },
        })
      : (await db.user.findFirst({ where: { clinicId: clinic.id, role: "VETERINARIAN" } })) ||
        (await db.user.findFirst({ where: { clinicId: clinic.id } }));

    if (!activeVet) {
      activeVet = (await db.user.findFirst()) || (await db.user.create({
        data: {
          clinicId: clinic.id,
          branchId: activeBranch.id,
          name: "Clinic Duty Doctor",
          email: "duty@petpals-vet.com",
          role: "VETERINARIAN",
          jobTitle: "Duty Veterinarian",
        },
      }));
    }

    const count = await db.medicalCase.count({ where: { clinicId: clinic.id } });
    const caseNumber = `CASE-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // Create the case
    const medicalCase = await db.medicalCase.create({
      data: {
        clinicId: clinic.id,
        branchId: activeBranch.id,
        animalId: animalId,
        veterinarianId: activeVet.id,
        caseNumber: caseNumber,
        status: status,
        isVisibleToClient: isVisibleToClient,
        temperature: temperature ? parseFloat(temperature) : null,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        heartRate: heartRate ? parseInt(heartRate) : null,
        respirationRate: respirationRate ? parseInt(respirationRate) : null,
        bcs: bcs || "5/9",
        diagnosis: diagnosis || "General Clinical Exam",
        symptoms: symptoms || "",
        clinicalNotes: clinicalNotes || "",
        treatmentPlan: treatmentPlan || "",
      },
    });

    // Add Prescriptions
    if (Array.isArray(prescriptions) && prescriptions.length > 0) {
      for (const rx of prescriptions) {
        if (rx.medicationName) {
          await db.prescriptionItem.create({
            data: {
              caseId: medicalCase.id,
              medicationName: rx.medicationName,
              dosage: rx.dosage || "1 dose",
              frequency: rx.frequency || "Once daily",
              durationDays: rx.durationDays ? parseInt(rx.durationDays) : 7,
              instructions: rx.instructions || "",
            },
          });
        }
      }
    }

    // Add Real File Attachments (Fixes old system limitation)
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        await db.medicalAttachment.create({
          data: {
            caseId: medicalCase.id,
            fileName: att.fileName || "Medical-Document.pdf",
            fileUrl: att.fileUrl || "/placeholder-xray.png",
            fileType: att.fileType || "XRAY",
            uploadedBy: activeVet.name,
          },
        });
      }
    }

    // Mandatory Audit Log
    await logAuditForRequest(req, {
      clinicId: clinic.id,
      userId: activeVet.id,
      userName: activeVet.name,
      userRole: activeVet.role,
      action: "CREATE",
      entity: "MedicalCase",
      entityId: medicalCase.id,
      details: `Created medical consultation ${caseNumber} with diagnosis: ${medicalCase.diagnosis}`,
    });

    return NextResponse.json({ success: true, case: medicalCase });
  } catch (error) {
    console.error("Failed to create medical case:", error);
    return NextResponse.json({ error: "Failed to create medical case" }, { status: 500 });
  }
}
