import os
import uuid
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse, JSONResponse

from app.config import settings
from app.api.schemas import (
    IngestionResponse,
    GenerateBriefRequest,
    ContentBriefJSON,
    TransformationRequest,
    TaskStatusResponse,
    VerificationRequest,
    VerificationResponse
)
from app.services.ingestion.parser import DocumentParser
from app.services.llm.brief_generator import ContentBriefGenerator
from app.services.provenance.ledger import ledger, BlockchainLedger
from app.tasks.transformation_tasks import (
    run_transformation_pipeline,
    celery_transform_task,
    get_task_status,
    update_task
)
from app.core.security import limiter

router = APIRouter(prefix="/api")

# ==============================================================================
# Health & Status
# ==============================================================================

@router.get("/status")
async def get_system_status():
    return {
        "status": "online",
        "service": "TransmuteAI",
        "environment": settings.ENVIRONMENT,
        "execution_mode": settings.EXECUTION_MODE,
        "llm_provider": settings.LLM_PROVIDER,
        "air_gapped_mode": settings.AIR_GAPPED_MODE,
        "models": {
            "gemini": settings.GEMINI_MODEL if settings.GEMINI_API_KEY else "No API key configured",
            "ollama": settings.OLLAMA_MODEL if settings.AIR_GAPPED_MODE else "disabled",
        },
        "ledger_blocks": len(ledger._load_chain()),
        "ledger_intact": ledger.verify_chain()
    }

# ==============================================================================
# Ingestion & PII Redaction
# ==============================================================================

@router.post("/ingest", response_model=IngestionResponse)
@limiter.limit("30/minute")
async def ingest_document(request: Request, file: UploadFile = File(...)):
    """
    Ingest PDF, DOCX, TXT, or Image file.
    Extracts text and applies PII sanitization.
    """
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
        result = DocumentParser.parse_file(file.filename, content)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

# ==============================================================================
# Content Brief Generation
# ==============================================================================

@router.post("/brief/generate", response_model=ContentBriefJSON)
@limiter.limit("20/minute")
async def generate_content_brief(request: Request, body: GenerateBriefRequest):
    """
    Synthesize raw/redacted text into the canonical Content Brief JSON format.
    Uses Gemini (or selected provider) with strict schema validation.
    """
    try:
        brief = await ContentBriefGenerator.generate_brief(
            text=body.raw_text,
            title=body.title,
            tone=body.tone or "authoritative",
            provider_name=body.provider,
            source_metadata={"document_id": body.document_id}
        )
        return brief
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Brief generation failed: {str(e)}")

# ==============================================================================
# Multi-Format Transformation
# ==============================================================================

@router.post("/transform", response_model=TaskStatusResponse)
@limiter.limit("20/minute")
async def trigger_transformation(
    request: Request,
    payload: TransformationRequest,
    background_tasks: BackgroundTasks
):
    """
    Dispatches parallel document generation and blockchain ledger anchoring.
    """
    task_id = f"task_{uuid.uuid4().hex[:12]}"
    brief_data = payload.brief.model_dump()
    formats = payload.formats or ["docx", "pptx", "social"]

    update_task(task_id, "PENDING", 0, "Queued for parallel multi-format synthesis")

    if settings.EXECUTION_MODE == "celery":
        try:
            celery_transform_task.delay(brief_data, formats, task_id)
        except Exception:
            # Fallback to direct background execution if Celery broker is unavailable
            background_tasks.add_task(run_transformation_pipeline, brief_data, formats, task_id)
    else:
        # Direct async background execution
        background_tasks.add_task(run_transformation_pipeline, brief_data, formats, task_id)

    return TaskStatusResponse(
        task_id=task_id,
        status="PENDING",
        progress=0,
        message="Transformation task successfully queued."
    )

@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def check_task_status(task_id: str):
    """Poll progress of a transformation task."""
    status_data = get_task_status(task_id)
    return TaskStatusResponse(**status_data)

# ==============================================================================
# Artifact Downloads
# ==============================================================================

@router.get("/artifacts/{brief_id}/download/{format_type}")
async def download_artifact(brief_id: str, format_type: str):
    brief_dir = Path(settings.ARTIFACTS_DIR) / brief_id

    file_mapping = {
        "docx": (brief_dir / f"{brief_id}_executive_summary.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        "executive_summary": (brief_dir / f"{brief_id}_executive_summary.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        "pptx": (brief_dir / f"{brief_id}_presentation.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
        "presentation": (brief_dir / f"{brief_id}_presentation.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
        "social": (brief_dir / f"{brief_id}_twitter_thread.md", "text/markdown"),
        "twitter": (brief_dir / f"{brief_id}_twitter_thread.md", "text/markdown"),
        "x": (brief_dir / f"{brief_id}_twitter_thread.md", "text/markdown"),
        "linkedin": (brief_dir / f"{brief_id}_linkedin_post.md", "text/markdown"),
        "video": (brief_dir / f"{brief_id}_video_package.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        "video_subtitles": (brief_dir / f"{brief_id}_video_package_subtitles.srt", "text/plain"),
        "advisory": (brief_dir / f"{brief_id}_strategic_advisory.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        "infographic": (brief_dir / f"{brief_id}_infographic_blueprint.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        "infographic_preview": (brief_dir / f"{brief_id}_infographic_blueprint_preview.html", "text/html"),
        "qr": (brief_dir / f"{brief_id}_qr.png", "image/png"),
    }

    normalized_format = format_type.lower().strip()
    if normalized_format not in file_mapping:
        raise HTTPException(status_code=400, detail=f"Invalid format '{format_type}'. Supported: {list(file_mapping.keys())}")

    target_file, media_type = file_mapping[normalized_format]
    if not target_file.exists():
        raise HTTPException(status_code=404, detail=f"Requested artifact '{target_file.name}' not found on server.")

    return FileResponse(
        path=str(target_file),
        media_type=media_type,
        filename=target_file.name
    )

# ==============================================================================
# Cryptographic Provenance Ledger
# ==============================================================================

@router.get("/provenance/{brief_id}")
async def get_provenance_details(brief_id: str):
    """Fetch blockchain ledger block for a given brief ID."""
    block = ledger.find_by_brief_id(brief_id)
    if not block:
        raise HTTPException(status_code=404, detail="No ledger entry found for this Brief ID.")
    return block

@router.get("/provenance/chain/audit")
async def audit_blockchain():
    """Returns the full blockchain ledger and verification status."""
    chain = ledger._load_chain()
    is_valid = ledger.verify_chain()
    return {
        "total_blocks": len(chain),
        "is_valid": is_valid,
        "chain": chain
    }

@router.post("/provenance/verify", response_model=VerificationResponse)
async def verify_provenance(body: VerificationRequest):
    """
    Verify whether an artifact hash or brief ID is anchored to the authentic blockchain ledger.
    """
    return ledger.verify_artifact(artifact_hash=body.artifact_hash, brief_id=body.brief_id)

@router.get("/provenance/verify")
async def verify_provenance_get(brief_id: Optional[str] = None, block_hash: Optional[str] = None):
    """Query parameter verification endpoint (used by QR codes)."""
    return ledger.verify_artifact(artifact_hash=block_hash, brief_id=brief_id)
