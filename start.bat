@echo off
echo 🚀 Starting NASA Asteroid Deflection Game...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is required but not installed.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is required but not installed.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Start backend
echo 🔧 Starting Flask backend...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
start "Backend" cmd /k "python app.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo ⚛️ Starting React frontend...
cd ..\frontend
npm install
start "Frontend" cmd /k "npm start"

echo ✅ Game is starting up!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:5000
echo.
echo Press any key to exit...
pause >nul
