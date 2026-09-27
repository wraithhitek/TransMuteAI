import os
from typing import Dict, Any, Optional
from app.api.schemas import ContentBriefJSON
from app.services.renderers.base import BaseRenderer

class LinkedInRenderer(BaseRenderer):
    """
    Renders professional, high-converting LinkedIn Posts.
    Formatted like top executive voices: compelling hook, clean line spacing,
    scannable bullet points, actionable CTA, and targeted hashtags.
    """

    def render(self, brief: ContentBriefJSON, output_path: str, extra_context: Optional[Dict[str, Any]] = None) -> str:
        li = brief.linkedin_post
        lines = []

        if li and li.hook:
            lines.append(li.hook)
            lines.append("")
            lines.append(li.body)
            lines.append("")
            if li.bullet_insights:
                for b in li.bullet_insights:
                    lines.append(f"• {b}")
                lines.append("")
            if li.call_to_action:
                lines.append(li.call_to_action)
                lines.append("")
            if li.hashtags:
                tags = " ".join(f"#{t.lstrip('#')}" for t in li.hashtags)
                lines.append(tags)
        else:
            # Fallback based on executive summary
            lines.append(f"Strategic imperative: {brief.executive_summary.headline}")
            lines.append("")
            lines.append(brief.executive_summary.context)
            lines.append("")
            for finding in brief.executive_summary.key_findings[:3]:
                lines.append(f"• {finding}")
            lines.append("")
            lines.append("What are your thoughts on this strategy? Let's discuss in the comments.")
            lines.append("#GenerativeAI #EnterpriseArchitecture #Innovation #Productivity")

        lines.append("\n---")
        lines.append(f"🔒 *Verified via TransmuteAI Provenance Ledger (Brief ID: {brief.brief_id})*")
        if extra_context and extra_context.get("block_hash"):
            lines.append(f"*Block Hash: `{extra_context.get('block_hash')}`*")

        content = "\n".join(lines)
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)

        return os.path.abspath(output_path)

class TwitterRenderer(BaseRenderer):
    """
    Renders platform-optimized Twitter/X Posts & Threads.
    """

    def render(self, brief: ContentBriefJSON, output_path: str, extra_context: Optional[Dict[str, Any]] = None) -> str:
        lines = []
        lines.append(f"# 🧵 Twitter/X Thread: {brief.title}")
        lines.append(f"*Synthesized from Canonical Content Brief: {brief.brief_id}*\n")
        lines.append("---\n")

        for post in brief.social_media_thread:
            lines.append(f"### [Tweet {post.post_number}/{len(brief.social_media_thread)}]")
            lines.append(f"{post.content}\n")
            if post.hashtags:
                tags = " ".join(f"#{t.lstrip('#')}" for t in post.hashtags)
                lines.append(f"{tags}\n")
            lines.append("---\n")

        # Cryptographic footer
        lines.append("🔒 **Provenance Verification**")
        lines.append(f"Thread derived from canonical Brief `{brief.brief_id}`.")
        if extra_context and extra_context.get("block_hash"):
            lines.append(f"Blockchain Block Hash: `{extra_context.get('block_hash')}`")

        content = "\n".join(lines)
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)

        return os.path.abspath(output_path)

# Backwards compatibility alias
SocialRenderer = TwitterRenderer
