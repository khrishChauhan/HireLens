import hashlib
import logging
from abc import ABC, abstractmethod
from typing import Any, List, Optional
import numpy as np

logger = logging.getLogger("hirelens.embeddings")


class BaseEmbeddingService(ABC):
    """Abstract interface for text embedding providers."""

    @property
    @abstractmethod
    def dimension(self) -> int:
        """The vector dimension produced by this embedding model."""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """The identifier of the underlying model."""
        pass

    @abstractmethod
    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """
        Embeds a list of text strings into a 2D numpy array of shape (N, dimension).
        Output vectors must be L2-normalized so that dot product equals cosine similarity.
        """
        pass

    def embed_query(self, query: str) -> np.ndarray:
        """
        Embeds a single query string into a 1D numpy array of shape (dimension,).
        Output vector must be L2-normalized.
        """
        if not query or not query.strip():
            # Return zero vector if query is empty
            return np.zeros(self.dimension, dtype=np.float32)

        vectors = self.embed_texts([query])
        return vectors[0]


class FastEmbedEmbeddingService(BaseEmbeddingService):
    """
    Local, CPU-optimized embedding service powered by FastEmbed and ONNX Runtime.
    Default model: BAAI/bge-small-en-v1.5 (384 dimensions).
    Fast, lightweight, free, and runs fully locally without external API dependencies.
    """

    def __init__(
        self,
        model_name: str = "BAAI/bge-small-en-v1.5",
        threads: Optional[int] = None,
    ):
        self._model_name = model_name
        self._threads = threads
        self._model: Optional[Any] = None
        self._dimension = 384

    @property
    def dimension(self) -> int:
        return self._dimension

    @property
    def model_name(self) -> str:
        return self._model_name

    def _get_model(self) -> Any:
        if self._model is not None:
            return self._model

        try:
            from fastembed import TextEmbedding

            logger.info("Initializing FastEmbed embedding model: %s", self._model_name)
            self._model = TextEmbedding(
                model_name=self._model_name,
                threads=self._threads,
            )
            return self._model
        except Exception as e:
            logger.error("Failed to load FastEmbed model %s: %s", self._model_name, e)
            raise RuntimeError(
                f"Unable to initialize local embedding model '{self._model_name}'. "
                f"Ensure fastembed and onnxruntime are installed. Details: {e}"
            ) from e

    def warmup(self) -> None:
        """
        Pre-downloads and initializes the embedding model to eliminate cold-start latency.
        Safe to call during container/image build steps or server startup.
        """
        self._get_model()

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        if not texts:
            return np.empty((0, self.dimension), dtype=np.float32)

        model = self._get_model()

        # Sanitize texts: replace empty or whitespace-only with placeholder to prevent engine crashes
        sanitized = [t.strip() if t and t.strip() else "[EMPTY]" for t in texts]

        try:
            raw_embeddings = list(model.embed(sanitized))
            arr = np.array(raw_embeddings, dtype=np.float32)

            # L2 normalize each row so dot product equals cosine similarity
            norms = np.linalg.norm(arr, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            normalized = arr / norms

            if normalized.shape[1] != self._dimension:
                self._dimension = normalized.shape[1]

            return normalized
        except Exception as e:
            logger.error("Embedding generation failed: %s", e)
            raise RuntimeError(f"Error generating embeddings with {self._model_name}: {e}") from e


class MockEmbeddingService(BaseEmbeddingService):
    """
    Deterministic, zero-dependency mock embedding service for unit tests and local development.
    Generates consistent float vectors using token hashing without model downloads or network calls.
    """

    def __init__(self, dimension: int = 64, model_name: str = "mock-deterministic-v1"):
        self._dimension = dimension
        self._model_name = model_name

    @property
    def dimension(self) -> int:
        return self._dimension

    @property
    def model_name(self) -> str:
        return self._model_name

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        if not texts:
            return np.empty((0, self.dimension), dtype=np.float32)

        embeddings: List[np.ndarray] = []

        for text in texts:
            vec = np.zeros(self.dimension, dtype=np.float32)
            if not text or not text.strip():
                embeddings.append(vec)
                continue

            words = text.lower().split()
            for word in words:
                # Deterministic hash to dimension index
                h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
                idx = h % self.dimension
                sign = 1.0 if (h // self.dimension) % 2 == 0 else -1.0
                vec[idx] += sign

            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            embeddings.append(vec)

        return np.array(embeddings, dtype=np.float32)


if __name__ == "__main__":
    import sys

    print("Pre-caching FastEmbed model...")
    try:
        service = FastEmbedEmbeddingService()
        service.warmup()
        print("FastEmbed model pre-cached successfully.")
    except Exception as exc:
        print(f"Failed to pre-cache FastEmbed model: {exc}", file=sys.stderr)
        sys.exit(1)
