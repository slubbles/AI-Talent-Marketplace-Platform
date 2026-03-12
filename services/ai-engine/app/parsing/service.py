from __future__ import annotations

from app.models import ParsedResume
from app.parsing.extractor import (
    ResumeExtractionError,
    ResumeFetchError,
    extract_text_from_pdf_bytes,
    fetch_resume_url,
)
from app.parsing.heuristics import parse_resume_heuristically
from app.parsing.llm_client import openrouter_enabled, parse_resume_with_openrouter


class ResumeParsingError(ValueError):
    pass


async def parse_resume_payload(
    *,
    filename: str | None,
    file_bytes: bytes | None,
    file_content_type: str | None,
    resume_url: str | None,
    resume_text: str | None,
) -> ParsedResume:
    source_type = "text"

    if file_bytes is not None:
        if file_content_type and "pdf" not in file_content_type and not (filename or "").lower().endswith(".pdf"):
            raise ResumeParsingError("Only PDF uploads are supported for file parsing.")
        source_type = "file"
        try:
            text = extract_text_from_pdf_bytes(file_bytes)
        except ResumeExtractionError as error:
            raise ResumeParsingError(str(error)) from error
    elif resume_url:
        source_type = "url"
        try:
            text, _ = await fetch_resume_url(resume_url)
        except (ResumeExtractionError, ResumeFetchError) as error:
            raise ResumeParsingError(str(error)) from error
    elif resume_text:
        text = resume_text.strip()
        if not text:
            raise ResumeParsingError("Resume text payload was empty.")
    else:
        raise ResumeParsingError("Provide a PDF file, resumeUrl, or resumeText.")

    fallback = parse_resume_heuristically(text, source_type)

    if not openrouter_enabled():
        return fallback

    try:
        llm_parsed = await parse_resume_with_openrouter(text, source_type)
    except Exception:
        return fallback

    llm_parsed.parser_mode = "hybrid"
    if not llm_parsed.skills:
        llm_parsed.skills = fallback.skills
    if not llm_parsed.experience:
        llm_parsed.experience = fallback.experience
    if not llm_parsed.education:
        llm_parsed.education = fallback.education
    if not llm_parsed.certifications:
        llm_parsed.certifications = fallback.certifications
    if not llm_parsed.industries:
        llm_parsed.industries = fallback.industries
    if not llm_parsed.career_trajectory:
        llm_parsed.career_trajectory = fallback.career_trajectory
    if not llm_parsed.summary:
        llm_parsed.summary = fallback.summary
    if not llm_parsed.email:
        llm_parsed.email = fallback.email
    if not llm_parsed.phone:
        llm_parsed.phone = fallback.phone
    if not llm_parsed.location:
        llm_parsed.location = fallback.location
    if not llm_parsed.headline:
        llm_parsed.headline = fallback.headline
    if not llm_parsed.full_name:
        llm_parsed.full_name = fallback.full_name
    return llm_parsed