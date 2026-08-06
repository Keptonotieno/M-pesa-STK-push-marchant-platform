import React, { useState } from 'react';
import {
  Send,
  ArrowUpRight,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  FileSpreadsheet,
  UserPlus,
  RefreshCw,
  Search,
  Filter,
  Download,
  Calendar,
  Smartphone,
  GitBranch,
  MapPin,
  User,
  Store,
  Plus,
  Phone,
  Activity,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Building2,
  X,
  Power,
  ToggleLeft,
  ToggleRight,
  LayoutGrid,
  SlidersHorizontal,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  RotateCcw,
  GripVertical,
  Check,
  Sparkles,
  Layers,
} from 'lucide-react';
import { AnalyticsSummary, Branch, Transaction, UserRole } from '../types';

export interface WidgetConfig {
  id: string;
  name: string;
  category: 'Branch' | 'Metrics' | 'Analytics' | 'Shortcuts' | 'Table';
  description: string;
  visible: boolean;
}

const DEFAULT_WIDGET_CONFIGS: WidgetConfig[] = [
  {
    id: 'BRANCH_PERFORMANCE',
    name: 'Branch Location & Store Performance',
    category: 'Branch',
    description: 'Multi-location till stats, branch quick tabs, and registration action.',
    visible: true,
  },
  {
    id: 'STAT_REVENUE',
    name: "Today's Revenue Metric",
    category: 'Metrics',
    description: 'Total monetary collection value processed today.',
    visible: true,
  },
  {
    id: 'STAT_SUCCESS',
    name: 'Successful Payments Metric',
    category: 'Metrics',
    description: 'Count of completed STK pushes and completion rate %.',
    visible: true,
  },
  {
    id: 'STAT_PENDING',
    name: 'Pending Requests Metric',
    category: 'Metrics',
    description: 'Real-time count of active push prompts awaiting customer PIN.',
    visible: true,
  },
  {
    id: 'STAT_FAILED',
    name: 'Failed / Cancelled Metric',
    category: 'Metrics',
    description: 'Count of cancelled or timed-out payment requests.',
    visible: true,
  },
  {
    id: 'STAT_API_HEALTH',
    name: 'Safaricom Daraja API Health',
    category: 'Metrics',
    description: 'Real-time Daraja G2 gateway latency and callback listener status.',
    visible: true,
  },
  {
    id: 'STAT_ACCOUNT_STATUS',
    name: 'Account Compliance & KRA Status',
    category: 'Metrics',
    description: 'Account verification, KRA PIN validation, and tenant status.',
    visible: true,
  },
  {
    id: 'STAT_SUBSCRIPTION',
    name: 'Active Subscription Plan',
    category: 'Metrics',
    description: 'Current PesaRequest subscription plan status and renewal date.',
    visible: true,
  },
  {
    id: 'REVENUE_CHART',
    name: '7-Day Revenue Trend Chart',
    category: 'Analytics',
    description: 'Interactive SVG bar chart showing daily revenue collections.',
    visible: true,
  },
  {
    id: 'PAYMENT_STATUS',
    name: 'Payment Status Distribution (Donut)',
    category: 'Analytics',
    description: 'Breakdown of successful, pending, and failed transactions.',
    visible: true,
  },
  {
    id: 'QUICK_ACTIONS',
    name: 'Quick Action Shortcuts',
    category: 'Shortcuts',
    description: 'One-click shortcuts to send payment, view transactions, export reports, invite staff.',
    visible: true,
  },
  {
    id: 'RECENT_TRANSACTIONS',
    name: 'Recent Transactions Feed',
    category: 'Table',
    description: 'Live transaction log with M-PESA receipts, customer phone, and branch tags.',
    visible: true,
  },
];

const STORAGE_KEY = 'pesarequest_dashboard_widgets_v2';

const loadSavedWidgets = (): WidgetConfig[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const savedIds = new Set(parsed.map((w: WidgetConfig) => w.id));
        const missing = DEFAULT_WIDGET_CONFIGS.filter((w) => !savedIds.has(w.id));
        return [...parsed, ...missing];
      }
    }
  } catch (err) {
    console.error('Failed to load dashboard widgets from localStorage:', err);
  }
  return DEFAULT_WIDGET_CONFIGS;
};

interface Props {
  analytics: AnalyticsSummary | null;
  branches: Branch[];
  activeBranchId: string;
  onSelectBranch: (branchId: string) => void;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: (enabled: boolean) => void;
  onOpenSendModal: () => void;
  onNavigate: (view: string) => void;
  userRole: UserRole;
  onRefreshData: () => void;
  onAddBranch: (branch: Partial<Branch>) => void;
}

export const DashboardView: React.FC<Props> = ({
  analytics,
  branches,
  activeBranchId,
  onSelectBranch,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  onOpenSendModal,
  onNavigate,
  userRole,
  onRefreshData,
  onAddBranch,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH'>('MONTH');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Widget Layout & Visibility Customization State
  const [widgets, setWidgets] = useState<WidgetConfig[]>(loadSavedWidgets);
  const [showCustomizerModal, setShowCustomizerModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Register New Branch Modal State inside Widget
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLocation, setNewBranchLocation] = useState('');
  const [newBranchManager, setNewBranchManager] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchTill, setNewBranchTill] = useState('');

  // Persist widgets layout to localStorage
  const saveWidgets = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets));
    } catch (err) {
      console.error('Failed to save dashboard widgets layout:', err);
    }
  };

  const toggleWidgetVisibility = (id: string) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
    saveWidgets(updated);
  };

  const moveWidget = (id: string, direction: 'UP' | 'DOWN') => {
    const idx = widgets.findIndex((w) => w.id === id);
    if (idx === -1) return;
    if (direction === 'UP' && idx === 0) return;
    if (direction === 'DOWN' && idx === widgets.length - 1) return;

    const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
    const updated = [...widgets];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);

    saveWidgets(updated);
  };

  const resetWidgetLayout = () => {
    saveWidgets(DEFAULT_WIDGET_CONFIGS);
    setToastMsg('Reset dashboard layout to default configuration.');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const toggleAllWidgets = (visible: boolean) => {
    const updated = widgets.map((w) => ({ ...w, visible }));
    saveWidgets(updated);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleRegisterBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName || !newBranchLocation) return;

    onAddBranch({
      name: newBranchName,
      location: newBranchLocation,
      managerName: newBranchManager || 'Branch Manager',
      phone: newBranchPhone || '0712 345 678',
      tillNumber: newBranchTill || '174379',
    });

    setNewBranchName('');
    setNewBranchLocation('');
    setNewBranchManager('');
    setNewBranchPhone('');
    setNewBranchTill('');
    setShowAddBranchModal(false);
  };

  if (!analytics) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-400 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
        <span>Loading PesaRequest Dashboard Analytics...</span>
      </div>
    );
  }

  const selectedBranchObj =
    activeBranchId !== 'ALL'
      ? branches.find((b) => b.id === activeBranchId) || analytics.selectedBranch
      : null;

  const visibleWidgets = widgets.filter((w) => w.visible);

  // Render individual stat metric card
  const renderStatCard = (widgetId: string) => {
    switch (widgetId) {
      case 'STAT_REVENUE':
        return (
          <div key="STAT_REVENUE" className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex-1 min-w-[180px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Today&apos;s Revenue</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                KES
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                KES {analytics.todayRevenue.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{selectedBranchObj ? `Location Total` : `+12.5% vs yesterday`}</span>
              </div>
            </div>
          </div>
        );

      case 'STAT_SUCCESS':
        return (
          <div key="STAT_SUCCESS" className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex-1 min-w-[180px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Successful Payments</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {analytics.todayCount}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 mt-1">
                <span>{analytics.successRate}% completion rate</span>
              </div>
            </div>
          </div>
        );

      case 'STAT_PENDING':
        return (
          <div key="STAT_PENDING" className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex-1 min-w-[180px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pending Requests</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-2">
                <span>{analytics.pendingCount}</span>
                {analytics.pendingCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                )}
              </div>
              <button
                onClick={() => onNavigate('transactions')}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline mt-1 flex items-center gap-1"
              >
                <span>View Transactions →</span>
              </button>
            </div>
          </div>
        );

      case 'STAT_FAILED':
        return (
          <div key="STAT_FAILED" className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex-1 min-w-[180px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Failed / Cancelled</span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {analytics.failedCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">1.1% cancellation rate</div>
            </div>
          </div>
        );

      case 'STAT_API_HEALTH':
        return (
          <div key="STAT_API_HEALTH" className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex-1 min-w-[180px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Daraja API Health</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>100% Operational</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">180ms Latency • Webhooks Active</div>
            </div>
          </div>
        );

      case 'STAT_ACCOUNT_STATUS':
        return (
          <div key="STAT_ACCOUNT_STATUS" className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex-1 min-w-[180px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Account Compliance</span>
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>KRA PIN Verified</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Enterprise Multi-Tenant Isolated</div>
            </div>
          </div>
        );

      case 'STAT_SUBSCRIPTION':
        return (
          <div key="STAT_SUBSCRIPTION" className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-slate-800 shadow-sm space-y-3 flex-1 min-w-[180px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Active Subscription</span>
              <CreditCard className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-400">Professional Plan</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Renews Aug 31, 2026</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render Section Widget by ID
  const renderWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case 'BRANCH_PERFORMANCE':
        return (
          <div key="BRANCH_PERFORMANCE" className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 border border-emerald-500/30 text-white shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="text-[10px] font-black tracking-widest uppercase text-emerald-400 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  Location Analytics & Store Performance Widget
                </div>
                <h3 className="text-xl font-black mt-1 flex items-center gap-2">
                  {selectedBranchObj ? (
                    <>
                      <span>{selectedBranchObj.name} Dashboard</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black">
                        SELECTED BRANCH
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Company-Wide Multi-Branch Performance</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                        {branches.length} REGISTERED LOCATIONS
                      </span>
                    </>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Select any branch location tab below to instantly isolate real-time M-PESA STK Push metrics.
                </p>
              </div>

              <button
                onClick={() => setShowAddBranchModal(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg flex items-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register New Branch</span>
              </button>
            </div>

            {/* Location Quick Switch Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => onSelectBranch('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeBranchId === 'ALL'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>All Locations</span>
              </button>

              {branches.map((b) => {
                const isSelected = activeBranchId === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => onSelectBranch(b.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{b.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Branch Specific Detail Banner */}
            {selectedBranchObj ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/40">
                <div className="space-y-1 border-r-0 md:border-r border-slate-800 pr-4">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Branch Location</div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{selectedBranchObj.location}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-500" />
                    <span>Manager: {selectedBranchObj.managerName || 'Store Manager'}</span>
                  </div>
                </div>

                <div className="space-y-1 border-r-0 md:border-r border-slate-800 pr-4">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">PayBill / Till Number</div>
                  <div className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                    <Store className="w-4 h-4" />
                    <span>Till: {selectedBranchObj.tillNumber || '174379'}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Status: ACTIVE</div>
                </div>

                <div className="space-y-1 border-r-0 md:border-r border-slate-800 pr-4">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Branch Revenue Today</div>
                  <div className="text-lg font-black font-mono text-white">
                    KES {analytics.todayRevenue.toLocaleString()}
                  </div>
                  <div className="text-xs text-emerald-400 font-bold">
                    {analytics.todayCount} Successful Payments
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-2">
                  <button
                    onClick={onOpenSendModal}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send STK for {selectedBranchObj.name}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* All Branches Breakdown Summary Cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {analytics.branchBreakdown.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    onClick={() => b.id && onSelectBranch(b.id)}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 transition cursor-pointer space-y-2 group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition flex items-center gap-1">
                        <Store className="w-3.5 h-3.5 text-emerald-400" />
                        {b.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {b.tillNumber ? `Till ${b.tillNumber}` : 'Active'}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-base font-black font-mono text-emerald-400">
                        KES {b.revenue.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">{b.transactions} STK txns</span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
                      <span>📍 {b.location || 'Nairobi'}</span>
                      <span className="text-emerald-400 font-bold group-hover:underline">Filter →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'REVENUE_CHART':
        return (
          <div key="REVENUE_CHART" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Revenue Overview {selectedBranchObj ? `(${selectedBranchObj.name})` : '(STK Pushes)'}
                </h3>
                <p className="text-xs text-slate-400">
                  Daily M-PESA collections over the last 7 days {selectedBranchObj && `for ${selectedBranchObj.name}`}
                </p>
              </div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="TODAY">Today</option>
                <option value="WEEK">This Week</option>
                <option value="MONTH">This Month</option>
              </select>
            </div>

            {/* Line Chart Representation (SVG) */}
            <div className="h-64 w-full pt-4 flex flex-col justify-between">
              <div className="flex-1 relative flex items-end gap-3 px-2">
                {analytics.revenueChart.map((pt, idx) => {
                  const max = Math.max(...analytics.revenueChart.map((p) => p.amount));
                  const heightPct = max > 0 ? (pt.amount / max) * 100 : 10;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                      <div className="opacity-0 group-hover:opacity-100 transition absolute -top-10 bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                        KES {pt.amount.toLocaleString()} ({pt.count} txns)
                      </div>

                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-xl group-hover:from-emerald-500 group-hover:to-emerald-300 transition-all duration-300"
                      ></div>
                      <span className="text-[10px] text-slate-400 font-semibold">{pt.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'PAYMENT_STATUS':
        return (
          <div key="PAYMENT_STATUS" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Payment Status</h3>
              <p className="text-xs text-slate-400">
                Distribution of requests sent {selectedBranchObj ? `at ${selectedBranchObj.name}` : 'today'}
              </p>
            </div>

            <div className="my-auto flex flex-col items-center py-4">
              <div className="relative w-40 h-40 rounded-full border-[14px] border-emerald-500 border-t-amber-500 border-r-rose-500 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {analytics.todayCount + analytics.pendingCount + analytics.failedCount}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Requests</div>
                </div>
              </div>

              <div className="mt-6 w-full space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600 dark:text-slate-300">Successful</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{analytics.todayCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="text-slate-600 dark:text-slate-300">Pending</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{analytics.pendingCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span className="text-slate-600 dark:text-slate-300">Failed</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{analytics.failedCount}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'QUICK_ACTIONS':
        return (
          <div key="QUICK_ACTIONS" className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={onOpenSendModal}
              className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send Payment Request</span>
            </button>
            <button
              onClick={() => onNavigate('transactions')}
              className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              <span>View All Transactions</span>
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Generate Financial Report</span>
            </button>
            <button
              onClick={() => onNavigate('staff')}
              className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-teal-500" />
              <span>Invite Branch Staff</span>
            </button>
          </div>
        );

      case 'RECENT_TRANSACTIONS':
        return (
          <div key="RECENT_TRANSACTIONS" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recent Transactions {selectedBranchObj && `(${selectedBranchObj.name})`}
                </h3>
                <p className="text-xs text-slate-400">
                  Live feed of M-PESA STK pushes {selectedBranchObj && `for ${selectedBranchObj.name}`}
                </p>
              </div>
              <button
                onClick={() => onNavigate('transactions')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                View Full Log →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Branch Location</th>
                    <th className="py-3 px-3">Receipt Code</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {analytics.recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition">
                      <td className="py-3.5 px-3 text-slate-900 dark:text-white font-bold">{tx.customerName}</td>
                      <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 font-mono">{tx.customerPhone}</td>
                      <td className="py-3.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                        KES {tx.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                          📍 {tx.branchName || 'Main Store'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {tx.mpesaReceipt ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                            {tx.mpesaReceipt}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Awaiting PIN</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        {tx.status === 'SUCCESS' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            ● Successful
                          </span>
                        )}
                        {tx.status === 'PENDING' && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                            Pending
                          </span>
                        )}
                        {(tx.status === 'FAILED' || tx.status === 'CANCELLED') && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                            ● {tx.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                        {new Date(tx.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white border border-emerald-500/50 shadow-2xl flex items-center gap-3 text-xs font-bold animate-in zoom-in-95">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Welcome Bar & Branch/Auto-Refresh/Customizer Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Welcome back! 👋
            </h2>
            {selectedBranchObj && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold border border-emerald-500/20">
                📍 {selectedBranchObj.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time M-PESA STK Push collections & branch location metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Location Dropdown Filter */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <select
              value={activeBranchId}
              onChange={(e) => onSelectBranch(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer pr-2"
            >
              <option value="ALL">🏢 All Store Locations (Company-Wide)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  📍 {b.name} ({b.location}) — Till: {b.tillNumber || '174379'}
                </option>
              ))}
            </select>
          </div>

          {/* Customize Dashboard Layout Button */}
          <button
            type="button"
            onClick={() => setShowCustomizerModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700 shadow-sm cursor-pointer"
            title="Reorder widgets or toggle visibility"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span>Customize Layout</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-black border border-emerald-500/40">
              {visibleWidgets.length}/{widgets.length} Active
            </span>
          </button>

          {/* User-Facing Auto-Refresh Toggle Switch */}
          <button
            type="button"
            onClick={() => onToggleAutoRefresh(!autoRefreshEnabled)}
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold transition cursor-pointer ${
              autoRefreshEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title={
              autoRefreshEnabled
                ? 'Auto-refresh active (polling every 10s). Click to pause and reduce server load.'
                : 'Auto-refresh paused. Click to enable real-time polling.'
            }
          >
            {autoRefreshEnabled ? (
              <>
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </div>
                <span>Auto-Refresh: ON</span>
                <ToggleRight className="w-5 h-5 text-emerald-500" />
              </>
            ) : (
              <>
                <div className="h-2.5 w-2.5 rounded-full bg-slate-400"></div>
                <span>Auto-Refresh: PAUSED</span>
                <ToggleLeft className="w-5 h-5 text-slate-400" />
              </>
            )}
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer"
            title="Manual refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* DYNAMIC DASHBOARD WIDGETS RENDER LOOP BASED ON USER'S REORDERED LAYOUT */}
      {visibleWidgets.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <EyeOff className="w-12 h-12 text-slate-400 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Dashboard Widgets Hidden</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              You have hidden all analytics widgets from your custom layout. Click below to enable widgets or reset layout to default.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => toggleAllWidgets(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              Show All Widgets
            </button>
            <button
              onClick={resetWidgetLayout}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              Reset to Default Layout
            </button>
          </div>
        </div>
      ) : (
        (() => {
          const renderedElements: React.ReactNode[] = [];
          const statIds = ['STAT_REVENUE', 'STAT_SUCCESS', 'STAT_PENDING', 'STAT_FAILED', 'STAT_API_HEALTH', 'STAT_ACCOUNT_STATUS', 'STAT_SUBSCRIPTION'];

          let i = 0;
          while (i < widgets.length) {
            const currentWidget = widgets[i];

            // Check if current and subsequent widgets are contiguous visible STAT metrics cards
            if (statIds.includes(currentWidget.id) && currentWidget.visible) {
              const contiguousStats: string[] = [];
              while (i < widgets.length && statIds.includes(widgets[i].id)) {
                if (widgets[i].visible) {
                  contiguousStats.push(widgets[i].id);
                }
                i++;
              }
              if (contiguousStats.length > 0) {
                renderedElements.push(
                  <div key={`stat-group-${contiguousStats.join('-')}`} className="flex flex-wrap gap-4">
                    {contiguousStats.map((statId) => renderStatCard(statId))}
                  </div>
                );
              }
              continue;
            }

            // Check if REVENUE_CHART and PAYMENT_STATUS are contiguous & visible to render side-by-side
            if (
              (currentWidget.id === 'REVENUE_CHART' || currentWidget.id === 'PAYMENT_STATUS') &&
              currentWidget.visible
            ) {
              const nextWidget = widgets[i + 1];
              if (
                nextWidget &&
                (nextWidget.id === 'REVENUE_CHART' || nextWidget.id === 'PAYMENT_STATUS') &&
                nextWidget.visible
              ) {
                // Both charts visible adjacently
                const chart1 = currentWidget.id;
                const chart2 = nextWidget.id;
                renderedElements.push(
                  <div key={`charts-group-${chart1}-${chart2}`} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className={chart1 === 'REVENUE_CHART' ? 'lg:col-span-2' : ''}>
                      {renderWidgetContent(chart1)}
                    </div>
                    <div className={chart2 === 'REVENUE_CHART' ? 'lg:col-span-2' : ''}>
                      {renderWidgetContent(chart2)}
                    </div>
                  </div>
                );
                i += 2;
                continue;
              }
            }

            // Regular section widget rendering
            if (currentWidget.visible && !statIds.includes(currentWidget.id)) {
              renderedElements.push(renderWidgetContent(currentWidget.id));
            }
            i++;
          }

          return <div className="space-y-8">{renderedElements}</div>;
        })()
      )}

      {/* DASHBOARD LAYOUT CUSTOMIZER MODAL */}
      {showCustomizerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCustomizerModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold shrink-0">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  Customize Dashboard Widgets & Layout
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold border border-emerald-500/20">
                    Saved to LocalStorage
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reorder widgets with <MoveUp className="w-3 h-3 inline text-emerald-500" /> <MoveDown className="w-3 h-3 inline text-emerald-500" /> or toggle visibility with <Eye className="w-3 h-3 inline text-emerald-500" /> to personalize your merchant dashboard.
                </p>
              </div>
            </div>

            {/* Global Controls & Preset Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>{visibleWidgets.length} of {widgets.length} Widgets Enabled</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleAllWidgets(true)}
                  className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition text-[11px] cursor-pointer"
                >
                  Show All
                </button>
                <button
                  type="button"
                  onClick={() => toggleAllWidgets(false)}
                  className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition text-[11px] cursor-pointer"
                >
                  Hide All
                </button>
                <button
                  type="button"
                  onClick={resetWidgetLayout}
                  className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-rose-500 font-bold transition text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>

            {/* Widget Reordering & Visibility List */}
            <div className="space-y-2.5">
              {widgets.map((widget, idx) => (
                <div
                  key={widget.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    widget.visible
                      ? 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800'
                      : 'bg-slate-100/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-slate-400 flex flex-col items-center shrink-0">
                      <GripVertical className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-mono font-bold text-slate-500">{idx + 1}</span>
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {widget.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {widget.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {widget.description}
                      </p>
                    </div>
                  </div>

                  {/* Move Up / Move Down & Toggle Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveWidget(widget.id, 'UP')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Move widget up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => moveWidget(widget.id, 'DOWN')}
                      disabled={idx === widgets.length - 1}
                      className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Move widget down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleWidgetVisibility(widget.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                        widget.visible
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {widget.visible ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">
                Changes apply instantly and persist across your browser sessions.
              </span>
              <button
                type="button"
                onClick={() => setShowCustomizerModal(false)}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                Done Customizing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register New Branch Modal inside Widget */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleRegisterBranchSubmit}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-emerald-500" />
                Register Business Branch
              </h3>
              <button
                type="button"
                onClick={() => setShowAddBranchModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Branch Location Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Westlands Flagship Store"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Physical Address / Town
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Westlands Road, Nairobi"
                value={newBranchLocation}
                onChange={(e) => setNewBranchLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Manager Name
                </label>
                <input
                  type="text"
                  placeholder="Manager Name"
                  value={newBranchManager}
                  onChange={(e) => setNewBranchManager(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Safaricom Till Number
                </label>
                <input
                  type="text"
                  placeholder="e.g., 174379"
                  value={newBranchTill}
                  onChange={(e) => setNewBranchTill(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold font-mono text-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddBranchModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
              >
                Register Location
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

