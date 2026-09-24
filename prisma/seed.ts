import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

// Default demo password for every seeded staff account. Documented here (and
// shown on the login screen) rather than hidden — this is a local demo
// clinic, not a production deployment.
const DEMO_PASSWORD = "Clinic@123";
const demoPasswordHash = hashPassword(DEMO_PASSWORD);

async function main() {
  console.log("🌱 Starting PetPals Veterinary Clinic local database seed...");

  // 1. Create Main Clinic
  const clinic = await prisma.clinic.upsert({
    where: { slug: "petpals" },
    update: {},
    create: {
      name: "PetPals Veterinary Clinic",
      slug: "petpals",
      phone: "+20 100 123 4567",
      email: "cairo@petpals-vet.com",
      address: "24 El-Tahrir St, Dokki, Giza, Egypt",
      country: "Egypt",
      currency: "EGP",
      timezone: "Africa/Cairo",
      taxRate: 14.0,
      themePrimary: "#0F766E",
    },
  });

  // 2. Create Branches
  const dokkiBranch = await prisma.branch.create({
    data: {
      clinicId: clinic.id,
      name: "Dokki Main Branch",
      address: "24 El-Tahrir St, Dokki",
      phone: "+20 2 3761 0000",
    },
  });

  const newCairoBranch = await prisma.branch.create({
    data: {
      clinicId: clinic.id,
      name: "New Cairo Branch",
      address: "5th Settlement, 90th Street North",
      phone: "+20 2 2810 5555",
    },
  });

  const zayedBranch = await prisma.branch.create({
    data: {
      clinicId: clinic.id,
      name: "Sheikh Zayed Branch",
      address: "Arkan Plaza, 2nd Floor, Sheikh Zayed",
      phone: "+20 2 3850 7777",
    },
  });

  // 3. Create Users with RBAC Roles
  const drOmar = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      branchId: dokkiBranch.id,
      name: "Dr. Omar Khaled",
      email: "omar@petpals-vet.com",
      passwordHash: demoPasswordHash,
      role: "OWNER",
      jobTitle: "Founder & Chief Veterinarian",
      licenseNumber: "EG-VET-9821",
      specialization: "Soft Tissue Surgery & Diagnostics",
      experienceYears: 14,
      shift: "Full-Time",
      phone: "+20 100 888 1111",
      emergencyPhone: "+20 100 999 2222",
    },
  });

  const drSara = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      branchId: dokkiBranch.id,
      name: "Dr. Sara Mostafa",
      email: "sara@petpals-vet.com",
      passwordHash: demoPasswordHash,
      role: "VETERINARIAN",
      jobTitle: "Senior Veterinary Physician",
      licenseNumber: "EG-VET-1104",
      specialization: "Feline Internal Medicine & Dermatology",
      experienceYears: 8,
      shift: "Morning (9 AM - 5 PM)",
      phone: "+20 101 222 3333",
    },
  });

  const sarahReception = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      branchId: dokkiBranch.id,
      name: "Sarah Ahmed",
      email: "sarah@petpals-vet.com",
      passwordHash: demoPasswordHash,
      role: "RECEPTIONIST",
      jobTitle: "Head Receptionist & Client Liaison",
      shift: "Morning (8:30 AM - 4:30 PM)",
      phone: "+20 102 333 4444",
    },
  });

  const tarekAccountant = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      branchId: dokkiBranch.id,
      name: "Tarek Mansour",
      email: "tarek@petpals-vet.com",
      passwordHash: demoPasswordHash,
      role: "ACCOUNTANT",
      jobTitle: "Financial Controller",
      shift: "Full-Time",
      phone: "+20 103 444 5555",
    },
  });

  // 4. Record Mandatory Audit Logs (Demonstrating user tracking fix)
  await prisma.auditLog.createMany({
    data: [
      {
        clinicId: clinic.id,
        userId: drOmar.id,
        userName: drOmar.name,
        userRole: drOmar.role,
        action: "LOGIN",
        entity: "Staff",
        entityId: drOmar.id,
        details: "Owner logged in from local workstation",
        ipAddress: "127.0.0.1",
      },
      {
        clinicId: clinic.id,
        userId: sarahReception.id,
        userName: sarahReception.name,
        userRole: sarahReception.role,
        action: "CREATE",
        entity: "Animal",
        details: "Registered new patient Max (Golden Retriever)",
        ipAddress: "127.0.0.1",
      },
    ],
  });

  // 5. Create Sample Pet Owners & Animals
  const owner1 = await prisma.owner.create({
    data: {
      clinicId: clinic.id,
      name: "Mohamed El-Sayed",
      phone: "+20 100 777 6655",
      email: "m.elsayed@gmail.com",
      address: "Dokki, Giza",
      balance: 0.0,
    },
  });

  const petMax = await prisma.animal.create({
    data: {
      clinicId: clinic.id,
      ownerId: owner1.id,
      name: "Max",
      species: "Canine",
      breed: "Golden Retriever",
      gender: "Male",
      color: "Golden Cream",
      microchipNumber: "900118000234567",
      weightKg: 28.5,
      isNeutered: true,
    },
  });

  const owner2 = await prisma.owner.create({
    data: {
      clinicId: clinic.id,
      name: "Nourhan Adel",
      phone: "+20 111 444 8899",
      email: "nourhan.adel@yahoo.com",
      address: "Zamalek, Cairo",
      balance: 150.0,
    },
  });

  const petLuna = await prisma.animal.create({
    data: {
      clinicId: clinic.id,
      ownerId: owner2.id,
      name: "Luna",
      species: "Feline",
      breed: "Persian Cat",
      gender: "Female",
      color: "Pure White",
      microchipNumber: "900118000987654",
      weightKg: 3.8,
      isNeutered: false,
    },
  });

  // 6. Create Service Categories & Services
  const catConsult = await prisma.serviceCategory.create({
    data: { name: "Consultation", code: "CONSULT" },
  });

  const catVaccine = await prisma.serviceCategory.create({
    data: { name: "Vaccines", code: "VACCINES" },
  });

  const catSurgery = await prisma.serviceCategory.create({
    data: { name: "Surgeries", code: "SURGERIES" },
  });

  await prisma.service.createMany({
    data: [
      {
        clinicId: clinic.id,
        categoryId: catConsult.id,
        name: "General Health Checkup & Consultation",
        price: 350.0,
        cost: 50.0,
        durationMinutes: 30,
      },
      {
        clinicId: clinic.id,
        categoryId: catVaccine.id,
        name: "Rabies Annual Vaccination",
        price: 450.0,
        cost: 180.0,
        durationMinutes: 15,
      },
      {
        clinicId: clinic.id,
        categoryId: catVaccine.id,
        name: "Comprehensive 8-in-1 Canine Vaccine",
        price: 650.0,
        cost: 260.0,
        durationMinutes: 20,
      },
      {
        clinicId: clinic.id,
        categoryId: catSurgery.id,
        name: "Ultrasonic Dental Scaling & Polishing",
        price: 1200.0,
        cost: 200.0,
        durationMinutes: 60,
      },
    ],
  });

  // 7. Create Inventory Items with Batches and Barcodes
  const invMedCat = await prisma.inventoryCategory.create({
    data: { name: "Medications", code: "MED" },
  });

  const invVaccineCat = await prisma.inventoryCategory.create({
    data: { name: "Vaccines", code: "VAC" },
  });

  await prisma.inventoryItem.createMany({
    data: [
      {
        clinicId: clinic.id,
        branchId: dokkiBranch.id,
        categoryId: invVaccineCat.id,
        name: "Rabisin Vaccine (10 doses)",
        sku: "VAC-RAB-01",
        barcode: "6221009988771",
        quantity: 3,
        minStockAlert: 10,
        unitCost: 180.0,
        salePrice: 450.0,
        batchNumber: "BCH-2026-09",
        expiryDate: new Date("2026-12-31"),
        isPosAvailable: true,
      },
      {
        clinicId: clinic.id,
        branchId: dokkiBranch.id,
        categoryId: invMedCat.id,
        name: "Bravecto Chewable 20-40kg",
        sku: "MED-BRAV-L",
        barcode: "6221009988772",
        quantity: 4,
        minStockAlert: 12,
        unitCost: 480.0,
        salePrice: 850.0,
        batchNumber: "BCH-2026-11",
        expiryDate: new Date("2027-04-30"),
        isPosAvailable: true,
      },
      {
        clinicId: clinic.id,
        branchId: dokkiBranch.id,
        categoryId: invMedCat.id,
        name: "Amoxiclav 250mg Suspension",
        sku: "MED-AMOX-250",
        barcode: "6221009988773",
        quantity: 6,
        minStockAlert: 15,
        unitCost: 65.0,
        salePrice: 160.0,
        batchNumber: "BCH-2026-02",
        expiryDate: new Date("2026-10-15"),
        isPosAvailable: true,
      },
    ],
  });

  // 8. Create Invoices with multi-payment
  await prisma.invoice.create({
    data: {
      clinicId: clinic.id,
      branchId: dokkiBranch.id,
      invoiceNumber: "INV-2026-001084",
      customerName: "Mohamed El-Sayed",
      customerPhone: "+20 100 777 6655",
      ownerId: owner1.id,
      animalId: petMax.id,
      status: "PAID",
      subtotal: 800.0,
      discount: 0.0,
      tax: 112.0,
      total: 912.0,
      paidAmount: 912.0,
      dueAmount: 0.0,
      paymentMethod: "INSTAPAY", // Multi-payment support!
      type: "INVOICE",
      notes: "Annual checkup + Rabies shot",
    },
  });

  // 9. Boarding Rooms + active reservations
  const room101 = await prisma.boardingRoom.create({
    data: { roomNumber: "Room 101", roomType: "DELUXE", capacity: 1, pricePerDay: 350.0 },
  });
  const room102 = await prisma.boardingRoom.create({
    data: { roomNumber: "Room 102", roomType: "SUITE", capacity: 1, pricePerDay: 500.0 },
  });
  await prisma.boardingRoom.create({
    data: { roomNumber: "Room 103", roomType: "STANDARD", capacity: 1, pricePerDay: 250.0 },
  });
  await prisma.boardingRoom.create({
    data: { roomNumber: "Room 104", roomType: "STANDARD", capacity: 1, pricePerDay: 250.0 },
  });
  await prisma.boardingRoom.create({
    data: { roomNumber: "Room 105", roomType: "ISOLATION", capacity: 1, pricePerDay: 400.0 },
  });

  const boardingStart = new Date();
  const boardingEnd101 = new Date(Date.now() + 5 * 86400000);
  const boardingEnd102 = new Date(Date.now() + 6 * 86400000);

  await prisma.boardingReservation.create({
    data: {
      roomId: room101.id,
      animalId: petMax.id,
      startDate: boardingStart,
      endDate: boardingEnd101,
      dailyRate: room101.pricePerDay,
      status: "ACTIVE",
    },
  });
  await prisma.boardingReservation.create({
    data: {
      roomId: room102.id,
      animalId: petLuna.id,
      startDate: boardingStart,
      endDate: boardingEnd102,
      dailyRate: room102.pricePerDay,
      status: "ACTIVE",
    },
  });

  // 10. Client Portal Support Tickets
  await prisma.clientTicket.create({
    data: {
      clinicId: clinic.id,
      ownerId: owner1.id,
      subject: "Post-surgery prescription question",
      message:
        "Hello Dr. Omar, Max vomited once after taking the morning tablet. Should I continue with the evening dose or switch to soft food?",
      priority: "HIGH",
      status: "OPEN",
    },
  });
  await prisma.clientTicket.create({
    data: {
      clinicId: clinic.id,
      ownerId: owner2.id,
      subject: "Requesting medical history PDF for travel",
      message:
        "Please send an official copy of Luna's vaccination booklet and rabies titer result for international flight next week.",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
    },
  });

  // 11. Suppliers, Purchases & Expenses
  const pharmaVet = await prisma.supplier.create({
    data: {
      clinicId: clinic.id,
      name: "PharmaVet Distribution Egypt",
      category: "Pharmaceuticals & Vaccines",
      contactPerson: "Dr. Hany Ezzat",
      phone: "+20 100 555 1122",
      email: "orders@pharmavet-eg.com",
      city: "Cairo, Egypt",
      paymentTerms: "Net 30 Days",
    },
  });
  const boehringer = await prisma.supplier.create({
    data: {
      clinicId: clinic.id,
      name: "Boehringer Ingelheim Animal Health",
      category: "Biologicals & Parasiticides",
      contactPerson: "Eng. Amr Shalaby",
      phone: "+20 111 666 3344",
      email: "egypt.vet@boehringer.com",
      city: "Giza, Egypt",
      paymentTerms: "Net 45 Days",
      outstandingBalance: 11500,
    },
  });
  await prisma.supplier.create({
    data: {
      clinicId: clinic.id,
      name: "Royal Canin Egypt Official",
      category: "Veterinary Clinical Diets",
      contactPerson: "Ramy Soliman",
      phone: "+20 102 777 8899",
      email: "vetorders@royalcanin.eg",
      city: "Alexandria, Egypt",
      paymentTerms: "Immediate Cash",
    },
  });

  await prisma.purchase.create({
    data: {
      clinicId: clinic.id,
      branchId: dokkiBranch.id,
      supplierId: pharmaVet.id,
      poNumber: "PO-2026-0089",
      itemsCount: 5,
      totalAmount: 14800,
      paidAmount: 14800,
      paymentStatus: "PAID",
    },
  });
  await prisma.purchase.create({
    data: {
      clinicId: clinic.id,
      branchId: dokkiBranch.id,
      supplierId: boehringer.id,
      poNumber: "PO-2026-0088",
      itemsCount: 3,
      totalAmount: 26500,
      paidAmount: 15000,
      paymentStatus: "PARTIAL",
    },
  });

  await prisma.expense.create({
    data: {
      clinicId: clinic.id,
      branchId: dokkiBranch.id,
      category: "Rent & Facilities",
      description: "Monthly Clinic Facility Rent - Dokki",
      amount: 45000,
      method: "Bank Wire",
      recordedBy: "Tarek Mansour (Accountant)",
    },
  });
  await prisma.expense.create({
    data: {
      clinicId: clinic.id,
      branchId: dokkiBranch.id,
      category: "Utilities & Power",
      description: "Electricity & Backup Generator Fuel",
      amount: 8200,
      method: "Cash",
      recordedBy: "Tarek Mansour (Accountant)",
    },
  });

  // Grooming sessions
  await prisma.groomingSession.create({
    data: {
      clinicId: clinic.id,
      branchId: dokkiBranch.id,
      animalId: petMax.id,
      service: "Full Luxury Grooming & Bath",
      stylist: "Ahmed - Groomer",
      price: 450,
      status: "SCHEDULED",
    },
  });
  await prisma.groomingSession.create({
    data: {
      clinicId: clinic.id,
      branchId: dokkiBranch.id,
      animalId: petLuna.id,
      service: "De-shedding & Hygienic Trim",
      stylist: "Ahmed - Groomer",
      price: 380,
      status: "IN_PROGRESS",
    },
  });

  // Vaccination / passport records
  await prisma.vaccinationRecord.create({
    data: {
      clinicId: clinic.id,
      animalId: petMax.id,
      vaccineType: "RABIES",
      productName: "Rabisin (Boehringer Ingelheim)",
      batchNumber: "BCH-2026-RAB-09",
      dateGiven: new Date("2026-06-10"),
      validUntil: new Date("2027-06-09"),
      vetName: "Dr. Ahmed El-Sayed",
      vetLicense: "EGY-VET-CAI-14802",
    },
  });
  await prisma.vaccinationRecord.create({
    data: {
      clinicId: clinic.id,
      animalId: petMax.id,
      vaccineType: "DEWORMING",
      productName: "Drontal Plus Flavour Tablets",
      dateGiven: new Date("2026-08-15"),
      validUntil: new Date("2026-11-15"),
    },
  });
  await prisma.vaccinationRecord.create({
    data: {
      clinicId: clinic.id,
      animalId: petLuna.id,
      vaccineType: "RABIES",
      productName: "Purevax Feline Rabies",
      batchNumber: "BCH-2026-PUR-18",
      dateGiven: new Date("2026-02-18"),
      validUntil: new Date("2027-02-17"),
      vetName: "Dr. Sara Nabil",
      vetLicense: "EGY-VET-CAI-18204",
    },
  });

  console.log("✅ PetPals Veterinary Clinic seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
