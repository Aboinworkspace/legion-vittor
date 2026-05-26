"""Legion Vittor — Auth Routes"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from app.db.client import get_supabase, get_supabase_anon
from app.core.config import settings

router = APIRouter()
security = HTTPBearer()


# ── Auth dependency (defined first so routes can use it) ─────────────────────

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Extract and verify the current user from Bearer token."""
    try:
        token = credentials.credentials
        client = get_supabase()
        result = client.auth.get_user(token)
        if result.user:
            profile = client.table("users").select("*").eq(
                "id", str(result.user.id)
            ).single().execute()
            user_data = {"id": str(result.user.id), "email": result.user.email}
            if profile.data:
                user_data.update(profile.data)
            return user_data
    except Exception as e:
        print(f"[Auth] get_current_user error: {e}")
    raise HTTPException(status_code=401, detail="Invalid or expired token")


# ── Request models ─────────────────────────────────────────────────────────

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class SignInRequest(BaseModel):
    email: EmailStr
    password: str

class SetupRequest(BaseModel):
    company_name: str = ""
    company_niche: str = ""
    company_description: str = ""
    target_market: str = ""
    primary_language: str = "English"
    brand_name: str = ""
    brand_tagline: str = "An army of intelligence"
    brand_voice: str = "Professional, confident"
    brand_tone: str = "Direct, authoritative"
    post_frequency: str = "Daily"


# ── Routes ────────────────────────────────────────────────────────────

@router.post("/signup")
async def signup(request: SignUpRequest):
    try:
        client = get_supabase_anon()
        result = client.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {"data": {"full_name": request.full_name}},
        })
        if result.user:
            db = get_supabase()
            db.table("users").insert({
                "id": str(result.user.id),
                "email": request.email,
                "full_name": request.full_name,
            }).execute()
            return {
                "success": True,
                "user_id": str(result.user.id),
                "email": request.email,
                "message": "Account created. Sign in to continue.",
            }
        raise HTTPException(status_code=400, detail="Signup failed")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Auth] signup error: {e}")
        raise HTTPException(status_code=400, detail=f"Signup failed: {str(e)}")


@router.post("/signin")
async def signin(request: SignInRequest):
    """Sign in user with email and password. Returns access token."""
    try:
        client = get_supabase_anon()
        result = client.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })
        
        if not result.user:
            print(f"[Auth] signin failed: no user returned for {request.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        if not result.session:
            print(f"[Auth] signin failed: no session for {request.email}")
            raise HTTPException(status_code=401, detail="No session created")
        
        # Fetch user profile from users table
        db = get_supabase()
        profile = db.table("users").select("*").eq("id", str(result.user.id)).single().execute()
        
        user_data = {
            "id": str(result.user.id),
            "email": result.user.email,
            "setup_complete": False,
        }
        if profile.data:
            user_data.update(profile.data)
        
        return {
            "success": True,
            "access_token": result.session.access_token,
            "user_id": str(result.user.id),
            "email": result.user.email,
            "user": user_data,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Auth] signin error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


@router.post("/setup")
async def complete_setup(request: SetupRequest, user=Depends(get_current_user)):
    try:
        db = get_supabase()
        db.table("users").update({
            "company_name": request.company_name,
            "company_niche": request.company_niche,
            "company_description": request.company_description,
            "target_market": request.target_market,
            "primary_language": request.primary_language,
            "brand_name": request.brand_name,
            "brand_tagline": request.brand_tagline,
            "brand_voice": request.brand_voice,
            "brand_tone": request.brand_tone,
            "post_frequency": request.post_frequency,
            "setup_complete": True,
        }).eq("id", user["id"]).execute()

        await _seed_departments(user["id"])
        await _seed_agents(user["id"])

        return {"success": True, "message": "Setup complete. Your virtual office is ready."}
    except Exception as e:
        print(f"[Auth] setup error: {e}")
        raise HTTPException(status_code=400, detail=f"Setup failed: {str(e)}")


@router.get("/me")
async def get_me(user=Depends(get_current_user)):
    """Get current logged-in user profile."""
    return user


# ── Seed helpers ──────────────────────────────────────────────────────────

async def _seed_departments(user_id: str):
    db = get_supabase()
    # Check if already seeded
    existing = db.table("departments").select("id").eq("user_id", user_id).execute()
    if existing.data:
        return
    departments = [
        {"name": "Leadership",         "slug": "leadership",   "color": "#7F77DD"},
        {"name": "Engineering",        "slug": "engineering",  "color": "#378ADD"},
        {"name": "Marketing & Sales",  "slug": "marketing",    "color": "#BA7517"},
        {"name": "Support",            "slug": "support",      "color": "#3B6D11"},
        {"name": "Analytics",          "slug": "analytics",    "color": "#3B6D11"},
    ]
    for dept in departments:
        try:
            db.table("departments").insert({**dept, "user_id": user_id}).execute()
        except Exception:
            pass


async def _seed_agents(user_id: str):
    db = get_supabase()
    # Check if already seeded
    existing = db.table("agents").select("id").eq("user_id", user_id).execute()
    if existing.data:
        return

    depts = db.table("departments").select("id,slug").eq("user_id", user_id).execute()
    dept_map = {d["slug"]: d["id"] for d in (depts.data or [])}

    agents_config = [
        {"name": "CEO agent",       "slug": "ceo_agent",       "dept": "leadership",
         "description": "Sets strategic vision and company goals",
         "skills": ["Strategic vision", "Goal setting", "Roadmap", "Decision making"]},
        {"name": "Manager agent",   "slug": "manager_agent",   "dept": "leadership",
         "description": "Orchestrates all departments and delegates tasks",
         "skills": ["Task delegation", "Coordination", "Progress tracking"]},
        {"name": "Developer agent", "slug": "developer_agent", "dept": "engineering",
         "description": "Writes and ships production-ready code",
         "skills": ["Python", "JavaScript", "FastAPI", "React", "PostgreSQL"]},
        {"name": "Marketing agent", "slug": "marketing_agent", "dept": "marketing",
         "description": "Creates campaigns, copy, and content",
         "skills": ["Copywriting", "Campaign strategy", "SEO", "Instagram", "Blog"]},
        {"name": "Support agent",   "slug": "support_agent",   "dept": "support",
         "description": "Handles customer queries and writes docs",
         "skills": ["FAQ handling", "Documentation", "Bug detection"]},
    ]

    for cfg in agents_config:
        dept_id = dept_map.get(cfg["dept"])
        try:
            result = db.table("agents").insert({
                "user_id": user_id,
                "department_id": dept_id,
                "name": cfg["name"],
                "slug": cfg["slug"],
                "description": cfg["description"],
                "system_prompt": f"You are the {cfg['name']} at Legion Vittor.",
                "status": "idle",
            }).execute()
            if result.data:
                agent_id = result.data[0]["id"]
                for skill in cfg["skills"]:
                    try:
                        db.table("agent_skills").insert({
                            "agent_id": agent_id, "skill": skill, "is_default": True
                        }).execute()
                    except Exception:
                        pass
        except Exception as e:
            print(f"Failed to seed agent {cfg['name']}: {e}")
