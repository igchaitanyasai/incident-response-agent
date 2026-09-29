import React from 'react';
import { Shield, Database, Activity, Play, RefreshCw, Cpu, BrainCircuit } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'incidents' | 'memory' | 'demo';
  setActiveTab: (tab: 'dashboard' | 'incidents' | 'memory' | 'demo') => void;
  onQuickTrigger: (scenarioKey: string) => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onQuickTrigger,
  onReset
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/30 text-cyan-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-wide">IncidentSentinel</span>
                <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2 py-0.5 rounded border border-cyan-500/40 font-mono">
                  Hindsight AI
                </span>
              </div>
              <p className="text-xs text-slate-400">Intelligent Incident Response Agent</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('incidents')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'incidents'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>Incidents Workspace</span>
            </button>

            <button
              onClick={() => setActiveTab('memory')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'memory'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BrainCircuit className="h-4 w-4" />
              <span>Hindsight Memory</span>
            </button>

            <button
              onClick={() => setActiveTab('demo')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'demo'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <Play className="h-4 w-4 fill-amber-400" />
              <span>Demo Tour</span>
            </button>
          </nav>

          {/* Quick Actions & Demo Trigger */}
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-md border border-slate-700 flex items-center space-x-2">
                <Play className="h-3.5 w-3.5 text-cyan-400" />
                <span>Simulate Incident</span>
              </button>
              
              <div className="absolute right-0 mt-1 w-56 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 hidden group-hover:block z-50">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Select Demo Scenario
                </div>
                <button
                  onClick={() => onQuickTrigger('db_timeout_1')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>1. DB Timeout (First Time)</span>
                </button>
                <button
                  onClick={() => onQuickTrigger('db_timeout_2')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>2. DB Timeout (Recurring Memory)</span>
                </button>
                <button
                  onClick={() => onQuickTrigger('memory_exhaustion')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>3. OOM Heap Exhaustion</span>
                </button>
                <button
                  onClick={() => onQuickTrigger('failed_deployment')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>4. Deployment Failure</span>
                </button>
              </div>
            </div>

            <button
              onClick={onReset}
              title="Reset Demo Data"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
