import React from 'react';
import {
  LayoutDashboard,
  Send,
  Receipt,
  Users,
  Building2,
  GitBranch,
  UserCheck,
  BarChart3,
  CreditCard,
  Bell,
  Settings,
  HelpCircle,
  User,
  Globe,
  ShieldCheck,
  ChevronRight,
  Activity,
  X,
} from 'lucide-react';
import { UserRole, Business } from '../types';

interface Props {
  activeView: string;
  onNavigate: (view: string) => void;
  userRole: UserRole;
  currentBusiness: Business;
  onOpenSendModal: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  isAction?: boolean;
  minRole?: string;
}

export const Sidebar: React.FC<Props> = ({
  activeView,
  onNavigate,
  userRole,
  currentBusiness,
  onOpenSendModal,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const menuGroups: { title: string; items: MenuItem[] }[] = [
    {
      title: 'PUBLIC & OVERVIEW',
      items: [
        { id: 'landing', label: 'Landing Page', icon: Globe },
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'M-PESA PAYMENTS',
      items: [
        { id: 'send-payment', label: 'Send STK Push', icon: Send, isAction: true },
        { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
        { id: 'transactions', label: 'Transaction History', icon: Receipt },
        { id: 'customers', label: 'Customers (CRM)', icon: Users },
      ],
    },
    {
      title: 'ENTERPRISE MANAGEMENT',
      items: [
        { id: 'businesses', label: 'Businesses', icon: Building2, minRole: 'SUPER_ADMIN' },
        { id: 'branches', label: 'Branches & Tills', icon: GitBranch },
        { id: 'staff', label: 'Staff & Roles', icon: UserCheck, minRole: 'MANAGER' },
      ],
    },
    {
      title: 'ANALYTICS & BILLING',
      items: [
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
        { id: 'subscriptions', label: 'Subscriptions & Billing', icon: CreditCard },
        { id: 'notifications', label: 'Notifications', icon: Bell },
      ],
    },
    {
      title: 'SYSTEM & HELP',
      items: [
        { id: 'monitoring', label: 'Integration Health', icon: Activity, minRole: 'MANAGER' },
        { id: 'audit-logs', label: 'Security & Audit Logs', icon: ShieldCheck, minRole: 'MANAGER' },
        { id: 'settings', label: 'Daraja & Settings', icon: Settings, minRole: 'MANAGER' },
        { id: 'help', label: 'Help & Support', icon: HelpCircle },
        { id: 'profile', label: 'User Profile', icon: User },
      ],
    },
  ];

  const handleItemClick = (action: () => void) => {
    action();
    if (onCloseMobile) onCloseMobile();
  };

  const renderContent = () => (
    <div className="flex flex-col h-full select-none">
      {/* Brand Branding Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
        <div
          onClick={() => handleItemClick(() => onNavigate('dashboard'))}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
            P
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              PesaRequest
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h1>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">M-PESA STK Merchant Platform</p>
          </div>
        </div>

        {/* Mobile Close Drawer Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close Navigation Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Active Business Banner */}
      <div className="mx-3 sm:mx-4 mt-4 p-3 rounded-2xl bg-slate-100 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 font-bold text-xs">
            {currentBusiness?.name ? currentBusiness.name.charAt(0).toUpperCase() : 'P'}
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentBusiness?.name || 'PesaRequest Merchant'}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Till: {currentBusiness?.tillNumber || '174379'}</div>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 uppercase shrink-0">
          {currentBusiness?.subscriptionTier || 'PROFESSIONAL'}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {menuGroups.map((group) => {
          // Filter items based on user role
          const visibleItems = group.items.filter((item) => {
            if (!item.minRole) return true;
            if (userRole === 'SUPER_ADMIN') return true;
            if (item.minRole === 'MANAGER') return userRole === 'BUSINESS_OWNER' || userRole === 'MANAGER';
            return userRole === item.minRole;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-1">
                {group.title}
              </div>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;

                if (item.isAction) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(onOpenSendModal)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-900/20 transition group cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-emerald-200 shrink-0" />
                        <span>{item.label}</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-300 group-hover:translate-x-0.5 transition shrink-0" />
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(() => onNavigate(item.id))}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer Security Badge */}
      <div className="p-4 border-t border-slate-200 dark:border-white/10 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <span>Safaricom Compliant</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">v1.0.4</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl text-slate-800 dark:text-slate-300 flex-col border-r border-slate-200 dark:border-white/10 shrink-0 h-screen sticky top-0 overflow-hidden z-30 transition-colors">
        {renderContent()}
      </aside>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Slide-over Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-slate-950 shadow-2xl border-r border-slate-200 dark:border-white/10 z-50 flex flex-col">
            {renderContent()}
          </div>
        </div>
      )}
    </>
  );
};

