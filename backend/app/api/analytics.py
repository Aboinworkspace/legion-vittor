"""Legion Vittor — Analytics API"""
from fastapi import APIRouter, Depends
from app.db.client import get_supabase
from app.api.auth import get_current_user
from datetime import date, timedelta

router = APIRouter()

@router.get("/overview")
async def get_analytics_overview(user=Depends(get_current_user)):
    db = get_supabase()
    today = date.today()
    week_ago = today - timedelta(days=7)

    # Get snapshots for the week
    result = db.table("analytics_snapshots").select("*").eq(
        "user_id", user["id"]
    ).gte("snapshot_date", str(week_ago)).order("snapshot_date").execute()

    # Get message count today
    msgs = db.table("agent_messages").select("id", count="exact").eq(
        "user_id", user["id"]
    ).gte("created_at", f"{today}T00:00:00").execute()

    # Get tasks completed today
    tasks = db.table("tasks").select("id", count="exact").eq(
        "user_id", user["id"]
    ).eq("status", "completed").gte("created_at", f"{today}T00:00:00").execute()

    return {
        "snapshots": result.data or [],
        "today": {
            "messages_sent": msgs.count or 0,
            "tasks_completed": tasks.count or 0,
        }
    }

@router.get("/agents")
async def get_agent_analytics(user=Depends(get_current_user)):
    db = get_supabase()
    result = db.table("agents").select(
        "name, slug, status, tasks_completed, tasks_today, success_rate, last_active_at"
    ).eq("user_id", user["id"]).execute()
    return {"agents": result.data or []}
