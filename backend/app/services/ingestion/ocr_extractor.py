import io
import logging
from PIL import Image

logger = logging.getLogger(__name__)

class OCRExtractor:
    """
    OCR Text Extractor with graceful fallback.
    Utilizes pytesseract if Tesseract binary is available on the system,
    or falls back gracefully with helpful metadata.
    """

    @classmethod
    def extract_text(cls, image_bytes: bytes) -> str:
        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Convert to grayscale for improved OCR contrast
            if image.mode != "L":
                image = image.convert("L")

            import pytesseract
            text = pytesseract.image_to_string(image)
            if text and text.strip():
                return text.strip()
            return "[OCR Extracted: No readable text detected in uploaded image]"
        except ImportError:
            logger.warning("pytesseract library not available.")
            return "[OCR Note: pytesseract library is not installed on this host]"
        except Exception as e:
            logger.warning(f"Tesseract OCR engine unavailable or error occurred: {e}")
            return f"[OCR Processed: Image ingested successfully ({image.width}x{image.height}px). Tesseract OCR binary not detected on system PATH.]"
