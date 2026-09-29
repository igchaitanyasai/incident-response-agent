import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    service_name = Column(String(100), nullable=False)
    error_type = Column(String(100), nullable=False)
    status = Column(String(50), default="OPEN")  # OPEN, INVESTIGATING, RESOLVED, UNRESOLVED, CLOSED
    severity = Column(String(20), default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    confirmed_root_cause = Column(Text, nullable=True)
    verified_resolution = Column(Text, nullable=True)
    engineer_notes = Column(Text, nullable=True)
    is_recurring = Column(Boolean, default=False)
    matched_memory_id = Column(String(36), nullable=True)

    logs = relationship("LogEvent", back_populates="incident", cascade="all, delete-orphan")
    investigations = relationship("Investigation", back_populates="incident", cascade="all, delete-orphan")
    action_logs = relationship("ActionAuditLog", back_populates="incident", cascade="all, delete-orphan")


class LogEvent(Base):
    __tablename__ = "log_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False)
    timestamp = Column(String(50), nullable=False)
    service_name = Column(String(100), nullable=False)
    log_level = Column(String(20), nullable=False)  # INFO, WARN, ERROR, FATAL
    message = Column(Text, nullable=False)
    stack_trace = Column(Text, nullable=True)
    raw_log = Column(Text, nullable=False)
    is_masked = Column(Boolean, default=False)
    masked_secrets_count = Column(Integer, default=0)

    incident = relationship("Incident", back_populates="logs")


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False)
    summary = Column(Text, nullable=False)
    hypotheses = Column(JSON, nullable=False)  # List of {id, title, description, confidence, evidence, assumptions, is_confirmed}
    troubleshooting_steps = Column(JSON, nullable=False)  # List of {step, action, target_service, risk_level}
    recommendations = Column(JSON, nullable=False)  # List of recommended fixes
    risk_assessment = Column(JSON, nullable=False)  # {high_risk_actions, safe_actions}
    missing_information = Column(JSON, nullable=True)  # List of missing data points
    confidence_score = Column(Float, default=0.5)
    has_hindsight_match = Column(Boolean, default=False)
    matched_memories = Column(JSON, nullable=True)  # Summary of matching memories
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="investigations")


class MemoryEntry(Base):
    __tablename__ = "hindsight_memories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), nullable=True)
    title = Column(String(255), nullable=False)
    service_name = Column(String(100), nullable=False)
    error_pattern = Column(String(255), nullable=False)
    symptoms = Column(JSON, nullable=False)  # List of symptom strings
    environmental_details = Column(JSON, nullable=False)  # Metadata dict
    confirmed_root_cause = Column(Text, nullable=False)
    successful_resolutions = Column(JSON, nullable=False)  # List of resolution steps
    failed_resolutions = Column(JSON, nullable=True, default=list)
    engineer_feedback = Column(JSON, nullable=True)  # Feedback notes, rating
    outcome_status = Column(String(50), default="RESOLVED")  # RESOLVED, PARTIAL, UNRESOLVED
    retrieval_count = Column(Integer, default=0)
    success_rate = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ActionAuditLog(Base):
    __tablename__ = "action_audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False)
    action_name = Column(String(100), nullable=False)
    action_type = Column(String(50), nullable=False)  # READ_ONLY, HIGH_IMPACT
    requires_approval = Column(Boolean, default=False)
    status = Column(String(50), default="PENDING")  # PENDING, APPROVED, REJECTED, EXECUTED, FAILED
    executed_by = Column(String(100), default="ENGINEER")
    params = Column(JSON, nullable=True)
    result = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="action_logs")
