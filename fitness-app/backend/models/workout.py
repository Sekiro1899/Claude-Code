from pydantic import BaseModel, Field


class WorkoutRequest(BaseModel):
    user_id: str
    user_program_id: str
    persona_id: str
    program_id: str
    phase_id: str | None = None
    week_number: int = 1
    day_number: int = 1
    protocol: str | None = None
    focus: str | None = None
    energy_level: int = Field(default=3, ge=1, le=5)
    available_equipment: list[str] = []


class ExerciseBlock(BaseModel):
    exercise_id: str
    name: str
    sets: int
    reps: int | None = None
    duration_sec: int | None = None
    load_pct_1rm: int | None = None
    rest_sec: int | None = None
    superset_with: str | None = None
    notes: str | None = None


class WorkoutResponse(BaseModel):
    session_id: str
    program_id: str
    phase_id: str | None
    protocol: str
    focus: str
    session_label: str
    warmup_block: list[ExerciseBlock]
    main_block: list[ExerciseBlock]
    core_block: list[ExerciseBlock]
    finisher_block: list[ExerciseBlock]
