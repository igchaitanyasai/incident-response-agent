from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Incident
from app.schemas.dto import ResolveIncidentRequest, IncidentOut, MemoryEntryOut
from app.services.hindsight_memory import store_hindsight_memory

router = APIRouter(prefix="/api/incidents", tags=["Feedback & Resolution"])

@router.post("/{incident_id}/resolve")
def resolve_incident(
    incident_id: str,
    payload: ResolveIncidentRequest,
    db: Session = Depends(get_db)
):
    """
    Submits engineer verified root cause and resolution. Updates incident status and stores knowledge in Hindsight Memory.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Update Incident status & resolution details
    inc.status = "RESOLVED"
    inc.confirmed_root_cause = payload.confirmed_root_cause
    inc.verified_resolution = payload.verified_resolution
    inc.engineer_notes = payload.engineer_notes

    feedback_dict = {
        "engineer_rating": payload.engineer_rating,
        "was_ai_helpful": payload.was_ai_helpful,
        "notes": payload.engineer_notes
    }

    # Store in Hindsight Persistent Memory
    memory_entry = store_hindsight_memory(
        db=db,
        incident=inc,
        confirmed_root_cause=payload.confirmed_root_cause,
        verified_resolution=payload.verified_resolution,
        resolution_steps=payload.resolution_steps,
        failed_steps=payload.failed_steps,
        engineer_feedback=feedback_dict
    )

    inc.matched_memory_id = memory_entry.id
    db.commit()
    db.refresh(inc)

    return {
        "incident": IncidentOut.from_orm(inc),
        "memory_saved": MemoryEntryOut.from_orm(memory_entry),
        "message": "Incident marked as RESOLVED and findings successfully committed to Hindsight Persistent Memory!"
    }
