from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Incident, LogEvent
from app.schemas.dto import IncidentOut, LogEventOut, IngestLogRequest
from app.services.log_parser import parse_raw_logs, determine_incident_severity

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])

@router.get("", response_model=List[IncidentOut])
def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    service_name: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status.upper())
    if severity:
        query = query.filter(Incident.severity == severity.upper())
    if service_name:
        query = query.filter(Incident.service_name.ilike(f"%{service_name}%"))
    if search:
        query = query.filter(
            (Incident.title.ilike(f"%{search}%")) |
            (Incident.error_type.ilike(f"%{search}%")) |
            (Incident.service_name.ilike(f"%{search}%"))
        )

    incidents = query.order_by(Incident.created_at.desc()).all()
    
    result = []
    for inc in incidents:
        inc_dict = IncidentOut.from_orm(inc)
        inc_dict.log_count = len(inc.logs)
        result.append(inc_dict)
    return result


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    inc_out = IncidentOut.from_orm(inc)
    inc_out.log_count = len(inc.logs)
    return inc_out


@router.get("/{incident_id}/logs", response_model=List[LogEventOut])
def get_incident_logs(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc.logs


@router.post("/ingest", response_model=IncidentOut)
def ingest_logs(payload: IngestLogRequest, db: Session = Depends(get_db)):
    """
    Ingests application logs, parses entries, redacts secrets, groups into an incident, and sets initial severity.
    """
    parsed_entries = []
    if payload.raw_logs:
        parsed_entries = parse_raw_logs(payload.raw_logs)
    elif payload.structured_logs:
        parsed_entries = [item.dict() for item in payload.structured_logs]
    else:
        raise HTTPException(status_code=400, detail="Must provide either raw_logs string or structured_logs list.")

    if not parsed_entries:
        raise HTTPException(status_code=400, detail="Failed to parse any valid log events.")

    # Determine title, service, error type & severity
    computed_title, main_service, error_type, severity = determine_incident_severity(parsed_entries)
    title = payload.title or computed_title
    service_name = payload.service_name or main_service

    new_incident = Incident(
        title=title,
        service_name=service_name,
        error_type=error_type,
        status="OPEN",
        severity=severity
    )
    db.add(new_incident)
    db.flush()

    for entry in parsed_entries:
        log_obj = LogEvent(
            incident_id=new_incident.id,
            timestamp=entry.get("timestamp", "2026-09-29 00:00:00"),
            service_name=entry.get("service_name", service_name),
            log_level=entry.get("log_level", "ERROR"),
            message=entry.get("message", ""),
            stack_trace=entry.get("stack_trace"),
            raw_log=entry.get("raw_log", entry.get("message", "")),
            is_masked=entry.get("is_masked", False),
            masked_secrets_count=entry.get("masked_secrets_count", 0)
        )
        db.add(log_obj)

    db.commit()
    db.refresh(new_incident)
    inc_out = IncidentOut.from_orm(new_incident)
    inc_out.log_count = len(new_incident.logs)
    return inc_out


@router.patch("/{incident_id}/status", response_model=IncidentOut)
def update_incident_status(
    incident_id: str,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    if status:
        inc.status = status.upper()
    if severity:
        inc.severity = severity.upper()
    db.commit()
    db.refresh(inc)
    inc_out = IncidentOut.from_orm(inc)
    inc_out.log_count = len(inc.logs)
    return inc_out
