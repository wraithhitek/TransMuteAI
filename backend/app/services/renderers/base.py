from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from app.api.schemas import ContentBriefJSON

class BaseRenderer(ABC):
    """
    Abstract Renderer Interface for multi-format artifact generation.
    """

    @abstractmethod
    def render(self, brief: ContentBriefJSON, output_path: str, extra_context: Optional[Dict[str, Any]] = None) -> str:
        """
        Renders the Content Brief into the target format file.
        Returns the absolute path to the generated file.
        """
        pass
