from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from typing import Any

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("NUTRIALGERIE_DB_PATH", os.path.join(BASE_DIR, "data", "app_data.sqlite3"))


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def _json_loads(value: str | None, fallback: Any) -> Any:
    if not value:
        return fallback
    try:
        return json.loads(value)
    except Exception:
        return fallback


def _connect() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = _connect()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                nom TEXT,
                ville TEXT,
                email TEXT UNIQUE,
                password_hash TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                profile_json TEXT NOT NULL,
                health_flags_json TEXT,
                summary_json TEXT,
                created_at TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1,
                FOREIGN KEY(user_id) REFERENCES users(user_id)
            );

            CREATE TABLE IF NOT EXISTS weekly_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                profile_snapshot_json TEXT NOT NULL,
                analysis_json TEXT NOT NULL,
                program_json TEXT NOT NULL,
                mobile_json TEXT,
                shopping_json TEXT,
                week_label TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(user_id)
            );

            CREATE TABLE IF NOT EXISTS progress_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                recorded_at TEXT NOT NULL,
                weight_kg REAL,
                glycemia_mg_dl REAL,
                systolic_mm_hg REAL,
                diastolic_mm_hg REAL,
                adherence_score REAL,
                spent_da REAL,
                notes TEXT,
                FOREIGN KEY(user_id) REFERENCES users(user_id)
            );

            CREATE INDEX IF NOT EXISTS idx_profiles_user_created_at ON profiles(user_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_plans_user_created_at ON weekly_plans(user_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_progress_user_recorded_at ON progress_entries(user_id, recorded_at ASC);
            """
        )
        conn.commit()
    finally:
        conn.close()


def _ensure_user(conn: sqlite3.Connection, user_id: str, nom: str | None, ville: str | None) -> None:
    now = _utc_now()
    existing = conn.execute("SELECT user_id FROM users WHERE user_id = ?", (user_id,)).fetchone()
    if existing:
        conn.execute(
            "UPDATE users SET nom = ?, ville = ?, updated_at = ? WHERE user_id = ?",
            (nom, ville, now, user_id),
        )
    else:
        conn.execute(
            "INSERT INTO users(user_id, nom, ville, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, nom, ville, now, now),
        )


def save_profile_snapshot(user_id: str, profile: dict[str, Any], analyse: dict[str, Any] | None = None, summary: dict[str, Any] | None = None) -> dict[str, Any]:
    init_db()
    created_at = _utc_now()
    conn = _connect()
    try:
        _ensure_user(conn, user_id, profile.get("nom"), profile.get("ville"))
        conn.execute("UPDATE profiles SET is_active = 0 WHERE user_id = ?", (user_id,))
        conn.execute(
            """
            INSERT INTO profiles (user_id, profile_json, health_flags_json, summary_json, created_at, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
            """,
            (
                user_id,
                _json_dumps(profile),
                _json_dumps((analyse or {}).get("insights", {}).get("flags", [])),
                _json_dumps(summary or {}),
                created_at,
            ),
        )
        conn.commit()
    finally:
        conn.close()
    return {
        "user_id": user_id,
        "created_at": created_at,
        "profile": profile,
        "health_flags": (analyse or {}).get("insights", {}).get("flags", []),
        "summary": summary or {},
    }


def get_latest_profile(user_id: str) -> dict[str, Any] | None:
    init_db()
    conn = _connect()
    try:
        row = conn.execute(
            """
            SELECT user_id, profile_json, health_flags_json, summary_json, created_at
            FROM profiles
            WHERE user_id = ? AND is_active = 1
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (user_id,),
        ).fetchone()
        if not row:
            return None
        return {
            "user_id": row["user_id"],
            "profile": _json_loads(row["profile_json"], {}),
            "health_flags": _json_loads(row["health_flags_json"], []),
            "summary": _json_loads(row["summary_json"], {}),
            "created_at": row["created_at"],
        }
    finally:
        conn.close()


def save_weekly_plan(user_id: str, profile: dict[str, Any], analyse: dict[str, Any], programme: dict[str, Any], mobile_payload: dict[str, Any]) -> dict[str, Any]:
    init_db()
    created_at = _utc_now()
    week_label = created_at[:10]
    conn = _connect()
    try:
        _ensure_user(conn, user_id, profile.get("nom"), profile.get("ville"))
        cursor = conn.execute(
            """
            INSERT INTO weekly_plans (
                user_id, profile_snapshot_json, analysis_json, program_json,
                mobile_json, shopping_json, week_label, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                _json_dumps(profile),
                _json_dumps(analyse),
                _json_dumps(programme),
                _json_dumps(mobile_payload),
                _json_dumps(programme.get("liste_courses", {})),
                week_label,
                created_at,
            ),
        )
        conn.commit()
        return {
            "plan_id": cursor.lastrowid,
            "user_id": user_id,
            "created_at": created_at,
            "week_label": week_label,
        }
    finally:
        conn.close()


def _deserialize_plan_row(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "plan_id": row["id"],
        "user_id": row["user_id"],
        "week_label": row["week_label"],
        "created_at": row["created_at"],
        "profile_snapshot": _json_loads(row["profile_snapshot_json"], {}),
        "analyse": _json_loads(row["analysis_json"], {}),
        "programme": _json_loads(row["program_json"], {}),
        "mobile": _json_loads(row["mobile_json"], {}),
        "shopping": _json_loads(row["shopping_json"], {}),
    }


def get_latest_plan(user_id: str) -> dict[str, Any] | None:
    init_db()
    conn = _connect()
    try:
        row = conn.execute(
            """
            SELECT * FROM weekly_plans
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (user_id,),
        ).fetchone()
        return _deserialize_plan_row(row) if row else None
    finally:
        conn.close()


def get_plan_history(user_id: str, limit: int = 12) -> list[dict[str, Any]]:
    init_db()
    conn = _connect()
    try:
        rows = conn.execute(
            """
            SELECT * FROM weekly_plans
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (user_id, limit),
        ).fetchall()
        return [_deserialize_plan_row(row) for row in rows]
    finally:
        conn.close()


def save_progress(entry: dict[str, Any]) -> dict[str, Any]:
    init_db()
    recorded_at = entry.get("recorded_at") or _utc_now()
    payload = {
        "user_id": entry["user_id"],
        "recorded_at": recorded_at,
        "weight_kg": entry.get("weight_kg"),
        "glycemia_mg_dl": entry.get("glycemia_mg_dl"),
        "systolic_mm_hg": entry.get("systolic_mm_hg"),
        "diastolic_mm_hg": entry.get("diastolic_mm_hg"),
        "adherence_score": entry.get("adherence_score"),
        "spent_da": entry.get("spent_da"),
        "notes": entry.get("notes"),
    }

    conn = _connect()
    try:
        _ensure_user(conn, payload["user_id"], entry.get("nom"), entry.get("ville"))
        conn.execute(
            """
            INSERT INTO progress_entries (
                user_id, recorded_at, weight_kg, glycemia_mg_dl,
                systolic_mm_hg, diastolic_mm_hg, adherence_score, spent_da, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload["user_id"],
                payload["recorded_at"],
                payload["weight_kg"],
                payload["glycemia_mg_dl"],
                payload["systolic_mm_hg"],
                payload["diastolic_mm_hg"],
                payload["adherence_score"],
                payload["spent_da"],
                payload["notes"],
            ),
        )
        conn.commit()
    finally:
        conn.close()
    return payload


def get_progress_history(user_id: str) -> list[dict[str, Any]]:
    init_db()
    conn = _connect()
    try:
        rows = conn.execute(
            """
            SELECT user_id, recorded_at, weight_kg, glycemia_mg_dl,
                   systolic_mm_hg, diastolic_mm_hg, adherence_score, spent_da, notes
            FROM progress_entries
            WHERE user_id = ?
            ORDER BY recorded_at ASC
            """,
            (user_id,),
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_progress_summary(user_id: str) -> dict[str, Any]:
    history = get_progress_history(user_id)
    if not history:
        return {
            "user_id": user_id,
            "entries": [],
            "summary": {
                "weight_change_kg": None,
                "glycemia_change_mg_dl": None,
                "average_adherence": None,
                "average_spent_da": None,
            },
        }

    def _first_last_delta(key: str):
        values = [item[key] for item in history if item.get(key) is not None]
        if len(values) < 2:
            return None
        return round(values[-1] - values[0], 2)

    adherence_values = [item["adherence_score"] for item in history if item.get("adherence_score") is not None]
    spent_values = [item["spent_da"] for item in history if item.get("spent_da") is not None]

    return {
        "user_id": user_id,
        "entries": history,
        "summary": {
            "weight_change_kg": _first_last_delta("weight_kg"),
            "glycemia_change_mg_dl": _first_last_delta("glycemia_mg_dl"),
            "average_adherence": round(sum(adherence_values) / len(adherence_values), 2) if adherence_values else None,
            "average_spent_da": round(sum(spent_values) / len(spent_values), 2) if spent_values else None,
        },
    }


def get_dashboard_payload(user_id: str) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "profile": get_latest_profile(user_id),
        "latest_plan": get_latest_plan(user_id),
        "progress": get_progress_summary(user_id),
    }
