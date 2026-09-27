import re
from typing import Tuple, List
from app.api.schemas import RedactedItem

class PIIRedactor:
    """
    Lightweight, deterministic regex-based PII Redaction Engine.
    Detects and sanitizes emails, phone numbers, SSNs, credit cards, and IP addresses.
    """

    PATTERNS = {
        "EMAIL": re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b'),
        "PHONE": re.compile(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'),
        "SSN": re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
        "CREDIT_CARD": re.compile(r'\b(?:\d{4}[-\s]?){3}\d{4}\b'),
        "IP": re.compile(r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b'),
    }

    @classmethod
    def mask_value(cls, value: str, pii_type: str) -> str:
        """Create a partially masked string for safe audit logging."""
        if pii_type == "EMAIL":
            parts = value.split("@")
            if len(parts) == 2 and len(parts[0]) > 2:
                return f"{parts[0][:2]}***@{parts[1]}"
            return "***@***.com"
        elif pii_type in ("PHONE", "CREDIT_CARD", "SSN"):
            digits = re.sub(r'\D', '', value)
            if len(digits) >= 4:
                return f"***-***-{digits[-4:]}"
            return "***-****"
        elif pii_type in ("IP", "IP_ADDRESS"):
            return "***.***.***.***"
        return "[REDACTED]"

    @classmethod
    def redact(cls, text: str) -> Tuple[str, List[RedactedItem]]:
        """
        Scans and sanitizes raw text.
        Returns:
            Tuple of (sanitized_text, list_of_redaction_audit_items)
        """
        redactions: List[RedactedItem] = []
        cleaned_text = text

        for pii_type, pattern in cls.PATTERNS.items():
            placeholder = f"[{pii_type}_REDACTED]"
            
            # Find all matches for audit logging before replacement
            matches = list(pattern.finditer(cleaned_text))
            for match in matches:
                matched_val = match.group()
                redactions.append(RedactedItem(
                    type=pii_type,
                    original_masked=cls.mask_value(matched_val, pii_type),
                    replacement=placeholder
                ))
            
            # Replace occurrences with standardized placeholder
            cleaned_text = pattern.sub(placeholder, cleaned_text)

        return cleaned_text, redactions
