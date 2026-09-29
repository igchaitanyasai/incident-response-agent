import math
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import MemoryEntry, Incident

def calculate_text_similarity(text1: str, text2: str) -> float:
    """Calculates Jaccard word-level similarity between two text strings."""
    if not text1 or not text2:
        return 0.0
    words1 = set(re.findall(r'\w+', text1.lower()))
    words2 = set(re.findall(r'\w+', text2.lower()))
    if not words1 or not words2:
        return 0.0
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / len(union)

def search_hindsight_memories(
    db: Session,
    service_name: str,
    error_type: str,
    symptoms: List[str],
    min_score_threshold: float = 0.35
) -> List[Dict[str, Any]]:
    """
    Retrieves historical memories selectively based on error signature, symptoms, and service context.
    Calculates weighted similarity score and returns list of matched memory dictionaries.
    """
    try:
        all_memories = db.query(MemoryEntry).all()
        if not all_memories:
            return []
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Hindsight Memory retrieval failed gracefully: {e}")
        return []

    combined_symptoms_query = " ".join(symptoms).lower()
    matched_results = []

    for mem in all_memories:
        # 1. Error pattern similarity (35%)
        err_sim = calculate_text_similarity(error_type, mem.error_pattern)
        if error_type.lower() in mem.error_pattern.lower() or mem.error_pattern.lower() in error_type.lower():
            err_sim = max(err_sim, 0.85)

        # 2. Symptom similarity (40%)
        mem_symptoms_str = " ".join(mem.symptoms or []).lower()
        symptom_sim = calculate_text_similarity(combined_symptoms_query, mem_symptoms_str)
        
        # Check specific key phrase overlays (e.g. connection timeout, max connections, heap space, OOM)
        key_phrases = ["timeout", "connection pool", "heap space", "memory", "out of memory", "deployment", "imagepull"]
        for phrase in key_phrases:
            if phrase in combined_symptoms_query and phrase in mem_symptoms_str:
                symptom_sim = max(symptom_sim, 0.80)

        # 3. Service matching (15%)
        service_sim = 1.0 if mem.service_name.lower() == service_name.lower() else 0.4

        # 4. Historical success & decay factor (10%)
        success_factor = mem.success_rate

        # Composite Weighted Score
        final_score = (err_sim * 0.35) + (symptom_sim * 0.40) + (service_sim * 0.15) + (success_factor * 0.10)

        if final_score >= min_score_threshold:
            # Increment retrieval count for metrics tracking
            mem.retrieval_count += 1
            db.commit()

            matched_results.append({
                "memory_id": mem.id,
                "title": mem.title,
                "service_name": mem.service_name,
                "error_pattern": mem.error_pattern,
                "symptoms": mem.symptoms,
                "confirmed_root_cause": mem.confirmed_root_cause,
                "successful_resolutions": mem.successful_resolutions,
                "failed_resolutions": mem.failed_resolutions or [],
                "engineer_feedback": mem.engineer_feedback,
                "outcome_status": mem.outcome_status,
                "similarity_score": round(final_score, 3),
                "similarity_percentage": int(round(final_score * 100)),
                "match_reasons": [
                    f"Error pattern match: {int(err_sim*100)}%",
                    f"Symptom overlap: {int(symptom_sim*100)}%",
                    f"Service context match: {'Exact' if mem.service_name.lower() == service_name.lower() else 'Similar architecture'}"
                ],
                "retrieval_count": mem.retrieval_count,
                "created_at": mem.created_at.isoformat() if mem.created_at else None
            })

    # Sort descending by similarity score
    matched_results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return matched_results


def store_hindsight_memory(
    db: Session,
    incident: Incident,
    confirmed_root_cause: str,
    verified_resolution: str,
    resolution_steps: List[str],
    failed_steps: Optional[List[str]] = None,
    engineer_feedback: Optional[Dict[str, Any]] = None
) -> MemoryEntry:
    """
    Creates or updates a persistent memory entry in Hindsight Memory store.
    """
    # Check if a memory already exists for this exact incident or similar pattern
    existing_mem = db.query(MemoryEntry).filter(
        MemoryEntry.service_name == incident.service_name,
        MemoryEntry.error_pattern == incident.error_type
    ).first()

    symptoms_list = [incident.title]
    if incident.logs:
        symptoms_list.extend([l.message for l in incident.logs[:5]])

    if existing_mem:
        # Evolve existing memory with newly verified findings
        existing_mem.confirmed_root_cause = confirmed_root_cause
        existing_mem.successful_resolutions = list(set(existing_mem.successful_resolutions + resolution_steps))
        if failed_steps:
            existing_mem.failed_resolutions = list(set((existing_mem.failed_resolutions or []) + failed_steps))
        existing_mem.engineer_feedback = engineer_feedback
        existing_mem.outcome_status = "RESOLVED"
        existing_mem.success_rate = min(1.0, existing_mem.success_rate + 0.05)
        db.commit()
        db.refresh(existing_mem)
        return existing_mem
    else:
        new_memory = MemoryEntry(
            incident_id=incident.id,
            title=f"Memory: {incident.title}",
            service_name=incident.service_name,
            error_pattern=incident.error_type,
            symptoms=symptoms_list,
            environmental_details={
                "severity": incident.severity,
                "service": incident.service_name,
                "initial_status": incident.status
            },
            confirmed_root_cause=confirmed_root_cause,
            successful_resolutions=resolution_steps if resolution_steps else [verified_resolution],
            failed_resolutions=failed_steps or [],
            engineer_feedback=engineer_feedback or {"was_ai_helpful": True},
            outcome_status="RESOLVED",
            retrieval_count=0,
            success_rate=1.0
        )
        db.add(new_memory)
        db.commit()
        db.refresh(new_memory)
        return new_memory
