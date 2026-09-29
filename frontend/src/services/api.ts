import {
  Incident,
  LogEvent,
  Investigation,
  MemoryEntry,
  MemoryStats,
  ActionAuditLog
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'API request failed');
  }
  return res.json();
}

export const api = {
  // Incidents
  async getIncidents(params?: { status?: string; severity?: string; search?: string }): Promise<Incident[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/incidents?${query}`);
    return handleResponse<Incident[]>(res);
  },

  async getIncidentById(id: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/${id}`);
    return handleResponse<Incident>(res);
  },

  async getIncidentLogs(id: string): Promise<LogEvent[]> {
    const res = await fetch(`${API_BASE}/incidents/${id}/logs`);
    return handleResponse<LogEvent[]>(res);
  },

  async ingestLogs(rawLogs: string, title?: string, serviceName?: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_logs: rawLogs, title, service_name: serviceName })
    });
    return handleResponse<Incident>(res);
  },

  // Investigation
  async triggerInvestigation(incidentId: string): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/investigate`, {
      method: 'POST'
    });
    return handleResponse<Investigation>(res);
  },

  async getInvestigation(incidentId: string): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/investigation`);
    return handleResponse<Investigation>(res);
  },

  // Hindsight Memory
  async getMemories(search?: string): Promise<MemoryEntry[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE}/memory${query}`);
    return handleResponse<MemoryEntry[]>(res);
  },

  async getMemoryStats(): Promise<MemoryStats> {
    const res = await fetch(`${API_BASE}/memory/stats`);
    return handleResponse<MemoryStats>(res);
  },

  // Feedback & Resolution
  async resolveIncident(
    incidentId: string,
    payload: {
      confirmed_root_cause: string;
      verified_resolution: string;
      resolution_steps: string[];
      failed_steps?: string[];
      engineer_rating: number;
      engineer_notes?: string;
      was_ai_helpful: boolean;
    }
  ): Promise<{ incident: Incident; memory_saved: MemoryEntry; message: string }> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<any>(res);
  },

  // Guardrailed Actions
  async executeAction(
    incidentId: string,
    actionName: string,
    actionType: 'READ_ONLY' | 'HIGH_IMPACT' | 'SAFE',
    targetService: string,
    params?: any
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/actions/execute?incident_id=${incidentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action_name: actionName,
        action_type: actionType,
        target_service: targetService,
        params
      })
    });
    return handleResponse<any>(res);
  },

  async approveAction(actionId: number, approved: boolean, approverName = 'Lead SRE', notes?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/actions/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action_id: actionId,
        approved,
        approver_name: approverName,
        notes
      })
    });
    return handleResponse<any>(res);
  },

  async getActionLogs(incidentId: string): Promise<ActionAuditLog[]> {
    const res = await fetch(`${API_BASE}/actions/incident/${incidentId}`);
    return handleResponse<ActionAuditLog[]>(res);
  },

  // Demo Scenarios
  async triggerDemoScenario(scenarioKey: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/demo/trigger/${scenarioKey}`, {
      method: 'POST'
    });
    return handleResponse<Incident>(res);
  },

  async resetDemoDatabase(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/demo/reset`, {
      method: 'POST'
    });
    return handleResponse<{ message: string }>(res);
  }
};
