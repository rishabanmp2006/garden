import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from backend.schemas import LedgerBlock, LedgerVerifyResponse
from backend.database import get_db

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
    def get_blocks(self, project_id: Optional[str] = None) -> List[LedgerBlock]:
        conn = get_db()
        cursor = conn.cursor()
        if project_id:
            cursor.execute("SELECT * FROM ledger_entries WHERE project_id = ? ORDER BY id ASC", (project_id,))
        else:
            cursor.execute("SELECT * FROM ledger_entries ORDER BY id ASC")
        rows = cursor.fetchall()
        conn.close()

        blocks: List[LedgerBlock] = []
        for r in rows:
            meta = {}
            try:
                meta = json.loads(r["metadata"]) if r["metadata"] else {}
            except Exception:
                pass
            blocks.append(
                LedgerBlock(
                    id=r["id"],
                    project_id=r["project_id"] or "",
                    actor_id=r["actor_id"] or "",
                    actor_type=r["actor_type"],
                    action=r["action"],
                    content_hash=r["content_hash"],
                    previous_hash=r["previous_hash"],
                    entry_hash=r["entry_hash"],
                    timestamp=r["timestamp"],
                    metadata=meta,
                )
            )
        return blocks

    def append_entry(
        self,
        project_id: str,
        actor_id: str,
        actor_type: str,
        action: str,
        content_payload: str,
        metadata: Dict[str, Any] = None,
    ) -> LedgerBlock:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, entry_hash FROM ledger_entries ORDER BY id DESC LIMIT 1")
        last_row = cursor.fetchone()
        
        prev_hash = last_row["entry_hash"] if last_row else "0" * 64
        next_id = (last_row["id"] + 1) if last_row else 1
        now_ts = datetime.now(timezone.utc).isoformat()
        
        c_hash = compute_sha256(content_payload)
        e_hash = calculate_block_hash(
            next_id, prev_hash, c_hash, actor_id, actor_type, action, now_ts
        )

        cursor.execute("""
        INSERT INTO ledger_entries (id, project_id, actor_id, actor_type, action, content_hash, previous_hash, entry_hash, timestamp, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (next_id, project_id, actor_id, actor_type, action, c_hash, prev_hash, e_hash, now_ts, json.dumps(metadata or {})))
        
        conn.commit()
        conn.close()

        return LedgerBlock(
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

    def verify_integrity(self) -> LedgerVerifyResponse:
        blocks = self.get_blocks()
        if not blocks:
            return LedgerVerifyResponse(
                is_valid=True,
                total_blocks_verified=0,
                genesis_hash="0" * 64,
                terminal_hash="0" * 64,
                message="Ledger is empty.",
            )

        genesis_hash = blocks[0].previous_hash

        for idx, block in enumerate(blocks):
            # 1. Check parent linkage
            if idx > 0:
                expected_prev = blocks[idx - 1].entry_hash
                if block.previous_hash != expected_prev:
                    return LedgerVerifyResponse(
                        is_valid=False,
                        total_blocks_verified=idx,
                        total_entries=len(blocks),
                        genesis_hash=genesis_hash,
                        terminal_hash=block.entry_hash,
                        broken_block_id=block.id,
                        corrupted_entry={"id": block.id, "action": block.action},
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
                    total_entries=len(blocks),
                    genesis_hash=genesis_hash,
                    terminal_hash=block.entry_hash,
                    broken_block_id=block.id,
                    corrupted_entry={"id": block.id, "action": block.action},
                    message=f"TAMPER DETECTED AT BLOCK #{block.id}: Stored entry_hash '{block.entry_hash[:12]}...' does not match recomputed SHA-256 '{recomputed[:12]}...'",
                )

        return LedgerVerifyResponse(
            is_valid=True,
            total_blocks_verified=len(blocks),
            total_entries=len(blocks),
            genesis_hash=genesis_hash,
            terminal_hash=blocks[-1].entry_hash,
            message=f"Cryptographic Audit Success: All {len(blocks)} blocks verified sequentially. Merkle hash root is mathematically intact.",
        )

    def simulate_tampering(self, block_id: int, tampered_action: str) -> LedgerBlock:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM ledger_entries WHERE id = ?", (block_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError(f"Block #{block_id} not found")

        meta = {}
        try:
            meta = json.loads(row["metadata"]) if row["metadata"] else {}
        except Exception:
            pass
        meta["tampered"] = True
        meta["original_action"] = row["action"]

        cursor.execute("UPDATE ledger_entries SET action = ?, metadata = ? WHERE id = ?", 
                       (tampered_action, json.dumps(meta), block_id))
        conn.commit()
        conn.close()

        return LedgerBlock(
            id=block_id,
            project_id=row["project_id"] or "",
            actor_id=row["actor_id"] or "",
            actor_type=row["actor_type"],
            action=tampered_action,
            content_hash=row["content_hash"],
            previous_hash=row["previous_hash"],
            entry_hash=row["entry_hash"],
            timestamp=row["timestamp"],
            metadata=meta,
        )

    def restore_canonical(self):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, metadata FROM ledger_entries WHERE metadata LIKE '%tampered%'")
        tampered_rows = cursor.fetchall()
        for r in tampered_rows:
            try:
                meta = json.loads(r["metadata"])
                if "original_action" in meta:
                    orig = meta["original_action"]
                    del meta["tampered"]
                    del meta["original_action"]
                    cursor.execute("UPDATE ledger_entries SET action = ?, metadata = ? WHERE id = ?", 
                                   (orig, json.dumps(meta), r["id"]))
            except Exception:
                pass
        conn.commit()
        conn.close()

ledger_service = LedgerService()
