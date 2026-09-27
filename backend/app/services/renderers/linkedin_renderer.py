import os
from typing import Dict, Any, Optional
from app.api.schemas import ContentBriefJSON
from app.services.renderers.base import BaseRenderer

class LinkedInRenderer(BaseRenderer):
    """Render a LinkedIn post (markdown) from ContentBriefJSON.
    Includes headline, summary, key takeaways, and hashtags.
    """

    def render(self, brief: ContentBriefJSON, output_path: str, extra_context: Optional[Dict[str, Any]] = None) -> str:
        lines = []
        lines.append(f"# {brief.title}\n")
        lines.append(f"{brief.executive_summary.headline}\n")
        lines.append(f"{brief.executive_summary.context}\n")
        lines.append("---\n")
        lines.append("**Key Takeaways:**\n")
        for finding in brief.executive_summary.key_findings[:3]:
            lines.append(f"- {finding}\n")
        lines.append("---\n")
        # Gather hashtags from social thread or fallback
        hashtags = []
        for post in brief.social_media_thread:
            hashtags.extend([tag.lstrip('#') for tag in post.hashtags])
        hashtags = list(dict.fromkeys(hashtags))
        if not hashtags:
            hashtags = ["AI", "Automation", "Innovation"]
        lines.append(" ".join([f"#{tag}" for tag in hashtags]))
        content = "\n".join(lines)
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)
        return os.path.abspath(output_path)
