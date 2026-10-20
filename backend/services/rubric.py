from typing import List, Tuple
from schemas.analysis import RequirementMatch, ScoringBreakdown


def calculate_deterministic_score(
    matches: List[RequirementMatch],
) -> Tuple[int, ScoringBreakdown]:
    """
    Computes a transparent, deterministic match score strictly derived from
    requirement-level evaluation results.

    Scoring weights:
    - matched: 1.0 point (fully supported with direct resume evidence)
    - partially_matched: 0.5 points (partial skill overlap or inferred evidence)
    - not_demonstrated: 0.0 points (not mentioned or evidenced in the resume)

    The final score is: round((sum_of_points / total_requirements) * 100)
    Clamped strictly between 0 and 100.
    """
    total = len(matches)
    if total == 0:
        breakdown = ScoringBreakdown(
            total_requirements=0,
            matched_count=0,
            partially_matched_count=0,
            not_demonstrated_count=0,
            raw_points=0.0,
            max_possible_points=0.0,
            percentage=0,
            formula="N/A (No explicit requirements detected)",
            limitations=(
                "No explicit requirements were identified in the job description to evaluate."
            ),
        )
        return 0, breakdown

    matched_count = sum(1 for m in matches if m.status == "matched")
    partially_matched_count = sum(1 for m in matches if m.status == "partially_matched")
    not_demonstrated_count = sum(1 for m in matches if m.status == "not_demonstrated")

    raw_points = (matched_count * 1.0) + (partially_matched_count * 0.5)
    percentage = int(round((raw_points / total) * 100))
    percentage = max(0, min(100, percentage))

    breakdown = ScoringBreakdown(
        total_requirements=total,
        matched_count=matched_count,
        partially_matched_count=partially_matched_count,
        not_demonstrated_count=not_demonstrated_count,
        raw_points=round(raw_points, 1),
        max_possible_points=float(total),
        percentage=percentage,
        formula="(matched_count * 1.0 + partially_matched_count * 0.5) / total_requirements * 100",
        limitations=(
            "This match score is a transparent, deterministic calculation measuring only explicit resume keyword "
            "and experience overlap against the stated job requirements. It does not measure latent candidate capability, "
            "uncited skills, problem-solving depth, or cultural alignment. Absence of evidence in a resume indicates "
            "not demonstrated, not necessarily lack of competence."
        ),
    )

    return percentage, breakdown
