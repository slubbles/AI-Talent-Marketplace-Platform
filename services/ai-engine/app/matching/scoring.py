from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from app.models import MatchCandidate, ScoreBreakdown


SENIORITY_ORDER = {
    "JUNIOR": 0,
    "MID": 1,
    "SENIOR": 2,
    "LEAD": 3,
    "EXECUTIVE": 4,
}

AVAILABILITY_DAYS = {
    "IMMEDIATE": 0,
    "TWO_WEEKS": 14,
    "ONE_MONTH": 30,
    "THREE_MONTHS": 90,
    "NOT_AVAILABLE": 365,
}


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def _parse_date(value: Any) -> date | None:
    if value is None:
        return None
    if isinstance(value, date):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        try:
            return date.fromisoformat(value[:10])
        except ValueError:
            return None
    return None


def experience_fit(profile: dict[str, Any], demand: dict[str, Any]) -> float:
    profile_rank = SENIORITY_ORDER.get(profile.get("seniorityLevel"), 0)
    demand_rank = SENIORITY_ORDER.get(demand.get("experienceLevel"), 0)
    delta = abs(profile_rank - demand_rank)
    return max(20.0, 100.0 - (delta * 25.0))


def availability_fit(profile: dict[str, Any], demand: dict[str, Any]) -> float:
    availability = profile.get("availability")
    available_in_days = AVAILABILITY_DAYS.get(availability, 60)
    start_date = _parse_date(demand.get("startDate"))
    available_from = _parse_date(profile.get("availableFrom"))

    if availability == "NOT_AVAILABLE":
        return 10.0

    if not start_date:
        return max(40.0, 100.0 - (available_in_days * 0.5))

    days_until_start = max(0, (start_date - date.today()).days)
    if available_from and available_from <= start_date:
        return 100.0
    if available_in_days <= days_until_start:
        return 95.0
    return max(15.0, 100.0 - ((available_in_days - days_until_start) * 2.5))


def pricing_fit(profile: dict[str, Any], demand: dict[str, Any]) -> float:
    profile_min = _to_float(profile.get("hourlyRateMin"))
    profile_max = _to_float(profile.get("hourlyRateMax"))
    budget_min = _to_float(demand.get("budgetMin"))
    budget_max = _to_float(demand.get("budgetMax"))

    if profile_min is None or profile_max is None or budget_min is None or budget_max is None:
        return 65.0

    overlap = max(0.0, min(profile_max, budget_max) - max(profile_min, budget_min))
    total_range = max(profile_max, budget_max) - min(profile_min, budget_min)
    if total_range == 0:
        return 100.0
    if overlap > 0:
        return min(100.0, (overlap / total_range) * 100 + 35)
    gap = max(profile_min - budget_max, budget_min - profile_max, 0)
    return max(5.0, 70.0 - (gap * 2.5))


def location_fit(profile: dict[str, Any], demand: dict[str, Any]) -> float:
    remote_policy = demand.get("remotePolicy")
    demand_location = (demand.get("location") or "").lower()
    preferences = [str(value).lower() for value in profile.get("locationPreferences") or []]

    if remote_policy == "REMOTE" and "remote" in preferences:
        return 100.0
    if demand_location and demand_location in preferences:
        return 95.0
    if remote_policy == "REMOTE":
        return 80.0
    return 45.0


def cultural_fit(profile: dict[str, Any], demand: dict[str, Any]) -> float:
    cultural_values = profile.get("culturalValues") or {}
    if not cultural_values:
        return 70.0

    cultural_text = " ".join(str(value).lower() for value in cultural_values.values())
    demand_text = " ".join(
        str(value).lower()
        for value in [
            demand.get("description"),
            demand.get("aiGeneratedDescription"),
            demand.get("projectRequirements"),
            demand.get("companyIndustry"),
        ]
        if value
    )
    overlap = {word for word in cultural_text.split() if len(word) > 3 and word in demand_text}
    return min(100.0, 65.0 + (len(overlap) * 12.0))


def feedback_score(profile: dict[str, Any]) -> float:
    average = _to_float(profile.get("averageRating"))
    count = int(profile.get("feedbackCount") or 0)
    if not average or count == 0:
        return 70.0
    return max(40.0, min(100.0, (average / 5.0) * 100.0))


def overlapping_skills(profile: dict[str, Any], demand: dict[str, Any]) -> list[str]:
    profile_skill_names = {
        skill.get("displayName") or skill.get("name")
        for skill in profile.get("skills") or []
    }
    demand_skill_names = {
        skill.get("displayName") or skill.get("name")
        for skill in demand.get("requiredSkills") or []
    }
    return sorted(name for name in profile_skill_names.intersection(demand_skill_names) if name)


def build_explanation(profile: dict[str, Any], demand: dict[str, Any], breakdown: ScoreBreakdown) -> str:
    skill_overlap = overlapping_skills(profile, demand)
    strengths = [
        ("skill alignment", breakdown.skill_match),
        ("experience fit", breakdown.experience_fit),
        ("availability", breakdown.availability_fit),
        ("pricing", breakdown.pricing_fit),
        ("location", breakdown.location_fit),
        ("cultural fit", breakdown.cultural_fit),
        ("feedback", breakdown.feedback_score),
    ]
    strengths.sort(key=lambda item: item[1], reverse=True)
    top_reasons = ", ".join(name for name, _ in strengths[:3])
    overlap_phrase = f" Overlapping skills: {', '.join(skill_overlap[:4])}." if skill_overlap else ""
    return (
        f"{profile.get('firstName')} {profile.get('lastName')} is a strong match for {demand.get('title')} due to {top_reasons}."
        f"{overlap_phrase}"
    )


def build_match_candidate(
    profile: dict[str, Any],
    demand: dict[str, Any],
    similarity_score: float,
) -> MatchCandidate:
    breakdown = ScoreBreakdown(
        skill_match=max(0.0, min(100.0, similarity_score)),
        experience_fit=experience_fit(profile, demand),
        availability_fit=availability_fit(profile, demand),
        pricing_fit=pricing_fit(profile, demand),
        location_fit=location_fit(profile, demand),
        cultural_fit=cultural_fit(profile, demand),
        feedback_score=feedback_score(profile),
    )

    weighted_score = (
        breakdown.skill_match * 0.35
        + breakdown.experience_fit * 0.20
        + breakdown.availability_fit * 0.10
        + breakdown.pricing_fit * 0.10
        + breakdown.location_fit * 0.10
        + breakdown.cultural_fit * 0.10
        + breakdown.feedback_score * 0.05
    )

    return MatchCandidate(
        talent_profile_id=str(profile["id"]),
        match_score=round(weighted_score, 2),
        breakdown=breakdown,
        explanation=build_explanation(profile, demand, breakdown),
    )