from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class LogEntryInput(BaseModel):
    timestamp: str
    service_name: str
    log_level: str
    message: str
    stack_trace: Optional[str] = None
    raw_log: Optional[str] = None

class IngestLogRequest(BaseModel):
    title: Optional[str] = None
    service_name: Optional[str] = None
    raw_logs: Optional[str] = None
    structured_logs: Optional[List[LogEntryInput]] = None

class LogEventOut(BaseModel):
    id: int
    incident_id: str
    timestamp: str
    service_name: str
    log_level: str
    message: str
    stack_trace: Optional[str] = None
    raw_log: str
    is_masked: bool
    masked_secrets_count: int

    class Config:
        from_attributes = True

class IncidentOut(BaseModel):
    id: str
    title: str
    service_name: str
    error_type: str
    status: str
    severity: str
    created_at: datetime
    updated_at: datetime
    confirmed_root_cause: Optional[str] = None
    verified_resolution: Optional[str] = None
    engineer_notes: Optional[str] = None
    is_recurring: bool
    matched_memory_id: Optional[str] = None
    log_count: Optional[int] = 0

    class Config:
        from_attributes = True

class HypothesisSchema(BaseModel):
    id: str
    title: str
    description: str
    confidence: float
    evidence: List[str]
    assumptions: List[str]
    is_confirmed: bool = False

class TroubleshootingStepSchema(BaseModel):
    step: int
    action: str
    target_service: str
    risk_level: str  # SAFE vs HIGH_IMPACT
    description: str

class InvestigationOut(BaseModel):
    id: int
    incident_id: str
    summary: str
    hypotheses: List[HypothesisSchema]
    troubleshooting_steps: List[TroubleshootingStepSchema]
    recommendations: List[str]
    risk_assessment: Dict[str, Any]
    missing_information: Optional[List[str]] = None
    confidence_score: float
    has_hindsight_match: bool
    matched_memories: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MemoryEntryOut(BaseModel):
    id: str
    incident_id: Optional[str] = None
    title: str
    service_name: str
    error_pattern: str
    symptoms: List[str]
    environmental_details: Dict[str, Any]
    confirmed_root_cause: str
    successful_resolutions: List[str]
    failed_resolutions: Optional[List[str]] = []
    engineer_feedback: Optional[Dict[str, Any]] = None
    outcome_status: str
    retrieval_count: int
    success_rate: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ResolveIncidentRequest(BaseModel):
    confirmed_root_cause: str
    verified_resolution: str
    resolution_steps: List[str]
    failed_steps: Optional[List[str]] = []
    engineer_rating: int = 5
    engineer_notes: Optional[str] = None
    was_ai_helpful: bool = True

class ActionExecutionRequest(BaseModel):
    action_name: str
    action_type: str  # READ_ONLY or HIGH_IMPACT
    target_service: str
    params: Optional[Dict[str, Any]] = None

class ActionApprovalRequest(BaseModel):
    action_id: int
    approved: bool
    approver_name: str = "Lead SRE"
    notes: Optional[str] = None

class ActionAuditLogOut(BaseModel):
    id: int
    incident_id: str
    action_name: str
    action_type: str
    requires_approval: bool
    status: str
    executed_by: str
    params: Optional[Dict[str, Any]] = None
    result: Optional[Dict[str, Any]] = None
    timestamp: datetime

    class Config:
        from_attributes = True
