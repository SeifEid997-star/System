@echo off
TITLE Qlinic v2 - Production Publisher & Deployment Runner
COLOR 0A
CLS

echo =====================================================================
echo           QLINIC v2 - PRODUCTION PUBLISHER & LAUNCHER
echo      PetPals Veterinary Clinic Management System (Cairo, Egypt)
echo =====================================================================
echo.

cd /d "%~dp0"

if not exist ".env.local" (
    echo [*] Creating a private session-signing secret for this installation...
    node -e "require('fs').writeFileSync('.env.local','AUTH_SECRET='+require('crypto').randomBytes(48).toString('hex'))"
    if errorlevel 1 (
        echo [!] Could not create AUTH_SECRET. Ensure Node.js is installed.
        pause
        exit /b 1
    )
)

echo [*] Step 1/3: Checking local database integrity (dev.db)...
if not exist "prisma\dev.db" (
    echo [!] Database not found. Initializing Prisma schema and seed...
    cmd /c npx prisma db push --skip-generate
    cmd /c npx tsx prisma/seed.ts
) else (
    echo [OK] Local SQLite database verified.
)

echo.
echo [*] Step 2/3: Generating optimized production build...
cmd /c npx next build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Production build failed. Check above errors.
    pause
    exit /b 1
)

echo.
echo [*] Step 3/3: Starting Qlinic Production Server on all network interfaces...
echo [*] Local workstation access:   http://localhost:3000
echo [*] Clinic LAN / Wi-Fi access:   http://0.0.0.0:3000
echo.
echo Opening Qlinic Desktop Window...

start "" "http://localhost:3000/login"
cmd /c npx next start -H 0.0.0.0 -p 3000

pause
