"""
RAG (Retrieval-Augmented Generation) package for HireLens.
Provides text chunking, embedding generation, in-memory vector indexing,
and deterministic evidence verification.
"""

from .chunking import ResumeChunk, TextChunker
from .embeddings import (
    BaseEmbeddingService,
    FastEmbedEmbeddingService,
    MockEmbeddingService,
)
from .retrieval import SearchResult, VectorSearchIndex
from .verifier import EvidenceVerifier

__all__ = [
    "ResumeChunk",
    "TextChunker",
    "BaseEmbeddingService",
    "FastEmbedEmbeddingService",
    "MockEmbeddingService",
    "SearchResult",
    "VectorSearchIndex",
    "EvidenceVerifier",
]
