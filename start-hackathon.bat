@echo off
REM Meteor Madness: Defend Earth - Quick Start Script (Windows)
REM NASA Space Apps Challenge 2025

echo.
echo ================================
echo METEOR MADNESS: DEFEND EARTH
echo ================================
echo.
echo Starting NASA Space Apps Challenge Demo...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo X Python is not installed. Please install Python 3.7+ first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo X Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

echo ✓ Python and Node.js detected
echo.

REM Start Backend
echo Starting Backend (Flask)...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
pip install -q -r requirements.txt

REM Start Flask in new window
echo Starting Flask server on port 5001...
start "Flask Backend" cmd /k python app.py

cd ..

REM Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Start Frontend
echo.
echo Starting Frontend (React)...
cd frontend-new

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing Node dependencies (this may take a few minutes)...
    npm install
)

REM Start React in new window
echo Starting React development server on port 3000...
start "React Frontend" cmd /k npm start

cd ..

echo.
echo ================================
echo  METEOR MADNESS IS READY!
echo ================================
echo.
echo Frontend: http://localhost:3000/landing
echo Backend:  http://localhost:5001
echo.
echo Close the Flask and React windows to stop the servers.
echo.
pause
