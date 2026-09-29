from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import ActionAuditLog, Incident

SAFE_ACTIONS = [
    "check_db_pool_status",
    "inspect_memory_heap",
    "fetch_deployment_history",
    "query_active_metrics",
    "inspect_kubernetes_manifest"
]

def request_or_execute_action(
    db: Session,
    incident_id: str,
    action_name: str,
    action_type: str,
    target_service: str,
    params: Optional[Dict[str, Any]] = None,
    executed_by: str = "ENGINEER"
) -> Dict[str, Any]:
    """
    Handles action execution requests with human-in-the-loop guardrails.
    SAFE actions execute immediately.
    HIGH_IMPACT actions create a PENDING authorization ticket.
    """
    requires_approval = (action_type == "HIGH_IMPACT") or (action_name not in SAFE_ACTIONS)
    initial_status = "PENDING" if requires_approval else "EXECUTED"

    # Simulate output result
    simulated_result = None
    if not requires_approval:
        simulated_result = _simulate_action_output(action_name, target_service, params)

    audit_entry = ActionAuditLog(
        incident_id=incident_id,
        action_name=action_name,
        action_type=action_type,
        requires_approval=requires_approval,
        status=initial_status,
        executed_by=executed_by,
        params=params or {"target_service": target_service},
        result=simulated_result,
        timestamp=datetime.utcnow()
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)

    return {
        "action_id": audit_entry.id,
        "incident_id": incident_id,
        "action_name": action_name,
        "action_type": action_type,
        "requires_approval": requires_approval,
        "status": audit_entry.status,
        "result": simulated_result,
        "message": "Action executed successfully." if not requires_approval else "Action requires human approval before execution."
    }


def approve_and_execute_action(
    db: Session,
    action_id: int,
    approved: bool,
    approver_name: str = "Lead SRE",
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Approves or rejects a pending HIGH_IMPACT action and executes it if approved.
    """
    audit_entry = db.query(ActionAuditLog).filter(ActionAuditLog.id == action_id).first()
    if not audit_entry:
        raise ValueError(f"Action ticket #{action_id} not found.")

    if audit_entry.status != "PENDING":
        return {
            "action_id": audit_entry.id,
            "status": audit_entry.status,
            "message": f"Action ticket is already in '{audit_entry.status}' state."
        }

    if not approved:
        audit_entry.status = "REJECTED"
        audit_entry.executed_by = approver_name
        audit_entry.result = {"approved": False, "notes": notes or "Rejected by engineer."}
        db.commit()
        return {
            "action_id": audit_entry.id,
            "status": "REJECTED",
            "message": "Action execution rejected by engineer."
        }

    # Execute approved action
    target_service = (audit_entry.params or {}).get("target_service", "app-service")
    result = _simulate_action_output(audit_entry.action_name, target_service, audit_entry.params)

    audit_entry.status = "EXECUTED"
    audit_entry.executed_by = approver_name
    audit_entry.result = result
    db.commit()

    return {
        "action_id": audit_entry.id,
        "status": "EXECUTED",
        "result": result,
        "message": f"Action '{audit_entry.action_name}' approved and executed successfully by {approver_name}."
    }


def _simulate_action_output(action_name: str, target_service: str, params: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Simulates execution output telemetry for diagnostic and remediation actions."""
    if "db_pool" in action_name or "connection" in action_name:
        return {
            "status": "SUCCESS",
            "active_connections": 50,
            "max_connections": 50,
            "idle_connections": 0,
            "waiting_threads": 14,
            "recommendation": "Expand max_connections to 200 and recycle leaked connections."
        }
    elif "restart" in action_name or "patch" in action_name:
        return {
            "status": "SUCCESS",
            "target_service": target_service,
            "pods_restarted": 3,
            "new_pool_size": 200,
            "health_check": "PASSED (HTTP 200 OK)",
            "execution_time_ms": 1450
        }
    elif "heap" in action_name or "memory" in action_name:
        return {
            "status": "SUCCESS",
            "heap_used_mb": 3840,
            "heap_max_mb": 4096,
            "top_memory_retained_class": "com.app.cache.SessionTokenMap (78% heap usage)",
            "dump_file": "/var/dumps/heap_20260929.hprof"
        }
    elif "flush" in action_name:
        return {
            "status": "SUCCESS",
            "keys_evicted": 142050,
            "memory_freed_mb": 2800,
            "system_load": "NORMAL"
        }
    else:
        return {
            "status": "SUCCESS",
            "target_service": target_service,
            "output": f"Executed {action_name} cleanly.",
            "execution_time_ms": 320
        }
