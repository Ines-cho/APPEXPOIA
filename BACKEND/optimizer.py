"""
optimizer.py
------------
Construit un plan hebdomadaire exploitable côté mobile avec :
- nombre de repas dynamique (2 à 6/jour)
- prise en compte du temps cuisine
- préférence locale et budget-aware
- résumé budget cohérent
- liste de courses consolidée avec ville
"""

from __future__ import annotations

from collections import Counter
from typing import Any

try:
    from .medical import detecter_role_aliment
    from .price_mapper import formater_liste_affichage, generer_liste_courses, get_reference_price_per_unit
except Exception:
    from medical import detecter_role_aliment
    from price_mapper import formater_liste_affichage, generer_liste_courses, get_reference_price_per_unit

DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

MEAL_TEMPLATES = {
    2: {
        "dejeuner": 0.48,
        "diner": 0.52,
    },
    3: {
        "petit_dejeuner": 0.25,
        "dejeuner": 0.40,
        "diner": 0.35,
    },
    4: {
        "petit_dejeuner": 0.22,
        "dejeuner": 0.35,
        "collation_apres_midi": 0.10,
        "diner": 0.33,
    },
    5: {
        "petit_dejeuner": 0.20,
        "collation_matin": 0.08,
        "dejeuner": 0.34,
        "collation_apres_midi": 0.08,
        "diner": 0.30,
    },
    6: {
        "petit_dejeuner": 0.17,
        "collation_matin": 0.08,
        "dejeuner": 0.28,
        "collation_apres_midi": 0.08,
        "diner": 0.24,
        "collation_soir": 0.15,
    },
}

SLOTS = {
    "petit_dejeuner": [
        ("laitier_ou_proteine", 0.35),
        ("feculent", 0.40),
        ("fruit", 0.25),
    ],
    "dejeuner": [
        ("proteine", 0.35),
        ("feculent_ou_legumineuse", 0.35),
        ("legume", 0.30),
    ],
    "diner": [
        ("legumineuse_ou_proteine", 0.35),
        ("legume", 0.30),
        ("laitier_ou_fruit", 0.35),
    ],
    "collation_matin": [
        ("fruit_ou_laitier", 0.55),
        ("feculent_ou_laitier", 0.45),
    ],
    "collation_apres_midi": [
        ("fruit_ou_laitier", 0.50),
        ("proteine_legere_ou_feculent", 0.50),
    ],
    "collation_soir": [
        ("laitier_ou_fruit", 0.55),
        ("proteine_legere_ou_feculent", 0.45),
    ],
}

SPECIFIC_PORTION_RANGES = {
    "oeufs": (100, 150),
    "lait": (220, 300),
    "yaourt": (110, 180),
    "yaourt_grec": (100, 150),
    "lben": (220, 300),
    "jben": (60, 90),
    "semoule": (80, 130),
    "semoule_fine": (70, 120),
    "farine_orge": (70, 110),
    "farine_ble": (70, 110),
    "riz": (80, 130),
    "lentilles": (90, 140),
    "pois_chiches": (90, 140),
    "haricots_rouges": (90, 140),
    "pois_casses": (90, 140),
    "feves": (90, 140),
    "thon": (100, 130),
    "poulet_blanc": (120, 170),
    "poulet_cuisse": (130, 170),
    "boeuf": (120, 160),
    "filet_boeuf": (120, 160),
    "merlan": (150, 200),
    "sardines": (150, 200),
    "tomates": (150, 220),
    "carottes": (150, 220),
    "courgettes": (180, 260),
    "epinards": (180, 260),
    "oignons": (60, 120),
    "ail": (5, 15),
    "oranges": (140, 220),
    "pommes": (140, 220),
    "bananes": (120, 180),
    "figues_seches": (30, 45),
    "dattes": (25, 40),
    "flocons_avoine": (50, 80),
}

ROLE_PORTION_RANGES = {
    "proteine": (120, 170),
    "legumineuse": (90, 140),
    "feculent": (80, 130),
    "legume": (150, 260),
    "fruit": (140, 220),
    "laitier": (110, 280),
    "autre": (60, 120),
}

CHEAP_PROTEINS = {"oeufs", "lentilles", "pois_chiches", "haricots_rouges", "merlan", "lben", "yaourt"}
CHEAP_STAPLES = CHEAP_PROTEINS | {"semoule", "semoule_fine", "courgettes", "carottes", "tomates", "oranges", "pommes", "lait", "riz", "flocons_avoine"}
EXPENSIVE_BUDGET_IDS = {"filet_boeuf", "boeuf", "agneau_hache", "amandes", "yaourt_grec"}
BOOSTERS_BY_MEAL = {
    "petit_dejeuner": ["flocons_avoine", "semoule_fine", "lait", "yaourt", "bananes", "pommes", "dattes"],
    "dejeuner": ["semoule", "semoule_fine", "riz", "lentilles", "pois_chiches", "oeufs", "pommes_de_terre"],
    "diner": ["lentilles", "pois_chiches", "oeufs", "lben", "yaourt", "pommes"],
    "collation_matin": ["yaourt", "lait", "pommes", "oranges", "bananes", "dattes"],
    "collation_apres_midi": ["yaourt", "lben", "pommes", "oranges", "flocons_avoine", "dattes"],
    "collation_soir": ["lben", "yaourt", "pommes", "oranges"],
}

ULTRA_LOW_BUDGET_FOODS = {
    "oeufs", "lentilles", "pois_chiches", "semoule_fine", "flocons_avoine",
    "courgettes", "carottes", "tomates", "oignons", "epinards",
    "oranges", "lben", "yaourt",
}
LOW_BUDGET_FOODS = ULTRA_LOW_BUDGET_FOODS | {"merlan", "sardines", "pommes", "pommes_de_terre", "laitue", "lait"}

VERY_QUICK_FOODS = {"oeufs", "yaourt", "lben", "lait", "pommes", "oranges", "bananes", "dattes", "thon"}
QUICK_FOODS = VERY_QUICK_FOODS | {"flocons_avoine", "semoule_fine", "tomates", "carottes", "courgettes", "concombre", "jben"}
SLOW_PREP_FOODS = {"pois_chiches", "haricots_rouges", "feves", "boeuf", "filet_boeuf", "agneau_hache"}
CARDIO_FRIENDLY = {"merlan", "sardines", "lentilles", "pois_chiches", "flocons_avoine", "epinards"}
ANEMIA_FRIENDLY = {"epinards", "lentilles", "pois_chiches", "oeufs", "boeuf", "filet_boeuf"}


def _budget_tier(budget_daily: float) -> str:
    if budget_daily <= 230:
        return "ultra_low"
    if budget_daily <= 300:
        return "low"
    if budget_daily <= 450:
        return "medium"
    return "comfortable"


def _budget_friendly_food_ids(budget_daily: float) -> set[str]:
    tier = _budget_tier(budget_daily)
    if tier == "ultra_low":
        return ULTRA_LOW_BUDGET_FOODS
    if tier == "low":
        return LOW_BUDGET_FOODS
    return ULTRA_LOW_BUDGET_FOODS | LOW_BUDGET_FOODS | CHEAP_STAPLES


def _is_budget_friendly(food_id: str, budget_daily: float) -> bool:
    tier = _budget_tier(budget_daily)
    if tier == "comfortable":
        return True
    return food_id in _budget_friendly_food_ids(budget_daily)


def _normalize_text(value: Any) -> str:
    return str(value or "").strip().lower()


def _city(analyse: dict) -> str:
    return str(analyse.get("profil", {}).get("ville") or "Alger")


def _meal_ratios(analyse: dict) -> dict[str, float]:
    meal_count = int(analyse.get("contraintes", {}).get("repas_par_jour") or analyse.get("profil", {}).get("repas_par_jour") or 3)
    meal_count = max(2, min(meal_count, 6))
    return dict(MEAL_TEMPLATES[meal_count])


def _meal_matches(aliment: dict[str, Any], repas: str) -> bool:
    repas_autorises = [_normalize_text(r) for r in aliment.get("repas", [])]
    if not repas_autorises:
        return True
    if repas in repas_autorises:
        return True
    if repas.startswith("collation"):
        return any(r in {"petit_dejeuner", "diner", "snack", "collation"} for r in repas_autorises)
    return False


def _slot_matches(slot: str, role: str) -> bool:
    mapping = {
        "proteine": {"proteine"},
        "feculent_ou_legumineuse": {"feculent", "legumineuse"},
        "legumineuse_ou_proteine": {"legumineuse", "proteine"},
        "laitier_ou_proteine": {"laitier", "proteine"},
        "laitier_ou_fruit": {"laitier", "fruit"},
        "fruit_ou_laitier": {"fruit", "laitier"},
        "feculent_ou_laitier": {"feculent", "laitier"},
        "proteine_legere_ou_feculent": {"proteine", "feculent", "laitier"},
        "legume": {"legume"},
        "fruit": {"fruit"},
        "feculent": {"feculent"},
    }
    return role in mapping.get(slot, set())


def _portion_range(aliment: dict[str, Any], role: str) -> tuple[int, int]:
    food_id = aliment.get("food_id")
    if food_id in SPECIFIC_PORTION_RANGES:
        return SPECIFIC_PORTION_RANGES[food_id]
    return ROLE_PORTION_RANGES.get(role, ROLE_PORTION_RANGES["autre"])


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _compute_portion(aliment: dict[str, Any], role: str, slot_target_calories: float, repas: str | None = None) -> float:
    cal_100g = float(aliment.get("calories_100g") or 100)
    low, high = _portion_range(aliment, role)
    stretch = 1.20 if role in {"feculent", "legumineuse"} else 1.0
    if repas and repas.startswith("collation"):
        low *= 0.65
        high *= 0.72
        stretch = min(stretch, 1.0)
    grams = (slot_target_calories / max(cal_100g, 1)) * 100
    return round(_clamp(grams, low, high * stretch), 0)


def _price_per_kg(aliment: dict[str, Any], analyse: dict) -> float:
    return float(get_reference_price_per_unit(aliment.get("food_id"), food_category=aliment.get("categorie"), city=_city(analyse)))


def _portion_cost(aliment: dict[str, Any], grams: float, analyse: dict) -> float:
    return _price_per_kg(aliment, analyse) * (float(grams) / 1000)


def _health_score(aliment: dict[str, Any], analyse: dict) -> float:
    maladies = analyse["profil"].get("maladies", [])
    antecedents = analyse["profil"].get("antecedents", [])
    score = 0.0
    fibres = float(aliment.get("fibres_100g", 0) or 0)
    sodium = float(aliment.get("sodium_100g", 0) or 0)
    ig = float(aliment.get("index_glycemique", 0) or 0)
    proteines = float(aliment.get("proteines_100g", 0) or 0)
    food_id = aliment.get("food_id")

    if "diabete" in maladies:
        score += fibres * 0.45
        score += max(0, 70 - ig) * 0.08
    if "hypertension" in maladies:
        score += max(0, 220 - sodium) * 0.01
    if "cholesterol" in maladies and food_id in {"lentilles", "pois_chiches", "haricots_rouges", "merlan", "sardines"}:
        score += 3.0
    if "anemie" in maladies and food_id in ANEMIA_FRIENDLY:
        score += 2.5
    if "cardiovasculaire" in antecedents and food_id in CARDIO_FRIENDLY:
        score += 2.0
    score += proteines * 0.05
    return score


def _preference_score(aliment: dict[str, Any], preferences: list[str]) -> float:
    text = f"{aliment.get('food_id', '')} {aliment.get('nom', '')}".lower()
    score = 0.0
    for pref in preferences:
        pref_norm = pref.lower().strip()
        if pref_norm and pref_norm in text:
            score += 3.0
    return score


def _budget_score(aliment: dict[str, Any], analyse: dict) -> float:
    budget_daily = float(analyse.get("budget_journalier") or 0)
    portion_price = _portion_cost(aliment, 100, analyse)
    if budget_daily <= 0:
        return 0.0
    relative = portion_price / max(budget_daily, 1)
    score = max(-12.0, 7.0 - (relative * 12))
    food_id = aliment.get("food_id")
    tier = _budget_tier(budget_daily)
    if food_id in EXPENSIVE_BUDGET_IDS and budget_daily < 450:
        score -= 6.0
    if tier == "ultra_low" and food_id not in ULTRA_LOW_BUDGET_FOODS:
        score -= 8.5
    elif tier == "low" and food_id not in LOW_BUDGET_FOODS:
        score -= 5.0
    elif tier == "medium" and food_id not in CHEAP_STAPLES and food_id not in LOW_BUDGET_FOODS:
        score -= 1.5
    if budget_daily < 300 and food_id in {"yaourt_grec", "figues_seches", "filet_boeuf", "boeuf", "amandes"}:
        score -= 9.0
    return score


def _cooking_score(aliment: dict[str, Any], analyse: dict, repas: str) -> float:
    temps = int(analyse.get("contraintes", {}).get("temps_cuisine_minutes") or analyse.get("profil", {}).get("temps_cuisine_minutes") or 30)
    food_id = aliment.get("food_id")
    score = 0.0
    if temps <= 20:
        if food_id in VERY_QUICK_FOODS:
            score += 3.0
        elif food_id in QUICK_FOODS:
            score += 1.8
        elif food_id in SLOW_PREP_FOODS:
            score -= 2.5
    elif temps <= 35:
        if food_id in QUICK_FOODS:
            score += 1.0
        if food_id in SLOW_PREP_FOODS and repas.startswith("collation"):
            score -= 2.0
    elif temps >= 60:
        if food_id in SLOW_PREP_FOODS:
            score += 0.8
    if repas.startswith("collation") and food_id in VERY_QUICK_FOODS:
        score += 1.4
    return score


def _diversity_penalty(food_id: str, weekly_counter: Counter, yesterday_ids: set[str], day_ids: set[str]) -> float:
    penalty = 0.0
    count = weekly_counter.get(food_id, 0)
    multiplier = 0.7 if food_id in CHEAP_STAPLES else 1.0
    penalty += count * 1.5 * multiplier
    if food_id in yesterday_ids:
        penalty += 1.8 * multiplier
    if food_id in day_ids:
        penalty += 5.0
    return penalty


def _candidate_score(aliment: dict[str, Any], analyse: dict, weekly_counter: Counter, yesterday_ids: set[str], day_ids: set[str], repas: str) -> float:
    food_id = aliment.get("food_id")
    score = 0.0
    score += 2.0 if aliment.get("local") else 0.0
    score += _health_score(aliment, analyse)
    score += _preference_score(aliment, analyse["profil"].get("preferences", []))
    score += _budget_score(aliment, analyse)
    score += _cooking_score(aliment, analyse, repas)
    if food_id in CHEAP_PROTEINS:
        score += 1.6
    if food_id in CHEAP_STAPLES:
        score += 0.8
    score -= _diversity_penalty(food_id, weekly_counter, yesterday_ids, day_ids)
    return score


def _choose_food(
    candidates: list[dict[str, Any]],
    analyse: dict,
    weekly_counter: Counter,
    yesterday_ids: set[str],
    day_ids: set[str],
    slot_target_calories: float,
    slot_budget: float,
    repas: str,
) -> dict[str, Any] | None:
    if not candidates:
        return None

    budget_daily = float(analyse.get("budget_journalier") or 0)
    budget_friendly = [aliment for aliment in candidates if _is_budget_friendly(aliment.get("food_id", ""), budget_daily)]
    if budget_friendly and _budget_tier(budget_daily) in {"ultra_low", "low"}:
        candidates = budget_friendly

    ranked = sorted(
        candidates,
        key=lambda aliment: (
            -_candidate_score(aliment, analyse, weekly_counter, yesterday_ids, day_ids, repas),
            _portion_cost(aliment, _compute_portion(aliment, detecter_role_aliment(aliment), slot_target_calories, repas), analyse),
        ),
    )

    affordable = []
    for aliment in ranked:
        role = detecter_role_aliment(aliment)
        grams = _compute_portion(aliment, role, slot_target_calories, repas)
        if _portion_cost(aliment, grams, analyse) <= max(slot_budget, 12) * 1.15:
            affordable.append(aliment)
    if affordable:
        return affordable[0]

    cheapest = min(
        ranked,
        key=lambda aliment: _portion_cost(aliment, _compute_portion(aliment, detecter_role_aliment(aliment), slot_target_calories, repas), analyse),
    )
    return cheapest


def _slot_candidates(aliments: list[dict[str, Any]], repas: str, slot: str) -> list[dict[str, Any]]:
    matches = []
    for aliment in aliments:
        if not _meal_matches(aliment, repas):
            continue
        role = detecter_role_aliment(aliment)
        if _slot_matches(slot, role):
            matches.append(aliment)
    return matches


def _build_item(aliment: dict[str, Any], analyse: dict, repas: str, role: str, slot_target_calories: float) -> dict[str, Any]:
    quantite_g = _compute_portion(aliment, role, slot_target_calories, repas)
    cal_100g = float(aliment.get("calories_100g") or 100)
    return {
        "food_id": aliment.get("food_id"),
        "nom": aliment.get("nom", ""),
        "categorie": aliment.get("categorie", ""),
        "repas": repas,
        "role": role,
        "quantite_g": quantite_g,
        "quantite_kg": round(quantite_g / 1000, 3),
        "calories": round(cal_100g * quantite_g / 100),
        "proteines_g": round(float(aliment.get("proteines_100g", 0) or 0) * quantite_g / 100, 1),
        "glucides_g": round(float(aliment.get("glucides_100g", 0) or 0) * quantite_g / 100, 1),
        "lipides_g": round(float(aliment.get("lipides_100g", 0) or 0) * quantite_g / 100, 1),
        "fibres_g": round(float(aliment.get("fibres_100g", 0) or 0) * quantite_g / 100, 1),
        "sodium_mg": round(float(aliment.get("sodium_100g", 0) or 0) * quantite_g / 100, 1),
        "prix_estime_DA": round(_portion_cost(aliment, quantite_g, analyse), 1),
    }


def _fallback_candidates(aliments: list[dict[str, Any]], repas: str) -> list[dict[str, Any]]:
    return [aliment for aliment in aliments if _meal_matches(aliment, repas)] or aliments


def _find_affordable_replacement(
    item: dict[str, Any],
    analyse: dict,
    weekly_counter: Counter,
    previous_day_ids: set[str],
    daily_ids: set[str],
) -> dict[str, Any] | None:
    budget_daily = float(analyse.get("budget_journalier") or 0)
    current_cost = float(item.get("prix_estime_DA", 0) or 0)
    current_calories = float(item.get("calories", 0) or 0)
    role = item.get("role")
    repas = item.get("repas")
    candidates = []
    for aliment in analyse["aliments_autorises"]:
        if aliment.get("food_id") == item.get("food_id"):
            continue
        if not _meal_matches(aliment, repas):
            continue
        if detecter_role_aliment(aliment) != role:
            continue
        if _budget_tier(budget_daily) in {"ultra_low", "low"} and not _is_budget_friendly(aliment.get("food_id", ""), budget_daily):
            continue
        candidates.append(aliment)

    if not candidates:
        return None

    candidates = sorted(
        candidates,
        key=lambda aliment: (
            _portion_cost(aliment, _compute_portion(aliment, role, current_calories, repas), analyse),
            -_candidate_score(aliment, analyse, weekly_counter, previous_day_ids, daily_ids, repas),
        ),
    )
    for aliment in candidates:
        replacement = _build_item(aliment, analyse, repas, role, current_calories)
        if float(replacement["prix_estime_DA"]) <= current_cost - 5 and float(replacement["calories"]) >= current_calories * 0.72:
            return replacement
    return None


def _rebalance_daily_budget(
    analyse: dict,
    daily_plan: dict[str, list[dict[str, Any]]],
    weekly_counter: Counter,
    previous_day_ids: set[str],
    daily_ids: set[str],
) -> None:
    budget_daily = float(analyse.get("budget_journalier") or 0)
    if not budget_daily:
        return

    threshold = budget_daily * (1.03 if _budget_tier(budget_daily) in {"ultra_low", "low"} else 1.12)

    def total_cost() -> float:
        return sum(float(item.get("prix_estime_DA", 0) or 0) for items in daily_plan.values() for item in items)

    current_total = total_cost()
    if current_total <= threshold:
        return

    for repas, items in daily_plan.items():
        indexed_items = sorted(enumerate(items), key=lambda row: float(row[1].get("prix_estime_DA", 0) or 0), reverse=True)
        for index, item in indexed_items:
            replacement = _find_affordable_replacement(item, analyse, weekly_counter, previous_day_ids, daily_ids)
            if replacement is None:
                continue
            items[index] = replacement
            current_total = total_cost()
            if current_total <= threshold:
                return

    if current_total <= threshold:
        return

    trim_targets = {"fruit", "laitier", "feculent"}
    for items in daily_plan.values():
        for item in sorted(items, key=lambda row: float(row.get("prix_estime_DA", 0) or 0), reverse=True):
            if item.get("role") not in trim_targets:
                continue
            item["quantite_g"] = round(float(item["quantite_g"]) * 0.85, 0)
            item["quantite_kg"] = round(float(item["quantite_g"]) / 1000, 3)
            item["calories"] = round(float(item["calories"]) * 0.85)
            item["proteines_g"] = round(float(item["proteines_g"]) * 0.85, 1)
            item["glucides_g"] = round(float(item["glucides_g"]) * 0.85, 1)
            item["lipides_g"] = round(float(item["lipides_g"]) * 0.85, 1)
            item["fibres_g"] = round(float(item["fibres_g"]) * 0.85, 1)
            item["sodium_mg"] = round(float(item["sodium_mg"]) * 0.85, 1)
            item["prix_estime_DA"] = round(float(item["prix_estime_DA"]) * 0.85, 1)
            current_total = total_cost()
            if current_total <= threshold:
                return


def _meal_totals(items: list[dict[str, Any]]) -> dict[str, float]:
    return {
        "calories": round(sum(item["calories"] for item in items)),
        "prix_estime_DA": round(sum(float(item.get("prix_estime_DA", 0)) for item in items)),
    }


def _add_energy_boosters(
    analyse: dict,
    daily_plan: dict[str, list[dict[str, Any]]],
    weekly_counter: Counter,
    previous_day_ids: set[str],
    daily_ids: set[str],
    meal_ratios: dict[str, float],
) -> None:
    target = float(analyse["calories_journalieres"])
    current = sum(item["calories"] for items in daily_plan.values() for item in items)
    if current >= target * 0.92:
        return

    budget_daily = float(analyse.get("budget_journalier") or 0)
    current_cost = sum(float(item.get("prix_estime_DA", 0)) for items in daily_plan.values() for item in items)

    for repas in meal_ratios.keys():
        gap = target - current
        if gap <= target * 0.08:
            break

        boost_ids = set(BOOSTERS_BY_MEAL.get(repas, []))
        candidates = [
            aliment for aliment in analyse["aliments_autorises"]
            if aliment.get("food_id") in boost_ids and _meal_matches(aliment, repas)
        ]
        if not candidates:
            continue

        ranked = sorted(
            candidates,
            key=lambda aliment: (
                -_candidate_score(aliment, analyse, weekly_counter, previous_day_ids, daily_ids, repas),
                _portion_cost(aliment, _compute_portion(aliment, detecter_role_aliment(aliment), gap * 0.5, repas), analyse),
            ),
        )
        chosen = ranked[0]
        role = detecter_role_aliment(chosen)
        item = _build_item(chosen, analyse, repas, role, min(gap * 0.55, target * max(meal_ratios.get(repas, 0.1), 0.12)))

        if budget_daily and current_cost + float(item["prix_estime_DA"]) > budget_daily * 1.35:
            continue

        daily_plan[repas].append(item)
        weekly_counter[chosen["food_id"]] += 1
        daily_ids.add(chosen["food_id"])
        current += item["calories"]
        current_cost += float(item["prix_estime_DA"])


def generer_jour(analyse: dict, day_index: int, weekly_counter: Counter, previous_day_ids: set[str]) -> dict[str, Any]:
    aliments = analyse["aliments_autorises"]
    daily_plan: dict[str, list[dict[str, Any]]] = {}
    daily_ids: set[str] = set()
    calories_j = float(analyse["calories_journalieres"])
    budget_daily = float(analyse.get("budget_journalier") or 0)
    meal_ratios = _meal_ratios(analyse)

    for repas, repas_ratio in meal_ratios.items():
        meal_target = calories_j * repas_ratio
        meal_items: list[dict[str, Any]] = []

        for slot, slot_ratio in SLOTS[repas]:
            slot_target = meal_target * slot_ratio
            slot_budget = budget_daily * repas_ratio * slot_ratio if budget_daily else 0
            candidates = _slot_candidates(aliments, repas, slot)
            if not candidates:
                candidates = _fallback_candidates(aliments, repas)
            chosen = _choose_food(candidates, analyse, weekly_counter, previous_day_ids, daily_ids, slot_target, slot_budget, repas)
            if chosen is None:
                continue
            role = detecter_role_aliment(chosen)
            item = _build_item(chosen, analyse, repas, role, slot_target)
            meal_items.append(item)
            weekly_counter[chosen["food_id"]] += 1
            daily_ids.add(chosen["food_id"])

        daily_plan[repas] = meal_items

    _add_energy_boosters(analyse, daily_plan, weekly_counter, previous_day_ids, daily_ids, meal_ratios)
    _rebalance_daily_budget(analyse, daily_plan, weekly_counter, previous_day_ids, daily_ids)

    all_items = [item for items in daily_plan.values() for item in items]
    totals = {
        "calories": round(sum(item["calories"] for item in all_items)),
        "proteines_g": round(sum(item["proteines_g"] for item in all_items), 1),
        "glucides_g": round(sum(item["glucides_g"] for item in all_items), 1),
        "lipides_g": round(sum(item["lipides_g"] for item in all_items), 1),
        "fibres_g": round(sum(item["fibres_g"] for item in all_items), 1),
        "sodium_mg": round(sum(item["sodium_mg"] for item in all_items), 1),
    }

    estimated_cost = round(sum(float(item.get("prix_estime_DA", 0)) for item in all_items))
    by_meal = {repas: _meal_totals(items) for repas, items in daily_plan.items()}

    return {
        "jour": DAYS[day_index],
        "repas": daily_plan,
        "totaux": totals,
        "totaux_par_repas": by_meal,
        "budget_estime_DA": estimated_cost,
        "budget_cible_DA": round(budget_daily),
        "budget_ok": estimated_cost <= round(budget_daily * (1.03 if _budget_tier(budget_daily) in {"ultra_low", "low"} else 1.12)) if budget_daily else True,
        "food_ids": sorted(daily_ids),
        "repas_count": len(meal_ratios),
    }


def _flatten_week(week_plan: list[dict[str, Any]]) -> list[dict[str, Any]]:
    items = []
    for day in week_plan:
        for repas_items in day["repas"].values():
            items.extend(repas_items)
    return items


def _weekly_totals(week_plan: list[dict[str, Any]]) -> dict[str, Any]:
    all_items = _flatten_week(week_plan)
    calories = round(sum(item["calories"] for item in all_items))
    return {
        "calories": calories,
        "calories_moyennes_jour": round(calories / 7),
        "proteines_g": round(sum(item["proteines_g"] for item in all_items), 1),
        "glucides_g": round(sum(item["glucides_g"] for item in all_items), 1),
        "lipides_g": round(sum(item["lipides_g"] for item in all_items), 1),
        "fibres_g": round(sum(item["fibres_g"] for item in all_items), 1),
        "sodium_mg": round(sum(item["sodium_mg"] for item in all_items), 1),
        "sodium_moyen_jour_mg": round(sum(item["sodium_mg"] for item in all_items) / 7, 1),
    }


def _build_summary(analyse: dict, week_plan: list[dict[str, Any]], shopping: dict, totals: dict[str, Any]) -> str:
    weekly_budget = float(analyse.get("budget_hebdomadaire", 0) or 0)
    total = float(shopping.get("total_DA", 0) or 0)
    diseases = analyse["profil"].get("maladies", [])
    antecedents = analyse["profil"].get("antecedents", [])
    target_cal = float(analyse.get("calories_journalieres") or 0)
    avg_cal = float(totals.get("calories_moyennes_jour") or 0)
    meal_count = int(analyse.get("contraintes", {}).get("repas_par_jour") or 3)

    parts = []
    if total <= weekly_budget:
        parts.append(f"budget hebdomadaire contenu ({round(total)} DA pour un plafond de {round(weekly_budget)} DA)")
    else:
        parts.append(f"budget hebdomadaire au-dessus de la cible de {round(total - weekly_budget)} DA")

    if avg_cal >= target_cal * 0.9:
        parts.append(f"apport énergétique proche de la cible ({round(avg_cal)} kcal/j)")
    else:
        parts.append(f"apport énergétique encore bas ({round(avg_cal)} kcal/j pour une cible de {round(target_cal)} kcal/j)")

    if "diabete" in diseases:
        parts.append("glucides rapides limités et fibres renforcées")
    if "hypertension" in diseases:
        parts.append("sources salées contrôlées")
    if "cholesterol" in diseases:
        parts.append("rotation viande/poisson/légumineuses plus saine")
    if "cardiovasculaire" in antecedents:
        parts.append("prévention cardio renforcée")

    parts.append(f"répartition sur {meal_count} prises par jour")
    parts.append("variété répartie sur 7 jours")
    return "; ".join(parts) + "."


def optimiser_semaine(analyse: dict) -> dict[str, Any]:
    weekly_counter: Counter = Counter()
    week_plan = []
    previous_ids: set[str] = set()

    for day_index in range(7):
        day_plan = generer_jour(analyse, day_index, weekly_counter, previous_ids)
        previous_ids = set(day_plan["food_ids"])
        week_plan.append(day_plan)

    weekly_items = _flatten_week(week_plan)
    shopping = generer_liste_courses(weekly_items, city=_city(analyse))
    totals = _weekly_totals(week_plan)
    summary = _build_summary(analyse, week_plan, shopping, totals)

    monthly_budget_target = round(float(analyse.get("budget_mensuel") or 0))
    budget = {
        "daily_target_DA": round(float(analyse.get("budget_journalier") or 0)),
        "weekly_target_DA": round(float(analyse.get("budget_hebdomadaire") or 0)),
        "weekly_estimated_DA": round(float(shopping.get("total_DA") or 0)),
        "monthly_target_DA": monthly_budget_target,
        "monthly_projection_DA": round(float(shopping.get("budget_mois") or 0)),
        "within_weekly_budget": float(shopping.get("total_DA") or 0) <= float(analyse.get("budget_hebdomadaire") or 0),
        "within_monthly_budget": float(shopping.get("budget_mois") or 0) <= float(analyse.get("budget_mensuel") or 0),
        "city": _city(analyse),
    }

    return {
        "plan_semaine": week_plan,
        "totaux_semaine": totals,
        "liste_courses": shopping,
        "liste_courses_texte": formater_liste_affichage(shopping),
        "budget": budget,
        "resume": summary,
        "repas_par_jour": int(analyse.get("contraintes", {}).get("repas_par_jour") or 3),
    }


def optimiser_repas(analyse: dict) -> dict[str, Any]:
    return optimiser_semaine(analyse)


if __name__ == "__main__":
    try:
        from .medical import analyser_profil
    except Exception:
        from medical import analyser_profil

    profil_demo = {
        "age": 42,
        "poids": 72,
        "taille": 162,
        "sexe": "femme",
        "activite": "sedentaire",
        "travail": "bureau",
        "maladies": ["pré-diabète"],
        "budget_mensuel": 8000,
        "preferences": ["lentilles", "courgettes", "yaourt"],
        "aliments_refuses": ["thon"],
        "repas_par_jour": 4,
        "temps_cuisine_minutes": 20,
    }
    analyse = analyser_profil(profil_demo)
    resultat = optimiser_semaine(analyse)
    print(resultat["resume"])
    print(resultat["liste_courses_texte"])
