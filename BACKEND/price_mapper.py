"""
price_mapper.py
---------------
Mapping robuste entre aliments de base et produits commerciaux.
Objectifs:
- éviter les faux matchs (tomate fraîche -> concentré, lait -> biscotte, yaourt -> parfumé)
- privilégier le marché local pour les produits frais
- conserver un fallback contrôlé quand products.json n'a pas de bon équivalent
- appliquer un coefficient régional simple par ville
"""

import json
import math
import os
import re
import unicodedata
from collections import defaultdict
from typing import Any

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(BASE_DIR, "data", "products.json"), encoding="utf-8") as f:
    PRODUITS = json.load(f)

with open(os.path.join(BASE_DIR, "data", "foods.json"), encoding="utf-8") as f:
    FOODS = json.load(f)


CITY_PRICE_MULTIPLIERS = {
    "alger": 1.00,
    "oran": 1.04,
    "constantine": 1.03,
    "annaba": 1.05,
    "blida": 0.98,
    "setif": 1.02,
    "sétif": 1.02,
    "bejaia": 1.04,
    "béjaïa": 1.04,
    "tizi_ouzou": 1.03,
    "tlemcen": 1.01,
    "mostaganem": 1.02,
    "ouargla": 1.08,
    "adrar": 1.12,
    "batna": 1.01,
}


def _strip_accents(text: str) -> str:
    return unicodedata.normalize("NFKD", str(text or "")).encode("ascii", "ignore").decode("ascii")


def _slugify(text: str) -> str:
    text = _strip_accents(text).lower()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    text = re.sub(r"_+", "_", text).strip("_")
    return text or "aliment"


def _normalize_text(text: Any) -> str:
    return _strip_accents(str(text or "")).lower().strip()


def _normalize_food_id(value: Any) -> str:
    if value is None:
        return "aliment"
    if isinstance(value, str):
        return _slugify(value)
    return str(value)


def get_city_price_multiplier(city: str | None) -> float:
    normalized = _slugify(city or "alger")
    return float(CITY_PRICE_MULTIPLIERS.get(normalized, 1.00))


def _apply_city_multiplier(price: float, city: str | None) -> float:
    return round(float(price) * get_city_price_multiplier(city), 2)


FOOD_NAME_BY_ID: dict[str, str] = {}
FOOD_CATEGORY_BY_ID: dict[str, str] = {}
FOOD_ID_BY_NUMERIC_ID: dict[int, str] = {}
for food in FOODS:
    food_id = _normalize_food_id(food.get("food_id") or food.get("id") or food.get("nom"))
    if food_id == "ufs":
        food_id = "oeufs"
    FOOD_NAME_BY_ID[food_id] = food.get("nom", food_id.replace("_", " ").title())
    FOOD_CATEGORY_BY_ID[food_id] = _normalize_text(food.get("categorie", ""))
    if isinstance(food.get("id"), int):
        FOOD_ID_BY_NUMERIC_ID[food["id"]] = food_id


ALIASES: dict[str, list[str]] = {
    "semoule_fine": ["semoule_fine", "semoule"],
    "couscous_cuit": ["couscous_cuit", "semoule"],
    "berkoukes": ["berkoukes", "semoule"],
    "huile": ["huile", "huile_olive"],
    "huile_olive": ["huile_olive", "huile"],
    "yaourt_grec": ["yaourt_grec", "yaourt"],
    "jben": ["jben"],
    "poulet_blanc": ["poulet_blanc", "poulet_cuisse"],
    "poulet_cuisse": ["poulet_cuisse", "poulet_blanc"],
    "filet_boeuf": ["filet_boeuf", "boeuf"],
    "oeufs": ["oeufs"],
}


MARKET_ONLY = {
    "tomates", "carottes", "oignons", "ail", "courgettes", "epinards", "pommes_de_terre",
    "concombre", "aubergines", "poivrons_rouges", "poivrons_verts", "laitue", "navet",
    "celeri", "potiron", "pommes", "bananes", "oranges", "grenade", "pasteque",
    "merlan", "sardines", "anchois", "oeufs", "poulet_blanc", "poulet_cuisse", "boeuf",
    "filet_boeuf", "agneau_hache", "frik"
}


EXPECTED_KEYWORDS = {
    "semoule": ["couscous", "semoule"],
    "semoule_fine": ["couscous", "semoule", "fin"],
    "lentilles": ["lentille"],
    "pois_chiches": ["pois chiche", "poischiche", "chiche"],
    "riz": ["riz"],
    "yaourt": ["yaourt", "nature", "ferme"],
    "yaourt_grec": ["yaourt", "grec"],
    "lait": ["lait"],
    "lben": ["lben", "lait fermente"],
    "jben": ["jben", "fromage blanc"],
    "flocons_avoine": ["avoine"],
    "thon": ["thon"],
    "dattes": ["datte"],
}


BANNED_KEYWORDS = {
    "tomates": ["concentre", "concentr", "double", "sauce", "pizza", "coulis", "jus", "ketchup"],
    "yaourt": ["fraise", "peche", "pêche", "vanille", "fruits", "boire", "a boir", "aromat"],
    "yaourt_grec": ["fraise", "peche", "pêche", "vanille", "fruits", "boire", "a boir", "aromat"],
    "lait": ["biscotte", "muesli", "cereale", "céréale", "poudre", "brioch", "choco", "boisson", "fraise", "banane", "fruit", "fruits", "fruitee", "fruitée", "milkshake", "amande", "vegetal", "végétal", "vegecao", "twist", "peche", "pêche", "mangue", "orange", "grenade", "fraisee", "aromat"],
    "semoule": ["capsule", "cafe", "café"],
}


HEALTHY_FALLBACK_PRICES = {
    "tomates": 160,
    "carottes": 120,
    "oignons": 100,
    "courgettes": 90,
    "epinards": 120,
    "merlan": 600,
    "oeufs": 400,
    "poulet_blanc": 1000,
    "poulet_cuisse": 850,
    "boeuf": 1800,
    "filet_boeuf": 2200,
    "agneau_hache": 2000,
    "lait": 180,
    "yaourt": 360,
    "lben": 120,
    "jben": 800,
    "amandes": 2500,
    "cacahuetes": 600,
    "frik": 180,
    "pain_kesra": 180,
    "pain_baguette": 120,
}


_INDEX: dict[str, list[dict]] = defaultdict(list)
for produit in PRODUITS:
    _INDEX[_normalize_food_id(produit.get("food_id"))].append(produit)


def _candidate_food_ids(food_id: Any) -> list[str]:
    normalized = _normalize_food_id(food_id)
    if normalized == "ufs":
        normalized = "oeufs"
    if isinstance(food_id, int) and food_id in FOOD_ID_BY_NUMERIC_ID:
        normalized = FOOD_ID_BY_NUMERIC_ID[food_id]
    return ALIASES.get(normalized, [normalized])


def _unit_price(produit: dict) -> float:
    quantite = float(produit.get("quantite") or 0)
    if quantite <= 0:
        return float("inf")
    return float(produit.get("prix_DA") or 0) / quantite


def _default_price_by_food_category(food_category: str) -> float:
    category = _strip_accents(str(food_category or "")).lower()
    defaults = {
        "legume": 120,
        "fruit": 180,
        "legumineuse": 260,
        "cereale": 190,
        "viande": 1300,
        "poisson": 900,
        "produit_laitier": 350,
        "produits_laitiers": 350,
        "epice": 450,
    }
    return defaults.get(category, 300)


def _semantic_score(food_id: str, produit: dict) -> float:
    text = _normalize_text(" ".join([
        produit.get("food_id", ""),
        produit.get("marque", ""),
        produit.get("nom_produit", ""),
        produit.get("categorie", ""),
    ]))

    if any(token in text for token in BANNED_KEYWORDS.get(food_id, [])):
        return -1000.0

    score = 0.0
    expected = EXPECTED_KEYWORDS.get(food_id, [])
    for token in expected:
        if token in text:
            score += 3.0

    if food_id in {"yaourt", "yaourt_grec"} and "nature" in text:
        score += 4.0
    if food_id == "lait" and any(token in text for token in ["uht", "entier", "demi", "ecreme", "écrémé", "pasteurise", "pasteurisé"]):
        score += 3.0
    if food_id == "lait" and any(token in text for token in ["nature", "lait entier", "lait demi", "sterilise", "stérilisé"]):
        score += 2.0
    if food_id == "semoule" and any(token in text for token in ["1kg", "500g", "couscous"]):
        score += 1.0
    if produit.get("categorie") == "epicerie":
        score += 0.5
    return score


def _find_products_for_food(food_id: Any) -> list[dict]:
    candidats: list[dict] = []
    seen = set()
    for candidate in _candidate_food_ids(food_id):
        for produit in _INDEX.get(candidate, []):
            key = produit.get("id")
            if key not in seen:
                seen.add(key)
                candidats.append(produit)
    return candidats


def _choose_best_product(food_id: str, produits: list[dict]) -> dict | None:
    scored = []
    for produit in produits:
        semantic = _semantic_score(food_id, produit)
        if semantic < 0:
            continue
        scored.append((produit, semantic, _unit_price(produit)))

    if not scored:
        return None

    scored.sort(key=lambda item: (-item[1], item[2]))
    return scored[0][0]


def get_reference_price_per_unit(food_id: Any, food_category: str | None = None, fallback: float | None = None, city: str | None = None) -> float:
    normalized = _candidate_food_ids(food_id)[0]
    if normalized in HEALTHY_FALLBACK_PRICES:
        baseline = HEALTHY_FALLBACK_PRICES[normalized]
    elif fallback is not None:
        baseline = fallback
    else:
        baseline = _default_price_by_food_category(food_category or FOOD_CATEGORY_BY_ID.get(normalized, ""))

    if normalized in MARKET_ONLY:
        return _apply_city_multiplier(float(baseline), city)

    produits = _find_products_for_food(normalized)
    meilleur = _choose_best_product(normalized, produits)
    if meilleur:
        return _apply_city_multiplier(round(_unit_price(meilleur), 2), city)
    return _apply_city_multiplier(float(baseline), city)


def _guess_store_category(food_id: str, food_category: str | None = None) -> str:
    if food_id in MARKET_ONLY:
        return "marche"
    if food_id in {"lait", "yaourt", "lben", "beurre", "fromage_fondu", "jben", "yaourt_grec"}:
        return "produits_laitiers"

    category = _strip_accents(str(food_category or FOOD_CATEGORY_BY_ID.get(food_id, ""))).lower()
    if category in {"legume", "fruit", "viande", "poisson"}:
        return "marche"
    if category in {"produit_laitier", "produits_laitiers"}:
        return "produits_laitiers"
    if food_id in {"lentilles", "pois_chiches", "pois_casses", "feves", "riz", "semoule", "semoule_fine", "farine_orge", "farine_ble", "flocons_avoine", "huile", "huile_olive", "sucre", "miel", "amandes", "cacahuetes", "thon", "dattes", "pain_kesra", "pain_baguette"}:
        return "epicerie"
    return "autres"


def _calculer_nb_unites(produit: dict, quantite_necessaire: float) -> int:
    quantite_produit = float(produit.get("quantite") or 0)
    if quantite_produit <= 0:
        return 1
    return max(1, math.ceil(float(quantite_necessaire) / quantite_produit))


def _estimation_fallback(food_id: Any, quantite_kg: float, display_name: str | None = None, food_category: str | None = None, city: str | None = None) -> dict:
    normalized_food_id = _candidate_food_ids(food_id)[0]
    prix_unitaire = get_reference_price_per_unit(normalized_food_id, food_category=food_category, city=city)
    prix_total = round(prix_unitaire * float(quantite_kg))
    nom = display_name or FOOD_NAME_BY_ID.get(normalized_food_id, normalized_food_id.replace("_", " ").title())

    return {
        "food_id": normalized_food_id,
        "marque": "—",
        "nom_produit": nom,
        "format_achat": f"{round(float(quantite_kg), 3)} kg",
        "nb_unites": 1,
        "prix_total_DA": prix_total,
        "supermarche": "Marché local",
        "date_maj": "—",
        "prix_estime": True,
        "categorie": _guess_store_category(normalized_food_id, food_category),
        "ville": city or "Alger",
        "coefficient_ville": get_city_price_multiplier(city),
    }


def mapper_produit(food_id: Any, quantite_kg: float, display_name: str | None = None, food_category: str | None = None, city: str | None = None) -> dict:
    normalized_food_id = _candidate_food_ids(food_id)[0]
    produits_disponibles = _find_products_for_food(normalized_food_id)

    if normalized_food_id in MARKET_ONLY:
        return _estimation_fallback(normalized_food_id, quantite_kg, display_name=display_name, food_category=food_category, city=city)

    meilleur = _choose_best_product(normalized_food_id, produits_disponibles)
    if not meilleur:
        return _estimation_fallback(normalized_food_id, quantite_kg, display_name=display_name, food_category=food_category, city=city)

    nb_unites = _calculer_nb_unites(meilleur, quantite_kg)
    prix_total = round(nb_unites * _apply_city_multiplier(float(meilleur.get("prix_DA") or 0), city))

    return {
        "food_id": normalized_food_id,
        "marque": meilleur.get("marque", "—"),
        "nom_produit": meilleur.get("nom_produit", display_name or normalized_food_id.replace("_", " ").title()),
        "format_achat": meilleur.get("format", "1 unité"),
        "nb_unites": nb_unites,
        "prix_total_DA": prix_total,
        "supermarche": meilleur.get("supermarche", "Dataprix DZ"),
        "date_maj": meilleur.get("date_maj", "—"),
        "prix_estime": False,
        "categorie": meilleur.get("categorie", _guess_store_category(normalized_food_id, food_category)),
        "ville": city or "Alger",
        "coefficient_ville": get_city_price_multiplier(city),
    }


def generer_liste_courses(plan_repas: list[dict], city: str | None = None) -> dict:
    agregat: dict[str, float] = defaultdict(float)
    noms_affichage: dict[str, str] = {}
    categories_food: dict[str, str] = {}

    for item in plan_repas:
        requested_food_id = item.get("food_id") or item.get("id") or item.get("nom")
        normalized_food_id = _candidate_food_ids(requested_food_id)[0]
        quantite = float(item.get("quantite_kg", 0.1))
        agregat[normalized_food_id] += quantite
        if item.get("nom"):
            noms_affichage[normalized_food_id] = item["nom"]
        if item.get("categorie"):
            categories_food[normalized_food_id] = str(item["categorie"]).lower()
        elif normalized_food_id in FOOD_CATEGORY_BY_ID:
            categories_food[normalized_food_id] = FOOD_CATEGORY_BY_ID[normalized_food_id]

    produits_mappes = []
    for food_id, quantite in agregat.items():
        produits_mappes.append(
            mapper_produit(
                food_id,
                quantite,
                display_name=noms_affichage.get(food_id),
                food_category=categories_food.get(food_id),
                city=city,
            )
        )

    sections = {
        "marche": "MARCHÉ (fruits, légumes, frais)",
        "epicerie": "ÉPICERIE (vrac & sec)",
        "produits_laitiers": "PRODUITS LAITIERS",
        "boissons": "BOISSONS",
        "autres": "AUTRES",
    }
    groupes: dict[str, list] = {label: [] for label in sections.values()}

    for produit in produits_mappes:
        categorie = produit.get("categorie") or _guess_store_category(produit["food_id"], categories_food.get(produit["food_id"]))
        label = sections.get(categorie, "AUTRES")
        groupes[label].append(produit)

    groupes = {k: sorted(v, key=lambda x: x["nom_produit"]) for k, v in groupes.items() if v}
    total = sum(int(p.get("prix_total_DA", 0)) for p in produits_mappes)

    return {
        "courses": groupes,
        "items": produits_mappes,
        "total_DA": total,
        "budget_semaine": total,
        "budget_mois": total * 4,
        "ville": city or "Alger",
        "coefficient_ville": get_city_price_multiplier(city),
    }


def formater_liste_affichage(liste_courses: dict) -> str:
    ville = liste_courses.get("ville", "Alger")
    coefficient = liste_courses.get("coefficient_ville", 1.0)
    lignes = [f"🛒 Liste de courses — Semaine 1 ({ville})", "À acheter au marché de quartier + supermarché", ""]

    for section, items in liste_courses.get("courses", {}).items():
        lignes.append(section)
        lignes.append("─" * 45)
        for item in items:
            nom = item["nom_produit"] if item.get("marque") in {None, "", "—"} else f"{item['marque']} {item['nom_produit']}"
            estime = " (estimé)" if item.get("prix_estime") else ""
            lignes.append(f"  {nom} · {item.get('format_achat', '1 unité'):<15} {item.get('prix_total_DA', 0)} DA{estime}")
        lignes.append("")

    total = liste_courses.get("total_DA", 0)
    mois = liste_courses.get("budget_mois", 0)
    lignes.append(f"Coefficient ville appliqué : × {coefficient}")
    lignes.append(f"Total semaine estimé : {total} DA")
    lignes.append(f"Budget mensuel       : {total} × 4 = {mois} DA")
    return "\n".join(lignes)


if __name__ == "__main__":
    plan_test = [
        {"food_id": "lentilles", "quantite_kg": 0.8, "nom": "Lentilles"},
        {"food_id": "tomates", "quantite_kg": 1.5, "nom": "Tomates"},
        {"food_id": "oeufs", "quantite_kg": 0.42, "nom": "Œufs"},
        {"food_id": "yaourt", "quantite_kg": 0.84, "nom": "Yaourt nature"},
    ]
    liste = generer_liste_courses(plan_test, city="Oran")
    print(formater_liste_affichage(liste))
