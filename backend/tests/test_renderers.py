import os
import pytest
from app.services.renderers.docx_renderer import DOCXRenderer
from app.services.renderers.pptx_renderer import PPTXRenderer
from app.services.renderers.social_renderer import LinkedInRenderer, TwitterRenderer, SocialRenderer
from app.services.renderers.video_renderer import VideoRenderer
from app.services.renderers.advisory_renderer import AdvisoryRenderer
from app.services.renderers.infographic_renderer import InfographicRenderer
from app.services.provenance.qr_generator import QRGenerator
from app.services.llm.factory import MockLLMProvider
from app.api.schemas import ContentBriefJSON
import json

def test_renderers_output(sample_brief, tmp_path):
    # 1. Test QR generation
    qr_file = str(tmp_path / "test_qr.png")
    QRGenerator.generate_qr(sample_brief.brief_id, "mock_hash_12345", qr_file)
    assert os.path.exists(qr_file)
    assert os.path.getsize(qr_file) > 100

    # 2. Test DOCX generation
    docx_file = str(tmp_path / "output.docx")
    DOCXRenderer().render(sample_brief, docx_file, extra_context={"qr_code_path": qr_file})
    assert os.path.exists(docx_file)
    assert os.path.getsize(docx_file) > 1000

    # 3. Test PPTX generation
    pptx_file = str(tmp_path / "output.pptx")
    PPTXRenderer().render(sample_brief, pptx_file)
    assert os.path.exists(pptx_file)
    assert os.path.getsize(pptx_file) > 1000

    # 4. Test Social Thread generation
    social_file = str(tmp_path / "output.md")
    SocialRenderer().render(sample_brief, social_file, extra_context={"block_hash": "mock_hash_12345"})
    assert os.path.exists(social_file)
    with open(social_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert sample_brief.title in content
    assert "Provenance Verification" in content

@pytest.mark.asyncio
async def test_specialized_multi_format_renderers(tmp_path):
    # Generate full mock brief with all 7 format sub-briefs
    mock_str = await MockLLMProvider().generate_json("Enterprise AI Transformation", "System")
    brief_data = json.loads(mock_str)
    brief = ContentBriefJSON(**brief_data)

    qr_file = str(tmp_path / "qr.png")
    QRGenerator.generate_qr(brief.brief_id, "mock_hash_abc", qr_file)

    # 1. Video Package
    video_docx = str(tmp_path / "video_package.docx")
    VideoRenderer().render(brief, video_docx, extra_context={"qr_code_path": qr_file})
    assert os.path.exists(video_docx)
    assert os.path.getsize(video_docx) > 1000
    srt_file = str(tmp_path / "video_package_subtitles.srt")
    assert os.path.exists(srt_file)
    with open(srt_file, "r", encoding="utf-8") as f:
        srt_text = f.read()
    assert "00:00:00,000" in srt_text

    # 2. LinkedIn Post
    linkedin_file = str(tmp_path / "linkedin_post.md")
    LinkedInRenderer().render(brief, linkedin_file, extra_context={"block_hash": "mock_hash_abc"})
    assert os.path.exists(linkedin_file)
    with open(linkedin_file, "r", encoding="utf-8") as f:
        li_content = f.read()
    assert "Verified via TransmuteAI" in li_content
    assert "#" in li_content

    # 3. Twitter Thread
    twitter_file = str(tmp_path / "twitter_thread.md")
    TwitterRenderer().render(brief, twitter_file, extra_context={"block_hash": "mock_hash_abc"})
    assert os.path.exists(twitter_file)
    with open(twitter_file, "r", encoding="utf-8") as f:
        tw_content = f.read()
    assert "Tweet 1/" in tw_content

    # 4. Strategic Advisory Report
    advisory_docx = str(tmp_path / "strategic_advisory.docx")
    AdvisoryRenderer().render(brief, advisory_docx, extra_context={"qr_code_path": qr_file})
    assert os.path.exists(advisory_docx)
    assert os.path.getsize(advisory_docx) > 1000

    # 5. Infographic Blueprint & HTML Preview
    info_docx = str(tmp_path / "infographic_blueprint.docx")
    InfographicRenderer().render(brief, info_docx, extra_context={"qr_code_path": qr_file})
    assert os.path.exists(info_docx)
    assert os.path.getsize(info_docx) > 1000
    info_html = str(tmp_path / "infographic_blueprint_preview.html")
    assert os.path.exists(info_html)
    with open(info_html, "r", encoding="utf-8") as f:
        html_text = f.read()
    assert "<!DOCTYPE html>" in html_text
