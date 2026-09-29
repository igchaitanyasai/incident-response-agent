import React, { useState } from 'react';
import { Incident } from '../types';
import { Search, Filter, Plus, ShieldAlert, CheckCircle2, BrainCircuit, ArrowUpRight } from 'lucide-react';

interface IncidentListProps {
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
  onIngestLogs: (rawLogs: string, title?: string, serviceName?: string) => void;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  onSelectIncident,
  onIngestLogs
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  
  // Custom log modal state
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [customLogsText, setCustomLogsText] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customService, setCustomService] = useState('');

  const filtered = incidents.filter(inc => {
    const matchesSearch =
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.error_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = selectedSeverity === 'ALL' || inc.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'ALL' || inc.status === selectedStatus;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleIngestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLogsText.trim()) return;
    onIngestLogs(customLogsText, customTitle || undefined, customService || undefined);
    setShowIngestModal(false);
    setCustomLogsText('');
    setCustomTitle('');
    setCustomService('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Incident Workspace</h1>
          <p className="text-sm text-slate-400">Filter, ingest, and inspect structured incident evidence</p>
        </div>

        <button
          onClick={() => setShowIngestModal(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs px-4 py-2.5 rounded-lg shadow-md transition-all flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Ingest New Raw Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center gap-4 justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, service, error type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="ALL">ALL SEVERITIES</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="OPEN">OPEN</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
        </div>

      </div>

      {/* Incidents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Incident Title & Error</th>
                <th className="py-3.5 px-4">Affected Service</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Hindsight Context</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No matching incidents found.
                  </td>
                </tr>
              ) : (
                filtered.map(inc => (
                  <tr
                    key={inc.id}
                    onClick={() => onSelectIncident(inc.id)}
                    className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        inc.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        inc.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                          {inc.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Error: {inc.error_type}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-cyan-300">
                      {inc.service_name}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        inc.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        inc.status === 'INVESTIGATING' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' :
                        'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {inc.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {inc.is_recurring ? (
                        <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded border border-purple-500/40 inline-flex items-center space-x-1 font-mono">
                          <BrainCircuit className="h-3 w-3" />
                          <span>Historical Match Found</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">Baseline</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectIncident(inc.id);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs px-3 py-1.5 rounded border border-slate-700 inline-flex items-center space-x-1"
                      >
                        <span>Investigate</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ingest Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Ingest Raw Application Logs</h2>
            <p className="text-xs text-slate-400">
              Paste stack traces or log lines. Secret masker will automatically redact credentials and parse structured events.
            </p>

            <form onSubmit={handleIngestSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Service Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. payment-service"
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Incident Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. DB Connection Failure"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Raw Log Content / Stack Trace</label>
                <textarea
                  rows={8}
                  placeholder={`2026-09-29 10:14:02 [my-service] ERROR com.app.Main - Exception during connection: postgresql://admin:secret123@host:5432/db`}
                  value={customLogsText}
                  onChange={(e) => setCustomLogsText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs rounded-lg p-3 focus:outline-none focus:border-cyan-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-lg font-medium shadow-md"
                >
                  Ingest & Process Logs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
