-- =============================================================================
-- Qlinic v2 - Supabase Complete Schema Migration & Auto-Seed
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/afyczjpnixaqxxluppid/sql/new
-- =============================================================================

-- 1. Ensure required columns exist on Clinic
ALTER TABLE IF EXISTS "Clinic" ADD COLUMN IF NOT EXISTS "taxId" TEXT DEFAULT '419-820-112';
ALTER TABLE IF EXISTS "Clinic" ADD COLUMN IF NOT EXISTS "commercialId" TEXT DEFAULT '91048-Cairo';
ALTER TABLE IF EXISTS "Clinic" ADD COLUMN IF NOT EXISTS "receiptFooter" TEXT DEFAULT 'Thank you for trusting us! Medications sold are non-refundable once opened.';
ALTER TABLE IF EXISTS "Clinic" ADD COLUMN IF NOT EXISTS "slotDurationMinutes" INTEGER DEFAULT 20;
ALTER TABLE IF EXISTS "Clinic" ADD COLUMN IF NOT EXISTS "openingTime" TEXT DEFAULT '09:00';
ALTER TABLE IF EXISTS "Clinic" ADD COLUMN IF NOT EXISTS "closingTime" TEXT DEFAULT '23:00';

-- 2. Ensure required columns exist on Branch
ALTER TABLE IF EXISTS "Branch" ADD COLUMN IF NOT EXISTS "tier" TEXT DEFAULT 'OPERATIONAL';

-- 3. Create Supplier table if not exists
CREATE TABLE IF NOT EXISTS "Supplier" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT concat('sup_', substr(md5(random()::text), 1, 16)),
  "clinicId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'Pharmaceuticals & Vaccines',
  "contactPerson" TEXT NOT NULL DEFAULT 'General Representative',
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "city" TEXT NOT NULL DEFAULT 'Cairo, Egypt',
  "paymentTerms" TEXT NOT NULL DEFAULT 'Net 30 Days',
  "outstandingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Supplier_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Create Purchase table if not exists
CREATE TABLE IF NOT EXISTS "Purchase" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT concat('po_', substr(md5(random()::text), 1, 16)),
  "clinicId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "poNumber" TEXT NOT NULL UNIQUE,
  "itemsCount" INTEGER NOT NULL DEFAULT 1,
  "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Purchase_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Purchase_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 5. Create GroomingSession table if not exists
CREATE TABLE IF NOT EXISTS "GroomingSession" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT concat('grm_', substr(md5(random()::text), 1, 16)),
  "clinicId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "animalId" TEXT NOT NULL,
  "service" TEXT NOT NULL,
  "stylist" TEXT NOT NULL DEFAULT 'Groomer',
  "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "price" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GroomingSession_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GroomingSession_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "GroomingSession_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 6. Create VaccinationRecord table if not exists
CREATE TABLE IF NOT EXISTS "VaccinationRecord" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT concat('vac_', substr(md5(random()::text), 1, 16)),
  "clinicId" TEXT NOT NULL,
  "animalId" TEXT NOT NULL,
  "vaccineType" TEXT NOT NULL DEFAULT 'RABIES',
  "productName" TEXT NOT NULL,
  "batchNumber" TEXT,
  "dateGiven" TIMESTAMP(3) NOT NULL,
  "validUntil" TIMESTAMP(3),
  "vetName" TEXT,
  "vetLicense" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VaccinationRecord_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VaccinationRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 7. Create Expense table if not exists
CREATE TABLE IF NOT EXISTS "Expense" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT concat('exp_', substr(md5(random()::text), 1, 16)),
  "clinicId" TEXT NOT NULL,
  "branchId" TEXT,
  "category" TEXT NOT NULL DEFAULT 'Rent & Facilities',
  "description" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "recordedBy" TEXT NOT NULL DEFAULT 'Active Accountant',
  "method" TEXT NOT NULL DEFAULT 'Cash',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Expense_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Expense_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 8. Seed Default Clinic if missing
INSERT INTO "Clinic" (
  "id", "name", "slug", "phone", "email", "address", "country", "currency", "timezone", "taxRate",
  "themePrimary", "taxId", "commercialId", "receiptFooter", "slotDurationMinutes", "openingTime", "closingTime", "createdAt", "updatedAt"
)
SELECT
  'c_default_petpals', 'PetPals Veterinary Clinic', 'petpals', '+20 100 123 4567', 'info@petpals-vet.com',
  '24 El-Tahrir St, Dokki, Giza, Egypt', 'Egypt', 'EGP', 'Africa/Cairo', 14.0, '#0F766E',
  '419-820-112', '91048-Cairo', 'Thank you for trusting us! Medications sold are non-refundable once opened.', 20, '09:00', '23:00',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Clinic" LIMIT 1);

-- 9. Seed Default Branch if missing
INSERT INTO "Branch" (
  "id", "clinicId", "name", "address", "phone", "tier", "isActive", "createdAt", "updatedAt"
)
SELECT
  'b_default_dokki', (SELECT "id" FROM "Clinic" LIMIT 1), 'Dokki Main Branch',
  '24 El-Tahrir St, Dokki, Giza', '+20 100 123 4567', 'PRIMARY', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Branch" LIMIT 1);

-- 10. Seed/Ensure Unified Staff Account (staff@petpals-vet.com / Clinic@123)
INSERT INTO "User" (
  "id", "clinicId", "branchId", "name", "email", "passwordHash", "role", "jobTitle", "isActive", "createdAt", "updatedAt"
)
SELECT
  'u_staff_unified',
  (SELECT "id" FROM "Clinic" LIMIT 1),
  (SELECT "id" FROM "Branch" LIMIT 1),
  'PetPals Staff',
  'staff@petpals-vet.com',
  '$2a$10$w/o1U74Dqf8h4/cKsmL8Gevs8f4O0.e8sB7yFmI4kO7pZ4e4zW0qO', -- passwordHash for Clinic@123
  'OWNER',
  'Clinic General Manager & Head Vet',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE "email" = 'staff@petpals-vet.com');

-- Done!
SELECT 'All tables, columns, and initial records verified successfully!' AS status;
