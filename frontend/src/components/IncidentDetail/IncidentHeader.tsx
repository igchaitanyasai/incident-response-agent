import React from 'react';
import { Incident } from '../../types';
import { ArrowLeft, Sparkles, CheckCircle2, BrainCircuit, ShieldAlert, Cpu } from 'lucide-react';

interface IncidentHeaderProps {
  incident: Incident;
  onBack: () => void;
  onTriggerInvestigation: () => void;
  onOpenResolveModal: () => void;
  isInvestigating: boolean;
}

export const IncidentHeader: React.FC<IncidentHeaderProps> = ({
  incident,
  onBack,
  onTriggerInvestigation,
  onOpenResolveModal,
  isInvestigating
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 shadow-lg">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        <div className="space-y-2">
          <button
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 mb-2 font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Incidents</span>
          </button>

          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-white tracking-tight">{incident.title}</h1>
            
            {incident.is_recurring && (
              <span className="bg-purple-500/20 text-purple-300 text-xs px-2.5 py-1 rounded-md border border-purple-500/40 flex items-center space-x-1 font-mono">
                <BrainCircuit className="h-3.5 w-3.5" />
                <span>Hindsight Recalled</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
            <span>Service: <strong className="text-cyan-300">{incident.service_name}</strong></span>
            <span>•</span>
            <span>Error: <strong className="text-slate-200">{incident.error_type}</strong></span>
            <span>•</span>
            <span>ID: <strong className="text-slate-400">{incident.id.substring(0, 8)}</strong></span>
          </div>
        </div>

        {/* Action Badges & Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-3 py-1 rounded-md font-mono font-bold ${
              incident.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              incident.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {incident.severity}
            </span>

            <span className={`text-xs px-3 py-1 rounded-md font-medium ${
              incident.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
              incident.status === 'INVESTIGATING' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' :
              'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              {incident.status}
            </span>
          </div>

          {incident.status !== 'RESOLVED' && (
            <>
              <button
                onClick={onTriggerInvestigation}
                disabled={isInvestigating}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-md transition-all flex items-center space-x-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isInvestigating ? 'Investigating...' : 'Run AI Investigation'}</span>
              </button>

              <button
                onClick={onOpenResolveModal}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-md transition-all flex items-center space-x-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Resolve & Store Memory</span>
              </button>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
