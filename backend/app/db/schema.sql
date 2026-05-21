-- ═══════════════════════════════════════════════════════════
-- LEGION VITTOR PRIVATE LIMITED — Virtual Office
-- Supabase PostgreSQL Schema
-- Run this in Supabase SQL editor to set up the database
-- ═══════════════════════════════════════════════════════════

-- Enable pgvector for agent memory
CREATE EXTENSION IF NOT EXISTS vector;

-- ── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    company_name TEXT,
    company_niche TEXT,
    company_description TEXT,
    target_market TEXT,
    primary_language TEXT DEFAULT 'English',
    brand_name TEXT,
    brand_tagline TEXT,
    brand_voice TEXT DEFAULT 'Professional, confident',
    brand_tone TEXT DEFAULT 'Direct, authoritative',
    brand_colors JSONB DEFAULT '{"primary": "#1a1f4e", "accent": "#c8a84b", "bg": "#f5f5f7"}',
    post_frequency TEXT DEFAULT 'Daily',
    setup_complete BOOLEAN DEFAULT FALSE,
    autonomous_mode BOOLEAN DEFAULT TRUE,
    self_healing BOOLEAN DEFAULT TRUE,
    inter_dept_comms BOOLEAN DEFAULT TRUE,
    content_approval_gate BOOLEAN DEFAULT FALSE,
    escalation_threshold_minutes INTEGER DEFAULT 30,
    daily_digest BOOLEAN DEFAULT TRUE,
    digest_channel TEXT DEFAULT 'email',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CREDENTIALS (encrypted storage) ───────────────────────
CREATE TABLE IF NOT EXISTS credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service TEXT NOT NULL,  -- 'anthropic', 'stripe', 'razorpay', etc.
    key_name TEXT NOT NULL,
    encrypted_value TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, service, key_name)
);

-- ── DEPARTMENTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,  -- 'leadership', 'engineering', 'marketing', etc.
    color TEXT DEFAULT '#1a1f4e',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AGENTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,  -- 'ceo_agent', 'developer_agent', etc.
    description TEXT,
    system_prompt TEXT NOT NULL,
    status TEXT DEFAULT 'idle',  -- 'idle', 'active', 'busy', 'paused', 'error'
    current_task TEXT,
    tasks_completed INTEGER DEFAULT 0,
    tasks_today INTEGER DEFAULT 0,
    success_rate FLOAT DEFAULT 100.0,
    avg_response_seconds FLOAT DEFAULT 2.0,
    last_active_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AGENT SKILLS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    added_by TEXT DEFAULT 'user',  -- 'user', 'rnd_agent', 'system'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_id, skill)
);

-- ── AGENT MESSAGES (inter-department comms) ────────────────
CREATE TABLE IF NOT EXISTS agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    from_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    to_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,  -- NULL = broadcast
    from_agent_name TEXT NOT NULL,
    to_agent_name TEXT,  -- NULL = all departments
    from_department TEXT,
    to_department TEXT,
    channel TEXT DEFAULT 'all-departments',  -- channel slug
    message_type TEXT DEFAULT 'message',  -- 'message', 'broadcast', 'handoff', 'alert', 'update'
    content TEXT NOT NULL,
    attachment JSONB,  -- {name, type, size, url}
    is_user_message BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'normal',  -- 'normal', 'high', 'urgent'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TASKS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    agent_name TEXT,
    department TEXT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',  -- 'pending', 'running', 'completed', 'failed', 'paused'
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    progress INTEGER DEFAULT 0,  -- 0-100
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── OUTPUTS (what agents produce) ─────────────────────────
CREATE TABLE IF NOT EXISTS outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    agent_name TEXT,
    output_type TEXT NOT NULL,  -- 'code', 'post', 'video', 'email', 'invoice', 'blog', 'reel'
    title TEXT NOT NULL,
    content TEXT,
    metadata JSONB,  -- platform, url, views, etc.
    status TEXT DEFAULT 'draft',  -- 'draft', 'live', 'published', 'deployed'
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── LEADS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    company TEXT,
    role TEXT,
    linkedin_url TEXT,
    score INTEGER DEFAULT 0,  -- 0-100 BANT score
    stage TEXT DEFAULT 'new',  -- 'new', 'qualified', 'outreach', 'replied', 'closed', 'lost'
    estimated_value NUMERIC,
    notes TEXT,
    last_contacted_at TIMESTAMPTZ,
    source TEXT DEFAULT 'scraper',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ANALYTICS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date DATE DEFAULT CURRENT_DATE,
    revenue NUMERIC DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    leads_qualified INTEGER DEFAULT 0,
    posts_published INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    videos_published INTEGER DEFAULT 0,
    instagram_views INTEGER DEFAULT 0,
    youtube_views INTEGER DEFAULT 0,
    facebook_reach INTEGER DEFAULT 0,
    blog_visits INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    agent_messages_sent INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AGENT MEMORY (vector embeddings) ──────────────────────
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536),  -- OpenAI/Claude embedding size
    memory_type TEXT DEFAULT 'conversation',  -- 'conversation', 'task', 'learning'
    relevance_score FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── FLOWCHARTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flowcharts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    nodes JSONB NOT NULL DEFAULT '[]',
    template_key TEXT,  -- 'full', 'sales', 'video', etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_messages_user_id ON agent_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_channel ON agent_messages(channel);
CREATE INDEX IF NOT EXISTS idx_agent_messages_created_at ON agent_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_outputs_user_id ON outputs(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_id ON agent_memory(agent_id);

-- ── ROW LEVEL SECURITY ─────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE flowcharts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users own credentials" ON credentials FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own departments" ON departments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own agents" ON agents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own skills" ON agent_skills FOR ALL USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
);
CREATE POLICY "Users own messages" ON agent_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own outputs" ON outputs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own leads" ON leads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own analytics" ON analytics_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own memory" ON agent_memory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own flowcharts" ON flowcharts FOR ALL USING (auth.uid() = user_id);

-- ── SEED DEFAULT DEPARTMENTS ───────────────────────────────
-- (Run after creating a user — replace USER_ID with actual UUID)
-- INSERT INTO departments (user_id, name, slug, color) VALUES
--   ('USER_ID', 'Leadership', 'leadership', '#7F77DD'),
--   ('USER_ID', 'Engineering', 'engineering', '#378ADD'),
--   ('USER_ID', 'R&D', 'rnd', '#7F77DD'),
--   ('USER_ID', 'Marketing & Sales', 'marketing', '#BA7517'),
--   ('USER_ID', 'Leads Pipeline', 'leads', '#1D9E75'),
--   ('USER_ID', 'Support', 'support', '#3B6D11'),
--   ('USER_ID', 'Payments', 'payments', '#1D9E75'),
--   ('USER_ID', 'Video & Reels', 'video', '#D4537E'),
--   ('USER_ID', 'Social Media', 'social', '#D4537E'),
--   ('USER_ID', 'Analytics', 'analytics', '#3B6D11');
