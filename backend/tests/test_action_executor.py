import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base
from app.db.models import Incident
from app.services.action_executor import request_or_execute_action, approve_and_execute_action

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_safe_action_executes_immediately(db_session):
    res = request_or_execute_action(
        db=db_session,
        incident_id="inc-1",
        action_name="check_db_pool_status",
        action_type="READ_ONLY",
        target_service="payment-service"
    )
    assert res["requires_approval"] is False
    assert res["status"] == "EXECUTED"
    assert res["result"]["active_connections"] == 50

def test_high_impact_action_requires_approval(db_session):
    res = request_or_execute_action(
        db=db_session,
        incident_id="inc-1",
        action_name="restart_service",
        action_type="HIGH_IMPACT",
        target_service="payment-service"
    )
    assert res["requires_approval"] is True
    assert res["status"] == "PENDING"

    action_id = res["action_id"]

    # Now approve it
    approval_res = approve_and_execute_action(
        db=db_session,
        action_id=action_id,
        approved=True,
        approver_name="Lead SRE"
    )

    assert approval_res["status"] == "EXECUTED"
    assert approval_res["result"]["pods_restarted"] == 3
