import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log("🧹 Starting Clean-Slate Factory Reset for Clinic Delivery...");

  try {
    const clinic = await prisma.clinic.findFirst();
    if (!clinic) {
      console.error("❌ No clinic record found.");
      return;
    }

    console.log(`🏥 Purging operational data for clinic: ${clinic.name}...`);

    const deletedInvoices = await prisma.invoice.deleteMany({ where: { clinicId: clinic.id } });
    console.log(`   - Deleted ${deletedInvoices.count} Invoices & Receipts`);

    const deletedBoarding = await prisma.boardingReservation.deleteMany({});
    console.log(`   - Deleted ${deletedBoarding.count} Boarding Reservations`);

    const deletedCases = await prisma.medicalCase.deleteMany({ where: { clinicId: clinic.id } });
    console.log(`   - Deleted ${deletedCases.count} Medical Cases`);

    const deletedAppointments = await prisma.appointment.deleteMany({ where: { clinicId: clinic.id } });
    console.log(`   - Deleted ${deletedAppointments.count} Appointments`);

    const deletedAnimals = await prisma.animal.deleteMany({ where: { clinicId: clinic.id } });
    console.log(`   - Deleted ${deletedAnimals.count} Animals / Patients`);

    const deletedOwners = await prisma.owner.deleteMany({ where: { clinicId: clinic.id } });
    console.log(`   - Deleted ${deletedOwners.count} Client & Owner Accounts`);


    console.log("✅ Database is now 100% clean and ready for clinic delivery!");
    console.log("✨ Preserved: Clinic settings, Branches, Staff accounts, and Service catalog.");
  } catch (error) {
    console.error("❌ Error cleaning database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
