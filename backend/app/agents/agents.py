"""
Legion Vittor — 5 Prototype Agents
Claude: CEO, Manager, Developer (best reasoning + code)
GPT-4o: Marketing, Script writer (best creative writing)
Gemini: Support, Research (fast + web grounding)
"""
from app.agents.base_agent import BaseAgent


class CEOAgent(BaseAgent):
    LLM = "claude"
    def __init__(self, user_id, agent_id=None):
        super().__init__(
            name="CEO agent", slug="ceo_agent", department="Leadership",
            description="Sets strategic vision, defines goals, makes high-level decisions, ensures all departments are aligned. Delegates all execution to Manager agent.",
            default_skills=["Strategic vision","Goal setting","Company roadmap","Resource allocation","Decision making","KPI monitoring"],
            user_id=user_id, agent_id=agent_id,
        )


class ManagerAgent(BaseAgent):
    LLM = "claude"
    def __init__(self, user_id, agent_id=None):
        super().__init__(
            name="Manager agent", slug="manager_agent", department="Leadership",
            description="Receives goals from CEO and breaks them into tasks for each department. Coordinates all departments, tracks progress, resolves blockers, reports to CEO.",
            default_skills=["Task delegation","Cross-team coordination","Progress tracking","Blocker resolution","Weekly reporting","Priority management"],
            user_id=user_id, agent_id=agent_id,
        )

    async def delegate(self, goal, context=None):
        prompt = f"""Goal: "{goal}"

Create a delegation plan:
ENGINEERING TASK: [task for developer]
MARKETING TASK: [task for marketing]
SUPPORT TASK: [task for support]

Then execute the most urgent one."""
        return await self.run(prompt, context=context)


class DeveloperAgent(BaseAgent):
    LLM = "claude"  # Claude is best for code
    def __init__(self, user_id, agent_id=None):
        super().__init__(
            name="Developer agent", slug="developer_agent", department="Engineering",
            description="Writes clean, production-ready code. Produces actual working code with explanations. Follows best practices, writes comments, considers security.",
            default_skills=["Python","JavaScript/TypeScript","React/Next.js","FastAPI","REST APIs","PostgreSQL","Git","Docker","Security best practices"],
            user_id=user_id, agent_id=agent_id,
        )

    async def write_code(self, feature, language="Python"):
        return await self.run(f"Write production-ready {language} code for: {feature}. Include comments and error handling.")

    async def fix_bug(self, bug, code_context=None):
        return await self.run(f"Fix this bug: {bug}", context=code_context)


class MarketingAgent(BaseAgent):
    LLM = "openai"  # GPT-4o is best for creative copy
    def __init__(self, user_id, agent_id=None):
        super().__init__(
            name="Marketing agent", slug="marketing_agent", department="Marketing & Sales",
            description="Creates compelling campaigns and content. Adapts tone per platform — punchy for Instagram, professional for LinkedIn. Always writes with brand voice.",
            default_skills=["Copywriting","Brand voice","Campaign strategy","Instagram content","YouTube scripts","Blog writing","SEO","A/B testing","Hashtag research","Email marketing"],
            user_id=user_id, agent_id=agent_id,
        )

    async def create_instagram_post(self, topic, brand_context=None):
        return await self.run(
            f"Create an Instagram post about: {topic}\n"
            "Provide:\n1. Caption (engaging, under 150 words)\n"
            "2. 15-20 relevant hashtags\n3. Detailed image description for AI generation\n"
            "4. Best time to post\nMake it scroll-stopping.",
            context=brand_context,
        )

    async def create_blog_post(self, topic, keyword=None):
        return await self.run(
            f"Write a complete SEO blog post about: {topic}\n"
            f"Target keyword: {keyword or topic}\n"
            "Include: Title, meta description, H2 headings, 600-800 words, CTA."
        )

    async def create_campaign_brief(self, goal):
        return await self.run(
            f"Create a marketing campaign brief for: {goal}\n"
            "Include: Campaign name, target audience, key message, channels, 1-week content plan, success metrics."
        )


class SupportAgent(BaseAgent):
    LLM = "gemini"  # Gemini is fast for support responses
    def __init__(self, user_id, agent_id=None):
        super().__init__(
            name="Support agent", slug="support_agent", department="Support",
            description="Handles customer queries with empathy and efficiency. Writes documentation and FAQs. Detects bug patterns and alerts Engineering.",
            default_skills=["FAQ handling","Ticket triage","Empathetic communication","Technical writing","README writing","API documentation","Bug detection","Escalation management"],
            user_id=user_id, agent_id=agent_id,
        )

    async def handle_query(self, query, context=None):
        return await self.run(
            f"Handle this customer query: {query}\n"
            "Give a clear, empathetic response. If it's a bug, add: ALERT TO: Developer agent: [bug description]",
            context=context,
        )

    async def write_docs(self, feature, audience="end users"):
        return await self.run(
            f"Write documentation for: {feature}\nAudience: {audience}\n"
            "Include: Overview, step-by-step guide, examples, FAQ, troubleshooting."
        )


# ── Registry ─────────────────────────────────────────────────────────────────

AGENT_REGISTRY = {
    "ceo_agent": CEOAgent,
    "manager_agent": ManagerAgent,
    "developer_agent": DeveloperAgent,
    "marketing_agent": MarketingAgent,
    "support_agent": SupportAgent,
}


def get_agent(slug, user_id, agent_id=None):
    cls = AGENT_REGISTRY.get(slug)
    if not cls:
        raise ValueError(f"Unknown agent: {slug}. Available: {list(AGENT_REGISTRY.keys())}")
    return cls(user_id=user_id, agent_id=agent_id)


def get_all_agents(user_id):
    return {slug: cls(user_id=user_id) for slug, cls in AGENT_REGISTRY.items()}
