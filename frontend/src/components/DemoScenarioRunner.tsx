import React, { useState } from 'react';
import { Play, BrainCircuit, CheckCircle2, ArrowRight, Zap, RefreshCw } from 'lucide-react';

interface DemoScenarioRunnerProps {
  onTriggerScenario: (key: string) => Promise<any>;
  onSelectIncident: (id: string) => void;
  onReset: () => void;
}

export const DemoScenarioRunner: React.FC<DemoScenarioRunnerProps> = ({
  onTriggerScenario,
  onSelectIncident,
  onReset
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [step1IncidentId, setStep1IncidentId] = useState<string | null>(null);
  const [step2IncidentId, setStep2IncidentId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleStep1Trigger = async () => {
    try {
      setLoading(true);
      const inc = await onTriggerScenario('db_timeout_1');
      setStep1IncidentId(inc.id);
      setActiveStep(2);
      onSelectIncident(inc.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Trigger = async () => {
    try {
      setLoading(true);
      const inc = await onTriggerScenario('db_timeout_2');
      setStep2IncidentId(inc.id);
      setActiveStep(4);
      onSelectIncident(inc.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 p-6 rounded-xl border border-amber-500/40 space-y-2">
        <div className="flex items-center space-x-2 text-amber-400 font-bold text-lg">
          <Play className="h-5 w-5 fill-amber-400" />
          <span>Interactive Demonstration Walkthrough: Hindsight Memory Recall</span>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          This guided tour demonstrates the exact core requirement: Investigating an incident for the <strong>First Time</strong>, verifying the fix and committing it to <strong>Hindsight Memory</strong>, and then observing how a <strong>Recurring Incident</strong> automatically recalls historical knowledge to recommend the proven resolution.
        </p>
      </div>

      {/* Stepper Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Phase 1 Card */}
        <div className={`p-6 rounded-xl border transition-all ${
          activeStep <= 2
            ? 'bg-slate-900 border-cyan-500/50 shadow-xl'
            : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center border border-cyan-500/40 font-mono text-sm">
              1
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Phase 1: First-Time Incident Investigation</h3>
              <p className="text-xs text-slate-400">Establish Baseline Knowledge in Hindsight Memory</p>
            </div>
          </div>

          <ul className="text-xs text-slate-300 space-y-2 font-mono mb-6">
            <li className="flex items-start space-x-2">
              <span className="text-cyan-400 font-bold">1.</span>
              <span>Ingest Database Timeout logs on <strong>payment-service</strong>.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-cyan-400 font-bold">2.</span>
              <span>Run AI Investigation (System detects 0 prior memory matches).</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-cyan-400 font-bold">3.</span>
              <span>Engineer resolves incident by expanding pool size and commits findings into <strong>Hindsight Memory</strong>.</span>
            </li>
          </ul>

          <button
            onClick={handleStep1Trigger}
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2.5 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span>Launch Phase 1 (First-Time DB Timeout)</span>
          </button>
        </div>

        {/* Phase 2 Card */}
        <div className={`p-6 rounded-xl border transition-all ${
          activeStep >= 3
            ? 'bg-purple-950/20 border-purple-500/60 shadow-xl'
            : 'bg-slate-900/60 border-slate-800 opacity-80'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center border border-purple-500/40 font-mono text-sm">
              2
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Phase 2: Recurring Incident & Memory Recall</h3>
              <p className="text-xs text-purple-300">Observe Hindsight Memory Automatic Recall</p>
            </div>
          </div>

          <ul className="text-xs text-slate-300 space-y-2 font-mono mb-6">
            <li className="flex items-start space-x-2">
              <span className="text-purple-400 font-bold">1.</span>
              <span>Ingest similar Database Timeout logs on <strong>order-service</strong>.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-purple-400 font-bold">2.</span>
              <span>Run AI Investigation: <strong>Hindsight Memory identifies 95% Match!</strong></span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-purple-400 font-bold">3.</span>
              <span>Agent recommends Phase 1's verified fix with past success score!</span>
            </li>
          </ul>

          <button
            onClick={handleStep2Trigger}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <BrainCircuit className="h-4 w-4 text-purple-200" />
            <span>Launch Phase 2 (Recurring DB Timeout)</span>
          </button>
        </div>

      </div>

    </div>
  );
};
