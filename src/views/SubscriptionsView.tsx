import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  ShieldCheck,
  Zap,
  RefreshCw,
  Smartphone,
  GitBranch,
  Users,
  Activity,
  Check,
  ArrowUpRight,
  Sparkles,
  FileText,
  Printer,
  AlertTriangle,
  X,
  Lock,
  Clock,
  Calendar,
  DollarSign,
  Search,
  Filter,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { Business, SubscriptionPlan, SubscriptionInvoice } from '../types';

interface Props {
  currentBusiness: Business;
  onUpgradePlan: (planId: string, phone: string) => void;
}

export const SubscriptionsView: React.FC<Props> = ({ currentBusiness, onUpgradePlan }) => {
  const [activeTab, setActiveTab] = useState<'PLANS' | 'INVOICES'>('PLANS');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [payPhone, setPayPhone] = useState(currentBusiness.contactPhone || '0700830335');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stkPromptPending, setStkPromptPending] = useState<{
    checkoutRequestId: string;
    planName: string;
    amount: number;
    phone: string;
  } | null>(null);
  const [simulatedPin, setSimulatedPin] = useState('1234');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  const [toastFeedback, setToastFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedInvoiceModal, setSelectedInvoiceModal] = useState<SubscriptionInvoice | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'FAILED'>('ALL');

  const [usage, setUsage] = useState<{
    branchesCount: number;
    maxBranches: number;
    staffCount: number;
    maxStaff: number;
    monthlyTxsCount: number;
    maxTransactions: number;
  } | null>(null);

  const [businessData, setBusinessData] = useState<Business>(currentBusiness);

  // Sync prop changes
  useEffect(() => {
    setBusinessData(currentBusiness);
  }, [currentBusiness]);

  const fetchSubscriptionInfo = async () => {
    try {
      const res = await fetch('/api/subscriptions/plans', {
        headers: { 'x-business-id': businessData.id },
      });
      const data = await res.json();
      if (data.success) {
        if (data.plans) setPlans(data.plans);
        if (data.invoices) setInvoices(data.invoices);
        if (data.usage) setUsage(data.usage);
        if (data.currentBusiness) setBusinessData(data.currentBusiness);
      }
    } catch (err) {
      console.error('Failed to fetch subscription details from database:', err);
    }
  };

  useEffect(() => {
    fetchSubscriptionInfo();
  }, [businessData.id, businessData.subscriptionTier, businessData.subscriptionStatus]);

  const handleTriggerPlanChange = (plan: SubscriptionPlan) => {
    if (plan.tier === businessData.subscriptionTier && businessData.subscriptionStatus === 'ACTIVE') return;
    setSelectedPlanId(plan.id);
  };

  const handleConfirmPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;

    const targetPlanObj = plans.find((p) => p.id === selectedPlanId);
    if (!targetPlanObj) return;

    setIsSubmitting(true);
    setToastFeedback(null);

    try {
      const res = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': businessData.id,
        },
        body: JSON.stringify({ planId: selectedPlanId, phone: payPhone }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.activeImmediately) {
          // Free plan switch
          setToastFeedback({
            type: 'success',
            message: `Workspace plan updated to ${targetPlanObj.name}! All tier limits applied immediately.`,
          });
          onUpgradePlan(selectedPlanId, payPhone);
          setSelectedPlanId(null);
          fetchSubscriptionInfo();
        } else if (data.requiresPayment && data.checkoutRequestId) {
          // STK Push triggered, show live M-PESA PIN confirmation
          setStkPromptPending({
            checkoutRequestId: data.checkoutRequestId,
            planName: targetPlanObj.name,
            amount: targetPlanObj.priceKes,
            phone: payPhone,
          });
        }
      } else {
        setToastFeedback({
          type: 'error',
          message: data.message || 'Failed to initiate subscription payment.',
        });
      }
    } catch (err: any) {
      setToastFeedback({
        type: 'error',
        message: err?.message || 'Failed to connect to subscription payment gateway.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyMpesaPin = async (action: 'ENTER_PIN' | 'CANCEL') => {
    if (!stkPromptPending) return;
    setIsVerifyingPin(true);

    try {
      const res = await fetch('/api/stkpush/simulate-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutRequestId: stkPromptPending.checkoutRequestId,
          action,
          pin: simulatedPin,
        }),
      });
      const data = await res.json();

      if (data.success && action === 'ENTER_PIN') {
        setToastFeedback({
          type: 'success',
          message: `🎉 M-PESA Payment Verified (${data.transaction?.mpesaReceipt || 'SUCCESS'}). Plan "${stkPromptPending.planName}" activated! All features & quota limits unlocked immediately.`,
        });
        if (selectedPlanId) onUpgradePlan(selectedPlanId, stkPromptPending.phone);
        setStkPromptPending(null);
        setSelectedPlanId(null);
        fetchSubscriptionInfo();
      } else {
        setToastFeedback({
          type: 'error',
          message: 'Payment was cancelled or PIN entry timed out.',
        });
        setStkPromptPending(null);
        fetchSubscriptionInfo();
      }
    } catch (err) {
      setToastFeedback({
        type: 'error',
        message: 'Error verifying M-PESA payment status.',
      });
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleRenewCurrentPlan = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/subscriptions/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': businessData.id,
        },
        body: JSON.stringify({ phone: payPhone }),
      });
      const data = await res.json();
      if (data.success && data.checkoutRequestId) {
        setStkPromptPending({
          checkoutRequestId: data.checkoutRequestId,
          planName: activePlanObj.name,
          amount: activePlanObj.priceKes,
          phone: payPhone,
        });
      } else {
        setToastFeedback({ type: 'error', message: data.message || 'Failed to trigger renewal.' });
      }
    } catch (err) {
      setToastFeedback({ type: 'error', message: 'Network error renewing subscription.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel auto-renewal for your subscription?')) return;
    try {
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'x-business-id': businessData.id },
      });
      const data = await res.json();
      if (data.success) {
        setToastFeedback({
          type: 'success',
          message: 'Subscription auto-renewal cancelled. Features remain active until the end of your billing cycle.',
        });
        fetchSubscriptionInfo();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateExpiry = async () => {
    try {
      const res = await fetch('/api/subscriptions/simulate-expiry', {
        method: 'POST',
        headers: { 'x-business-id': businessData.id },
      });
      const data = await res.json();
      if (data.success) {
        setToastFeedback({
          type: 'success',
          message: data.message,
        });
        fetchSubscriptionInfo();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activePlanObj =
    plans.find((p) => p.tier === businessData.subscriptionTier) ||
    plans[0] || {
      id: 'plan-starter',
      name: 'Basic Merchant',
      tier: 'STARTER',
      priceKes: 1500,
      period: 'MONTHLY',
      maxTransactions: 500,
      maxBranches: 2,
      maxStaff: 5,
      features: ['500 STK Pushes/mo', '2 Branches included', '5 Staff Accounts'],
    };

  const selectedPlanObj = plans.find((p) => p.id === selectedPlanId);

  const renewalDateStr = businessData.subscriptionRenewalDate
    ? new Date(businessData.subscriptionRenewalDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.mpesaReceipt && inv.mpesaReceipt.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-200">
      {/* Header Bar & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-500" />
            Subscriptions, Billing & Feature Activation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Database-driven multi-tenant billing. Paid subscriptions trigger real M-PESA STK Push payment and activate features instantly.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('PLANS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'PLANS'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Plans & Feature Quotas</span>
          </button>
          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'INVOICES'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Billing History & Invoices ({invoices.length})</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback Banner */}
      {toastFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 animate-in zoom-in-95 ${
            toastFeedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastFeedback.type === 'success' ? (
              <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <span>{toastFeedback.message}</span>
          </div>
          <button onClick={() => setToastFeedback(null)} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Expired / Grace Period Warning Banner */}
      {businessData.subscriptionStatus === 'EXPIRED' && (
        <div className="p-4 rounded-2xl bg-rose-600 text-white border border-rose-700 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-300 shrink-0 animate-bounce" />
            <div>
              <div className="text-sm font-black">Subscription Expired — 7 Day Grace Period Active</div>
              <p className="text-xs text-rose-100">
                Your subscription payment was not renewed. Features remain available during the grace period. Please renew to prevent feature lockouts.
              </p>
            </div>
          </div>
          <button
            onClick={handleRenewCurrentPlan}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-extrabold text-xs transition shadow cursor-pointer whitespace-nowrap"
          >
            {isSubmitting ? 'Triggering M-PESA Renewal...' : 'Renew Subscription Now →'}
          </button>
        </div>
      )}

      {/* TAB 1: PLANS & QUOTAS */}
      {activeTab === 'PLANS' && (
        <div className="space-y-8">
          {/* Current Workspace Plan Status & Quota Meters */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 border border-emerald-500/40 text-white shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="text-[10px] font-black tracking-widest uppercase text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Active Workspace Plan
                </div>
                <h3 className="text-2xl font-black mt-1 flex items-center gap-2">
                  {activePlanObj.name} ({businessData.subscriptionTier} Tier)
                  <span
                    className={`text-xs px-3 py-0.5 rounded-full font-black ${
                      businessData.subscriptionStatus === 'EXPIRED'
                        ? 'bg-rose-500 text-white'
                        : businessData.subscriptionStatus === 'CANCELLED'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-500 text-slate-950'
                    }`}
                  >
                    {businessData.subscriptionStatus || 'ACTIVE'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Renewal Date: <span className="text-white font-bold">{renewalDateStr}</span> via M-PESA STK Push Billing.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleRenewCurrentPlan}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-md shadow-emerald-900/30"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Renew Plan</span>
                </button>
                {businessData.subscriptionStatus !== 'CANCELLED' && (
                  <button
                    onClick={handleCancelSubscription}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700"
                  >
                    Cancel Renewal
                  </button>
                )}
                <button
                  onClick={handleSimulateExpiry}
                  className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-rose-400 text-xs font-mono font-bold transition border border-slate-700"
                  title="Test how the UI handles expired status and grace period"
                >
                  {businessData.subscriptionStatus === 'EXPIRED' ? 'Restore Active Status' : 'Test Expiration State'}
                </button>
              </div>
            </div>

            {/* Live Resource Quota Usage Meters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5 text-white">
                    <GitBranch className="w-4 h-4 text-emerald-400" />
                    Store Branches Limit
                  </span>
                  <span>
                    {usage ? usage.branchesCount : 1} / {activePlanObj.maxBranches === 999 ? 'Unlimited' : activePlanObj.maxBranches}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        ((usage ? usage.branchesCount : 1) / (activePlanObj.maxBranches === 999 ? 100 : activePlanObj.maxBranches)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5 text-white">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Staff Accounts Limit
                  </span>
                  <span>
                    {usage ? usage.staffCount : 1} / {activePlanObj.maxStaff === 999 ? 'Unlimited' : activePlanObj.maxStaff}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        ((usage ? usage.staffCount : 1) / (activePlanObj.maxStaff === 999 ? 100 : activePlanObj.maxStaff)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5 text-white">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Monthly STK Push Quota
                  </span>
                  <span>
                    {usage ? usage.monthlyTxsCount : 0} / {activePlanObj.maxTransactions === 0 ? 'Unlimited' : activePlanObj.maxTransactions}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        activePlanObj.maxTransactions === 0
                          ? 10
                          : Math.min(100, ((usage ? usage.monthlyTxsCount : 0) / activePlanObj.maxTransactions) * 100)
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isCurrent = businessData.subscriptionTier === plan.tier;
              return (
                <div
                  key={plan.id}
                  className={`p-6 rounded-3xl border flex flex-col justify-between transition relative ${
                    isCurrent
                      ? 'bg-gradient-to-b from-slate-900 to-emerald-950/40 border-emerald-500 shadow-2xl text-white ring-2 ring-emerald-500/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md">
                      Current Active Plan
                    </span>
                  )}

                  <div>
                    <h3 className="text-base font-bold flex items-center justify-between">
                      <span>{plan.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono font-bold">
                        {plan.tier}
                      </span>
                    </h3>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-3xl font-extrabold font-mono">KES {plan.priceKes.toLocaleString()}</span>
                      <span className="text-xs text-slate-400 ml-1">/mo</span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1 text-slate-500 dark:text-slate-400 font-semibold">
                      <div className="flex justify-between">
                        <span>Branches Allowed:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {plan.maxBranches === 999 ? 'Unlimited' : plan.maxBranches}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Staff Accounts:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {plan.maxStaff === 999 ? 'Unlimited' : plan.maxStaff}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly STK Quota:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {plan.maxTransactions === 0 ? 'Unlimited' : `${plan.maxTransactions} / mo`}
                        </span>
                      </div>
                    </div>

                    <ul className="mt-6 space-y-3 text-xs text-slate-500 dark:text-slate-300">
                      {plan.features.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    disabled={isCurrent && businessData.subscriptionStatus === 'ACTIVE'}
                    onClick={() => handleTriggerPlanChange(plan)}
                    className={`mt-8 w-full py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                      isCurrent && businessData.subscriptionStatus === 'ACTIVE'
                        ? 'bg-slate-800 text-slate-400 cursor-default border border-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-95'
                    }`}
                  >
                    {isCurrent && businessData.subscriptionStatus === 'ACTIVE' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Active Workspace Plan</span>
                      </>
                    ) : (
                      <>
                        <span>{plan.priceKes === 0 ? 'Switch to Free' : `Upgrade to ${plan.name}`}</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BILLING HISTORY & INVOICES */}
      {activeTab === 'INVOICES' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" />
                Subscription Billing History & Tax Invoices
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Complete audit records of subscription payments, M-PESA receipt codes, and downloadable tax receipts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search invoice # or receipt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid Only</option>
                <option value="PENDING">Pending Only</option>
                <option value="FAILED">Failed Only</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Invoice ID</th>
                  <th className="py-3 px-3">Date Issued</th>
                  <th className="py-3 px-3">Subscription Plan</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">M-PESA Receipt</th>
                  <th className="py-3 px-3">Payment Method</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No subscription billing invoices found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition">
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{inv.id}</td>
                      <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400">
                        {new Date(inv.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-3 text-slate-900 dark:text-white font-bold">
                        {inv.planName} ({inv.tier})
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        KES {inv.amountKes.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 font-mono">
                        {inv.mpesaReceipt ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                            {inv.mpesaReceipt}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400">{inv.paymentMethod || 'M-PESA STK Push'}</td>
                      <td className="py-3.5 px-3">
                        {inv.status === 'PAID' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            ● PAID
                          </span>
                        )}
                        {inv.status === 'PENDING' && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                            ● PENDING
                          </span>
                        )}
                        {inv.status === 'FAILED' && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                            ● FAILED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedInvoiceModal(inv)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-500" />
                          <span>View Tax Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: M-PESA Subscription Payment Trigger Modal */}
      {selectedPlanId && selectedPlanObj && !stkPromptPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleConfirmPaySubmit}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-500" />
                Activate {selectedPlanObj.name}
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                KES {selectedPlanObj.priceKes.toLocaleString()}/mo
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upgrading to <strong className="text-slate-900 dark:text-white">{selectedPlanObj.name}</strong> immediately unlocks all features and increases limits ({selectedPlanObj.maxBranches === 999 ? 'Unlimited' : selectedPlanObj.maxBranches} branches, {selectedPlanObj.maxStaff === 999 ? 'Unlimited' : selectedPlanObj.maxStaff} staff).
            </p>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Safaricom M-PESA Phone Number for Payment
                </label>
                <button
                  type="button"
                  onClick={() => setPayPhone('0700830335')}
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30 transition flex items-center gap-1 cursor-pointer"
                  title="Use subscriber testing phone 0700830335"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>0700830335</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={payPhone}
                onChange={(e) => setPayPhone(e.target.value)}
                placeholder="0700830335"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-600 dark:text-emerald-400 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Instant Feature Activation Guaranteed
              </div>
              <p>An M-PESA STK Push prompt will be sent to your phone. Features activate immediately upon verification.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPlanId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Initiating STK Push...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Send STK Push</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: Live M-PESA STK Push PIN Verification Modal */}
      {stkPromptPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-emerald-500/50 space-y-5 text-slate-900 dark:text-white">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/30 animate-pulse">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black">M-PESA STK Push Prompt Sent!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                STK Push prompt sent to <strong className="text-emerald-500 font-mono">{stkPromptPending.phone}</strong> for{' '}
                <strong>KES {stkPromptPending.amount.toLocaleString()}</strong> ({stkPromptPending.planName}).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Simulated Customer M-PESA PIN
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  maxLength={4}
                  value={simulatedPin}
                  onChange={(e) => setSimulatedPin(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-mono font-bold text-lg text-emerald-500 tracking-widest outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                Enter PIN (e.g., 1234) or click below to simulate instant M-PESA payment callback.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleVerifyMpesaPin('CANCEL')}
                disabled={isVerifyingPin}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel Payment
              </button>
              <button
                type="button"
                onClick={() => handleVerifyMpesaPin('ENTER_PIN')}
                disabled={isVerifyingPin}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
              >
                {isVerifyingPin ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Callback...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm M-PESA PIN & Unlock</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Printable Tax Invoice & Receipt Modal */}
      {selectedInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedInvoiceModal(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Printable Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                    P
                  </div>
                  <span className="text-xl font-black text-slate-900">PesaRequest</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Safaricom Daraja Billing Gateway</p>
                <p className="text-xs text-slate-500">KRA PIN: P051000000Z | Nairobi, Kenya</p>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs uppercase tracking-wider">
                  OFFICIAL TAX INVOICE
                </span>
                <div className="text-lg font-black font-mono text-slate-900 mt-2">{selectedInvoiceModal.id}</div>
                <p className="text-xs text-slate-500">
                  Issued: {new Date(selectedInvoiceModal.issuedAt).toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>

            {/* Customer & Payment Info */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Billed To Business</span>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedInvoiceModal.businessName}</div>
                <div className="text-slate-600 font-mono mt-0.5">{selectedInvoiceModal.customerPhone}</div>
              </div>

              <div>
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Payment Details</span>
                <div className="font-mono font-bold text-slate-900 mt-0.5">
                  Receipt: {selectedInvoiceModal.mpesaReceipt || 'FREE_TIER'}
                </div>
                <div className="text-slate-600 mt-0.5">Method: {selectedInvoiceModal.paymentMethod || 'M-PESA STK Push'}</div>
              </div>
            </div>

            {/* Line Item Table */}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold">
                  <th className="py-2">Subscription Description</th>
                  <th className="py-2">Billing Period</th>
                  <th className="py-2 text-right">Amount (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="py-3 font-bold">
                    {selectedInvoiceModal.planName} Subscription ({selectedInvoiceModal.tier} Tier)
                  </td>
                  <td className="py-3 text-slate-500">
                    {new Date(selectedInvoiceModal.periodStart).toLocaleDateString('en-GB')} —{' '}
                    {new Date(selectedInvoiceModal.periodEnd).toLocaleDateString('en-GB')}
                  </td>
                  <td className="py-3 text-right font-mono font-bold">
                    KES {(selectedInvoiceModal.amountKes - selectedInvoiceModal.vatAmountKes).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Summary Totals */}
            <div className="border-t border-slate-200 pt-4 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">
                  KES {(selectedInvoiceModal.amountKes - selectedInvoiceModal.vatAmountKes).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT (16% Tax):</span>
                <span className="font-mono">KES {selectedInvoiceModal.vatAmountKes.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount Paid:</span>
                <span className="font-mono text-emerald-600">KES {selectedInvoiceModal.amountKes.toLocaleString()}</span>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                <CheckCircle className="w-4 h-4" />
                <span>Verified M-PESA Payment Receipt</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-2 shadow cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Tax Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
