from __future__ import annotations

import hashlib
import math
import os
import re

import httpx

from app.matching.db import update_embedding


EMBEDDING_DIMENSIONS = 1536
TOKEN_PATTERN = re.compile(r"[a-z0-9+#.-]+", re.IGNORECASE)


def _normalize(values: list[float]) -> list[float]:
    magnitude = math.sqrt(sum(value * value for value in values))
    if magnitude == 0:
        return values
    return [value / magnitude for value in values]


def _hash_token(token: str) -> tuple[int, float]:
    digest = hashlib.sha256(token.encode("utf-8")).digest()
    index = int.from_bytes(digest[:4], "big") % EMBEDDING_DIMENSIONS
    raw = int.from_bytes(digest[4:8], "big") / 2**32
    weight = (raw * 2) - 1
    return index, weight


def _fallback_embedding(text: str) -> list[float]:
    values = [0.0] * EMBEDDING_DIMENSIONS
    tokens = TOKEN_PATTERN.findall(text.lower())
    for token in tokens:
      index, weight = _hash_token(token)
      values[index] += weight

      bigram_index, bigram_weight = _hash_token(f"{token}:{len(token)}")
      values[bigram_index] += bigram_weight * 0.35

    return _normalize(values)


def openrouter_embeddings_enabled() -> bool:
    api_key = os.getenv("OPENROUTER_API_KEY")
    return bool(api_key and api_key != "change-me")


async def generate_embedding(text: str, embedding_type: str) -> tuple[list[float], str]:
    if not text.strip():
        raise ValueError("Text for embedding generation was empty.")

    if not openrouter_embeddings_enabled():
        return _fallback_embedding(text), "fallback-hash"

    base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    model = os.getenv("OPENROUTER_EMBEDDING_MODEL", "text-embedding-3-small")
    payload = {
        "model": model,
        "input": text,
        "encoding_format": "float",
    }
    headers = {
        "Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(f"{base_url}/embeddings", json=payload, headers=headers)
            response.raise_for_status()
    except Exception:
        return _fallback_embedding(text), "fallback-hash"

    data = response.json()["data"][0]["embedding"]
    if len(data) != EMBEDDING_DIMENSIONS:
        return _fallback_embedding(text), "fallback-hash"
    return _normalize([float(value) for value in data]), f"openrouter:{embedding_type}"


async def store_embedding_for_entity(entity_type: str, entity_id: str, embedding: list[float]) -> None:
    update_embedding(entity_type, entity_id, embedding)