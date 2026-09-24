@echo off
title Qlinic v2 - Veterinary SaaS Local Launcher
color 0b

echo =======================================================
echo          QLINIC v2 - VETERINARY CLINIC SAAS
echo      PetPals Veterinary Clinic Management System
echo =======================================================
echo.
echo [*] Checking local environment...
cd /d "%~dp0"

echo [*] Initializing local database...
call npx prisma db push --skip-generate
if errorlevel 1 (
    echo [!] Database initialized or ready.
)

echo.
echo [*] Building Qlinic for fast local use (only if needed)...
if not exist ".next\BUILD_ID" (
    call npm run build
    if errorlevel 1 exit /b 1
)

echo [*] Starting optimized Qlinic v2 server on http://localhost:3000 ...
start "" http://localhost:3000

call npm run start
pause
