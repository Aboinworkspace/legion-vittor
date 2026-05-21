"""Legion Vittor — Agent API Routes"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.agents.agents import get_agent, get_all_agents, AGENT_REGISTRY
from app.agents.orchestrator import Orchestrator
from app.api.auth import get_current_user

router = APIRouter()


class RunTaskRequest(BaseModel):
    task: str
    context: Optional[str] = None
    custom_skills: Optional[list[str]] = None


class AddSkillRequest(BaseModel):
    skill: str


class ProcessRequest(BaseModel):
    prompt: str


class PipelineRequest(BaseModel):
    topic: str


# ── Get all agents ────────────────────────────────────────────────────────────

@router.get("/")
async def list_agents(user=Depends(get_current_user)):
    """List all agents with their current status."""
    agents = get_all_agents(user["id"])
    return {
        "agents": [
            {
                "slug": slug,
                "name": agent.name,
                "department": agent.department,
                "description": agent.description,
                "status": agent.status,
                "skills": agent.default_skills,
            }
            for slug, agent in agents.items()
        ]
    }


# ── Run a task on a specific agent ────────────────────────────────────────────

@router.post("/{agent_slug}/run")
async def run_agent_task(
    agent_slug: str,
    request: RunTaskRequest,
    user=Depends(get_current_user),
):
    """Run a task on a specific agent."""
    if agent_slug not in AGENT_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_slug}' not found")

    agent = get_agent(agent_slug, user_id=user["id"])
    result = await agent.run(
        task=request.task,
        context=request.context,
        custom_skills=request.custom_skills,
    )

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Agent failed"))

    return result


# ── Get agent skills ──────────────────────────────────────────────────────────

@router.get("/{agent_slug}/skills")
async def get_agent_skills(agent_slug: str, user=Depends(get_current_user)):
    """Get all skills for an agent."""
    if agent_slug not in AGENT_REGISTRY:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent = get_agent(agent_slug, user_id=user["id"])
    return {"agent": agent_slug, "skills": agent.get_skills()}


# ── Add skill ────────────────────────────────────────────────────────────────

@router.post("/{agent_slug}/skills")
async def add_agent_skill(
    agent_slug: str,
    request: AddSkillRequest,
    user=Depends(get_current_user),
):
    """Add a custom skill to an agent."""
    if agent_slug not in AGENT_REGISTRY:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent = get_agent(agent_slug, user_id=user["id"])
    success = agent.add_skill(request.skill)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to add skill")

    return {"success": True, "skill": request.skill}


# ── Remove skill ─────────────────────────────────────────────────────────────

@router.delete("/{agent_slug}/skills/{skill}")
async def remove_agent_skill(
    agent_slug: str,
    skill: str,
    user=Depends(get_current_user),
):
    """Remove a skill from an agent."""
    if agent_slug not in AGENT_REGISTRY:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent = get_agent(agent_slug, user_id=user["id"])
    success = agent.remove_skill(skill)
    return {"success": success, "skill": skill}


# ── Orchestrator: process full prompt through pipeline ────────────────────────

@router.post("/orchestrate")
async def orchestrate(request: ProcessRequest, user=Depends(get_current_user)):
    """Send a prompt through the full CEO → Manager → Departments pipeline."""
    orchestrator = Orchestrator(user_id=user["id"])
    result = await orchestrator.process(request.prompt)
    return result


# ── Run marketing pipeline ────────────────────────────────────────────────────

@router.post("/pipeline/marketing")
async def run_marketing_pipeline(
    request: PipelineRequest,
    user=Depends(get_current_user),
):
    """Run the full marketing pipeline for a topic."""
    orchestrator = Orchestrator(user_id=user["id"])
    result = await orchestrator.run_marketing_pipeline(request.topic)
    return result


# ── Run dev pipeline ──────────────────────────────────────────────────────────

@router.post("/pipeline/dev")
async def run_dev_pipeline(
    request: PipelineRequest,
    user=Depends(get_current_user),
):
    """Run the full dev pipeline for a feature."""
    orchestrator = Orchestrator(user_id=user["id"])
    result = await orchestrator.run_dev_pipeline(request.topic)
    return result
