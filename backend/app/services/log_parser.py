import re
import json
from typing import List, Dict, Tuple, Any

# Patterns for sensitive credentials & secret detection
SECRET_PATTERNS = [
    # DB URLs with passwords
    (r'(postgres(?:ql)?|mysql|mongodb|redis)://([^:]+):([^@]+)@', r'\1://\2:[REDACTED_SECRET]@'),
    # Bearer tokens & JWTs
    (r'(Bearer\s+)[A-Za-z0-9\-\._~\+\/]+=*', r'\1[REDACTED_JWT_TOKEN]'),
    (r'eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*', r'[REDACTED_JWT_TOKEN]'),
    # AWS Access Keys & Secret Keys
    (r'(AKIA[0-9A-Z]{16})', r'[REDACTED_AWS_KEY_ID]'),
    (r'(aws_secret_access_key\s*=\s*)([A-Za-z0-9/+=]{40})', r'\1[REDACTED_AWS_SECRET]'),
    # Generic API Keys / Secrets / Passwords
    (r'((?:api[_-]?key|auth[_-]?token|secret|password|passwd)\s*[:=]\s*["\']?)([^"\'\s;,}{]+)(["\']?)', r'\1[REDACTED_SECRET]\3', re.IGNORECASE),
    # Private Keys
    (r'-----BEGIN (?:RSA )?PRIVATE KEY-----[^\n]*[A-Za-z0-9+/=\s]+-----END (?:RSA )?PRIVATE KEY-----', r'[REDACTED_PRIVATE_KEY]')
]

def mask_secrets(text: str) -> Tuple[str, int]:
    """
    Masks sensitive information in text and returns (masked_text, count_of_redactions)
    """
    if not text:
        return "", 0
    
    masked_text = text
    redaction_count = 0

    for pattern in SECRET_PATTERNS:
        flags = pattern[2] if len(pattern) > 2 else 0
        matches = len(re.findall(pattern[0], masked_text, flags=flags))
        if matches > 0:
            redaction_count += matches
            masked_text = re.sub(pattern[0], pattern[1], masked_text, flags=flags)

    return masked_text, redaction_count


def parse_raw_logs(raw_log_str: str) -> List[Dict[str, Any]]:
    """
    Parses unstructured multi-line application log strings or JSON array lines into structured dictionary items.
    """
    lines = raw_log_str.strip().split("\n")
    parsed_logs = []
    
    # Try parsing as whole JSON array first
    try:
        data = json.loads(raw_log_str)
        if isinstance(data, list):
            for entry in data:
                if isinstance(entry, dict):
                    msg = entry.get("message", "")
                    masked_msg, count1 = mask_secrets(msg)
                    st = entry.get("stack_trace", "")
                    masked_st, count2 = mask_secrets(st) if st else ("", 0)
                    
                    parsed_logs.append({
                        "timestamp": entry.get("timestamp", "2026-09-29 00:00:00"),
                        "service_name": entry.get("service_name", "app-service"),
                        "log_level": entry.get("log_level", "ERROR").upper(),
                        "message": masked_msg,
                        "stack_trace": masked_st,
                        "raw_log": mask_secrets(entry.get("raw_log", json.dumps(entry)))[0],
                        "is_masked": (count1 + count2) > 0,
                        "masked_secrets_count": count1 + count2
                    })
            if parsed_logs:
                return parsed_logs
    except Exception:
        pass

    # Line by line log parsing
    current_entry = None
    stack_trace_lines = []

    log_pattern = re.compile(
        r'^(?P<timestamp>\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+'
        r'\[(?P<service>[^\]]+)\]\s+'
        r'(?P<level>INFO|WARN|WARNING|ERROR|FATAL|CRITICAL)\s+'
        r'(?P<message>.*)$', re.IGNORECASE
    )

    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
        
        match = log_pattern.match(line_clean)
        if match:
            if current_entry:
                if stack_trace_lines:
                    current_entry["stack_trace"] = "\n".join(stack_trace_lines)
                parsed_logs.append(current_entry)
                stack_trace_lines = []
            
            groups = match.groupdict()
            msg = groups.get("message", "")
            masked_msg, count = mask_secrets(msg)
            
            level = groups.get("level", "ERROR").upper()
            if level == "WARNING": level = "WARN"

            current_entry = {
                "timestamp": groups.get("timestamp"),
                "service_name": groups.get("service"),
                "log_level": level,
                "message": masked_msg,
                "stack_trace": None,
                "raw_log": mask_secrets(line_clean)[0],
                "is_masked": count > 0,
                "masked_secrets_count": count
            }
        else:
            # Multi-line stack trace appending
            if current_entry:
                stack_trace_lines.append(line_clean)
            else:
                # Fallback line
                masked_line, count = mask_secrets(line_clean)
                current_entry = {
                    "timestamp": "2026-09-29 00:00:00",
                    "service_name": "unknown-service",
                    "log_level": "ERROR",
                    "message": masked_line,
                    "stack_trace": None,
                    "raw_log": masked_line,
                    "is_masked": count > 0,
                    "masked_secrets_count": count
                }

    if current_entry:
        if stack_trace_lines:
            st_text = "\n".join(stack_trace_lines)
            masked_st, st_count = mask_secrets(st_text)
            current_entry["stack_trace"] = masked_st
            current_entry["masked_secrets_count"] += st_count
            current_entry["is_masked"] = current_entry["is_masked"] or (st_count > 0)
        parsed_logs.append(current_entry)

    return parsed_logs


def determine_incident_severity(log_events: List[Dict[str, Any]]) -> Tuple[str, str, str]:
    """
    Determines overall incident title, service name, error type, and severity based on log messages.
    Returns (title, service_name, error_type, severity)
    """
    if not log_events:
        return "Unknown Application Incident", "unknown-service", "UnknownError", "MEDIUM"

    service_names = [e["service_name"] for e in log_events if e.get("service_name")]
    main_service = service_names[0] if service_names else "app-service"

    error_logs = [e for e in log_events if e.get("log_level") in ("ERROR", "FATAL", "CRITICAL")]
    sample_msg = error_logs[0]["message"] if error_logs else log_events[0]["message"]

    # Extract Exception Type if present
    exc_match = re.search(r'([A-Za-z0-9_]+Exception|[A-Za-z0-9_]+Error)', sample_msg)
    error_type = exc_match.group(1) if exc_match else "ApplicationError"

    # Severity Heuristics
    severity = "HIGH"
    msg_lower = (sample_msg + " " + (error_logs[0].get("stack_trace") or "")).lower()

    if any(k in msg_lower for k in ["out of memory", "oom", "connection pool exhausted", "pool exhausted", "deadlock", "fatal"]):
        severity = "CRITICAL"
    elif any(k in msg_lower for k in ["timeout", "connection refused", "500 internal", "failed deployment", "imagepullbackoff"]):
        severity = "HIGH"
    elif any(k in msg_lower for k in ["warning", "degraded", "slow query"]):
        severity = "MEDIUM"

    # Title generation
    if "timeout" in msg_lower or "connection" in msg_lower:
        title = f"{main_service}: Database Connection Timeout"
    elif "memory" in msg_lower or "oom" in msg_lower or "heap" in msg_lower:
        title = f"{main_service}: OutOfMemory Heap Exhaustion"
    elif "deploy" in msg_lower or "imagepull" in msg_lower or "manifest" in msg_lower:
        title = f"{main_service}: Deployment Failure & Container Crash"
    else:
        title = f"{main_service}: {error_type} Incident"

    return title, main_service, error_type, severity
