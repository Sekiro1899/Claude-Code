# Fitness Seed Data

Données de référence pour l'application de programmes sportifs personnalisés.

## Structure

```
fitness-seed/
├── schema.sql                  # DDL complet (15 tables, indexes, RLS Supabase)
├── seed.py                     # Script d'injection des données
├── requirements.txt            # Dépendances Python
├── data/
│   ├── 01_personas.json        # 5 profils-types d'utilisateurs
│   ├── 02_programs.json        # 5 programmes + 13 phases
│   ├── 03_persona_program_eligibility.json  # 25 entrées (matrice 5×5)
│   ├── 04_questionnaire_initial.json        # 9 questions / 35 options
│   ├── 05_feedback_poll.json                # 3 questions / 16 options
│   ├── 06_program_variants.json             # 6 variantes
│   ├── 07_alternative_pitches.json          # 4 pitches alternatifs
│   └── 08_exercises.json                    # ~109 exercices
```

## Tables référence (seed) vs runtime

### Seed (données statiques — injectées en Session 1)
- `programs` — 5 programmes d'entraînement
- `program_phases` — 13 phases (extraites de programs.phases)
- `personas` — 5 profils-types (FK → programs)
- `persona_program_eligibility` — matrice 5×5 (FK → personas, programs)
- `questionnaire_questions` + `questionnaire_options` — questionnaire de profilage
- `feedback_poll_questions` + `feedback_poll_options` — feedback post-programme
- `program_variants` — 6 variantes d'ajustement
- `alternative_program_pitches` — 4 propositions alternatives (FK → programs)
- `exercises` — ~109 exercices

### Runtime (données utilisateur — créées en production)
- `users` — profils utilisateurs (lié à Supabase Auth)
- `user_programs` — programmes actifs
- `sessions` — séances générées par le Workout Engine
- `session_logs` — suivi exercice par exercice
- `feedback_responses` — réponses au feedback poll
- `subscriptions` — abonnements Stripe

## Ordre d'insertion (respecter les FK)

```bash
# 1. Créer le schema
psql $DATABASE_URL -f schema.sql

# 2. Injecter dans cet ordre (FK dependencies)
# programs + phases   → aucune dépendance
# personas            → FK vers programs
# eligibility         → FK vers personas + programs
# questionnaire       → aucune dépendance
# feedback poll       → aucune dépendance
# program variants    → aucune dépendance
# alternative pitches → FK vers programs
# exercises           → aucune dépendance seed (FK users = nullable)
python seed.py
```

## Exécution

```bash
# Installer les dépendances
pip install -r requirements.txt

# Variables d'environnement requises
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Lancer le seed
python seed.py
```

## Workout Generator — inputs/outputs

**Input** :
```python
{
  "persona_id": "persona_smb",
  "program_id": "program_muscle_building",
  "phase_id": "mbf_phase_2",
  "week_number": 3,
  "protocol": "upper_lower",
  "focus": "upper",
  "energy_level": 4,
  "available_equipment": ["barbell", "dumbbells", "cables", "rack"]
}
```

**Output** :
```python
{
  "warmup_block": [...],   # 3-5 exercices spécifiques au focus du jour
  "main_block": [...],     # 4-6 exercices avec sets/reps/load/superset_with
  "core_block": [...],     # 2-3 exercices
  "finisher_block": [...]  # 1 finisher rotatif
}
```
