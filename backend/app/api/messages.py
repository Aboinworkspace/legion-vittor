"""Legion Vittor — Messages API"""
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional
from app.db.client import get_supabase
from app.api.auth import get_current_user

router = APIRouter()


class UserMessageRequest(BaseModel):
    content: str
    target_agent: Optional[str] = None
    channel: str = "all-departments"


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


@router.post("/user-message")
async def save_user_message(
    request: UserMessageRequest,
    user=Depends(get_current_user),
):
    """Save a message from the owner to the live office feed."""
    db = get_supabase()
    result = db.table("agent_messages").insert({
        "user_id": user["id"],
        "from_agent_name": "You (owner)",
        "to_agent_name": request.target_agent,
        "from_department": "Owner",
        "channel": request.channel,
        "message_type": "message",
        "content": request.content,
        "is_user_message": True,
        "priority": "high",
    }).execute()
    return {"success": True, "message": result.data[0] if result.data else None}


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
