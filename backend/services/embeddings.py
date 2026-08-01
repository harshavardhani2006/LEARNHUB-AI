import os
import httpx
from typing import List
from config import settings

# Hugging Face Inference API endpoint for sentence embeddings
# Uses the same all-MiniLM-L6-v2 model (384 dimensions) as the local version
HF_EMBEDDING_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"


def _get_headers() -> dict:
    return {"Authorization": f"Bearer {settings.HF_TOKEN}"}


class EmbeddingsService:

    @classmethod
    def embed_query(cls, text: str) -> List[float]:
        """Embed a single query string via HF Inference API."""
        return cls.embed_documents([text])[0]

    @classmethod
    def embed_documents(cls, texts: List[str]) -> List[List[float]]:
        """Embed a batch of documents via HF Inference API."""
        if not texts:
            return []

        try:
            with httpx.Client(timeout=30) as client:
                response = client.post(
                    HF_EMBEDDING_URL,
                    headers=_get_headers(),
                    json={"inputs": texts, "options": {"wait_for_model": True}},
                )
                response.raise_for_status()
                result = response.json()

                # HF returns list of embeddings directly
                if isinstance(result, list) and len(result) > 0:
                    # Single string input returns [[float]] or [float]
                    if isinstance(result[0], float):
                        return [result]
                    return result

        except Exception as e:
            print(f"HF Embeddings API error: {e}. Falling back to zero vectors.")

        # Fallback: return zero vectors (384 dims) so app doesn't crash
        return [[0.0] * 384 for _ in texts]
