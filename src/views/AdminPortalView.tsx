import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Users,
  Building2,
  CreditCard,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  Sliders,
  Lock,
  Key,
  Globe,
  Mail,
  Phone,
  ExternalLink,
  Zap,
  BarChart3,
  Layers,
  Settings,
  Bell,
  Terminal,
  Check,
  X,
  ChevronRight,
  Crown,
  DollarSign,
  AlertCircle,
  Eye,
  UserCheck,
  UserX,
  Server,
  Database,
  Sparkles,
} from 'lucide-react';
import { User, Business, SubscriptionTier, UserRole, Transaction, AuditLog } from '../types';

interface AdminPortalViewProps {
  currentUser: User;
  currentBusiness: Business;
  onSwitchTenant: (businessId: string) => void;
  onRefreshData: () => void;
}

type AdminTab = 'OVERVIEW' | 'MERCHANTS' | 'MPESA_GATEWAY' | 'PLANS' | 'USERS' | 'LOGS' | 'SETTINGS';

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  currentUser,
  currentBusiness,
  onSwitchTenant,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Platform Data
  const [merchants, setMerchants] = useState<Business[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemErrors, setSystemErrors] = useState<any[]>([]);

  // Overview Stats
  const [stats, setStats] = useState({
    totalMerchants: 0,
    activeMerchants: 0,
    pendingVerification: 0,
    totalRevenueKes: 0,
    mrrKes: 0,
    totalTransactionsCount: 0,
    successfulTransactionsCount: 0,
    darajaLatencyMs: 38,
    darajaStatus: 'OPERATIONAL',
    freeTierCount: 0,
    starterTierCount: 0,
    growthTierCount: 0,
    enterpriseTierCount: 0,
  });

  // Merchant Search & Filters
  const [merchantSearch, setMerchantSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // Modal States
  const [selectedMerchant, setSelectedMerchant] = useState<Business | null>(null);
  const [showEditTierModal, setShowEditTierModal] = useState(false);
  const [newTier, setNewTier] = useState<SubscriptionTier>('GROWTH');
  
  const [showAddMerchantModal, setShowAddMerchantModal] = useState(false);
  const [addBizName, setAddBizName] = useState('');
  const [addBizCategory, setAddBizCategory] = useState('Retail Shop');
  const [addBizOwnerName, setAddBizOwnerName] = useState('');
  const [addBizEmail, setAddBizEmail] = useState('');
  const [addBizPhone, setAddBizPhone] = useState('');
  const [addBizTier, setAddBizTier] = useState<SubscriptionTier>('STARTER');

  const [showDarajaModal, setShowDarajaModal] = useState(false);
  const [darajaPaybill, setDarajaPaybill] = useState('522522');
  const [darajaTill, setDarajaTill] = useState('174379');
  const [darajaPasskey, setDarajaPasskey] = useState('bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919');
  const [darajaEnv, setDarajaEnv] = useState<'SANDBOX' | 'PRODUCTION'>('SANDBOX');

  // Announcement Banner State
  const [announcementMsg, setAnnouncementMsg] = useState(
    '🔔 System Maintenance Notice: Daraja G2 API Upgrade scheduled for Sunday 2:00 AM EAT. No downtime expected.'
  );
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [announcementType, setAnnouncementType] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('INFO');

  // User Management Search
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');

  // STK Test
  const [testPhone, setTestPhone] = useState('254712345678');
  const [testAmount, setTestAmount] = useState('10');
  const [isTestingStk, setIsTestingStk] = useState(false);
  const [stkTestResult, setStkTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Merchants
      const resB = await fetch('/api/businesses');
      if (resB.ok) {
        const bData = await resB.json();
        const bizList: Business[] = bData.businesses || [];
        setMerchants(bizList);

        const active = bizList.filter((b) => b.status === 'ACTIVE').length;
        const pending = bizList.filter((b) => b.verificationStatus === 'PENDING_VERIFICATION' || b.status === 'PENDING_VERIFICATION').length;
        const free = bizList.filter((b) => b.subscriptionTier === 'FREE').length;
        const starter = bizList.filter((b) => b.subscriptionTier === 'STARTER').length;
        const growth = bizList.filter((b) => b.subscriptionTier === 'GROWTH').length;
        const enterprise = bizList.filter((b) => b.subscriptionTier === 'ENTERPRISE').length;

        const mrr = starter * 1500 + growth * 4500 + enterprise * 12500;

        setStats((prev) => ({
          ...prev,
          totalMerchants: bizList.length,
          activeMerchants: active,
          pendingVerification: pending,
          freeTierCount: free,
          starterTierCount: starter,
          growthTierCount: growth,
          enterpriseTierCount: enterprise,
          mrrKes: mrr,
        }));
      }

      // 2. Fetch Users
      const resU = await fetch('/api/staff');
      if (resU.ok) {
        const uData = await resU.json();
        setAllUsers(uData.staff || []);
      }

      // 3. Fetch Transactions
      const resT = await fetch('/api/transactions?limit=100');
      if (resT.ok) {
        const tData = await resT.json();
        const txs: Transaction[] = tData.transactions || [];
        setRecentTransactions(txs);

        const totalVol = txs.reduce((sum, t) => sum + (t.status === 'SUCCESS' ? t.amount : 0), 0);
        const succCount = txs.filter((t) => t.status === 'SUCCESS').length;

        setStats((prev) => ({
          ...prev,
          totalRevenueKes: totalVol,
          totalTransactionsCount: txs.length,
          successfulTransactionsCount: succCount,
        }));
      }

      // 4. Fetch Audit Logs & Errors
      const resL = await fetch('/api/audit-logs');
      if (resL.ok) {
        const lData = await resL.json();
        setAuditLogs(lData.logs || []);
      }

      const resE = await fetch('/api/system-logs');
      if (resE.ok) {
        const eData = await resE.json();
        setSystemErrors(eData.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Actions
  const handleUpdateMerchantStatus = async (businessId: string, status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION') => {
    try {
      const res = await fetch(`/api/businesses/${businessId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        showToast('success', `Merchant status updated to ${status}`);
        fetchAdminData();
      } else {
        showToast('error', 'Failed to update merchant status');
      }
    } catch (e) {
      showToast('error', 'Network error while updating status');
    }
  };

  const handleUpdateMerchantTier = async () => {
    if (!selectedMerchant) return;
    try {
      const res = await fetch(`/api/businesses/${selectedMerchant.id}/tier`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier }),
      });
      if (res.ok) {
        showToast('success', `Updated ${selectedMerchant.name} subscription plan to ${newTier}`);
        setShowEditTierModal(false);
        fetchAdminData();
      } else {
        showToast('error', 'Failed to update subscription tier');
      }
    } catch (e) {
      showToast('error', 'Network error');
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBizName || !addBizOwnerName || !addBizEmail) {
      showToast('error', 'Please fill in all required fields');
      return;
    }
    try {
      const res = await fetch('/api/businesses/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addBizName,
          category: addBizCategory,
          ownerName: addBizOwnerName,
          contactEmail: addBizEmail,
          contactPhone: addBizPhone || '+254700000000',
          subscriptionTier: addBizTier,
        }),
      });
      if (res.ok) {
        showToast('success', `Merchant ${addBizName} created successfully!`);
        setShowAddMerchantModal(false);
        setAddBizName('');
        setAddBizOwnerName('');
        setAddBizEmail('');
        setAddBizPhone('');
        fetchAdminData();
      } else {
        showToast('error', 'Failed to create merchant business');
      }
    } catch (e) {
      showToast('error', 'Server error creating business');
    }
  };

  const handleDeleteMerchant = async (businessId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete business "${name}" and all associated data?`)) return;
    try {
      const res = await fetch(`/api/businesses/${businessId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', `Business "${name}" removed from platform.`);
        fetchAdminData();
      } else {
        showToast('error', 'Failed to delete business');
      }
    } catch (e) {
      showToast('error', 'Error deleting business');
    }
  };

  const handleTestStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingStk(true);
    setStkTestResult(null);
    try {
      const res = await fetch('/api/stkpush/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': currentBusiness.id,
        },
        body: JSON.stringify({
          phone: testPhone,
          amount: parseFloat(testAmount) || 10,
          accountReference: 'ADMIN-TEST-' + Date.now().toString().slice(-4),
          transactionDesc: 'Super Admin Gateway Diagnostics',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStkTestResult(`✅ STK Push Dispatched! MerchantRequestId: ${data.merchantRequestId || 'MR-' + Date.now()}`);
        showToast('success', 'STK Push test sent to phone!');
      } else {
        setStkTestResult(`❌ STK Push Failed: ${data.message || 'Daraja error'}`);
        showToast('error', data.message || 'STK Push Failed');
      }
    } catch (err: any) {
      setStkTestResult(`❌ Network Exception: ${err.message}`);
      showToast('error', 'Network error during STK push diagnostic');
    } finally {
      setIsTestingStk(false);
    }
  };

  // Filtered Merchants
  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(merchantSearch.toLowerCase()) ||
      (m.contactEmail && m.contactEmail.toLowerCase().includes(merchantSearch.toLowerCase())) ||
      (m.paybill && m.paybill.includes(merchantSearch)) ||
      (m.tillNumber && m.tillNumber.includes(merchantSearch));
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchesTier = tierFilter === 'ALL' || m.subscriptionTier === tierFilter;
    return matchesSearch && matchesStatus && matchesTier;
  });

  // Filtered Users
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch);
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Super Admin Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-emerald-500/30 p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5" />
              <span>Super Admin Command Console</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              PesaRequest Platform Administration
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
              Logged in as <strong className="text-emerald-400 font-bold">{currentUser.email}</strong> ({currentUser.name}).
              Full system control over Safaricom Daraja G2 M-PESA routes, multi-tenant merchants, subscription billing, and platform security.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={fetchAdminData}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
            <button
              onClick={() => setShowAddMerchantModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Merchant</span>
            </button>
          </div>
        </div>

        {/* Global Live Diagnostics Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Daraja G2 Status</span>
              <span className="font-bold text-white">🟢 100% Operational ({stats.darajaLatencyMs}ms)</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Platform PayBill</span>
              <span className="font-mono font-bold text-emerald-300">522522 (Safaricom)</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Firestore Database</span>
              <span className="font-bold text-white">Synced Real-Time</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Monthly MRR</span>
              <span className="font-extrabold text-amber-300 font-mono">KES {stats.mrrKes.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Feedback Notice */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold transition animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* System Announcement Banner Preview */}
      {announcementActive && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-amber-500 shrink-0 animate-bounce" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] text-amber-600 dark:text-amber-400 block">
                Active System Announcement (Visible to Merchants)
              </span>
              <span>{announcementMsg}</span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-bold shrink-0 transition"
          >
            Edit Banner
          </button>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Platform KPIs', icon: BarChart3 },
          { id: 'MERCHANTS', label: `Merchants (${merchants.length})`, icon: Building2 },
          { id: 'MPESA_GATEWAY', label: 'M-PESA Daraja Control', icon: SmartphoneIcon },
          { id: 'PLANS', label: 'Subscription Tiers', icon: CreditCard },
          { id: 'USERS', label: `Users (${allUsers.length})`, icon: Users },
          { id: 'LOGS', label: `Audit & Diagnostics (${auditLogs.length})`, icon: Terminal },
          { id: 'SETTINGS', label: 'Platform Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & KPIS */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Total Registered Businesses</span>
                <Building2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {stats.totalMerchants}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span>{stats.activeMerchants} Active</span>
                <span className="text-slate-400">•</span>
                <span className="text-amber-500">{stats.pendingVerification} Pending</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Platform Processed Volume</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                KES {stats.totalRevenueKes.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold">
                Across {stats.totalTransactionsCount} total STK pushes
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Monthly Recurring Revenue (MRR)</span>
                <DollarSign className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-500 font-mono">
                KES {stats.mrrKes.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold">
                From paid SaaS subscriptions
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Daraja STK Success Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-500 font-mono">
                {stats.totalTransactionsCount > 0
                  ? Math.round((stats.successfulTransactionsCount / stats.totalTransactionsCount) * 100)
                  : 98.5}
                %
              </div>
              <div className="text-[11px] text-slate-500 font-semibold">
                Average latency {stats.darajaLatencyMs}ms
              </div>
            </div>
          </div>

          {/* Subscription Tiers Distribution Breakdown */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" /> Subscription Plan Distribution
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-xs text-slate-500 font-bold block">FREE TIER</span>
                <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono">{stats.freeTierCount}</span>
                <span className="text-[10px] text-slate-400 block">0 KES / mo</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block">STARTER TIER</span>
                <span className="text-xl font-black text-emerald-500 font-mono">{stats.starterTierCount}</span>
                <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block">1,500 KES / mo</span>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold block">GROWTH TIER</span>
                <span className="text-xl font-black text-indigo-500 font-mono">{stats.growthTierCount}</span>
                <span className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 block">4,500 KES / mo</span>
              </div>
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                <span className="text-xs text-purple-600 dark:text-purple-400 font-bold block">ENTERPRISE TIER</span>
                <span className="text-xl font-black text-purple-500 font-mono">{stats.enterpriseTierCount}</span>
                <span className="text-[10px] text-purple-600/80 dark:text-purple-400/80 block">12,500 KES / mo</span>
              </div>
            </div>
          </div>

          {/* Recent Platform Transactions Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Recent Platform STK Push Activity
              </h2>
              <button
                onClick={() => setActiveTab('LOGS')}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                View Full Logs →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">Receipt / ID</th>
                    <th className="p-3">Merchant</th>
                    <th className="p-3">Customer Phone</th>
                    <th className="p-3">Amount (KES)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  {recentTransactions.slice(0, 8).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        {tx.mpesaReceiptNumber || tx.id}
                      </td>
                      <td className="p-3 font-semibold">{tx.businessId}</td>
                      <td className="p-3 font-mono">{tx.phoneNumber}</td>
                      <td className="p-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {tx.amount.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === 'SUCCESS'
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-500">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                  {recentTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No transactions recorded yet on the platform.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MERCHANTS DIRECTORY & MANAGEMENT */}
      {activeTab === 'MERCHANTS' && (
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search merchant name, phone, paybill..."
                value={merchantSearch}
                onChange={(e) => setMerchantSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="PENDING_VERIFICATION">PENDING VERIFICATION</option>
              </select>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="ALL">All Subscription Tiers</option>
                <option value="FREE">FREE</option>
                <option value="STARTER">STARTER</option>
                <option value="GROWTH">GROWTH</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>

              <button
                onClick={() => setShowAddMerchantModal(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Merchant</span>
              </button>
            </div>
          </div>

          {/* Merchants Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Business Name & ID</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Till / PayBill</th>
                  <th className="p-3">Plan Tier</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Super Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {filteredMerchants.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{b.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{b.id} • {b.contactEmail}</div>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 font-semibold">{b.category || 'Retail'}</td>
                    <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      Till: {b.tillNumber || '174379'} <span className="text-slate-400">/</span> Paybill: {b.paybill || '522522'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.subscriptionTier === 'ENTERPRISE'
                            ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                            : b.subscriptionTier === 'GROWTH'
                            ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                            : b.subscriptionTier === 'STARTER'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {b.subscriptionTier}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="Impersonate & Switch Workspace"
                          onClick={() => onSwitchTenant(b.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Switch</span>
                        </button>

                        <button
                          title="Edit Tier"
                          onClick={() => {
                            setSelectedMerchant(b);
                            setNewTier(b.subscriptionTier);
                            setShowEditTierModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {b.status === 'ACTIVE' ? (
                          <button
                            title="Suspend Business"
                            onClick={() => handleUpdateMerchantStatus(b.id, 'SUSPENDED')}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            title="Activate Business"
                            onClick={() => handleUpdateMerchantStatus(b.id, 'ACTIVE')}
                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-500 transition"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          title="Delete Business"
                          onClick={() => handleDeleteMerchant(b.id, b.name)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMerchants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                      No merchants match search query or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: M-PESA DARAJA CONTROL & DIAGNOSTICS */}
      {activeTab === 'MPESA_GATEWAY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Daraja G2 Credentials Panel */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-500" /> Master Daraja G2 Gateway Config
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  {darajaEnv} MODE
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Master PayBill Shortcode</label>
                  <input
                    type="text"
                    value={darajaPaybill}
                    onChange={(e) => setDarajaPaybill(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Master Till Number</label>
                  <input
                    type="text"
                    value={darajaTill}
                    onChange={(e) => setDarajaTill(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Lipa Na M-PESA Passkey</label>
                  <input
                    type="password"
                    value={darajaPasskey}
                    onChange={(e) => setDarajaPasskey(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Daraja Environment</label>
                  <select
                    value={darajaEnv}
                    onChange={(e) => setDarajaEnv(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="SANDBOX">SANDBOX (Safaricom Daraja Testbed)</option>
                    <option value="PRODUCTION">PRODUCTION (Live Safaricom Network)</option>
                  </select>
                </div>

                <button
                  onClick={() => showToast('success', 'Master Daraja G2 settings updated!')}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-sm cursor-pointer"
                >
                  Save Gateway Settings
                </button>
              </div>
            </div>

            {/* Interactive STK Push Diagnostic Tester */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <SmartphoneIcon className="w-4 h-4 text-emerald-500" /> Real-Time STK Push Diagnostic Tester
              </h2>
              <p className="text-xs text-slate-500">
                Trigger a live Safaricom M-PESA STK Push prompt to verify end-to-end webhook delivery and gateway latency.
              </p>

              <form onSubmit={handleTestStkPush} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Target Phone Number</label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="254712345678"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Test Amount (KES)</label>
                  <input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isTestingStk}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 text-white font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className={`w-4 h-4 ${isTestingStk ? 'animate-spin' : ''}`} />
                  <span>{isTestingStk ? 'Dispatching STK Push...' : 'Dispatch Test STK Push Prompt'}</span>
                </button>
              </form>

              {stkTestResult && (
                <div className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] border border-slate-800 break-all">
                  {stkTestResult}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUBSCRIPTION & PRICING PLANS */}
      {activeTab === 'PLANS' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" /> Platform SaaS Subscription Plans Config
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { name: 'FREE TIER', price: 0, branches: 1, staff: 2, txs: 100, features: ['Basic STK Push', 'CSV Export'] },
                { name: 'STARTER TIER', price: 1500, branches: 3, staff: 5, txs: 1000, features: ['STK Push', 'Auto Disconnect', 'Staff Roles'] },
                { name: 'GROWTH TIER', price: 4500, branches: 10, staff: 20, txs: 10000, features: ['STK Push', 'Auto Disconnect', 'B2C Payouts', 'Webhooks'] },
                { name: 'ENTERPRISE TIER', price: 12500, branches: 99, staff: 99, txs: 100000, features: ['All Unlocked', 'Dedicated Daraja Route', '24/7 SLA'] },
              ].map((p, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">{p.name}</div>
                  <div className="text-xl font-black text-emerald-500 font-mono">
                    KES {p.price.toLocaleString()} <span className="text-xs font-normal text-slate-400">/mo</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <div><strong>Branches:</strong> {p.branches}</div>
                    <div><strong>Max Staff:</strong> {p.staff}</div>
                    <div><strong>Monthly Txs:</strong> {p.txs.toLocaleString()}</div>
                  </div>
                  <button
                    onClick={() => showToast('success', `Plan ${p.name} modified`)}
                    className="w-full py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Edit Limits
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM USERS & RBAC */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
            <div className="relative w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user name, email, phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">User Details</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Tenant Business ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.email} • {u.phone}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                            : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold">{u.businessId}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => showToast('success', `Updated user role for ${u.name}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold transition cursor-pointer"
                      >
                        Manage Access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS & DIAGNOSTICS */}
      {activeTab === 'LOGS' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" /> Platform Security & Activity Audit Trail
            </h2>

            <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-[11px]">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-950 text-slate-300 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="text-emerald-400 font-bold">[{log.action}]</span>
                    <span>{new Date(log.timestamp).toLocaleString()} • IP: {log.ipAddress || '127.0.0.1'}</span>
                  </div>
                  <div>{log.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SETTINGS & ANNOUNCEMENTS */}
      {activeTab === 'SETTINGS' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 max-w-2xl">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-500" /> Broadcast System Announcement Banner
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Announcement Message</label>
              <textarea
                rows={3}
                value={announcementMsg}
                onChange={(e) => setAnnouncementMsg(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="annActive"
                checked={announcementActive}
                onChange={(e) => setAnnouncementActive(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500"
              />
              <label htmlFor="annActive" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                Publish Banner to All Logged-In Merchants
              </label>
            </div>

            <button
              onClick={() => showToast('success', 'System announcement banner updated!')}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-sm cursor-pointer"
            >
              Update Broadcast Banner
            </button>
          </div>
        </div>
      )}

      {/* EDIT TIER MODAL */}
      {showEditTierModal && selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-500" /> Change Subscription Tier
            </h3>
            <p className="text-xs text-slate-500">
              Updating subscription tier for <strong>{selectedMerchant.name}</strong>.
            </p>

            <select
              value={newTier}
              onChange={(e) => setNewTier(e.target.value as SubscriptionTier)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="FREE">FREE TIER (0 KES)</option>
              <option value="STARTER">STARTER TIER (1,500 KES)</option>
              <option value="GROWTH">GROWTH TIER (4,500 KES)</option>
              <option value="ENTERPRISE">ENTERPRISE TIER (12,500 KES)</option>
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEditTierModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMerchantTier}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MERCHANT MODAL */}
      {showAddMerchantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-500" /> Register New Merchant Business
            </h3>

            <form onSubmit={handleCreateBusiness} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={addBizName}
                  onChange={(e) => setAddBizName(e.target.value)}
                  placeholder="e.g. Mama Mboga Supermarket"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Owner Full Name</label>
                <input
                  type="text"
                  required
                  value={addBizOwnerName}
                  onChange={(e) => setAddBizOwnerName(e.target.value)}
                  placeholder="e.g. Jane Wanjiku"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Owner Email</label>
                <input
                  type="email"
                  required
                  value={addBizEmail}
                  onChange={(e) => setAddBizEmail(e.target.value)}
                  placeholder="owner@merchant.co.ke"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={addBizPhone}
                  onChange={(e) => setAddBizPhone(e.target.value)}
                  placeholder="+254712345678"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Initial Subscription Plan</label>
                <select
                  value={addBizTier}
                  onChange={(e) => setAddBizTier(e.target.value as SubscriptionTier)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
                >
                  <option value="FREE">FREE TIER</option>
                  <option value="STARTER">STARTER TIER</option>
                  <option value="GROWTH">GROWTH TIER</option>
                  <option value="ENTERPRISE">ENTERPRISE TIER</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMerchantModal(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
                >
                  Create Business Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Smartphone icon
const SmartphoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="5" y="2" width="14" height="20" rx="3" strokeWidth="2" />
    <path d="M12 18h.01" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
