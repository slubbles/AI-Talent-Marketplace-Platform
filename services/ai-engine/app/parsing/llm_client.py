from __future__ import annotations

import json
import os

import httpx

from app.models import ParsedResume


def openrouter_enabled() -> bool:
    api_key = os.getenv("OPENROUTER_API_KEY")
    return bool(api_key and api_key != "change-me")


def _prompt_for_resume(text: str) -> str:
    return (
        "Extract structured resume data into JSON with these keys: "
        "full_name, email, phone, location, headline, summary, skills, experience, "
        "certifications, education, industries, seniority_level, career_trajectory. "
        "For skills, return items with name, display_name, proficiency. "
        "For experience, return role, company, start_date, end_date, description. "
        "For education, return institution, degree, field_of_study, start_date, end_date. "
        "Use uppercase enum values for seniority_level: JUNIOR, MID, SENIOR, LEAD, EXECUTIVE. "
        "Return JSON only. Resume text follows:\n\n"
        f"{text}"
    )


async def parse_resume_with_openrouter(text: str, source_type: str) -> ParsedResume:
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
                "content": "You extract resume data into valid JSON only.",
            },
            {"role": "user", "content": _prompt_for_resume(text)},
        ],
        "temperature": 0.1,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
        response.raise_for_status()

    content = response.json()["choices"][0]["message"]["content"]
    llm_data = json.loads(content)
    llm_data["parser_mode"] = "llm"
    llm_data["source_type"] = source_type
    llm_data["extracted_text_preview"] = text[:280]
    return ParsedResume.model_validate(llm_data)