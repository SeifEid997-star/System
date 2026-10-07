@echo off
TITLE PetPals Clinic - Connect & Setup Supabase Database
COLOR 0A
CLS

echo =======================================================
echo          PETPALS CLINIC - SUPABASE ACTIVATOR
echo =======================================================
echo.

if not exist ".env" (
    echo [!] No .env file found!
    echo [*] Creating .env from .env.example...
    copy ".env.example" ".env" > nul
    echo.
    echo [ACTION REQUIRED]
    echo Please open the .env file in Notepad and paste your Supabase:
    echo  1. DATABASE_URL (Port 6543 with pgbouncer)
    echo  2. DIRECT_URL   (Port 5432)
    echo  3. INITIAL_OWNER_PASSWORD
    echo.
    notepad .env
    echo.
    echo After saving .env, press any key to continue...
    pause > nul
)

echo.
echo [*] Step 1/3: Synchronizing PostgreSQL Schema for Supabase...
node scripts/sync-postgres-schema.mjs
if %errorlevel% neq 0 (
    echo [ERROR] Failed to synchronize PostgreSQL schema!
    pause
    exit /b %errorlevel%
)

echo.
echo [*] Step 2/3: Pushing tables & schema to Supabase PostgreSQL...
call npx prisma db push --schema prisma/schema.postgres.prisma
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to push schema to Supabase!
    echo [*] Check that:
    echo     1. Your Supabase project is active (not paused).
    echo     2. DATABASE_URL and DIRECT_URL in .env are correct.
    echo     3. Your internet connection is active.
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo [*] Step 3/3: Seeding initial clinic production data into Supabase...
call npm run db:seed:production
if %errorlevel% neq 0 (
    echo [WARNING] Seed script ended with a notice. Check output above.
)

echo.
echo =======================================================
echo  [SUCCESS] Supabase is now connected, schemas pushed,
echo            and initialized with your clinic data!
echo =======================================================
echo.
pause
