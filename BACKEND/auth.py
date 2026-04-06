from __future__ import annotations

import hashlib
import secrets
from typing import Any

from storage import _connect, _utc_now


def hash_password(password: str) -> str:
    """Hash password using SHA-256 with salt"""
    salt = secrets.token_hex(32)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{password_hash}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored hash"""
    try:
        salt, password_hash = stored_hash.split(":")
        computed_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        return computed_hash == password_hash
    except Exception:
        return False


def create_user(full_name: str, email: str, password: str) -> dict[str, Any]:
    """Create a new user with email and password"""
    conn = _connect()
    try:
        # Check if email already exists
        cursor = conn.execute(
            "SELECT user_id FROM users WHERE email = ?",
            (email.lower(),)
        )
        if cursor.fetchone():
            raise ValueError("Email already registered")

        # Generate user ID and hash password
        user_id = f"user_{secrets.token_hex(8)}"
        password_hash = hash_password(password)
        now = _utc_now()

        # Insert user
        conn.execute(
            """
            INSERT INTO users (user_id, nom, email, password_hash, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (user_id, full_name, email.lower(), password_hash, now, now)
        )
        conn.commit()

        return {
            "user_id": user_id,
            "full_name": full_name,
            "email": email.lower(),
            "created_at": now
        }
    finally:
        conn.close()


def authenticate_user(email: str, password: str) -> dict[str, Any] | None:
    """Authenticate user with email and password"""
    conn = _connect()
    try:
        cursor = conn.execute(
            """
            SELECT user_id, nom, email, password_hash, created_at
            FROM users WHERE email = ?
            """,
            (email.lower(),)
        )
        user = cursor.fetchone()
        
        if not user:
            return None
            
        if not verify_password(password, user["password_hash"]):
            return None
            
        return {
            "user_id": user["user_id"],
            "full_name": user["nom"],
            "email": user["email"],
            "created_at": user["created_at"]
        }
    finally:
        conn.close()


def get_user_by_id(user_id: str) -> dict[str, Any] | None:
    """Get user by ID"""
    conn = _connect()
    try:
        cursor = conn.execute(
            """
            SELECT user_id, nom, email, created_at, updated_at
            FROM users WHERE user_id = ?
            """,
            (user_id,)
        )
        user = cursor.fetchone()
        
        if not user:
            return None
            
        return {
            "user_id": user["user_id"],
            "full_name": user["nom"],
            "email": user["email"],
            "created_at": user["created_at"],
            "updated_at": user["updated_at"]
        }
    finally:
        conn.close()
