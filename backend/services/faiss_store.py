import os
import json
import faiss
import numpy as np
import shutil
from typing import List, Dict, Any, Tuple
from config import settings

class FAISSStore:
    @staticmethod
    def _get_resource_dir(resource_id: str) -> str:
        """Get directory path for storing FAISS files of a resource."""
        path = os.path.join(settings.FAISS_INDEX_PATH, resource_id)
        os.makedirs(path, exist_ok=True)
        return path

    @classmethod
    def save_index(cls, resource_id: str, chunks: List[str], embeddings: List[List[float]]):
        """Build and save a FAISS index and its text chunks to disk."""
        if not chunks or not embeddings:
            return

        resource_dir = cls._get_resource_dir(resource_id)
        
        # Convert embeddings list to float32 numpy array
        vectors = np.array(embeddings).astype('float32')
        dimension = vectors.shape[1]

        # Use IndexFlatIP (Inner Product) for cosine similarity when vectors are normalized,
        # or IndexFlatL2 for standard L2 distance. FlatL2 is safe and default.
        index = faiss.IndexFlatL2(dimension)
        index.add(vectors)

        # Write FAISS index file
        index_file = os.path.join(resource_dir, "index.faiss")
        faiss.write_index(index, index_file)

        # Write chunks mapping
        chunks_file = os.path.join(resource_dir, "chunks.json")
        with open(chunks_file, "w", encoding="utf-8") as f:
            json.dump(chunks, f, ensure_ascii=False)

    @classmethod
    def delete_index(cls, resource_id: str):
        """Delete persisted FAISS index files for a resource."""
        resource_dir = os.path.join(settings.FAISS_INDEX_PATH, resource_id)
        if os.path.exists(resource_dir):
            shutil.rmtree(resource_dir)

    @classmethod
    def load_index_and_chunks(cls, resource_id: str) -> Tuple[faiss.Index, List[str]]:
        """Load FAISS index and text chunks for a resource from disk."""
        resource_dir = os.path.join(settings.FAISS_INDEX_PATH, resource_id)
        index_file = os.path.join(resource_dir, "index.faiss")
        chunks_file = os.path.join(resource_dir, "chunks.json")

        if not os.path.exists(index_file) or not os.path.exists(chunks_file):
            raise FileNotFoundError(f"FAISS files not found for resource {resource_id}")

        index = faiss.read_index(index_file)
        with open(chunks_file, "r", encoding="utf-8") as f:
            chunks = json.load(f)

        return index, chunks

    @classmethod
    def search(cls, resource_id: str, query_vector: List[float], k: int = 5) -> List[Dict[str, Any]]:
        """Retrieve top-K matching text chunks for a query vector."""
        try:
            index, chunks = cls.load_index_and_chunks(resource_id)
        except FileNotFoundError:
            return []

        # Format query vector
        q_vec = np.array([query_vector]).astype('float32')
        
        # Limit K if there are fewer chunks than K
        k = min(k, len(chunks))
        if k == 0:
            return []

        distances, indices = index.search(q_vec, k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1 and idx < len(chunks):
                results.append({
                    "chunk": chunks[idx],
                    "score": float(dist)  # In L2, smaller distance = closer match
                })
        return results
