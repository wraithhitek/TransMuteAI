import os
import pytest
from app.services.provenance.ledger import BlockchainLedger

def test_ledger_creation_and_chaining(tmp_path):
    ledger_path = str(tmp_path / "test_ledger.json")
    ledger_instance = BlockchainLedger(ledger_file=ledger_path)

    assert os.path.exists(ledger_path)
    assert ledger_instance.verify_chain() is True

    # Record first transaction block
    block1 = ledger_instance.record_provenance(
        brief_id="brief_001",
        source_hash="source_hash_abc",
        artifact_hashes={"docx": "docx_hash_1", "pptx": "pptx_hash_2"}
    )
    assert block1["index"] == 1
    assert ledger_instance.verify_chain() is True

    # Record second transaction block
    block2 = ledger_instance.record_provenance(
        brief_id="brief_002",
        source_hash="source_hash_def",
        artifact_hashes={"docx": "docx_hash_3"}
    )
    assert block2["index"] == 2
    assert block2["previous_hash"] == block1["block_hash"]
    assert ledger_instance.verify_chain() is True

    # Verification checks
    res1 = ledger_instance.verify_artifact(brief_id="brief_001")
    assert res1.verified is True
    assert res1.block_index == 1

    res_missing = ledger_instance.verify_artifact(brief_id="non_existent")
    assert res_missing.verified is False

def test_ledger_tamper_detection(tmp_path):
    import json
    ledger_path = str(tmp_path / "tamper_ledger.json")
    ledger_instance = BlockchainLedger(ledger_file=ledger_path)

    ledger_instance.record_provenance(
        brief_id="brief_legit",
        source_hash="legit_hash",
        artifact_hashes={"docx": "hash_val"}
    )
    assert ledger_instance.verify_chain() is True

    # Intentionally corrupt data in the block
    with open(ledger_path, "r", encoding="utf-8") as f:
        chain = json.load(f)
    chain[1]["source_hash"] = "TAMPERED_HASH"
    with open(ledger_path, "w", encoding="utf-8") as f:
        json.dump(chain, f)

    # Re-verify
    assert ledger_instance.verify_chain() is False
    res = ledger_instance.verify_artifact(brief_id="brief_legit")
    assert res.verified is False
    assert res.status == "CHAIN_TAMPERED"
