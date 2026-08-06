import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Users,
  Percent,
  Zap,
  Check,
  X,
  FileText,
} from 'lucide-react';

interface DailyEmailConfig {
  enabled: boolean;
  recipientEmail: string;
  scheduleTime: string;
  lastSentAt?: string;
}

interface DailyEmailLog {
  id: string;
  businessId: string;
  businessName: string;
  recipientEmail: string;
  sentAt: string;
  status: 'DELIVERED' | 'FAILED' | 'SIMULATED';
  resendId?: string;
  errorMessage?: string;
  metrics: {
    totalRevenue: number;
    transactionCount: number;
    stkSuccessRate: number;
    activeCustomersCount: number;
    topPaymentMethod: string;
  };
}

export const DailyEmailSummaryTab: React.FC<{ business: any }> = ({ business }) => {
  const [config, setConfig] = useState<DailyEmailConfig>({
    enabled: true,
    recipientEmail: business?.contactEmail || 'keppytotize@gmail.com',
    scheduleTime: '08:00',
  });
  const [hasResendApiKey, setHasResendApiKey] = useState(false);
  const [logs, setLogs] = useState<DailyEmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    fetchConfigAndLogs();
  }, []);

  const fetchConfigAndLogs = async () => {
    setLoading(true);
    try {
      const [configRes, logsRes] = await Promise.all([
        fetch('/api/reports/daily-summary/config'),
        fetch('/api/reports/daily-summary/logs'),
      ]);

      const configData = await configRes.json();
      const logsData = await logsRes.json();

      if (configData.success && configData.config) {
        setConfig(configData.config);
        setHasResendApiKey(Boolean(configData.hasResendApiKey));
      }
      if (logsData.success && logsData.logs) {
        setLogs(logsData.logs);
      }
    } catch (err) {
      console.error('Failed to load daily email settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/reports/daily-summary/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: 'Daily Email Summary schedule updated successfully!',
        });
      } else {
        setFeedback({
          type: 'error',
          message: data.message || 'Failed to update configuration',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Network error saving configuration',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerNow = async () => {
    setTriggering(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/reports/daily-summary/trigger', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: data.message,
        });
        fetchConfigAndLogs();
      } else {
        setFeedback({
          type: 'error',
          message: data.message || 'Failed to dispatch daily summary email',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Network error dispatching daily email',
      });
    } finally {
      setTriggering(false);
    }
  };

  const handleFetchPreview = async () => {
    setLoadingPreview(true);
    try {
      const res = await fetch('/api/reports/daily-summary/preview');
      const data = await res.json();
      if (data.success && data.html) {
        setPreviewHtml(data.html);
        setShowPreviewModal(true);
      }
    } catch (err) {
      console.error('Failed to load email preview', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
        <p className="text-xs font-semibold">Loading Daily Email Summary Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between font-semibold text-xs border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Resend Status Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Zap className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Resend API Email Engine
              {hasResendApiKey ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  LIVE API ACTIVE
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  SIMULATED DISPATCH MODE
                </span>
              )}
            </h3>
          </div>
          <p className="text-xs text-slate-400 pl-9">
            {hasResendApiKey
              ? 'Connected to Resend.com. Daily transaction digests are sent directly to your registered inbox.'
              : 'RESEND_API_KEY environment variable is not configured. Email dispatches are recorded and simulated in logs.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFetchPreview}
            disabled={loadingPreview}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Eye className="w-4 h-4 text-sky-400" />
            <span>{loadingPreview ? 'Rendering...' : 'Preview Template'}</span>
          </button>
          <button
            type="button"
            onClick={handleTriggerNow}
            disabled={triggering}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{triggering ? 'Dispatching...' : 'Trigger Email Now'}</span>
          </button>
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSaveConfig} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" /> Daily Email Digest Schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated recurring background job dispatches transaction revenue & health metrics daily.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            <span className="ml-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              {config.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Recipient Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={config.recipientEmail}
                onChange={(e) => setConfig({ ...config, recipientEmail: e.target.value })}
                placeholder="owner@yourbusiness.co.ke"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Preferred Delivery Schedule Time (EAT)
            </label>
            <select
              value={config.scheduleTime}
              onChange={(e) => setConfig({ ...config, scheduleTime: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="06:00">06:00 AM (Morning Opening Digest)</option>
              <option value="08:00">08:00 AM (Standard Business Hours)</option>
              <option value="12:00">12:00 PM (Midday Check-in)</option>
              <option value="18:00">06:00 PM (Evening Closing Digest)</option>
              <option value="21:00">09:00 PM (Night Summary)</option>
            </select>
          </div>
        </div>

        {config.lastSentAt && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Last Background Dispatch Execution:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {new Date(config.lastSentAt).toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Digest Settings'}</span>
          </button>
        </div>
      </form>

      {/* Logs Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" /> Daily Email Dispatch History & Logs
          </h3>
          <button
            type="button"
            onClick={fetchConfigAndLogs}
            className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No daily email summary logs recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Dispatched At</th>
                    <th className="p-3.5">Recipient</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Resend Message ID</th>
                    <th className="p-3.5">Summarized Revenue</th>
                    <th className="p-3.5">STK Success Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 font-sans font-semibold">
                        {new Date(log.sentAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-slate-800 dark:text-slate-200 font-sans font-medium">
                        {log.recipientEmail}
                      </td>
                      <td className="p-3.5">
                        {log.status === 'DELIVERED' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-sans font-bold text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> DELIVERED
                          </span>
                        ) : log.status === 'SIMULATED' ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-sans font-bold text-[10px] inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-amber-500" /> SIMULATED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-sans font-bold text-[10px] inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-500" /> FAILED
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {log.resendId || log.errorMessage || '-'}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                        KES {log.metrics?.totalRevenue?.toLocaleString() || 0}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                        {log.metrics?.stkSuccessRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* HTML Email Template Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-950 rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Daily Digest HTML Email Template Preview</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 max-h-[500px] overflow-y-auto">
              <iframe
                title="Email Preview"
                srcDoc={previewHtml}
                className="w-full h-[450px] rounded-xl bg-slate-950 border-0"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
