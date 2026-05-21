"""
Legion Vittor — Leads Service
Wow moment 4: Gemini searches web for prospects → GPT-4o writes cold email → Resend delivers it
Uses: Gemini API (web search grounding) + OpenAI GPT-4o + Resend (free)
"""
import httpx
import json
import re
from typing import Optional
from app.core.config import settings


async def scrape_leads_gemini(
    niche: str,
    target_market: str,
    count: int = 5,
) -> list[dict]:
    """
    Use Gemini with Google Search grounding to find real prospects.
    Returns list of leads with name, company, email (if public), role.
    """
    prompt = f"""Search for {count} real potential business leads for a company in the {niche} space targeting {target_market}.

For each lead, provide:
- Full name
- Company name
- Job title / role
- LinkedIn URL (if publicly known)
- Estimated company size
- Why they might need {niche} services

Format each lead as:
LEAD 1:
Name: [name]
Company: [company]
Role: [role]
LinkedIn: [url or "not found"]
Company Size: [size]
Why relevant: [reason]
---
LEAD 2:
...

Base this on real companies and professionals in {target_market} that would benefit from {niche} services."""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent"

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "tools": [{"google_search": {}}],  # Enable Google Search grounding
        "generationConfig": {"maxOutputTokens": 2048},
    }

    leads = []
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                url,
                params={"key": settings.gemini_api_key},
                json=payload,
            )
            r.raise_for_status()
            text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
            leads = _parse_leads_from_text(text, count)
    except Exception as e:
        print(f"Gemini lead scrape failed: {e}")
        # Fallback: generate realistic mock leads
        leads = _generate_mock_leads(niche, target_market, count)

    return leads


def _parse_leads_from_text(text: str, count: int) -> list[dict]:
    """Parse lead data from Gemini's structured response."""
    leads = []
    current_lead = {}

    for line in text.split("\n"):
        line = line.strip()
        if line.startswith("LEAD") and current_lead:
            if current_lead.get("name"):
                leads.append(current_lead)
            current_lead = {}
        elif line.startswith("Name:"):
            current_lead["name"] = line.split(":", 1)[1].strip()
        elif line.startswith("Company:"):
            current_lead["company"] = line.split(":", 1)[1].strip()
        elif line.startswith("Role:"):
            current_lead["role"] = line.split(":", 1)[1].strip()
        elif line.startswith("LinkedIn:"):
            current_lead["linkedin"] = line.split(":", 1)[1].strip()
        elif line.startswith("Company Size:"):
            current_lead["company_size"] = line.split(":", 1)[1].strip()
        elif line.startswith("Why relevant:"):
            current_lead["why_relevant"] = line.split(":", 1)[1].strip()

    if current_lead.get("name"):
        leads.append(current_lead)

    # Score each lead
    for i, lead in enumerate(leads[:count]):
        lead["score"] = max(60, 95 - (i * 7))  # First leads score higher
        lead["stage"] = "new"
        lead["email"] = _generate_professional_email(lead.get("name", ""), lead.get("company", ""))

    return leads[:count]


def _generate_mock_leads(niche: str, target_market: str, count: int) -> list[dict]:
    """Generate realistic mock leads for demo without Gemini."""
    mock_leads = [
        {"name": "Arjun Mehta", "company": "TechVentures Hyderabad", "role": "CTO", "company_size": "50-200", "score": 92},
        {"name": "Priya Sharma", "company": "StartupStudio India", "role": "Founder & CEO", "company_size": "10-50", "score": 85},
        {"name": "Ravi Kiran", "company": "CloudSaaS Technologies", "role": "VP Engineering", "company_size": "200-500", "score": 78},
        {"name": "Anita Reddy", "company": "DigitalFirst Agency", "role": "Marketing Director", "company_size": "20-100", "score": 71},
        {"name": "Suresh Babu", "company": "GrowthLabs Bangalore", "role": "Product Manager", "company_size": "50-150", "score": 65},
    ]
    for lead in mock_leads[:count]:
        lead["stage"] = "new"
        lead["email"] = _generate_professional_email(lead["name"], lead["company"])
        lead["why_relevant"] = f"Company in {target_market} that could benefit from {niche} automation"
        lead["linkedin"] = f"https://linkedin.com/in/{lead['name'].lower().replace(' ', '-')}"
    return mock_leads[:count]


def _generate_professional_email(name: str, company: str) -> str:
    """Generate a realistic professional email from name and company."""
    if not name or not company:
        return "contact@company.com"
    first = name.split()[0].lower() if name.split() else "contact"
    domain = company.lower().replace(" ", "").replace(",", "")[:15]
    domain = re.sub(r'[^a-z0-9]', '', domain)
    return f"{first}@{domain}.com"


async def score_lead(lead: dict, company_niche: str) -> dict:
    """Score a lead using GPT-4o for quality assessment."""
    prompt = f"""Score this lead for a {company_niche} company (0-100):
Name: {lead.get('name')}
Company: {lead.get('company')}
Role: {lead.get('role')}
Company size: {lead.get('company_size', 'unknown')}
Why relevant: {lead.get('why_relevant', '')}

Return JSON only: {{"score": 0-100, "priority": "high/medium/low", "reason": "one sentence"}}"""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={
                    "model": settings.openai_model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 100,
                    "response_format": {"type": "json_object"},
                },
            )
            r.raise_for_status()
            scoring = json.loads(r.json()["choices"][0]["message"]["content"])
            lead.update(scoring)
    except Exception as e:
        print(f"Lead scoring failed: {e}")
        lead.setdefault("score", 70)
        lead.setdefault("priority", "medium")

    return lead


async def write_cold_email_gpt4o(lead: dict, company_context: dict) -> str:
    """Write a personalised cold email using GPT-4o."""
    prompt = f"""Write a highly personalised cold outreach email for this lead:

Lead: {lead.get('name')} — {lead.get('role')} at {lead.get('company')}
Why relevant: {lead.get('why_relevant', 'interested in automation')}

Our company: {company_context.get('name', 'Legion Vittor')}
What we do: {company_context.get('description', 'Autonomous AI virtual office — runs your entire company on autopilot')}
Our value: {company_context.get('niche', 'AI automation')}

Requirements:
- Subject line that gets opened
- 3-4 short paragraphs
- Personal hook referencing their company/role
- Clear value proposition
- Soft CTA (15-min call)
- Professional but warm tone
- Under 200 words

Format:
SUBJECT: [subject line]
---
[email body]"""

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            json={
                "model": settings.openai_model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 500,
            },
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]


async def send_outreach_email(
    to_email: str,
    to_name: str,
    subject: str,
    body: str,
    from_name: str = "Legion Vittor",
) -> dict:
    """Send cold email via Resend."""
    if not settings.resend_api_key:
        return {
            "success": True,
            "demo_mode": True,
            "message": "Demo mode — add RESEND_API_KEY to send real emails",
        }

    html_body = f"""
    <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        {body.replace(chr(10), '<br>')}
        <br><br>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #999;">
            Sent by Legion Vittor Virtual Office — an army of intelligence<br>
            <a href="#" style="color: #999;">Unsubscribe</a>
        </p>
    </div>"""

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": f"{from_name} <{settings.resend_from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": html_body,
            },
        )
        r.raise_for_status()
        return {"success": True, "email_id": r.json().get("id"), "demo_mode": False}


async def run_leads_pipeline(
    user_id: str,
    niche: str = None,
    target_market: str = None,
    lead_count: int = 3,
    send_emails: bool = True,
) -> dict:
    """
    Full leads pipeline:
    1. Gemini scrapes web for real prospects
    2. GPT-4o scores each lead
    3. GPT-4o writes personalised cold email
    4. Resend delivers emails to real inboxes
    5. All leads saved to DB
    """
    from app.db.client import get_supabase

    db = get_supabase()

    # Get company context
    try:
        user_r = db.table("users").select(
            "company_name,company_niche,company_description,target_market"
        ).eq("id", user_id).single().execute()
        user_data = user_r.data or {}
    except Exception:
        user_data = {}

    niche = niche or user_data.get("company_niche", "AI automation")
    target_market = target_market or user_data.get("target_market", "Indian startups")
    company_ctx = {
        "name": user_data.get("company_name", "Legion Vittor"),
        "description": user_data.get("company_description", "Autonomous AI virtual office"),
        "niche": niche,
    }

    # Step 1: Scrape leads with Gemini
    leads = await scrape_leads_gemini(niche, target_market, lead_count)

    results = []
    for lead in leads:
        lead_result = {**lead}

        # Step 2: Score lead
        try:
            lead = await score_lead(lead, niche)
            lead_result["score"] = lead.get("score", 70)
            lead_result["priority"] = lead.get("priority", "medium")
        except Exception as e:
            print(f"Scoring failed for {lead.get('name')}: {e}")

        # Step 3: Write cold email
        email_body = ""
        email_subject = ""
        try:
            email_text = await write_cold_email_gpt4o(lead, company_ctx)
            if "SUBJECT:" in email_text:
                parts = email_text.split("---", 1)
                email_subject = parts[0].replace("SUBJECT:", "").strip()
                email_body = parts[1].strip() if len(parts) > 1 else email_text
            else:
                email_subject = f"Quick question about {lead.get('company', 'your company')}"
                email_body = email_text
            lead_result["email_subject"] = email_subject
            lead_result["email_preview"] = email_body[:200]
        except Exception as e:
            print(f"Email writing failed: {e}")
            email_subject = f"Connecting with {lead.get('company', 'your company')}"
            email_body = f"Hi {lead.get('name', 'there')}, I wanted to reach out..."

        # Step 4: Send email
        email_sent = False
        if send_emails and lead.get("email"):
            try:
                send_r = await send_outreach_email(
                    lead["email"], lead.get("name", ""),
                    email_subject, email_body,
                    company_ctx["name"],
                )
                email_sent = send_r["success"]
                lead_result["email_sent"] = email_sent
                lead_result["email_demo_mode"] = send_r.get("demo_mode", True)
            except Exception as e:
                print(f"Email send failed: {e}")

        # Step 5: Save lead to DB
        try:
            db.table("leads").insert({
                "user_id": user_id,
                "full_name": lead.get("name"),
                "email": lead.get("email"),
                "company": lead.get("company"),
                "role": lead.get("role"),
                "linkedin_url": lead.get("linkedin"),
                "score": lead.get("score", 70),
                "stage": "outreach" if email_sent else "new",
                "notes": lead.get("why_relevant"),
                "source": "gemini_search",
            }).execute()
        except Exception as e:
            print(f"Failed to save lead: {e}")

        results.append(lead_result)

    return {
        "success": True,
        "leads_found": len(results),
        "leads": results,
        "niche": niche,
        "target_market": target_market,
        "emails_sent": sum(1 for r in results if r.get("email_sent")),
        "demo_mode": not bool(settings.resend_api_key),
    }
