import hashlib
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional
from backend.schemas import LedgerBlock, LedgerVerifyResponse

def compute_sha256(payload: str) -> str:
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def calculate_block_hash(
    block_id: int,
    previous_hash: str,
    content_hash: str,
    actor_id: str,
    actor_type: str,
    action: str,
    timestamp: str,
) -> str:
    raw = f"{block_id}|{previous_hash}|{content_hash}|{actor_id}|{actor_type}|{action}|{timestamp}"
    return compute_sha256(raw)

class LedgerService:
    def __init__(self):
        self._seed_ledger()

    def _seed_ledger(self):
        """Seed initial blockchain-like ledger entries"""
        now = "2026-09-01T10:00:00Z"
        genesis_hash = "0000000000000000000000000000000000000000000000000000000000000000"
        
        initial_records = [
            {
                "id": 1,
                "project_id": "proj-1",
                "actor_id": "user-org-1",
                "actor_type": "human",
                "action": "Research Charter v1.0 Initialized and Published",
                "content": "charter_v1_terms_and_ip_allocation",
                "timestamp": "2026-09-01T10:00:00Z",
                "metadata": {"version": "1.0", "status": "active"},
            },
            {
                "id": 2,
                "project_id": "proj-1",
                "actor_id": "user-student-2",
                "actor_type": "human",
                "action": "Dataset curation: 45,000 retinal scan labels verified",
                "content": "dataset_labels_45000_annotations_clean",
                "timestamp": "2026-09-12T14:30:00Z",
                "metadata": {"dataset_size": 45000, "credits": 55},
            },
            {
                "id": 3,
                "project_id": "proj-1",
                "actor_id": "user-student-1",
                "actor_type": "human",
                "action": "Preprocessing pipeline committed: NovaScan v3 CLAHE normalizer",
                "content": "novascan_v3_clahe_normalization_pytorch_src",
                "timestamp": "2026-09-20T11:15:00Z",
                "metadata": {"file": "novascan_v3_preprocessing.py", "credits": 45},
            },
            {
                "id": 4,
                "project_id": "proj-1",
                "actor_id": "user-student-1",
                "actor_type": "human",
                "action": "Data augmentation module committed (AI-assisted with Llama-3)",
                "content": "data_augmentation_retina_blur_lowlight",
                "timestamp": "2026-09-28T16:00:00Z",
                "metadata": {"ai_assisted": True, "model": "llama3", "credits": 30},
            },
            {
                "id": 5,
                "project_id": "proj-1",
                "actor_id": "user-mentor-1",
                "actor_type": "human",
                "action": "Milestone 1 clinical review and pipeline verification signed",
                "content": "milestone_1_clinical_validation_signoff",
                "timestamp": "2026-10-12T09:00:00Z",
                "metadata": {"milestone": "ms-1", "verdict": "accepted"},
            },
            {
                "id": 6,
                "project_id": "proj-1",
                "actor_id": "user-org-1",
                "actor_type": "human",
                "action": "Escrow released: $20,000 distributed to Milestone 1 contributors",
                "content": "escrow_payout_ms1_20000_usd",
                "timestamp": "2026-10-12T10:00:00Z",
                "metadata": {"escrow_id": "escrow-1", "amount": 20000},
            },
        ]

        self.blocks: List[LedgerBlock] = []
        prev_hash = genesis_hash

        for r in initial_records:
            c_hash = compute_sha256(r["content"])
            e_hash = calculate_block_hash(
                r["id"], prev_hash, c_hash, r["actor_id"], r["actor_type"], r["action"], r["timestamp"]
            )
            block = LedgerBlock(
                id=r["id"],
                project_id=r["project_id"],
                actor_id=r["actor_id"],
                actor_type=r["actor_type"],
                action=r["action"],
                content_hash=c_hash,
                previous_hash=prev_hash,
                entry_hash=e_hash,
                timestamp=r["timestamp"],
                metadata=r["metadata"],
            )
            self.blocks.append(block)
            prev_hash = e_hash

        self._canonical_blocks = [b.model_copy() for b in self.blocks]

    def get_blocks(self, project_id: Optional[str] = None) -> List[LedgerBlock]:
        if project_id:
            return [b for b in self.blocks if b.project_id == project_id]
        return self.blocks

    def append_entry(
        self,
        project_id: str,
        actor_id: str,
        actor_type: str,
        action: str,
        content_payload: str,
        metadata: Dict[str, Any] = None,
    ) -> LedgerBlock:
        last_block = self.blocks[-1] if self.blocks else None
        prev_hash = last_block.entry_hash if last_block else "0" * 64
        next_id = (last_block.id + 1) if last_block else 1
        now_ts = datetime.now(timezone.utc).isoformat()
        
        c_hash = compute_sha256(content_payload)
        e_hash = calculate_block_hash(
            next_id, prev_hash, c_hash, actor_id, actor_type, action, now_ts
        )

        new_block = LedgerBlock(
            id=next_id,
            project_id=project_id,
            actor_id=actor_id,
            actor_type=actor_type,
            action=action,
            content_hash=c_hash,
            previous_hash=prev_hash,
            entry_hash=e_hash,
            timestamp=now_ts,
            metadata=metadata or {},
        )
        self.blocks.append(new_block)
        return new_block

    def verify_integrity(self) -> LedgerVerifyResponse:
        """Sequential verification of every block's cryptographic hash"""
        if not self.blocks:
            return LedgerVerifyResponse(
                is_valid=True,
                total_blocks_verified=0,
                genesis_hash="0" * 64,
                terminal_hash="0" * 64,
                message="Ledger is empty.",
            )

        genesis_hash = self.blocks[0].previous_hash

        for idx, block in enumerate(self.blocks):
            # 1. Check parent linkage
            if idx > 0:
                expected_prev = self.blocks[idx - 1].entry_hash
                if block.previous_hash != expected_prev:
                    return LedgerVerifyResponse(
                        is_valid=False,
                        total_blocks_verified=idx,
                        genesis_hash=genesis_hash,
                        terminal_hash=block.entry_hash,
                        broken_block_id=block.id,
                        message=f"CHAIN BREAK AT BLOCK #{block.id}: previous_hash '{block.previous_hash[:12]}...' does not match parent entry_hash '{expected_prev[:12]}...'",
                    )

            # 2. Check block hash correctness
            recomputed = calculate_block_hash(
                block.id,
                block.previous_hash,
                block.content_hash,
                block.actor_id,
                block.actor_type,
                block.action,
                block.timestamp,
            )
            if block.entry_hash != recomputed:
                return LedgerVerifyResponse(
                    is_valid=False,
                    total_blocks_verified=idx,
                    genesis_hash=genesis_hash,
                    terminal_hash=block.entry_hash,
                    broken_block_id=block.id,
                    message=f"TAMPER DETECTED AT BLOCK #{block.id}: Stored entry_hash '{block.entry_hash[:12]}...' does not match recomputed SHA-256 '{recomputed[:12]}...'",
                )

        return LedgerVerifyResponse(
            is_valid=True,
            total_blocks_verified=len(self.blocks),
            genesis_hash=genesis_hash,
            terminal_hash=self.blocks[-1].entry_hash,
            message=f"Cryptographic Audit Success: All {len(self.blocks)} blocks verified sequentially. Merkle hash root is mathematically intact.",
        )

    def simulate_tampering(self, block_id: int, tampered_action: str) -> LedgerBlock:
        """Simulate an attacker altering a record in the database"""
        for b in self.blocks:
            if b.id == block_id:
                b.action = tampered_action
                b.metadata["tampered"] = True
                b.metadata["tamper_time"] = datetime.now(timezone.utc).isoformat()
                return b
        raise ValueError(f"Block #{block_id} not found")

    def restore_canonical(self):
        """Restore verified canonical ledger state"""
        self.blocks = [b.model_copy() for b in self._canonical_blocks]

ledger_service = LedgerService()
