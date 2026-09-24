import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
const PREFIX = "QA15";

export async function clearQaScenarios() {
  const owners = await prisma.owner.findMany({ where: { name: { startsWith: `${PREFIX}-` } }, select: { id: true } });
  const ownerIds = owners.map((owner) => owner.id);
  const animals = await prisma.animal.findMany({ where: { name: { startsWith: `${PREFIX}-` } }, select: { id: true } });
  const animalIds = animals.map((animal) => animal.id);

  await prisma.$transaction(async (tx) => {
    await tx.invoice.deleteMany({ where: { invoiceNumber: { startsWith: `${PREFIX}-` } } });
    await tx.reminder.deleteMany({ where: { OR: [
      ...(animalIds.length ? [{ animalId: { in: animalIds } }] : []),
      { notes: { startsWith: `${PREFIX}-` } },
    ] } });
    await tx.clientTicket.deleteMany({ where: { OR: [
      ...(ownerIds.length ? [{ ownerId: { in: ownerIds } }] : []),
      { subject: { startsWith: `${PREFIX}-` } },
    ] } });
    await tx.appointment.deleteMany({ where: { OR: [
      ...(animalIds.length ? [{ animalId: { in: animalIds } }] : []),
      { reason: { startsWith: `${PREFIX}-` } },
    ] } });
    await tx.expense.deleteMany({ where: { description: { startsWith: `${PREFIX}-` } } });
    await tx.inventoryItem.deleteMany({ where: { sku: { startsWith: `${PREFIX}-` } } });
    await tx.boardingReservation.deleteMany({ where: { animalId: { in: animalIds } } });
    await tx.groomingSession.deleteMany({ where: { animalId: { in: animalIds } } });
    await tx.vaccinationRecord.deleteMany({ where: { animalId: { in: animalIds } } });
    await tx.medicalCase.deleteMany({ where: { animalId: { in: animalIds } } });
    await tx.animal.deleteMany({ where: { id: { in: animalIds } } });
    await tx.owner.deleteMany({ where: { id: { in: ownerIds } } });
    await tx.auditLog.deleteMany({ where: { details: { contains: PREFIX } } });
  }, { maxWait: 30_000, timeout: 30_000 });

  return { owners: ownerIds.length, animals: animalIds.length };
}

export async function seedQaScenarios() {
  await clearQaScenarios();
  const clinic = await prisma.clinic.findFirst();
  if (!clinic) throw new Error("No clinic is configured. Run the project setup first.");
  const branches = await prisma.branch.findMany({ where: { clinicId: clinic.id }, orderBy: { createdAt: "asc" } });
  const inventoryCategory = await prisma.inventoryCategory.findFirst();
  if (!branches.length || !inventoryCategory) throw new Error("A branch and inventory category are required.");

  const priorities = ["LOW", "LOW", "LOW", "LOW", "MEDIUM", "MEDIUM", "MEDIUM", "MEDIUM", "HIGH", "HIGH", "URGENT", "HIGH", "URGENT", "URGENT", "URGENT"];
  const species = ["Canine", "Feline", "Avian", "Exotic"];
  const weights = [0.1, 2.5, 2000, 18, 35, 0.8, 4.2, 12, 25, 42, 1.1, 6, 20, 55, 3.5];
  // S07 is explicitly the future-reminder scenario. S08 remains overdue.
  const offsets = [0, 1, 3, 7, 14, -1, 3, -7, 0, 5, 10, -14, 4, 8, 21];
  const appointmentStatuses = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW", "SCHEDULED", "CONFIRMED", "SCHEDULED", "CANCELLED", "NO_SHOW", "SCHEDULED", "COMPLETED", "CONFIRMED", "SCHEDULED"];
  const ticketStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
  const today = new Date();
  const plusDays = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); d.setHours(12, 0, 0, 0); return d; };

  const created = await prisma.$transaction(async (tx) => {
    const records: Array<{ ownerId: string; animalId: string; ticketId: string }> = [];
    for (let i = 0; i < 15; i++) {
      const n = String(i + 1).padStart(2, "0");
      const owner = await tx.owner.create({ data: {
        clinicId: clinic.id, name: `${PREFIX}-S${n} Client`, phone: `+20199915${String(i + 1).padStart(4, "0")}`,
        email: `qa15.s${n}@example.test`, address: "Test address - synthetic data", notes: `${PREFIX} disposable QA scenario ${n}`,
      } });
      const animal = await tx.animal.create({ data: {
        clinicId: clinic.id, ownerId: owner.id, name: `${PREFIX}-S${n} Pet`, species: species[i % species.length],
        breed: `Scenario Breed ${n}`, gender: i % 2 ? "Female" : "Male", weightKg: weights[i],
        microchipNumber: `${PREFIX}${String(i + 1).padStart(10, "0")}`, notes: `${PREFIX} test record; safe to delete`,
      } });
      await tx.appointment.create({ data: {
        clinicId: clinic.id, branchId: branches[i % branches.length].id, animalId: animal.id,
        appointmentDate: plusDays(offsets[i]), appointmentTime: `${9 + (i % 8)}:00 AM`,
        type: ["CHECKUP", "VACCINATION", "CONSULTATION", "SURGERY"][i % 4],
        status: appointmentStatuses[i % appointmentStatuses.length], reason: `${PREFIX}-S${n} ${priorities[i]} scenario`,
        notes: `${PREFIX} synthetic appointment`,
      } });
      const ticket = await tx.clientTicket.create({ data: {
        clinicId: clinic.id, ownerId: owner.id, subject: `${PREFIX}-S${n} ${priorities[i]} support case`,
        message: `Synthetic QA scenario ${n}; priority ${priorities[i]}. No real client data.`,
        priority: priorities[i], status: ticketStatuses[i % ticketStatuses.length],
      } });
      if ([0, 5, 6, 7, 12, 14].includes(i)) await tx.reminder.create({ data: {
        clinicId: clinic.id, animalId: animal.id, ownerId: owner.id, reminderType: i === 7 ? "FOLLOW_UP" : "CHECKUP",
        dueDate: plusDays(i === 7 ? -2 : offsets[i]), channel: "WHATSAPP", status: i === 5 ? "COMPLETED" : "PENDING",
        notes: `${PREFIX}-S${n} reminder scenario`,
      } });
      const invoiceFixture: Record<number, { total: number; paid: number }> = {
        0: { total: 100, paid: 100 },
        8: { total: 500, paid: 0 },
        11: { total: 750, paid: 250 },
        12: { total: 1000, paid: 0 },
        14: { total: 1200, paid: 1200 },
      };
      if (invoiceFixture[i]) {
        const { total, paid } = invoiceFixture[i];
        const due = Math.round((total - paid) * 100) / 100;
        await tx.invoice.create({ data: {
          clinicId: clinic.id, branchId: branches[i % branches.length].id, invoiceNumber: `${PREFIX}-INV-${n}`,
          customerName: owner.name, customerPhone: owner.phone, ownerId: owner.id, animalId: animal.id,
          status: due === 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID", subtotal: total, discount: 0,
          tax: 0, total, paidAmount: paid, dueAmount: due, paymentMethod: "CASH", type: "INVOICE",
          notes: `${PREFIX} synthetic ${due ? "open balance" : "paid"} scenario`,
          items: { create: [{ itemType: "SERVICE", description: `${PREFIX} test consultation`, quantity: 1, unitPrice: total, total }] },
          payments: { create: paid > 0 ? [{ amount: paid, paymentMethod: "CASH", receivedBy: "QA Scenario Seed", notes: `${PREFIX} test payment` }] : [] },
        } });
      }
      records.push({ ownerId: owner.id, animalId: animal.id, ticketId: ticket.id });
    }
    for (const [index, quantity, min, price, expiry] of [[1, 0, 3, 125, 45], [2, 2, 5, 275, -10], [3, 50, 10, 20, 300]] as const) {
      const n = String(index).padStart(2, "0");
      await tx.inventoryItem.create({ data: {
        clinicId: clinic.id, branchId: branches[(index - 1) % branches.length].id, categoryId: inventoryCategory.id,
        name: `${PREFIX} Stock Scenario ${n}`, sku: `${PREFIX}-SKU-${n}`, quantity, minStockAlert: min,
        unitCost: Math.round(price * 0.5), salePrice: price, batchNumber: `${PREFIX}-BATCH-${n}`,
        expiryDate: plusDays(expiry), isPosAvailable: true,
      } });
    }
    for (const [index, amount, category] of [[1, 25, "Utilities"], [2, 950, "Emergency QA"]] as const) {
      await tx.expense.create({ data: {
        clinicId: clinic.id, branchId: branches[(index - 1) % branches.length].id,
        category, description: `${PREFIX}-Expense-S${index} LOW/HIGH test`, amount, recordedBy: "QA Scenario Seed",
      } });
    }
    return records.length;
  }, { maxWait: 30_000, timeout: 60_000 });

  return created;
}
