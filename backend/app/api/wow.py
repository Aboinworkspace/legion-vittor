"""
Legion Vittor — Wow Moments API Routes
All 4 real demo pipelines: Instagram · Video · Payment · Leads
"""
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.api.auth import get_current_user

router = APIRouter()


# ── Request models ────────────────────────────────────────────────────────────

class InstagramRequest(BaseModel):
    topic: str

class VideoRequest(BaseModel):
    topic: str

class PaymentRequest(BaseModel):
    customer_email: str
    customer_name: str
    amount_inr: float
    description: str

class PaymentWebhookRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    customer_email: str
    customer_name: str
    amount: float
    description: str

class LeadsRequest(BaseModel):
    niche: Optional[str] = None
    target_market: Optional[str] = None
    lead_count: int = 3
    send_emails: bool = False  # Default False to avoid accidental email sends


# ── Instagram pipeline ────────────────────────────────────────────────────────

@router.post("/instagram")
async def create_instagram_post(
    request: InstagramRequest,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
):
    """
    Wow moment 1: Write caption (GPT-4o) → Generate image (DALL-E 3) → Post to Instagram
    """
    from app.services.instagram_service import run_instagram_pipeline

    result = await run_instagram_pipeline(
        topic=request.topic,
        user_id=user["id"],
    )
    return result


# ── Video/reel pipeline ───────────────────────────────────────────────────────

@router.post("/video")
async def create_video_reel(
    request: VideoRequest,
    user=Depends(get_current_user),
):
    """
    Wow moment 2: Script (GPT-4o) → Voice (OpenAI TTS) → Frames (DALL-E) → FFmpeg → YouTube
    """
    from app.services.video_service import run_video_pipeline

    result = await run_video_pipeline(
        topic=request.topic,
        user_id=user["id"],
    )
    return result


# ── Payment pipeline ──────────────────────────────────────────────────────────

@router.post("/payment/create")
async def create_payment(
    request: PaymentRequest,
    user=Depends(get_current_user),
):
    """
    Wow moment 3: Generate invoice (Claude) → Create Razorpay order → Return checkout details
    Frontend opens Razorpay modal with these details.
    """
    from app.services.payment_service import run_payment_pipeline

    result = await run_payment_pipeline(
        customer_email=request.customer_email,
        customer_name=request.customer_name,
        amount_inr=request.amount_inr,
        description=request.description,
        user_id=user["id"],
    )
    return result


@router.post("/payment/webhook")
async def payment_webhook(request: PaymentWebhookRequest, user=Depends(get_current_user)):
    """
    Called after Razorpay payment completes.
    Verifies signature → sends receipt email.
    """
    from app.services.payment_service import handle_payment_webhook

    result = await handle_payment_webhook(
        order_id=request.razorpay_order_id,
        payment_id=request.razorpay_payment_id,
        signature=request.razorpay_signature,
        user_id=user["id"],
        customer_email=request.customer_email,
        customer_name=request.customer_name,
        amount=request.amount,
        description=request.description,
    )
    return result


# ── Leads pipeline ────────────────────────────────────────────────────────────

@router.post("/leads")
async def run_leads(
    request: LeadsRequest,
    user=Depends(get_current_user),
):
    """
    Wow moment 4: Gemini finds prospects → GPT-4o writes emails → Resend delivers
    """
    from app.services.leads_service import run_leads_pipeline

    result = await run_leads_pipeline(
        user_id=user["id"],
        niche=request.niche,
        target_market=request.target_market,
        lead_count=request.lead_count,
        send_emails=request.send_emails,
    )
    return result


# ── Outputs feed (all recent outputs) ────────────────────────────────────────

@router.get("/outputs")
async def get_outputs(user=Depends(get_current_user)):
    """Get all recent agent outputs — posts, videos, invoices, emails."""
    from app.db.client import get_supabase
    db = get_supabase()
    r = db.table("outputs").select("*").eq(
        "user_id", user["id"]
    ).order("created_at", desc=True).limit(20).execute()
    return {"outputs": r.data or []}


# ── Demo mode check ───────────────────────────────────────────────────────────

@router.get("/demo-status")
async def get_demo_status(user=Depends(get_current_user)):
    """Show which services are in demo mode vs fully connected."""
    from app.core.config import settings
    return {
        "services": {
            "claude":    {"connected": bool(settings.anthropic_api_key), "used_for": "CEO, Manager, Developer agents"},
            "openai":    {"connected": bool(settings.openai_api_key),    "used_for": "Marketing agent, DALL-E images, TTS voice"},
            "gemini":    {"connected": bool(settings.gemini_api_key),    "used_for": "Support agent, Lead research"},
            "instagram": {"connected": bool(settings.meta_access_token), "used_for": "Instagram posting"},
            "youtube":   {"connected": bool(settings.youtube_refresh_token), "used_for": "Video upload"},
            "razorpay":  {"connected": bool(settings.razorpay_key_id),   "used_for": "Payment checkout"},
            "resend":    {"connected": bool(settings.resend_api_key),    "used_for": "Receipt & outreach emails"},
        }
    }
