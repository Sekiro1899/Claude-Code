"""
Construit les 4 blocs d'une séance (warmup, main, core, finisher)
selon les paramètres du programme et de la phase.
"""

import random

from engine.exercise_selector import (
    FOCUS_CATEGORY_MAP,
    FOCUS_WARMUP_TARGET_MAP,
    fetch_exercises,
    pick_exercises,
)
from models.workout import ExerciseBlock


def build_warmup_block(
    focus: str,
    phase: dict,
    program: dict,
    available_equipment: list[str],
    energy_level: int,
) -> list[ExerciseBlock]:
    """
    Construit le bloc warmup.
    - warmup_focus: very_light (2-3 exos) / light (3) / moderate (4) / heavy (5)
    """
    warmup_focus = program.get("warmup_focus", "moderate")
    count_map = {"very_light": 2, "light": 3, "moderate": 4, "heavy": 5}
    count = count_map.get(warmup_focus, 3)

    # Ajustement énergie basse → warmup plus long
    if energy_level <= 2:
        count = min(count + 1, 5)

    warmup_targets = FOCUS_WARMUP_TARGET_MAP.get(focus, ["all"])
    target = random.choice(warmup_targets)

    exercises = fetch_exercises(
        category="warmup",
        warmup_target=target,
        available_equipment=available_equipment,
    )
    # Fallback sur "all" si pas assez
    if len(exercises) < count:
        exercises += fetch_exercises(
            category="warmup",
            warmup_target="all",
            available_equipment=available_equipment,
        )

    picked = pick_exercises(exercises, count)

    blocks = []
    for ex in picked:
        intent_list = ex.get("intent", [])
        is_mobility = "mobilite" in intent_list

        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=2 if is_mobility else 1,
            reps=None if is_mobility else 10,
            duration_sec=30 if is_mobility else None,
            notes="Activation musculaire" if not is_mobility else "Mobilité",
        ))

    return blocks


def build_main_block(
    focus: str,
    phase: dict,
    program: dict,
    available_equipment: list[str],
    energy_level: int,
    level_max: str,
) -> list[ExerciseBlock]:
    """
    Construit le bloc principal.
    Sélectionne des exercices compound + isolation selon la phase.
    """
    categories = FOCUS_CATEGORY_MAP.get(focus, ["push", "pull", "legs"])

    sets_compounds = phase.get("sets_compounds", 4)
    sets_isolation = phase.get("sets_isolation", 3)
    rep_min = phase.get("rep_range_min", program.get("rep_range_min", 8))
    rep_max = phase.get("rep_range_max", program.get("rep_range_max", 12))
    rest_min = phase.get("rest_sec_min", program.get("rest_between_sets_sec_min", 60))
    rest_max = phase.get("rest_sec_max", program.get("rest_between_sets_sec_max", 90))

    # Déterminer le %1RM selon la phase
    load_pct = _resolve_load_pct(phase, program)

    # Ajustement énergie
    if energy_level <= 2:
        load_pct = max(load_pct - 10, 40)
        sets_compounds = max(sets_compounds - 1, 2)
    elif energy_level >= 5:
        load_pct = min(load_pct + 5, 100)

    bodyweight_only = program.get("load_intensity") == "bodyweight"

    # Nombre d'exercices : 2-3 compounds + 1-2 isolation par catégorie focus
    compound_count = min(len(categories) * 2, 4)
    isolation_count = min(len(categories), 3)

    # Fetch compounds (force/hypertrophie intent)
    all_compounds = []
    for cat in categories:
        exs = fetch_exercises(
            category=cat,
            intent="force" if program.get("objective") == "max_strength" else "hypertrophie",
            level_max=level_max,
            bodyweight_only=bodyweight_only,
            available_equipment=available_equipment,
        )
        # Fallback sans filtre intent
        if not exs:
            exs = fetch_exercises(
                category=cat,
                level_max=level_max,
                bodyweight_only=bodyweight_only,
                available_equipment=available_equipment,
            )
        all_compounds.extend(exs)

    picked_ids: set[str] = set()
    compound_picks = pick_exercises(all_compounds, compound_count, picked_ids)
    picked_ids.update(e["id"] for e in compound_picks)

    # Fetch isolation (arms + catégories secondaires)
    isolation_cats = ["arms"] if "arms" not in categories else categories
    all_isolation = []
    for cat in isolation_cats:
        exs = fetch_exercises(
            category=cat,
            level_max=level_max,
            bodyweight_only=bodyweight_only,
            available_equipment=available_equipment,
        )
        all_isolation.extend(exs)

    isolation_picks = pick_exercises(all_isolation, isolation_count, picked_ids)
    picked_ids.update(e["id"] for e in isolation_picks)

    # Construire les blocs
    blocks = []
    reps = random.randint(rep_min, rep_max)
    rest = random.randint(rest_min, rest_max)

    superset_level = phase.get("superset_level", program.get("superset_level", "none"))

    for ex in compound_picks:
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=sets_compounds,
            reps=reps,
            load_pct_1rm=load_pct if not bodyweight_only else None,
            rest_sec=rest,
            notes=f"Compound — {sets_compounds}x{reps}",
        ))

    for ex in isolation_picks:
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=sets_isolation,
            reps=min(reps + 2, rep_max + 2),
            load_pct_1rm=max(load_pct - 10, 40) if not bodyweight_only else None,
            rest_sec=max(rest - 15, 30),
            notes=f"Isolation — {sets_isolation}x{min(reps + 2, rep_max + 2)}",
        ))

    # Appliquer supersets si applicable
    if superset_level in ("moderate", "heavy") and len(blocks) >= 4:
        blocks = _apply_supersets(blocks, superset_level)

    return blocks


def build_core_block(
    phase: dict,
    program: dict,
    available_equipment: list[str],
    energy_level: int,
    level_max: str,
) -> list[ExerciseBlock]:
    """Construit le bloc core (2-3 exercices)."""
    count = 3 if energy_level >= 3 else 2

    strength_exs = fetch_exercises(
        category="core_strength",
        level_max=level_max,
        available_equipment=available_equipment,
    )
    endurance_exs = fetch_exercises(
        category="core_endurance",
        level_max=level_max,
        available_equipment=available_equipment,
    )

    picked_ids: set[str] = set()
    # 1-2 core_strength + 1 core_endurance
    strength_count = min(count - 1, 2)
    endurance_count = count - strength_count

    picks = pick_exercises(strength_exs, strength_count, picked_ids)
    picked_ids.update(e["id"] for e in picks)
    picks += pick_exercises(endurance_exs, endurance_count, picked_ids)

    rep_min = phase.get("rep_range_min", 8)
    rep_max = phase.get("rep_range_max", 12)

    blocks = []
    for ex in picks:
        is_endurance = ex.get("category") == "core_endurance"
        blocks.append(ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=3,
            reps=None if is_endurance else random.randint(rep_min, rep_max + 4),
            duration_sec=30 if is_endurance else None,
            rest_sec=30,
            notes="Core endurance" if is_endurance else "Core strength",
        ))

    return blocks


def build_finisher_block(
    program: dict,
    available_equipment: list[str],
    energy_level: int,
    level_max: str,
) -> list[ExerciseBlock]:
    """
    Construit le bloc finisher.
    - Si has_emom_finisher → EMOM/AMRAP finisher
    - Sinon → conditioning ou finisher classique
    """
    if energy_level <= 1:
        return []  # Pas de finisher si énergie très basse

    has_emom = program.get("has_emom_finisher", False)
    emom_duration = program.get("emom_duration_min", 10)

    if has_emom:
        # Chercher exercices finisher avec protocol EMOM/AMRAP
        exercises = fetch_exercises(
            category="finisher",
            level_max=level_max,
            available_equipment=available_equipment,
        )
        if not exercises:
            exercises = fetch_exercises(
                category="conditioning",
                level_max=level_max,
                available_equipment=available_equipment,
            )

        picked = pick_exercises(exercises, 1)
        if picked:
            ex = picked[0]
            protocol = ex.get("protocol", "EMOM")
            return [ExerciseBlock(
                exercise_id=ex["id"],
                name=ex["name"],
                sets=1,
                duration_sec=emom_duration * 60,
                rest_sec=0,
                notes=f"{protocol} — {emom_duration} min",
            )]

    # Fallback : conditioning classique
    exercises = fetch_exercises(
        category="conditioning",
        level_max=level_max,
        available_equipment=available_equipment,
    )
    if not exercises:
        exercises = fetch_exercises(
            category="finisher",
            level_max=level_max,
            available_equipment=available_equipment,
        )

    picked = pick_exercises(exercises, 1)
    if picked:
        ex = picked[0]
        return [ExerciseBlock(
            exercise_id=ex["id"],
            name=ex["name"],
            sets=3,
            reps=15,
            rest_sec=30,
            notes="Finisher — cardio/conditioning",
        )]

    return []


# ─── Helpers internes ───


def _resolve_load_pct(phase: dict, program: dict) -> int:
    """Détermine le %1RM à utiliser selon phase."""
    if phase.get("load_pct_1rm"):
        return phase["load_pct_1rm"]
    if phase.get("load_pct_1rm_start") and phase.get("load_pct_1rm_end"):
        return (phase["load_pct_1rm_start"] + phase["load_pct_1rm_end"]) // 2
    if program.get("load_pct_1rm_min") and program.get("load_pct_1rm_max"):
        return (program["load_pct_1rm_min"] + program["load_pct_1rm_max"]) // 2
    return 70  # Défaut


def _apply_supersets(blocks: list[ExerciseBlock], level: str) -> list[ExerciseBlock]:
    """Crée des paires de supersets parmi les exercices."""
    pair_count = 2 if level == "heavy" else 1

    paired = 0
    for i in range(0, len(blocks) - 1, 2):
        if paired >= pair_count:
            break
        blocks[i].superset_with = blocks[i + 1].exercise_id
        blocks[i].notes = (blocks[i].notes or "") + " [Superset]"
        blocks[i + 1].notes = (blocks[i + 1].notes or "") + " [Superset]"
        blocks[i + 1].rest_sec = 0
        paired += 1

    return blocks
