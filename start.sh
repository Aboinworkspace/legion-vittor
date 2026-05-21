#!/bin/bash
# ═══════════════════════════════════════════════════════
# Legion Vittor — One-click local setup & run
# Run this once after unzipping the project
# ═══════════════════════════════════════════════════════

echo ""
echo "🏢 Legion Vittor Private Limited — Virtual Office"
echo "   Setting up your prototype..."
echo ""

# ── Check Python ─────────────────────────────────────────
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Install from python.org"
    exit 1
fi
echo "✅ Python: $(python3 --version)"

# ── Check Node ────────────────────────────────────────────
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from nodejs.org"
    exit 1
fi
echo "✅ Node: $(node --version)"

# ── Backend setup ─────────────────────────────────────────
echo ""
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt -q

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "⚠️  Created backend/.env from .env.example"
    echo "   → Open backend/.env and add your API keys:"
    echo "     ANTHROPIC_API_KEY=sk-ant-..."
    echo "     OPENAI_API_KEY=sk-..."
    echo "     GEMINI_API_KEY=..."
    echo "     SUPABASE_URL=https://..."
    echo "     SUPABASE_ANON_KEY=..."
    echo "     SUPABASE_SERVICE_ROLE_KEY=..."
    echo ""
    echo "   Then run this script again."
    exit 0
fi

# ── Frontend setup ────────────────────────────────────────
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install -q

if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo ""
    echo "⚠️  Created frontend/.env.local"
    echo "   → Open frontend/.env.local and set:"
    echo "     NEXT_PUBLIC_API_URL=http://localhost:8000"
    echo "     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
    echo "     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
fi

# ── Start both servers ────────────────────────────────────
echo ""
echo "🚀 Starting Legion Vittor..."
echo ""

cd ..

# Start backend
echo "  Starting backend on http://localhost:8000"
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

sleep 3

# Start frontend
echo "  Starting frontend on http://localhost:3000"
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ Legion Vittor is running!"
echo ""
echo "  🌐 Frontend:  http://localhost:3000"
echo "  ⚙️  Backend:   http://localhost:8000"
echo "  📖 API docs:  http://localhost:8000/docs"
echo "═══════════════════════════════════════════════"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo ""

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'; exit 0" INT
wait
