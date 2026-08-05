import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Send,
  FileSpreadsheet,
  Calendar,
  X,
} from 'lucide-react';
import { Transaction, Branch, TransactionStatus } from '../types';

interface Props {
  transactions: Transaction[];
  branches: Branch[];
  onRefreshData: () => void;
  onRetryStkPush: (tx: Transaction) => void;
  onBulkRetryStkPush?: (txIds: string[]) => Promise<void>;
}

export const TransactionsView: React.FC<Props> = ({
  transactions,
  branches,
  onRefreshData,
  onRetryStkPush,
  onBulkRetryStkPush,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeTxDetail, setActiveTxDetail] = useState<Transaction | null>(null);
  
  // Selection state for Bulk Retry
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter logic
  const filteredTx = transactions.filter((t) => {
    if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;
    if (selectedBranch !== 'ALL' && t.branchId !== selectedBranch) return false;
    
    // Date Range Filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const txDate = new Date(t.createdAt);
      if (txDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const txDate = new Date(t.createdAt);
      if (txDate > end) return false;
    }

    if (searchQuery) {
      const q = searchQuery.trim().toLowerCase();
      const matchId = t.id ? t.id.toLowerCase().includes(q) : false;
      const matchName = t.customerName.toLowerCase().includes(q);
      const matchPhone = t.customerPhone.includes(q);
      const matchReceipt = t.mpesaReceipt ? t.mpesaReceipt.toLowerCase().includes(q) : false;
      const matchDesc = t.description ? t.description.toLowerCase().includes(q) : false;
      return matchId || matchName || matchPhone || matchReceipt || matchDesc;
    }
    return true;
  });

  const failedInFiltered = filteredTx.filter((t) => t.status === 'FAILED' || t.status === 'CANCELLED');
  const allFailedSelected =
    failedInFiltered.length > 0 && failedInFiltered.every((t) => selectedTxIds.includes(t.id));

  const toggleSelectTx = (id: string) => {
    setSelectedTxIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFailed = () => {
    if (allFailedSelected) {
      const failedIds = new Set(failedInFiltered.map((t) => t.id));
      setSelectedTxIds((prev) => prev.filter((id) => !failedIds.has(id)));
    } else {
      const failedIds = failedInFiltered.map((t) => t.id);
      setSelectedTxIds((prev) => Array.from(new Set([...prev, ...failedIds])));
    }
  };

  const handleBulkRetry = async () => {
    if (selectedTxIds.length === 0) return;
    setIsRetrying(true);
    setFeedbackMsg(null);
    try {
      if (onBulkRetryStkPush) {
        await onBulkRetryStkPush(selectedTxIds);
      } else {
        const res = await fetch('/api/stkpush/bulk-retry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionIds: selectedTxIds }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        onRefreshData();
      }
      setFeedbackMsg({
        type: 'success',
        text: `Re-sent STK Push prompts to ${selectedTxIds.length} customer phone(s) successfully!`,
      });
      setSelectedTxIds([]);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Failed to re-send STK Push requests.',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleExportCsv = () => {
    window.location.href = '/api/transactions/export';
  };

  const setDatePreset = (preset: 'today' | '7days' | 'month') => {
    const now = new Date();
    const toStr = now.toISOString().split('T')[0];
    if (preset === 'today') {
      setStartDate(toStr);
      setEndDate(toStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(toStr);
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(toStr);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-500" />
            Transaction History
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time Safaricom Daraja M-PESA STK Push payment logs & receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Export to CSV / Sheets</span>
          </button>
          <button
            onClick={onRefreshData}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between">
          {/* Search */}
          <div className="relative w-full xl:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phone, receipt, or transaction ID..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Date Range Picker Component */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-slate-400 font-semibold text-[11px]">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-200 text-xs outline-none cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-slate-400 font-semibold text-[11px]">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-200 text-xs outline-none cursor-pointer"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDatePreset('today')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition"
              >
                Today
              </button>
              <button
                onClick={() => setDatePreset('7days')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition"
              >
                7 Days
              </button>
              <button
                onClick={() => setDatePreset('month')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition"
              >
                This Month
              </button>
            </div>

            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition flex items-center gap-1"
                title="Clear date range filter"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Dates</span>
              </button>
            )}
          </div>

          {/* Status & Branch Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedStatus === st
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st}
              </button>
            ))}

            {/* Quick Bulk Retry Button if failed exist */}
            {failedInFiltered.length > 0 && selectedTxIds.length === 0 && (
              <button
                onClick={toggleSelectAllFailed}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-bold transition flex items-center gap-1.5"
                title="Select all failed or cancelled transactions for bulk retry"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Select {failedInFiltered.length} Failed for Bulk Retry</span>
              </button>
            )}

            {/* Branch Filter */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="ALL">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feedback Toast Notification */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold transition ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="p-1 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Bulk Actions Banner */}
      {selectedTxIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-md">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-sm">
              {selectedTxIds.length} Selected
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {selectedTxIds.length} Failed/Cancelled Transaction{selectedTxIds.length > 1 ? 's' : ''} Ready
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Trigger an instant re-send of the STK Push payment prompt to customer phone numbers.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setSelectedTxIds([])}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition"
            >
              Clear
            </button>
            <button
              onClick={handleBulkRetry}
              disabled={isRetrying}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>Bulk Retry STK Push ({selectedTxIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Transactions Data Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allFailedSelected}
                    onChange={toggleSelectAllFailed}
                    className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    title="Select all failed or cancelled transactions"
                  />
                </th>
                <th className="py-3.5 px-4">M-PESA Receipt</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Amount (KES)</th>
                <th className="py-3.5 px-4">Branch</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No transaction records match your filters.
                  </td>
                </tr>
              ) : (
                filteredTx.map((tx) => {
                  const isSelected = selectedTxIds.includes(tx.id);
                  const isFailed = tx.status === 'FAILED' || tx.status === 'CANCELLED';
                  return (
                    <tr
                      key={tx.id}
                      className={`transition ${
                        isSelected
                          ? 'bg-emerald-500/10 dark:bg-emerald-500/15'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-950/50'
                      }`}
                    >
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectTx(tx.id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4 font-mono font-bold">
                        {tx.mpesaReceipt ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            {tx.mpesaReceipt}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">Pending Callback</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-slate-100">{tx.customerName}</td>
                      <td className="py-4 px-4 font-mono text-slate-600 dark:text-slate-300">{tx.customerPhone}</td>
                      <td className="py-4 px-4 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        KES {tx.amount.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400">{tx.branchName}</td>
                      <td className="py-4 px-4">
                        {tx.status === 'SUCCESS' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            ● Successful
                          </span>
                        )}
                        {tx.status === 'PENDING' && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                            ● Pending PIN
                          </span>
                        )}
                        {isFailed && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                            ● {tx.status}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-400 text-[11px]">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => setActiveTxDetail(tx)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                          title="View M-PESA Metadata"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isFailed && (
                          <button
                            onClick={async () => {
                              setIsRetrying(true);
                              try {
                                await onRetryStkPush(tx);
                                setFeedbackMsg({
                                  type: 'success',
                                  text: `Re-sent STK Push request to ${tx.customerPhone} (${tx.customerName}).`,
                                });
                              } catch (e) {
                                setFeedbackMsg({
                                  type: 'error',
                                  text: 'Failed to re-send STK push request.',
                                });
                              } finally {
                                setIsRetrying(false);
                              }
                            }}
                            disabled={isRetrying}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-500 transition disabled:opacity-50 inline-flex items-center gap-1"
                            title="Retry STK Push Request"
                          >
                            <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                            <span>Retry STK</span>
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (confirm(`Are you sure you want to void / delete transaction ${tx.mpesaReceipt || tx.id}?`)) {
                              try {
                                await fetch(`/api/transactions/${tx.id}`, { method: 'DELETE' });
                                onRefreshData();
                              } catch (err) {
                                console.error('Failed to void transaction:', err);
                              }
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition text-[10px] font-bold"
                          title="Void Transaction Record"
                        >
                          Void
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Transaction Modal */}
      {activeTxDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                M-PESA Transaction Metadata
              </h3>
              <button
                onClick={() => setActiveTxDetail(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                <div className="text-slate-400 text-[10px]">M-PESA RECEIPT CODE</div>
                <div className="text-lg font-bold font-mono text-emerald-500">
                  {activeTxDetail.mpesaReceipt || 'N/A (Pending Callback)'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <span className="text-slate-400 text-[10px] block">Customer Name</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{activeTxDetail.customerName}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <span className="text-slate-400 text-[10px] block">Phone Number</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{activeTxDetail.customerPhone}</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl font-mono text-[11px] space-y-1">
                <div>MerchantRequestID: {activeTxDetail.merchantRequestId}</div>
                <div>CheckoutRequestID: {activeTxDetail.checkoutRequestId}</div>
                <div>ResultCode: {activeTxDetail.resultCode ?? 0}</div>
                <div>ResultDesc: {activeTxDetail.resultDesc || 'Processed successfully'}</div>
              </div>
            </div>

            <button
              onClick={() => setActiveTxDetail(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
            >
              Close Metadata
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
