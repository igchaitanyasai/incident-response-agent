from app.services.log_parser import mask_secrets, parse_raw_logs, determine_incident_severity

def test_mask_secrets():
    raw_str = "DB URL: postgresql://admin:SuperSecretPass123@localhost:5432/mydb with Bearer eyJhbGciOiJIUzI1NiJ9.token"
    masked, count = mask_secrets(raw_str)
    assert "[REDACTED_SECRET]" in masked
    assert "SuperSecretPass123" not in masked
    assert count >= 1

def test_parse_raw_logs():
    raw_log = """2026-09-29 10:00:00 [test-service] ERROR com.app.Test - Exception occurred: postgresql://user:pass123@host:5432/db"""
    parsed = parse_raw_logs(raw_log)
    assert len(parsed) == 1
    assert parsed[0]["service_name"] == "test-service"
    assert parsed[0]["is_masked"] is True
    assert "pass123" not in parsed[0]["message"]

def test_determine_incident_severity():
    events = [
        {"service_name": "payment-service", "log_level": "ERROR", "message": "DBConnectionTimeoutException: Connection pool exhausted"}
    ]
    title, service, err_type, severity = determine_incident_severity(events)
    assert service == "payment-service"
    assert severity == "CRITICAL"
    assert "Timeout" in title
