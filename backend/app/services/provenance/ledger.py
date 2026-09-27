import os
import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pathlib import Path

from app.config import settings
from app.api.schemas import BlockchainBlock, VerificationResponse

class BlockchainLedger:
    """
    Cryptographic Provenance Ledger implementing a persistent SHA-256 block chain.
    Every generation job records the source hash, artifact hashes, timestamp,
    and previous block hash.
    """

    GENESIS_PREV_HASH = "0" * 64

    def __init__(self, ledger_file: Optional[str] = None):
        self.ledger_file = ledger_file or str(Path(settings.LEDGER_DIR) / "ledger_chain.json")
        self._ensure_ledger_initialized()

    def _ensure_ledger_initialized(self):
        """Ensures ledger file and genesis block exist."""
        os.makedirs(os.path.dirname(os.path.abspath(self.ledger_file)), exist_ok=True)
        if not os.path.exists(self.ledger_file):
            genesis_block = self._create_genesis_block()
            self._save_chain([genesis_block])

    def _create_genesis_block(self) -> Dict[str, Any]:
        timestamp = "2026-01-01T00:00:00Z"
        raw_str = f"0{timestamp}GENESIS{self.GENESIS_PREV_HASH}0"
        block_hash = hashlib.sha256(raw_str.encode("utf-8")).hexdigest()

        return {
            "index": 0,
            "timestamp": timestamp,
            "brief_id": "GENESIS_BRIEF",
            "source_hash": self.GENESIS_PREV_HASH,
            "artifact_hashes": {},
            "previous_hash": self.GENESIS_PREV_HASH,
            "nonce": 0,
            "block_hash": block_hash
        }

    def _load_chain(self) -> List[Dict[str, Any]]:
        try:
            with open(self.ledger_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return [self._create_genesis_block()]

    def _save_chain(self, chain: List[Dict[str, Any]]):
        with open(self.ledger_file, "w", encoding="utf-8") as f:
            json.dump(chain, f, indent=2)

    @classmethod
    def calculate_file_hash(cls, file_path_or_bytes: Any) -> str:
        """Computes SHA-256 of a file path, raw bytes, or string payload."""
        hasher = hashlib.sha256()
        if isinstance(file_path_or_bytes, (str, Path)) and os.path.isfile(str(file_path_or_bytes)):
            with open(file_path_or_bytes, "rb") as f:
                while chunk := f.read(65536):
                    hasher.update(chunk)
        elif isinstance(file_path_or_bytes, bytes):
            hasher.update(file_path_or_bytes)
        else:
            hasher.update(str(file_path_or_bytes).encode("utf-8"))
        return hasher.hexdigest()

    def calculate_block_hash(self, index: int, timestamp: str, brief_id: str, source_hash: str, artifact_hashes: Dict[str, str], previous_hash: str, nonce: int) -> str:
        sorted_artifacts = json.dumps(artifact_hashes, sort_keys=True)
        raw_header = f"{index}{timestamp}{brief_id}{source_hash}{sorted_artifacts}{previous_hash}{nonce}"
        return hashlib.sha256(raw_header.encode("utf-8")).hexdigest()

    def record_provenance(self, brief_id: str, source_hash: str, artifact_hashes: Dict[str, str]) -> Dict[str, Any]:
        """
        Appends a newly verified transformation block to the blockchain ledger.
        """
        chain = self._load_chain()
        last_block = chain[-1]

        index = len(chain)
        timestamp = datetime.now(timezone.utc).isoformat()
        previous_hash = last_block["block_hash"]
        nonce = 1000 + index  # deterministic nonce

        block_hash = self.calculate_block_hash(
            index=index,
            timestamp=timestamp,
            brief_id=brief_id,
            source_hash=source_hash,
            artifact_hashes=artifact_hashes,
            previous_hash=previous_hash,
            nonce=nonce
        )

        new_block = {
            "index": index,
            "timestamp": timestamp,
            "brief_id": brief_id,
            "source_hash": source_hash,
            "artifact_hashes": artifact_hashes,
            "previous_hash": previous_hash,
            "nonce": nonce,
            "block_hash": block_hash
        }

        chain.append(new_block)
        self._save_chain(chain)
        return new_block

    def verify_chain(self) -> bool:
        """
        Validates cryptographic integrity of every block in the ledger.
        """
        chain = self._load_chain()
        for i in range(1, len(chain)):
            current = chain[i]
            prev = chain[i - 1]

            # 1. Check previous hash pointer
            if current["previous_hash"] != prev["block_hash"]:
                return False

            # 2. Recalculate block hash
            expected_hash = self.calculate_block_hash(
                index=current["index"],
                timestamp=current["timestamp"],
                brief_id=current["brief_id"],
                source_hash=current["source_hash"],
                artifact_hashes=current["artifact_hashes"],
                previous_hash=current["previous_hash"],
                nonce=current["nonce"]
            )
            if current["block_hash"] != expected_hash:
                return False

        return True

    def find_by_brief_id(self, brief_id: str) -> Optional[Dict[str, Any]]:
        chain = self._load_chain()
        for block in reversed(chain):
            if block["brief_id"] == brief_id:
                return block
        return None

    def find_by_artifact_hash(self, artifact_hash: str) -> Optional[Dict[str, Any]]:
        chain = self._load_chain()
        for block in reversed(chain):
            if artifact_hash in block.get("artifact_hashes", {}).values():
                return block
            if artifact_hash == block.get("source_hash") or artifact_hash == block.get("block_hash"):
                return block
        return None

    def verify_artifact(self, artifact_hash: Optional[str] = None, brief_id: Optional[str] = None) -> VerificationResponse:
        chain_valid = self.verify_chain()
        block = None

        if artifact_hash:
            block = self.find_by_artifact_hash(artifact_hash)
        elif brief_id:
            block = self.find_by_brief_id(brief_id)

        if not block:
            return VerificationResponse(
                verified=False,
                status="NOT_FOUND",
                chain_valid=chain_valid
            )

        if not chain_valid:
            return VerificationResponse(
                verified=False,
                status="CHAIN_TAMPERED",
                chain_valid=False
            )

        return VerificationResponse(
            verified=True,
            status="VERIFIED_AUTHENTIC",
            block_index=block["index"],
            timestamp=block["timestamp"],
            brief_id=block["brief_id"],
            source_hash=block["source_hash"],
            artifact_hashes=block["artifact_hashes"],
            block_hash=block["block_hash"],
            previous_hash=block["previous_hash"],
            chain_valid=True
        )

# Global singleton
ledger = BlockchainLedger()
