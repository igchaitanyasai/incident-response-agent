from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.database import Base, engine
from app.routers import incidents, investigation, memory, feedback, actions, demo

# Create DB tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Intelligent Incident Response Agent API with Hindsight Persistent Memory Integration"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(incidents.router)
app.include_router(investigation.router)
app.include_router(memory.router)
app.include_router(feedback.router)
app.include_router(actions.router)
app.include_router(demo.router)

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "RUNNING",
        "hindsight_memory_engine": "ACTIVE",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "HEALTHY", "database": "CONNECTED"}
