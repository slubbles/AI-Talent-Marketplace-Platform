from __future__ import annotations

from app.matching.embedding import EMBEDDING_DIMENSIONS, generate_embedding
from app.matching.scoring import build_match_candidate


async def _embedding_for(text: str) -> list[float]:
    embedding, _ = await generate_embedding(text, "profile")
    return embedding


def test_generate_embedding_returns_expected_dimensions() -> None:
    import asyncio

    embedding = asyncio.run(_embedding_for("Python FastAPI GraphQL talent marketplace"))
    assert len(embedding) == EMBEDDING_DIMENSIONS
    assert any(value != 0 for value in embedding)


def test_match_scoring_prefers_stronger_profile() -> None:
    demand = {
        "id": "demand-1",
        "title": "Senior AI Engineer",
        "description": "Build NLP extraction and ranking systems.",
        "aiGeneratedDescription": "Lead FastAPI and machine learning delivery.",
        "experienceLevel": "SENIOR",
        "remotePolicy": "REMOTE",
        "location": "Remote",
        "budgetMin": 65,
        "budgetMax": 95,
        "projectRequirements": "Python, NLP, Docker",
        "companyIndustry": "AI SaaS",
        "requiredSkills": [
            {"name": "python", "displayName": "Python"},
            {"name": "machine-learning", "displayName": "Machine Learning"},
            {"name": "fastapi", "displayName": "FastAPI"},
        ],
    }

    strong_profile = {
        "id": "talent-1",
        "firstName": "Amina",
        "lastName": "Khaled",
        "seniorityLevel": "SENIOR",
        "availability": "IMMEDIATE",
        "hourlyRateMin": 70,
        "hourlyRateMax": 88,
        "locationPreferences": ["Remote", "Dubai"],
        "culturalValues": {"workStyle": "async-first", "team": "small cross-functional"},
        "averageRating": 4.8,
        "feedbackCount": 3,
        "skills": [
            {"name": "python", "displayName": "Python"},
            {"name": "machine-learning", "displayName": "Machine Learning"},
            {"name": "fastapi", "displayName": "FastAPI"},
        ],
        "experiences": [],
    }

    weaker_profile = {
        "id": "talent-2",
        "firstName": "Chris",
        "lastName": "Young",
        "seniorityLevel": "MID",
        "availability": "THREE_MONTHS",
        "hourlyRateMin": 110,
        "hourlyRateMax": 135,
        "locationPreferences": ["Onsite"],
        "culturalValues": {},
        "averageRating": 0,
        "feedbackCount": 0,
        "skills": [{"name": "javascript", "displayName": "JavaScript"}],
        "experiences": [],
    }

    strong_match = build_match_candidate(strong_profile, demand, 94.0)
    weak_match = build_match_candidate(weaker_profile, demand, 48.0)

    assert strong_match.match_score > weak_match.match_score
    assert strong_match.breakdown.skill_match > weak_match.breakdown.skill_match
    assert "Senior AI Engineer" in strong_match.explanation