import React from 'react';
import { Investigation } from '../../types';
import { Sparkles, AlertTriangle, CheckCircle, HelpCircle, ShieldAlert, FileSearch } from 'lucide-react';

interface InvestigationViewProps {
  investigation: Investigation;
}

export const InvestigationView: React.FC<InvestigationViewProps> = ({ investigation }) => {
  return (
    <div className="space-y-6">
      
      {/* Executive Summary Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-bold text-white flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <span>AI Incident Investigation Analysis</span>
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Confidence Rating:</span>
            <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/30">
              {Math.round(investigation.confidence_score * 100)}%
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800 font-sans">
          {investigation.summary}
        </p>

        {/* Safety Disclaimer Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex items-start space-x-3 text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <strong className="font-semibold">Human-in-the-Loop Safety Guardrail:</strong> AI hypotheses below are probabilistic models derived from log telemetry and historical memory. They are not treated as confirmed root causes until validated by an engineer.
          </div>
        </div>
      </div>

      {/* Root Cause Hypotheses List */}
      <div className="space-y-4">
        <h3 className="text-md font-bold text-white flex items-center space-x-2">
          <FileSearch className="h-5 w-5 text-cyan-400" />
          <span>Formulated Root Cause Hypotheses</span>
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {investigation.hypotheses.map((h) => {
            const confPct = Math.round(h.confidence * 100);
            return (
              <div key={h.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 hover:border-slate-700 transition-all">
                
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="bg-cyan-500/20 text-cyan-300 font-mono text-xs px-2 py-0.5 rounded font-bold border border-cyan-500/30">
                        {h.id}
                      </span>
                      <h4 className="text-base font-bold text-white">{h.title}</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{h.description}</p>
                  </div>

                  {/* Confidence Bar */}
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Probability</div>
                    <div className="text-lg font-extrabold text-cyan-400 font-mono">{confPct}%</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  
                  {/* Evidence List */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="text-xs font-semibold text-emerald-400 flex items-center space-x-1 font-mono">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Supporting Evidence</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside font-mono">
                      {h.evidence.map((ev, idx) => (
                        <li key={idx} className="break-all">{ev}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Assumptions List */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="text-xs font-semibold text-amber-400 flex items-center space-x-1 font-mono">
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>Unverified Assumptions</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside font-mono">
                      {h.assumptions.map((asm, idx) => (
                        <li key={idx}>{asm}</li>
                      ))}
                    </ul>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Missing Information Panel */}
      {investigation.missing_information && investigation.missing_information.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <h4 className="text-sm font-bold text-white flex items-center space-x-2">
            <HelpCircle className="h-4 w-4 text-purple-400" />
            <span>Diagnostic Data Requests (Missing Evidence)</span>
          </h4>
          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 font-mono">
            {investigation.missing_information.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
};
