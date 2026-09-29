import React, { useState, useEffect } from 'react';
import { Incident, LogEvent, Investigation, ActionAuditLog, TroubleshootingStep } from '../../types';
import { api } from '../../services/api';
import { IncidentHeader } from './IncidentHeader';
import { LogViewer } from './LogViewer';
import { InvestigationView } from './InvestigationView';
import { HindsightMemoryPanel } from './HindsightMemoryPanel';
import { TroubleshootingActions } from './TroubleshootingActions';
import { EngineerFeedbackModal } from './EngineerFeedbackModal';
import { FileText, Sparkles, BrainCircuit, ShieldAlert, Loader2 } from 'lucide-react';

interface IncidentDetailViewProps {
  incidentId: string;
  onBack: () => void;
  onRefreshList: () => void;
}

export const IncidentDetailView: React.FC<IncidentDetailViewProps> = ({
  incidentId,
  onBack,
  onRefreshList
}) => {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [actionLogs, setActionLogs] = useState<ActionAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'ai' | 'memory' | 'actions'>('logs');
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const incData = await api.getIncidentById(incidentId);
      setIncident(incData);

      const logData = await api.getIncidentLogs(incidentId);
      setLogs(logData);

      const invData = await api.getInvestigation(incidentId).catch(() => null);
      setInvestigation(invData);

      const actData = await api.getActionLogs(incidentId).catch(() => []);
      setActionLogs(actData);

      if (invData && activeTab === 'logs') {
        setActiveTab('ai');
      }
    } catch (err) {
      console.error('Failed to load incident detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [incidentId]);

  const handleTriggerInvestigation = async () => {
    try {
      setIsInvestigating(true);
      const inv = await api.triggerInvestigation(incidentId);
      setInvestigation(inv);
      setActiveTab('ai');
      // refresh incident status
      const incData = await api.getIncidentById(incidentId);
      setIncident(incData);
    } catch (err) {
      console.error('Investigation failed:', err);
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleExecuteAction = async (step: TroubleshootingStep) => {
    try {
      await api.executeAction(
        incidentId,
        step.action,
        step.risk_level,
        step.target_service,
        { description: step.description }
      );
      const actData = await api.getActionLogs(incidentId);
      setActionLogs(actData);
    } catch (err) {
      console.error('Action request failed:', err);
    }
  };

  const handleApproveAction = async (actionId: number, approved: boolean, approverName?: string, notes?: string) => {
    try {
      await api.approveAction(actionId, approved, approverName, notes);
      const actData = await api.getActionLogs(incidentId);
      setActionLogs(actData);
    } catch (err) {
      console.error('Action approval failed:', err);
    }
  };

  const handleResolveSubmit = async (payload: any) => {
    try {
      await api.resolveIncident(incidentId, payload);
      setShowResolveModal(false);
      await loadData();
      onRefreshList();
    } catch (err) {
      console.error('Failed to resolve incident:', err);
    }
  };

  if (loading || !incident) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-cyan-400 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-xs font-mono">Loading Incident Evidence & Memory Context...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Incident Header */}
      <IncidentHeader
        incident={incident}
        onBack={onBack}
        onTriggerInvestigation={handleTriggerInvestigation}
        onOpenResolveModal={() => setShowResolveModal(true)}
        isInvestigating={isInvestigating}
      />

      {/* Workspace Tabs */}
      <div className="border-b border-slate-800 flex space-x-2">
        
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'logs'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Log Analysis & Masking ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'ai'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>AI Investigation & Evidence</span>
        </button>

        <button
          onClick={() => setActiveTab('memory')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'memory'
              ? 'border-purple-500 text-purple-400 font-bold bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BrainCircuit className="h-4 w-4 text-purple-400" />
          <span>
            Hindsight Memory Precedents
            {investigation?.has_hindsight_match && (
              <span className="ml-1.5 bg-purple-500/30 text-purple-300 text-[9px] px-1.5 py-0.2 rounded font-mono">
                MATCH
              </span>
            )}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'actions'
              ? 'border-amber-500 text-amber-400 font-bold bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          <span>Troubleshooting & Guardrails ({actionLogs.length})</span>
        </button>

      </div>

      {/* Tab Contents */}
      {activeTab === 'logs' && (
        <LogViewer logs={logs} />
      )}

      {activeTab === 'ai' && (
        investigation ? (
          <InvestigationView investigation={investigation} />
        ) : (
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-xl text-center space-y-4">
            <Sparkles className="h-8 w-8 text-cyan-400 mx-auto" />
            <h3 className="text-base font-bold text-white">No AI Investigation Run Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click "Run AI Investigation" to analyze logs, retrieve Hindsight Memory context, and formulate evidence-based root cause hypotheses.
            </p>
            <button
              onClick={handleTriggerInvestigation}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-5 py-2.5 rounded-lg font-medium shadow-md"
            >
              Run AI Investigation
            </button>
          </div>
        )
      )}

      {activeTab === 'memory' && (
        <HindsightMemoryPanel matches={investigation?.matched_memories} />
      )}

      {activeTab === 'actions' && (
        <TroubleshootingActions
          steps={investigation?.troubleshooting_steps || []}
          actionLogs={actionLogs}
          onExecuteAction={handleExecuteAction}
          onApproveAction={handleApproveAction}
        />
      )}

      {/* Engineer Feedback Resolution Modal */}
      <EngineerFeedbackModal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        onSubmit={handleResolveSubmit}
        initialRootCause={investigation?.hypotheses[0]?.title}
        initialResolution={investigation?.recommendations[0]}
      />

    </div>
  );
};
