from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class ResumeAnalysisRequest(BaseModel):
    resume_text: str = Field(
        ...,
        min_length=20,
        max_length=50_000,
        description="Extracted plain text of the candidate resume",
    )
    job_description: str = Field(
        ...,
        min_length=20,
        max_length=20_000,
        description="Target job description with role requirements",
    )


class SkillCategory(BaseModel):
    category: str = Field(
        description="Category name (e.g., Languages, Frameworks, Cloud & DevOps, Databases, Soft Skills)"
    )
    skills: List[str] = Field(
        default_factory=list,
        description="List of skills explicitly demonstrated in the resume",
    )


class EducationItem(BaseModel):
    degree: str = Field(description="Degree name or certification title")
    institution: str = Field(description="University, college, or organization")
    year: Optional[str] = Field(
        default=None,
        description="Graduation year or date range if stated in resume",
    )


class WorkExperienceItem(BaseModel):
    role: str = Field(description="Job title or role name")
    company: str = Field(description="Company or organization name")
    duration: str = Field(description="Dates or duration as stated in the resume")
    description: str = Field(
        description="Concise factual description of responsibilities and technical context"
    )
    key_achievements: List[str] = Field(
        default_factory=list,
        description="Verifiable accomplishments or projects mentioned in the resume",
    )


class ProjectItem(BaseModel):
    name: str = Field(description="Project name or initiative title")
    description: str = Field(description="Brief summary of what was built or solved")
    technologies: List[str] = Field(
        default_factory=list,
        description="Technologies or frameworks used in this project",
    )


class RequirementMatch(BaseModel):
    requirement: str = Field(
        description="The specific job requirement extracted from the job description"
    )
    status: Literal["matched", "partially_matched", "not_demonstrated"] = Field(
        description="Whether the requirement is fully demonstrated, partially demonstrated, or not demonstrated"
    )
    evidence: Optional[str] = Field(
        default=None,
        description="Direct quote or factual resume evidence supporting this finding. Must be null if not demonstrated.",
    )
    explanation: str = Field(
        description="Concise rationale explaining the assignment based strictly on resume evidence"
    )
    is_inferred: bool = Field(
        default=False,
        description="True if this finding relies on reasonable inference rather than an explicit mention",
    )


class LLMAnalysisOutput(BaseModel):
    """Raw structured output expected from the LLM provider."""
    candidate_name: Optional[str] = Field(
        default="Candidate",
        description="Candidate full name extracted from resume",
    )
    candidate_title: Optional[str] = Field(
        default=None,
        description="Professional title or headline matching their experience",
    )
    profile_summary: str = Field(
        description="Objective factual summary of candidate background strictly derived from the resume"
    )
    skills_by_category: List[SkillCategory] = Field(
        default_factory=list,
        description="Skills grouped by technical or functional categories",
    )
    education: List[EducationItem] = Field(
        default_factory=list,
        description="Education, degrees, and certifications",
    )
    work_experience: List[WorkExperienceItem] = Field(
        default_factory=list,
        description="Work experience items in reverse chronological order",
    )
    projects: List[ProjectItem] = Field(
        default_factory=list,
        description="Projects or open source contributions",
    )
    job_requirements: List[str] = Field(
        default_factory=list,
        description="List of key requirements extracted from the target job description",
    )
    requirement_matches: List[RequirementMatch] = Field(
        default_factory=list,
        description="Evaluation of each requirement against resume evidence",
    )
    uncertainty_notes: List[str] = Field(
        default_factory=list,
        description="Notes on missing details, unstated technologies, or areas where the resume lacks clarity",
    )


class ScoringBreakdown(BaseModel):
    total_requirements: int
    matched_count: int
    partially_matched_count: int
    not_demonstrated_count: int
    raw_points: float
    max_possible_points: float
    percentage: int
    formula: str
    limitations: str


class ResumeAnalysisResponse(BaseModel):
    """Final validated response returned by the API endpoint."""
    candidate_name: str
    candidate_title: str
    profile_summary: str
    skills_by_category: List[SkillCategory]
    all_skills: List[str]
    education: List[EducationItem]
    work_experience: List[WorkExperienceItem]
    projects: List[ProjectItem]
    
    # Requirement categorization
    job_requirements: List[str]
    matched_requirements: List[RequirementMatch]
    partially_matched_requirements: List[RequirementMatch]
    unmatched_requirements: List[RequirementMatch]
    
    # Deterministic scoring
    match_score: int
    scoring_breakdown: ScoringBreakdown
    
    # Missing information and uncertainties
    uncertainty_notes: List[str]
    status: Literal["success"] = "success"
