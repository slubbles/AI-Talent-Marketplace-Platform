from __future__ import annotations

import re

from app.models import RoleDescriptionRequest, RoleDescriptionResponse, SalaryBandSuggestion


ROLE_LIBRARY = {
    "engineer": {
        "title": "Software Engineer",
        "summary": "Builds and ships production-grade product capabilities with strong engineering discipline.",
        "responsibilities": [
            "Design and implement reliable product features from specification through release.",
            "Collaborate with product, design, and data stakeholders to refine delivery scope.",
            "Maintain code quality, observability, and performance across the stack.",
            "Contribute to architecture decisions and mentor less experienced engineers.",
        ],
        "requirements": [
            "Strong experience delivering customer-facing software in production.",
            "Ability to translate ambiguous business requirements into technical execution.",
            "Comfort with testing, debugging, and iterative delivery in cross-functional teams.",
        ],
        "nice_to_haves": [
            "Experience with platform reliability, DevOps, or cloud cost optimization.",
            "Exposure to AI-assisted workflows, search, or recommendation systems.",
        ],
        "recommended_skills": ["System Design", "API Design", "Docker", "Testing", "CI/CD"],
        "salary": (85, 150),
    },
    "designer": {
        "title": "Product Designer",
        "summary": "Shapes user-centered product experiences across discovery, interaction design, and delivery.",
        "responsibilities": [
            "Translate product goals into clear user journeys, wireframes, and polished designs.",
            "Run discovery with product and engineering to uncover usability gaps and opportunities.",
            "Create scalable design patterns and maintain consistency across user flows.",
            "Support implementation quality through close collaboration with engineers.",
        ],
        "requirements": [
            "Strong portfolio showing end-to-end product design work for digital products.",
            "Ability to reason from user problems to usable interaction patterns.",
            "Clear communication with technical and non-technical stakeholders.",
        ],
        "nice_to_haves": [
            "Experience with design systems and accessibility standards.",
            "Exposure to marketplace, SaaS, or mobile-first product environments.",
        ],
        "recommended_skills": ["Figma", "Design Systems", "User Research", "Accessibility", "Prototyping"],
        "salary": (75, 135),
    },
    "product": {
        "title": "Product Manager",
        "summary": "Leads product strategy and execution by aligning customer needs, business goals, and delivery teams.",
        "responsibilities": [
            "Define product priorities, roadmap decisions, and measurable outcomes.",
            "Translate market, customer, and commercial signals into clear product requirements.",
            "Coordinate execution across engineering, design, and go-to-market stakeholders.",
            "Measure release impact and iterate quickly based on data and customer feedback.",
        ],
        "requirements": [
            "Experience owning roadmap decisions for SaaS or marketplace products.",
            "Ability to prioritize under uncertainty and make tradeoffs visible.",
            "Comfort writing clear requirements and leading cross-functional execution.",
        ],
        "nice_to_haves": [
            "Background in analytics, growth, or AI-enabled product experiences.",
            "Experience in startup or fast-scaling environments.",
        ],
        "recommended_skills": ["Roadmapping", "Analytics", "Stakeholder Management", "Experimentation", "Market Research"],
        "salary": (95, 165),
    },
    "data": {
        "title": "Data Scientist",
        "summary": "Applies statistical and machine learning methods to turn data into product and business decisions.",
        "responsibilities": [
            "Build models, analyses, and evaluation frameworks for product and operational use cases.",
            "Collaborate with engineering to productionize data workflows and model outputs.",
            "Frame business problems into measurable hypotheses and experiments.",
            "Communicate findings clearly to technical and executive audiences.",
        ],
        "requirements": [
            "Hands-on experience with statistical analysis and machine learning in production or near-production settings.",
            "Strong analytical reasoning and practical experimentation discipline.",
            "Ability to work with imperfect data and still deliver useful decision support.",
        ],
        "nice_to_haves": [
            "Experience with ranking, recommendation, NLP, or marketplace intelligence use cases.",
            "Exposure to data platform or MLOps tooling.",
        ],
        "recommended_skills": ["Python", "SQL", "Machine Learning", "Statistics", "Experiment Design"],
        "salary": (100, 175),
    },
    "executive": {
        "title": "Head of Product and Engineering",
        "summary": "Provides strategic leadership across product and engineering execution, team structure, and delivery outcomes.",
        "responsibilities": [
            "Set operating direction for product and engineering teams against company goals.",
            "Build management cadence, decision frameworks, and accountability across functions.",
            "Partner with founders or senior leadership on roadmap, hiring, and investment priorities.",
            "Raise delivery quality while balancing speed, risk, and organizational maturity.",
        ],
        "requirements": [
            "Proven leadership experience scaling teams and shipping complex software products.",
            "Strong strategic judgment with the ability to turn high-level goals into operating plans.",
            "Ability to influence across business, product, and technical leadership layers.",
        ],
        "nice_to_haves": [
            "Experience with marketplace, enterprise SaaS, or AI-enabled businesses.",
            "History of building distributed or international teams.",
        ],
        "recommended_skills": ["Leadership", "Org Design", "Budgeting", "Strategy", "Executive Communication"],
        "salary": (160, 260),
    },
}


SENIORITY_HINTS = [
    ("executive", "EXECUTIVE"),
    ("head", "LEAD"),
    ("director", "LEAD"),
    ("lead", "LEAD"),
    ("principal", "LEAD"),
    ("senior", "SENIOR"),
    ("staff", "SENIOR"),
    ("junior", "JUNIOR"),
    ("entry", "JUNIOR"),
]


def infer_role_family(raw_description: str, skills: list[str]) -> str:
    text = f"{raw_description} {' '.join(skills)}".lower()
    normalized = re.sub(r"[^a-z0-9+#]+", " ", text)
    tokens = set(normalized.split())

    def has_phrase(phrase: str) -> bool:
        return phrase in text

    if (
        "designer" in tokens
        or "ux" in tokens
        or "ui" in tokens
        or "figma" in tokens
        or has_phrase("user research")
    ):
        return "designer"
    if (
        has_phrase("product manager")
        or "roadmap" in tokens
        or "stakeholder" in tokens
        or "stakeholders" in tokens
        or "discovery" in tokens
    ):
        return "product"
    if (
        has_phrase("data scientist")
        or has_phrase("machine learning")
        or "analytics" in tokens
        or "ml" in tokens
        or "statistics" in tokens
    ):
        return "data"
    if (
        "vp" in tokens
        or "cto" in tokens
        or has_phrase("head of")
        or "executive" in tokens
        or "leadership" in tokens
    ):
        return "executive"
    return "engineer"


def infer_experience_level(raw_description: str) -> str:
    lowered = raw_description.lower()
    for hint, level in SENIORITY_HINTS:
        if hint in lowered:
            return level
    return "MID"


def infer_title(raw_description: str, role_family: str) -> str:
    title_match = re.search(r"(?:role|position|job title)\s*[:\-]\s*([^\n]+)", raw_description, flags=re.IGNORECASE)
    if title_match:
        return title_match.group(1).strip().rstrip(".")

    library_title = ROLE_LIBRARY[role_family]["title"]
    level = infer_experience_level(raw_description)
    if level == "SENIOR" and "Senior" not in library_title:
        return f"Senior {library_title}"
    if level == "LEAD" and "Head" not in library_title and "Lead" not in library_title:
        return f"Lead {library_title}"
    if level == "EXECUTIVE" and role_family != "executive":
        return f"Head of {library_title}"
    if level == "JUNIOR" and "Junior" not in library_title:
        return f"Junior {library_title}"
    return library_title


def merge_skills(base_skills: list[str], recommended_skills: list[str]) -> list[str]:
    seen: set[str] = set()
    merged: list[str] = []
    for skill in [*base_skills, *recommended_skills]:
        normalized = skill.strip()
        if not normalized:
            continue
        key = normalized.lower()
        if key in seen:
            continue
        seen.add(key)
        merged.append(normalized)
    return merged


def salary_band_for(role_family: str, experience_level: str, location: str | None) -> SalaryBandSuggestion:
    base_min, base_max = ROLE_LIBRARY[role_family]["salary"]
    multiplier = {
        "JUNIOR": 0.78,
        "MID": 1.0,
        "SENIOR": 1.18,
        "LEAD": 1.34,
        "EXECUTIVE": 1.55,
    }[experience_level]
    location_adjustment = 1.0
    if location:
        lowered = location.lower()
        if any(token in lowered for token in ["new york", "san francisco", "london", "zurich"]):
            location_adjustment = 1.18
        elif "remote" in lowered:
            location_adjustment = 1.05
        elif any(token in lowered for token in ["cairo", "casablanca", "johannesburg", "manila"]):
            location_adjustment = 0.9

    suggested_min = int(round(base_min * multiplier * location_adjustment))
    suggested_max = int(round(base_max * multiplier * location_adjustment))
    rationale = f"Estimated from {role_family} market range, calibrated for {experience_level.lower()} scope"
    if location:
        rationale += f" and {location} hiring conditions"
    return SalaryBandSuggestion(min=suggested_min, max=suggested_max, rationale=rationale)


def render_enhanced_description(
    title: str,
    summary: str,
    responsibilities: list[str],
    requirements: list[str],
    nice_to_haves: list[str],
) -> str:
    sections = [
        f"Title: {title}",
        "",
        f"Summary: {summary}",
        "",
        "Responsibilities:",
        *[f"- {item}" for item in responsibilities],
        "",
        "Requirements:",
        *[f"- {item}" for item in requirements],
        "",
        "Nice to Have:",
        *[f"- {item}" for item in nice_to_haves],
    ]
    return "\n".join(sections)


def generate_role_description_heuristic(input: RoleDescriptionRequest) -> RoleDescriptionResponse:
    role_family = infer_role_family(input.raw_description, input.skills)
    role_template = ROLE_LIBRARY[role_family]
    experience_level = infer_experience_level(input.raw_description)
    title = infer_title(input.raw_description, role_family)
    recommended_skills = merge_skills(input.skills, role_template["recommended_skills"])

    responsibilities = role_template["responsibilities"][:]
    requirements = role_template["requirements"][:]
    nice_to_haves = role_template["nice_to_haves"][:]

    if input.company_industry:
        responsibilities.append(
            f"Bring context-aware execution for {input.company_industry} workflows and stakeholder expectations."
        )

    if recommended_skills:
        requirements.append(
            f"Practical fluency with {', '.join(recommended_skills[:5])}."
        )

    summary = role_template["summary"]
    if input.company_name or input.location:
        context_bits = [bit for bit in [input.company_name, input.location] if bit]
        summary = f"{summary} This role is scoped for {' in '.join(context_bits) if len(context_bits) == 2 else context_bits[0]}."

    salary_band = salary_band_for(role_family, experience_level, input.location)
    enhanced_description = render_enhanced_description(
        title=title,
        summary=summary,
        responsibilities=responsibilities,
        requirements=requirements,
        nice_to_haves=nice_to_haves,
    )

    return RoleDescriptionResponse(
        title=title,
        summary=summary,
        responsibilities=responsibilities,
        requirements=requirements,
        nice_to_haves=nice_to_haves,
        recommended_skills=recommended_skills,
        salary_band=salary_band,
        experience_level=experience_level,
        enhanced_description=enhanced_description,
        generation_mode="heuristic",
    )