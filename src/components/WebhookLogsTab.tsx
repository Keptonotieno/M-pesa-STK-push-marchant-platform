import React, { useState, useEffect } from 'react';
import {
  Radio,
  Code,
  Copy,
  Check,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Send,
  X,
  Eye,
  CheckCircle,
  AlertTriangle,
  Terminal,
  ArrowDownRight,
  Sparkles,
  Info,
  Clock,
} from 'lucide-react';
import { WebhookLog, Business } from '../types';

interface Props {
  business: Business;
}

export const WebhookLogsTab: React.FC<Props> = ({ business }) => {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [resultCodeFilter, setResultCodeFilter] = useState<'ALL' | 'SUCCESS' | 'CANCELLED' | 'TIMEOUT' | 'ERROR'>('ALL');
  const [selectedLogModal, setSelectedLogModal] = useState<WebhookLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/webhooks/logs', {
        headers: { 'x-business-id': business.id },
      });
      const data = await res.json();
      if (data.success && data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch webhook logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [business.id]);

  const handleCopyJson = (log: WebhookLog) => {
    navigator.clipboard.writeText(JSON.stringify(log.rawPayload, null, 2));
    setCopiedId(log.id);
    setToastMessage(`Copied payload JSON for log #${log.id} to clipboard!`);
    setTimeout(() => {
      setCopiedId(null);
      setToastMessage(null);
    }, 2500);
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all webhook callback logs?')) return;
    try {
      const res = await fetch('/api/webhooks/clear', {
        method: 'POST',
        headers: { 'x-business-id': business.id },
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage('All webhook logs cleared.');
        fetchLogs();
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateWebhookCall = async () => {
    setIsSimulating(true);
    const mockCheckoutId = 'ws_CO_TEST_' + Date.now();
    const mockMerchantId = 'MR-TEST-' + Math.floor(10000 + Math.random() * 90000);
    const mockReceipt = 'QKH' + Math.floor(100000 + Math.random() * 900000) + 'D';
    const mockAmount = Math.floor(500 + Math.random() * 4500);

    const sampleDarajaPayload = {
      Body: {
        stkCallback: {
          MerchantRequestID: mockMerchantId,
          CheckoutRequestID: mockCheckoutId,
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: mockAmount },
              { Name: 'MpesaReceiptNumber', Value: mockReceipt },
              { Name: 'Balance' },
              { Name: 'TransactionDate', Value: Number(new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14)) },
              { Name: 'PhoneNumber', Value: 254712345678 },
            ],
          },
        },
      },
    };

    try {
      const res = await fetch('/api/stkpush/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': business.id,
        },
        body: JSON.stringify(sampleDarajaPayload),
      });
      await res.json();
      setToastMessage(`⚡ Simulated live incoming M-PESA callback! Receipt: ${mockReceipt} (KES ${mockAmount.toLocaleString()})`);
      fetchLogs();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Error simulating webhook callback:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      log.id.toLowerCase().includes(q) ||
      log.checkoutRequestId.toLowerCase().includes(q) ||
      log.merchantRequestId.toLowerCase().includes(q) ||
      (log.mpesaReceipt && log.mpesaReceipt.toLowerCase().includes(q)) ||
      (log.customerPhone && log.customerPhone.includes(q)) ||
      log.resultDesc.toLowerCase().includes(q);

    let matchesFilter = true;
    if (resultCodeFilter === 'SUCCESS') matchesFilter = log.resultCode === 0;
    else if (resultCodeFilter === 'CANCELLED') matchesFilter = log.resultCode === 1032;
    else if (resultCodeFilter === 'TIMEOUT') matchesFilter = log.resultCode === 1037;
    else if (resultCodeFilter === 'ERROR') matchesFilter = log.resultCode !== 0 && log.resultCode !== 1032 && log.resultCode !== 1037;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Control Bar */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-black tracking-widest uppercase text-emerald-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> Live Daraja Callback Stream
            </div>
            <h3 className="text-xl font-black mt-1 flex items-center gap-2">
              M-PESA Webhook Inspection & Payload Debugger
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
                {logs.length} / 50 Payload Logs
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Captures exact raw JSON callback payloads sent by Safaricom Daraja API endpoints (<code className="text-emerald-400 font-mono">POST /api/stkpush/callback</code>). Inspect ResultCode metadata, M-PESA receipts, and request headers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSimulateWebhookCall}
              disabled={isSimulating}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-900/30 cursor-pointer"
              title="Post a test M-PESA Daraja JSON payload into the webhook receiver"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'Sending Webhook...' : 'Simulate Incoming Callback'}</span>
            </button>

            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Stream</span>
            </button>

            {logs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-950 text-rose-400 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 hover:border-rose-800 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Logs</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by CheckoutRequestID, receipt, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status Filter:
            </span>
            <select
              value={resultCodeFilter}
              onChange={(e: any) => setResultCodeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-bold text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">All Callbacks (50)</option>
              <option value="SUCCESS">Success (ResultCode: 0)</option>
              <option value="CANCELLED">Cancelled (ResultCode: 1032)</option>
              <option value="TIMEOUT">Timeout (ResultCode: 1037)</option>
              <option value="ERROR">Other Errors</option>
            </select>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in zoom-in-95">
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Webhook Logs Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-500" />
            Showing {filteredLogs.length} of last {logs.length} incoming webhook callbacks
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Sorted by newest timestamp</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Result Code & Status</th>
                <th className="py-3 px-4">Checkout Request ID</th>
                <th className="py-3 px-4">M-PESA Receipt / Amount</th>
                <th className="py-3 px-4">Customer Phone</th>
                <th className="py-3 px-4 text-right">Payload Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No webhook callback logs found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isSuccess = log.resultCode === 0;
                  const isCancelled = log.resultCode === 1032;
                  const isTimeout = log.resultCode === 1037;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/60 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-slate-200">
                          {new Date(log.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold uppercase border border-slate-200 dark:border-slate-700">
                          {log.eventType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isSuccess && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3" />
                            <span>Code 0 (Success)</span>
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                            <X className="w-3 h-3" />
                            <span>Code 1032 (Cancelled)</span>
                          </span>
                        )}
                        {isTimeout && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Code 1037 (Timeout)</span>
                          </span>
                        )}
                        {!isSuccess && !isCancelled && !isTimeout && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Code {log.resultCode}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{log.checkoutRequestId}</div>
                        <div className="text-[10px] text-slate-400">MerchantID: {log.merchantRequestId}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        {log.mpesaReceipt ? (
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">
                            {log.mpesaReceipt}
                            {log.amount && <span className="text-slate-900 dark:text-white ml-2">(KES {log.amount.toLocaleString()})</span>}
                          </div>
                        ) : log.amount ? (
                          <div className="text-slate-900 dark:text-white font-bold">KES {log.amount.toLocaleString()}</div>
                        ) : (
                          <div className="text-slate-400 text-[10px]">—</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {log.customerPhone || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopyJson(log)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                            title="Copy raw JSON payload"
                          >
                            {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => setSelectedLogModal(log)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                          >
                            <Code className="w-3.5 h-3.5" />
                            <span>Inspect Payload</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Raw JSON Payload Viewer */}
      {selectedLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-slate-950 text-slate-100 rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-4 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedLogModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  Raw Incoming M-PESA Callback Payload
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">
                    Log #{selectedLogModal.id}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Received at {new Date(selectedLogModal.timestamp).toLocaleString()} from Safaricom API Gateway IP ({selectedLogModal.ipAddress || '196.201.214.200'}).
                </p>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Result Code</span>
                <span
                  className={`font-bold font-mono ${
                    selectedLogModal.resultCode === 0
                      ? 'text-emerald-400'
                      : selectedLogModal.resultCode === 1032
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  {selectedLogModal.resultCode}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">M-PESA Receipt</span>
                <span className="font-bold font-mono text-white">{selectedLogModal.mpesaReceipt || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Amount Paid</span>
                <span className="font-bold font-mono text-white">
                  {selectedLogModal.amount ? `KES ${selectedLogModal.amount.toLocaleString()}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Customer Phone</span>
                <span className="font-bold font-mono text-emerald-400">{selectedLogModal.customerPhone || 'N/A'}</span>
              </div>
            </div>

            {/* Pretty Printed JSON Code Container */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
                <span>Payload Body (application/json)</span>
                <button
                  onClick={() => handleCopyJson(selectedLogModal)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copy JSON</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed shadow-inner">
                {JSON.stringify(selectedLogModal.rawPayload, null, 2)}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                <span>ResultDesc: "{selectedLogModal.resultDesc}"</span>
              </div>
              <button
                onClick={() => setSelectedLogModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
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
