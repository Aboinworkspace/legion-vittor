"""Legion Vittor — Tasks API"""
from fastapi import APIRouter, Depends, Query
from app.db.client import get_supabase
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_tasks(
    status: str = Query(None),
    limit: int = Query(20),
    user=Depends(get_current_user),
):
    db = get_supabase()
    query = db.table("tasks").select("*").eq("user_id", user["id"])
    if status:
        query = query.eq("status", status)
    result = query.order("created_at", desc=True).limit(limit).execute()
    return {"tasks": result.data or []}

@router.get("/active")
async def get_active_tasks(user=Depends(get_current_user)):
    db = get_supabase()
    result = db.table("tasks").select("*").eq(
        "user_id", user["id"]
    ).in_("status", ["running", "pending"]).execute()
    return {"tasks": result.data or []}
