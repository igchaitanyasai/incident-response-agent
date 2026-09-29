import React from 'react';
import { HindsightMatch } from '../../types';
import { BrainCircuit, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Sparkles, Layers } from 'lucide-react';

interface HindsightMemoryPanelProps {
  matches?: HindsightMatch[];
}

export const HindsightMemoryPanel: React.FC<HindsightMemoryPanelProps> = ({ matches }) => {
  if (!matches || matches.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center space-y-3">
        <div className="p-3 bg-slate-800 text-slate-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
          <BrainCircuit className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white">No Hindsight Memory Precedent Found</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          This incident represents a novel error pattern. Upon engineer resolution, verified findings will be committed into Hindsight Persistent Memory for future automated recall.
        </p>
      </div>
    );
  }

  const topMatch = matches[0];

  return (
    <div className="space-y-6">
      
      {/* Top Match Spotlight */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/40 p-6 rounded-xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-purple-500/20 text-purple-300 font-mono text-xs px-2.5 py-0.5 rounded font-bold border border-purple-500/40 flex items-center space-x-1">
                <BrainCircuit className="h-3.5 w-3.5" />
                <span>Hindsight Memory Recall</span>
              </span>
              <span className="text-xs text-slate-400">Match ID #{topMatch.memory_id.substring(0, 8)}</span>
            </div>
            <h3 className="text-lg font-bold text-white">{topMatch.title}</h3>
          </div>

          <div className="text-right bg-slate-950 px-4 py-2 rounded-lg border border-purple-500/30">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Similarity Score</div>
            <div className="text-2xl font-black text-purple-300 font-mono">
              {topMatch.similarity_percentage}%
            </div>
          </div>
        </div>

        {/* Match Reasons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {topMatch.match_reasons.map((reason, idx) => (
            <span key={idx} className="bg-slate-950 text-slate-300 text-xs px-3 py-1 rounded-md border border-slate-800 font-mono">
              ✓ {reason}
            </span>
          ))}
        </div>
      </div>

      {/* Historical Findings Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Confirmed Historical Root Cause */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Historically Confirmed Root Cause</span>
          </h4>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
            {topMatch.confirmed_root_cause}
          </div>
        </div>

        {/* Verified Resolution Steps */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-cyan-400" />
            <span>Verified Successful Fixes</span>
          </h4>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
            <ul className="space-y-1.5 text-xs text-slate-200 font-mono">
              {topMatch.successful_resolutions.map((res, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{res}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
};
