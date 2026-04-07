#!/usr/bin/env python3
"""
Seed script — Injecte les données de référence dans Supabase.
Respecte l'ordre des FK :
  1. programs + program_phases
  2. personas
  3. persona_program_eligibility
  4. questionnaire_questions + questionnaire_options
  5. feedback_poll_questions + feedback_poll_options
  6. program_variants
  7. alternative_program_pitches
  8. exercises
"""

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Variables SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

DATA_DIR = Path(__file__).parent / "data"


def load_json(filename: str):
    filepath = DATA_DIR / filename
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def upsert(table: str, rows: list[dict]):
    """Upsert des lignes dans une table Supabase."""
    if not rows:
        return
    res = supabase.table(table).upsert(rows).execute()
    print(f"  ✅ {table}: {len(rows)} lignes insérées")
    return res


# ─────────────────────────────────────────────
# 1. PROGRAMS + PROGRAM_PHASES
# ─────────────────────────────────────────────
def seed_programs():
    print("\n📦 1/8 — Programs + Phases")
    data = load_json("02_programs.json")
    programs = []
    all_phases = []

    for p in data:
        phases = p.pop("phases", [])
        # Nettoyer les champs non-DB
        p.pop("references", None)
        p.pop("has_loaded_complexes", None)
        p.pop("loaded_complex_examples", None)
        p.pop("emom_examples", None)
        programs.append(p)

        for phase in phases:
            phase["program_id"] = p["id"]
            all_phases.append(phase)

    upsert("programs", programs)
    upsert("program_phases", all_phases)


# ─────────────────────────────────────────────
# 2. PERSONAS
# ─────────────────────────────────────────────
def seed_personas():
    print("\n👤 2/8 — Personas")
    data = load_json("01_personas.json")
    personas = []
    for p in data:
        # Nettoyer les champs non-DB
        p.pop("sav_weekly_rotation", None)
        personas.append(p)
    upsert("personas", personas)


# ─────────────────────────────────────────────
# 3. PERSONA-PROGRAM ELIGIBILITY
# ─────────────────────────────────────────────
def seed_eligibility():
    print("\n🔗 3/8 — Persona-Program Eligibility")
    data = load_json("03_persona_program_eligibility.json")
    upsert("persona_program_eligibility", data)


# ─────────────────────────────────────────────
# 4. QUESTIONNAIRE
# ─────────────────────────────────────────────
def seed_questionnaire():
    print("\n📝 4/8 — Questionnaire")
    data = load_json("04_questionnaire_initial.json")
    questions = []
    options = []

    questionnaire_id = data["questionnaire_id"]

    for q in data["questions"]:
        q_options = q.pop("options", [])
        questions.append({
            "id": q["id"],
            "questionnaire_id": questionnaire_id,
            "question_number": q["question_number"],
            "text": q["text"],
            "type": q["type"],
            "segmentation_role": q.get("segmentation_role"),
            "note": q.get("note"),
        })

        for opt in q_options:
            persona_scores = opt.get("persona_scores", {})
            options.append({
                "id": opt["id"],
                "question_id": q["id"],
                "label": opt["label"],
                "value": opt["value"],
                "maps_to_objective": opt.get("maps_to_objective"),
                "maps_to_duration_max": opt.get("maps_to_duration_max"),
                "maps_to_frequency_min": opt.get("maps_to_frequency_min"),
                "maps_to_frequency_max": opt.get("maps_to_frequency_max"),
                "maps_to_environment": opt.get("maps_to_environment"),
                "score_smb": persona_scores.get("SMB", 0),
                "score_bf": persona_scores.get("BF", 0),
                "score_aw": persona_scores.get("AW", 0),
                "score_cr": persona_scores.get("CR", 0),
                "score_sav": persona_scores.get("SAV", 0),
                "has_malus": opt.get("has_malus", False),
                "is_exclusive": opt.get("is_exclusive", False),
                "is_sav_exclusive_signal": opt.get("is_sav_exclusive_signal", False),
                "note": opt.get("note"),
            })

    upsert("questionnaire_questions", questions)
    upsert("questionnaire_options", options)


# ─────────────────────────────────────────────
# 5. FEEDBACK POLL
# ─────────────────────────────────────────────
def seed_feedback_poll():
    print("\n📊 5/8 — Feedback Poll")
    data = load_json("05_feedback_poll.json")
    questions = []
    options = []

    poll_id = data["poll_id"]

    for q in data["questions"]:
        q_options = q.pop("options", [])
        questions.append({
            "id": q["id"],
            "poll_id": poll_id,
            "question_number": q["question_number"],
            "text": q["text"],
            "type": q["type"],
            "stores_as": q.get("stores_as"),
            "stores_factor_as": q.get("stores_factor_as"),
            "scoring_rule": q.get("scoring_rule"),
            "note": q.get("note"),
        })

        for opt in q_options:
            opt_id = opt.get("id", f"{q['id']}_{opt['value']}")
            options.append({
                "id": opt_id,
                "question_id": q["id"],
                "value": str(opt["value"]),
                "label": opt["label"],
                "sublabel": opt.get("sublabel"),
                "numeric_value": opt.get("value") if isinstance(opt.get("value"), int) else None,
                "has_subscale": opt.get("has_subscale", False),
                "fixed_score": opt.get("fixed_score"),
                "maps_to_variant": opt.get("maps_to_variant"),
                "maps_to_program_id": opt.get("maps_to_program_id"),
                "maps_to_persona": opt.get("maps_to_persona"),
                "triggers_alternative_pitch": opt.get("triggers_alternative_program_pitch", False),
                "fallback_to_bodyweight": opt.get("fallback_to_bodyweight", False),
            })

    upsert("feedback_poll_questions", questions)
    upsert("feedback_poll_options", options)


# ─────────────────────────────────────────────
# 6. PROGRAM VARIANTS
# ─────────────────────────────────────────────
def seed_program_variants():
    print("\n🔧 6/8 — Program Variants")
    data = load_json("06_program_variants.json")
    variants = []

    for v in data:
        adaptations = v.pop("adaptations", {})
        # Aplatir le champ trigger_factor en array
        tf = v.get("trigger_factor")
        if isinstance(tf, str):
            v["trigger_factor"] = [tf]

        variants.append({
            "id": v["id"],
            "code": v["code"],
            "name": v["name"],
            "trigger_factor": v.get("trigger_factor"),
            "trigger_subscale_min": v.get("trigger_subscale_min"),
            "description": v.get("description"),
            "load_adjustment_pct": adaptations.get("load_adjustment_pct"),
            "rep_range_adjustment": adaptations.get("rep_range_adjustment"),
            "sets_adjustment": adaptations.get("sets_adjustment"),
            "rest_adjustment_sec": adaptations.get("rest_adjustment_sec"),
            "frequency_adjustment": adaptations.get("frequency_adjustment"),
            "frequency_min_floor": adaptations.get("frequency_min_floor"),
            "frequency_max_ceiling": adaptations.get("frequency_max_ceiling"),
            "volume_per_session_adjustment": adaptations.get("volume_per_session_adjustment"),
            "exercise_swap_pct": adaptations.get("exercise_swap_pct"),
            "swap_preserve_muscle_groups": adaptations.get("preserve_muscle_groups", True),
            "protocol_change": adaptations.get("protocol_change", False),
            "protocol_transitions": adaptations.get("protocol_transitions"),
            "applicable_programs": v.get("applicable_programs"),
            "excluded_programs": v.get("excluded_programs"),
            "message_template": v.get("message_template"),
        })

    upsert("program_variants", variants)


# ─────────────────────────────────────────────
# 7. ALTERNATIVE PITCHES
# ─────────────────────────────────────────────
def seed_alternative_pitches():
    print("\n💡 7/8 — Alternative Pitches")
    data = load_json("07_alternative_pitches.json")
    upsert("alternative_program_pitches", data)


# ─────────────────────────────────────────────
# 8. EXERCISES
# ─────────────────────────────────────────────
def seed_exercises():
    print("\n🏋️ 8/8 — Exercises")
    data = load_json("08_exercises.json")
    upsert("exercises", data)


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
def main():
    print("🚀 Démarrage du seed Fitness App")
    print(f"   Supabase URL: {SUPABASE_URL}")
    print(f"   Data dir: {DATA_DIR}")

    seed_programs()
    seed_personas()
    seed_eligibility()
    seed_questionnaire()
    seed_feedback_poll()
    seed_program_variants()
    seed_alternative_pitches()
    seed_exercises()

    print("\n🎉 Seed terminé avec succès !")


if __name__ == "__main__":
    main()
