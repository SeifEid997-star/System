@echo off
TITLE Qlinic - Visual SQL Database Studio
COLOR 0D
CLS

echo =====================================================================
echo         QLINIC v2 - LOCAL SQL DATABASE VISUAL STUDIO
echo =====================================================================
echo [*] Database File: %~dp0prisma\dev.db
echo [*] No Cloud, No Turso, No Supabase needed! 100%% Local SQL on this PC.
echo.
echo [*] Launching Visual Database Browser on http://localhost:5555...
echo [*] You can view, edit, or delete any record directly in SQL.
echo.

cd /d "%~dp0"
start "" "http://localhost:5555"
cmd /c npx prisma studio

pause
