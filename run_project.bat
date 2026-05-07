@echo off
TITLE UrbanPulse - Geo-Spatial Planning Hub
COLOR 0A

echo ===================================================
echo   UrbanPulse - Starting Development Environment
echo ===================================================
echo.

:: Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b
)

echo [1/2] Starting Backend Server (Port 5000)...
start "UrbanPulse Backend" cmd /k "cd server && npm run dev"

echo [2/2] Starting Frontend App (Vite)...
start "UrbanPulse Frontend" cmd /k "npm run dev"

echo.
echo ===================================================
echo   System is launching!
echo   - Backend: http://localhost:5000
echo   - Frontend: http://localhost:5173
echo   - Redis: Connected via Memurai
echo ===================================================
echo.
echo You can close this window now. Keep the other two open.
pause
