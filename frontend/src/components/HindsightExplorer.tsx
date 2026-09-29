import React, { useState, useEffect } from 'react';
import { MemoryEntry, MemoryStats } from '../types';
import { api } from '../services/api';
import { BrainCircuit, Search, CheckCircle2, RefreshCw, Activity, Sparkles, Layers } from 'lucide-react';

export const HindsightExplorer: React.FC = () => {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadMemoryData = async () => {
    try {
      setLoading(true);
      const mems = await api.getMemories(searchTerm);
      setMemories(mems);
      const st = await api.getMemoryStats();
      setStats(st);
    } catch (err) {
      console.error('Failed to load memory bank:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemoryData();
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 p-6 rounded-xl border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BrainCircuit className="h-6 w-6 text-purple-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Hindsight Persistent Memory Explorer</h1>
          </div>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Knowledge repository of confirmed incident root causes, environmental signatures, and verified resolutions retained across all production outages.
          </p>
        </div>

        <button
          onClick={loadMemoryData}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg border border-purple-500/30 text-xs flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Memory Bank</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 uppercase font-mono">Total Persistent Memory Cards</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">{stats?.total_memories || 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 uppercase font-mono">Total Memory Retrievals</div>
          <div className="text-2xl font-bold text-purple-400 mt-1 font-mono">{stats?.total_retrievals || 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 uppercase font-mono">Average Resolution Success Rate</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
            {stats?.average_success_rate ? `${Math.round(stats.average_success_rate * 100)}%` : '100%'}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search memory entries by title, service, error pattern, or root cause..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Memory Cards Grid */}
      {memories.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center space-y-3">
          <BrainCircuit className="h-8 w-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Persistent Memories Found</h3>
          <p className="text-xs text-slate-400">
            Resolve an incident and submit engineer feedback to store knowledge into Hindsight Memory.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {memories.map((mem) => (
            <div key={mem.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 hover:border-purple-500/40 transition-all shadow-lg">
              
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold border border-purple-500/40">
                      {mem.service_name}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Pattern: {mem.error_pattern}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{mem.title}</h3>
                </div>

                <div className="text-right shrink-0">
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded font-mono font-bold">
                    {mem.retrieval_count} Recalls
                  </span>
                </div>
              </div>

              {/* Confirmed Root Cause */}
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">
                  Confirmed Root Cause
                </div>
                <p className="text-xs text-slate-200 font-sans">{mem.confirmed_root_cause}</p>
              </div>

              {/* Verified Resolutions */}
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] text-emerald-400 uppercase font-mono tracking-wider font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Verified Successful Resolutions</span>
                </div>
                <ul className="text-xs text-slate-300 list-disc list-inside space-y-1 font-mono">
                  {mem.successful_resolutions.map((res, idx) => (
                    <li key={idx}>{res}</li>
                  ))}
                </ul>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
