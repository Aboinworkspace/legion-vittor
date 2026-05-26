"""
Legion Vittor — Orchestrator
The brain that coordinates all agents, routes messages, and runs pipelines.
"""

import asyncio
import uuid
from typing import Any, Optional
from app.agents.agents import get_all_agents, get_agent, AGENT_REGISTRY
from app.db.client import get_supabase
from app.core.config import settings


class Orchestrator:
    """
    Coordinates the Legion Vittor agent pipeline.
    - Routes user prompts to the right agents
    - Manages inter-agent handoffs and conversations
    - Runs multi-step pipelines
    - Saves all messages to Supabase Realtime for live chat
    """

    def __init__(self, user_id: str):
        self.user_id = user_id
        self.db = get_supabase()
        self.agents = get_all_agents(user_id)

    # ── Main entry: process any user prompt ──────────────────────────────────

    async def process(self, prompt: str, channel: str = "all-departments") -> dict[str, Any]:
        """
        Main entry point. Routes a user prompt through the agent pipeline.
        CEO → Manager → relevant departments → output
        Agents communicate with each other via handoffs and broadcasts.
        """
        pipeline_id = str(uuid.uuid4())

        # Step 1: CEO understands the goal
        ceo = self.agents["ceo_agent"]
        ceo_result = await ceo.run(
            f"A new request has come in: {prompt}\n\nDefine the strategic goal and what success looks like.",
        )

        if not ceo_result["success"]:
            return {"success": False, "error": "CEO agent failed", "pipeline_id": pipeline_id}

        # Step 2: Manager breaks it into department tasks
        manager = self.agents["manager_agent"]
        manager_result = await manager.run(
            f"The CEO has defined this goal: {ceo_result['output']}\n\n"
            f"Original request: {prompt}\n\n"
            "Break this into specific tasks for Engineering, Marketing, and Support. "
            "Use HANDOFF TO: [agent_name]: [task] to delegate to specific agents.",
            context=ceo_result["output"],
        )

        # Step 3: Route to relevant agents and trigger inter-agent conversations
        dept_results = await self._route_to_departments(prompt, manager_result.get("output", ""), channel)

        return {
            "success": True,
            "pipeline_id": pipeline_id,
            "ceo_output": ceo_result["output"],
            "manager_output": manager_result["output"],
            "department_outputs": dept_results,
        }

    async def _route_to_departments(self, prompt: str, manager_plan: str, channel: str = "all-departments") -> dict:
        """Route tasks to relevant agents based on prompt content and trigger agent conversations."""
        results = {}
        prompt_lower = prompt.lower()

        tasks = []

        # Engineering triggers
        if any(kw in prompt_lower for kw in ["code", "build", "develop", "fix", "bug", "feature", "api", "app"]):
            tasks.append(("developer_agent", prompt))

        # Marketing triggers
        if any(kw in prompt_lower for kw in ["post", "instagram", "marketing", "campaign", "content", "blog", "social", "reel"]):
            tasks.append(("marketing_agent", prompt))

        # Support triggers
        if any(kw in prompt_lower for kw in ["help", "support", "docs", "question", "issue", "problem", "guide"]):
            tasks.append(("support_agent", prompt))

        # Default: route to manager for general tasks
        if not tasks:
            tasks.append(("manager_agent", prompt))

        # Run tasks concurrently and allow inter-agent communication
        async def run_agent_task(slug: str, task: str):
            agent = self.agents.get(slug)
            if agent:
                result = await agent.run(task, context=manager_plan)
                results[slug] = result

                # Process inter-agent messages (handoffs, broadcasts, alerts)
                if result.get("inter_messages"):
                    for msg in result["inter_messages"]:
                        await self._process_inter_agent_message(msg, agent, channel)

        await asyncio.gather(*[run_agent_task(slug, task) for slug, task in tasks])

        return results

    async def _process_inter_agent_message(self, msg: dict, from_agent, channel: str):
        """
        Handle inter-agent messages: handoffs, broadcasts, alerts.
        This triggers agent-to-agent conversations in the live office.
        """
        msg_type = msg.get("type", "message")
        to_agent_name = msg.get("to")
        content = msg.get("content", "")

        # Save the inter-agent message to database (shows in live-office chat)
        try:
            await from_agent._save_message(
                content=content,
                message_type=msg_type,
                to_agent_name=to_agent_name,
                channel=channel
            )
        except Exception as e:
            print(f"[Orchestrator] Failed to save inter-agent message: {e}")

        # If it's a handoff to a specific agent, trigger that agent to respond
        if msg_type == "handoff" and to_agent_name:
            target_agent = self._find_agent_by_name(to_agent_name)
            if target_agent:
                # Agent responds to handoff
                response = await target_agent.run(
                    f"You received a handoff from {from_agent.name}: {content}\n\nRespond and complete this task.",
                    context=content
                )
                # Process any further inter-agent messages from this response
                if response.get("inter_messages"):
                    for follow_msg in response["inter_messages"]:
                        await self._process_inter_agent_message(follow_msg, target_agent, channel)

    def _find_agent_by_name(self, agent_name: str):
        """Find agent by name (case-insensitive partial match)."""
        agent_name_lower = agent_name.lower()
        for slug, agent in self.agents.items():
            if agent_name_lower in agent.name.lower() or agent_name_lower in slug.lower():
                return agent
        return None

    # ── Direct agent message ──────────────────────────────────────────────────

    async def message_agent(self, agent_slug: str, message: str, context: str = None) -> dict:
        """Send a direct message to a specific agent (from user or another agent)."""
        agent = self.agents.get(agent_slug)
        if not agent:
            return {"success": False, "error": f"Agent '{agent_slug}' not found"}

        return await agent.run(message, context=context)

    # ── Pipeline: Full marketing pipeline ────────────────────────────────────

    async def run_marketing_pipeline(self, topic: str) -> dict:
        """
        Full marketing pipeline:
        Marketing agent creates brief → content for Instagram, Blog
        """
        marketing = self.agents["marketing_agent"]

        # Step 1: Campaign brief
        brief = await marketing.create_campaign_brief(topic)

        # Step 2: Instagram post
        insta = await marketing.create_instagram_post(
            topic,
            brand_context=brief.get("output", "")
        )

        # Step 3: Blog post
        blog = await marketing.create_blog_post(topic)

        return {
            "success": True,
            "pipeline": "marketing",
            "topic": topic,
            "campaign_brief": brief.get("output"),
            "instagram_post": insta.get("output"),
            "blog_post": blog.get("output"),
        }

    # ── Pipeline: Dev feature pipeline ───────────────────────────────────────

    async def run_dev_pipeline(self, feature: str) -> dict:
        """
        Dev pipeline: Developer writes code → Support writes docs
        """
        developer = self.agents["developer_agent"]
        support = self.agents["support_agent"]

        # Step 1: Write the code
        code_result = await developer.write_code(feature)

        # Step 2: Write docs for it
        docs_result = await support.write_docs(
            feature,
            audience="developers and end users"
        )

        return {
            "success": True,
            "pipeline": "development",
            "feature": feature,
            "code": code_result.get("output"),
            "documentation": docs_result.get("output"),
        }

    # ── Get all agent statuses ────────────────────────────────────────────────

    def get_agent_statuses(self) -> list[dict]:
        """Return current status of all agents."""
        return [
            {
                "slug": slug,
                "name": agent.name,
                "department": agent.department,
                "status": agent.status,
                "current_task": agent.current_task,
            }
            for slug, agent in self.agents.items()
        ]
