from __future__ import annotations

from io import BytesIO

import httpx
from pypdf import PdfReader


class ResumeFetchError(ValueError):
    pass


class ResumeExtractionError(ValueError):
    pass


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    if not pdf_bytes:
        raise ResumeExtractionError("Uploaded PDF file was empty.")

    try:
        reader = PdfReader(BytesIO(pdf_bytes))
        pages = [page.extract_text() or "" for page in reader.pages]
    except Exception as error:
        raise ResumeExtractionError("Could not read PDF content.") from error

    text = "\n".join(page.strip() for page in pages if page.strip()).strip()
    if not text:
        raise ResumeExtractionError("Resume content was empty after PDF extraction.")

    return text


async def fetch_resume_url(resume_url: str) -> tuple[str, bytes | None]:
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(resume_url)
            response.raise_for_status()
    except Exception as error:
        raise ResumeFetchError("Could not fetch resume URL.") from error

    content_type = response.headers.get("content-type", "")
    if "pdf" in content_type or resume_url.lower().endswith(".pdf"):
        return extract_text_from_pdf_bytes(response.content), response.content

    text = response.text.strip()
    if not text:
        raise ResumeFetchError("Resume URL returned empty content.")

    return text, None