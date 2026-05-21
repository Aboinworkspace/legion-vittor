"""
Legion Vittor — Payment Service
Wow moment 3: Claude generates invoice → Razorpay test checkout → webhook → Resend receipt email
Uses: Claude API + Razorpay (free test mode) + Resend (free tier)
"""
import httpx
import hmac
import hashlib
import json
from datetime import datetime
from typing import Optional
from app.core.config import settings


async def create_razorpay_order(amount_inr: float, description: str, customer_name: str) -> dict:
    """Create a Razorpay order (test mode)."""
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        # Demo mode — return mock order
        order_id = f"order_demo_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        return {
            "success": True,
            "order_id": order_id,
            "amount": int(amount_inr * 100),
            "currency": "INR",
            "checkout_url": f"https://rzp.io/l/demo",
            "demo_mode": True,
            "key_id": "rzp_test_demo",
            "message": "Demo mode — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env for real checkout",
        }

    amount_paise = int(amount_inr * 100)  # Razorpay uses paise

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            "https://api.razorpay.com/v1/orders",
            auth=(settings.razorpay_key_id, settings.razorpay_key_secret),
            json={
                "amount": amount_paise,
                "currency": "INR",
                "receipt": f"lv_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                "notes": {"description": description, "customer": customer_name},
            },
        )
        r.raise_for_status()
        order = r.json()

    return {
        "success": True,
        "order_id": order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": settings.razorpay_key_id,
        "demo_mode": False,
    }


def verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify Razorpay payment signature."""
    if not settings.razorpay_key_secret:
        return True  # Demo mode — always valid

    expected = hmac.new(
        settings.razorpay_key_secret.encode(),
        f"{order_id}|{payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


async def send_receipt_email(
    customer_email: str,
    customer_name: str,
    amount: float,
    order_id: str,
    description: str,
) -> dict:
    """Send payment receipt via Resend."""
    if not settings.resend_api_key:
        return {
            "success": True,
            "demo_mode": True,
            "message": "Demo mode — add RESEND_API_KEY to .env to send real emails",
        }

    html_body = f"""
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f5f4f0;">
        <div style="background: white; border-radius: 12px; padding: 40px; border: 1px solid #e4e2da;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 32px;">
                <div style="width: 40px; height: 40px; background: #1a1f4e; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: #c8a84b; font-weight: 700; font-size: 14px;">LV</span>
                </div>
                <div>
                    <div style="font-weight: 700; color: #1a1f4e; font-size: 16px; letter-spacing: 1px;">LEGION VITTOR</div>
                    <div style="font-size: 10px; color: #888; letter-spacing: 3px; text-transform: uppercase;">PRIVATE LIMITED</div>
                </div>
            </div>

            <h2 style="color: #1a1f4e; margin-bottom: 8px; font-size: 22px;">Payment confirmed ✓</h2>
            <p style="color: #666; margin-bottom: 32px;">Thank you, {customer_name}. Your payment has been received.</p>

            <div style="background: #f5f4f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #e4e2da;">
                        <td style="padding: 8px 0; color: #888; font-size: 13px;">Description</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 500; font-size: 13px;">{description}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e4e2da;">
                        <td style="padding: 8px 0; color: #888; font-size: 13px;">Order ID</td>
                        <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 11px; color: #666;">{order_id}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e4e2da;">
                        <td style="padding: 8px 0; color: #888; font-size: 13px;">Date</td>
                        <td style="padding: 8px 0; text-align: right; font-size: 13px;">{datetime.utcnow().strftime('%d %B %Y')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0 4px; font-weight: 700; color: #1a1f4e;">Total paid</td>
                        <td style="padding: 12px 0 4px; text-align: right; font-weight: 700; color: #1a1f4e; font-size: 18px;">₹{amount:,.2f}</td>
                    </tr>
                </table>
            </div>

            <p style="color: #888; font-size: 12px; text-align: center;">
                This receipt was generated automatically by Legion Vittor Virtual Office.<br>
                An army of intelligence · legionvittor.com
            </p>
        </div>
    </div>
    """

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": settings.resend_from_email,
                "to": [customer_email],
                "subject": f"Payment confirmed — ₹{amount:,.0f} · Legion Vittor",
                "html": html_body,
            },
        )
        r.raise_for_status()
        email_id = r.json().get("id")

    return {"success": True, "email_id": email_id, "demo_mode": False}


async def run_payment_pipeline(
    customer_email: str,
    customer_name: str,
    amount_inr: float,
    description: str,
    user_id: str,
) -> dict:
    """
    Full payment pipeline:
    1. Claude generates invoice text
    2. Create Razorpay order
    3. Return checkout details (frontend opens Razorpay modal)
    4. On webhook — send receipt email
    """
    from app.agents.agents import CEOAgent
    from app.db.client import get_supabase

    # Step 1: Claude generates invoice content
    agent = CEOAgent(user_id=user_id)
    invoice_result = await agent.run(
        f"Generate a professional invoice for:\n"
        f"Customer: {customer_name} ({customer_email})\n"
        f"Service: {description}\n"
        f"Amount: ₹{amount_inr:,.2f}\n"
        f"Date: {datetime.utcnow().strftime('%d %B %Y')}\n\n"
        "Include: Invoice number, line items, total, payment terms, thank you note."
    )

    invoice_text = invoice_result.get("output", f"Invoice for {description} — ₹{amount_inr:,.2f}")

    # Step 2: Create Razorpay order
    order = await create_razorpay_order(amount_inr, description, customer_name)

    # Step 3: Save to DB
    try:
        db = get_supabase()
        db.table("outputs").insert({
            "user_id": user_id,
            "agent_name": "Payment agent",
            "output_type": "invoice",
            "title": f"Invoice: {description}",
            "content": invoice_text,
            "metadata": {
                "order_id": order.get("order_id"),
                "amount": amount_inr,
                "customer_name": customer_name,
                "customer_email": customer_email,
                "demo_mode": order.get("demo_mode", True),
            },
            "status": "draft",
        }).execute()
    except Exception as e:
        print(f"Failed to save payment output: {e}")

    return {
        "success": True,
        "invoice_text": invoice_text[:500],
        "order_id": order.get("order_id"),
        "amount": amount_inr,
        "currency": "INR",
        "key_id": order.get("key_id", "rzp_test_demo"),
        "customer_name": customer_name,
        "customer_email": customer_email,
        "description": description,
        "demo_mode": order.get("demo_mode", True),
        "message": order.get("message", ""),
    }


async def handle_payment_webhook(
    order_id: str,
    payment_id: str,
    signature: str,
    user_id: str,
    customer_email: str,
    customer_name: str,
    amount: float,
    description: str,
) -> dict:
    """Handle Razorpay payment webhook — verify + send receipt."""
    # Verify signature
    is_valid = verify_razorpay_signature(order_id, payment_id, signature)
    if not is_valid:
        return {"success": False, "error": "Invalid payment signature"}

    # Send receipt email
    email_result = await send_receipt_email(
        customer_email, customer_name, amount, order_id, description
    )

    # Update output status in DB
    try:
        from app.db.client import get_supabase
        db = get_supabase()
        db.table("outputs").update({"status": "live"}).eq(
            "user_id", user_id
        ).contains("metadata", {"order_id": order_id}).execute()
    except Exception as e:
        print(f"Failed to update payment status: {e}")

    return {
        "success": True,
        "order_id": order_id,
        "payment_id": payment_id,
        "receipt_sent": email_result["success"],
        "demo_mode": email_result.get("demo_mode", True),
    }
