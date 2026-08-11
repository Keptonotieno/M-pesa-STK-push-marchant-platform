import React from 'react';
import { ShieldAlert, Zap, X, Check, ArrowRight, Lock, Building2, Users, Smartphone } from 'lucide-react';
import { SubscriptionTier } from '../types';

interface UpgradeRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeClick: (targetPlanId?: string) => void;
  title?: string;
  message?: string;
  currentTier?: SubscriptionTier;
  limitType?: 'BRANCHES' | 'STAFF' | 'TRANSACTIONS' | 'EXPIRED' | 'FEATURE';
  currentUsage?: number;
  maxLimit?: number;
}

export const UpgradeRequiredModal: React.FC<UpgradeRequiredModalProps> = ({
  isOpen,
  onClose,
  onUpgradeClick,
  title = 'Subscription Plan Limit Reached',
  message = 'Your current plan limits have been reached. Upgrade your subscription to unlock additional capacity and premium features.',
  currentTier = 'STARTER',
  limitType = 'BRANCHES',
  currentUsage = 2,
  maxLimit = 2,
}) => {
  if (!isOpen) return null;

  const getRecommendedPlan = () => {
    if (currentTier === 'FREE') return { id: 'plan-starter', name: 'Basic Merchant', price: 'KES 1,500/mo' };
    if (currentTier === 'STARTER') return { id: 'plan-growth', name: 'Professional Plan', price: 'KES 4,500/mo' };
    return { id: 'plan-enterprise', name: 'Enterprise Ultra', price: 'KES 12,500/mo' };
  };

  const recPlan = getRecommendedPlan();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Banner */}
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
            {limitType === 'BRANCHES' && <Building2 className="w-7 h-7" />}
            {limitType === 'STAFF' && <Users className="w-7 h-7" />}
            {limitType === 'TRANSACTIONS' && <Smartphone className="w-7 h-7" />}
            {(limitType === 'EXPIRED' || limitType === 'FEATURE') && <Lock className="w-7 h-7" />}
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wider">
              {limitType === 'EXPIRED' ? 'Subscription Expired' : 'Quota Limit Exceeded'}
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{title}</h3>
          </div>
        </div>

        {/* Message */}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>

        {/* Usage Bar if applicable */}
        {maxLimit > 0 && limitType !== 'EXPIRED' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Current Usage ({currentTier} Tier):</span>
              <span className="text-amber-600 dark:text-amber-400 font-mono">
                {currentUsage} / {maxLimit} Used
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (currentUsage / maxLimit) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Recommended Plan Promo Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Recommended Upgrade</span>
            </div>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {recPlan.price}
            </span>
          </div>

          <div className="text-sm font-black text-slate-900 dark:text-white">{recPlan.name}</div>

          <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Expand branches & multi-location tills</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Invite more cashiers, managers & accountants with granular RBAC</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Higher monthly STK Push limits & priority webhook routing</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onUpgradeClick(recPlan.id);
            }}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-emerald-500/20 transition flex items-center justify-center gap-2"
          >
            Upgrade Plan Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
