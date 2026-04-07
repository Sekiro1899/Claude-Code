from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import workout_generator

app = FastAPI(
    title="Fitness App API",
    description="API pour la génération de programmes sportifs personnalisés",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workout_generator.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
