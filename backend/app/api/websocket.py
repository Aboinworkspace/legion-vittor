"""
Legion Vittor — WebSocket Route
Powers the live office real-time agent communication feed.
Every agent message is pushed instantly to all connected clients.
"""

import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional
from app.db.client import get_supabase
from app.core.config import settings

router = APIRouter()


class ConnectionManager:
    """Manages all active WebSocket connections per user."""

    def __init__(self):
        # user_id → list of active websockets
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to all connections for a user."""
        if user_id in self.active_connections:
            dead = []
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.active_connections[user_id].remove(ws)

    async def broadcast(self, message: dict):
        """Send to all connected users."""
        for user_id in list(self.active_connections.keys()):
            await self.send_to_user(user_id, message)


manager = ConnectionManager()


@router.websocket("/office/{user_id}")
async def websocket_office(
    websocket: WebSocket,
    user_id: str,
    token: Optional[str] = Query(None),
    channel: Optional[str] = Query("all-departments"),
):
    """
    WebSocket endpoint for the live office.
    Client connects here to receive all real-time agent messages.
    Also accepts messages from the user to relay to agents.
    """
    await manager.connect(websocket, user_id)

    # Send welcome message
    await websocket.send_json({
        "type": "connected",
        "data": {
            "message": "Connected to Legion Vittor Virtual Office",
            "user_id": user_id,
            "channel": channel,
        }
    })

    # Send recent messages on connect (last 20)
    recent = await _get_recent_messages(user_id, channel)
    if recent:
        await websocket.send_json({
            "type": "history",
            "data": recent,
        })

    # Start Redis subscription for this user
    redis_task = asyncio.create_task(
        _subscribe_redis(websocket, user_id)
    )

    try:
        while True:
            # Listen for messages from the user
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
                msg_type = msg.get("type")

                if msg_type == "user_message":
                    # User typed a message in the live office — relay to agents
                    await _handle_user_message(
                        user_id=user_id,
                        content=msg.get("content", ""),
                        channel=msg.get("channel", "all-departments"),
                        target_agent=msg.get("target_agent"),
                    )

                elif msg_type == "ping":
                    await websocket.send_json({"type": "pong"})

            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        redis_task.cancel()


async def _subscribe_redis(websocket: WebSocket, user_id: str):
    """
    Subscribe to Redis pub/sub for this user's channel.
    Forwards all agent messages to the WebSocket.
    """
    try:
        # Upstash Redis doesn't support pub/sub via HTTP — we poll instead
        # In production, use Upstash's Redis REST for pub/sub or Supabase Realtime
        from app.db.client import get_supabase
        db = get_supabase()

        last_id = None
        while True:
            await asyncio.sleep(0.5)  # Poll every 500ms

            query = db.table("agent_messages").select("*").eq(
                "user_id", user_id
            ).order("created_at", desc=True).limit(1)

            if last_id:
                # Only fetch newer messages
                pass

            result = query.execute()
            if result.data:
                latest = result.data[0]
                if latest["id"] != last_id:
                    last_id = latest["id"]
                    try:
                        await websocket.send_json({
                            "type": "agent_message",
                            "data": latest,
                        })
                    except Exception:
                        break

    except asyncio.CancelledError:
        pass
    except Exception as e:
        print(f"Redis subscription error: {e}")


async def _handle_user_message(
    user_id: str,
    content: str,
    channel: str,
    target_agent: Optional[str] = None,
):
    """
    Handle a message from the user in the live office.
    Saves it to DB and routes to relevant agent.
    """
    db = get_supabase()

    # Save user message
    db.table("agent_messages").insert({
        "user_id": user_id,
        "from_agent_name": "You (owner)",
        "to_agent_name": target_agent,
        "from_department": "Owner",
        "channel": channel,
        "message_type": "message",
        "content": content,
        "is_user_message": True,
        "priority": "high",
    }).execute()

    # Route to target agent if specified
    if target_agent:
        try:
            from app.agents.orchestrator import Orchestrator
            orchestrator = Orchestrator(user_id=user_id)
            agent_slug = target_agent.lower().replace(" ", "_")
            await orchestrator.message_agent(agent_slug, content)
        except Exception as e:
            print(f"Failed to route to agent {target_agent}: {e}")
    else:
        # Route through full pipeline
        try:
            from app.agents.orchestrator import Orchestrator
            orchestrator = Orchestrator(user_id=user_id)
            asyncio.create_task(orchestrator.process(content))
        except Exception as e:
            print(f"Failed to process message: {e}")


async def _get_recent_messages(user_id: str, channel: str, limit: int = 20) -> list:
    """Fetch recent messages for a channel from Supabase."""
    try:
        db = get_supabase()
        result = db.table("agent_messages").select("*").eq(
            "user_id", user_id
        ).eq("channel", channel).order(
            "created_at", desc=True
        ).limit(limit).execute()

        if result.data:
            return list(reversed(result.data))
    except Exception as e:
        print(f"Failed to fetch recent messages: {e}")
    return []


async def broadcast_to_user(user_id: str, message: dict):
    """Public function for agents to broadcast messages to the live office."""
    await manager.send_to_user(user_id, message)
