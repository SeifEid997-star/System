# Remaining Site QA Report

Date: 2026-09-23

## Result

- 30 application page routes returned HTTP 200.
- 25 read API endpoints returned HTTP 200 using the local signed-in demo session.
- 21 empty or malformed write requests were rejected with HTTP 400 and did not create test records.
- Medication workflows passed: add medication stock, reload it from inventory, save a prescription to a medical case, reload the case and prescription, reject an invalid prescription, sell one unit through POS, and verify quantity decreased from 3 to 2.
- Support database health endpoint reported `OPERATIONAL`.
- TypeScript check passed: `npx tsc --noEmit`.

## Medication scenario details

1. Added `QAREM-Test Medication` with category `Medications`, stock 3, batch and future expiry.
2. Added and saved a prescription for a QA animal with dosage, frequency, duration and instructions; fetched the case again and confirmed the prescription persisted.
3. Submitted a blank drug/dosage and zero-day duration; API returned 400.
4. Sold one unit in POS; invoice creation succeeded and inventory quantity changed from 3 to 2.

## Cleanup

Temporary `QAREM-` medical case, prescription, invoice and inventory item were deleted after the test. Follow-up API reads confirmed zero matching rows. The extra database safety copy is `prisma/dev.db.before-qarem-20260923` and is intentionally excluded from the delivery ZIP.

## Scope note

This round is a broad route/API smoke test plus positive medication workflows and negative-input validation. It did not manually click every UI control, test physical printing, send WhatsApp messages, or test external payment delivery. The earlier QA15 scenarios cover additional clinic workflows.
