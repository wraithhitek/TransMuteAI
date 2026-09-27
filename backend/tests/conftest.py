import sys
from pathlib import Path
import pytest

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.api.schemas import ContentBriefJSON, ExecutiveSummaryBrief, PresentationSlideBrief, SocialThreadPost

@pytest.fixture
def sample_brief():
    return ContentBriefJSON(
        brief_id="brief_test_123",
        title="AI Operational Resilience Brief",
        tone="authoritative",
        summary="Strategic assessment of autonomous AI systems operating across distributed microservice infrastructures.",
        entities_extracted=["FastAPI", "Celery", "Blockchain", "Gemini"],
        executive_summary=ExecutiveSummaryBrief(
            headline="Operational Resilience in Distributed AI",
            context="Enterprise deployments require immutable provenance and cross-format semantic fidelity.",
            key_findings=[
                "Multi-modal extraction ensures uniform data normalization.",
                "Intermediate JSON schemas prevent cross-format factual drift.",
                "Cryptographic SHA-256 ledgers guarantee auditable compliance."
            ],
            strategic_recommendations=[
                "Deploy automated PII redaction at the perimeter.",
                "Adopt dual-mode task execution for hybrid serverless/worker topologies.",
                "Incorporate QR-anchored ledger verification on all outputs."
            ]
        ),
        presentation_outline=[
            PresentationSlideBrief(
                slide_number=1,
                title="AI Operational Resilience",
                bullet_points=["Enterprise Architecture", "Factual Consistency", "Immutable Provenance"],
                speaker_notes="Welcome executive stakeholders to the resilience briefing."
            ),
            PresentationSlideBrief(
                slide_number=2,
                title="Cross-Format Synthesis",
                bullet_points=["Single source of truth via canonical JSON", "Synchronized generation across Docs and Decks"],
                speaker_notes="Note how both deliverables reflect identical facts."
            )
        ],
        social_media_thread=[
            SocialThreadPost(
                post_number=1,
                content="How do you guarantee 100% semantic consistency when generating docs and slide decks with GenAI? Thread 🧵👇",
                hashtags=["GenAI", "Architecture"]
            ),
            SocialThreadPost(
                post_number=2,
                content="The answer: A canonical Content Brief JSON intermediate layer.",
                hashtags=["DevOps", "Innovation"]
            )
        ],
        target_formats=["docx", "pptx", "social"]
    )
