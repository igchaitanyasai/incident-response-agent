from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Incident, Investigation
from app.schemas.dto import InvestigationOut
from app.services.hindsight_memory import search_hindsight_memories
from app.services.agent_reasoner import run_ai_investigation

router = APIRouter(prefix="/api/incidents", tags=["Investigation"])

@router.post("/{incident_id}/investigate", response_model=InvestigationOut)
def investigate_incident(incident_id: str, db: Session = Depends(get_db)):
    """
    Triggers AI-powered investigation for an incident, leveraging Hindsight Memory context.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    logs = inc.logs
    symptoms = [inc.title, inc.error_type] + [l.message for l in logs[:5]]

    # 1. Retrieve Hindsight Memories
    hindsight_matches = search_hindsight_memories(
        db=db,
        service_name=inc.service_name,
        error_type=inc.error_type,
        symptoms=symptoms,
        min_score_threshold=0.35
    )

    # 2. Run AI Investigation
    investigation_res = run_ai_investigation(
        incident=inc,
        log_events=logs,
        hindsight_memories=hindsight_matches
    )

    # Update incident state flags
    inc.status = "INVESTIGATING"
    if investigation_res.get("has_hindsight_match"):
        top_mem = hindsight_matches[0]
        if top_mem["similarity_score"] >= 0.70:
            inc.is_recurring = True
            inc.matched_memory_id = top_mem["memory_id"]

    # 3. Create Investigation database record
    inv_obj = Investigation(
        incident_id=inc.id,
        summary=investigation_res["summary"],
        hypotheses=investigation_res["hypotheses"],
        troubleshooting_steps=investigation_res["troubleshooting_steps"],
        recommendations=investigation_res["recommendations"],
        risk_assessment=investigation_res["risk_assessment"],
        missing_information=investigation_res.get("missing_information"),
        confidence_score=investigation_res["confidence_score"],
        has_hindsight_match=investigation_res["has_hindsight_match"],
        matched_memories=hindsight_matches
    )
    db.add(inv_obj)
    db.commit()
    db.refresh(inv_obj)

    return inv_obj


@router.get("/{incident_id}/investigation", response_model=InvestigationOut)
def get_latest_investigation(incident_id: str, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.incident_id == incident_id).order_by(Investigation.created_at.desc()).first()
    if not inv:
        raise HTTPException(status_code=404, detail="No investigation performed for this incident yet.")
    return inv
