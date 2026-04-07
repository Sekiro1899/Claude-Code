"""
Router — Workout Generator.
POST /workout-generator/generate → génère une séance complète.
"""

from fastapi import APIRouter, HTTPException

from engine.generator import generate_workout
from models.workout import WorkoutRequest, WorkoutResponse

router = APIRouter(prefix="/workout-generator", tags=["Workout Generator"])


@router.post("/generate", response_model=WorkoutResponse)
async def generate(request: WorkoutRequest):
    """Génère une séance d'entraînement personnalisée."""
    try:
        return await generate_workout(request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
