# Qlinic QA Scenario Pack (15 cases)

These records are synthetic and clearly marked `QA15`. Load them with `npm run qa:scenarios`; remove only this pack with `npm run qa:scenarios:clean`. Loading again replaces the previous QA15 set. Test using the normal screens; do not send WhatsApp messages to the placeholder phone numbers.

## Scenarios

| ID | Level | Data / route | What to try | Expected result |
|---|---|---|---|---|
| QA15-S01 | LOW | Client, pet, confirmed appointment, low ticket, paid invoice | Open client record, appointment, ticket and invoice | Related records display consistently; invoice is PAID |
| QA15-S02 | LOW | 0.1 kg pet | Edit weight to 0, negative, then 0.1 kg | Zero/negative rejected if disallowed; boundary value accepted |
| QA15-S03 | HIGH | 2,000 kg API boundary case | Try 2,000 and 2,000.1 kg in import validation | 2,000 accepted; 2,000.1 rejected |
| QA15-S04 | HIGH | Email validation | Try `person@`, `person.example`, then `qa@example.test` in reception/import | Invalid email rejected; valid test-domain email accepted |
| QA15-S05 | LOW | Existing QA15 phone and pet | Import the same phone and pet twice | No duplicate pet; import reports accurate created count |
| QA15-S06 | MEDIUM | Completed reminder | Change status and inspect All/Today/Overdue | Status and filters agree; completed item is not treated as pending |
| QA15-S07 | MEDIUM | Future reminder | Open message composer, then close without sending | Status stays pending until delivery is confirmed |
| QA15-S08 | HIGH | Overdue follow-up reminder | Filter Overdue; mark complete | Overdue count decreases and status persists after reload |
| QA15-S09 | LOW | Today's appointment and unpaid invoice | Switch calendar/list, open invoice and compare totals | Same appointment appears in both views; invoice is visibly UNPAID |
| QA15-S10 | HIGH | Cancelled / no-show appointments | Inspect filters and counts | Cancelled/no-show are not counted as completed |
| QA15-S11 | URGENT | Urgent client support ticket | Move OPEN → IN_PROGRESS → RESOLVED | Each transition persists; priority remains URGENT |
| QA15-S12 | MEDIUM | Partial invoice | View invoice and pending payments | Paid + due = total; amounts display to 2 decimals |
| QA15-S13 | HIGH | Unpaid invoice | Try recording full payment and invalid overpayment | Valid payment closes balance; overpayment is rejected |
| QA15-S14 | HIGH | Zero-stock expiring item | Try POS sale and transfer | Sale/transfer blocked with clear stock error; no negative stock |
| QA15-S15 | LOW | High-stock item and large expense | View inventory, daily accounts and analytics | Counts, totals, and profit recompute without NaN or float noise |

## Seeded levels and fixtures

The 15 clients, animals, appointments, and support tickets are labelled `QA15-S01` through `QA15-S15`. Ticket priorities include LOW, MEDIUM, HIGH, and URGENT. Five invoices cover paid, partial, and unpaid states; six reminders include completed, future, and overdue cases; three inventory rows cover zero, low, and healthy stock; two expenses provide low/high values. `QA15-S03` uses the valid 2,000 kg boundary and `QA15-S09` has an appointment today.

The invalid email/phone, duplicate import, over-limit weight, and overpayment are intentionally listed as actions rather than stored as invalid database rows. This lets you test validation without corrupting persisted data.
