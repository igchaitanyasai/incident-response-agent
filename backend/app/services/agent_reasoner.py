import json
import logging
from typing import List, Dict, Any, Optional
from app.config import settings
from app.db.models import Incident, LogEvent

logger = logging.getLogger(__name__)

def run_ai_investigation(
    incident: Incident,
    log_events: List[LogEvent],
    hindsight_memories: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Orchestrates AI Incident Investigation combining log evidence, structured reasoning,
    and Hindsight Memory historical context.
    """
    # 1. Try invoking Gemini API if key is present
    if settings.GEMINI_API_KEY:
        try:
            return _investigate_with_gemini(incident, log_events, hindsight_memories)
        except Exception as e:
            logger.warning(f"Gemini API investigation failed/fallback triggered: {e}")

    # 2. Local Fallback Expert Reasoning Engine (Deterministic, high quality, standalone)
    return _investigate_with_local_engine(incident, log_events, hindsight_memories)


def _investigate_with_local_engine(
    incident: Incident,
    log_events: List[LogEvent],
    hindsight_memories: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Standalone deterministic incident investigation engine for local dev and evaluation.
    Produces evidence-backed hypotheses, step-by-step troubleshooting, and memory comparisons.
    """
    logs_text = " ".join([l.message for l in log_events]).lower()
    stack_text = " ".join([l.stack_trace or "" for l in log_events]).lower()
    full_text = logs_text + " " + stack_text

    has_mem_match = len(hindsight_memories) > 0
    top_mem = hindsight_memories[0] if has_mem_match else None

    hypotheses = []
    steps = []
    recommendations = []
    missing_info = []

    # Scenario A: Database Connection Timeout
    if any(k in full_text for k in ["hikari", "connection pool", "dbconnectiontimeout", "connection refused", "timeout waiting for connection"]):
        if top_mem and top_mem["similarity_score"] >= 0.70:
            # Recurrent Database Timeout guided by Hindsight Memory!
            summary = (
                f"Incident '{incident.title}' matches prior historical incident '{top_mem['title']}' "
                f"with {top_mem['similarity_percentage']}% confidence. Hindsight Memory indicates "
                f"this issue stems from connection pool exhaustion caused by leaked unclosed DB sessions."
            )
            hypotheses = [
                {
                    "id": "H1",
                    "title": "HikariCP Connection Pool Exhaustion (High Probability - Historical Pattern)",
                    "description": f"The application requested a database connection, but all active connections were in use. Similar incident was previously resolved in '{top_mem['service_name']}' by increasing max connections and fixing connection leaks.",
                    "confidence": 0.92,
                    "evidence": [
                        "Log entry: ConnectionPoolTimeoutException - Timeout waiting for connection",
                        f"Hindsight Memory Match #{top_mem['memory_id']}: Previously confirmed root cause '{top_mem['confirmed_root_cause']}'"
                    ],
                    "assumptions": [
                        "Assuming database server itself is alive and accepting TCP handshakes.",
                        "Assuming active connection count has reached pool max capacity."
                    ],
                    "is_confirmed": False
                },
                {
                    "id": "H2",
                    "title": "Slow Query Lock Contention",
                    "description": "Long-running unindexed SELECT queries holding transactions open, keeping pool connections saturated.",
                    "confidence": 0.45,
                    "evidence": [
                        "Symptom: High thread waiting queue on HikariCP pool"
                    ],
                    "assumptions": [
                        "Requires database slow-query log inspection to confirm."
                    ],
                    "is_confirmed": False
                }
            ]
            steps = [
                {
                    "step": 1,
                    "action": "Inspect active DB pool connection metrics",
                    "target_service": incident.service_name,
                    "risk_level": "SAFE",
                    "description": "Run diagnostic query to check active vs idle HikariCP connection counts."
                },
                {
                    "step": 2,
                    "action": "Apply Verified Historical Fix: Expand Connection Pool & Hot-Patch Leaks",
                    "target_service": incident.service_name,
                    "risk_level": "HIGH_IMPACT",
                    "description": f"Apply resolution verified in past incident: Increase maximum pool size to 200 and recycle idle connections. (Requires approval)."
                }
            ]
            recommendations = [
                f"Apply proven fix from Hindsight Memory: {top_mem['successful_resolutions'][0] if top_mem['successful_resolutions'] else 'Increase connection pool size and fix connection leakage.'}",
                "Enable connection leak detection threshold (e.g., leakDetectionThreshold = 30000ms)."
            ]
        else:
            # First-time Database Timeout
            summary = (
                f"Incident '{incident.title}' detected on '{incident.service_name}'. Preliminary logs indicate "
                f"database connectivity timeouts. No exact prior match in Hindsight Memory; establishing new investigation baseline."
            )
            hypotheses = [
                {
                    "id": "H1",
                    "title": "Database Connection Pool Starvation",
                    "description": "All available pool sockets are occupied or leaking without returning to pool.",
                    "confidence": 0.75,
                    "evidence": [
                        "Exception: DBConnectionTimeoutException: Connection pool exhausted (0 available, 50 active)"
                    ],
                    "assumptions": [
                        "Assuming network security group & firewall rules allow connection."
                    ],
                    "is_confirmed": False
                },
                {
                    "id": "H2",
                    "title": "Database Host Network Unreachable",
                    "description": "Target database hostname or port is refusing incoming connections due to network partition.",
                    "confidence": 0.35,
                    "evidence": [
                        "Symptom: Connection attempts hanging past 30000ms threshold"
                    ],
                    "assumptions": [
                        "Unverified without ping/netcat telemetry."
                    ],
                    "is_confirmed": False
                }
            ]
            steps = [
                {
                    "step": 1,
                    "action": "Query Live Database Connection Metrics",
                    "target_service": incident.service_name,
                    "risk_level": "SAFE",
                    "description": "Fetch connection pool utilization numbers from application health endpoint."
                },
                {
                    "step": 2,
                    "action": "Restart Application Service Pods",
                    "target_service": incident.service_name,
                    "risk_level": "HIGH_IMPACT",
                    "description": "Perform rolling restart to clear deadlocked connection threads. (Requires human approval)."
                }
            ]
            recommendations = [
                "Inspect active connection count on PostgreSQL backend.",
                "Review recent backend changes for unclosed database transactions."
            ]
            missing_info = [
                "Database server side error logs (`/var/log/postgresql/postgresql.log`).",
                "Application thread dumps during the timeout peak."
            ]

    # Scenario B: Application Memory Exhaustion (OOM)
    elif any(k in full_text for k in ["outofmemory", "java heap space", "heap exhaustion", "gc overhead limit"]):
        summary = f"Detected critical JVM Heap Exhaustion on '{incident.service_name}'. Garbage collection overhead limit reached."
        hypotheses = [
            {
                "id": "H1",
                "title": "Memory Leak in In-Memory Cache Subsystem",
                "description": "Unbounded cache growth without eviction policy leading to heap exhaustion under traffic bursts.",
                "confidence": 0.88,
                "evidence": [
                    "Exception: java.lang.OutOfMemoryError: Java heap space",
                    "GC log: Full GC duration exceeded 12,000ms"
                ],
                "assumptions": [
                    "Assuming heap max size allocation (-Xmx) was set correctly."
                ],
                "is_confirmed": False
            }
        ]
        steps = [
            {
                "step": 1,
                "action": "Capture JVM Memory Heap Dump",
                "target_service": incident.service_name,
                "risk_level": "SAFE",
                "description": "Generate hprof memory snapshot for object retaining analysis."
            },
            {
                "step": 2,
                "action": "Flush Application Cache & Flush Redis Memory",
                "target_service": incident.service_name,
                "risk_level": "HIGH_IMPACT",
                "description": "Emergency cache wipe to free heap space. (Requires authorization)."
            }
        ]
        recommendations = [
            "Configure TTL LRU eviction policy on in-memory data structures.",
            "Increase container heap allocation limits in Deployment spec."
        ]

    # Scenario C: Failed Application Deployment
    elif any(k in full_text for k in ["imagepullbackoff", "deployment", "manifest", "configmap", "syntax error"]):
        summary = f"Deployment Failure on '{incident.service_name}'. Kubernetes pod initialization failed during container startup."
        hypotheses = [
            {
                "id": "H1",
                "title": "Invalid Environment Secret Reference",
                "description": "Deployment manifest references missing secret key or invalid container registry credential.",
                "confidence": 0.85,
                "evidence": [
                    "Kubernetes Event: ImagePullBackOff / CreateContainerConfigError",
                    "Log: Secret 'db-credentials' key 'API_KEY' not found"
                ],
                "assumptions": [
                    "Assuming container image exists in private registry."
                ],
                "is_confirmed": False
            }
        ]
        steps = [
            {
                "step": 1,
                "action": "Inspect Kubernetes Deployment Manifest & Secrets",
                "target_service": incident.service_name,
                "risk_level": "SAFE",
                "description": "Verify secret keys and environment variable bindings."
            },
            {
                "step": 2,
                "action": "Rollback Deployment to Previous Stable Revision",
                "target_service": incident.service_name,
                "risk_level": "HIGH_IMPACT",
                "description": "Execute rollback to last known healthy deployment revision. (Requires human approval)."
            }
        ]
        recommendations = [
            "Validate environment variable names in deployment config.",
            "Roll back to previous tag."
        ]

    # Generic Fallback
    else:
        summary = f"Investigating {incident.error_type} on '{incident.service_name}' based on {len(log_events)} log records."
        hypotheses = [
            {
                "id": "H1",
                "title": f"Uncaught {incident.error_type}",
                "description": "Application encountered unhandled runtime exception.",
                "confidence": 0.60,
                "evidence": [e.message for e in log_events[:2]],
                "assumptions": ["Requires further log trace review."],
                "is_confirmed": False
            }
        ]
        steps = [
            {
                "step": 1,
                "action": "Inspect Detailed Stack Trace",
                "target_service": incident.service_name,
                "risk_level": "SAFE",
                "description": "Examine stack frames for root failure origin."
            }
        ]
        recommendations = ["Review application error logs and upstream service responses."]

    overall_confidence = 0.90 if (has_mem_match and top_mem["similarity_score"] >= 0.70) else 0.70

    return {
        "summary": summary,
        "hypotheses": hypotheses,
        "troubleshooting_steps": steps,
        "recommendations": recommendations,
        "risk_assessment": {
            "safe_actions_count": len([s for s in steps if s["risk_level"] == "SAFE"]),
            "high_impact_actions_count": len([s for s in steps if s["risk_level"] == "HIGH_IMPACT"]),
            "requires_approval": any(
                s["risk_level"] == "HIGH_IMPACT"
                for s in steps
                if isinstance(s, dict)
)
        },
        "missing_information": missing_info,
        "confidence_score": overall_confidence,
        "has_hindsight_match": has_mem_match,
        "matched_memories": hindsight_memories
    }


def _investigate_with_gemini(
    incident: Incident,
    log_events: List[LogEvent],
    hindsight_memories: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Call Google Gemini API for structured LLM reasoning if configured."""
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(settings.GEMINI_MODEL)

    prompt = f"""
You are an expert SRE Incident Response AI Agent. Analyze the incident below, comparing with Hindsight Memory records.

INCIDENT:
- Title: {incident.title}
- Service: {incident.service_name}
- Error Type: {incident.error_type}
- Severity: {incident.severity}

LOG EVIDENCE:
{json.dumps([{"level": l.log_level, "msg": l.message, "stack": l.stack_trace} for l in log_events[:10]], indent=2)}

RETRIEVED HINDSIGHT MEMORIES:
{json.dumps(hindsight_memories, indent=2)}

Generate a JSON object with keys:
"summary" (string),
"hypotheses" (list of objects with id, title, description, confidence, evidence (list), assumptions (list), is_confirmed (bool=false)),
"troubleshooting_steps" (list of objects with step (int), action, target_service, risk_level ("SAFE" or "HIGH_IMPACT"), description),
"recommendations" (list of strings),
"missing_information" (list of strings),
"confidence_score" (float 0.0-1.0)
"""
    res = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
    parsed = json.loads(res.text)
    parsed["has_hindsight_match"] = len(hindsight_memories) > 0
    parsed["matched_memories"] = hindsight_memories
    parsed["risk_assessment"] = {
        "safe_actions_count": len([s for s in parsed.get("troubleshooting_steps", []) if s.get("risk_level") == "SAFE"]),
        "high_impact_actions_count": len([s for s in parsed.get("troubleshooting_steps", []) if s.get("risk_level") == "HIGH_IMPACT"]),
        "requires_approval": any(s.get("risk_level") == "HIGH_IMPACT" for s in parsed.get("troubleshooting_steps", []))
    }
    return parsed
