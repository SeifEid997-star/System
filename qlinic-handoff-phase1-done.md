# Qlinic — Handoff: Phase 1 خلصت (Passport, Grooming, Pending Payments, Settings>Clinic)

## تقسيم الشغل المتبقي كان كده:

**Phase 1 (خلصت في الجلسة دي):** الصفحات اللي مش محتاجة فحص عميق قبل ما تتربط — إما موديل بسيط جديد، أو أصلاً مش محتاجة موديل.
**Phase 2 (لسه متبقية):** VetifyPro, SuperAdmin, Analytics — دول أكبر صفحات في المشروع ومحتاجين فحص دقيق للكود الأصلي قبل ما تتحدد شكل الـ schema، فمقترحش حاجة فيهم دلوقتي من غير ما تقولي "كمل".

---

## اللي خلص في Phase 1

### 1) Grooming (`src/app/operations/grooming`)
- موديل جديد `GroomingSession` (animalId, branchId, service, stylist, scheduledAt, price, status).
- `src/app/api/grooming/route.ts`: GET (كل الجلسات مع اسم الحيوان والمالك) + POST (حجز جلسة جديدة).
- `src/app/api/grooming/[id]/route.ts`: PATCH لتحديث الحالة (زرار "Mark Done" بيحول لـ COMPLETED).
- الصفحة بقت بتجيب الحيوانات الحقيقية من `/api/animals` في مودال الحجز، بدل بيانات وهمية ثابتة.

### 2) Digital Pet Passport (`src/app/operations/passport`)
- موديل جديد `VaccinationRecord` مرتبط بـ `Animal` (vaccineType: RABIES/DEWORMING/OTHER, productName, batchNumber, dateGiven, validUntil, vetName, vetLicense).
- `src/app/api/passport/route.ts`: GET (كل الحيوانات مع آخر تطعيم Rabies وآخر Deworming ليها، وحالة السفر محسوبة تلقائيًا من تاريخ صلاحية تطعيم السعار) + POST (تسجيل تطعيم جديد).
- زرار "Record Vaccination" جديد في الصفحة بيفتح مودال لتسجيل تطعيم لأي حيوان.
- لو حيوان لسه معندوش تطعيم مسجل، الصفحة بتوضح "No rabies vaccination on record" بدل ما تكسر أو تعرض بيانات وهمية.

  ⚠️ **حاجة غيّرتها عن الأصل:** الصفحة الأصلية كانت فيها 3 حيوانات ثابتة بالكود (Max, Bella, Milo) ببيانات جواز سفر كاملة. دلوقتي بتجيب كل الحيوانات المسجلة فعليًا في العيادة، وأي حيوان لسه معندوش تطعيمات هيظهر بحقول فاضية لحد ما تسجلها.

### 3) Pending Payments (`src/app/operations/pending-payments`)
- **مفيش موديل جديد** — الصفحة بقت فلتر على `Invoice` بحالة PARTIAL أو UNPAID (نفس اللي كان متوقع في المتبقي القديم).
- `src/app/api/pending-payments/route.ts`: GET بيرجع الفواتير المستحقة مع اسم العميل والحيوان والمبلغ المتبقي.
- زرار "Waive" بقى بيعمل PATCH فعلي على الفاتورة (`src/app/api/invoices/[id]/route.ts` — جديد) وبيحولها لـ VOIDED بدل ما يمسحها بس من الشاشة.

  ⚠️ **حاجة غيّرتها عن الأصل:** التصميم الأصلي كان بيفترض مصادر متعددة (MEDICAL_CASE, APPOINTMENT, BOARDING) من غير فواتير مربوطة، ده كان محتاج تتبع الحالات المكتملة اللي لسه مفيهاش فاتورة أصلاً — ده أعقد من فلتر بسيط على Invoice (محتاج flag "billed" على كل موديول). خليتها فلتر على الفواتير الفعلية (PARTIAL/UNPAID) عشان تبقى شغالة فورًا؛ لو عايز التتبع الأصلي (خدمات اتعملت ولسه ما اتحاسبتش خالص) قولي أضيفه كـ Phase منفصلة.

### 4) Settings > Clinic (`src/app/settings/clinic`)
- **مفيش موديل جديد** — ضفت حقول جديدة على موديل `Clinic` الموجود: `taxId`, `commercialId`, `receiptFooter`, `slotDurationMinutes`, `openingTime`, `closingTime` (كلها بقيم افتراضية زي اللي كانت في الصفحة).
- `src/app/api/settings/clinic/route.ts`: GET + PUT.
- الصفحة بقت بتحمّل الإعدادات الحقيقية عند الفتح، وزرار "Save All Changes" بيحفظها فعليًا في قاعدة البيانات بدل ما يعمل toast وهمي بس.

### Seed Data
- ضفت في `prisma/seed.ts`: جلستين Grooming + 3 سجلات تطعيمات (Rabies لـ Max و Luna + Deworming لـ Max) عشان الصفحات الجديدة متبانش فاضية أول تشغيل.

### ملحوظة بيئة (زي كل مرة)
مقدرتش أشغل `npx prisma generate/migrate` في الـ sandbox بتاعي (مفيش نت لـ binaries.prisma.sh)، فالكود اتكتب من غير تشغيل فعلي. عندك، لازم:
```
npx prisma migrate dev   # أو  npx prisma db push
npm run db:seed
```
بعدين اختبر: حجز جلسة Grooming وتحويلها لـ Done، تسجيل تطعيم جديد في Passport وشوف إن الجدول بيتحدث، صفحة Pending Payments (لازم يكون عندك فاتورة PARTIAL أو UNPAID تجربها — اعمل واحدة من POS بمبلغ مدفوع أقل من الإجمالي)، وحفظ إعدادات العيادة والتأكد إنها بترجع صح بعد الريفريش.

---

## Phase 2 — المتبقي (لسه محتاج فحص قبل ما نقترح schema)

بالترتيب المقترح زي ما كان:
1. **VetifyPro** (`src/app/operations/vetifypro`) — أكبر صفحة في المشروع (~800 سطر)، محتاجة فحص دقيق الأول قبل اقتراح الـ schema المناسب ليها.
2. **SuperAdmin** (`src/app/superadmin`) — ~460 سطر، محتاج تحديد الصلاحية والنطاق المطلوب (متعدد العيادات ولا عيادة واحدة، صلاحيات ايه بالظبط).
3. **Analytics** (`src/app/management/analytics`) — آخر حاجة، بتجمّع بيانات من كل المديولات التانية (زي Daily Accounts بالظبط لكن أشمل، هتحتاج كل المديولات التانية شغالة الأول).

قولي "كمل Phase 2" أو ابدأ باسم الصفحة اللي عايز تبدأ بيها، وهفحص كل صفحة بالتفصيل قبل ما أقترح الـ schema عشان أتأكد الحقول متطابقة مع اللي الـ UI بيتوقعه بالظبط.
