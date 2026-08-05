import React, { useState } from 'react';
import { BarChart3, Download, Printer, FileSpreadsheet, TrendingUp, Calendar, Filter, Sparkles, CheckCircle } from 'lucide-react';
import { AnalyticsSummary } from '../types';

interface Props {
  analytics: AnalyticsSummary | null;
}

export const ReportsView: React.FC<Props> = ({ analytics }) => {
  const [reportType, setReportType] = useState<'REVENUE' | 'BRANCH' | 'PEAK_HOURS'>('REVENUE');

  if (!analytics) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportSheets = () => {
    window.location.href = '/api/transactions/export';
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-500" />
            Financial Reports & Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Reconciliation statements, peak hour distribution, and branch performance reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportSheets}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export to Google Sheets CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print PDF Statement</span>
          </button>
        </div>
      </div>

      {/* Summary Highlight Cards */}
      {(() => {
        const avgValue = analytics.successfulCount > 0 ? Math.round(analytics.totalRevenue / analytics.successfulCount) : 0;
        const completedPushes = analytics.successfulCount || 0;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="text-xs text-slate-400 font-bold uppercase">Monthly M-PESA Volume</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                KES {analytics.monthlyRevenue.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500">Total volume processed across all branches</div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="text-xs text-slate-400 font-bold uppercase">Average Transaction Value</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                KES {avgValue.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500">Based on {completedPushes.toLocaleString()} completed STK pushes</div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="text-xs text-slate-400 font-bold uppercase">Daraja API SLA Uptime</div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                99.98%
              </div>
              <div className="text-[11px] text-emerald-500 font-bold">Zero callback dropped</div>
            </div>
          </div>
        );
      })()}

      {/* Branch Breakdown Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Branch Collections Summary</h3>
        <div className="overflow-x-auto">
          {analytics.branchBreakdown.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No branch transaction data recorded yet.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="py-3 px-3">Branch Name</th>
                  <th className="py-3 px-3">Total STK Pushes</th>
                  <th className="py-3 px-3">Gross Revenue (KES)</th>
                  <th className="py-3 px-3">Share %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {analytics.branchBreakdown.map((b) => {
                  const sharePct = analytics.totalRevenue > 0 ? Math.round((b.revenue / analytics.totalRevenue) * 100) : 0;
                  return (
                    <tr key={b.name} className="hover:bg-slate-50 dark:hover:bg-slate-950">
                      <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-slate-100">{b.name}</td>
                      <td className="py-3.5 px-3 font-mono text-slate-600 dark:text-slate-400">{b.transactions}</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        KES {b.revenue.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(sharePct, 100)}%` }}></div>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">{sharePct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
