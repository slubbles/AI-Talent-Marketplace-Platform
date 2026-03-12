from __future__ import annotations

import asyncio
from typing import Any

from app.matching.db import (
    fetch_demand,
    fetch_skills_without_embeddings,
    fetch_talent_profiles,
    search_profiles_by_embedding,
    update_embedding,
)
from app.matching.embedding import EMBEDDING_DIMENSIONS, generate_embedding
from app.matching.scoring import build_match_candidate
from app.models import MatchCandidate, MatchCandidatesResponse, SemanticSearchResponse, SemanticSearchResult


def _demand_text(demand: dict[str, Any]) -> str:
    skill_names = ", ".join(
        str(skill.get("displayName") or skill.get("name"))
        for skill in demand.get("requiredSkills") or []
    )
    return "\n".join(
        value
        for value in [
            demand.get("title"),
            demand.get("aiGeneratedDescription"),
            demand.get("description"),
            skill_names,
            str(demand.get("experienceLevel") or ""),
            str(demand.get("remotePolicy") or ""),
            demand.get("location"),
            demand.get("projectRequirements"),
            demand.get("companyIndustry"),
        ]
        if value
    )


def _profile_text(profile: dict[str, Any]) -> str:
    skills = ", ".join(
        str(skill.get("displayName") or skill.get("name"))
        for skill in profile.get("skills") or []
    )
    experiences = "\n".join(
        " ".join(
            str(value)
            for value in [experience.get("title"), experience.get("companyName"), experience.get("description")]
            if value
        )
        for experience in profile.get("experiences") or []
    )
    return "\n".join(
        value
        for value in [
            f"{profile.get('firstName', '')} {profile.get('lastName', '')}".strip(),
            profile.get("headline"),
            profile.get("summary"),
            skills,
            experiences,
            profile.get("careerTrajectory"),
            " ".join(profile.get("industries") or []),
        ]
        if value
    )


async def _ensure_skill_embeddings() -> None:
    skills = await asyncio.to_thread(fetch_skills_without_embeddings)
    for skill in skills:
        text = " ".join(value for value in [skill.get("displayName"), skill.get("name")] if value)
        embedding, _ = await generate_embedding(text, "skill")
        await asyncio.to_thread(update_embedding, "skill", skill["id"], embedding)


async def _ensure_profile_embeddings(profiles: list[dict[str, Any]]) -> None:
    for profile in profiles:
        if profile.get("profileEmbedding"):
            continue
        embedding, _ = await generate_embedding(_profile_text(profile), "profile")
        await asyncio.to_thread(update_embedding, "profile", profile["id"], embedding)
        profile["profileEmbedding"] = embedding


async def _ensure_demand_embedding(demand: dict[str, Any]) -> list[float]:
    embedding, _ = await generate_embedding(_demand_text(demand), "demand")
    await asyncio.to_thread(update_embedding, "demand", demand["id"], embedding)
    return embedding


async def match_candidates_for_demand(demand_id: str, limit: int) -> MatchCandidatesResponse:
    demand = await asyncio.to_thread(fetch_demand, demand_id)
    if not demand:
        raise ValueError("Demand not found.")

    profiles = await asyncio.to_thread(fetch_talent_profiles)
    if not profiles:
        return MatchCandidatesResponse(demand_id=demand_id, matches=[])

    await _ensure_skill_embeddings()
    await _ensure_profile_embeddings(profiles)
    demand_embedding = await _ensure_demand_embedding(demand)

    vector_hits = await asyncio.to_thread(search_profiles_by_embedding, demand_embedding, max(limit * 3, limit))
    similarity_by_profile = {
        hit["talentProfileId"]: float(hit["similarity"] or 0.0)
        for hit in vector_hits
    }

    ordered_matches: list[MatchCandidate] = []
    for profile in profiles:
        similarity = similarity_by_profile.get(profile["id"])
        if similarity is None:
            continue
        ordered_matches.append(build_match_candidate(profile, demand, similarity))

    ordered_matches.sort(key=lambda match: match.match_score, reverse=True)
    return MatchCandidatesResponse(demand_id=demand_id, matches=ordered_matches[:limit])


def _passes_filters(profile: dict[str, Any], filters: dict[str, object]) -> bool:
    if not filters:
        return True

    seniority = filters.get("seniorityLevel")
    if seniority and profile.get("seniorityLevel") != seniority:
        return False

    availability = filters.get("availability")
    if availability and profile.get("availability") != availability:
        return False

    location = str(filters.get("location") or "").lower()
    if location:
        preferences = [str(value).lower() for value in profile.get("locationPreferences") or []]
        if location not in preferences:
            return False

    requested_skills = {str(skill).lower() for skill in filters.get("skills", [])} if isinstance(filters.get("skills"), list) else set()
    if requested_skills:
        profile_skills = {
            str(skill.get("name") or "").lower()
            for skill in profile.get("skills") or []
        }
        if not requested_skills.issubset(profile_skills):
            return False

    return True


async def semantic_search_profiles(query: str, filters: dict[str, object], limit: int) -> SemanticSearchResponse:
    if not query.strip():
        raise ValueError("Search query was empty.")

    profiles = await asyncio.to_thread(fetch_talent_profiles)
    if not profiles:
        return SemanticSearchResponse(query=query, results=[])

    await _ensure_profile_embeddings(profiles)
    query_embedding, _ = await generate_embedding(query, "profile")
    hits = await asyncio.to_thread(search_profiles_by_embedding, query_embedding, max(limit * 4, limit))
    by_id = {profile["id"]: profile for profile in profiles}

    results: list[SemanticSearchResult] = []
    for hit in hits:
        profile = by_id.get(hit["talentProfileId"])
        if not profile or not _passes_filters(profile, filters):
            continue
        results.append(
            SemanticSearchResult(
                talent_profile_id=str(profile["id"]),
                relevance_score=round(float(hit["similarity"] or 0.0), 2),
                headline=profile.get("headline"),
                summary=profile.get("summary"),
            )
        )
        if len(results) >= limit:
            break

    return SemanticSearchResponse(query=query, results=results)