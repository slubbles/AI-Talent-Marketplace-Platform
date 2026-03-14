from __future__ import annotations

import os

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile

from app.assistant import generate_role_description
from app.matching import (
    generate_embedding,
    match_candidates_for_demand,
    semantic_search_profiles,
    store_embedding_for_entity,
)
from app.models import (
    EmbeddingRequest,
    EmbeddingResponse,
    MatchCandidatesRequest,
    RoleDescriptionRequest,
    SemanticSearchRequest,
)
from app.parsing.service import (
        ResumeParsingError,
        parse_resume_payload,
)

_INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")


def _verify_internal_key(x_internal_api_key: str = Header("")) -> None:
    if not _INTERNAL_API_KEY:
        return  # key not configured — allow (local dev)
    if x_internal_api_key != _INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid internal API key.")


app = FastAPI(title="AI Talent Marketplace AI Engine")


@app.get("/health")
def health() -> dict[str, str]:
        return {"status": "ok", "service": "ai-engine"}


@app.post("/parse-resume", dependencies=[Depends(_verify_internal_key)])
async def parse_resume(
        request: Request,
        file: UploadFile | None = File(default=None),
        resume_url: str | None = Form(default=None),
        resume_text: str | None = Form(default=None),
) -> dict[str, object]:
        json_resume_url: str | None = None
        json_resume_text: str | None = None

        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            try:
                payload = await request.json()
            except ValueError as error:
                raise HTTPException(status_code=400, detail="Invalid JSON payload.") from error

            if isinstance(payload, dict):
                json_resume_url = payload.get("resumeUrl")
                json_resume_text = payload.get("resumeText")

        try:
            parsed_resume = await parse_resume_payload(
                filename=file.filename if file else None,
                file_bytes=await file.read() if file else None,
                file_content_type=file.content_type if file else None,
                resume_url=resume_url or json_resume_url,
                resume_text=resume_text or json_resume_text,
            )
        except ResumeParsingError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error
        except Exception as error:
            raise HTTPException(status_code=502, detail="Resume parsing failed.") from error

        return parsed_resume.model_dump(mode="json")


@app.post("/generate-embedding", dependencies=[Depends(_verify_internal_key)])
async def generate_embedding_endpoint(input: EmbeddingRequest) -> dict[str, object]:
    try:
        embedding, provider = await generate_embedding(input.text, input.type)
        if input.entity_id:
            await store_embedding_for_entity(input.type, input.entity_id, embedding)
        payload = EmbeddingResponse(
            embedding=embedding,
            dimensions=len(embedding),
            provider=provider,
            type=input.type,
            entity_id=input.entity_id,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail="Embedding generation failed.") from error

    return payload.model_dump(mode="json")


@app.post("/match-candidates", dependencies=[Depends(_verify_internal_key)])
async def match_candidates(input: MatchCandidatesRequest) -> dict[str, object]:
    try:
        payload = await match_candidates_for_demand(input.demand_id, input.limit)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail="Candidate matching failed.") from error

    return payload.model_dump(mode="json")


@app.post("/semantic-search", dependencies=[Depends(_verify_internal_key)])
async def semantic_search(input: SemanticSearchRequest) -> dict[str, object]:
    try:
        payload = await semantic_search_profiles(input.query, input.filters, input.limit)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail="Semantic search failed.") from error

    return payload.model_dump(mode="json")


@app.post("/generate-role-description", dependencies=[Depends(_verify_internal_key)])
async def generate_role_description_endpoint(input: RoleDescriptionRequest) -> dict[str, object]:
    try:
        payload = await generate_role_description(input)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail="Role description generation failed.") from error

    return payload.model_dump(mode="json")
