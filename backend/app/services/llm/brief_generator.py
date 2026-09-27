import json
import re
import uuid
import logging
from typing import Optional, Dict, Any

from app.api.schemas import ContentBriefJSON
from app.services.llm.factory import get_llm_provider, LLMProviderInterface

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are TransmuteAI, an elite Content Synthesis & Architecture AI.
Your objective is to ingest document text and synthesize it into a comprehensive, canonical "Content Brief JSON" intermediate format that drives 7 distinct human-grade output formats:
1. Video Package (Script, storyboard, scenes, narration, audio cues, b-roll, SRT subtitles)
2. Professional LinkedIn Post (Hook, white-space body, bullet insights, CTA, hashtags)
3. Twitter/X Thread (Viral hook tweet, numbered insights, closing engagement tweet)
4. Strategic Advisory Document (Executive mandate, strategic risk matrix, phased roadmap, governance)
5. Infographic Specification (Layout recommendations, narrative flow, key metrics/stats, visual directives)
6. Executive Summary (Concise briefing, headline, findings, strategic recommendations)
7. Presentation Outline (16:9 slides, bullet hierarchy, presenter speaker notes)

STRICT CONSTRAINTS:
1. Output ONLY a valid JSON object matching the requested schema. No conversational preambles or postscripts.
2. 100% FACTUAL CONSISTENCY: Every output format MUST align identically with the source document facts.
3. HUMAN-GRADE QUALITY:
   - LinkedIn: Write like an elite top-voice executive (punchy hook, clean line breaks, high-signal takeaways, thoughtful engagement question).
   - Twitter/X: High-velocity viral threads with clear numbering (1/N), bold statements, and compelling pacing.
   - Video: Professional cinematography prompts, realistic timestamp pacing (0:00 - 0:15, etc.), cinematic audio cues, and proper SRT subtitle formatting.
   - Advisory: McKinsey/Gartner caliber strategic tone with concrete risk likelihood/severity metrics and 30-60-90 day roadmaps.
   - Infographic: Clear visual storytelling (Problem -> Solution -> Metrics -> Impact) with specific chart types (donut chart, chevron flow, stat gauges).

JSON SCHEMA TEMPLATE:
{
  "brief_id": "<string>",
  "title": "<concise title>",
  "tone": "authoritative" | "professional" | "conversational" | "urgent",
  "summary": "<comprehensive overview>",
  "entities_extracted": ["<entity1>", "<entity2>"],
  "executive_summary": {
    "headline": "<strategic headline>",
    "context": "<context paragraph>",
    "key_findings": ["<finding 1>", "<finding 2>", "<finding 3>"],
    "strategic_recommendations": ["<rec 1>", "<rec 2>", "<rec 3>"]
  },
  "presentation_outline": [
    {
      "slide_number": 1,
      "title": "<slide title>",
      "bullet_points": ["<bullet 1>", "<bullet 2>", "<bullet 3>"],
      "speaker_notes": "<speaker guidance>"
    }
  ],
  "social_media_thread": [
    {
      "post_number": 1,
      "content": "<engaging hook and insight>",
      "hashtags": ["<tag1>", "<tag2>"]
    }
  ],
  "linkedin_post": {
    "hook": "<curiosity-inducing 1-2 line opening hook>",
    "body": "<insightful narrative structured with paragraph spacing>",
    "bullet_insights": ["<key takeaway 1>", "<key takeaway 2>", "<key takeaway 3>"],
    "call_to_action": "<thought-provoking question to drive comments>",
    "hashtags": ["<tag1>", "<tag2>"]
  },
  "video_package": {
    "concept": "<cinematic concept overview>",
    "target_duration": "60-90 seconds",
    "storyboard": [
      {
        "scene_number": 1,
        "timestamp": "0:00 - 0:15",
        "visual_description": "<camera angle, lighting, visual elements>",
        "narration": "<spoken voiceover script>",
        "audio_cues": "<music and SFX direction>",
        "b_roll_recommendations": ["<b-roll shot 1>", "<b-roll shot 2>"]
      }
    ],
    "subtitles_srt": "1\\n00:00:00,000 --> 00:00:05,000\\n<Subtitle line>\\n"
  },
  "advisory_document": {
    "executive_mandate": "<high-level imperative>",
    "strategic_context": "<operational and market context>",
    "risk_matrix": [
      {
        "risk_factor": "<risk>",
        "severity": "Critical" | "High" | "Medium",
        "likelihood": "High" | "Medium" | "Low",
        "mitigation_strategy": "<actionable mitigation>"
      }
    ],
    "phased_roadmap": [
      {
        "phase": "Phase 1: Immediate Stabilization",
        "timeframe": "0-30 Days",
        "actions": ["<action 1>", "<action 2>"]
      }
    ],
    "governance_framework": ["<compliance directive 1>", "<compliance directive 2>"]
  },
  "infographic": {
    "headline": "<graphic banner headline>",
    "narrative_flow": "Problem -> Solution -> Metrics -> Impact",
    "color_palette": ["#0F172A", "#2563EB", "#06B6D4", "#10B981"],
    "sections": [
      {
        "section_title": "<section title>",
        "key_stat": "<prominent metric e.g. 99.4% Redaction>",
        "visual_layout_directive": "<e.g. Circular progress meter with neon cyan glow>",
        "supporting_text": "<concise description>"
      }
    ],
    "footer_callout": "Verified via TransmuteAI Cryptographic Provenance"
  },
  "target_formats": ["executive_summary", "presentation", "twitter", "linkedin", "video", "advisory", "infographic"]
}
"""

class ContentBriefGenerator:
    """
    Orchestrates LLM inference to produce canonical ContentBriefJSON.
    """

    @classmethod
    def clean_json_string(cls, raw_response: str) -> str:
        """Strip markdown fences (```json ... ```) or whitespace."""
        text = raw_response.strip()
        # Remove markdown code fence if present
        text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'\s*```$', '', text, flags=re.MULTILINE)
        return text.strip()

    @classmethod
    async def generate_brief(
        cls,
        text: str,
        title: Optional[str] = "Executive Analysis",
        tone: str = "authoritative",
        provider_name: Optional[str] = None,
        source_metadata: Optional[Dict[str, Any]] = None
    ) -> ContentBriefJSON:
        provider: LLMProviderInterface = get_llm_provider(provider_name)
        
        brief_id = f"brief_{uuid.uuid4().hex[:12]}"
        user_prompt = f"""Synthesize the following document content into the canonical Content Brief JSON format.
Document Title: {title}
Desired Tone: {tone}
Generated Brief ID: {brief_id}

DOCUMENT TEXT:
---
{text}
---
"""
        try:
            raw_json_str = await provider.generate_json(prompt=user_prompt, system_prompt=SYSTEM_PROMPT)
            cleaned = cls.clean_json_string(raw_json_str)
            data = json.loads(cleaned)

            # Ensure brief_id, title, tone and metadata are properly assigned
            data["brief_id"] = data.get("brief_id") or brief_id
            if title:
                data["title"] = title
            if tone:
                data["tone"] = tone
            data["source_metadata"] = source_metadata or {}
            if "target_formats" not in data:
                data["target_formats"] = ["docx", "pptx", "social"]

            # Validate against Pydantic model
            return ContentBriefJSON(**data)

        except Exception as e:
            logger.warning(f"Error generating brief with {provider.__class__.__name__}: {e}. Falling back to deterministic brief generator.")
            # Fallback to MockLLMProvider to guarantee schema validity
            from app.services.llm.factory import MockLLMProvider
            mock = MockLLMProvider()
            mock_str = await mock.generate_json(prompt=text, system_prompt=SYSTEM_PROMPT)
            mock_data = json.loads(mock_str)
            mock_data["brief_id"] = brief_id
            mock_data["title"] = title or mock_data.get("title", "Executive Analysis")
            mock_data["source_metadata"] = source_metadata or {}
            return ContentBriefJSON(**mock_data)
