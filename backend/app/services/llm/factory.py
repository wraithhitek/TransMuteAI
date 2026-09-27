import json
import logging
import asyncio
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

def _is_transient_network_error(err_str: str) -> bool:
    """Return True for connection-reset / stream-drop errors worth retrying."""
    transient_keywords = [
        "wsarecv", "forcibly closed", "connection reset",
        "stream reading error", "ConnectionResetError",
        "RemoteDisconnected", "IncompleteRead", "BrokenPipe",
    ]
    return any(kw.lower() in err_str.lower() for kw in transient_keywords)

class LLMProviderInterface(ABC):
    @abstractmethod
    async def generate_json(self, prompt: str, system_prompt: str) -> str:
        """Generates a raw JSON string conforming to the requested schema."""
        pass

class GeminiProvider(LLMProviderInterface):
    """
    Google Gemini Provider supporting both modern google-genai and legacy google.generativeai.
    Includes per-model retry with exponential backoff for transient network errors.
    """
    def __init__(self, api_key: str, model_name: str = "gemini-2.0-flash"):
        self.api_key = api_key
        self.model_name = model_name

    async def generate_json(self, prompt: str, system_prompt: str) -> str:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not set. Please provide a valid Google Gemini API key.")

        # Valid models as of 2026 — gemini-2.5-flash / gemini-3.x were retired for new users
        models_to_try = [self.model_name]
        for fallback in [
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash",
            "gemini-1.5-flash-8b",
        ]:
            if fallback not in models_to_try:
                models_to_try.append(fallback)

        last_error = None
        MAX_RETRIES = 3  # per-model retry attempts for transient errors

        async def _try_model_genai(client, config, m: str) -> Optional[str]:
            """Try one model with retry backoff. Returns text or raises."""
            nonlocal last_error
            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    response = await client.aio.models.generate_content(
                        model=m, contents=prompt, config=config
                    )
                    if response.text:
                        return response.text.strip()
                    return None
                except Exception as ex:
                    err_str = str(ex)
                    last_error = ex
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                        logger.warning(f"[{m}] Quota exceeded — skipping model entirely.")
                        raise  # don't retry quota errors, move to next model
                    if "404" in err_str or "NOT_FOUND" in err_str:
                        logger.warning(f"[{m}] Model retired/unavailable — skipping.")
                        raise
                    if _is_transient_network_error(err_str):
                        wait = 2 ** attempt
                        logger.warning(f"[{m}] Network drop (attempt {attempt}/{MAX_RETRIES}), retrying in {wait}s… ({ex})")
                        if attempt < MAX_RETRIES:
                            await asyncio.sleep(wait)
                            continue
                    logger.warning(f"[{m}] Failed: {ex}")
                    raise
            return None

        # 1. Primary: modern google-genai SDK
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)
            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                temperature=0.2,
                top_p=0.95,
            )

            for m in models_to_try:
                try:
                    result = await _try_model_genai(client, config, m)
                    if result:
                        logger.info(f"Gemini (google-genai) succeeded with model: {m}")
                        return result
                except Exception:
                    continue  # move to next model
        except ImportError:
            logger.debug("google-genai package not found, checking legacy google.generativeai...")

        # 2. Secondary fallback: legacy google.generativeai SDK
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)

            generation_config = {
                "temperature": 0.2,
                "top_p": 0.95,
                "response_mime_type": "application/json",
            }

            for m in models_to_try:
                for attempt in range(1, MAX_RETRIES + 1):
                    try:
                        model_obj = genai.GenerativeModel(
                            model_name=m,
                            system_instruction=system_prompt,
                            generation_config=generation_config
                        )
                        response = model_obj.generate_content(prompt)
                        if response.text:
                            logger.info(f"Gemini (legacy genai) succeeded with model: {m}")
                            return response.text.strip()
                        break
                    except Exception as ex:
                        err_str = str(ex)
                        last_error = ex
                        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                            logger.warning(f"[{m}] Legacy SDK quota exceeded — skipping.")
                            break
                        if "404" in err_str or "NOT_FOUND" in err_str:
                            logger.warning(f"[{m}] Legacy SDK model retired — skipping.")
                            break
                        if _is_transient_network_error(err_str):
                            wait = 2 ** attempt
                            logger.warning(f"[{m}] Legacy SDK network drop (attempt {attempt}/{MAX_RETRIES}), retrying in {wait}s…")
                            if attempt < MAX_RETRIES:
                                import time; time.sleep(wait)
                                continue
                        logger.warning(f"[{m}] Legacy SDK failed: {ex}")
                        break
        except Exception as e:
            logger.error(f"Gemini legacy SDK error: {e}")

        # 3. All Gemini models exhausted — fall back to deterministic MockLLMProvider
        logger.warning("All Gemini models failed (quota/network). Falling back to MockLLMProvider for this request.")
        return await MockLLMProvider().generate_json(prompt, system_prompt)


class OllamaProvider(LLMProviderInterface):
    """
    Local Air-Gapped LLM Provider via Ollama API.
    """
    def __init__(self, base_url: str = "http://localhost:11434", model_name: str = "llama3"):
        self.base_url = base_url.rstrip("/")
        self.model_name = model_name

    async def generate_json(self, prompt: str, system_prompt: str) -> str:
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model_name,
            "prompt": f"System: {system_prompt}\n\nUser: {prompt}",
            "format": "json",
            "stream": False,
            "options": {"temperature": 0.2}
        }
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("response", "{}").strip()

class OpenAIProvider(LLMProviderInterface):
    """
    OpenAI Cloud Provider fallback.
    """
    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model_name = model_name

    async def generate_json(self, prompt: str, system_prompt: str) -> str:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is not configured.")
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

class MockLLMProvider(LLMProviderInterface):
    """
    Deterministic Heuristic Mock Provider.
    Ensures unit tests, offline development, and zero-key trials generate valid ContentBriefJSON.
    """
    async def generate_json(self, prompt: str, system_prompt: str) -> str:
        # Extract keywords / topics from prompt
        words = [w.strip(".,;:?!()\"'") for w in prompt.split() if len(w) > 4]
        topics = list(dict.fromkeys(words))[:6] or ["Transformation", "Intelligence", "Scalability"]
        topic_str = ", ".join(topics[:3])

        mock_payload = {
            "brief_id": "brief_mock_001",
            "title": f"Strategic Analysis: {topic_str.title()}",
            "tone": "authoritative",
            "summary": f"This analysis synthesizes key intelligence around {topic_str}. It outlines core operational imperatives, strategic risk vectors, and implementation roadmaps for optimal multi-format deployment.",
            "entities_extracted": topics,
            "executive_summary": {
                "headline": f"Operational Imperatives for {topics[0].title() if topics else 'Next-Gen Transformation'}",
                "context": "Rapid technological evolution demands unified content synthesis across heterogeneous formats with immutable auditability.",
                "key_findings": [
                    f"Cross-format multi-modal extraction reduces latency across {topics[0] if topics else 'workflows'}.",
                    "Structured intermediate JSON schemas eliminate semantic drift between executive and presentation layers.",
                    "SHA-256 cryptographic provenance provides tamper-proof verification for distributed compliance."
                ],
                "strategic_recommendations": [
                    "Institutionalize automated PII redaction at the ingestion gateway.",
                    "Deploy Celery/direct hybrid execution to optimize throughput across diverse environments.",
                    "Embed scannable verification QR codes directly into generated executive deliverables."
                ]
            },
            "presentation_outline": [
                {
                    "slide_number": 1,
                    "title": f"TransmuteAI: {topic_str.title()}",
                    "bullet_points": [
                        "Automated Content Transformation Platform",
                        "Cross-Format Semantic Parity",
                        "Cryptographic Blockchain Provenance"
                    ],
                    "speaker_notes": "Welcome stakeholders. Today we review the automated transformation roadmap and verified delivery pipeline."
                },
                {
                    "slide_number": 2,
                    "title": "Architectural Foundation & Ingestion",
                    "bullet_points": [
                        "Multi-modal ingestion of PDF, DOCX, and OCR sources",
                        "Deterministic PII redaction preventing sensitive data leakage",
                        "Canonical Content Brief JSON intermediate representation"
                    ],
                    "speaker_notes": "Highlight the security perimeter and how the normalized schema eliminates hallucinations across channels."
                },
                {
                    "slide_number": 3,
                    "title": "Multi-Format Synthesis & Verified Delivery",
                    "bullet_points": [
                        "Parallel DOCX executive brief rendering with embedded QR codes",
                        "Dynamic 16:9 presentation slide generation",
                        "Engaging, hook-driven social threads with hash-chained provenance"
                    ],
                    "speaker_notes": "Emphasize how outputs remain perfectly consistent because they all derive from the exact same brief."
                }
            ],
            "social_media_thread": [
                {
                    "post_number": 1,
                    "content": f"🚨 Transforming how enterprise intelligence moves: Today we are examining {topics[0] if topics else 'content transformation'}. How can teams generate Docs, Decks, Threads, and Video from a single source without losing semantic accuracy? 🧵👇",
                    "hashtags": ["GenAI", "Automation", "TechArchitecture"]
                },
                {
                    "post_number": 2,
                    "content": "1/ The Secret: A structured intermediate JSON schema. Rather than generating formats independently, a unified Content Brief enforces 100% factual consistency across executive summaries and slides.",
                    "hashtags": ["Architecture", "Productivity"]
                },
                {
                    "post_number": 3,
                    "content": "2/ Trust & Verification: Every generated document is cryptographically fingerprinted (SHA-256) and logged to an immutable ledger with scannable QR verification.",
                    "hashtags": ["Blockchain", "Security", "Provenance"]
                }
            ],
            "linkedin_post": {
                "hook": f"Most AI transformation projects fail for one simple reason: cross-channel semantic drift.\n\nHere is how leading engineering teams are solving it in 2026 ⬇️",
                "body": f"When you ask an LLM to generate an Executive Summary, a Slide Deck, a Video Script, and a LinkedIn post separately, each output hallucinates subtle differences.\n\nThe breakthrough architecture is decoupling synthesis from rendering.\n\nBy first generating a canonical, schema-enforced Content Brief JSON, downstream renderers have a single, immutable source of truth.",
                "bullet_insights": [
                    f"Zero Semantic Drift: The facts in your DOCX match your PPTX, video script, and advisory memo 100%.",
                    "Automated PII Redaction: Sanitizes emails, SSNs, and phone numbers at the ingestion gateway before model prompting.",
                    "Cryptographic Provenance: Every deliverable receives a SHA-256 hash anchored to a verifiable blockchain ledger."
                ],
                "call_to_action": "How is your organization currently enforcing factual consistency across multi-channel AI content? Let's discuss below.",
                "hashtags": ["ArtificialIntelligence", "EnterpriseArchitecture", "GenerativeAI", "Innovation"]
            },
            "video_package": {
                "concept": f"Cinematic 60-second explainer examining {topic_str} with dynamic motion graphics and split-screen telemetry.",
                "target_duration": "60-75 seconds",
                "storyboard": [
                    {
                        "scene_number": 1,
                        "timestamp": "0:00 - 0:15",
                        "visual_description": "Wide shot of a modern enterprise command center with abstract glowing blue data streams converging into a central prism.",
                        "narration": f"In an era of information overload, transforming complex intelligence around {topics[0] if topics else 'enterprise data'} into actionable formats is the ultimate competitive advantage.",
                        "audio_cues": "Subtle deep sub-bass synth pulse rising with a crisp digital shimmer",
                        "b_roll_recommendations": ["Aerial shot of corporate headquarters at dusk", "Macro shot of fiber optic cables glowing"]
                    },
                    {
                        "scene_number": 2,
                        "timestamp": "0:15 - 0:35",
                        "visual_description": "Split screen: On the left, raw unstructured documents; on the right, synchronized Executive DOCX, 16:9 Presentation Deck, and Video Scripts materializing in parallel.",
                        "narration": "TransmuteAI solves the semantic drift problem. By compiling raw inputs into a canonical JSON brief, every deliverable speaks with 100% factual precision.",
                        "audio_cues": "Energetic rhythmic percussion enters, establishing forward momentum",
                        "b_roll_recommendations": ["Close-up of analyst interacting with glass touchscreen UI", "3D floating schema nodes locking into place"]
                    },
                    {
                        "scene_number": 3,
                        "timestamp": "0:35 - 0:60",
                        "visual_description": "Close-up of a cryptographic verification QR code illuminating on an executive brief, with green blockchain confirmation checkmarks.",
                        "narration": "Verified by SHA-256 cryptographic provenance. Trustworthy intelligence, delivered at scale.",
                        "audio_cues": "Harmonic crescendo settling into a warm corporate resolve",
                        "b_roll_recommendations": ["Smartphone camera focusing on QR code displaying authentic badge", "TransmuteAI logo reveal animation"]
                    }
                ],
                "subtitles_srt": "1\n00:00:00,000 --> 00:00:05,000\nIn an era of information overload...\n\n2\n00:00:05,000 --> 00:00:15,000\nTransforming complex intelligence is the ultimate advantage.\n\n3\n00:00:15,000 --> 00:00:25,000\nTransmuteAI solves cross-format semantic drift.\n\n4\n00:00:25,000 --> 00:00:35,000\nEvery deliverable speaks with 100% factual precision.\n\n5\n00:00:35,000 --> 00:00:50,000\nVerified by SHA-256 cryptographic provenance.\n"
            },
            "advisory_document": {
                "executive_mandate": f"Establish institutional governance and automated synthesis pipelines for {topic_str} across all business units.",
                "strategic_context": "Disparate documentation formats cause significant cognitive load and compliance latency. Cross-functional leadership requires unified advisory intelligence with verifiable data integrity.",
                "risk_matrix": [
                    {
                        "risk_factor": "Cross-Format Hallucination & Discrepancies",
                        "severity": "Critical",
                        "likelihood": "High",
                        "mitigation_strategy": "Enforce canonical JSON intermediate schema validation before any renderer invocation."
                    },
                    {
                        "risk_factor": "PII & Regulatory Non-Compliance",
                        "severity": "High",
                        "likelihood": "Medium",
                        "mitigation_strategy": "Mandate perimeter regex sanitization for SSNs, payment data, and contact info at ingestion."
                    },
                    {
                        "risk_factor": "Deliverable Tampering & Audit Failure",
                        "severity": "High",
                        "likelihood": "Low",
                        "mitigation_strategy": "Anchor SHA-256 file fingerprints to an immutable cryptographic blockchain ledger with scannable QR verification."
                    }
                ],
                "phased_roadmap": [
                    {
                        "phase": "Phase 1: Ingestion & Perimeter Hardening",
                        "timeframe": "0-30 Days",
                        "actions": [
                            "Deploy automated PII redaction filters across all document dropzones",
                            "Calibrate OCR thresholding for multi-modal contract scans"
                        ]
                    },
                    {
                        "phase": "Phase 2: Canonical Schema & Parallel Rendering",
                        "timeframe": "30-60 Days",
                        "actions": [
                            "Integrate Content Brief JSON intermediate schemas across business analysts",
                            "Automate synchronized generation of Executive DOCX and 16:9 Presentation decks"
                        ]
                    },
                    {
                        "phase": "Phase 3: Cryptographic Provenance Scaling",
                        "timeframe": "60-90 Days",
                        "actions": [
                            "Connect internal verification APIs to the persistent ledger chain",
                            "Roll out QR-based document authenticity scanning for board stakeholders"
                        ]
                    }
                ],
                "governance_framework": [
                    "All generated content must preserve cryptographic block receipts for 7 years.",
                    "No raw unredacted PII is permitted to enter the LLM inference boundary.",
                    "Dual-execution fallback (Celery/Direct) must be maintained for business continuity."
                ]
            },
            "infographic": {
                "headline": f"Visualizing the Future of {topic_str.title()}",
                "narrative_flow": "Problem ➔ Architectural Solution ➔ Key Metrics ➔ Strategic Impact",
                "color_palette": ["#0F172A", "#2563EB", "#06B6D4", "#10B981"],
                "sections": [
                    {
                        "section_title": "The Operational Bottleneck",
                        "key_stat": "73% Factual Drift",
                        "visual_layout_directive": "Split warning gauge showing semantic divergence across traditional multi-channel workflows",
                        "supporting_text": "Independent generation leads to inconsistent figures between executive decks and public communications."
                    },
                    {
                        "section_title": "Canonical Intermediate Architecture",
                        "key_stat": "100% Parity",
                        "visual_layout_directive": "Central glowing diamond hub distributing identical data vectors into Docs, Decks, and Videos",
                        "supporting_text": "A structured JSON intermediate representation guarantees that every format reflects identical source facts."
                    },
                    {
                        "section_title": "Automated Perimeter Security",
                        "key_stat": "0 Leaks",
                        "visual_layout_directive": "Shield diagram with 5-point defensive filtering representing emails, phones, SSNs, cards, and IPs",
                        "supporting_text": "Zero-trust PII sanitization removes sensitive entities before prompt dispatch."
                    },
                    {
                        "section_title": "Cryptographic Trust Anchor",
                        "key_stat": "SHA-256 Chained",
                        "visual_layout_directive": "Linked blockchain sequence culminating in a scannable verification QR code",
                        "supporting_text": "Instant tamper detection allows any external party to verify deliverable authenticity in real-time."
                    }
                ],
                "footer_callout": "TransmuteAI • Enterprise Content Transformation Platform • Verified Provenance"
            },
            "target_formats": ["executive_summary", "presentation", "twitter", "linkedin", "video", "advisory", "infographic"],
            "source_metadata": {"parser": "HeuristicEngine", "mode": "MockTesting"}
        }
        return json.dumps(mock_payload)

def get_llm_provider(provider_name: Optional[str] = None) -> LLMProviderInterface:
    """
    Factory returning the selected LLM Provider based on argument or environment.
    """
    # Prioritize Gemini when API key is set and no explicit provider_name is given
    if settings.GEMINI_API_KEY and not provider_name:
        choice = "gemini"
    else:
        choice = (provider_name or settings.LLM_PROVIDER).lower()

    if choice == "gemini":
        if settings.GEMINI_API_KEY:
            return GeminiProvider(api_key=settings.GEMINI_API_KEY, model_name=settings.GEMINI_MODEL)
        else:
            logger.warning("GEMINI_API_KEY is not set. Falling back to MockLLMProvider for offline execution.")
            return MockLLMProvider()

    elif choice == "ollama":
        return OllamaProvider(base_url=settings.OLLAMA_BASE_URL, model_name=settings.OLLAMA_MODEL)

    elif choice == "openai":
        if settings.OPENAI_API_KEY:
            return OpenAIProvider(api_key=settings.OPENAI_API_KEY, model_name=settings.OPENAI_MODEL)
        else:
            logger.warning("OPENAI_API_KEY is not set. Falling back to MockLLMProvider.")
            return MockLLMProvider()

    return MockLLMProvider()
