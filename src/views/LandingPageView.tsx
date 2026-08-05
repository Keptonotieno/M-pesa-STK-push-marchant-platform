import React, { useState } from 'react';
import {
  Send,
  ShieldCheck,
  Zap,
  CheckCircle,
  Smartphone,
  Building2,
  Lock,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Users,
  Star,
  Sparkles,
  ChevronRight,
  Calculator,
} from 'lucide-react';
import { subscriptionPlans } from '../data/mockData';

interface Props {
  onGetStarted: () => void;
  onOpenSendModal: () => void;
}

export const LandingPageView: React.FC<Props> = ({
  onGetStarted,
  onOpenSendModal,
}) => {
  const [calcAmount, setCalcAmount] = useState('2500');

  const amountNum = Number(calcAmount) || 0;
  // M-PESA Till STK push transaction fee simulation (~0.5% max KES 25)
  const estimatedFee = Math.min(Math.round(amountNum * 0.005), 25);
  const netSettlement = amountNum - estimatedFee;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-center text-xs font-bold text-white flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4" />
        <span>Safaricom M-PESA Daraja 2.0 STK Push Gateway for Enterprise Businesses in Kenya</span>
        <button
          onClick={onGetStarted}
          className="ml-2 px-2.5 py-0.5 rounded-full bg-slate-900 text-emerald-300 text-[10px] hover:bg-slate-800 transition"
        >
          Launch Portal →
        </button>
      </div>

      {/* Hero Header */}
      <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 text-center flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6">
          <ShieldCheck className="w-4 h-4" />
          <span>Trusted by 1,200+ Businesses Across Nairobi, Mombasa & Kisumu</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl">
          Send M-PESA Payment Requests to Customers in <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">1 Second</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          No manual Paybill typing. Enter customer phone number and amount to trigger an instant M-PESA PIN prompt on their phone screen.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center gap-2 transition transform hover:-translate-y-0.5"
          >
            <span>Launch Merchant Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSendModal}
            className="px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm rounded-2xl shadow-lg flex items-center gap-2 transition"
          >
            <Send className="w-4 h-4 text-emerald-400" />
            <span>Send STK Push Request</span>
          </button>
        </div>

        {/* Features Chips */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>0.0s Callback Notification</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Multi-Branch & Till Management</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>KRA PIN & Daraja 2.0 Compliant</span>
          </div>
        </div>
      </div>

      {/* Interactive Calculator Section */}
      <div className="bg-slate-900/60 border-y border-slate-800 py-16">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-3">
              <Calculator className="w-4 h-4" /> M-PESA Fee Estimator
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Transparent, Low-Cost STK Push Settlements
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Calculate your exact M-PESA transaction fee and net merchant settlement instantly. Enjoy zero setup fees and immediate automated bank or till reconciliation.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Enter Sale Amount (KES)</label>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-lg font-bold text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
              Settlement Breakdown
            </h3>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Requested Payment:</span>
              <span className="text-white font-bold font-mono">KES {amountNum.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Estimated STK Push Fee (~0.5%):</span>
              <span className="text-emerald-400 font-bold font-mono">KES {estimatedFee}</span>
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-sm font-bold text-white">Net Business Settlement:</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                KES {netSettlement.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white">Simple, Predictable Subscription Plans</h2>
          <p className="text-xs text-slate-400 mt-2">Scale your business from a single shop to nationwide retail chains.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className={`p-6 rounded-3xl border flex flex-col justify-between transition ${
                plan.tier === 'GROWTH'
                  ? 'bg-gradient-to-b from-slate-900 to-emerald-950/40 border-emerald-500 shadow-2xl relative scale-105'
                  : 'bg-slate-900/40 border-slate-800'
              }`}
            >
              {plan.tier === 'GROWTH' && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase">
                  Most Popular
                </span>
              )}
              <div>
                <h3 className="text-base font-bold text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-white">KES {plan.priceKes.toLocaleString()}</span>
                  <span className="text-xs text-slate-400 ml-1">/month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={onGetStarted}
                className={`mt-8 w-full py-3 rounded-xl font-bold text-xs transition ${
                  plan.tier === 'GROWTH'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                Select {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
