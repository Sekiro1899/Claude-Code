# Fitness Seed Data

Données de référence pour l'application de programmes sportifs personnalisés.

## Structure

```
fitness-seed/
├── schema.sql                  # DDL complet (15 tables, indexes, RLS)
├── seed.py                     # Script d'injection des données
├── data/
│   ├── 01_personas.json        # Profils-types d'utilisateurs
│   ├── 02_fitness_goals.json   # Objectifs fitness
│   ├── 03_muscle_groups.json   # Groupes musculaires
│   ├── 04_equipment.json       # Équipements disponibles
│   ├── 05_difficulty_levels.json # Niveaux de difficulté
│   ├── 06_exercise_categories.json # Catégories d'exercices
│   ├── 07_body_zones.json      # Zones corporelles
│   └── 08_exercises.json       # Exercices (avec FK vers les tables précédentes)
```

## Ordre d'insertion (respecter les FK)

1. `personas` — aucune dépendance
2. `fitness_goals` — aucune dépendance
3. `muscle_groups` — aucune dépendance
4. `equipment` — aucune dépendance
5. `difficulty_levels` — aucune dépendance
6. `exercise_categories` — aucune dépendance
7. `body_zones` — FK → `muscle_groups`
8. `exercises` — FK → `muscle_groups`, `equipment`, `difficulty_levels`, `exercise_categories`

## Tables supplémentaires (créées par schema.sql, peuplées par l'app)

- `profiles` — profils utilisateurs (lié à Supabase Auth)
- `user_preferences` — préférences utilisateur → FK `profiles`, `fitness_goals`
- `user_equipment` — équipement possédé → FK `profiles`, `equipment`
- `workout_programs` — programmes générés → FK `profiles`, `fitness_goals`
- `workout_sessions` — séances d'un programme → FK `workout_programs`
- `session_exercises` — exercices d'une séance → FK `workout_sessions`, `exercises`
- `progress_logs` — suivi de progression → FK `profiles`, `session_exercises`

## Exécution

```bash
# 1. Créer les tables
psql $DATABASE_URL -f schema.sql

# 2. Injecter les données de référence
python seed.py
```

Variables d'environnement requises :
- `SUPABASE_URL` — URL du projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Clé service_role (pas la clé anon)
