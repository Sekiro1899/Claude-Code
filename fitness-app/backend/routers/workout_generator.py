"""
Router placeholder — Workout Generator.
Sera implémenté en Session 2.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/workout-generator", tags=["Workout Generator"])


@router.post("/generate")
async def generate_workout():
    """Placeholder — génère une séance d'entraînement personnalisée."""
    return {
        "message": "Workout Generator — à implémenter en Session 2",
        "warmup_block": [],
        "main_block": [],
        "core_block": [],
        "finisher_block": [],
    }
