import React, { useState } from 'react';
import { LogEvent } from '../../types';
import { ShieldCheck, FileText, ChevronDown, ChevronRight, Lock } from 'lucide-react';

interface LogViewerProps {
  logs: LogEvent[];
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const [expandedTraceId, setExpandedTraceId] = useState<number | null>(null);
  const totalMaskedSecrets = logs.reduce((acc, l) => acc + (l.masked_secrets_count || 0), 0);

  return (
    <div className="space-y-4">
      
      {/* Secret Redaction Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Secret & Credential Masking Engine</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono">
                Active
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Database connection strings, API tokens, passwords, and JWT credentials are automatically redacted before processing or storage.
            </p>
          </div>
        </div>

        <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 text-center font-mono">
          <div className="text-xs text-slate-400">Secrets Redacted</div>
          <div className="text-lg font-bold text-emerald-400 flex items-center justify-center space-x-1">
            <Lock className="h-4 w-4" />
            <span>{totalMaskedSecrets}</span>
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            <span>Ingested Log Records ({logs.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Normalized & Sanitized</span>
        </div>

        <div className="divide-y divide-slate-800 font-mono text-xs">
          {logs.map((log) => {
            const isExpanded = expandedTraceId === log.id;
            return (
              <div key={log.id} className="p-4 hover:bg-slate-850/60 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  
                  <div className="flex items-center space-x-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      log.log_level === 'FATAL' || log.log_level === 'ERROR' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      log.log_level === 'WARN' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {log.log_level}
                    </span>

                    <span className="text-slate-400 text-[11px]">{log.timestamp}</span>
                    <span className="text-cyan-400 font-semibold">[{log.service_name}]</span>
                  </div>

                  {log.is_masked && (
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 flex items-center space-x-1">
                      <Lock className="h-3 w-3" />
                      <span>{log.masked_secrets_count} Masked</span>
                    </span>
                  )}
                </div>

                <div className="mt-2 text-slate-200 break-all font-mono leading-relaxed">
                  {log.message}
                </div>

                {log.stack_trace && (
                  <div className="mt-3">
                    <button
                      onClick={() => setExpandedTraceId(isExpanded ? null : log.id)}
                      className="text-xs text-cyan-400 hover:underline flex items-center space-x-1"
                    >
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      <span>{isExpanded ? 'Hide Stack Trace' : 'View Stack Trace'}</span>
                    </button>

                    {isExpanded && (
                      <pre className="mt-2 p-3 bg-slate-950 rounded-lg border border-slate-800 text-red-300/90 text-[11px] overflow-x-auto whitespace-pre-wrap font-mono leading-tight">
                        {log.stack_trace}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
