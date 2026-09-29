from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Incident, LogEvent, MemoryEntry, Investigation, ActionAuditLog
from app.schemas.dto import IncidentOut
from app.services.log_parser import parse_raw_logs, determine_incident_severity

router = APIRouter(prefix="/api/demo", tags=["Demo Scenarios"])

SCENARIO_LOGS = {
    "db_timeout_1": {
        "title": "payment-service: Database Connection Timeout",
        "service_name": "payment-service",
        "raw_logs": """2026-09-29 10:14:02 [payment-service] ERROR com.zaxxer.hikari.pool.HikariPool - payment-db-pool - Exception during pool initialization: postgresql://payment_user:SuperSecretPassword123!@10.0.4.12:5432/payment_db
2026-09-29 10:14:03 [payment-service] ERROR com.app.payment.PaymentController - Failed to process checkout transaction: org.springframework.dao.DataAccessResourceFailureException: Could not obtain JDBC Connection; nested exception is com.zaxxer.hikari.pool.HikariPool$PoolInitializationException: Connection pool exhausted (0 available, 50 active, 15 waiting threads).
    at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:218)
    at com.zaxxer.hikari.HikariDataSource.getConnection(HikariDataSource.java:100)
    at com.app.payment.repository.TransactionRepository.save(TransactionRepository.java:45)
    at com.app.payment.service.CheckoutService.processPayment(CheckoutService.java:88)
2026-09-29 10:14:05 [payment-service] ERROR com.app.payment.CheckoutService - Authorization Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c query timed out after 30000ms.
"""
    },
    "db_timeout_2": {
        "title": "order-service: Database Connection Pool Exhaustion",
        "service_name": "order-service",
        "raw_logs": """2026-09-29 11:30:15 [order-service] ERROR com.zaxxer.hikari.pool.HikariPool - order-db-pool - Connection timeout: postgresql://order_admin:ComplexDbPass2026@10.0.8.44:5432/order_db
2026-09-29 11:30:16 [order-service] ERROR com.app.order.OrderProcessor - Unable to fulfill order #94012: com.zaxxer.hikari.pool.HikariPool$PoolInitializationException: Connection pool exhausted (0 available, 50 active threads waiting on lock).
    at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:218)
    at com.app.order.repository.OrderRepository.createOrder(OrderRepository.java:112)
2026-09-29 11:30:18 [order-service] ERROR com.app.order.OrderProcessor - API Key api_key=sk_live_992144128001a18bc failed to establish DB session after 30sec.
"""
    },
    "memory_exhaustion": {
        "title": "analytics-worker: OutOfMemory Heap Exhaustion",
        "service_name": "analytics-worker",
        "raw_logs": """2026-09-29 08:00:10 [analytics-worker] WARN com.app.analytics.AggregationTask - Memory usage approaching threshold: 92% allocated heap occupied (3770MB / 4096MB).
2026-09-29 08:02:11 [analytics-worker] ERROR java.lang.OutOfMemoryError - Java heap space
java.lang.OutOfMemoryError: Java heap space
    at java.base/java.util.Arrays.copyOf(Arrays.java:3522)
    at java.base/java.io.ByteArrayOutputStream.grow(ByteArrayOutputStream.java:120)
    at com.app.analytics.cache.SessionTokenMap.bufferReport(SessionTokenMap.java:210)
    at com.app.analytics.service.BatchAggregator.processLargeBatch(BatchAggregator.java:95)
2026-09-29 08:02:15 [analytics-worker] FATAL com.app.analytics.WorkerRunner - Worker thread terminated unexpectedly. Dumping heap snapshot...
"""
    },
    "failed_deployment": {
        "title": "auth-service: Failed Deployment & Container Crash",
        "service_name": "auth-service",
        "raw_logs": """2026-09-29 09:12:01 [k8s-cluster] ERROR kubelet - Failed to pull image "registry.company.internal/auth-service:v2.4.1": rpc error: code = Unknown desc = Error response from daemon: Get "https://registry.company.internal/v2/": unauthorized: authentication required
2026-09-29 09:12:05 [k8s-cluster] ERROR kubelet - Error syncing pod auth-service-7f89d9b4b-x92kl ("auth-service-7f89d9b4b-x92kl_default"), Back-off pulling container "auth-service"
2026-09-29 09:12:10 [auth-service] FATAL com.app.auth.Main - Missing required environment configuration secret 'JWT_SIGNING_SECRET' in deployment spec.
"""
    }
}


@router.post("/trigger/{scenario_key}", response_model=IncidentOut)
def trigger_demo_scenario(scenario_key: str, db: Session = Depends(get_db)):
    """
    Triggers a pre-configured realistic incident scenario for interactive demonstration.
    """
    if scenario_key not in SCENARIO_LOGS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown scenario '{scenario_key}'. Valid scenarios: {list(SCENARIO_LOGS.keys())}"
        )

    scen = SCENARIO_LOGS[scenario_key]
    parsed_entries = parse_raw_logs(scen["raw_logs"])

    _, main_service, error_type, severity = determine_incident_severity(parsed_entries)

    new_inc = Incident(
        title=scen["title"],
        service_name=scen["service_name"],
        error_type=error_type,
        status="OPEN",
        severity=severity
    )
    db.add(new_inc)
    db.flush()

    for entry in parsed_entries:
        log_obj = LogEvent(
            incident_id=new_inc.id,
            timestamp=entry.get("timestamp", "2026-09-29 00:00:00"),
            service_name=entry.get("service_name", scen["service_name"]),
            log_level=entry.get("log_level", "ERROR"),
            message=entry.get("message", ""),
            stack_trace=entry.get("stack_trace"),
            raw_log=entry.get("raw_log", ""),
            is_masked=entry.get("is_masked", False),
            masked_secrets_count=entry.get("masked_secrets_count", 0)
        )
        db.add(log_obj)

    db.commit()
    db.refresh(new_inc)
    inc_out = IncidentOut.from_orm(new_inc)
    inc_out.log_count = len(new_inc.logs)
    return inc_out


@router.post("/reset")
def reset_demo_database(db: Session = Depends(get_db)):
    """
    Resets database tables and seeds standard state for demonstration.
    """
    db.query(ActionAuditLog).delete()
    db.query(Investigation).delete()
    db.query(LogEvent).delete()
    db.query(Incident).delete()
    db.query(MemoryEntry).delete()
    db.commit()
    return {"message": "Demo database successfully reset!"}
