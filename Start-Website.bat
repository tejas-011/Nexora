@echo off
setlocal
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js and npm are required. Install Node.js, then run this file again.
  pause
  exit /b 1
)

:: Try to start MongoDB service if present and not already running
net start MongoDB >nul 2>&1

:: If node_modules is missing, install dependencies
if not exist "node_modules" (
  echo Installing project dependencies...
  call npm install
)

echo Starting Nexora MERN development servers...
start "Nexora MERN" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul
start "" http://localhost:5000
