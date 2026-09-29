import React, { useState, useEffect } from 'react';
import { Incident, MemoryStats } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { IncidentList } from './components/IncidentList';
import { HindsightExplorer } from './components/HindsightExplorer';
import { DemoScenarioRunner } from './components/DemoScenarioRunner';
import { IncidentDetailView } from './components/IncidentDetail/IncidentDetailView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'incidents' | 'memory' | 'demo'>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const incList = await api.getIncidents();
      setIncidents(incList);

      const stats = await api.getMemoryStats();
      setMemoryStats(stats);
    } catch (err) {
      console.error('Failed to load system state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSelectIncident = (id: string) => {
    setSelectedIncidentId(id);
  };

  const handleQuickTrigger = async (scenarioKey: string) => {
    try {
      const inc = await api.triggerDemoScenario(scenarioKey);
      await loadAllData();
      setSelectedIncidentId(inc.id);
    } catch (err) {
      console.error('Demo trigger failed:', err);
    }
  };

  const handleIngestLogs = async (rawLogs: string, title?: string, serviceName?: string) => {
    try {
      const inc = await api.ingestLogs(rawLogs, title, serviceName);
      await loadAllData();
      setSelectedIncidentId(inc.id);
    } catch (err) {
      console.error('Ingest failed:', err);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Reset all incidents and Hindsight memories to seed state?')) {
      await api.resetDemoDatabase();
      setSelectedIncidentId(null);
      await loadAllData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedIncidentId(null);
        }}
        onQuickTrigger={handleQuickTrigger}
        onReset={handleResetData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedIncidentId ? (
          <IncidentDetailView
            incidentId={selectedIncidentId}
            onBack={() => setSelectedIncidentId(null)}
            onRefreshList={loadAllData}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardOverview
                incidents={incidents}
                stats={memoryStats}
                onSelectIncident={handleSelectIncident}
                onTriggerDemo={handleQuickTrigger}
                onGoToMemory={() => setActiveTab('memory')}
              />
            )}

            {activeTab === 'incidents' && (
              <IncidentList
                incidents={incidents}
                onSelectIncident={handleSelectIncident}
                onIngestLogs={handleIngestLogs}
              />
            )}

            {activeTab === 'memory' && (
              <HindsightExplorer />
            )}

            {activeTab === 'demo' && (
              <DemoScenarioRunner
                onTriggerScenario={api.triggerDemoScenario}
                onSelectIncident={handleSelectIncident}
                onReset={handleResetData}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>Intelligent Incident Response Agent with Hindsight Persistent Memory</div>
          <div>Python FastAPI • React 18 TypeScript • SQLite/PostgreSQL</div>
        </div>
      </footer>

    </div>
  );
};
