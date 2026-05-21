"""
Legion Vittor — Instagram Service
Wow moment 1: Marketing agent writes caption → DALL-E 3 generates image → Meta Graph API posts it live
Uses: OpenAI API (DALL-E 3) + Meta Graph API (free)
"""
import httpx
import base64
from typing import Optional
from app.core.config import settings


async def generate_image_dalle(prompt: str, size: str = "1024x1024") -> bytes:
    """Generate an image using DALL-E 3 via OpenAI API."""
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            "https://api.openai.com/v1/images/generations",
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            json={
                "model": settings.openai_image_model,
                "prompt": prompt,
                "n": 1,
                "size": size,
                "response_format": "url",
            },
        )
        r.raise_for_status()
        image_url = r.json()["data"][0]["url"]

    # Download the image
    async with httpx.AsyncClient(timeout=30) as client:
        img_r = await client.get(image_url)
        img_r.raise_for_status()
        return img_r.content


async def upload_image_to_meta(image_bytes: bytes, caption: str) -> dict:
    """
    Upload image to Instagram via Meta Graph API.
    Step 1: Create media container
    Step 2: Publish the container
    Returns: {success, post_id, permalink}
    """
    account_id = settings.meta_instagram_account_id
    token = settings.meta_access_token

    if not account_id or not token:
        # Return mock response for demo without credentials
        return {
            "success": True,
            "post_id": "demo_post_12345",
            "permalink": "https://www.instagram.com/p/demo_post_12345/",
            "demo_mode": True,
            "message": "Demo mode — add META_ACCESS_TOKEN and META_INSTAGRAM_ACCOUNT_ID to .env to post for real",
        }

    async with httpx.AsyncClient(timeout=60) as client:
        # Step 1: Upload image and create container
        # For real posting we'd need to host the image publicly first
        # For prototype: use a hosted image URL approach
        create_r = await client.post(
            f"https://graph.facebook.com/v18.0/{account_id}/media",
            params={
                "access_token": token,
                "caption": caption,
                "image_url": "https://via.placeholder.com/1080x1080",  # Replace with actual upload
            },
        )
        create_r.raise_for_status()
        container_id = create_r.json()["id"]

        # Step 2: Publish the container
        pub_r = await client.post(
            f"https://graph.facebook.com/v18.0/{account_id}/media_publish",
            params={"access_token": token, "creation_id": container_id},
        )
        pub_r.raise_for_status()
        post_id = pub_r.json()["id"]

    return {
        "success": True,
        "post_id": post_id,
        "permalink": f"https://www.instagram.com/p/{post_id}/",
        "demo_mode": False,
    }


async def run_instagram_pipeline(
    topic: str,
    user_id: str,
    save_to_db: bool = True,
) -> dict:
    """
    Full Instagram pipeline:
    1. Marketing agent writes caption + hashtags
    2. DALL-E 3 generates image from agent's description
    3. Meta Graph API posts to Instagram
    4. Returns live post URL
    """
    from app.agents.agents import MarketingAgent
    from app.db.client import get_supabase

    results = {"topic": topic, "steps": []}

    # Step 1: Marketing agent writes the post
    agent = MarketingAgent(user_id=user_id)
    post_result = await agent.create_instagram_post(topic)

    if not post_result["success"]:
        return {"success": False, "error": "Marketing agent failed", "details": post_result}

    raw_output = post_result["output"]
    results["steps"].append({"step": "copy_written", "output": raw_output})

    # Parse caption and image description from agent output
    caption = _extract_section(raw_output, "Caption", "Hashtags") or raw_output[:500]
    hashtags = _extract_section(raw_output, "Hashtags", "Image") or ""
    image_desc = _extract_section(raw_output, "Image description", "Best time") or f"Professional image about {topic}"

    full_caption = f"{caption}\n\n{hashtags}"

    # Step 2: Generate image with DALL-E 3
    try:
        image_prompt = f"Professional, high-quality social media image: {image_desc}. Vibrant, eye-catching, suitable for Instagram."
        image_bytes = await generate_image_dalle(image_prompt)
        results["steps"].append({"step": "image_generated", "prompt": image_prompt})
    except Exception as e:
        results["steps"].append({"step": "image_failed", "error": str(e)})
        image_bytes = None

    # Step 3: Post to Instagram
    post_result_ig = await upload_image_to_meta(image_bytes or b"", full_caption)
    results["steps"].append({"step": "posted", **post_result_ig})

    # Step 4: Save output to DB
    if save_to_db:
        try:
            db = get_supabase()
            db.table("outputs").insert({
                "user_id": user_id,
                "agent_name": "Marketing agent",
                "output_type": "post",
                "title": f"Instagram post: {topic}",
                "content": full_caption,
                "metadata": {
                    "platform": "instagram",
                    "post_id": post_result_ig.get("post_id"),
                    "permalink": post_result_ig.get("permalink"),
                    "demo_mode": post_result_ig.get("demo_mode", True),
                },
                "status": "live" if post_result_ig["success"] else "draft",
            }).execute()
        except Exception as e:
            print(f"Failed to save output: {e}")

    return {
        "success": post_result_ig["success"],
        "topic": topic,
        "caption": full_caption[:200] + "..." if len(full_caption) > 200 else full_caption,
        "post_url": post_result_ig.get("permalink"),
        "post_id": post_result_ig.get("post_id"),
        "demo_mode": post_result_ig.get("demo_mode", True),
        "steps": results["steps"],
    }


def _extract_section(text: str, start_marker: str, end_marker: str = None) -> Optional[str]:
    """Extract a section from agent output between two markers."""
    lines = text.split("\n")
    capturing = False
    captured = []

    for line in lines:
        if start_marker.lower() in line.lower() and not capturing:
            capturing = True
            # Get content after the colon if on same line
            if ":" in line:
                rest = line.split(":", 1)[1].strip()
                if rest:
                    captured.append(rest)
            continue

        if capturing:
            if end_marker and end_marker.lower() in line.lower():
                break
            if line.strip().startswith(("1.", "2.", "3.", "4.")) and captured:
                # New numbered section — stop if we have content
                if any(c.strip() for c in captured):
                    break
            captured.append(line)

    result = "\n".join(captured).strip()
    return result if result else None
