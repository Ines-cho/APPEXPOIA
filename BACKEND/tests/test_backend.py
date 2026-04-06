import os
import tempfile
import unittest


class BackendTestCase(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        os.environ["NUTRIALGERIE_DB_PATH"] = os.path.join(self.tmpdir.name, "test.sqlite3")

        import importlib
        import storage
        import main
        import price_mapper

        importlib.reload(storage)
        importlib.reload(price_mapper)
        importlib.reload(main)

        self.storage = storage
        self.main = main
        self.price_mapper = price_mapper
        self.storage.init_db()

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_weekly_plan_is_persisted_with_mobile_payload(self):
        profile = {
            "nom": "Karim",
            "ville": "Alger",
            "age": 42,
            "poids": 72,
            "taille": 162,
            "sexe": "homme",
            "activite": "leger",
            "travail": "bureau",
            "maladies": ["pré-diabète", "hypertension"],
            "budget_mensuel": 8000,
            "preferences": ["lentilles", "courgettes", "merlan"],
            "aliments_refuses": ["thon"],
            "repas_par_jour": 4,
            "temps_cuisine_minutes": 20,
            "antecedents": ["cardiovasculaire"],
        }
        result = self.main.build_weekly_plan(profile, persist=True)
        self.assertIn("mobile", result)
        self.assertEqual(result["mobile"]["mobile_contract_version"], "2026-03-v2")
        latest_plan = self.storage.get_latest_plan(result["user_id"])
        self.assertIsNotNone(latest_plan)
        self.assertIn("programme", latest_plan)
        self.assertIn("mobile", latest_plan)
        self.assertEqual(result["programme"]["repas_par_jour"], 4)

    def test_budget_engine_stays_close_for_low_budget_profile(self):
        profile = {
            "nom": "Budget Test",
            "ville": "Alger",
            "age": 38,
            "poids": 70,
            "taille": 170,
            "sexe": "homme",
            "activite": "sedentaire",
            "travail": "bureau",
            "maladies": ["pré-diabète"],
            "budget_mensuel": 8000,
        }
        result = self.main.build_weekly_plan(profile, persist=False)
        budget = result["programme"]["budget"]
        self.assertLessEqual(budget["weekly_estimated_DA"], round(budget["weekly_target_DA"] * 1.08))

    def test_progress_summary_is_available(self):
        self.storage.save_progress({
            "user_id": "user-1",
            "weight_kg": 80,
            "glycemia_mg_dl": 120,
            "adherence_score": 85,
            "spent_da": 250,
        })
        self.storage.save_progress({
            "user_id": "user-1",
            "weight_kg": 78.5,
            "glycemia_mg_dl": 108,
            "adherence_score": 88,
            "spent_da": 230,
        })
        summary = self.storage.get_progress_summary("user-1")
        self.assertEqual(summary["summary"]["weight_change_kg"], -1.5)
        self.assertEqual(summary["summary"]["glycemia_change_mg_dl"], -12)

    def test_dynamic_meal_distribution_is_applied(self):
        profile = {
            "nom": "Meal Test",
            "ville": "Alger",
            "age": 31,
            "poids": 61,
            "taille": 167,
            "sexe": "femme",
            "activite": "modere",
            "travail": "bureau",
            "maladies": [],
            "budget_mensuel": 12000,
            "repas_par_jour": 5,
            "temps_cuisine_minutes": 15,
        }
        result = self.main.build_weekly_plan(profile, persist=False)
        first_day = result["programme"]["plan_semaine"][0]
        self.assertEqual(len(first_day["repas"]), 5)
        self.assertIn("collation_matin", first_day["repas"])
        self.assertIn("collation_apres_midi", first_day["repas"])

    def test_city_price_multiplier_changes_shopping_projection(self):
        sample_plan = [
            {"food_id": "lentilles", "quantite_kg": 1.0, "nom": "Lentilles", "categorie": "legumineuse"},
            {"food_id": "yaourt", "quantite_kg": 0.6, "nom": "Yaourt nature", "categorie": "produit_laitier"},
        ]
        alger = self.price_mapper.generer_liste_courses(sample_plan, city="Alger")
        adrar = self.price_mapper.generer_liste_courses(sample_plan, city="Adrar")
        self.assertGreaterEqual(adrar["total_DA"], alger["total_DA"])
        self.assertGreater(adrar["coefficient_ville"], alger["coefficient_ville"])


if __name__ == "__main__":
    unittest.main()
