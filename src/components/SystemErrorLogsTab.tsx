import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Zap,
  RotateCcw,
  Trash2,
  Search,
  Filter,
  Info,
  Server,
  FileText,
  Terminal,
  Clock,
  Check,
} from 'lucide-react';
import { SystemErrorLog } from '../types';

export const SystemErrorLogsTab: React.FC<{ business: any }> = ({ business }) => {
  const [logs, setLogs] = useState<SystemErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system-errors', {
        headers: { 'x-business-id': business?.id || 'biz-001' },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch system error logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryError = async (logId: string) => {
    setRetryingId(logId);
    setActionMessage(null);
    try {
      const res = await fetch('/api/system-errors/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': business?.id || 'biz-001',
        },
        body: JSON.stringify({ errorId: logId }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({
          type: 'success',
          text: data.message || 'Auto-retry executed successfully! Failure resolved.',
        });
        fetchLogs();
      } else {
        setActionMessage({
          type: 'error',
          text: data.message || 'Retry failed to resolve error.',
        });
      }
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: 'Network error executing retry task.',
      });
    } finally {
      setRetryingId(null);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear system error log history?')) return;
    try {
      const res = await fetch('/api/system-errors/clear', {
        method: 'POST',
        headers: { 'x-business-id': business?.id || 'biz-001' },
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ type: 'success', text: 'System error logs cleared.' });
        fetchLogs();
      }
    } catch (err) {
      console.error('Failed to clear logs', err);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterSeverity !== 'ALL' && log.severity !== filterSeverity) return false;
    if (filterCategory !== 'ALL' && log.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.errorCode.toLowerCase().includes(q) ||
        log.errorMessage.toLowerCase().includes(q) ||
        log.actionableGuidance.toLowerCase().includes(q) ||
        log.requestPath.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-500 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AUTOMATICALLY_RESOLVED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] inline-flex items-center gap-1 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> AUTO-RESOLVED
          </span>
        );
      case 'RETRYING_BACKGROUND':
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-[10px] inline-flex items-center gap-1 border border-blue-500/30">
            <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" /> RETRYING...
          </span>
        );
      case 'MAX_RETRIES_EXCEEDED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[10px] inline-flex items-center gap-1 border border-rose-500/30">
            <XCircle className="w-3 h-3 text-rose-500" /> MAX RETRIES REACHED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-500/15 text-slate-600 dark:text-slate-400 font-bold text-[10px] inline-flex items-center gap-1 border border-slate-500/30">
            <Clock className="w-3 h-3 text-slate-400" /> PENDING RETRY
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
        <p className="text-xs font-semibold">Loading System Error Logs & Resilient Auto-Retry Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                System Error Logs & Resilient Auto-Retry
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Centralized monitoring of Daraja API timeouts, webhook delivery glitches, and system exceptions with clear actionable guidance and automated retry logic.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            type="button"
            onClick={fetchLogs}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleClearLogs}
            className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-rose-500/30 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search error code or guidance..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="DARAJA_GATEWAY">Daraja Gateway</option>
            <option value="WEBHOOK_DISPATCH">Webhook Dispatch</option>
            <option value="AUTH_SECURITY">Auth & Security</option>
            <option value="EMAIL_SERVICE">Email Service</option>
          </select>
        </div>
      </div>

      {/* Error Logs List */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Zero Active System Errors</h4>
            <p className="text-xs text-slate-400 mt-1">All APIs, Daraja callbacks, and background tasks operating smoothly.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${getSeverityBadge(
                      log.severity
                    )}`}
                  >
                    {log.severity}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{log.errorCode}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {log.httpMethod} {log.requestPath}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(log.retryStatus)}
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{log.errorMessage}</span>
                </h4>
              </div>

              {/* Actionable Resolution Guidance */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Actionable Resolution Guidance:</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-sans">{log.actionableGuidance}</p>
              </div>

              {/* Bottom Details & Manual Retry Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                  <span>
                    Auto-Retries Executed: <strong>{log.autoRetryCount}</strong> / {log.maxRetries}
                  </span>
                  {log.lastRetryAt && (
                    <span>Last Attempt: {new Date(log.lastRetryAt).toLocaleTimeString()}</span>
                  )}
                </div>

                {log.retryStatus !== 'AUTOMATICALLY_RESOLVED' && (
                  <button
                    type="button"
                    onClick={() => handleRetryError(log.id)}
                    disabled={retryingId === log.id}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${retryingId === log.id ? 'animate-spin' : ''}`} />
                    <span>{retryingId === log.id ? 'Retrying Operation...' : 'Retry Now'}</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
