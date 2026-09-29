from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import ActionAuditLog
from app.schemas.dto import ActionExecutionRequest, ActionApprovalRequest, ActionAuditLogOut
from app.services.action_executor import request_or_execute_action, approve_and_execute_action

router = APIRouter(prefix="/api/actions", tags=["Action Guardrails"])

@router.post("/execute", response_model=dict)
def execute_action(
    incident_id: str,
    payload: ActionExecutionRequest,
    db: Session = Depends(get_db)
):
    res = request_or_execute_action(
        db=db,
        incident_id=incident_id,
        action_name=payload.action_name,
        action_type=payload.action_type,
        target_service=payload.target_service,
        params=payload.params
    )
    return res


@router.post("/approve", response_model=dict)
def approve_action(
    payload: ActionApprovalRequest,
    db: Session = Depends(get_db)
):
    try:
        res = approve_and_execute_action(
            db=db,
            action_id=payload.action_id,
            approved=payload.approved,
            approver_name=payload.approver_name,
            notes=payload.notes
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/incident/{incident_id}", response_model=List[ActionAuditLogOut])
def list_incident_actions(incident_id: str, db: Session = Depends(get_db)):
    logs = db.query(ActionAuditLog).filter(ActionAuditLog.incident_id == incident_id).order_by(ActionAuditLog.timestamp.desc()).all()
    return logs
