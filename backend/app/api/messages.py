"""Legion Vittor — Messages API"""
from fastapi import APIRouter, Depends, Query
from app.db.client import get_supabase
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_messages(
    channel: str = Query("all-departments"),
    limit: int = Query(50),
    user=Depends(get_current_user),
):
    db = get_supabase()
    result = db.table("agent_messages").select("*").eq(
        "user_id", user["id"]
    ).eq("channel", channel).order(
        "created_at", desc=True
    ).limit(limit).execute()
    return {"messages": list(reversed(result.data or []))}

@router.get("/channels")
async def get_channels(user=Depends(get_current_user)):
    return {
        "channels": [
            {"id": "all-departments", "name": "All departments", "icon": "building"},
            {"id": "leadership", "name": "Leadership", "color": "#7F77DD"},
            {"id": "engineering", "name": "Engineering", "color": "#378ADD"},
            {"id": "marketing", "name": "Marketing & Sales", "color": "#BA7517"},
            {"id": "support", "name": "Support", "color": "#3B6D11"},
        ]
    }
