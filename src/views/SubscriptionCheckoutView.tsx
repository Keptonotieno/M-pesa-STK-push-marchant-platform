import React, { useState, useEffect, useCallback } from 'react';
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
  ArrowLeft,
  Sparkles,
  FileText,
  Printer,
  AlertTriangle,
  X,
  Lock,
  Clock,
  Calendar,
  DollarSign,
  Receipt,
  Download,
  HelpCircle,
  ExternalLink,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { Business, SubscriptionPlan, SubscriptionInvoice } from '../types';
import { subscriptionPlans } from '../data/mockData';

export type PaymentState =
  | 'IDLE'            // Initial state, ready for payment initiation
  | 'INITIATING'      // Sending STK Push request to backend
  | 'STK_PUSH_SENT'   // STK push sent to phone, waiting for PIN entry
  | 'VERIFYING'       // Payment received, verifying with Daraja callback
  | 'TIMEOUT'         // 60-second countdown elapsed without response
  | 'CANCELLED'       // STK push request cancelled by user on phone or UI
  | 'FAILED'          // Payment attempt failed (e.g. insufficient funds, invalid PIN)
  | 'SUCCESS';        // Payment confirmed and subscription activated

interface SubscriptionCheckoutViewProps {
  currentBusiness: Business;
  selectedPlanId?: string;
  onBack: () => void;
  onPaymentSuccess: () => void;
}

export const SubscriptionCheckoutView: React.FC<SubscriptionCheckoutViewProps> = ({
  currentBusiness,
  selectedPlanId: initialPlanId,
  onBack,
  onPaymentSuccess,
}) => {
  // Pre-seed plans with default catalog
  const [plans, setPlans] = useState<SubscriptionPlan[]>(subscriptionPlans);
  const [isLoadingPlans, setIsLoadingPlans] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [activePlanId, setActivePlanId] = useState<string>(initialPlanId || 'plan-growth');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [payPhone, setPayPhone] = useState((currentBusiness && currentBusiness.contactPhone) || '0700830335');
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // State Machine Tracking
  const [paymentState, setPaymentState] = useState<PaymentState>('IDLE');
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(60);

  // STK Push Request Data
  const [stkPromptPending, setStkPromptPending] = useState<{
    checkoutRequestId: string;
    merchantRequestId: string;
    planName: string;
    tier: string;
    amount: number;
    phone: string;
    invoice?: SubscriptionInvoice;
  } | null>(null);

  const [simulatedPin, setSimulatedPin] = useState('1234');
  const [isSimulatingAction, setIsSimulatingAction] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    receipt?: string;
    invoiceId?: string;
    message?: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initialPlanId if prop changes
  useEffect(() => {
    if (initialPlanId) {
      setActivePlanId(initialPlanId);
    }
  }, [initialPlanId]);

  // Fetch plans from backend database
  const fetchPlans = useCallback(async () => {
    setIsLoadingPlans(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/subscriptions/plans', {
        headers: { 'x-business-id': (currentBusiness && currentBusiness.id) || 'biz-001' },
      });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.plans) && data.plans.length > 0) {
        setPlans(data.plans);
      } else {
        console.warn('[CheckoutView] Server returned invalid plans list, using default catalog.');
      }
    } catch (err: any) {
      console.error('[CheckoutView] Failed to fetch subscription plans from database:', err);
      setFetchError('Unable to refresh plans from database server. Using cached subscription catalog.');
    } finally {
      setIsLoadingPlans(false);
    }
  }, [currentBusiness]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Safely resolve the target selected plan
  const activePlanTarget = activePlanId || initialPlanId || 'plan-growth';
  const selectedPlan: SubscriptionPlan =
    plans.find(
      (p) =>
        p &&
        (p.id === activePlanTarget ||
          p.tier === activePlanTarget ||
          (p.tier && p.tier.toUpperCase() === activePlanTarget.toUpperCase()) ||
          (p.id && p.id.toLowerCase() === activePlanTarget.toLowerCase()))
    ) ||
    plans.find((p) => p && p.tier === 'GROWTH') ||
    plans[0] ||
    subscriptionPlans[0];

  // Pricing calculations
  const rawPrice = selectedPlan ? selectedPlan.priceKes : 0;
  const cycleDiscount = billingCycle === 'ANNUAL' ? 0.15 : 0;
  const monthlyPriceAfterDiscount = rawPrice * (1 - cycleDiscount);
  const multiplier = billingCycle === 'ANNUAL' ? 12 : 1;
  const subtotal = Math.round(monthlyPriceAfterDiscount * multiplier);
  const vatTax = Math.round(subtotal * 0.16);
  const totalAmount = subtotal + vatTax;

  // Countdown timer for pending STK Push
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (paymentState === 'STK_PUSH_SENT' || paymentState === 'VERIFYING') {
      timer = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer as NodeJS.Timeout);
            setPaymentState('TIMEOUT');
            setErrorMessage('STK Push request timed out after 60 seconds without M-PESA PIN confirmation.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [paymentState]);

  // Real-time polling for payment status
  useEffect(() => {
    if (!stkPromptPending || (paymentState !== 'STK_PUSH_SENT' && paymentState !== 'VERIFYING')) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/stkpush/query-status/${stkPromptPending.checkoutRequestId}`);
        const data = await res.json();

        if (data.success && data.status === 'SUCCESS') {
          setPaymentState('VERIFYING');
          setTimeout(() => {
            setPaymentState('SUCCESS');
            setVerificationResult({
              receipt: data.transaction?.mpesaReceipt || 'QHK91283X4',
              invoiceId: data.invoice?.id || 'INV-2026-SUB',
              message: 'Payment verified with Safaricom Daraja API Gateway! Subscription activated.',
            });
            onPaymentSuccess();
          }, 800);
        } else if (data.success && data.status === 'CANCELLED') {
          setPaymentState('CANCELLED');
          setErrorMessage('M-PESA STK Push request was cancelled on the phone.');
        } else if (data.success && data.status === 'FAILED') {
          setPaymentState('FAILED');
          setErrorMessage(data.transaction?.resultDesc || 'STK Push payment failed. Please check M-PESA balance and try again.');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [stkPromptPending, paymentState, onPaymentSuccess]);

  // Clean phone helper
  const getCleanPhone = () => {
    let clean = payPhone.trim().replace(/\s+/g, '');
    if (clean.startsWith('0')) clean = '+254' + clean.slice(1);
    if (!clean.startsWith('+254') && !clean.startsWith('254')) {
      clean = '+254' + clean;
    }
    return clean;
  };

  // Trigger or Re-trigger STK Push Payment
  const handleInitiatePayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedPlan) return;

    const cleanPhone = getCleanPhone();
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid Safaricom M-PESA phone number.');
      return;
    }

    setPaymentState('INITIATING');
    setErrorMessage(null);
    setIsEditingPhone(false);
    const newAttempt = attemptCount + 1;
    setAttemptCount(newAttempt);

    try {
      // Free plan handles instant switch without M-PESA
      if (selectedPlan.priceKes === 0) {
        const res = await fetch('/api/subscriptions/upgrade', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-business-id': currentBusiness.id,
          },
          body: JSON.stringify({ planId: selectedPlan.id, phone: cleanPhone }),
        });
        const data = await res.json();

        if (data.success) {
          setPaymentState('SUCCESS');
          setVerificationResult({
            receipt: 'FREE_STARTER_TIER',
            message: 'Free Starter Plan activated successfully for 30 days!',
          });
          onPaymentSuccess();
        } else {
          setPaymentState('FAILED');
          setErrorMessage(data.message || 'Failed to activate Free Starter plan.');
        }
        return;
      }

      // Paid plan STK Push initiation
      const res = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': currentBusiness.id,
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          phone: cleanPhone,
          billingCycle,
          amountKes: totalAmount,
        }),
      });

      const data = await res.json();

      if (data.success && data.checkoutRequestId) {
        setStkPromptPending({
          checkoutRequestId: data.checkoutRequestId,
          merchantRequestId: data.merchantRequestId,
          planName: selectedPlan.name,
          tier: selectedPlan.tier,
          amount: totalAmount,
          phone: cleanPhone,
          invoice: data.invoice,
        });
        setCountdownSeconds(60);
        setPaymentState('STK_PUSH_SENT');
      } else {
        setPaymentState('FAILED');
        setErrorMessage(data.message || 'Unable to initiate M-PESA STK Push payment.');
      }
    } catch (err: any) {
      setPaymentState('FAILED');
      setErrorMessage(err.message || 'Network error initiating checkout.');
    }
  };

  // Simulate PIN entry or Cancellation in testing mode
  const handleSimulateAction = async (action: 'ENTER_PIN' | 'CANCEL') => {
    if (!stkPromptPending) return;
    setIsSimulatingAction(true);

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
      setIsSimulatingAction(false);

      if (action === 'ENTER_PIN' && data.success) {
        setPaymentState('VERIFYING');
        setTimeout(() => {
          setPaymentState('SUCCESS');
          setVerificationResult({
            receipt: data.transaction?.mpesaReceipt || 'QHK91283X4',
            invoiceId: stkPromptPending.invoice?.id || 'INV-2026-SUB',
            message: `M-PESA Payment of KES ${stkPromptPending.amount.toLocaleString()} Confirmed! Receipt: ${data.transaction?.mpesaReceipt}`,
          });
          onPaymentSuccess();
        }, 800);
      } else {
        setPaymentState('CANCELLED');
        setErrorMessage(data.message || 'STK Push request was cancelled on phone screen.');
      }
    } catch (err) {
      setIsSimulatingAction(false);
      console.error(err);
    }
  };

  // Reset to initial state
  const handleResetCheckout = () => {
    setStkPromptPending(null);
    setPaymentState('IDLE');
    setErrorMessage(null);
    setCountdownSeconds(60);
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Back to Subscriptions"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                PesaRequest Billing Gateway
              </span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Tenant: {currentBusiness?.name || 'Merchant Workspace'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Subscription Checkout & Payment
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            256-Bit Encrypted Daraja Gateway
          </span>
        </div>
      </div>

      {/* Payment State Machine Tracker Header Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl font-bold ${
              paymentState === 'SUCCESS' ? 'bg-emerald-500 text-slate-950' :
              paymentState === 'STK_PUSH_SENT' || paymentState === 'VERIFYING' || paymentState === 'INITIATING' ? 'bg-amber-500 text-slate-950' :
              paymentState === 'TIMEOUT' || paymentState === 'FAILED' || paymentState === 'CANCELLED' ? 'bg-rose-500 text-white' :
              'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {paymentState === 'INITIATING' || paymentState === 'VERIFYING' ? <RefreshCw className="w-5 h-5 animate-spin" /> :
               paymentState === 'STK_PUSH_SENT' ? <Smartphone className="w-5 h-5 animate-bounce" /> :
               paymentState === 'SUCCESS' ? <CheckCircle className="w-5 h-5" /> :
               paymentState === 'TIMEOUT' ? <Clock className="w-5 h-5" /> :
               paymentState === 'FAILED' || paymentState === 'CANCELLED' ? <AlertTriangle className="w-5 h-5" /> :
               <CreditCard className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Payment Progress
                </span>
                {attemptCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold">
                    Attempt #{attemptCount}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {paymentState === 'IDLE' && 'Select Plan & Initiate M-PESA Checkout'}
                {paymentState === 'INITIATING' && 'Connecting to Safaricom Daraja STK Push Gateway...'}
                {paymentState === 'STK_PUSH_SENT' && `M-PESA Prompt Dispatched — Check Phone (${countdownSeconds}s remaining)`}
                {paymentState === 'VERIFYING' && 'M-PESA Callback Received — Verifying Payment...'}
                {paymentState === 'SUCCESS' && 'Payment Confirmed & Subscription Active!'}
                {paymentState === 'TIMEOUT' && 'STK Push Timed Out (No PIN entered within 60s)'}
                {paymentState === 'CANCELLED' && 'STK Push Cancelled on Phone Screen'}
                {paymentState === 'FAILED' && 'Payment Attempt Unsuccessful'}
              </h3>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            {[
              { id: '1', label: 'Plan', active: true },
              { id: '2', label: 'Prompt', active: ['INITIATING', 'STK_PUSH_SENT', 'VERIFYING', 'SUCCESS', 'TIMEOUT', 'FAILED', 'CANCELLED'].includes(paymentState) },
              { id: '3', label: 'Verify', active: ['VERIFYING', 'SUCCESS'].includes(paymentState) },
              { id: '4', label: 'Active', active: paymentState === 'SUCCESS' },
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                  step.active
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-transparent'
                }`}>
                  <span>{step.id}.</span>
                  <span>{step.label}</span>
                </div>
                {idx < 3 && <span className="text-slate-300 dark:text-slate-700 text-xs">&rarr;</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state skeleton if plans are fetching and empty */}
      {isLoadingPlans && plans.length === 0 && (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Loading Subscription Catalog</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Fetching pricing tiers and workspace feature entitlements...</p>
        </div>
      )}

      {/* Fallback error if selected plan cannot be resolved */}
      {!selectedPlan && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-rose-500/30 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Subscription Plan Selection Required</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {fetchError || `Unable to load details for target plan "${activePlanTarget}". Please select a plan.`}
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold"
            >
              Back to Subscriptions
            </button>
            <button
              onClick={fetchPlans}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
            >
              Retry Loading Plans
            </button>
          </div>
        </div>
      )}

      {selectedPlan && (
      /* Main Grid Layout */
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Plan Selection, Billing Cycle, & M-PESA Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Billing Cycle & Plan Switcher */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  1. Select Subscription Plan & Billing Cycle
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Choose your preferred plan tier and frequency. Save 15% on annual billing.
                </p>
              </div>

              {/* Billing Cycle Toggle */}
              <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center">
                <button
                  type="button"
                  onClick={() => setBillingCycle('MONTHLY')}
                  disabled={paymentState === 'STK_PUSH_SENT' || paymentState === 'VERIFYING'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 ${
                    billingCycle === 'MONTHLY'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('ANNUAL')}
                  disabled={paymentState === 'STK_PUSH_SENT' || paymentState === 'VERIFYING'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 ${
                    billingCycle === 'ANNUAL'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Annual
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-900/20 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-black text-[9px] uppercase">
                    Save 15%
                  </span>
                </button>
              </div>
            </div>

            {/* Plan Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plans.map((plan) => {
                const isSelected = plan.id === activePlanId || plan.tier === selectedPlan?.tier;
                return (
                  <div
                    key={plan.id}
                    onClick={() => {
                      if (paymentState !== 'STK_PUSH_SENT' && paymentState !== 'VERIFYING') {
                        setActivePlanId(plan.id);
                        handleResetCheckout();
                      }
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                        : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {plan.tier === 'GROWTH' && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-sm">
                        Recommended
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {plan.tier} TIER
                        </span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{plan.name}</h3>

                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          KES {plan.priceKes.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">/month</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Branches:</span>
                        <span className="font-bold">{plan.maxBranches === 0 || plan.maxBranches > 500 ? 'Unlimited' : plan.maxBranches}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Staff Accounts:</span>
                        <span className="font-bold">{plan.maxStaff === 0 || plan.maxStaff > 500 ? 'Unlimited' : plan.maxStaff}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Monthly STK Pushes:</span>
                        <span className="font-bold">{plan.maxTransactions === 0 ? 'Unlimited' : `${plan.maxTransactions.toLocaleString()}/mo`}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Payment Method & M-PESA Input */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-500" />
                2. M-PESA STK Push Payment Method
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                An M-PESA prompt will be pushed directly to your phone screen. Enter your PIN to approve.
              </p>
            </div>

            {/* M-PESA Gateway Selector Badge */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500 text-slate-950 font-black">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Lipa na M-PESA STK Push Express
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                      Instant Activation
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-emerald-200/80 mt-0.5">
                    Payee: PesaRequest Master Corporate PayBill <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">522522</span>
                  </p>
                </div>
              </div>

              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            {/* Form Input */}
            <form onSubmit={(e) => handleInitiatePayment(e)} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Safaricom M-PESA Phone Number
                  </label>
                  {(paymentState === 'TIMEOUT' || paymentState === 'FAILED' || paymentState === 'CANCELLED') && (
                    <button
                      type="button"
                      onClick={() => setIsEditingPhone(!isEditingPhone)}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      {isEditingPhone ? 'Lock Phone Number' : 'Change Phone Number'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={payPhone}
                    onChange={(e) => setPayPhone(e.target.value)}
                    placeholder="e.g. 0700830335 or 254712345678"
                    disabled={paymentState === 'STK_PUSH_SENT' || paymentState === 'VERIFYING' || paymentState === 'INITIATING' || (['TIMEOUT', 'FAILED', 'CANCELLED'].includes(paymentState) && !isEditingPhone)}
                    className="w-full px-4 py-3 pl-12 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                    required
                  />
                  <Smartphone className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Format: 07XXXXXXXX, 01XXXXXXXX, or +254XXXXXXXXX
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPayPhone('0700830335');
                      setIsEditingPhone(false);
                    }}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Autofill Test Phone (0700830335)
                  </button>
                </div>
              </div>

              {/* Error Message Display */}
              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold flex items-center gap-2">
                      <span>Payment Message</span>
                      {attemptCount > 0 && <span className="font-mono text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded font-bold">Attempt #{attemptCount}</span>}
                    </h4>
                    <p className="text-[11px] leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Primary Action Button for IDLE state */}
              {paymentState === 'IDLE' && (
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  {selectedPlan.priceKes === 0
                    ? 'Activate Free Starter Plan (0 KES)'
                    : `Pay KES ${totalAmount.toLocaleString()} via M-PESA STK Push`}
                </button>
              )}

              {/* INITIATING State Spinner */}
              {paymentState === 'INITIATING' && (
                <div className="w-full py-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 animate-pulse">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
                  Initiating Safaricom STK Push Request...
                </div>
              )}
            </form>
          </div>

          {/* RETRY WORKFLOW CARD FOR TIMEOUT, CANCELLED, OR FAILED STATES */}
          {['TIMEOUT', 'CANCELLED', 'FAILED'].includes(paymentState) && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-xl space-y-5 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 font-black shrink-0">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] uppercase">
                      Retry Gateway Workflow
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Target Phone: {getCleanPhone()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {paymentState === 'TIMEOUT' ? 'STK Push Expired — Ready to Re-trigger' :
                     paymentState === 'CANCELLED' ? 'Request Cancelled — Retry STK Push' :
                     'Payment Unsuccessful — Try Again'}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You can instantly re-send the M-PESA payment prompt to <strong className="font-mono text-emerald-400">{getCleanPhone()}</strong> or change the phone number above.
                  </p>
                </div>
              </div>

              {/* Retry Control Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleInitiatePayment()}
                  className="py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Re-trigger STK Push (Attempt #{attemptCount + 1})</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetCheckout}
                  className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>Change Plan or Reset</span>
                </button>
              </div>
            </div>
          )}

          {/* Live Phone Simulator & Verification Section */}
          {(paymentState === 'STK_PUSH_SENT' || paymentState === 'VERIFYING') && stkPromptPending && (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {paymentState === 'VERIFYING' ? 'M-PESA Callback Received — Confirming...' : `STK Push Dispatched to ${stkPromptPending.phone}`}
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold uppercase">
                  {countdownSeconds}s Countdown
                </span>
              </div>

              {/* Phone Prompt Simulation Display */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-white space-y-4 max-w-sm mx-auto shadow-2xl">
                <div className="text-center border-b border-slate-800 pb-3">
                  <div className="w-10 h-1 rounded-full bg-slate-700 mx-auto mb-3" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                    Safaricom M-PESA Prompt
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">PesaRequest Billing</h4>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>PayBill Number:</span>
                    <span className="font-mono text-white font-bold">522522</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Account Reference:</span>
                    <span className="font-mono text-white font-bold">SUB-{stkPromptPending.tier}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Amount:</span>
                    <span className="font-mono text-emerald-400 font-bold text-sm">
                      KES {stkPromptPending.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Simulation PIN Input for Testing */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider text-center font-bold">
                    Enter M-PESA PIN to Confirm Payment
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={simulatedPin}
                    onChange={(e) => setSimulatedPin(e.target.value)}
                    className="w-full text-center py-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xl text-emerald-400 tracking-widest outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSimulateAction('ENTER_PIN')}
                      disabled={isSimulatingAction}
                      className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition"
                    >
                      {isSimulatingAction ? 'Processing...' : 'Send PIN (Simulate)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateAction('CANCEL')}
                      disabled={isSimulatingAction}
                      className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                    >
                      Cancel Request
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-amber-500/20">
                <span>Listening for Daraja webhook callbacks...</span>
                <button
                  type="button"
                  onClick={() => setPaymentState('TIMEOUT')}
                  className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                >
                  Simulate Timeout
                </button>
              </div>
            </div>
          )}

          {/* Payment SUCCESS Confirmation */}
          {paymentState === 'SUCCESS' && (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-slate-900 dark:text-white space-y-4 animate-scaleUp">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500 text-slate-950 font-black">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase">
                    Payment Verified & Active
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    🎉 Subscription Upgrade Successful!
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                {verificationResult?.message ||
                  'Your workspace has been upgraded. All plan features and quota limits are now unlocked.'}
              </p>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">M-PESA Receipt Code:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {verificationResult?.receipt || 'QHK91283X4'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Tax Invoice ID:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {verificationResult?.invoiceId || 'INV-2026-SUB'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Activated Tier:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedPlan?.tier || 'ACTIVE'} TIER</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition"
                >
                  Return to Dashboard & Start Using Features
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 sticky top-6">
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Order Summary
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {selectedPlan?.name || 'Subscription'} Subscription
              </h3>
            </div>

            {/* Included Features List */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                Included Features & Capabilities
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {(selectedPlan?.features || []).map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price Itemization */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Billing Period:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {billingCycle === 'ANNUAL' ? '12 Months (1 Year)' : '1 Month'}
                </span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Base Plan Price:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  KES {subtotal.toLocaleString()}
                </span>
              </div>

              {billingCycle === 'ANNUAL' && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Annual Discount (15%):</span>
                  <span>- KES {Math.round(rawPrice * 12 * 0.15).toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>KRA VAT Tax (16%):</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  KES {vatTax.toLocaleString()}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-900 dark:text-white uppercase">Total Amount Due:</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  KES {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Tax Compliance & Guarantees */}
            <div className="space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Instant KRA ETIMS compliant Tax Invoice provided upon payment</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Cancel auto-renewal at any time without penalty</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>24/7 Priority Support included with Professional & Enterprise tiers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
