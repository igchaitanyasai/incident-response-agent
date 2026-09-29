import React from 'react';
import { Incident, MemoryStats } from '../types';
import { ShieldAlert, CheckCircle2, BrainCircuit, Activity, ArrowRight, Zap, Database } from 'lucide-react';

interface DashboardOverviewProps {
  incidents: Incident[];
  stats: MemoryStats | null;
  onSelectIncident: (id: string) => void;
  onTriggerDemo: (key: string) => void;
  onGoToMemory: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  incidents,
  stats,
  onSelectIncident,
  onTriggerDemo,
  onGoToMemory
}) => {
  const activeCount = incidents.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED').length;
  const recurringCount = incidents.filter(i => i.is_recurring).length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 p-6 rounded-xl border border-cyan-500/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <h1 className="text-xl font-bold text-white tracking-tight">Hindsight AI Incident Control Center</h1>
          </div>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Real-time incident detection, evidence-backed AI investigation, and persistent historical memory recall for recurring engineering outages.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onTriggerDemo('db_timeout_1')}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs px-4 py-2.5 rounded-lg shadow-md transition-all flex items-center space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span>Launch DB Timeout Scenario</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Incidents</span>
            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 text-red-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{activeCount}</span>
            <span className="text-xs text-slate-400 font-medium">{incidents.length} total recorded</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Resolved Incidents</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{resolvedCount}</span>
            <span className="text-xs text-emerald-400 font-medium">Verified fixes</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Hindsight Memories</span>
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-cyan-400">
              <BrainCircuit className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{stats?.total_memories || 0}</span>
            <span className="text-xs text-cyan-400 font-medium">{stats?.total_retrievals || 0} retrievals</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Recurring Recalls</span>
            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20 text-purple-400">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{recurringCount}</span>
            <span className="text-xs text-purple-400 font-medium">Memory guided</span>
          </div>
        </div>

      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Incidents Panel (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              <span>Recent Application Incidents</span>
            </h2>
            <span className="text-xs text-slate-400">Click any incident to investigate</span>
          </div>

          {incidents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-950/50 rounded-lg border border-slate-800/80">
              <p className="text-sm">No incidents currently recorded.</p>
              <button
                onClick={() => onTriggerDemo('db_timeout_1')}
                className="mt-3 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 px-3 py-1.5 rounded border border-slate-700"
              >
                Simulate First Incident
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {incidents.slice(0, 6).map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => onSelectIncident(inc.id)}
                  className="py-3.5 px-3 -mx-3 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                        inc.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        inc.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {inc.severity}
                      </span>
                      
                      <span className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {inc.title}
                      </span>

                      {inc.is_recurring && (
                        <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded border border-purple-500/40 flex items-center space-x-1 font-mono">
                          <BrainCircuit className="h-3 w-3" />
                          <span>Hindsight Match</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-slate-400 font-mono">
                      <span>Service: <strong className="text-slate-300">{inc.service_name}</strong></span>
                      <span>Logs: <strong className="text-slate-300">{inc.log_count}</strong></span>
                      <span>Error: <strong className="text-slate-300">{inc.error_type}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      inc.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      inc.status === 'INVESTIGATING' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' :
                      'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {inc.status}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hindsight Memory Spotlight (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-bold text-white flex items-center space-x-2">
                <BrainCircuit className="h-5 w-5 text-cyan-400" />
                <span>Hindsight Memory Bank</span>
              </h2>
              <button
                onClick={onGoToMemory}
                className="text-xs text-cyan-400 hover:underline font-medium"
              >
                View All
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Hindsight Persistent Memory stores verified root causes, environmental symptoms, and effective resolution paths across all incident lifecycles.
            </p>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
              <div className="text-xs text-slate-400 uppercase font-mono tracking-wider font-semibold">
                Memory Engine Metrics
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Search Strategy:</span>
                <span className="font-mono text-cyan-400 font-medium">Hybrid Weighted Vector</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Avg Resolution Success:</span>
                <span className="font-mono text-emerald-400 font-medium">
                  {stats?.average_success_rate ? `${Math.round(stats.average_success_rate * 100)}%` : '100%'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Stored Patterns:</span>
                <span className="font-mono text-purple-400 font-medium">{stats?.total_memories || 0} Knowledge Cards</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={() => onTriggerDemo('db_timeout_2')}
              className="w-full bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-500/40 text-xs py-2.5 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
            >
              <BrainCircuit className="h-4 w-4 text-purple-400" />
              <span>Test Hindsight Memory Recall</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
