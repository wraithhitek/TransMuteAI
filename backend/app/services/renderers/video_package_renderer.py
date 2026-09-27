import os
from typing import Dict, Any, Optional
from app.api.schemas import ContentBriefJSON
from app.services.renderers.base import BaseRenderer

class VideoPackageRenderer(BaseRenderer):
    """Render a comprehensive video package.
    Generates a Markdown file with:
    1. Full script (hook, context, key points, CTA)
    2. Storyboard derived from presentation outline
    3. Narration text
    4. Subtitles in SRT format (example)
    5. Visual recommendations
    """

    def render(self, brief: ContentBriefJSON, output_path: str, extra_context: Optional[Dict[str, Any]] = None) -> str:
        lines = []
        # 1. Script
        lines.append(f"# Video Package: {brief.title}\n")
        lines.append("## 1. Script\n")
        lines.append(f"**Opening Hook:** {brief.executive_summary.headline}\n\n")
        lines.append(f"{brief.executive_summary.context}\n\n")
        lines.append("**Key Points:**\n")
        for idx, finding in enumerate(brief.executive_summary.key_findings[:5], start=1):
            lines.append(f"{idx}. {finding}\n")
        lines.append("\n**Closing Call‑to‑Action:** Stay informed and act accordingly.\n\n")

        # 2. Storyboard & Scene Descriptions (from presentation outline)
        lines.append("## 2. Storyboard & Scene Descriptions\n")
        for idx, slide in enumerate(brief.presentation_outline[:5], start=1):
            lines.append(f"### Scene {idx}: {slide.title}\n")
            if getattr(slide, 'bullet_points', None):
                lines.append(f"*Bullet Points:* {'; '.join(slide.bullet_points)}\n")
            if getattr(slide, 'speaker_notes', None):
                lines.append(f"*Speaker Notes:* {slide.speaker_notes}\n\n")

        # 3. Narration Text
        lines.append("## 3. Narration Text\n")
        lines.append("Narration follows the script above, aligned with each scene.\n\n")

        # 4. Subtitles (SRT format example)
        lines.append("## 4. Subtitles (SRT)\n")
        for idx, finding in enumerate(brief.executive_summary.key_findings[:5], start=1):
            start_ts = f"00:00:{(idx-1)*10:02d},000"
            end_ts = f"00:00:{idx*10:02d},000"
            lines.append(f"{idx}\n{start_ts} --> {end_ts}\n{finding}\n\n")

        # 5. Visual Recommendations
        lines.append("## 5. Visual Recommendations\n")
        lines.append("* Bold typography for headlines.\n")
        lines.append("* Relevant icons/illustrations for each finding.\n")
        lines.append("* Include QR code linking to provenance ledger (provided as separate artifact).\n")

        content = "\n".join(lines)
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)
        return os.path.abspath(output_path)
