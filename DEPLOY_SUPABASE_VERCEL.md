# نشر Qlinic على Supabase وVercel

## الخيار الموصى به

ابدأ بقاعدة Supabase جديدة وفارغة. قاعدة `prisma/dev.db` المحلية تحتوي بيانات عرض واختبار؛ هذا الإعداد لا ينقلها إلى السحابة. لا ترفع قاعدة SQLite أو نسخها الاحتياطية إلى GitHub.

## 1. تجهيز مستودع GitHub

ارفع محتويات مجلد `Qlinic-v2-final` فقط. ملف `.gitignore` يستثني الآن ملفات البيئة، SQLite ونسخها، و`node_modules` و`.next`.

## 2. إنشاء Supabase

1. أنشئ مشروع PostgreSQL جديدًا واختر كلمة مرور قوية واحتفظ بها في مدير كلمات المرور.
2. من **Connect** انسخ اتصال Supavisor **Transaction pooler** لاستخدام التطبيق، واتصال **Session pooler** لاستخدام Prisma CLI.
3. لا ترسل كلمات المرور أو روابط الاتصال في المحادثات أو GitHub.

## 3. إعداد متغيرات البيئة محليًا مرة واحدة

أنشئ نسخة محلية غير متعقبة باسم `.env` من `.env.example`، ثم ضع فيها القيم الفعلية التي نسختها من Supabase:

```text
DATABASE_URL=<Supavisor Transaction pooler URL; port 6543; append pgbouncer=true&connection_limit=1 if absent>
DIRECT_URL=<Supavisor Session pooler URL; port 5432>
AUTH_SECRET=<unique random value, at least 32 characters>
AUTH_COOKIE_SECURE=true
CLINIC_NAME=<clinic name>
CLINIC_SLUG=<unique lowercase clinic slug>
CLINIC_EMAIL=<clinic email>
CLINIC_PHONE=<clinic phone>
CLINIC_ADDRESS=<clinic address>
INITIAL_OWNER_NAME=<owner name>
INITIAL_OWNER_EMAIL=<owner login email>
INITIAL_OWNER_PASSWORD=<unique password, at least 16 characters with upper/lowercase and a number>
```

`.env` مستثنى من Git بواسطة `.gitignore`. Prisma يستخدم اتصال التطبيق المجمع وقت التشغيل، و`DIRECT_URL` لاتصالات أوامر Prisma. لا تستخدم `NEXT_PUBLIC_` لأي من هذه الأسرار.

## 4. إنشاء مخطط قاعدة البيانات وحساب المالك

انسخ `.env.example` إلى `.env`، أدخل بيانات Supabase ومعلومات العيادة وحساب المالك الأول، ثم افتح PowerShell من مجلد المشروع ونفّذ:

```powershell
Copy-Item .env.example .env
notepad .env
npm install
npm run db:setup:vercel
```

`db:setup:vercel` يحدّث `schema.postgres.prisma` من تعريف النماذج المحلي المشترك، وينفّذ الهجرة، ثم يشغّل البذر الإنتاجي. سكربت البذر يرفض العمل إذا لم تكن القاعدة فارغة، وينشئ عيادة وفرعًا وحساب مالك واحدًا بكلمة المرور التي أدخلتها، مع الفئات الأساسية. لا يشغّل بيانات الديمو أو سيناريوهات QA.

بعد نجاح البذر، احذف `INITIAL_OWNER_PASSWORD` وباقي متغيرات `INITIAL_OWNER_*` من ملفاتك المحلية ومن أي إعدادات سحابية. احتفظ فقط بمتغيرات التشغيل اللازمة. خزّن كلمة مرور المالك في مدير كلمات المرور.

## 5. النشر على Vercel

1. استورد مستودع GitHub في Vercel.
2. اختر **Root Directory** الذي يحتوي `package.json`.
3. اجعل **Build Command**: `npm run build:vercel`.
4. أضف في **Settings → Environment Variables** لكل من Production وPreview:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `AUTH_SECRET`
   - `AUTH_COOKIE_SECURE=true`
5. لا تضف `INITIAL_OWNER_PASSWORD` لمتغيرات النشر.
6. انشر Preview أولًا، سجّل الدخول بالحساب الذي أنشأته، وتحقق من الصفحات والقراءة/الكتابة. بعد ذلك انشر Production.

## 6. ربط الدومين

من **Project → Settings → Domains** أضف الدومين. أضف سجلات DNS التي يعرضها Vercel لدى مزود الدومين، ثم تحقق من حالة النطاق وشهادة HTTPS. القيم تختلف حسب الدومين وإعداداته؛ اعتمد القيم التي يعرضها مشروعك.

## 7. تطوير محلي بعد إضافة نماذج Prisma

المشروع يدعم نسختين: `npm run dev` يولّد عميل SQLite ويشغّل قاعدة `prisma/dev.db` المحلية، وVercel يستخدم Supabase PostgreSQL عبر `npm run build:vercel`. بيانات المحلي والسحابة منفصلة ولا تتزامن تلقائيًا. لاختبار تغييرات محليًا دون تعديل بيانات الموقع استخدم SQLite المحلي، أو أنشئ مشروع Supabase منفصلًا للتجربة.

`schema.prisma` هو مصدر النماذج المشترك، و`schema.postgres.prisma` يُولّد منه قبل أوامر Vercel. بعد أي تعديل للنماذج:

1. ولّد/اختبر نسخة PostgreSQL على قاعدة تطوير منفصلة.
2. أنشئ migration جديدة واختبرها على مشروع Supabase غير الإنتاجي.
3. أضف migration إلى GitHub؛ Production ينفذ migrations المسجلة فقط.
4. عند تشغيل المحلي استخدم `npm run dev`؛ الأمر يولّد عميل SQLite المحلي تلقائيًا قبل تشغيل Next.js. ويمكن توليده يدويًا عبر `npm run db:generate:local`.

## حدود مهمة قبل استخدام بيانات عملاء حقيقية

- هذا الإعداد يجهّز استضافة الويب وقاعدة البيانات؛ لا يحوّل التطبيق تلقائيًا إلى Supabase Auth.
- صلاحيات الأدوار ليست مكتملة في كل أجزاء التطبيق، وواجهة SuperAdmin ما زالت تجريبية وفق دليل التسليم. استخدم بيانات عرض/تجربة فقط إلى أن تكتمل مراجعة الصلاحيات والخصوصية.
- ملف `prisma/seed.ts` القديم خاص ببيانات الديمو وكلمات المرور التجريبية. لا تشغّله على قاعدة Production؛ استخدم `npm run db:seed:production` مرة واحدة على قاعدة فارغة.
