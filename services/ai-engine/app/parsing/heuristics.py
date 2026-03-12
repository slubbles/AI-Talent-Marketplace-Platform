from __future__ import annotations

import re

from app.models import (
    ParsedCertification,
    ParsedEducation,
    ParsedExperience,
    ParsedResume,
    ParsedSkill,
)


SECTION_KEYS = {
    "summary": "summary",
    "profile": "summary",
    "skills": "skills",
    "experience": "experience",
    "work experience": "experience",
    "professional experience": "experience",
    "education": "education",
    "certifications": "certifications",
    "certification": "certifications",
}

SKILL_ALIASES = {
    "js": "javascript",
    "ts": "typescript",
    "react.js": "react",
    "reactjs": "react",
    "node": "node.js",
    "nodejs": "node.js",
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "ml": "machine learning",
    "nlp": "natural language processing",
    "rn": "react native",
}

KNOWN_SKILLS = {
    "python": "Python",
    "typescript": "TypeScript",
    "javascript": "JavaScript",
    "react": "React",
    "next.js": "Next.js",
    "node.js": "Node.js",
    "graphql": "GraphQL",
    "postgresql": "PostgreSQL",
    "prisma": "Prisma",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "machine learning": "Machine Learning",
    "natural language processing": "Natural Language Processing",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "terraform": "Terraform",
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "Google Cloud",
    "react native": "React Native",
    "expo": "Expo",
    "figma": "Figma",
    "airflow": "Apache Airflow",
    "dbt": "dbt",
    "snowflake": "Snowflake",
    "playwright": "Playwright",
    "cypress": "Cypress",
    "communication": "Communication",
    "leadership": "Leadership",
}

INDUSTRY_KEYWORDS = {
    "fintech": "FinTech",
    "health": "HealthTech",
    "healthtech": "HealthTech",
    "e-commerce": "E-commerce",
    "ecommerce": "E-commerce",
    "saas": "SaaS",
    "marketplace": "Marketplaces",
    "logistics": "Logistics",
    "ai": "AI SaaS",
    "recruit": "Recruitment",
    "education": "Education",
}

EMAIL_PATTERN = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.IGNORECASE)
PHONE_PATTERN = re.compile(r"(?:\+?\d[\d\s().-]{7,}\d)")
DATE_RANGE_PATTERN = re.compile(
    r"(?P<start>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})[A-Za-z\s]*\d{0,4})\s*(?:-|to|–)\s*(?P<end>Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})[A-Za-z\s]*\d{0,4})",
    re.IGNORECASE,
)
YEARS_PATTERN = re.compile(r"(\d+)\+?\s+years")


def _clean_line(line: str) -> str:
    return re.sub(r"\s+", " ", line).strip(" -\t")


def split_sections(text: str) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {"header": []}
    current_section = "header"

    for raw_line in text.splitlines():
        line = _clean_line(raw_line)
        if not line:
            continue

        normalized = line.lower().rstrip(":")
        current_section = SECTION_KEYS.get(normalized, current_section)
        sections.setdefault(current_section, [])

        if SECTION_KEYS.get(normalized):
            continue

        sections[current_section].append(line)

    return sections


def normalize_skill(raw_skill: str) -> str:
    normalized = raw_skill.strip().lower()
    normalized = SKILL_ALIASES.get(normalized, normalized)
    return normalized


def extract_skills(text: str, skill_lines: list[str]) -> list[ParsedSkill]:
    discovered: dict[str, ParsedSkill] = {}

    for line in skill_lines:
        for token in re.split(r"[,|/]", line):
            skill_name = normalize_skill(token)
            display_name = KNOWN_SKILLS.get(skill_name)
            if not display_name:
                continue
            discovered[skill_name] = ParsedSkill(
                name=skill_name.replace(".", "-"),
                display_name=display_name,
                proficiency="ADVANCED",
            )

    lower_text = text.lower()
    for skill_name, display_name in KNOWN_SKILLS.items():
        if skill_name in lower_text and skill_name not in discovered:
            discovered[skill_name] = ParsedSkill(
                name=skill_name.replace(".", "-"),
                display_name=display_name,
                proficiency="INTERMEDIATE",
            )

    return list(discovered.values())


def extract_experience(experience_lines: list[str]) -> list[ParsedExperience]:
    experiences: list[ParsedExperience] = []

    for line in experience_lines:
        segments = [_clean_line(segment) for segment in line.split("|") if _clean_line(segment)]
        date_match = DATE_RANGE_PATTERN.search(line)
        start_date = date_match.group("start") if date_match else None
        end_date = date_match.group("end") if date_match else None
        description = segments[-1] if len(segments) >= 3 else line

        if segments:
            first_segment = segments[0]
            if " at " in first_segment.lower():
                role_part, company_part = re.split(r"\bat\b", first_segment, maxsplit=1, flags=re.IGNORECASE)
                role = _clean_line(role_part)
                company = _clean_line(company_part)
            else:
                role = first_segment
                company = segments[1] if len(segments) >= 2 and not DATE_RANGE_PATTERN.search(segments[1]) else None
        else:
            line_without_dates = DATE_RANGE_PATTERN.sub("", line).strip(" -|")

            role: str
            company: str | None
            if " at " in line_without_dates.lower():
                role_part, company_part = re.split(r"\bat\b", line_without_dates, maxsplit=1, flags=re.IGNORECASE)
                role = _clean_line(role_part)
                company = _clean_line(company_part)
            elif "|" in line_without_dates:
                role_part, company_part = line_without_dates.split("|", maxsplit=1)
                role = _clean_line(role_part)
                company = _clean_line(company_part)
            else:
                role = _clean_line(line_without_dates)
                company = None

        if not role:
            continue

        experiences.append(
            ParsedExperience(
                role=role,
                company=company,
                start_date=start_date,
                end_date=end_date,
                description=description,
            )
        )

    return experiences


def extract_education(education_lines: list[str]) -> list[ParsedEducation]:
    entries: list[ParsedEducation] = []

    for line in education_lines:
        parts = [_clean_line(part) for part in re.split(r"\||,", line) if _clean_line(part)]
        if not parts:
            continue

        institution = parts[-1]
        degree = parts[0] if len(parts) > 1 else None
        field = parts[1] if len(parts) > 2 else None
        entries.append(
            ParsedEducation(
                institution=institution,
                degree=degree,
                field_of_study=field,
            )
        )

    return entries


def extract_certifications(certification_lines: list[str]) -> list[ParsedCertification]:
    certifications: list[ParsedCertification] = []

    for line in certification_lines:
        parts = [_clean_line(part) for part in re.split(r"\||,", line) if _clean_line(part)]
        if not parts:
            continue
        certifications.append(
            ParsedCertification(
                name=parts[0],
                issuer=parts[1] if len(parts) > 1 else None,
                issue_date=parts[2] if len(parts) > 2 else None,
            )
        )

    return certifications


def determine_seniority(text: str, experiences: list[ParsedExperience]) -> str:
    lower_text = text.lower()
    years = [int(match.group(1)) for match in YEARS_PATTERN.finditer(lower_text)]
    max_years = max(years) if years else len(experiences) * 2

    if any(keyword in lower_text for keyword in ["junior", "intern", "entry level"]):
        return "JUNIOR"
    if any(keyword in lower_text for keyword in ["chief ", "vice president", "vp ", "director", "head of"]):
        return "EXECUTIVE"
    if any(keyword in lower_text for keyword in ["lead", "principal", "staff engineer"]):
        return "LEAD"
    if "senior" in lower_text or max_years >= 5:
        return "SENIOR"
    if max_years >= 2:
        return "MID"
    return "JUNIOR"


def infer_industries(text: str) -> list[str]:
    lower_text = text.lower()
    industries = {industry for keyword, industry in INDUSTRY_KEYWORDS.items() if keyword in lower_text}
    return sorted(industries)


def infer_career_trajectory(experiences: list[ParsedExperience]) -> str | None:
    titles = [experience.role for experience in experiences[:3]]
    if len(titles) < 2:
        return titles[0] if titles else None
    return " -> ".join(titles)


def parse_resume_heuristically(text: str, source_type: str) -> ParsedResume:
    sections = split_sections(text)
    header_lines = sections.get("header", [])
    summary_lines = sections.get("summary", [])
    skill_lines = sections.get("skills", [])
    experience_lines = sections.get("experience", [])
    education_lines = sections.get("education", [])
    certification_lines = sections.get("certifications", [])

    full_name = header_lines[0] if header_lines else None
    headline = header_lines[1] if len(header_lines) > 1 else None
    email_match = EMAIL_PATTERN.search("\n".join(header_lines) or text)
    phone_match = PHONE_PATTERN.search("\n".join(header_lines))

    location = None
    for line in header_lines + summary_lines:
        if line.lower().startswith("location"):
            location = line.split(":", maxsplit=1)[-1].strip()
            break

    experiences = extract_experience(experience_lines)
    education = extract_education(education_lines)
    certifications = extract_certifications(certification_lines)
    skills = extract_skills(text, skill_lines)
    summary = " ".join(summary_lines[:3]).strip() or None
    seniority = determine_seniority(text, experiences)

    return ParsedResume(
        full_name=full_name,
        email=email_match.group(0) if email_match else None,
        phone=phone_match.group(0) if phone_match else None,
        location=location,
        headline=headline,
        summary=summary,
        skills=skills,
        experience=experiences,
        certifications=certifications,
        education=education,
        industries=infer_industries(text),
        seniority_level=seniority,
        career_trajectory=infer_career_trajectory(experiences),
        parser_mode="heuristic",
        source_type=source_type,
        extracted_text_preview=text[:280],
    )