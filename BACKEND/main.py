from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any
from uuid import uuid4

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field, field_validator, model_validator
except Exception:  # pragma: no cover
    FastAPI = None
    HTTPException = Exception
    BaseModel = object
    Field = lambda default=None, **kwargs: default

    def field_validator(*args, **kwargs):
        def decorator(func):
            return func
        return decorator

    def model_validator(*args, **kwargs):
        def decorator(func):
            return func
        return decorator

try:  # package import
    from .medical import analyser_profil
    from .optimizer import optimiser_semaine
    from .serializers import build_mobile_payload, build_profile_summary
    from .storage import (
        get_dashboard_payload,
        get_latest_plan,
        get_latest_profile,
        get_plan_history,
        get_progress_summary,
        init_db,
        save_profile_snapshot,
        save_progress,
        save_weekly_plan,
    )
    from .auth import create_user, authenticate_user, get_user_by_id
except Exception:  # script import
    from medical import analyser_profil
    from optimizer import optimiser_semaine
    from serializers import build_mobile_payload, build_profile_summary
    from storage import (
        get_dashboard_payload,
        get_latest_plan,
        get_latest_profile,
        get_plan_history,
        get_progress_summary,
        init_db,
        save_profile_snapshot,
        save_progress,
        save_weekly_plan,
    )
    from auth import create_user, authenticate_user, get_user_by_id


class ProfilePayload(BaseModel):
    user_id: str | None = None
    nom: str | None = None
    ville: str | None = "Alger"
    age: int = Field(ge=12, le=100)
    poids: float = Field(gt=25, lt=300)
    taille: float = Field(gt=100, lt=250)
    sexe: str
    activite: str = "sedentaire"
    travail: str | None = None
    type_travail: str | None = None
    maladies: list[str] = Field(default_factory=list)
    antecedents: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    preferences: list[str] = Field(default_factory=list)
    aliments_refuses: list[str] = Field(default_factory=list)
    objectif: str = "maintien"
    budget_mensuel: float | None = Field(default=None, gt=0)
    budget: float | None = Field(default=None, gt=0)
    temps_cuisine_minutes: int | None = Field(default=30, ge=5, le=180)
    repas_par_jour: int | None = Field(default=3, ge=2, le=6)
    foyer_personnes: int | None = Field(default=1, ge=1, le=12)

    @field_validator("sexe")
    @classmethod
    def validate_sexe(cls, value: str) -> str:
        allowed = {"homme", "femme"}
        normalized = str(value or "").strip().lower()
        if normalized not in allowed:
            raise ValueError("sexe doit être 'homme' ou 'femme'")
        return normalized

    @field_validator("activite")
    @classmethod
    def validate_activite(cls, value: str) -> str:
        allowed = {"sedentaire", "leger", "modere", "actif", "tres_actif"}
        normalized = str(value or "").strip().lower().replace("é", "e")
        if normalized == "très_actif":
            normalized = "tres_actif"
        if normalized not in allowed:
            raise ValueError("activite invalide")
        return normalized

    @model_validator(mode="after")
    def ensure_budget_present(self):
        if self.budget_mensuel is None and self.budget is None:
            self.budget_mensuel = 12000.0
        return self


class ProgressPayload(BaseModel):
    user_id: str
    recorded_at: str | None = None
    weight_kg: float | None = Field(default=None, gt=20, lt=300)
    glycemia_mg_dl: float | None = Field(default=None, gt=20, lt=600)
    systolic_mm_hg: float | None = Field(default=None, gt=50, lt=260)
    diastolic_mm_hg: float | None = Field(default=None, gt=30, lt=180)
    adherence_score: float | None = Field(default=None, ge=0, le=100)
    spent_da: float | None = Field(default=None, ge=0)
    notes: str | None = None


class RegisterPayload(BaseModel):
    fullName: str = Field(min_length=2, max_length=50)
    email: str = Field(min_length=5, max_length=100)
    password: str = Field(min_length=4, max_length=100)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if "@" not in value or "." not in value:
            raise ValueError("Invalid email format")
        return value.lower().strip()


class LoginPayload(BaseModel):
    email: str = Field(min_length=5, max_length=100)
    password: str = Field(min_length=1, max_length=100)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if "@" not in value or "." not in value:
            raise ValueError("Invalid email format")
        return value.lower().strip()


def _model_to_dict(payload: Any) -> dict[str, Any]:
    if hasattr(payload, "model_dump"):
        return payload.model_dump(exclude_none=True)
    if hasattr(payload, "dict"):
        return payload.dict(exclude_none=True)
    return dict(payload)


def _ensure_user_id(profile: dict[str, Any]) -> str:
    existing = str(profile.get("user_id") or "").strip()
    if existing:
        return existing
    base_name = str(profile.get("nom") or "user").strip().lower().replace(" ", "-")
    return f"{base_name}-{uuid4().hex[:8]}"


def build_weekly_plan(profile: dict[str, Any], persist: bool = True) -> dict[str, Any]:
    materialized_profile = dict(profile)
    materialized_profile["user_id"] = _ensure_user_id(materialized_profile)
    analyse = analyser_profil(materialized_profile)
    programme = optimiser_semaine(analyse)
    progress_summary = get_progress_summary(materialized_profile["user_id"]) if persist else None
    mobile_payload = build_mobile_payload(analyse, programme, progress_summary)

    persistence = None
    if persist:
        save_profile_snapshot(
            materialized_profile["user_id"],
            analyse["profil"],
            analyse=analyse,
            summary=build_profile_summary(analyse),
        )
        persistence = save_weekly_plan(
            materialized_profile["user_id"],
            analyse["profil"],
            analyse,
            programme,
            mobile_payload,
        )

    return {
        "user_id": materialized_profile["user_id"],
        "analyse": {
            "profil": analyse["profil"],
            "calories_journalieres": analyse["calories_journalieres"],
            "macros": analyse["macros"],
            "budget_journalier": analyse["budget_journalier"],
            "budget_hebdomadaire": analyse["budget_hebdomadaire"],
            "budget_mensuel": analyse["budget_mensuel"],
            "nb_aliments_autorises": analyse["nb_aliments_autorises"],
            "nb_aliments_exclus": analyse["nb_aliments_exclus"],
            "aliments_exclus": analyse["aliments_exclus"][:25],
            "insights": analyse["insights"],
            "contraintes": analyse.get("contraintes", {}),
        },
        "programme": programme,
        "mobile": mobile_payload,
        "meta": {
            "backend_version": "3.1.0",
            "api_contract_version": "2026-03-v2",
            "ville_prix": analyse["profil"].get("ville", "Alger"),
            "budget_status": programme.get("budget", {}),
            "persistence": persistence,
        },
    }


if FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        init_db()
        yield

    app = FastAPI(title="NutriAlgerie Backend", version="3.1.0", lifespan=lifespan)
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allows all origins for development
        allow_credentials=True,
        allow_methods=["*"],  # Allows all methods
        allow_headers=["*"],  # Allows all headers
    )
else:
    app = None


if app:
    @app.get("/health")
    def health() -> dict[str, Any]:
        return {
            "status": "ok",
            "service": "nutrialgerie-backend",
            "version": "3.1.0",
            "contracts": ["weekly-plan-v2", "mobile-dashboard-v2", "auth-v1"],
            "features": [
                "dynamic-meals",
                "cooking-time-aware",
                "antecedent-aware-medical-rules",
                "city-price-adjustment",
                "user-authentication",
            ],
        }

    @app.post("/auth/register")
    def register(payload: RegisterPayload) -> dict[str, Any]:
        try:
            user_data = create_user(payload.fullName, payload.email, payload.password)
            return {
                "success": True,
                "message": "User registered successfully",
                "data": {
                    "user": {
                        "id": user_data["user_id"],
                        "fullName": user_data["full_name"],
                        "email": user_data["email"]
                    },
                    "token": user_data["user_id"]  # Using user_id as simple token
                }
            }
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail="Registration failed")

    @app.post("/auth/login")
    def login(payload: LoginPayload) -> dict[str, Any]:
        try:
            user_data = authenticate_user(payload.email, payload.password)
            if not user_data:
                raise HTTPException(status_code=401, detail="Invalid email or password")
            
            return {
                "success": True,
                "message": "Login successful",
                "data": {
                    "user": {
                        "id": user_data["user_id"],
                        "fullName": user_data["full_name"],
                        "email": user_data["email"]
                    },
                    "token": user_data["user_id"]  # Using user_id as simple token
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail="Login failed")

    @app.get("/auth/me")
    def get_current_user(user_id: str) -> dict[str, Any]:
        try:
            user_data = get_user_by_id(user_id)
            if not user_data:
                raise HTTPException(status_code=404, detail="User not found")
            
            return {
                "success": True,
                "data": {
                    "user": {
                        "id": user_data["user_id"],
                        "fullName": user_data["full_name"],
                        "email": user_data["email"]
                    }
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to get user data")


    @app.post("/analyse-profil")
    def analyse_profil(payload: ProfilePayload) -> dict[str, Any]:
        profile = _model_to_dict(payload)
        profile["user_id"] = _ensure_user_id(profile)
        analyse = analyser_profil(profile)
        profile_summary = build_profile_summary(analyse)
        save_profile_snapshot(profile["user_id"], analyse["profil"], analyse=analyse, summary=profile_summary)
        return {
            "user_id": profile["user_id"],
            "profil": analyse["profil"],
            "calories_journalieres": analyse["calories_journalieres"],
            "macros": analyse["macros"],
            "budget_journalier": analyse["budget_journalier"],
            "budget_hebdomadaire": analyse["budget_hebdomadaire"],
            "budget_mensuel": analyse["budget_mensuel"],
            "nb_aliments_autorises": analyse["nb_aliments_autorises"],
            "nb_aliments_exclus": analyse["nb_aliments_exclus"],
            "aliments_exclus": analyse["aliments_exclus"][:25],
            "insights": analyse["insights"],
            "profile_summary": profile_summary,
            "contraintes": analyse.get("contraintes", {}),
        }


    @app.post("/plan-semaine")
    def plan_semaine(payload: ProfilePayload) -> dict[str, Any]:
        return build_weekly_plan(_model_to_dict(payload), persist=True)


    @app.post("/profiles/save")
    def save_profile(payload: ProfilePayload) -> dict[str, Any]:
        profile = _model_to_dict(payload)
        profile["user_id"] = _ensure_user_id(profile)
        analyse = analyser_profil(profile)
        summary = build_profile_summary(analyse)
        return save_profile_snapshot(profile["user_id"], analyse["profil"], analyse=analyse, summary=summary)


    @app.get("/profiles/{user_id}")
    def profile_latest(user_id: str) -> dict[str, Any]:
        profile = get_latest_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profil introuvable")
        return profile


    @app.post("/progression/entry")
    def add_progress(payload: ProgressPayload) -> dict[str, Any]:
        return save_progress(_model_to_dict(payload))


    @app.get("/progression/{user_id}")
    def get_progress(user_id: str) -> dict[str, Any]:
        return get_progress_summary(user_id)


    @app.get("/plans/{user_id}/latest")
    def latest_plan(user_id: str) -> dict[str, Any]:
        plan = get_latest_plan(user_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Aucun plan trouvé")
        return plan


    @app.get("/plans/{user_id}/history")
    def plans_history(user_id: str, limit: int = 12) -> dict[str, Any]:
        return {"user_id": user_id, "items": get_plan_history(user_id, limit=min(max(limit, 1), 52))}


    @app.get("/dashboard/{user_id}")
    def mobile_dashboard(user_id: str) -> dict[str, Any]:
        data = get_dashboard_payload(user_id)
        latest_plan = data.get("latest_plan")
        if latest_plan and latest_plan.get("mobile"):
            return {
                "user_id": user_id,
                "mobile": latest_plan["mobile"],
                "profile": data.get("profile"),
                "progress": data.get("progress"),
            }
        raise HTTPException(status_code=404, detail="Dashboard mobile indisponible")


if __name__ == "__main__":
    demo_profile = {
        "nom": "Karim",
        "ville": "Alger",
        "age": 42,
        "poids": 72,
        "taille": 162,
        "sexe": "homme",
        "activite": "leger",
        "travail": "bureau",
        "maladies": ["pré-diabète", "hypertension"],
        "antecedents": ["cardiovasculaire"],
        "budget_mensuel": 8000,
        "preferences": ["lentilles", "courgettes", "merlan"],
        "aliments_refuses": ["thon"],
        "temps_cuisine_minutes": 25,
        "repas_par_jour": 4,
    }
    result = build_weekly_plan(demo_profile)
    print(result["analyse"]["insights"]["resume"])
    print(result["programme"]["resume"])
    print(result["programme"]["liste_courses_texte"])
