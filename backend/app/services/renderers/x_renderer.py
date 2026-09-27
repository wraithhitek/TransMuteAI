import os
from typing import Dict, Any, Optional
from app.api.schemas import ContentBriefJSON
from app.services.renderers.base import BaseRenderer

class XRenderer(BaseRenderer):
    """Render a X (Twitter) post (markdown) from ContentBriefJSON.
    Very brief, limited to 280 characters.
    """

    def render(self, brief: ContentBriefJSON, output_path: str, extra_context: Optional[Dict[str, Any]] = None) -> str:
        # Compose a concise tweet using title and a short takeaway
        tweet = f"{brief.title}: {brief.executive_summary.headline[:120]}..."
        # Add up to 2 key takeaways
        takeaways = []
        for finding in brief.executive_summary.key_findings[:2]:
            takeaways.append(finding)
        if takeaways:
            tweet += " \n" + " | ".join(takeaways)[:200]
        # Hashtags from social thread or generic
        hashtags = []
        for post in brief.social_media_thread:
            hashtags.extend([t.lstrip('#') for t in post.hashtags])
        hashtags = list(dict.fromkeys(hashtags))
        if not hashtags:
            hashtags = ["AI", "Tech"]
        tweet += " " + " ".join([f"#{tag}" for tag in hashtags[:3]])
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(tweet)
        return os.path.abspath(output_path)
