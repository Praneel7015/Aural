import re
import sqlite3
from pathlib import Path

import numpy as np
import torch


class VoiceVault:
    def __init__(self, db_path: Path, embedding_dir: Path):
        self.db_path = db_path
        self.embedding_dir = embedding_dir
        self.embedding_dir.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(str(db_path), check_same_thread=False)
        self._init_schema()

    def _init_schema(self) -> None:
        self.db.execute(
            """
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                relationship TEXT,
                embedding_path TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
        )
        self.db.commit()

    @staticmethod
    def _slug(name: str) -> str:
        s = name.lower().strip()
        s = re.sub(r"\s+", "_", s)
        return re.sub(r"[^a-z0-9_]", "", s) or "contact"

    def enroll(self, name: str, relationship: str, embedding: np.ndarray) -> int:
        path = self.embedding_dir / f"{self._slug(name)}_{abs(hash(name)) % 10_000}.npy"
        np.save(path, embedding.astype(np.float32))
        cur = self.db.execute(
            "INSERT INTO contacts (name, relationship, embedding_path) VALUES (?, ?, ?)",
            (name, relationship, str(path)),
        )
        self.db.commit()
        return int(cur.lastrowid)

    def delete_contact(self, contact_id: int) -> bool:
        row = self.db.execute(
            "SELECT embedding_path FROM contacts WHERE id = ?",
            (contact_id,),
        ).fetchone()
        if not row:
            return False
        p = Path(row[0])
        self.db.execute("DELETE FROM contacts WHERE id = ?", (contact_id,))
        self.db.commit()
        if p.is_file():
            p.unlink()
        return True

    def list_contacts(self) -> list[dict]:
        rows = self.db.execute(
            "SELECT id, name, relationship, created_at FROM contacts ORDER BY id",
        ).fetchall()
        return [
            {"id": r[0], "name": r[1], "relationship": r[2], "created_at": r[3]}
            for r in rows
        ]

    def best_match_tensor(self, query: torch.Tensor) -> tuple[str | None, float]:
        q = query.detach().cpu().numpy().astype(np.float32)
        qn = np.linalg.norm(q)
        if qn < 1e-8:
            return None, -1.0
        best_name, best_score = None, -1.0
        for row in self.db.execute("SELECT name, embedding_path FROM contacts"):
            stored = np.load(row[1]).astype(np.float32)
            sn = np.linalg.norm(stored)
            if sn < 1e-8:
                continue
            sim = float(np.dot(stored, q) / (sn * qn))
            if sim > best_score:
                best_score = sim
                best_name = row[0]
        return best_name, best_score
