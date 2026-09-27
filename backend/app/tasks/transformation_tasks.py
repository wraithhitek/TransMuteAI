import os
import uuid
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

from app.config import settings
from app.api.schemas import ContentBriefJSON
from app.services.renderers.docx_renderer import DOCXRenderer
from app.services.renderers.pptx_renderer import PPTXRenderer
from app.services.renderers.social_renderer import LinkedInRenderer, TwitterRenderer
from app.services.renderers.video_renderer import VideoRenderer
from app.services.renderers.advisory_renderer import AdvisoryRenderer
from app.services.renderers.infographic_renderer import InfographicRenderer
from app.services.provenance.ledger import ledger, BlockchainLedger
from app.services.provenance.qr_generator import QRGenerator
from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)

# In-memory unified task registry for direct mode and fast polling
TASK_REGISTRY: Dict[str, Dict[str, Any]] = {}

def get_task_status(task_id: str) -> Dict[str, Any]:
    return TASK_REGISTRY.get(task_id, {
        "task_id": task_id,
        "status": "NOT_FOUND",
        "progress": 0,
        "message": "Task ID not found in registry"
    })

def update_task(task_id: str, status: Optional[str] = None, progress: Optional[int] = None, message: Optional[str] = None, **kwargs):
    if task_id not in TASK_REGISTRY:
        TASK_REGISTRY[task_id] = {"task_id": task_id}
    if status is not None:
        TASK_REGISTRY[task_id]["status"] = status
    if progress is not None:
        TASK_REGISTRY[task_id]["progress"] = progress
    if message is not None:
        TASK_REGISTRY[task_id]["message"] = message
    # Filter out duplicate task_id from kwargs if present
    kwargs.pop("task_id", None)
    TASK_REGISTRY[task_id].update(kwargs)

def run_transformation_pipeline(brief_data: Dict[str, Any], formats: List[str], task_id: str) -> Dict[str, Any]:
    """
    Executes parallel multi-format rendering across all 7 supported formats,
    hashing each deliverable and recording the block on the blockchain ledger.
    """
    try:
        update_task(task_id, "PROCESSING", 10, "Validating Content Brief schema...")
        brief = ContentBriefJSON(**brief_data)
        
        brief_dir = Path(settings.ARTIFACTS_DIR) / brief.brief_id
        brief_dir.mkdir(parents=True, exist_ok=True)

        artifact_paths: Dict[str, str] = {}
        artifact_hashes: Dict[str, str] = {}

        # 1. Generate QR code placeholder
        temp_block_hash = BlockchainLedger.calculate_file_hash(brief.brief_id)
        qr_filename = f"{brief.brief_id}_qr.png"
        qr_path = str(brief_dir / qr_filename)
        QRGenerator.generate_qr(brief.brief_id, temp_block_hash, qr_path)

        update_task(task_id, "PROCESSING", 25, "Rendering multi-format deliverables from single source...")

        # Normalize format strings
        requested = [f.lower().strip() for f in formats]

        # 1. Video Package
        if any(f in requested for f in ["video", "video_package"]):
            video_path = str(brief_dir / f"{brief.brief_id}_video_package.docx")
            VideoRenderer().render(brief, video_path, extra_context={"qr_code_path": qr_path})
            artifact_paths["video"] = video_path
            artifact_hashes["video"] = BlockchainLedger.calculate_file_hash(video_path)

        # 2. LinkedIn Post
        if any(f in requested for f in ["linkedin", "linkedin_post"]):
            linkedin_path = str(brief_dir / f"{brief.brief_id}_linkedin_post.md")
            LinkedInRenderer().render(brief, linkedin_path, extra_context={"block_hash": temp_block_hash})
            artifact_paths["linkedin"] = linkedin_path
            artifact_hashes["linkedin"] = BlockchainLedger.calculate_file_hash(linkedin_path)

        # 3. Twitter / X Thread
        if any(f in requested for f in ["twitter", "x", "twitter_post", "social"]):
            twitter_path = str(brief_dir / f"{brief.brief_id}_twitter_thread.md")
            TwitterRenderer().render(brief, twitter_path, extra_context={"block_hash": temp_block_hash})
            artifact_paths["twitter"] = twitter_path
            artifact_hashes["twitter"] = BlockchainLedger.calculate_file_hash(twitter_path)

        # 4. Strategic Advisory Document
        if any(f in requested for f in ["advisory", "advisory_document"]):
            advisory_path = str(brief_dir / f"{brief.brief_id}_strategic_advisory.docx")
            AdvisoryRenderer().render(brief, advisory_path, extra_context={"qr_code_path": qr_path})
            artifact_paths["advisory"] = advisory_path
            artifact_hashes["advisory"] = BlockchainLedger.calculate_file_hash(advisory_path)

        # 5. Infographic Layout Specification & Blueprint
        if any(f in requested for f in ["infographic"]):
            infographic_path = str(brief_dir / f"{brief.brief_id}_infographic_blueprint.docx")
            InfographicRenderer().render(brief, infographic_path, extra_context={"qr_code_path": qr_path})
            artifact_paths["infographic"] = infographic_path
            artifact_hashes["infographic"] = BlockchainLedger.calculate_file_hash(infographic_path)

        # 6. Executive Summary (DOCX)
        if any(f in requested for f in ["executive_summary", "docx"]):
            docx_path = str(brief_dir / f"{brief.brief_id}_executive_summary.docx")
            DOCXRenderer().render(brief, docx_path, extra_context={"qr_code_path": qr_path})
            artifact_paths["executive_summary"] = docx_path
            artifact_hashes["executive_summary"] = BlockchainLedger.calculate_file_hash(docx_path)

        # 7. Presentation (PPTX)
        if any(f in requested for f in ["presentation", "pptx"]):
            pptx_path = str(brief_dir / f"{brief.brief_id}_presentation.pptx")
            PPTXRenderer().render(brief, pptx_path)
            artifact_paths["presentation"] = pptx_path
            artifact_hashes["presentation"] = BlockchainLedger.calculate_file_hash(pptx_path)

        update_task(task_id, "PROCESSING", 85, "Anchoring deliverable hashes to Blockchain Ledger...")

        # 8. Record in Blockchain Ledger
        source_hash = BlockchainLedger.calculate_file_hash(brief.summary)
        ledger_block = ledger.record_provenance(
            brief_id=brief.brief_id,
            source_hash=source_hash,
            artifact_hashes=artifact_hashes
        )

        # 9. Re-generate final QR Code with exact block hash
        final_block_hash = ledger_block["block_hash"]
        QRGenerator.generate_qr(brief.brief_id, final_block_hash, qr_path)

        # Download URL mappings
        download_urls = {fmt: f"/api/artifacts/{brief.brief_id}/download/{fmt}" for fmt in artifact_paths}
        qr_download_url = f"/api/artifacts/{brief.brief_id}/download/qr"

        result = {
            "task_id": task_id,
            "status": "COMPLETED",
            "progress": 100,
            "message": "All requested deliverables generated and verified on blockchain ledger.",
            "artifacts": download_urls,
            "ledger_entry": ledger_block,
            "qr_code_url": qr_download_url
        }

        update_task(
            task_id=task_id,
            status="COMPLETED",
            progress=100,
            message="Transformation complete",
            artifacts=download_urls,
            ledger_entry=ledger_block,
            qr_code_url=qr_download_url
        )
        return result

    except Exception as e:
        logger.error(f"Transformation pipeline failed: {e}", exc_info=True)
        error_res = {
            "task_id": task_id,
            "status": "FAILED",
            "progress": 0,
            "message": f"Transformation failed: {str(e)}",
            "error": str(e)
        }
        update_task(task_id, "FAILED", 0, str(e), error=str(e))
        return error_res

@celery_app.task(name="tasks.transform_content")
def celery_transform_task(brief_data: Dict[str, Any], formats: List[str], task_id: str):
    """Celery worker task wrapper."""
    return run_transformation_pipeline(brief_data, formats, task_id)
