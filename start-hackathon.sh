#!/bin/bash

# Meteor Madness: Defend Earth - Quick Start Script
# NASA Space Apps Challenge 2025

echo "🌍☄️  METEOR MADNESS: DEFEND EARTH"
echo "=================================="
echo ""
echo "Starting NASA Space Apps Challenge Demo..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.7+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Python and Node.js detected"
echo ""

# Start Backend
echo "🚀 Starting Backend (Flask)..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -q -r requirements.txt

# Start Flask in background
echo "🔧 Starting Flask server on port 5001..."
python app.py &
BACKEND_PID=$!

cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 3

# Start Frontend
echo ""
echo "🚀 Starting Frontend (React)..."
cd frontend-new

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node dependencies (this may take a few minutes)..."
    npm install
fi

# Start React
echo "🔧 Starting React development server on port 3000..."
npm start &
FRONTEND_PID=$!

cd ..

echo ""
echo "=================================="
echo "✨ METEOR MADNESS IS READY! ✨"
echo "=================================="
echo ""
echo "🌐 Frontend: http://localhost:3000/landing"
echo "🔌 Backend:  http://localhost:5001"
echo ""
echo "📖 Press Ctrl+C to stop all servers"
echo ""

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✅ Servers stopped. Goodbye!'; exit 0" INT

# Keep script running
wait
