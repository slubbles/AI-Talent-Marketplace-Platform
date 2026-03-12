from __future__ import annotations

from app.assistant.heuristics import generate_role_description_heuristic
from app.assistant.llm_client import generate_role_description_with_openrouter, openrouter_enabled
from app.models import RoleDescriptionRequest, RoleDescriptionResponse


async def generate_role_description(input: RoleDescriptionRequest) -> RoleDescriptionResponse:
    if not input.raw_description.strip():
        raise ValueError("Raw role description was empty.")

    if not openrouter_enabled():
        return generate_role_description_heuristic(input)

    try:
        return await generate_role_description_with_openrouter(input)
    except Exception:
        return generate_role_description_heuristic(input)