"""
Legion Vittor — Multi-LLM Base Agent
Supports: Claude (Anthropic) · GPT-4o (OpenAI) · Gemini (Google)
"""
import json
import uuid
from datetime import datetime
from typing import Any, Optional
from app.core.config import settings


class BaseAgent:
    LLM = "claude"  # override in subclasses: "claude" | "openai" | "gemini"

    def __init__(self, name, slug, department, description, default_skills, user_id, agent_id=None):
        self.name = name
        self.slug = slug
        self.department = department
        self.description = description
        self.default_skills = default_skills
        self.user_id = user_id
        self.agent_id = agent_id or str(uuid.uuid4())
        self.status = "idle"
        self.current_task = None
        self.conversation_history = []
        self._db = None

    @property
    def db(self):
        if self._db is None:
            from app.db.client import get_supabase
            self._db = get_supabase()
        return self._db

    def build_system_prompt(self, custom_skills=None):
        skills = list(set(self.default_skills + (custom_skills or [])))
        skills_text = "\n".join(f"  - {s}" for s in skills)
        company = self._get_company_context()
        return f"""You are the {self.name} at Legion Vittor Private Limited — an autonomous AI virtual office.

COMPANY:
{company}

YOUR ROLE: {self.description}
DEPARTMENT: {self.department}

YOUR SKILLS:
{skills_text}

RULES:
1. Work autonomously within your role
2. State outputs clearly — what you did and the result
3. Use these prefixes for inter-agent messages:
   HANDOFF TO: [agent name]: [message]
   BROADCAST: [message]
   ALERT TO: [agent name]: [issue]
4. Be concise and action-oriented
5. Sign messages: [{self.name}]"""

    def _get_company_context(self):
        try:
            r = self.db.table("users").select(
                "company_name,company_niche,company_description,brand_voice"
            ).eq("id", self.user_id).single().execute()
            if r.data:
                d = r.data
                return (f"Name: {d.get('company_name','Legion Vittor')}\n"
                        f"Niche: {d.get('company_niche','Technology')}\n"
                        f"Description: {d.get('company_description','Autonomous AI company')}\n"
                        f"Voice: {d.get('brand_voice','Professional')}")
        except Exception:
            pass
        return "Name: Legion Vittor Private Limited\nNiche: AI Technology"

    async def run(self, task, context=None, custom_skills=None, task_id=None):
        self.status = "active"
        self.current_task = task
        started_at = datetime.utcnow()
        if task_id:
            await self._update_task(task_id, "running", 10)
        try:
            system_prompt = self.build_system_prompt(custom_skills)
            user_content = f"CONTEXT:\n{context}\n\nTASK:\n{task}" if context else task
            output_text = await self._call_llm(system_prompt, user_content)
            self.conversation_history.append({"role": "user", "content": task})
            self.conversation_history.append({"role": "assistant", "content": output_text})
            inter_messages = self._parse_inter_messages(output_text)
            message_id = await self._save_message(output_text, "update")
            for msg in inter_messages:
                await self._save_message(msg["content"], msg["type"],
                    to_agent_name=msg.get("to"), to_department=msg.get("to"))
            if task_id:
                await self._update_task(task_id, "completed", 100, output_text)
            await self._update_stats(True)
            self.status = "idle"
            self.current_task = None
            return {
                "success": True, "agent": self.name, "department": self.department,
                "task": task, "output": output_text, "inter_messages": inter_messages,
                "message_id": message_id,
                "duration_seconds": (datetime.utcnow() - started_at).total_seconds(),
                "model": self.LLM,
            }
        except Exception as e:
            self.status = "error"
            if task_id:
                await self._update_task(task_id, "failed", 0, error=str(e))
            return {"success": False, "agent": self.name, "task": task, "output": None, "error": str(e)}

    async def _call_llm(self, system_prompt, user_content):
        if self.LLM == "openai":
            return await self._call_openai(system_prompt, user_content)
        elif self.LLM == "gemini":
            return await self._call_gemini(system_prompt, user_content)
        return await self._call_claude(system_prompt, user_content)

    async def _call_claude(self, system_prompt, user_content):
        import anthropic
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        messages = list(self.conversation_history[-6:])
        messages.append({"role": "user", "content": user_content})
        r = client.messages.create(model=settings.claude_model, max_tokens=2048,
            system=system_prompt, messages=messages)
        return r.content[0].text

    async def _call_openai(self, system_prompt, user_content):
        import httpx
        msgs = [{"role": "system", "content": system_prompt}]
        msgs += list(self.conversation_history[-6:])
        msgs.append({"role": "user", "content": user_content})
        async with httpx.AsyncClient(timeout=60) as c:
            r = await c.post("https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={"model": settings.openai_model, "messages": msgs, "max_tokens": 2048})
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]

    async def _call_gemini(self, system_prompt, user_content):
        import httpx
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent"
        contents = [{"role": "user", "parts": [{"text": f"{system_prompt}\n\n{user_content}"}]}]
        async with httpx.AsyncClient(timeout=60) as c:
            r = await c.post(url, params={"key": settings.gemini_api_key},
                json={"contents": contents, "generationConfig": {"maxOutputTokens": 2048}})
            r.raise_for_status()
            return r.json()["candidates"][0]["content"]["parts"][0]["text"]

    def _parse_inter_messages(self, text):
        messages = []
        for line in text.split("\n"):
            line = line.strip()
            if line.startswith("HANDOFF TO:"):
                parts = line[len("HANDOFF TO:"):].split(":", 1)
                if len(parts) == 2:
                    messages.append({"type": "handoff", "to": parts[0].strip(), "content": parts[1].strip()})
            elif line.startswith("BROADCAST:"):
                messages.append({"type": "broadcast", "to": None, "content": line[len("BROADCAST:"):].strip()})
            elif line.startswith("ALERT TO:"):
                parts = line[len("ALERT TO:"):].split(":", 1)
                if len(parts) == 2:
                    messages.append({"type": "alert", "to": parts[0].strip(), "content": parts[1].strip()})
        return messages

    async def _save_message(self, content, message_type="message",
                             to_agent_name=None, to_department=None, channel="all-departments"):
        try:
            r = self.db.table("agent_messages").insert({
                "user_id": self.user_id, "from_agent_name": self.name,
                "to_agent_name": to_agent_name, "from_department": self.department,
                "to_department": to_department, "channel": channel,
                "message_type": message_type, "content": content,
            }).execute()
            if r.data:
                return r.data[0]["id"]
        except Exception as e:
            print(f"[{self.name}] save_message: {e}")
        return None

    async def _update_task(self, task_id, status, progress, output=None, error=None):
        try:
            data = {"status": status, "progress": progress}
            if status == "running": data["started_at"] = datetime.utcnow().isoformat()
            if status in ("completed", "failed"): data["completed_at"] = datetime.utcnow().isoformat()
            if output: data["output_data"] = {"text": output}
            if error: data["error_message"] = error
            self.db.table("tasks").update(data).eq("id", task_id).execute()
        except Exception as e:
            print(f"[{self.name}] update_task: {e}")

    async def _update_stats(self, success):
        try:
            self.db.table("agents").update({
                "status": self.status, "current_task": self.current_task,
                "last_active_at": datetime.utcnow().isoformat(),
            }).eq("id", self.agent_id).execute()
        except Exception as e:
            print(f"[{self.name}] update_stats: {e}")

    def get_skills(self):
        try:
            r = self.db.table("agent_skills").select("skill").eq("agent_id", self.agent_id).execute()
            if r.data: return [row["skill"] for row in r.data]
        except Exception: pass
        return self.default_skills

    def add_skill(self, skill, added_by="user"):
        try:
            self.db.table("agent_skills").insert({
                "agent_id": self.agent_id, "skill": skill, "is_default": False, "added_by": added_by
            }).execute()
            return True
        except Exception: return False

    def remove_skill(self, skill):
        try:
            self.db.table("agent_skills").delete().eq("agent_id", self.agent_id).eq("skill", skill).execute()
            return True
        except Exception: return False

    def clear_history(self): self.conversation_history = []
    def to_dict(self):
        return {"id": self.agent_id, "name": self.name, "slug": self.slug,
                "department": self.department, "status": self.status,
                "skills": self.get_skills(), "model": self.LLM}
