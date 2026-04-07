# NutriAlgerie — Assistant nutritionnel intelligent, local et accessible

> Une application mobile pensée pour le contexte algérien, qui génère des plans alimentaires personnalisés selon le **profil de santé**, le **budget**, les **préférences alimentaires** et le **coût réel des produits selon la ville**.

## Vue d’ensemble

**NutriAlgerie** est un prototype full-stack développé pour un contexte hackathon. Le projet combine un **frontend mobile Expo / React Native** et un **backend FastAPI** capable de :

- analyser un profil nutritionnel,
- générer un plan alimentaire hebdomadaire,
- adapter les repas au budget et aux contraintes médicales,
- produire une liste de courses contextualisée,
- suivre la progression de l’utilisateur,
- gérer une authentification simple.

L’objectif du projet est de répondre à un besoin concret : rendre la nutrition personnalisée **plus réaliste, plus locale et plus abordable** pour les utilisateurs algériens.

---

## Le problème adressé

La majorité des applications nutritionnelles :

- ne prennent pas en compte les **prix locaux**,
- sont peu adaptées aux **habitudes alimentaires algériennes**,
- ignorent souvent le **budget familial réel**,
- proposent des recommandations trop génériques,
- offrent peu de cohérence entre **santé**, **courses**, **suivi** et **expérience mobile**.

**NutriAlgerie** propose une réponse plus terrain : une logique nutritionnelle contextualisée, avec une adaptation par **ville**, par **objectif**, par **pathologie** et par **capacité budgétaire**.

---

## Proposition de valeur

### Ce que le projet apporte

- **Personnalisation nutritionnelle** selon âge, poids, taille, sexe, activité, objectif et historique médical.
- **Adaptation budgétaire** avec estimation journalière, hebdomadaire et mensuelle.
- **Prise en compte des maladies et antécédents** comme le pré-diabète ou l’hypertension.
- **Génération automatique d’un plan hebdomadaire** avec répartition dynamique des repas.
- **Liste de courses intelligente** dérivée du plan alimentaire.
- **Suivi de progression** : poids, glycémie, adhérence, dépenses.
- **Approche locale** : aliments, logique de prix et usages orientés Algérie.

---

## Fonctionnalités principales

### Côté utilisateur

- Inscription et connexion
- Onboarding nutritionnel en plusieurs étapes
- Génération d’un plan de repas hebdomadaire personnalisé
- Consultation d’un dashboard santé / budget
- Liste de courses hebdomadaire
- Suivi de progression
- Profil utilisateur

### Côté moteur métier

- Analyse du profil santé
- Calcul calorique et macros
- Gestion des contraintes médicales
- Ajustement du nombre de repas par jour
- Ajustement du temps de cuisine
- Projection budgétaire
- Ajustement des prix selon la ville
- Historisation des profils et des plans

---

## Architecture du projet

```text
APPFINAL/
├── BACKEND/                  # API FastAPI + logique métier + SQLite
│   ├── main.py               # Entrée API
│   ├── medical.py            # Analyse du profil médical/nutritionnel
│   ├── optimizer.py          # Génération et optimisation des repas
│   ├── price_mapper.py       # Projection des prix / liste de courses
│   ├── storage.py            # Persistance SQLite
│   ├── auth.py               # Authentification
│   ├── serializers.py        # Sérialisation mobile/dashboard
│   ├── data/                 # Base SQLite + données alimentaires
│   ├── tests/                # Tests backend
│   └── Dockerfile            # Conteneur backend
│
└── FRONTEND/                 # Application mobile Expo / React Native
    ├── App.tsx
    ├── src/
    │   ├── context/          # Gestion auth/session
    │   ├── navigation/       # Navigation auth + tabs
    │   ├── screens/          # Écrans onboarding, dashboard, repas, etc.
    │   ├── services/         # Appels API
    │   └── theme/            # Thème visuel
    └── package.json
```

---

## Stack technique

### Frontend

- **Expo**
- **React Native**
- **TypeScript**
- **React Navigation**
- **AsyncStorage**
- **NativeWind / Tailwind**

### Backend

- **Python 3**
- **FastAPI**
- **Pydantic**
- **Uvicorn**
- **SQLite**

### Dev / Qualité

- **unittest** pour les tests backend
- **Docker** pour le backend

---

## Exécution du projet

## 1) Prérequis

Assurez-vous d’avoir installé :

- **Python 3.10+**
- **Node.js 18+**
- **npm**
- **Expo Go** sur mobile, ou un émulateur Android/iOS

---

## 2) Lancer le backend

### Windows (PowerShell)

```bash
cd BACKEND
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### macOS / Linux

```bash
cd BACKEND
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Backend disponible sur

- API : `http://localhost:8000`
- Health check : `http://localhost:8000/health`
- Documentation Swagger : `http://localhost:8000/docs`

---

## 3) Lancer le frontend

Dans un second terminal :

```bash
cd FRONTEND
npm install
npx expo start
```

Ensuite :

- appuyez sur **w** pour lancer en web,
- appuyez sur **a** pour Android,
- appuyez sur **i** pour iOS,
- ou scannez le QR code avec **Expo Go**.

---

## 4) Important pour tester sur un vrai téléphone

Le frontend pointe actuellement vers :

```ts
http://localhost:8000
```

Si vous testez sur un **appareil physique**, remplacez cette URL par l’adresse IP locale de votre machine dans :

- `FRONTEND/src/services/api.ts`
- `FRONTEND/src/context/AuthContext.tsx`

Exemple :

```ts
const API_BASE_URL = 'http://192.168.1.15:8000';
```

> Sans ce changement, l’application mobile ne pourra pas joindre le backend depuis le téléphone.

---

## Lancement rapide recommandé pour une démo jury

### Terminal 1 — Backend

```bash
cd BACKEND
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 — Frontend

```bash
cd FRONTEND
npm install
npx expo start
```

### Scénario de démo conseillé

1. Créer un compte
2. Compléter l’onboarding santé / budget
3. Générer un plan alimentaire
4. Montrer le dashboard
5. Montrer la liste de courses
6. Montrer l’écran de progression
7. Expliquer l’adaptation au budget et à la ville

---

## API principale

### Authentification

- `POST /auth/register` — créer un compte
- `POST /auth/login` — se connecter
- `GET /auth/me` — récupérer l’utilisateur courant

### Nutrition & profil

- `POST /analyse-profil` — analyser un profil nutritionnel
- `POST /plan-semaine` — générer un plan hebdomadaire
- `POST /profiles/save` — sauvegarder un profil
- `GET /profiles/{user_id}` — récupérer le dernier profil

### Progression & dashboard

- `POST /progression/entry` — ajouter une entrée de suivi
- `GET /progression/{user_id}` — récupérer la progression
- `GET /plans/{user_id}/latest` — dernier plan généré
- `GET /plans/{user_id}/history` — historique des plans
- `GET /dashboard/{user_id}` — payload dashboard mobile

---

## Exemple de test API

```bash
curl http://localhost:8000/health
```

### Exemple d’inscription

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Demo User",
    "email": "demo@example.com",
    "password": "password123"
  }'
```

### Exemple de génération de plan

```bash
curl -X POST http://localhost:8000/plan-semaine \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Karim",
    "ville": "Alger",
    "age": 42,
    "poids": 72,
    "taille": 162,
    "sexe": "homme",
    "activite": "leger",
    "maladies": ["pré-diabète", "hypertension"],
    "budget_mensuel": 8000,
    "preferences": ["lentilles", "courgettes", "merlan"],
    "repas_par_jour": 4,
    "temps_cuisine_minutes": 25
  }'
```

---

## Exécuter les tests backend

```bash
cd BACKEND
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m unittest tests/test_backend.py
```

### Ce que valident les tests

- persistance du plan hebdomadaire,
- payload mobile généré,
- respect du budget sur un profil contraint,
- suivi de progression,
- distribution dynamique des repas,
- variation du coût selon la ville.

---

## Lancer le backend avec Docker

```bash
cd BACKEND
docker build -t nutrialgerie-backend .
docker run -p 8000:8000 nutrialgerie-backend
```

---

## Points forts pour un jury de hackathon

### 1. Un problème réel
Le projet répond à une problématique concrète : **manger mieux sans sortir de son budget**, dans un contexte local souvent absent des solutions internationales.

### 2. Une vraie logique métier
Le backend ne se limite pas à afficher une interface : il intègre une logique métier autour de la nutrition, des contraintes médicales, du budget et de la projection des coûts.

### 3. Une approche orientée impact
Le prototype vise un usage utile pour :

- les personnes avec contraintes de santé,
- les familles à budget serré,
- les utilisateurs cherchant un accompagnement alimentaire plus réaliste.

### 4. Une vision produit claire
Le projet peut évoluer vers :

- recommandation par IA générative,
- suivi clinique ou nutritionniste,
- intégration e-commerce / drive,
- tableau de bord analytique,
- moteur de recommandations encore plus fin.

---

## État actuel du prototype

Le projet est **fonctionnel en mode prototype / démonstration**, avec une base backend solide et une expérience mobile déjà structurée.

### Validation réalisée

- Les dépendances backend ont été installées avec succès.
- Les **5 tests backend** passent.
- L’endpoint `GET /health` répond correctement.
- Les dépendances frontend s’installent correctement via `npm install`.

### Transparence technique

Certaines vues frontend utilisent actuellement des **données personnalisées locales de démonstration** pour garantir une expérience fluide pendant la présentation, même si l’API n’est pas totalement branchée sur tous les écrans.

Concrètement, plusieurs écrans principaux contiennent encore des fallbacks temporaires :

- `DashboardScreen`
- `MealPlanScreen`
- `GroceryListScreen`
- `ProgressScreen`
- `ProfileScreen`

C’est un choix classique de hackathon : **sécuriser la démo**, tout en gardant un backend prêt à être connecté plus profondément.

---

## Roadmap

### Court terme

- brancher tous les écrans frontend aux endpoints réels,
- centraliser la configuration de l’URL backend,
- améliorer la gestion des tokens,
- enrichir la persistance du profil.

### Moyen terme

- tableau nutritionnel plus avancé,
- suggestions contextuelles plus intelligentes,
- système de notifications,
- analytics utilisateur,
- export PDF du plan et de la liste de courses.

### Long terme

- scoring nutritionnel intelligent,
- assistant conversationnel santé / nutrition,
- intégration avec wearables,
- interface nutritionniste / coach,
- marketplace alimentaire locale.

---

## Pourquoi ce projet mérite l’attention

**NutriAlgerie** ne présente pas seulement une interface jolie : il propose un **MVP cohérent**, utile, ancré dans un besoin concret et suffisamment modulaire pour devenir un vrai produit.

Dans un cadre hackathon, le projet se distingue par :

- la pertinence du problème,
- la qualité de la vision produit,
- la présence d’un vrai backend métier,
- l’adaptation locale,
- et un potentiel d’impact social clair.

---

## Auteurs / Équipe

> Remplacez cette section par les noms des membres de votre équipe, leurs rôles et éventuellement les liens LinkedIn / GitHub.

Exemple :

- **Nom Prénom** — Product / Pitch
- **Nom Prénom** — Frontend mobile
- **Nom Prénom** — Backend & logique métier
- **Nom Prénom** — Design / UX

---

## Licence

À définir selon votre choix : `MIT`, `Apache-2.0` ou licence propriétaire temporaire de hackathon.

---

## Conclusion

**NutriAlgerie** est une proposition de valeur simple à comprendre, forte à présenter et crédible techniquement.

Si vous cherchez un projet hackathon qui combine **impact**, **personnalisation**, **utilité terrain** et **potentiel produit**, vous êtes au bon endroit.
