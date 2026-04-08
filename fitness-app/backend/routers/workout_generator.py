"""
Router — Workout Generator.
POST /workout/generate → génère une séance complète et la persiste dans sessions.
"""

from fastapi import APIRouter, HTTPException

from engine.generator import generate_workout
from models.workout import WorkoutRequest, WorkoutResponse

router = APIRouter(prefix="/workout", tags=["Workout Generator"])


@router.post("/generate", response_model=WorkoutResponse)
async def generate(request: WorkoutRequest):
    """Génère une séance d'entraînement personnalisée et la persiste en base."""
    try:
        return await generate_workout(request)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
