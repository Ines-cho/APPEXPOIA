from __future__ import annotations

from typing import Any


def _round(value: float | int | None, digits: int = 0) -> float | int | None:
    if value is None:
        return None
    if digits == 0:
        return round(float(value))
    return round(float(value), digits)


def build_profile_summary(analyse: dict[str, Any]) -> dict[str, Any]:
    profil = analyse.get("profil", {})
    macros = analyse.get("macros", {})
    return {
        "schema_version": "v2",
        "nom": profil.get("nom"),
        "ville": profil.get("ville"),
        "age": profil.get("age"),
        "sexe": profil.get("sexe"),
        "activite": profil.get("activite"),
        "type_travail": profil.get("type_travail"),
        "objectif": profil.get("objectif"),
        "foyer_personnes": profil.get("foyer_personnes"),
        "repas_par_jour": profil.get("repas_par_jour"),
        "temps_cuisine_minutes": profil.get("temps_cuisine_minutes"),
        "calories_cible_jour": _round(analyse.get("calories_journalieres")),
        "budget_journalier_da": _round(analyse.get("budget_journalier")),
        "budget_hebdomadaire_da": _round(analyse.get("budget_hebdomadaire")),
        "budget_mensuel_da": _round(analyse.get("budget_mensuel")),
        "fibres_cible_g": _round(macros.get("fibres_g"), 1),
        "sodium_max_mg": _round(macros.get("sodium_max_mg"), 1),
    }


def build_daily_cards(programme: dict[str, Any]) -> list[dict[str, Any]]:
    cards: list[dict[str, Any]] = []
    for day in programme.get("plan_semaine", []):
        repas_resume = []
        for meal_key, items in day.get("repas", {}).items():
            repas_resume.append(
                {
                    "meal_key": meal_key,
                    "labels": [item.get("nom") for item in items],
                    "budget_da": _round(day.get("totaux_par_repas", {}).get(meal_key, {}).get("prix_estime_DA")),
                    "calories": _round(day.get("totaux_par_repas", {}).get(meal_key, {}).get("calories")),
                    "items_count": len(items),
                }
            )
        cards.append(
            {
                "jour": day.get("jour"),
                "budget_estime_da": _round(day.get("budget_estime_DA")),
                "budget_cible_da": _round(day.get("budget_cible_DA")),
                "budget_ok": bool(day.get("budget_ok", True)),
                "calories": _round(day.get("totaux", {}).get("calories")),
                "proteines_g": _round(day.get("totaux", {}).get("proteines_g"), 1),
                "glucides_g": _round(day.get("totaux", {}).get("glucides_g"), 1),
                "lipides_g": _round(day.get("totaux", {}).get("lipides_g"), 1),
                "fibres_g": _round(day.get("totaux", {}).get("fibres_g"), 1),
                "repas_count": day.get("repas_count"),
                "repas": repas_resume,
            }
        )
    return cards


_SECTION_KEYS = {
    "MARCHÉ (fruits, légumes, frais)": "marche",
    "ÉPICERIE (vrac & sec)": "epicerie",
    "PRODUITS LAITIERS": "produits_laitiers",
    "BOISSONS": "boissons",
    "AUTRES": "autres",
}


def build_shopping_groups(liste_courses: dict[str, Any]) -> list[dict[str, Any]]:
    groups = []
    for section, items in liste_courses.get("courses", {}).items():
        groups.append(
            {
                "group_key": _SECTION_KEYS.get(section, section.lower()),
                "label": section,
                "items": [
                    {
                        "food_id": item.get("food_id"),
                        "nom": item.get("nom_produit"),
                        "marque": item.get("marque"),
                        "format_achat": item.get("format_achat"),
                        "quantite": item.get("nb_unites"),
                        "prix_total_da": _round(item.get("prix_total_DA")),
                        "prix_estime": bool(item.get("prix_estime")),
                        "source": item.get("supermarche"),
                        "ville": item.get("ville"),
                    }
                    for item in items
                ],
            }
        )
    return groups


def build_budget_summaries(analyse: dict[str, Any], programme: dict[str, Any]) -> dict[str, Any]:
    budget = programme.get("budget", {})
    shopping = programme.get("liste_courses", {})
    return {
        "schema_version": "v2",
        "city": budget.get("city") or shopping.get("ville") or analyse.get("profil", {}).get("ville"),
        "daily": {
            "target_da": _round(budget.get("daily_target_DA") or analyse.get("budget_journalier")),
            "average_estimated_da": _round((shopping.get("total_DA", 0) or 0) / 7),
        },
        "weekly": {
            "target_da": _round(budget.get("weekly_target_DA") or analyse.get("budget_hebdomadaire")),
            "estimated_da": _round(budget.get("weekly_estimated_DA") or shopping.get("total_DA")),
            "within_budget": bool(budget.get("within_weekly_budget", True)),
        },
        "monthly": {
            "target_da": _round(budget.get("monthly_target_DA") or analyse.get("budget_mensuel")),
            "projected_da": _round(budget.get("monthly_projection_DA") or shopping.get("budget_mois")),
            "within_budget": bool(budget.get("within_monthly_budget", True)),
        },
    }


def build_progress_chart_data(progress_summary: dict[str, Any] | None) -> dict[str, Any]:
    progress_summary = progress_summary or {"entries": [], "summary": {}}
    entries = progress_summary.get("entries", [])
    return {
        "schema_version": "v2",
        "points": [
            {
                "recorded_at": entry.get("recorded_at"),
                "weight_kg": entry.get("weight_kg"),
                "glycemia_mg_dl": entry.get("glycemia_mg_dl"),
                "adherence_score": entry.get("adherence_score"),
                "spent_da": entry.get("spent_da"),
            }
            for entry in entries
        ],
        "summary": progress_summary.get("summary", {}),
    }


def build_mobile_payload(analyse: dict[str, Any], programme: dict[str, Any], progress_summary: dict[str, Any] | None = None) -> dict[str, Any]:
    insights = analyse.get("insights", {})
    return {
        "mobile_contract_version": "2026-03-v2",
        "profile_summary": build_profile_summary(analyse),
        "health_flags": insights.get("flags", []),
        "health_messages": insights.get("messages", []),
        "recommendations": {
            "a_favoriser": insights.get("a_favoriser", []),
            "a_eviter": insights.get("a_eviter", []),
        },
        "daily_cards": build_daily_cards(programme),
        "shopping_groups": build_shopping_groups(programme.get("liste_courses", {})),
        "progress_chart_data": build_progress_chart_data(progress_summary),
        "budget_summaries": build_budget_summaries(analyse, programme),
        "weekly_summary": {
            "resume": programme.get("resume"),
            "totaux": programme.get("totaux_semaine", {}),
            "repas_par_jour": programme.get("repas_par_jour"),
        },
    }
