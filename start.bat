@echo off
title UrbanPulse Platform Start
echo Starting UrbanPulse Platform...
echo =========================================

echo 1. Starting Backend API Server (Port 5000)...
start "UrbanPulse Backend" cmd /c "cd server && npm run dev"

echo 2. Starting Frontend Client (Port 5173)...
start "UrbanPulse Frontend" cmd /c "npm run dev"

echo =========================================
echo Both services are booting up in separate windows.
echo - The Frontend will be accessible at: http://localhost:5173
echo - The Backend API is running at: http://localhost:5000/api
echo.
echo You can safely close this window. The new command windows will remain open.
pause
