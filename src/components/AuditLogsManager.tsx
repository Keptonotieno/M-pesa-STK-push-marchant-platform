import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  RefreshCw,
  Lock,
  Sliders,
  CreditCard,
  User,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Plus,
  Terminal,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AuditLog } from '../types';

interface Props {
  business: any;
  auditLogs?: AuditLog[];
}

export const AuditLogsManager: React.FC<Props> = ({ business }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, [business?.id]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAuditLogs(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, business?.id]);

  const fetchAuditLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/audit-logs', {
        headers: { 'x-business-id': business?.id || 'biz-001' },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      } else if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSimulateLog = async (category: string) => {
    setSimulating(true);
    try {
      await fetch('/api/audit-logs/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': business?.id || 'biz-001',
        },
        body: JSON.stringify({ category }),
      });
      await fetchAuditLogs(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Category', 'Action', 'Actor Name', 'Actor Role', 'Details', 'IP Address', 'Status'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.category || 'GENERAL'}"`,
      `"${l.action}"`,
      `"${l.actorName}"`,
      `"${l.actorRole}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.ipAddress}"`,
      `"${l.status || 'SUCCESS'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pesarequest_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (logs.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(filteredLogs, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `pesarequest_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering
  const filteredLogs = logs.filter((log) => {
    const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || (log.status || 'SUCCESS') === statusFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.ipAddress.toLowerCase().includes(q) ||
      (log.category && log.category.toLowerCase().includes(q));

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'LOGIN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 font-mono">🔐 LOGIN</span>;
      case 'CONFIG':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono">⚙️ CONFIG</span>;
      case 'PAYMENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono">💳 PAYMENT</span>;
      case 'API_REQUEST':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono">⚡ API</span>;
      case 'USER_ACTIVITY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-mono">👤 USER</span>;
      case 'SECURITY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono">🛡️ SECURITY</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">SYSTEM</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-white">Security & Audit Event Logging</h3>
              <p className="text-xs text-slate-400">Immutable ledger of logins, configuration changes, payments, API requests & user activities</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse' : ''}`} />
            <span>{autoRefresh ? 'Live Streaming' : 'Enable Live Stream'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export SIEM JSON</span>
          </button>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by action, actor, IP address, or details..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="ALL">All Event Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILED">Failed / Security Alerts</option>
          </select>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={() => fetchAuditLogs()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'All Categories' },
            { id: 'LOGIN', label: '🔐 Logins' },
            { id: 'CONFIG', label: '⚙️ Config Changes' },
            { id: 'PAYMENT', label: '💳 Payment Events' },
            { id: 'API_REQUEST', label: '⚡ API Requests' },
            { id: 'USER_ACTIVITY', label: '👤 User Activities' },
            { id: 'SECURITY', label: '🛡️ Security Alerts' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Actor / Role</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">IP & Device</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                    Loading audit trail from secure ledger...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/60 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">{getCategoryBadge(log.category)}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-mono">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{log.actorName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.actorRole}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      <div>{log.ipAddress}</div>
                      {log.status === 'FAILED' && (
                        <span className="text-[10px] text-rose-500 font-bold">FAILED</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                        title="View complete audit record"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulator bar for testing live logging */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold">
          <Terminal className="w-4 h-4 text-indigo-500" />
          <span>Simulate Real-Time Audit Actions:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleSimulateLog('LOGIN')}
            disabled={simulating}
            className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500 text-purple-600 hover:text-white dark:text-purple-300 font-bold transition cursor-pointer disabled:opacity-50"
          >
            + Simulate User Login
          </button>
          <button
            type="button"
            onClick={() => handleSimulateLog('CONFIG')}
            disabled={simulating}
            className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white dark:text-blue-300 font-bold transition cursor-pointer disabled:opacity-50"
          >
            + Simulate Config Change
          </button>
          <button
            type="button"
            onClick={() => handleSimulateLog('PAYMENT')}
            disabled={simulating}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-300 font-bold transition cursor-pointer disabled:opacity-50"
          >
            + Simulate Payment Event
          </button>
          <button
            type="button"
            onClick={() => handleSimulateLog('SECURITY')}
            disabled={simulating}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-300 font-bold transition cursor-pointer disabled:opacity-50"
          >
            + Simulate Security Alert
          </button>
        </div>
      </div>

      {/* Audit Log Detail Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {getCategoryBadge(selectedLog.category)}
                <h3 className="text-sm font-black text-slate-900 dark:text-white font-mono">{selectedLog.action}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Log Event ID:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{selectedLog.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Timestamp (ISO):</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{selectedLog.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span
                    className={`font-bold ${
                      selectedLog.status === 'FAILED' ? 'text-rose-500' : 'text-emerald-500'
                    }`}
                  >
                    {selectedLog.status || 'SUCCESS'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Actor Name</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedLog.actorName}</div>
                  <div className="text-[10px] text-indigo-400 mt-0.5">{selectedLog.actorRole}</div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">IP Address</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedLog.ipAddress}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{selectedLog.userAgent || 'Standard Browser'}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Details & Payload Description</div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                  {selectedLog.details}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
