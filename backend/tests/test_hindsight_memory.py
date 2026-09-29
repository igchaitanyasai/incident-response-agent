import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base
from app.db.models import Incident, MemoryEntry
from app.services.hindsight_memory import store_hindsight_memory, search_hindsight_memories

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_store_and_search_hindsight_memory(db_session):
    incident = Incident(
        id="inc-100",
        title="payment-service: Database Timeout",
        service_name="payment-service",
        error_type="DBConnectionTimeoutException",
        status="OPEN",
        severity="HIGH"
    )
    db_session.add(incident)
    db_session.commit()

    # Store memory
    mem = store_hindsight_memory(
        db=db_session,
        incident=incident,
        confirmed_root_cause="HikariCP pool size was set too small for high load.",
        verified_resolution="Increased max_connections to 200 in config.yaml.",
        resolution_steps=["Adjust pool size to 200", "Restart payment service"],
        engineer_feedback={"rating": 5}
    )

    assert mem.id is not None
    assert mem.service_name == "payment-service"

    # Search memory with matching symptoms
    matches = search_hindsight_memories(
        db=db_session,
        service_name="order-service",
        error_type="DBConnectionTimeoutException",
        symptoms=["Connection pool exhausted", "HikariCP timeout waiting for connection"]
    )

    assert len(matches) == 1
    assert matches[0]["similarity_score"] > 0.50
    assert "HikariCP pool size" in matches[0]["confirmed_root_cause"]
