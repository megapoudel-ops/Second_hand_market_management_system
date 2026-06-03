#!/bin/bash
# PayCore Payment API - Start Script

echo ""
echo "⚡ PayCore Payment API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "❌ Python 3 is required. Install from https://python.org"
  exit 1
fi

# Check Flask
if ! python3 -c "import flask" 2>/dev/null; then
  echo "📦 Installing dependencies..."
  pip3 install flask flask-cors --break-system-packages 2>/dev/null || pip3 install flask flask-cors
fi

echo "🚀 Starting server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cd "$(dirname "$0")/backend"
python3 app.py
