import os
import json
import qrcode
from PIL import Image

class QRGenerator:
    """
    Generates scannable QR codes encoding provenance verification metadata.
    """

    @classmethod
    def generate_qr(cls, brief_id: str, block_hash: str, output_path: str, verify_base_url: str = "http://localhost:8000/api/provenance/verify") -> str:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

        payload = {
            "platform": "TransmuteAI",
            "brief_id": brief_id,
            "block_hash": block_hash,
            "verify_url": f"{verify_base_url}?brief_id={brief_id}&block_hash={block_hash}"
        }

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=2,
        )
        # Encode URL for direct browser scanning, or JSON
        verification_url = f"{verify_base_url}?brief_id={brief_id}&block_hash={block_hash}"
        qr.add_data(verification_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="#1E293B", back_color="#FFFFFF")
        img.save(output_path)
        return os.path.abspath(output_path)
