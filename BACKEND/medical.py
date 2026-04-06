import json
import os
import unicodedata
from typing import Any

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(BASE_DIR, "data", "foods.json"), encoding="utf-8") as f:
    RAW_ALIMENTS = json.load(f)


def _strip_accents(value: str) -> str:
    return unicodedata.normalize("NFKD", str(value or "")).encode("ascii", "ignore").decode("ascii")


def _normalize_text(value: Any) -> str:
    return _strip_accents(str(value or "")).lower().strip()


def _normalize_category(value: str) -> str:
    return _normalize_text(value).replace(" ", "_")


def _normalize_list(values: Any) -> list[str]:
    if values is None:
        return []
    if isinstance(values, str):
        values = [values]
    return [str(v).strip() for v in values if str(v).strip()]


def _activity_factor(activite: str, type_travail: str) -> float:
    activity = _normalize_text(activite)
    work = _normalize_text(type_travail)
    factors = {
        "sedentaire": 1.2,
        "leger": 1.35,
        "modere": 1.5,
        "actif": 1.7,
        "tres_actif": 1.9,
    }
    factor = factors.get(activity, 1.2)
    if work in {"physique", "manuel", "terrain"}:
        factor += 0.1
    return min(max(factor, 1.2), 2.0)


def _normalize_food(food: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(food)
    normalized["food_id"] = normalized.get("food_id") or _normalize_text(normalized.get("nom"))
    normalized["food_id"] = normalized["food_id"].replace(" ", "_")
    normalized["categorie_normalisee"] = _normalize_category(normalized.get("categorie", ""))
    normalized["repas"] = [_normalize_text(r) for r in normalized.get("repas", [])]

    corrections = {
        "lentilles": {"fibres_100g": 10.7},
        "pois_chiches": {"fibres_100g": 17.4},
        "pasteque": {"glucides_100g": 7.6, "fibres_100g": 0.4},
        "haricots_rouges": {"fibres_100g": 6.4},
        "farine_ble": {"fibres_100g": 2.7},
        "oeufs": {"food_id": "oeufs"},
    }
    if normalized["food_id"] in corrections:
        normalized.update(corrections[normalized["food_id"]])
    if normalized["food_id"] == "ufs":
        normalized["food_id"] = "oeufs"
    return normalized


ALIMENTS = [_normalize_food(food) for food in RAW_ALIMENTS]


ALIASES_MALADIES = {
    "diabete": {"diabete", "diabète", "prediabete", "pré-diabète", "pre-diabete", "insulinoresistance"},
    "hypertension": {"hypertension", "tension", "tension_arterielle"},
    "cholesterol": {"cholesterol", "cholestérol"},
    "obesite": {"obesite", "obésité", "surpoids"},
    "insuffisance_renale": {"insuffisance_renale", "renale", "rénale"},
    "anemie": {"anemie", "anémie"},
}

ALIASES_ANTECEDENTS = {
    "cardiovasculaire": {
        "cardio",
        "cardiovasculaire",
        "infarctus",
        "avc",
        "accident_vasculaire",
        "coronarien",
        "coeur",
        "cœur",
        "hypertension_familiale",
    },
    "diabete_familial": {"diabete_familial", "diabète_familial", "diabete_dans_la_famille"},
    "renal": {"renal", "rénal", "insuffisance_renale_familiale"},
    "obesite_familiale": {"obesite_familiale", "obésité_familiale", "surpoids_familial"},
}

ROLE_OVERRIDES = {
    "oeufs": "proteine",
    "lait": "laitier",
    "yaourt": "laitier",
    "yaourt_grec": "laitier",
    "lben": "laitier",
    "jben": "laitier",
    "semoule": "feculent",
    "semoule_fine": "feculent",
    "farine_orge": "feculent",
    "farine_ble": "feculent",
    "riz": "feculent",
    "lentilles": "legumineuse",
    "pois_chiches": "legumineuse",
    "haricots_rouges": "legumineuse",
    "pois_casses": "legumineuse",
    "feves": "legumineuse",
}

HEALTH_FLAG_LABELS = {
    "diabete": "Pré-diabétique / diabète",
    "hypertension": "Tension limite / hypertension",
    "cholesterol": "Cholestérol élevé",
    "obesite": "Surpoids / obésité",
    "insuffisance_renale": "Fragilité rénale",
    "anemie": "Risque d'anémie",
    "cardiovasculaire": "Antécédent cardio-vasculaire",
    "diabete_familial": "Antécédent familial de diabète",
    "renal": "Antécédent rénal",
    "obesite_familiale": "Antécédent familial de surpoids",
}


def canonical_maladies(maladies: list[str]) -> list[str]:
    normalized = []
    for maladie in _normalize_list(maladies):
        value = _normalize_text(maladie)
        matched = None
        for canonical, variants in ALIASES_MALADIES.items():
            if value in variants:
                matched = canonical
                break
        normalized.append(matched or value)
    return sorted(set(normalized))


def canonical_antecedents(antecedents: list[str]) -> list[str]:
    normalized = []
    for antecedent in _normalize_list(antecedents):
        value = _normalize_text(antecedent)
        matched = None
        for canonical, variants in ALIASES_ANTECEDENTS.items():
            if value in variants:
                matched = canonical
                break
        normalized.append(matched or value)
    return sorted(set(normalized))


def detecter_role_aliment(aliment: dict[str, Any]) -> str:
    food_id = aliment.get("food_id", "")
    if food_id in ROLE_OVERRIDES:
        return ROLE_OVERRIDES[food_id]

    categorie = aliment.get("categorie_normalisee", "")
    proteines = float(aliment.get("proteines_100g", 0) or 0)
    glucides = float(aliment.get("glucides_100g", 0) or 0)

    if categorie == "legume":
        return "legume"
    if categorie == "fruit":
        return "fruit"
    if categorie in {"viande", "poisson"}:
        return "proteine"
    if categorie in {"legumineuse"}:
        return "legumineuse"
    if categorie in {"cereale"}:
        return "feculent"
    if categorie in {"produit_laitier", "produits_laitiers"}:
        return "laitier"
    if proteines >= 12:
        return "proteine"
    if glucides >= 20:
        return "feculent"
    return "autre"


def calcul_calories(age: int, poids: float, taille: float, sexe: str, activite: str, type_travail: str = "bureau", objectif: str = "maintien") -> float:
    sexe_normalise = _normalize_text(sexe)
    if sexe_normalise == "homme":
        mb = 10 * poids + 6.25 * taille - 5 * age + 5
    else:
        mb = 10 * poids + 6.25 * taille - 5 * age - 161

    facteur = _activity_factor(activite, type_travail)
    total = mb * facteur

    objectif_normalise = _normalize_text(objectif)
    if objectif_normalise in {"perte_de_poids", "perte de poids", "maigrir"}:
        total -= 350
    elif objectif_normalise in {"prise_de_masse", "prise de masse"}:
        total += 250

    return round(max(total, 1200), 1)


def calcul_macros(calories: float, maladies: list[str], antecedents: list[str] | None = None, objectif: str = "maintien") -> dict[str, Any]:
    maladies_norm = canonical_maladies(maladies)
    antecedents_norm = canonical_antecedents(antecedents or [])
    objectif_norm = _normalize_text(objectif)

    ratio_prot = 0.22
    ratio_gluc = 0.45
    ratio_lip = 0.33
    fibres = 28.0
    sodium_max = 2300.0
    sucre_ajoute_max = 25.0
    restrictions = []

    if objectif_norm in {"perte_de_poids", "perte de poids", "maigrir"}:
        ratio_prot, ratio_gluc, ratio_lip = 0.28, 0.37, 0.35
        restrictions.append("Objectif perte de poids : densité calorique modérée et protéines renforcées")

    if "diabete" in maladies_norm:
        ratio_gluc = min(ratio_gluc, 0.40)
        ratio_prot = max(ratio_prot, 0.25)
        fibres = max(fibres, 30.0)
        sucre_ajoute_max = 15.0
        restrictions.append("Diabète/pré-diabète : glucides modérés, fibres élevées, sucres ajoutés limités")

    if "hypertension" in maladies_norm:
        sodium_max = 1500.0
        restrictions.append("Hypertension : sodium limité à 1500 mg/jour")

    if "cholesterol" in maladies_norm:
        ratio_lip = min(ratio_lip, 0.30)
        restrictions.append("Cholestérol : graisses saturées à limiter, priorité au poisson et aux légumineuses")

    if "insuffisance_renale" in maladies_norm:
        ratio_prot = min(ratio_prot, 0.15)
        sodium_max = min(sodium_max, 1500.0)
        restrictions.append("Insuffisance rénale : protéines et sodium strictement encadrés")

    if "anemie" in maladies_norm:
        restrictions.append("Anémie : privilégier protéines riches en fer et légumes verts")

    if "cardiovasculaire" in antecedents_norm:
        ratio_lip = min(ratio_lip, 0.28)
        sodium_max = min(sodium_max, 1700.0)
        restrictions.append("Antécédent cardiovasculaire : vigilance renforcée sur sodium, fritures et graisses saturées")

    if "diabete_familial" in antecedents_norm and "diabete" not in maladies_norm:
        ratio_gluc = min(ratio_gluc, 0.42)
        fibres = max(fibres, 29.0)
        restrictions.append("Antécédent familial diabète : priorité à des glucides plus lents et plus de fibres")

    if "renal" in antecedents_norm and "insuffisance_renale" not in maladies_norm:
        sodium_max = min(sodium_max, 1800.0)
        restrictions.append("Antécédent rénal : sodium surveillé à titre préventif")

    return {
        "calories_jour": round(calories, 1),
        "proteines_g": round((calories * ratio_prot) / 4, 1),
        "glucides_g": round((calories * ratio_gluc) / 4, 1),
        "lipides_g": round((calories * ratio_lip) / 9, 1),
        "fibres_g": fibres,
        "sodium_max_mg": sodium_max,
        "sucre_ajoute_max_g": sucre_ajoute_max,
        "restrictions": restrictions,
    }


def _exclude_for_medical_reason(aliment: dict[str, Any], maladies: list[str], antecedents: list[str] | None = None) -> tuple[bool, list[str]]:
    raisons = []
    antecedents = antecedents or []
    index_glycemique = float(aliment.get("index_glycemique", 0) or 0)
    glucides = float(aliment.get("glucides_100g", 0) or 0)
    fibres = float(aliment.get("fibres_100g", 0) or 0)
    sodium = float(aliment.get("sodium_100g", 0) or 0)
    lipides = float(aliment.get("lipides_100g", 0) or 0)
    calories = float(aliment.get("calories_100g", 0) or 0)
    categorie = aliment.get("categorie_normalisee", "")

    if "diabete" in maladies:
        if index_glycemique > 70:
            raisons.append("IG trop élevé")
        if glucides > 60 and fibres < 3:
            raisons.append("trop riche en glucides rapides")

    if "hypertension" in maladies and sodium > 400:
        raisons.append("sodium trop élevé")

    if "cholesterol" in maladies and lipides > 20 and categorie in {"viande", "produit_laitier"}:
        raisons.append("trop gras pour un profil cholestérol")

    if "insuffisance_renale" in maladies:
        if float(aliment.get("proteines_100g", 0) or 0) > 20:
            raisons.append("protéines trop élevées")
        if sodium > 200:
            raisons.append("sodium trop élevé")

    if "obesite" in maladies and calories > 450 and fibres < 2:
        raisons.append("densité calorique trop forte")

    if "cardiovasculaire" in antecedents and sodium > 320:
        raisons.append("trop salé pour un antécédent cardiovasculaire")
    if "cardiovasculaire" in antecedents and lipides > 25 and categorie in {"viande", "produit_laitier"}:
        raisons.append("trop gras pour un antécédent cardiovasculaire")
    if "diabete_familial" in antecedents and index_glycemique > 78:
        raisons.append("charge glycémique préventivement défavorable")

    return (len(raisons) > 0, raisons)


def filtrer_aliments(aliments: list[dict[str, Any]], profil: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    maladies = canonical_maladies(profil.get("maladies", []))
    antecedents = canonical_antecedents(profil.get("antecedents", []))
    allergies = {_normalize_text(v) for v in _normalize_list(profil.get("allergies", []))}
    refuses = {_normalize_text(v) for v in _normalize_list(profil.get("aliments_refuses", []))}

    autorises: list[dict[str, Any]] = []
    exclus: list[dict[str, Any]] = []

    for aliment in aliments:
        nom = _normalize_text(aliment.get("nom"))
        food_id = _normalize_text(aliment.get("food_id"))
        raisons = []

        if any(token in nom or token in food_id for token in allergies if token):
            raisons.append("allergie utilisateur")
        if any(token in nom or token in food_id for token in refuses if token):
            raisons.append("aliment refusé")

        excluded, medical_reasons = _exclude_for_medical_reason(aliment, maladies, antecedents=antecedents)
        if excluded:
            raisons.extend(medical_reasons)

        if raisons:
            exclus.append({"food_id": aliment.get("food_id"), "nom": aliment.get("nom"), "raisons": raisons})
        else:
            autorises.append(aliment)

    return autorises, exclus


def _extraire_budget(profil: dict[str, Any]) -> tuple[float, float, float]:
    foyer = int(profil.get("foyer_personnes") or 1)
    budget_mensuel = profil.get("budget_mensuel") or profil.get("budget_mensuel_DA") or profil.get("budget") or 0
    try:
        budget_mensuel = float(budget_mensuel)
    except Exception:
        budget_mensuel = 0.0

    if budget_mensuel <= 0:
        budget_mensuel = 12000.0

    budget_hebdo = round(budget_mensuel / 4.0, 2)
    budget_journalier = round(budget_mensuel / 30.0, 2)
    return round(budget_journalier / max(foyer, 1), 2), round(budget_hebdo / max(foyer, 1), 2), round(budget_mensuel / max(foyer, 1), 2)


def normaliser_profil(profil: dict[str, Any]) -> dict[str, Any]:
    repas_par_jour = max(2, min(int(profil.get("repas_par_jour") or 3), 6))
    temps_cuisine = max(5, min(int(profil.get("temps_cuisine_minutes") or 30), 180))
    return {
        "nom": str(profil.get("nom") or "Utilisateur").strip(),
        "ville": str(profil.get("ville") or "Alger").strip(),
        "age": int(profil["age"]),
        "poids": float(profil["poids"]),
        "taille": float(profil["taille"]),
        "sexe": str(profil["sexe"]),
        "activite": str(profil.get("activite", "sedentaire")),
        "type_travail": str(profil.get("type_travail") or profil.get("travail") or "bureau"),
        "maladies": canonical_maladies(profil.get("maladies", [])),
        "antecedents": canonical_antecedents(profil.get("antecedents", [])),
        "allergies": _normalize_list(profil.get("allergies", [])),
        "preferences": _normalize_list(profil.get("preferences", [])),
        "aliments_refuses": _normalize_list(profil.get("aliments_refuses", [])),
        "objectif": str(profil.get("objectif", "maintien")),
        "temps_cuisine_minutes": temps_cuisine,
        "repas_par_jour": repas_par_jour,
        "foyer_personnes": int(profil.get("foyer_personnes") or 1),
    }


def _budget_tier(budget_journalier: float) -> str:
    if budget_journalier <= 230:
        return "ultra_low"
    if budget_journalier <= 300:
        return "low"
    if budget_journalier <= 450:
        return "medium"
    return "comfortable"


def _meal_distribution(repas_par_jour: int) -> str:
    if repas_par_jour <= 2:
        return "2 repas principaux plus des volumes plus conséquents"
    if repas_par_jour == 3:
        return "3 repas structurés classiques"
    if repas_par_jour == 4:
        return "3 repas + 1 collation"
    if repas_par_jour == 5:
        return "3 repas + 2 collations légères"
    return "6 prises alimentaires fractionnées"


def build_health_insights(profil: dict[str, Any], macros: dict[str, Any], budget_journalier: float, budget_hebdomadaire: float) -> dict[str, Any]:
    maladies = profil.get("maladies", [])
    antecedents = profil.get("antecedents", [])
    flags = []
    avoid: list[str] = []
    favor: list[str] = ["légumes", "légumineuses", "eau"]
    messages: list[dict[str, str]] = []

    for maladie in maladies:
        flags.append({
            "code": maladie,
            "label": HEALTH_FLAG_LABELS.get(maladie, maladie.replace("_", " ").title()),
            "severity": "warning",
        })

    for antecedent in antecedents:
        flags.append({
            "code": antecedent,
            "label": HEALTH_FLAG_LABELS.get(antecedent, antecedent.replace("_", " ").title()),
            "severity": "info",
        })

    if "diabete" in maladies:
        avoid.extend(["sodas", "jus sucrés", "gâteaux", "confiture"])
        favor.extend(["yaourt nature", "pois chiches", "lentilles", "poisson"])
        messages.append({
            "type": "sugar_excess",
            "title": "Sucre en excès",
            "message": "Réduire sodas, jus sucrés et desserts sucrés pour stabiliser la glycémie.",
        })

    if "hypertension" in maladies:
        avoid.extend(["charcuterie", "chips", "bouillons cubes", "excès de sel"])
        favor.extend(["lben nature", "légumes verts", "poisson grillé"])
        messages.append({
            "type": "salt_excess",
            "title": "Trop de sel",
            "message": "Limiter le sel, les produits industriels très salés et viser un assaisonnement simple.",
        })

    if "cholesterol" in maladies:
        avoid.extend(["friture", "viandes grasses", "viennoiseries"])
        favor.extend(["sardines", "merlan", "avoine"])
        messages.append({
            "type": "fat_quality",
            "title": "Graisses à surveiller",
            "message": "Privilégier le poisson, les légumineuses et les produits peu transformés.",
        })

    if "anemie" in maladies:
        favor.extend(["épinards", "lentilles", "œufs"])
        messages.append({
            "type": "iron_support",
            "title": "Apport en fer",
            "message": "Renforcer les aliments riches en fer et les associer à des légumes riches en vitamine C.",
        })

    if "cardiovasculaire" in antecedents:
        avoid.extend(["fritures fréquentes", "excès de sel", "produits ultra-transformés"])
        favor.extend(["sardines", "avoine", "huile d'olive en petite quantité", "légumineuses"])
        messages.append({
            "type": "cardio_prevention",
            "title": "Prévention cardio-vasculaire",
            "message": "Le moteur renforce la prévention : sel réduit, graisses saturées modérées et rotation plus fréquente poisson/légumineuses.",
        })

    if "diabete_familial" in antecedents and "diabete" not in maladies:
        messages.append({
            "type": "glycemic_prevention",
            "title": "Prévention glycémique",
            "message": "Un antécédent familial de diabète a été pris en compte pour favoriser des glucides plus lents.",
        })

    favor = sorted(set(favor))
    avoid = sorted(set(avoid))

    budget_level = _budget_tier(budget_journalier)
    if budget_level in {"ultra_low", "low"}:
        messages.append({
            "type": "budget_pressure",
            "title": "Budget serré",
            "message": "Le moteur favorisera les aliments locaux les plus abordables et acceptera un peu moins de variété pour rester proche du budget.",
        })

    temps_cuisine = int(profil.get("temps_cuisine_minutes") or 30)
    if temps_cuisine <= 20:
        messages.append({
            "type": "quick_prep",
            "title": "Temps cuisine réduit",
            "message": "Les repas simples et rapides sont favorisés : assemblages courts, cuisson limitée et ingrédients polyvalents.",
        })
    elif temps_cuisine >= 60:
        messages.append({
            "type": "extended_prep",
            "title": "Temps cuisine confortable",
            "message": "Le moteur peut intégrer davantage de préparations maison et de repas plus élaborés si le budget le permet.",
        })

    messages.append({
        "type": "meal_distribution",
        "title": "Répartition des repas",
        "message": f"Le plan est structuré selon {_meal_distribution(int(profil.get('repas_par_jour') or 3))}.",
    })

    nom = profil.get("nom") or "Utilisateur"
    resume = (
        f"Plan de base pour {nom} à {profil.get('ville', 'Alger')} : objectif {round(macros['calories_jour'])} kcal/j, "
        f"budget moyen {round(budget_journalier)} DA/j et {round(budget_hebdomadaire)} DA/semaine. "
        f"Répartition prévue : {_meal_distribution(int(profil.get('repas_par_jour') or 3))}. "
        f"Priorité aux aliments locaux, simples et compatibles avec le profil santé."
    )

    return {
        "flags": flags,
        "a_eviter": avoid,
        "a_favoriser": favor,
        "messages": messages,
        "resume": resume,
        "budget_tier": budget_level,
    }


def analyser_profil(profil: dict[str, Any]) -> dict[str, Any]:
    profil_normalise = normaliser_profil(profil)
    budget_journalier, budget_hebdo, budget_mensuel = _extraire_budget(profil)

    calories = calcul_calories(
        age=profil_normalise["age"],
        poids=profil_normalise["poids"],
        taille=profil_normalise["taille"],
        sexe=profil_normalise["sexe"],
        activite=profil_normalise["activite"],
        type_travail=profil_normalise["type_travail"],
        objectif=profil_normalise["objectif"],
    )
    macros = calcul_macros(
        calories,
        profil_normalise["maladies"],
        antecedents=profil_normalise["antecedents"],
        objectif=profil_normalise["objectif"],
    )
    aliments_ok, aliments_exclus = filtrer_aliments(ALIMENTS, profil_normalise)
    insights = build_health_insights(profil_normalise, macros, budget_journalier, budget_hebdo)

    return {
        "profil": profil_normalise,
        "calories_journalieres": calories,
        "macros": macros,
        "budget_journalier": budget_journalier,
        "budget_hebdomadaire": budget_hebdo,
        "budget_mensuel": budget_mensuel,
        "nb_aliments_autorises": len(aliments_ok),
        "nb_aliments_exclus": len(aliments_exclus),
        "aliments_autorises": aliments_ok,
        "aliments_exclus": aliments_exclus,
        "insights": insights,
        "contraintes": {
            "type_travail": profil_normalise["type_travail"],
            "temps_cuisine_minutes": profil_normalise["temps_cuisine_minutes"],
            "repas_par_jour": profil_normalise["repas_par_jour"],
            "budget_strict": True,
            "budget_tier": insights.get("budget_tier"),
            "antecedents_actifs": profil_normalise["antecedents"],
        },
    }


if __name__ == "__main__":
    profil_demo = {
        "nom": "Karim",
        "ville": "Alger",
        "age": 42,
        "poids": 70,
        "taille": 165,
        "sexe": "homme",
        "activite": "leger",
        "travail": "bureau",
        "maladies": ["pré-diabète", "tension"],
        "antecedents": ["cardiovasculaire"],
        "budget_mensuel": 8000,
        "allergies": [],
        "aliments_refuses": ["thon"],
        "objectif": "maintien",
    }
    analyse = analyser_profil(profil_demo)
    print(analyse["calories_journalieres"])
    print(analyse["budget_hebdomadaire"])
    print(analyse["insights"]["resume"])
