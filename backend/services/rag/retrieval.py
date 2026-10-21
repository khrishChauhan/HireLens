from dataclasses import dataclass
from typing import List, Optional
import numpy as np

from .chunking import ResumeChunk, TextChunker
from .embeddings import BaseEmbeddingService


@dataclass
class SearchResult:
    """Represents a retrieved resume chunk with its similarity score and ranking."""
    chunk: ResumeChunk
    score: float
    rank: int


class VectorSearchIndex:
    """
    Lightweight, in-memory vector index for candidate-isolated semantic search.
    Computes cosine similarity between query embeddings and chunk embeddings.
    Designed for ephemeral per-request lifecycles to protect candidate privacy.
    """

    def __init__(
        self,
        embedding_service: BaseEmbeddingService,
        chunker: Optional[TextChunker] = None,
    ):
        self.embedding_service = embedding_service
        self.chunker = chunker or TextChunker()
        self._chunks: List[ResumeChunk] = []
        self._embeddings: Optional[np.ndarray] = None

    @property
    def total_chunks(self) -> int:
        return len(self._chunks)

    @property
    def chunks(self) -> List[ResumeChunk]:
        return self._chunks

    def index_text(self, text: str, source_doc: str = "resume") -> List[ResumeChunk]:
        """
        Chunks the provided text, generates embeddings, and populates the in-memory index.
        Replaces any previously indexed content in this instance to maintain strict single-document isolation.
        """
        chunks = self.chunker.chunk_text(text, source_doc=source_doc)
        self.index_chunks(chunks)
        return chunks

    def index_chunks(self, chunks: List[ResumeChunk]) -> None:
        """
        Populates index with pre-chunked items and generates their embeddings.
        """
        self._chunks = list(chunks)

        if not self._chunks:
            self._embeddings = np.empty((0, self.embedding_service.dimension), dtype=np.float32)
            return

        texts = [chunk.text for chunk in self._chunks]
        self._embeddings = self.embedding_service.embed_texts(texts)

    def search(
        self,
        query: str,
        top_k: int = 3,
        min_score: float = -1.0,
    ) -> List[SearchResult]:
        """
        Retrieves the top_k most semantically relevant chunks for a given query string.
        Returns an ordered list of SearchResult items ranked by descending cosine similarity.
        """
        if not query or not query.strip():
            return []

        if not self._chunks or self._embeddings is None or len(self._embeddings) == 0:
            return []

        query_vec = self.embedding_service.embed_query(query)
        query_norm = np.linalg.norm(query_vec)

        if query_norm == 0:
            return []

        # Cosine similarity via dot product (both chunk and query vectors are L2 normalized)
        # scores: shape (N,)
        scores = np.dot(self._embeddings, query_vec)

        # Sort indices by score descending
        ranked_indices = np.argsort(scores)[::-1]

        k = min(top_k, len(self._chunks))
        results: List[SearchResult] = []

        rank = 1
        for idx in ranked_indices[:k]:
            score = float(scores[idx])
            if score >= min_score:
                results.append(
                    SearchResult(
                        chunk=self._chunks[idx],
                        score=round(score, 4),
                        rank=rank,
                    )
                )
                rank += 1

        return results

    def get_chunk(self, index: int) -> Optional[ResumeChunk]:
        """Retrieves a chunk by its zero-based index."""
        if 0 <= index < len(self._chunks):
            return self._chunks[index]
        return None
