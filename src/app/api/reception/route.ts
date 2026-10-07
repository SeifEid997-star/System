import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateDefaultClinicAndBranch } from "@/lib/clinicBranch";
import { logAuditForRequest } from "@/lib/audit";
import { cleanText, isValidEmail, isValidPhone, validDate } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      // Owner info
      ownerName,
      ownerPhone,
      ownerEmail,
      ownerAddress,
      // Animal info
      petName,
      species,
      breed,
      gender,
      birthDate,
      color,
      microchipNumber,
      weightKg,
      isNeutered,
      // Visit info
      visitType,
      reason,
      veterinarianId,
      branchId,
      immediateConsultation,
    } = body;

    const cleanOwnerName = cleanText(ownerName, 120);
    const cleanPhone = typeof ownerPhone === "string" ? ownerPhone.trim() : "";
    const cleanPetName = cleanText(petName, 100);
    const cleanSpecies = cleanText(species || "Canine", 40);
    const cleanVisitType = cleanText(visitType || "CONSULTATION", 40).toUpperCase();
    const numericWeight = weightKg === undefined || weightKg === "" ? 0 : Number(weightKg);
    const allowedSpecies = ["Canine", "Feline", "Avian", "Exotic"];
    const allowedVisitTypes = ["CONSULTATION", "VACCINATION", "SURGERY", "BOARDING", "GROOMING", "EMERGENCY"];
    if (cleanOwnerName.length < 2 || !/\p{L}/u.test(cleanOwnerName) || !isValidPhone(cleanPhone) || !cleanPetName ||
        !allowedSpecies.includes(cleanSpecies) || !allowedVisitTypes.includes(cleanVisitType) ||
        (ownerEmail && !isValidEmail(ownerEmail)) || !Number.isFinite(numericWeight) || numericWeight < 0 || numericWeight > 2000 ||
        (birthDate && (!validDate(birthDate) || new Date(birthDate) > new Date()))) {
      return NextResponse.json({ error: "Check owner name, phone, email, pet name, species, weight, and birth date" }, { status: 400 });
    }

    // 1. Get default clinic and branch with auto-healing
    const { clinic, branch } = await getOrCreateDefaultClinicAndBranch(branchId);

    // Resolve veterinarian safely so invalid/dummy vet IDs don't block check-in
    let resolvedVet = null;
    if (veterinarianId) {
      resolvedVet = await db.user.findFirst({
        where: {
          clinicId: clinic.id,
          OR: [{ id: veterinarianId }, { email: veterinarianId }],
        },
      });
    }
    if (!resolvedVet) {
      resolvedVet = (await db.user.findFirst({ where: { clinicId: clinic.id, role: "VETERINARIAN" } })) ||
                    (await db.user.findFirst({ where: { clinicId: clinic.id } }));
    }
    if (!resolvedVet) {
      resolvedVet = (await db.user.findFirst()) || (await db.user.create({
        data: {
          clinicId: clinic.id,
          branchId: branch.id,
          name: "Clinic Duty Doctor",
          email: "duty@petpals-vet.com",
          role: "VETERINARIAN",
          jobTitle: "Duty Veterinarian",
        },
      }));
    }

    // 2. Find or create Owner by phone
    let owner = await db.owner.findFirst({
      where: { clinicId: clinic.id, phone: ownerPhone },
    });

    if (!owner) {
      owner = await db.owner.create({
        data: {
          clinicId: clinic.id,
          name: cleanOwnerName,
          phone: cleanPhone,
          email: ownerEmail ? ownerEmail.trim().toLowerCase() : null,
          address: ownerAddress || null,
        },
      });
    }

    // 3. Create Animal
    const animal = await db.animal.create({
      data: {
        clinicId: clinic.id,
        ownerId: owner.id,
        name: cleanPetName,
        species: cleanSpecies,
        breed: breed || "Mixed",
        gender: gender || "Male",
        birthDate: birthDate ? new Date(birthDate) : null,
        color: color || null,
        microchipNumber: microchipNumber || null,
        weightKg: numericWeight,
        isNeutered: Boolean(isNeutered),
      },
    });

    // 4. Create Appointment
    const appointment = await db.appointment.create({
      data: {
        clinicId: clinic.id,
        branchId: branch.id,
        animalId: animal.id,
        veterinarianId: resolvedVet?.id || null,
        appointmentDate: new Date(),
        appointmentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: cleanVisitType,
        status: immediateConsultation ? "IN_PROGRESS" : "SCHEDULED",
        reason: reason || "General visit",
      },
    });

    // 5. If immediate consultation, create Medical Case right away!
    let medicalCase = null;
    if (immediateConsultation && resolvedVet) {
      const caseCount = await db.medicalCase.count({ where: { clinicId: clinic.id } });
      const caseNumber = `CASE-${new Date().getFullYear()}-${String(caseCount + 1).padStart(4, "0")}`;

      medicalCase = await db.medicalCase.create({
        data: {
          clinicId: clinic.id,
          branchId: branch.id,
          animalId: animal.id,
          veterinarianId: resolvedVet.id,
          caseNumber: caseNumber,
          status: "IN_PROGRESS",
          weightKg: numericWeight,
          symptoms: reason || "",
          clinicalNotes: `Admitted via Reception for ${visitType || "Consultation"}.`,
        },
      });
    }

    // 6. Log Audit with MANDATORY user tracking
    await logAuditForRequest(req, {
      clinicId: clinic.id,
      userId: veterinarianId || "reception-user",
      userName: "Reception Desk",
      userRole: "RECEPTIONIST",
      action: "CREATE",
      entity: "Animal",
      entityId: animal.id,
      details: `New patient registered: ${animal.name} (${animal.species}) for owner ${owner.name}`,
    });

    return NextResponse.json({
      success: true,
      owner,
      animal,
      appointment,
      medicalCase,
    });
  } catch (error) {
    console.error("Reception submission error:", error);
    return NextResponse.json(
      { error: "Failed to process reception entry" },
      { status: 500 }
    );
  }
}
