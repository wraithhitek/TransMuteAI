import pytest
from app.services.ingestion.pii_redactor import PIIRedactor

def test_pii_redaction_email():
    raw = "Please contact lead engineer John Doe at john.doe@enterprise.org for security questions."
    cleaned, redactions = PIIRedactor.redact(raw)
    assert "[EMAIL_REDACTED]" in cleaned
    assert "john.doe@enterprise.org" not in cleaned
    assert len(redactions) == 1
    assert redactions[0].type == "EMAIL"
    assert "jo***@enterprise.org" == redactions[0].original_masked

def test_pii_redaction_phone_and_ssn():
    raw = "Emergency contact: +1 (555) 234-5678 and SSN identifier: 123-45-6789."
    cleaned, redactions = PIIRedactor.redact(raw)
    assert "[PHONE_REDACTED]" in cleaned
    assert "[SSN_REDACTED]" in cleaned
    assert "123-45-6789" not in cleaned
    assert len(redactions) == 2

def test_pii_redaction_ip_and_card():
    raw = "Server connecting from 192.168.1.105 with payment card 4532-1234-5678-9012."
    cleaned, redactions = PIIRedactor.redact(raw)
    assert "[IP_REDACTED]" in cleaned
    assert "[CREDIT_CARD_REDACTED]" in cleaned
    assert "192.168.1.105" not in cleaned
    assert "4532-1234-5678-9012" not in cleaned
