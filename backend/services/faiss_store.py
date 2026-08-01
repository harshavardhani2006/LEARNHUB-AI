"""
Lightweight vector store using numpy cosine similarity.
Replaces faiss-cpu (which is too large for Vercel's 500MB limit).
Indexes are kept in memory for the lifetime of the serverless instance.
On local dev or Render, they are also persisted to disk as JSON.
"""
import os
import json
import shutil
import numpy as np
from typing import List, Dict, Any, Tuple
from config import settings

# In-memory store: { resource_id: { "vectors": np.ndarray, "chunks": [str] } }
_memory_store: Dict[str, Dict[str, Any]] = {}


def _cosine_similarity(query: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    """Compute cosine similarity between a query vector and a matrix of vectors."""
    query_norm = query / (np.linalg.norm(query) + 1e-10)
    norms = np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-10
    matrix_norm = matrix / norms
    return (matrix_norm @ query_norm).flatten()


def _is_writable() -> bool:
    try:
        os.makedirs(settings.FAISS_INDEX_PATH, exist_ok=True)
        test = os.path.join(settings.FAISS_INDEX_PATH, ".write_test")
        with open(test, "w") as f:
            f.write("ok")
        os.remove(test)
        return True
    except Exception:
        return False


class FAISSStore:

    @classmethod
    def save_index(cls, resource_id: str, chunks: List[str], embeddings: List[List[float]]):
        """Store chunks and their embedding vectors."""
        if not chunks or not embeddings:
            return

        vectors = np.array(embeddings, dtype=np.float32)

        # Always keep in memory
        _memory_store[resource_id] = {"vectors": vectors, "chunks": chunks}

        # Persist to disk when filesystem is writable (local / Render)
        if _is_writable():
            resource_dir = os.path.join(settings.FAISS_INDEX_PATH, resource_id)
            os.makedirs(resource_dir, exist_ok=True)
            np.save(os.path.join(resource_dir, "vectors.npy"), vectors)
            with open(os.path.join(resource_dir, "chunks.json"), "w", encoding="utf-8") as f:
                json.dump(chunks, f, ensure_ascii=False)

    @classmethod
    def delete_index(cls, resource_id: str):
        """Remove from memory and disk."""
        _memory_store.pop(resource_id, None)
        resource_dir = os.path.join(settings.FAISS_INDEX_PATH, resource_id)
        if os.path.exists(resource_dir):
            shutil.rmtree(resource_dir)

    @classmethod
    def load_index_and_chunks(cls, resource_id: str) -> Tuple[np.ndarray, List[str]]:
        """Load vectors and chunks — memory first, disk fallback."""
        if resource_id in _memory_store:
            e = _memory_store[resource_id]
            return e["vectors"], e["chunks"]

        resource_dir = os.path.join(settings.FAISS_INDEX_PATH, resource_id)
        vectors_file = os.path.join(resource_dir, "vectors.npy")
        chunks_file = os.path.join(resource_dir, "chunks.json")

        if not os.path.exists(vectors_file) or not os.path.exists(chunks_file):
            raise FileNotFoundError(f"Index not found for resource {resource_id}")

        vectors = np.load(vectors_file)
        with open(chunks_file, "r", encoding="utf-8") as f:
            chunks = json.load(f)

        _memory_store[resource_id] = {"vectors": vectors, "chunks": chunks}
        return vectors, chunks

    @classmethod
    def search(cls, resource_id: str, query_vector: List[float], k: int = 5) -> List[Dict[str, Any]]:
        """Retrieve top-K most similar chunks for a query vector."""
        try:
            vectors, chunks = cls.load_index_and_chunks(resource_id)
        except FileNotFoundError:
            return []

        k = min(k, len(chunks))
        if k == 0:
            return []

        q = np.array(query_vector, dtype=np.float32)
        scores = _cosine_similarity(q, vectors)
        top_indices = np.argsort(scores)[::-1][:k]

        return [
            {"chunk": chunks[i], "score": float(scores[i])}
            for i in top_indices
        ]
