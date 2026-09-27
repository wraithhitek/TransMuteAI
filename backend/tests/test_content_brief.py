import pytest
from app.services.llm.brief_generator import ContentBriefGenerator
from app.api.schemas import ContentBriefJSON

@pytest.mark.asyncio
async def test_content_brief_generation_mock():
    text = (
        "Enterprise intelligence transformation requires robust multi-modal data ingestion. "
        "We are modernizing architectures using FastAPI, Next.js, and Google Gemini. "
        "The objective is to eliminate hallucination across diverse documentation formats."
    )
    brief = await ContentBriefGenerator.generate_brief(
        text=text,
        title="Modernizing AI Architecture",
        tone="authoritative",
        provider_name="mock"
    )

    assert isinstance(brief, ContentBriefJSON)
    assert brief.title == "Modernizing AI Architecture"
    assert brief.tone == "authoritative"
    assert len(brief.executive_summary.key_findings) > 0
    assert len(brief.presentation_outline) >= 2
    assert len(brief.social_media_thread) >= 2

def test_clean_json_string():
    raw_with_fences = """```json
{"brief_id": "test", "title": "Test Title"}
```"""
    cleaned = ContentBriefGenerator.clean_json_string(raw_with_fences)
    assert cleaned.startswith("{")
    assert cleaned.endswith("}")
    assert "```" not in cleaned
