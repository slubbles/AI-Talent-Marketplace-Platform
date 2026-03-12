from __future__ import annotations

import json
import os

import httpx

from app.models import RoleDescriptionRequest, RoleDescriptionResponse


def openrouter_enabled() -> bool:
    api_key = os.getenv("OPENROUTER_API_KEY")
    return bool(api_key and api_key != "change-me")


def _prompt_for_role_description(input: RoleDescriptionRequest) -> str:
    skill_text = ", ".join(input.skills) if input.skills else "None provided"
    return (
        "You are generating a polished role description for a recruiter. "
        "Return valid JSON only with these keys: title, summary, responsibilities, requirements, "
        "nice_to_haves, recommended_skills, salary_band, experience_level, enhanced_description. "
        "salary_band must contain min, max, currency, rationale. responsibilities, requirements, "
        "nice_to_haves, recommended_skills must be arrays of strings. experience_level must be one of "
        "JUNIOR, MID, SENIOR, LEAD, EXECUTIVE. Use concise, production-ready recruiting language.\n\n"
        f"Raw description:\n{input.raw_description}\n\n"
        f"Existing skills: {skill_text}\n"
        f"Location: {input.location or 'Not specified'}\n"
        f"Company name: {input.company_name or 'Not specified'}\n"
        f"Company industry: {input.company_industry or 'Not specified'}\n"
    )


async def generate_role_description_with_openrouter(input: RoleDescriptionRequest) -> RoleDescriptionResponse:
    base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    model = os.getenv("OPENROUTER_MODEL", "gpt-4o-mini")
    headers = {
        "Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You generate structured role descriptions and return JSON only.",
            },
            {"role": "user", "content": _prompt_for_role_description(input)},
        ],
        "temperature": 0.2,
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
        response.raise_for_status()

    content = response.json()["choices"][0]["message"]["content"]
    data = json.loads(content)
    data["generation_mode"] = "llm"
    return RoleDescriptionResponse.model_validate(data)