from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone

# ==============================================================================
# Multi-Format Sub-Brief Schemas
# ==============================================================================

class VideoScene(BaseModel):
    scene_number: int = Field(..., description="Ordered scene index")
    timestamp: str = Field(..., description="Estimated timestamp range (e.g., '0:00 - 0:15')")
    visual_description: str = Field(..., description="Detailed storyboard cinematography, camera angle, and on-screen visuals")
    narration: str = Field(..., description="Spoken voiceover / narrative script")
    audio_cues: str = Field(default="Ambient tech background score", description="Sound effects (SFX) and musical cues")
    b_roll_recommendations: List[str] = Field(default_factory=list, description="Recommended stock footage or 3D animations")

class VideoPackageBrief(BaseModel):
    concept: str = Field(default="High-impact strategic video narrative", description="Overall creative concept")
    target_duration: str = Field(default="60-90 seconds", description="Target video run-time")
    storyboard: List[VideoScene] = Field(default_factory=list, description="Scene-by-scene storyboard and script")
    subtitles_srt: str = Field(default="", description="Ready-to-use SubRip (.srt) subtitle stream")

class LinkedInPostBrief(BaseModel):
    hook: str = Field(default="", description="High-converting curiosity hook line")
    body: str = Field(default="", description="Main narrative structured with white space for readability")
    bullet_insights: List[str] = Field(default_factory=list, description="Key actionable takeaways formatted for mobile feeds")
    call_to_action: str = Field(default="What are your thoughts on this? Let's discuss in the comments.", description="Engagement CTA")
    hashtags: List[str] = Field(default_factory=list, description="Targeted high-engagement LinkedIn hashtags")

class SocialThreadPost(BaseModel):
    post_number: int = Field(..., description="Index in thread sequence (1-indexed)")
    content: str = Field(..., description="Engaging post content with hook or key takeaway")
    hashtags: List[str] = Field(default_factory=list, description="Relevant trend hashtags")

class RiskMatrixItem(BaseModel):
    risk_factor: str = Field(..., description="Identified organizational or technical risk")
    severity: str = Field("High", description="Severity level (Low, Medium, High, Critical)")
    likelihood: str = Field("Medium", description="Likelihood of occurrence")
    mitigation_strategy: str = Field(..., description="Tactical mitigation measure")

class PhasedActionItem(BaseModel):
    phase: str = Field(..., description="Phase identifier (e.g. 'Phase 1: Immediate Stabilization')")
    timeframe: str = Field(..., description="Timeline (e.g. '0-30 Days')")
    actions: List[str] = Field(default_factory=list, description="Concrete milestones")

class AdvisoryBrief(BaseModel):
    executive_mandate: str = Field(default="", description="Strategic objective and mandate")
    strategic_context: str = Field(default="", description="Industry context and driving factors")
    risk_matrix: List[RiskMatrixItem] = Field(default_factory=list, description="Risk assessment matrix")
    phased_roadmap: List[PhasedActionItem] = Field(default_factory=list, description="Actionable phased execution roadmap")
    governance_framework: List[str] = Field(default_factory=list, description="Policy and compliance directives")

class InfographicSection(BaseModel):
    section_title: str = Field(..., description="Section or quadrant header")
    key_stat: str = Field(..., description="Prominent data metric or callout statistic")
    visual_layout_directive: str = Field(..., description="Layout design guideline (e.g. 3-step chevron, circular gauge)")
    supporting_text: str = Field(..., description="Concise explainer text")

class InfographicBrief(BaseModel):
    headline: str = Field(default="", description="Infographic banner title")
    narrative_flow: str = Field(default="Problem ➔ Solution ➔ Impact", description="Visual storytelling progression")
    color_palette: List[str] = Field(default_factory=lambda: ["#0F172A", "#2563EB", "#06B6D4", "#10B981"], description="Hex color scheme")
    sections: List[InfographicSection] = Field(default_factory=list, description="Data quadrants and visual blocks")
    footer_callout: str = Field(default="Verified via TransmuteAI Cryptographic Provenance", description="Footer attribution")

class ExecutiveSummaryBrief(BaseModel):
    headline: str = Field(..., description="High-impact title/headline for the executive summary")
    context: str = Field(..., description="Overview and background context")
    key_findings: List[str] = Field(default_factory=list, description="Core analytical observations and findings")
    strategic_recommendations: List[str] = Field(default_factory=list, description="Actionable future recommendations")

class PresentationSlideBrief(BaseModel):
    slide_number: int = Field(..., description="Ordered slide index (1-indexed)")
    title: str = Field(..., description="Slide title")
    bullet_points: List[str] = Field(default_factory=list, description="Concise presentation bullet points")
    speaker_notes: str = Field("", description="Guidance notes for the presenter")

# ==============================================================================
# Canonical Master Content Brief JSON
# ==============================================================================

class ContentBriefJSON(BaseModel):
    brief_id: str = Field(..., description="Unique UUID for this content brief")
    title: str = Field(..., description="Overall title of the content source")
    tone: str = Field("authoritative", description="Tone of voice")
    summary: str = Field(..., description="Comprehensive high-level summary of the entire content")
    entities_extracted: List[str] = Field(default_factory=list, description="Identified entities, concepts, and topics")

    # Specific Output Format Modules
    executive_summary: ExecutiveSummaryBrief
    presentation_outline: List[PresentationSlideBrief]
    social_media_thread: List[SocialThreadPost]
    video_package: Optional[VideoPackageBrief] = None
    linkedin_post: Optional[LinkedInPostBrief] = None
    advisory_document: Optional[AdvisoryBrief] = None
    infographic: Optional[InfographicBrief] = None

    target_formats: List[str] = Field(
        default=["executive_summary", "presentation", "twitter", "linkedin", "video", "advisory", "infographic"],
        description="Selected formats for generation"
    )
    source_metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata about the source document")
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ==============================================================================
# Ingestion API Schemas
# ==============================================================================

class RedactedItem(BaseModel):
    type: str = Field(..., description="PII category: EMAIL, PHONE, SSN, CREDIT_CARD, IP")
    original_masked: str = Field(..., description="Partially masked original value for audit")
    replacement: str = Field(..., description="Placeholder substituted in text")

class IngestionResponse(BaseModel):
    document_id: str
    filename: str
    file_type: str
    raw_character_count: int
    redacted_character_count: int
    redaction_count: int
    redactions: List[RedactedItem]
    redacted_text: str
    preview: str

class GenerateBriefRequest(BaseModel):
    document_id: Optional[str] = None
    title: Optional[str] = "Executive Analysis"
    raw_text: str = Field(..., min_length=10, description="Text to synthesize into Content Brief")
    tone: Optional[str] = "authoritative"
    provider: Optional[str] = None
    target_formats: Optional[List[str]] = None

# ==============================================================================
# Transformation & Task Schemas
# ==============================================================================

class TransformationRequest(BaseModel):
    brief: ContentBriefJSON
    formats: List[str] = Field(
        default=["executive_summary", "presentation", "twitter", "linkedin", "video", "advisory", "infographic"],
        description="Target formats to render"
    )

class TaskStatusResponse(BaseModel):
    task_id: str
    status: str  # PENDING, PROCESSING, COMPLETED, FAILED
    progress: int  # 0 to 100
    message: Optional[str] = None
    artifacts: Optional[Dict[str, str]] = None  # format -> download_url
    ledger_entry: Optional[Dict[str, Any]] = None
    qr_code_url: Optional[str] = None
    error: Optional[str] = None

# ==============================================================================
# Blockchain Provenance Schemas
# ==============================================================================

class BlockchainBlock(BaseModel):
    index: int
    timestamp: str
    brief_id: str
    source_hash: str
    artifact_hashes: Dict[str, str]
    previous_hash: str
    nonce: int
    block_hash: str

class VerificationRequest(BaseModel):
    artifact_hash: Optional[str] = None
    brief_id: Optional[str] = None

class VerificationResponse(BaseModel):
    verified: bool
    status: str
    block_index: Optional[int] = None
    timestamp: Optional[str] = None
    brief_id: Optional[str] = None
    source_hash: Optional[str] = None
    artifact_hashes: Optional[Dict[str, str]] = None
    block_hash: Optional[str] = None
    previous_hash: Optional[str] = None
    chain_valid: bool = True
