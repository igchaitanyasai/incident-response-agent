export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'UNRESOLVED' | 'CLOSED';
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Incident {
  id: string;
  title: string;
  service_name: string;
  error_type: string;
  status: IncidentStatus;
  severity: SeverityLevel;
  created_at: string;
  updated_at: string;
  confirmed_root_cause?: string;
  verified_resolution?: string;
  engineer_notes?: string;
  is_recurring: boolean;
  matched_memory_id?: string;
  log_count?: number;
}

export interface LogEvent {
  id: number;
  incident_id: string;
  timestamp: string;
  service_name: string;
  log_level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  stack_trace?: string;
  raw_log: string;
  is_masked: boolean;
  masked_secrets_count: number;
}

export interface Hypothesis {
  id: string;
  title: string;
  description: string;
  confidence: number;
  evidence: string[];
  assumptions: string[];
  is_confirmed: boolean;
}

export interface TroubleshootingStep {
  step: number;
  action: string;
  target_service: string;
  risk_level: 'SAFE' | 'HIGH_IMPACT';
  description: string;
}

export interface Investigation {
  id: number;
  incident_id: string;
  summary: string;
  hypotheses: Hypothesis[];
  troubleshooting_steps: TroubleshootingStep[];
  recommendations: string[];
  risk_assessment: {
    safe_actions_count: number;
    high_impact_actions_count: number;
    requires_approval: boolean;
  };
  missing_information?: string[];
  confidence_score: number;
  has_hindsight_match: boolean;
  matched_memories?: HindsightMatch[];
  created_at: string;
}

export interface HindsightMatch {
  memory_id: string;
  title: string;
  service_name: string;
  error_pattern: string;
  symptoms: string[];
  confirmed_root_cause: string;
  successful_resolutions: string[];
  failed_resolutions?: string[];
  engineer_feedback?: any;
  outcome_status: string;
  similarity_score: number;
  similarity_percentage: number;
  match_reasons: string[];
  retrieval_count: number;
  created_at?: string;
}

export interface MemoryEntry {
  id: string;
  incident_id?: string;
  title: string;
  service_name: string;
  error_pattern: string;
  symptoms: string[];
  environmental_details: Record<string, any>;
  confirmed_root_cause: string;
  successful_resolutions: string[];
  failed_resolutions?: string[];
  engineer_feedback?: Record<string, any>;
  outcome_status: string;
  retrieval_count: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
}

export interface MemoryStats {
  total_memories: number;
  total_retrievals: number;
  resolved_memories_count: number;
  average_success_rate: number;
  system_status: string;
  vector_search_engine: string;
}

export interface ActionAuditLog {
  id: number;
  incident_id: string;
  action_name: string;
  action_type: 'READ_ONLY' | 'HIGH_IMPACT' | 'SAFE';
  requires_approval: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'FAILED';
  executed_by: string;
  params?: Record<string, any>;
  result?: Record<string, any>;
  timestamp: string;
}
