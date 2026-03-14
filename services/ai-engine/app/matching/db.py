from __future__ import annotations

import os
from typing import Any

import psycopg
from psycopg.rows import dict_row


def _database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL environment variable is required.")
    return url.replace("@localhost:", "@127.0.0.1:")


def vector_literal(values: list[float]) -> str:
    return "[" + ",".join(f"{value:.8f}" for value in values) + "]"


def fetch_demand(demand_id: str) -> dict[str, Any] | None:
    query = '''
        SELECT
            d."id",
            d."title",
            d."description",
            d."aiGeneratedDescription",
            d."experienceLevel",
            d."location",
            d."remotePolicy",
            d."startDate",
            d."budgetMin",
            d."budgetMax",
            d."projectRequirements",
            d."demandEmbedding"::text AS "demandEmbedding",
            c."name" AS "companyName",
            c."industry" AS "companyIndustry",
            COALESCE(
                json_agg(
                    json_build_object(
                        'name', s."name",
                        'displayName', s."displayName",
                        'minimumYears', ds."minimumYears",
                        'isRequired', ds."isRequired"
                    )
                ) FILTER (WHERE s."id" IS NOT NULL),
                '[]'::json
            ) AS "requiredSkills"
        FROM "Demand" d
        JOIN "Company" c ON c."id" = d."companyId"
        LEFT JOIN "DemandSkill" ds ON ds."demandId" = d."id"
        LEFT JOIN "Skill" s ON s."id" = ds."skillId"
        WHERE d."id" = %(demand_id)s
        GROUP BY d."id", c."name", c."industry"
    '''

    with psycopg.connect(_database_url(), row_factory=dict_row) as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, {"demand_id": demand_id})
            return cursor.fetchone()


def fetch_talent_profiles(profile_ids: list[str] | None = None) -> list[dict[str, Any]]:
    clauses = []
    params: dict[str, Any] = {}
    if profile_ids:
        clauses.append('tp."id" = ANY(%(profile_ids)s)')
        params["profile_ids"] = profile_ids

    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    query = f'''
        SELECT
            tp."id",
            tp."firstName",
            tp."lastName",
            tp."headline",
            tp."summary",
            tp."industries",
            tp."seniorityLevel",
            tp."careerTrajectory",
            tp."availability",
            tp."availableFrom",
            tp."hourlyRateMin",
            tp."hourlyRateMax",
            tp."locationPreferences",
            tp."workVisaEligibility",
            tp."culturalValues",
            tp."profileEmbedding"::text AS "profileEmbedding",
            COALESCE(sk.skills, '[]'::json) AS skills,
            COALESCE(exp.experiences, '[]'::json) AS experiences,
            COALESCE(feedback."averageRating", 0) AS "averageRating",
            COALESCE(feedback."feedbackCount", 0) AS "feedbackCount"
        FROM "TalentProfile" tp
        LEFT JOIN LATERAL (
            SELECT json_agg(
                json_build_object(
                    'name', s."name",
                    'displayName', s."displayName",
                    'yearsOfExperience', ts."yearsOfExperience",
                    'proficiency', ts."proficiency"
                )
            ) AS skills
            FROM "TalentSkill" ts
            JOIN "Skill" s ON s."id" = ts."skillId"
            WHERE ts."talentProfileId" = tp."id"
        ) sk ON TRUE
        LEFT JOIN LATERAL (
            SELECT json_agg(
                json_build_object(
                    'title', e."title",
                    'companyName', e."companyName",
                    'description', e."description",
                    'startDate', e."startDate",
                    'endDate', e."endDate"
                )
            ) AS experiences
            FROM "Experience" e
            WHERE e."talentProfileId" = tp."id"
        ) exp ON TRUE
        LEFT JOIN LATERAL (
            SELECT AVG(pf."rating")::float AS "averageRating", COUNT(*)::int AS "feedbackCount"
            FROM "PlacementFeedback" pf
            WHERE pf."talentProfileId" = tp."id"
        ) feedback ON TRUE
        {where_sql}
    '''

    with psycopg.connect(_database_url(), row_factory=dict_row) as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            return list(cursor.fetchall())


def fetch_skills_without_embeddings() -> list[dict[str, Any]]:
    query = '''
        SELECT "id", "name", "displayName", "embedding"::text AS "embedding"
        FROM "Skill"
        WHERE "embedding" IS NULL
    '''
    with psycopg.connect(_database_url(), row_factory=dict_row) as connection:
        with connection.cursor() as cursor:
            cursor.execute(query)
            return list(cursor.fetchall())


def update_embedding(entity_type: str, entity_id: str, embedding: list[float]) -> None:
    vector = vector_literal(embedding)
    statements = {
        "profile": 'UPDATE "TalentProfile" SET "profileEmbedding" = %(embedding)s::vector WHERE "id" = %(entity_id)s',
        "demand": 'UPDATE "Demand" SET "demandEmbedding" = %(embedding)s::vector WHERE "id" = %(entity_id)s',
        "skill": 'UPDATE "Skill" SET "embedding" = %(embedding)s::vector WHERE "id" = %(entity_id)s',
    }

    statement = statements.get(entity_type)
    if not statement:
        raise ValueError(f"Unsupported entity type for embeddings: {entity_type}")

    with psycopg.connect(_database_url()) as connection:
        with connection.cursor() as cursor:
            cursor.execute(statement, {"embedding": vector, "entity_id": entity_id})
        connection.commit()


def search_profiles_by_embedding(embedding: list[float], limit: int) -> list[dict[str, Any]]:
    vector = vector_literal(embedding)
    query = '''
        SELECT
            tp."id" AS "talentProfileId",
            (1 - (tp."profileEmbedding" <=> %(embedding)s::vector)) * 100 AS "similarity"
        FROM "TalentProfile" tp
        WHERE tp."profileEmbedding" IS NOT NULL
        ORDER BY tp."profileEmbedding" <=> %(embedding)s::vector
        LIMIT %(limit)s
    '''

    with psycopg.connect(_database_url(), row_factory=dict_row) as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, {"embedding": vector, "limit": limit})
            return list(cursor.fetchall())