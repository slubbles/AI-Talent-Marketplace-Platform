from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_generate_role_description_for_engineer() -> None:
    response = client.post(
        "/generate-role-description",
        json={
            "raw_description": "We need a senior backend engineer to build API infrastructure, improve platform reliability, and ship recruiter-facing marketplace features.",
            "skills": ["Python", "FastAPI", "PostgreSQL"],
            "location": "Remote",
            "company_industry": "AI SaaS",
        },
    )

    payload = response.json()
    assert response.status_code == 200
    assert payload["experience_level"] == "SENIOR"
    assert "Engineer" in payload["title"]
    assert payload["salary_band"]["min"] < payload["salary_band"]["max"]
    assert len(payload["responsibilities"]) >= 4


def test_generate_role_description_for_designer() -> None:
    response = client.post(
        "/generate-role-description",
        json={
            "raw_description": "Product designer needed to improve recruiter workflows, user journeys, and mobile-first UX quality across our platform.",
            "skills": ["Figma", "User Research"],
            "location": "Dubai",
        },
    )

    payload = response.json()
    assert response.status_code == 200
    assert payload["title"] == "Product Designer"
    assert "Figma" in payload["recommended_skills"]


def test_generate_role_description_for_product_manager() -> None:
    response = client.post(
        "/generate-role-description",
        json={
            "raw_description": "Looking for a product manager to own roadmap prioritization, stakeholder alignment, discovery, and analytics for a B2B marketplace.",
            "skills": ["Roadmapping", "Analytics"],
            "company_name": "SaaS King Ventures",
        },
    )

    payload = response.json()
    assert response.status_code == 200
    assert payload["title"] == "Product Manager"
    assert payload["generation_mode"] in {"heuristic", "llm"}
    assert any("roadmap" in item.lower() for item in payload["responsibilities"])


def test_generate_role_description_for_data_scientist() -> None:
    response = client.post(
        "/generate-role-description",
        json={
            "raw_description": "We want a machine learning and analytics specialist to build ranking models, experiments, and marketplace intelligence.",
            "skills": ["Python", "Machine Learning", "SQL"],
            "location": "London",
        },
    )

    payload = response.json()
    assert response.status_code == 200
    assert payload["title"] == "Data Scientist"
    assert payload["salary_band"]["min"] >= 100


def test_generate_role_description_for_executive() -> None:
    response = client.post(
        "/generate-role-description",
        json={
            "raw_description": "We need a head of product and engineering to lead cross-functional execution, scale teams, and partner with founders on strategy.",
            "skills": ["Leadership", "Strategy", "Org Design"],
            "location": "New York",
        },
    )

    payload = response.json()
    assert response.status_code == 200
    assert payload["experience_level"] in {"LEAD", "EXECUTIVE"}
    assert payload["salary_band"]["max"] > 250
    assert "Responsibilities:" in payload["enhanced_description"]