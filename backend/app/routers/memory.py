from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import MemoryEntry
from app.schemas.dto import MemoryEntryOut
from app.services.hindsight_memory import search_hindsight_memories

router = APIRouter(prefix="/api/memory", tags=["Hindsight Memory"])

@router.get("", response_model=List[MemoryEntryOut])
def list_memories(
    service_name: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MemoryEntry)
    if service_name:
        query = query.filter(MemoryEntry.service_name.ilike(f"%{service_name}%"))
    if search:
        query = query.filter(
            (MemoryEntry.title.ilike(f"%{search}%")) |
            (MemoryEntry.confirmed_root_cause.ilike(f"%{search}%")) |
            (MemoryEntry.error_pattern.ilike(f"%{search}%"))
        )
    return query.order_by(MemoryEntry.created_at.desc()).all()


@router.get("/stats")
def get_memory_stats(db: Session = Depends(get_db)):
    total_memories = db.query(MemoryEntry).count()
    total_retrievals = sum([m.retrieval_count for m in db.query(MemoryEntry).all()])
    resolved_count = db.query(MemoryEntry).filter(MemoryEntry.outcome_status == "RESOLVED").count()
    
    avg_success_rate = 1.0
    if total_memories > 0:
        rates = [m.success_rate for m in db.query(MemoryEntry).all()]
        avg_success_rate = sum(rates) / len(rates)

    return {
        "total_memories": total_memories,
        "total_retrievals": total_retrievals,
        "resolved_memories_count": resolved_count,
        "average_success_rate": round(avg_success_rate, 2),
        "system_status": "ONLINE",
        "vector_search_engine": "Hindsight Composite Hybrid Engine"
    }


@router.post("/search")
def search_memories_endpoint(
    service_name: str = Query(...),
    error_type: str = Query(...),
    symptoms: List[str] = Query(default=[]),
    db: Session = Depends(get_db)
):
    matches = search_hindsight_memories(
        db=db,
        service_name=service_name,
        error_type=error_type,
        symptoms=symptoms,
        min_score_threshold=0.20
    )
    return matches
