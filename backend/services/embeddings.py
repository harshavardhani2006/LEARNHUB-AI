from sentence_transformers import SentenceTransformer
from typing import List, Union
import numpy as np

class EmbeddingsService:
    _model = None

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        """Lazy load the sentence transformers model."""
        if cls._model is None:
            # Uses all-MiniLM-L6-v2 (384 dimensions)
            cls._model = SentenceTransformer('all-MiniLM-L6-v2')
        return cls._model

    @classmethod
    def embed_query(cls, text: str) -> List[float]:
        """Embed a single query string to a list of floats."""
        model = cls.get_model()
        embedding = model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    @classmethod
    def embed_documents(cls, texts: List[str]) -> List[List[float]]:
        """Embed a batch of text documents."""
        if not texts:
            return []
        model = cls.get_model()
        embeddings = model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()
