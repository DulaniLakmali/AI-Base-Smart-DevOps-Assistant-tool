@echo off
echo ========================================================
echo   Smart DevOps Assistant - Automated Startup Script
echo ========================================================
echo.

:: 1. Check and initialize backend/.env if missing
if not exist "backend\.env" (
    echo [INFO] backend\.env not found. Initializing from backend\.env.example...
    copy "backend\.env.example" "backend\.env" >nul
    echo [OK] Created backend\.env
)

:: 2. Check and install backend dependencies if missing
if not exist "backend\node_modules\" (
    echo [INFO] Installing backend dependencies...
    cmd /c "npm --prefix backend install"
)

:: 3. Check and install frontend dependencies if missing
if not exist "frontend\node_modules\" (
    echo [INFO] Installing frontend dependencies...
    cmd /c "npm --prefix frontend install"
)

echo.
echo ========================================================
echo   Launching Backend API and Frontend Vite Client...
echo ========================================================
echo.

start "Smart DevOps Assistant - Backend (Port 5000)" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Smart DevOps Assistant - Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   Backend is running at:  http://localhost:5000
echo   Frontend is opening at: http://localhost:5173
echo ========================================================
echo.
pause
