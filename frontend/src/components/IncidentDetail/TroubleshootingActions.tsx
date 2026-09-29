import React, { useState } from 'react';
import { TroubleshootingStep, ActionAuditLog } from '../../types';
import { ShieldAlert, Play, CheckCircle2, Clock, AlertTriangle, Terminal, Lock, UserCheck } from 'lucide-react';

interface TroubleshootingActionsProps {
  steps: TroubleshootingStep[];
  actionLogs: ActionAuditLog[];
  onExecuteAction: (step: TroubleshootingStep) => void;
  onApproveAction: (actionId: number, approved: boolean, approverName?: string, notes?: string) => void;
}

export const TroubleshootingActions: React.FC<TroubleshootingActionsProps> = ({
  steps,
  actionLogs,
  onExecuteAction,
  onApproveAction
}) => {
  const [selectedPendingAction, setSelectedPendingAction] = useState<ActionAuditLog | null>(null);
  const [approverName, setApproverName] = useState('Lead SRE');
  const [approvalNotes, setApprovalNotes] = useState('');

  const pendingActions = actionLogs.filter(a => a.status === 'PENDING');

  const handleApproveSubmit = (approved: boolean) => {
    if (!selectedPendingAction) return;
    onApproveAction(selectedPendingAction.id, approved, approverName, approvalNotes);
    setSelectedPendingAction(null);
    setApprovalNotes('');
  };

  return (
    <div className="space-y-6">
      
      {/* Pending Authorization Alert */}
      {pendingActions.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/40 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-300">Action Pending Human Approval</h4>
              <p className="text-xs text-slate-300">
                A high-impact operational change requires explicit authorization before execution.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedPendingAction(pendingActions[0])}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition-all"
          >
            Review Ticket #{pendingActions[0].id}
          </button>
        </div>
      )}

      {/* Recommended Steps List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-md font-bold text-white flex items-center space-x-2">
          <ShieldAlert className="h-5 w-5 text-cyan-400" />
          <span>Recommended Troubleshooting & Remediation Steps</span>
        </h3>

        <div className="space-y-4">
          {steps.map((s) => {
            const isHighImpact = s.risk_level === 'HIGH_IMPACT';
            return (
              <div key={s.step} className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="bg-slate-800 text-slate-300 font-mono text-xs px-2.5 py-0.5 rounded font-bold">
                      Step {s.step}
                    </span>

                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      isHighImpact
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {s.risk_level}
                    </span>

                    <span className="text-sm font-bold text-white">{s.action}</span>
                  </div>

                  <p className="text-xs text-slate-400">{s.description}</p>
                </div>

                <button
                  onClick={() => onExecuteAction(s)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium shadow transition-all shrink-0 flex items-center space-x-1.5 ${
                    isHighImpact
                      ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                >
                  {isHighImpact ? <Lock className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{isHighImpact ? 'Request Action Approval' : 'Execute Diagnostic'}</span>
                </button>

              </div>
            );
          })}
        </div>
      </div>

      {/* Action Execution Console Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-white flex items-center space-x-2 font-mono">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span>Action Audit Trail & Output Telemetry ({actionLogs.length})</span>
          </h4>
          <span className="text-[10px] text-slate-500 font-mono">Guardrail Log</span>
        </div>

        <div className="p-4 space-y-3 font-mono text-xs max-h-72 overflow-y-auto">
          {actionLogs.length === 0 ? (
            <div className="text-slate-500 italic text-center py-4">No actions executed for this incident yet.</div>
          ) : (
            actionLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="text-cyan-400 font-bold">#{log.id}</span>
                    <span className="text-white font-semibold">{log.action_name}</span>
                    <span className={`px-2 py-0.5 text-[9px] rounded font-bold ${
                      log.status === 'EXECUTED' ? 'bg-emerald-500/20 text-emerald-400' :
                      log.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                </div>

                {log.result && (
                  <pre className="text-emerald-300 text-[11px] bg-slate-900 p-2.5 rounded border border-slate-800 overflow-x-auto">
                    {JSON.stringify(log.result, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {selectedPendingAction && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <UserCheck className="h-5 w-5" />
              <span>High-Impact Action Authorization Required</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
              <div>Action Name: <strong className="text-white">{selectedPendingAction.action_name}</strong></div>
              <div>Type: <span className="text-amber-400 font-mono">HIGH_IMPACT</span></div>
              <div>Target: <span className="text-cyan-400 font-mono">{(selectedPendingAction.params as any)?.target_service || 'App Service'}</span></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Approver Name</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Approval Notes</label>
                <textarea
                  rows={2}
                  placeholder="Reason for authorizing this change..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => handleApproveSubmit(false)}
                className="px-4 py-2 bg-red-900/40 hover:bg-red-900/70 text-red-300 text-xs rounded-lg border border-red-500/30 font-medium"
              >
                Reject Action
              </button>
              <button
                onClick={() => handleApproveSubmit(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg font-bold shadow"
              >
                Authorize & Execute
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
