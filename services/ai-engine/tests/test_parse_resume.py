from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"


def _escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _build_pdf_from_text(text: str) -> bytes:
    lines = [_escape_pdf_text(line) for line in text.splitlines() if line.strip()]
    content_lines = ["BT", "/F1 11 Tf", "50 760 Td", "14 TL"]

    for index, line in enumerate(lines):
        operator = "Tj" if index == 0 else "'"
        content_lines.append(f"({line}) {operator}")

    content_lines.append("ET")
    stream = "\n".join(content_lines).encode("latin-1", errors="ignore")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        f"<< /Length {len(stream)} >>\nstream\n".encode("latin-1") + stream + b"\nendstream",
    ]

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("latin-1"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    pdf.extend(b"0000000000 65535 f \n")

    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))

    pdf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF".encode(
            "latin-1"
        )
    )
    return bytes(pdf)


def _fixture_pdf_bytes(name: str) -> bytes:
    text = (FIXTURES_DIR / name).read_text(encoding="utf-8")
    return _build_pdf_from_text(text)


def test_parse_resume_handles_bad_pdf() -> None:
    response = client.post(
        "/parse-resume",
        files={"file": ("broken.pdf", b"not-a-pdf", "application/pdf")},
    )

    assert response.status_code == 400
    assert "PDF" in response.json()["detail"]


def test_parse_resume_supports_resume_text_json_payload() -> None:
    response = client.post(
        "/parse-resume",
        json={"resumeText": (FIXTURES_DIR / "mid_resume.txt").read_text(encoding="utf-8")},
    )

    payload = response.json()
    assert response.status_code == 200
    assert payload["email"] == "marcus.lee@example.com"
    assert payload["source_type"] == "text"
    assert payload["seniority_level"] == "MID"


def test_parse_resume_parses_junior_pdf() -> None:
    response = client.post(
        "/parse-resume",
        files={"file": ("junior.pdf", _fixture_pdf_bytes("junior_resume.txt"), "application/pdf")},
    )

    payload = response.json()
    skill_names = {skill["display_name"] for skill in payload["skills"]}
    assert response.status_code == 200
    assert payload["full_name"] == "Ava Thompson"
    assert payload["seniority_level"] == "JUNIOR"
    assert "React" in skill_names
    assert len(payload["experience"]) >= 1


def test_parse_resume_parses_mid_pdf() -> None:
    response = client.post(
        "/parse-resume",
        files={"file": ("mid.pdf", _fixture_pdf_bytes("mid_resume.txt"), "application/pdf")},
    )

    payload = response.json()
    skill_names = {skill["display_name"] for skill in payload["skills"]}
    assert response.status_code == 200
    assert payload["full_name"] == "Marcus Lee"
    assert payload["seniority_level"] == "MID"
    assert "FastAPI" in skill_names
    assert "FinTech" in payload["industries"] or "Marketplaces" in payload["industries"]


def test_parse_resume_parses_senior_pdf() -> None:
    response = client.post(
        "/parse-resume",
        files={"file": ("senior.pdf", _fixture_pdf_bytes("senior_resume.txt"), "application/pdf")},
    )

    payload = response.json()
    skill_names = {skill["display_name"] for skill in payload["skills"]}
    assert response.status_code == 200
    assert payload["full_name"] == "Dr. Elena Ramirez"
    assert payload["seniority_level"] in {"LEAD", "EXECUTIVE"}
    assert "Machine Learning" in skill_names
    assert len(payload["experience"]) >= 3