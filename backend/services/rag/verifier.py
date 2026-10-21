import re
from typing import List, Optional, Tuple

from schemas.analysis import RequirementMatch


class EvidenceVerifier:
    """
    Programmatic evidence verification service.
    
    Verifies that direct quotes returned by the LLM under `evidence` are genuine,
    verbatim substrings of the original extracted resume text rather than model hallucinations.
    
    Comparison Strategy:
    1. Direct verbatim substring search.
    2. Normalized substring search:
       - Strips surrounding quotes, markdown italics/bolds, and boundary whitespace.
       - Normalizes multi-character whitespace, linebreaks, and tabs into single spaces.
       - Normalizes unicode quotation marks (e.g. curly quotes “ ” ‘ ’ to standard quotes).
       - Normalizes dashes and hyphens (—, –, -).
       - Case-insensitive comparison if strict search fails.
    3. If neither search matches, the quotation is marked unverified.
    """

    @staticmethod
    def normalize_for_comparison(text: str) -> str:
        """Standardizes whitespace, quotes, and punctuation for fuzzy substring matching."""
        if not text:
            return ""

        # Normalize quotes and dashes
        s = text.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")
        s = s.replace("—", "-").replace("–", "-")

        # Collapse all whitespace and newlines to a single space
        s = re.sub(r"\s+", " ", s).strip()
        return s

    @classmethod
    def verify_quote(cls, quote: Optional[str], original_text: str) -> Tuple[bool, Optional[str]]:
        """
        Validates whether a quotation exists in the original resume text.
        Returns:
            Tuple[bool, Optional[str]]: (is_verified, cleaned_or_original_quote)
        """
        if quote is None:
            return True, None

        cleaned_quote = quote.strip()
        # Strip surrounding quotation marks if the LLM wrapped the text in quotes
        if (cleaned_quote.startswith('"') and cleaned_quote.endswith('"')) or \
           (cleaned_quote.startswith("'") and cleaned_quote.endswith("'")):
            cleaned_quote = cleaned_quote[1:-1].strip()

        if not cleaned_quote:
            return True, None

        if not original_text:
            return False, cleaned_quote

        # 1. Exact match
        if cleaned_quote in original_text:
            return True, cleaned_quote

        # 2. Normalized whitespace match
        norm_orig = cls.normalize_for_comparison(original_text)
        norm_quote = cls.normalize_for_comparison(cleaned_quote)

        if norm_quote in norm_orig:
            return True, cleaned_quote

        # 3. Case-insensitive normalized match
        if norm_quote.lower() in norm_orig.lower():
            return True, cleaned_quote

        # Quote could not be verified in the source text
        return False, cleaned_quote

    @classmethod
    def verify_matches(
        cls,
        matches: List[RequirementMatch],
        original_text: str,
    ) -> Tuple[List[RequirementMatch], int, int]:
        """
        Iterates across requirement matches, validates evidence quotations against the resume,
        updates verification flags, and adjusts explanation notes if evidence is unverified.
        
        Returns:
            Tuple[List[RequirementMatch], int, int]: (updated_matches, verified_count, unverified_count)
        """
        verified_count = 0
        unverified_count = 0

        for m in matches:
            if m.status == "not_demonstrated":
                # By definition, not demonstrated items have no evidence
                m.evidence = None
                m.evidence_verified = True
                continue

            if not m.evidence:
                m.evidence_verified = None
                continue

            is_verified, cleaned_quote = cls.verify_quote(m.evidence, original_text)
            m.evidence = cleaned_quote

            if is_verified:
                m.evidence_verified = True
                verified_count += 1
            else:
                m.evidence_verified = False
                m.is_inferred = True
                unverified_count += 1
                unverified_prefix = "[Unverified Citation: Quote could not be confirmed verbatim in source resume] "
                if not m.explanation.startswith(unverified_prefix):
                    m.explanation = f"{unverified_prefix}{m.explanation}"

        return matches, verified_count, unverified_count
