import os
import json
import faiss
import numpy as np
import shutil
from typing import List, Dict, Any, Tuple
from config import settings

# In-memory store for Vercel (no persistent filesystem).
# On local/Render where FAISS_INDEX_PATH is writable, disk is used as well.
_memory_store: Dict[str, Dict[str, Any]] = {}


class FAISSStore:
    @staticmethod
    def _get_resource_dir(resource_id: str) -> str:
        """Get directory path for storing FAISS files of a resource."""
        path = os.path.join(settings.FAISS_INDEX_PATH, resource_id)
        os.makedirs(path, exist_ok=True)
        return path

    @staticmethod
    def _is_writable() -> bool:
        """Check if the FAISS index path is writable (not available on Vercel)."""
        try:
            test_path = os.path.join(settings.FAISS_INDEX_PATH, ".write_test")
            os.makedirs(settings.FAISS_INDEX_PATH, exist_ok=True)
            with open(test_path, "w") as f:
                f.write("ok")
            os.remove(test_path)
            return True
        except Exception:
            return False

    @classmethod
    def save_index(cls, resource_id: str, chunks: List[str], embeddings: List[List[float]]):
        """Build and save a FAISS index and its text chunks.
        Tries disk first; falls back to in-memory store (Vercel serverless)."""
        if not chunks or not embeddings:
            return

        vectors = np.array(embeddings).astype('float32')
        dimension = vectors.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(vectors)

        # Always keep in memory for the lifetime of this serverless instance
        _memory_store[resource_id] = {"index": index, "chunks": chunks}

        # Also persist to disk when filesystem is writable (local / Render)
        if cls._is_writable():
            resource_dir = cls._get_resource_dir(resource_id)
            faiss.write_index(index, os.path.join(resource_dir, "index.faiss"))
            with open(os.path.join(resource_dir, "chunks.json"), "w", encoding="utf-8") as f:
                json.dump(chunks, f, ensure_ascii=False)

    @classmethod
    def delete_index(cls, resource_id: str):
        """Remove index from memory and disk."""
        _memory_store.pop(resource_id, None)
        resource_dir = os.path.join(settings.FAISS_INDEX_PATH, resource_id)
        if os.path.exists(resource_dir):
            shutil.rmtree(resource_dir)

    @classmethod
    def load_index_and_chunks(cls, resource_id: str) -> Tuple[faiss.Index, List[str]]:
        """Load FAISS index and chunks — memory first, then disk fallback."""
        # 1. In-memory (always available within the same serverless instance)
        if resource_id in _memory_store:
            entry = _memory_store[resource_id]
            return entry["index"], entry["chunks"]

        # 2. Disk fallback (local dev / Render)
        resource_dir = os.path.join(settings.FAISS_INDEX_PATH, resource_id)
        index_file = os.path.join(resource_dir, "index.faiss")
        chunks_file = os.path.join(resource_dir, "chunks.json")

        if not os.path.exists(index_file) or not os.path.exists(chunks_file):
            raise FileNotFoundError(f"FAISS index not found for resource {resource_id}")

        index = faiss.read_index(index_file)
        with open(chunks_file, "r", encoding="utf-8") as f:
            chunks = json.load(f)

        # Warm the memory cache
        _memory_store[resource_id] = {"index": index, "chunks": chunks}
        return index, chunks

    @classmethod
    def search(cls, resource_id: str, query_vector: List[float], k: int = 5) -> List[Dict[str, Any]]:
        """Retrieve top-K matching text chunks for a query vector."""
        try:
            index, chunks = cls.load_index_and_chunks(resource_id)
        except FileNotFoundError:
            return []

        q_vec = np.array([query_vector]).astype('float32')
        k = min(k, len(chunks))
        if k == 0:
            return []

        distances, indices = index.search(q_vec, k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1 and idx < len(chunks):
                results.append({
                    "chunk": chunks[idx],
                    "score": float(dist)
                })
        return results
