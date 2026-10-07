import { db } from "./db";

export async function getOrCreateDefaultClinicAndBranch(branchId?: string | null) {
  let clinic = await db.clinic.findFirst();
  if (!clinic) {
    clinic = await db.clinic.create({
      data: {
        name: "PetPals Veterinary Clinic",
        slug: "petpals",
        phone: "+20 100 123 4567",
        email: "info@petpals-vet.com",
        address: "24 El-Tahrir St, Dokki, Giza, Egypt",
        taxId: "419-820-112",
        commercialId: "91048-Cairo",
        receiptFooter: "Thank you for trusting us! Medications sold are non-refundable once opened.",
      },
    });
  }

  let branch = branchId
    ? await db.branch.findFirst({ where: { id: branchId, clinicId: clinic.id } })
    : await db.branch.findFirst({ where: { clinicId: clinic.id } });

  if (!branch) {
    branch = await db.branch.create({
      data: {
        clinicId: clinic.id,
        name: "Dokki Main Branch",
        address: clinic.address || "24 El-Tahrir St, Dokki, Giza",
        phone: clinic.phone || "+20 100 123 4567",
        tier: "PRIMARY",
      },
    });
  }

  return { clinic, branch };
}
