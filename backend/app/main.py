"""Legion Vittor — FastAPI Backend"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import agents, auth, messages, tasks, analytics, websocket, wow

app = FastAPI(
    title="Legion Vittor Virtual Office API",
    description="Autonomous AI company — 44 agents, 10 departments, zero human input",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/api/auth",      tags=["auth"])
app.include_router(agents.router,    prefix="/api/agents",    tags=["agents"])
app.include_router(messages.router,  prefix="/api/messages",  tags=["messages"])
app.include_router(tasks.router,     prefix="/api/tasks",     tags=["tasks"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(wow.router,       prefix="/api/wow",       tags=["wow-moments"])
app.include_router(websocket.router, prefix="/ws",            tags=["websocket"])


@app.get("/")
async def root():
    return {"name": "Legion Vittor Virtual Office", "version": "0.1.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
