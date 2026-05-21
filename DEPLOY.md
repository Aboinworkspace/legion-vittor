# Legion Vittor — Deploy Guide
## Get a live URL in under 30 minutes, ₹0 cost

---

## Step 1 — Supabase (database + auth) — 5 min

1. Go to supabase.com → New project (free)
2. Note your **Project URL** and **anon key** and **service role key**
3. Go to SQL Editor → paste entire contents of `backend/app/db/schema.sql` → Run
4. Done ✅

---

## Step 2 — Render (FastAPI backend) — 10 min

1. Push code to GitHub (free private repo)
2. Go to render.com → New → Web Service
3. Connect your GitHub repo → select the `backend` folder
4. Settings:
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment:** Python 3
5. Add Environment Variables (from your .env file):
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ANTHROPIC_API_KEY=sk-ant-api03-your-key
   OPENAI_API_KEY=sk-your-openai-key
   GEMINI_API_KEY=your-gemini-key
   ALLOWED_ORIGINS=https://your-app.vercel.app
   SECRET_KEY=any-random-string-here
   ```
6. Deploy → wait 3-5 min → note your URL: `https://legion-vittor-backend.onrender.com`
7. Test: visit `https://your-backend.onrender.com/health` → should return `{"status":"healthy"}`

---

## Step 3 — Vercel (Next.js frontend) — 5 min

1. Go to vercel.com → New Project → Import from GitHub
2. Select your repo → set **Root Directory** to `frontend`
3. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://legion-vittor-backend.onrender.com
   NEXT_PUBLIC_WS_URL=wss://legion-vittor-backend.onrender.com
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Deploy → wait 2 min → your app is live at `https://legion-vittor.vercel.app`

---

## Step 4 — Optional: Add real service credentials

### Resend (free emails)
1. resend.com → Sign up free → API Keys → Create key
2. Add to Render env vars: `RESEND_API_KEY=re_your-key`

### Razorpay (test payments)
1. razorpay.com → Sign up → Dashboard → Settings → API Keys → Test mode
2. Add: `RAZORPAY_KEY_ID=rzp_test_...` and `RAZORPAY_KEY_SECRET=...`

### Meta Graph API (Instagram)
1. developers.facebook.com → Create App → Instagram Basic Display
2. Add: `META_ACCESS_TOKEN=...` and `META_INSTAGRAM_ACCOUNT_ID=...`

### YouTube Data API
1. console.cloud.google.com → Enable YouTube Data API v3
2. Create OAuth 2.0 credentials → get refresh token
3. Add: `YOUTUBE_CLIENT_ID=...`, `YOUTUBE_CLIENT_SECRET=...`, `YOUTUBE_REFRESH_TOKEN=...`

---

## Step 5 — Demo script (5-minute walkthrough)

### 1. Landing page (30s)
- Open `https://legion-vittor.vercel.app`
- Show the stats: 44 agents, 10 departments, 0 human input
- Click "Get started"

### 2. Onboarding (1 min)
- Fill in company details
- Add Claude API key (required), show other services are optional
- Hit "Launch" — show the dashboard loading

### 3. Live office (1 min)
- Navigate to Live Office
- Type: "Write an Instagram post about AI automation"
- Show agents responding in real time — CEO → Manager → Marketing agent

### 4. Demo pipelines (2 min)
- Navigate to Demo tab
- Run Instagram pipeline → show the caption + image description generated
- Run Leads pipeline → show 3 real leads found with scores
- Run Payment → show order created, open Razorpay (test card: 4111 1111 1111 1111)

### 5. Agents page (30s)
- Open Developer agent
- Add a skill: "TypeScript"
- Run a task: "Write a React hook for authentication"
- Show the live output

---

## Troubleshooting

**Backend sleeping (Render free tier)**
- Free tier sleeps after 15 min inactivity
- First request takes 30-60s to wake up
- Add a health check ping or upgrade to paid ($7/mo) for always-on

**CORS errors**
- Make sure `ALLOWED_ORIGINS` in Render env vars includes your Vercel URL exactly

**Supabase RLS errors**  
- Check that you ran the full schema.sql including all CREATE POLICY statements

**Claude API rate limits**
- claude-sonnet-4-5 has generous limits on paid plans
- If hitting limits, add delays between agent calls in orchestrator.py
