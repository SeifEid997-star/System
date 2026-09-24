import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";
import { hashPassword } from "../src/lib/password";

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main() {
  const clinicName = required("CLINIC_NAME");
  const clinicSlug = required("CLINIC_SLUG").toLowerCase();
  const clinicEmail = required("CLINIC_EMAIL").toLowerCase();
  const clinicPhone = required("CLINIC_PHONE");
  const clinicAddress = required("CLINIC_ADDRESS");
  const ownerName = required("INITIAL_OWNER_NAME");
  const ownerEmail = required("INITIAL_OWNER_EMAIL").toLowerCase();
  const ownerPassword = required("INITIAL_OWNER_PASSWORD");

  if (ownerPassword.length < 16 || !/[a-z]/.test(ownerPassword) || !/[A-Z]/.test(ownerPassword) || !/\d/.test(ownerPassword)) {
    throw new Error("INITIAL_OWNER_PASSWORD must be at least 16 characters and include upper/lowercase letters and a number.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clinicEmail)) {
    throw new Error("Clinic and owner email addresses must be valid.");
  }

  if (await prisma.clinic.count() || await prisma.user.count()) {
    throw new Error("Refusing to seed a non-empty database. Use a new empty Supabase database for first-time setup.");
  }

  await prisma.$transaction(async (tx) => {
    const clinic = await tx.clinic.create({
      data: {
        name: clinicName,
        slug: clinicSlug,
        email: clinicEmail,
        phone: clinicPhone,
        address: clinicAddress,
      },
    });
    const branch = await tx.branch.create({
      data: { clinicId: clinic.id, name: "Main Branch", address: clinicAddress, phone: clinicPhone, tier: "PRIMARY" },
    });
    await tx.user.create({
      data: {
        clinicId: clinic.id,
        branchId: branch.id,
        name: ownerName,
        email: ownerEmail,
        phone: clinicPhone,
        passwordHash: hashPassword(ownerPassword),
        role: "OWNER",
        jobTitle: "Clinic Owner",
        isActive: true,
      },
    });

    for (const [name, code] of [["Medications", "MED"], ["Vaccines", "VAC"], ["Anti-Parasitics", "ANTI"], ["Pet Food", "FOOD"], ["Consumables", "CONSUMABLES"]]) {
      await tx.inventoryCategory.create({ data: { name, code } });
    }
    for (const [name, code] of [["Consultation", "CONSULT"], ["Vaccination", "SERVICE_VAC"], ["Surgery", "SURGERY"], ["Grooming", "GROOMING"]]) {
      await tx.serviceCategory.create({ data: { name, code } });
    }
    await tx.boardingRoom.create({ data: { roomNumber: "Room-01", roomType: "STANDARD", capacity: 1, pricePerDay: 250 } });
  });

  console.log(`Production clinic initialized for ${clinicName}. Sign in with ${ownerEmail} and the one-time owner password you supplied.`);
}

main()
  .catch((error) => { console.error("Production bootstrap failed:", error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
