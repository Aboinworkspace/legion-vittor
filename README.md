# Legion Vittor Private Limited — Virtual Office
### Prototype v0.1

An autonomous AI company — 44 agents, 10 departments, zero human input after setup.

## Stack (Prototype — ~₹800 total cost)

| Layer | Tool | Cost |
|---|---|---|
| Frontend | Next.js 15 + Tailwind + shadcn/ui | Free (Vercel) |
| Backend | FastAPI + Python 3.12 | Free (Render) |
| Database | Supabase (Postgres + pgvector) | Free tier |
| Cache | Upstash Redis | Free tier |
| Auth | Supabase Auth | Free tier |
| LLM | Claude API (claude-sonnet-4-5) | ~₹800 |
| Email | Resend | Free (3K/mo) |
| Voice | ElevenLabs | Free tier |
| Video | Runway ML | Free trial |
| Payments | Razorpay (test mode) | Free |

## Project Structure

```
legion-vittor/
├── frontend/          # Next.js 15 app
│   └── src/
│       ├── app/       # App router pages
│       ├── components/# UI components
│       ├── hooks/     # Custom React hooks
│       ├── lib/       # Utilities, API client
│       └── types/     # TypeScript types
├── backend/           # FastAPI app
│   └── app/
│       ├── agents/    # All 44 agent classes
│       ├── api/       # REST + WebSocket routes
│       ├── core/      # Config, settings
│       ├── db/        # Supabase client, models
│       ├── services/  # External API integrations
│       └── utils/     # Helpers
└── docker-compose.yml # Local dev
```

## Quick Start

```bash
# 1. Clone and setup
git clone <repo>
cd legion-vittor

# 2. Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your API keys
uvicorn app.main:app --reload

# 3. Frontend
cd frontend
npm install
cp .env.example .env.local  # fill in vars
npm run dev
```

## Prototype Agents (Phase 1)
- CEO agent
- Manager agent  
- Developer agent
- Marketing agent
- Support agent

## Environment Variables Needed
See `backend/.env.example` and `frontend/.env.example`
