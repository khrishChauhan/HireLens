from dataclasses import dataclass
from typing import List


@dataclass
class ResumeChunk:
    """Represents a discrete text chunk extracted from a resume document."""
    index: int
    text: str
    start_char: int
    end_char: int
    word_count: int
    source_doc: str


class TextChunker:
    """
    Configurable, boundary-aware text chunker tailored for resume and technical document structure.
    
    Strategy:
    - Splits text into overlapping character windows while attempting to respect natural breaks
      (double newlines, single newlines, or sentence boundaries) to preserve semantic coherence.
    - Preserves character offsets for exact evidence traceability.
    - Omits empty or trivially short chunks.
    """

    def __init__(
        self,
        chunk_size: int = 450,
        chunk_overlap: int = 100,
        min_chunk_size: int = 30,
    ):
        if chunk_size <= 0:
            raise ValueError("chunk_size must be positive.")
        if chunk_overlap < 0:
            raise ValueError("chunk_overlap must be non-negative.")
        if chunk_overlap >= chunk_size:
            raise ValueError("chunk_overlap must be strictly less than chunk_size.")

        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size

    def chunk_text(self, text: str, source_doc: str = "resume") -> List[ResumeChunk]:
        """
        Splits plain text into overlapping ResumeChunk instances.
        """
        if not text or not text.strip():
            return []

        cleaned_text = text.strip()
        length = len(cleaned_text)

        # If total text is smaller than chunk size, return single chunk
        if length <= self.chunk_size:
            return [
                ResumeChunk(
                    index=0,
                    text=cleaned_text,
                    start_char=0,
                    end_char=length,
                    word_count=len(cleaned_text.split()),
                    source_doc=source_doc,
                )
            ]

        chunks: List[ResumeChunk] = []
        start = 0
        chunk_index = 0

        while start < length:
            target_end = min(start + self.chunk_size, length)

            if target_end == length:
                actual_end = length
            else:
                # Seek a natural break point (paragraph break, newline, sentence end, or space)
                # within the search window [target_end - overlap, target_end]
                search_window = cleaned_text[max(start, target_end - self.chunk_overlap):target_end]
                
                # Check for natural boundaries in order of preference
                break_offset = -1
                for delimiter in ["\n\n", "\n", ". ", "; ", ", ", " "]:
                    pos = search_window.rfind(delimiter)
                    if pos != -1:
                        # Position in cleaned_text
                        break_offset = max(start, target_end - self.chunk_overlap) + pos + len(delimiter.strip())
                        break

                if break_offset > start:
                    actual_end = break_offset
                else:
                    actual_end = target_end

            chunk_content = cleaned_text[start:actual_end].strip()

            if len(chunk_content) >= self.min_chunk_size:
                chunks.append(
                    ResumeChunk(
                        index=chunk_index,
                        text=chunk_content,
                        start_char=start,
                        end_char=actual_end,
                        word_count=len(chunk_content.split()),
                        source_doc=source_doc,
                    )
                )
                chunk_index += 1

            if actual_end >= length:
                break

            # Advance by step size (chunk_size - chunk_overlap)
            step = actual_end - start
            if step <= self.chunk_overlap:
                start = actual_end
            else:
                start = actual_end - self.chunk_overlap

        return chunks
