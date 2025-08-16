#!/bin/bash

# PDF Processing Service Startup Script

echo "🚀 Starting PDF Processing Service..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Start the service
echo "🌟 Starting FastAPI server on http://localhost:8001"
echo "📖 API docs available at http://localhost:8001/docs"
python main.py