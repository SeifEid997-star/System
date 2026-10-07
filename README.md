# Qlinic v2 — Veterinary Clinic Management System (نظام إدارة العيادات البيطرية)

**Qlinic v2** is an enterprise-grade veterinary clinic management system built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, and Prisma 6 with dual-database support (Local SQLite and Production PostgreSQL / Supabase).

---

## 🌟 Key Features

- **Reception Desk (مكتب الاستقبال):** Unified single-screen intake for pet owner registration, patient history, triage classification, doctor assignment, and live case opening.
- **Visual Appointments (جدول المواعيد):** Interactive calendar and table view with doctor schedule management.
- **Electronic Medical Records & EMR (الكشف الطبي والروشتة):** Structured vitals (temperature, weight, heart/respiration rate, BCS), clinical templates, and multi-day prescriptions.
- **Point of Sale & Cashier (كاشير العيادة):** Multi-method payments (Cash, Card, InstaPay, Vodafone Cash, Bank Transfer), change calculator, and 80mm thermal receipt generator.
- **Operations & Catalogues:** Boarding reservations, grooming appointments, vaccination records, inventory catalog, and medical services list.
- **Clinic Management:** Multi-branch configuration, staff permissions, expenses tracking, supplier purchase orders, and audit logging.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 15 (App Router)** |
| Frontend | **React 19, Tailwind CSS, Framer Motion, Lucide Icons** |
| ORM | **Prisma 6** |
| Local Database | **SQLite** (`prisma/schema.prisma`) |
| Production Database | **PostgreSQL on Supabase** (`prisma/schema.postgres.prisma`) |
| Authentication | **Scrypt hashing + HMAC-SHA256 session cookies (`qlinic_session`)** |
| Deployment | **Vercel** (`vercel.json`) |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in the parameters:

```bash
cp .env.example .env
```

| Variable | Description | Example / Note |
|---|---|---|
| `AUTH_SECRET` | 32+ character key for signing session cookies | `openssl rand -base64 32` |
| `AUTH_COOKIE_SECURE` | Set `true` on HTTPS (Vercel), `false` locally | `true` in production |
| `DATABASE_URL` | Supabase Transaction Pooler (Port 6543) | `postgresql://...:6543/postgres?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Supabase Session Pooler or direct (Port 5432) | `postgresql://...:5432/postgres` |
| `INITIAL_OWNER_EMAIL` | Initial Owner account for bootstrap | `owner@petpals-vet.com` |
| `INITIAL_OWNER_PASSWORD` | Strong password for bootstrap only | Never use demo passwords |

---

## 🚀 Getting Started (Local Development)

### 1. Installation
```bash
npm install
```

### 2. Run Local SQLite Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Production Deployment (Vercel + Supabase)

### 1. Supabase Setup
1. Create a project on [Supabase](https://supabase.com).
2. Go to **Settings > Database > Connection pooling**.
3. Copy the **Transaction Pooler URL** (Port 6543) to `DATABASE_URL` in Vercel.
4. Copy the **Session Pooler URL** (Port 5432) to `DIRECT_URL` in Vercel.

### 2. Vercel Configuration
`vercel.json` automatically runs the PostgreSQL build script:
```json
{
  "buildCommand": "node scripts/build.mjs",
  "installCommand": "npm install"
}
```

### 3. Deploy Migrations to Supabase
```bash
npm run db:migrate:deploy:vercel
```
Alternatively, apply `supabase-complete-migration.sql` in the **Supabase SQL Editor**.

### 4. One-Time Production Bootstrap
```bash
npm run db:seed:production
```

---

## 🔐 Security & RBAC Model

- **Defense in Depth:** All sensitive API routes verify identity and role from the live database record via `requireRole(request, roles[])` in `src/lib/auth.ts`.
- **Role Hierarchy:**
  - `OWNER`: Full administrative access, factory reset, backup export, staff management.
  - `MANAGER`: Branch and operational management, staff administration.
  - `VETERINARIAN`: Clinical workspace, consultations, prescriptions, appointments.
  - `RECEPTIONIST`: Patient intake, appointment booking, client records.
  - `ACCOUNTANT`: Invoices, daily accounts, expenses, financial reports.
- **Brute Force Protection:** In-memory sliding window rate limiting on `/api/auth/login` (5 attempts / 15 minutes lockout).
- **CSRF Protection:** Origin header validation on mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`).
- **Security Headers:** HSTS, X-Frame-Options (DENY), nosniff, strict referrer policy, and Content Security Policy.

---

## 📁 Windows Local Launchers

The root directory contains optional Windows helper scripts for local desktop launching:
- `start-qlinic.bat`: Launches the local development server.
- `setup-supabase.bat`: Assists with local database sync.

---

## 📋 Available Commands

```bash
npm run dev                    # Starts Next.js development server
npm run build                  # Environment-aware build (SQLite local, Postgres prod)
npm run build:vercel           # Production build for Vercel
npm run lint                   # Runs Next.js ESLint
npm run db:generate:local      # Generates Prisma client for SQLite
npm run db:generate:vercel     # Generates Prisma client for PostgreSQL
npm run db:migrate:deploy:vercel # Deploys Prisma migrations to PostgreSQL
npm run db:seed:production     # Bootstraps initial owner on empty database
npx tsc --noEmit               # TypeScript static type check
```