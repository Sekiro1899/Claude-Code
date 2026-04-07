"""
Sélection d'exercices depuis la base Supabase selon les critères du programme,
de la phase, du focus et de l'équipement disponible.
"""

import random

from database import supabase


def fetch_exercises(
    category: str | None = None,
    intent: str | None = None,
    level_max: str = "avance",
    bodyweight_only: bool = False,
    available_equipment: list[str] | None = None,
    warmup_target: str | None = None,
    limit: int = 50,
) -> list[dict]:
    """Récupère des exercices filtrés depuis Supabase."""
    query = supabase.table("exercises").select("*")

    if category:
        query = query.eq("category", category)

    if bodyweight_only:
        query = query.eq("bodyweight_compatible", True)

    if warmup_target:
        query = query.contains("warmup_target", [warmup_target])

    query = query.limit(limit)
    result = query.execute()
    exercises = result.data or []

    # Filtres post-query (arrays non filtrables directement)
    if intent:
        exercises = [e for e in exercises if intent in (e.get("intent") or [])]

    level_order = {"debutant": 0, "intermediaire": 1, "avance": 2}
    max_lvl = level_order.get(level_max, 2)
    exercises = [e for e in exercises if level_order.get(e.get("level"), 0) <= max_lvl]

    if available_equipment and not bodyweight_only:
        exercises = _filter_by_equipment(exercises, available_equipment)

    return exercises


def _filter_by_equipment(exercises: list[dict], available: list[str]) -> list[dict]:
    """Garde les exercices réalisables avec l'équipement disponible."""
    available_lower = {eq.lower() for eq in available}
    result = []
    for ex in exercises:
        required = ex.get("material_required") or []
        if not required:
            result.append(ex)
            continue
        req_lower = {r.lower() for r in required}
        if req_lower & available_lower or ex.get("bodyweight_compatible"):
            result.append(ex)
    return result


def pick_exercises(
    exercises: list[dict],
    count: int,
    already_picked: set[str] | None = None,
) -> list[dict]:
    """Sélectionne `count` exercices aléatoirement sans doublons."""
    if already_picked is None:
        already_picked = set()

    available = [e for e in exercises if e["id"] not in already_picked]
    random.shuffle(available)
    picked = available[:count]
    return picked


# ─── Mappings focus → catégories ───

FOCUS_CATEGORY_MAP = {
    "push": ["push"],
    "pull": ["pull"],
    "legs": ["legs"],
    "upper": ["push", "pull", "arms"],
    "lower": ["legs"],
    "full_body": ["push", "pull", "legs"],
}

FOCUS_WARMUP_TARGET_MAP = {
    "push": ["push", "bench", "ohp"],
    "pull": ["pull", "deadlift"],
    "legs": ["legs", "squat", "single_leg"],
    "upper": ["push", "pull", "bench", "ohp"],
    "lower": ["legs", "squat", "deadlift", "single_leg"],
    "full_body": ["all"],
}
