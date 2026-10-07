import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";

async function main() {
  const clinic = await db.clinic.findFirst();
  if (!clinic) {
    console.error("Clinic not found");
    return;
  }

  const branch = await db.branch.findFirst({ where: { clinicId: clinic.id } });
  const UNIFIED_EMAIL = "staff@petpals-vet.com";
  const UNIFIED_PASSWORD = "Clinic@2026";
  const passwordHash = hashPassword(UNIFIED_PASSWORD);

  // 1. Create or update unified staff account
  const unifiedUser = await db.user.upsert({
    where: { email: UNIFIED_EMAIL },
    update: {
      passwordHash: passwordHash,
      isActive: true,
      role: "OWNER", // Full access for all clinic operations
      name: "PetPals Staff",
      jobTitle: "Clinic Staff & Administration",
    },
    create: {
      clinicId: clinic.id,
      branchId: branch?.id || null,
      name: "PetPals Staff",
      email: UNIFIED_EMAIL,
      passwordHash: passwordHash,
      role: "OWNER",
      jobTitle: "Clinic Staff & Administration",
      isActive: true,
    },
  });

  // 2. Also update all existing staff accounts to use the same unified password
  await db.user.updateMany({
    data: {
      passwordHash: passwordHash,
      isActive: true,
    },
  });

  console.log("=================================================");
  console.log(" [SUCCESS] UNIFIED CLINIC STAFF ACCOUNT READY");
  console.log("=================================================");
  console.log(" Email:    " + UNIFIED_EMAIL);
  console.log(" Password: " + UNIFIED_PASSWORD);
  console.log(" Role:     FULL ACCESS (Owner & Operations)");
  console.log(" All existing accounts also updated to: " + UNIFIED_PASSWORD);
  console.log("=================================================");
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
  });
