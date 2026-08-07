import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bell,
  Sun,
  Moon,
  Search,
  UserCheck,
  Building,
  Store,
  LogOut,
  Sparkles,
  ChevronDown,
  X,
  ArrowRight,
  Receipt,
  Phone,
  User as UserIcon,
  Menu,
} from 'lucide-react';
import { User, UserRole, Business, Branch, NotificationItem, Transaction } from '../types';

interface Props {
  currentUser: User;
  currentBusiness: Business;
  branches: Branch[];
  activeBranchId: string;
  onBranchChange: (branchId: string) => void;
  onRoleChange: (role: UserRole) => void;
  onOpenSendModal: () => void;
  notifications: NotificationItem[];
  onMarkNotificationsRead: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNavigate: (view: string) => void;
  onSignOut?: () => void;
  transactions?: Transaction[];
  onToggleMobileMenu?: () => void;
}

export const formatRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'BUSINESS_OWNER':
      return 'Business Owner';
    case 'MANAGER':
      return 'Manager';
    case 'BRANCH_MANAGER':
      return 'Branch Manager';
    case 'CASHIER':
      return 'Cashier';
    case 'ACCOUNTANT':
      return 'Accountant';
    case 'AUDITOR':
      return 'Auditor';
    case 'SUPPORT_STAFF':
      return 'Support Staff';
    default:
      return role;
  }
};

export const getUserInitials = (name?: string): string => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

export const Header: React.FC<Props> = ({
  currentUser,
  currentBusiness,
  branches,
  activeBranchId,
  onBranchChange,
  onRoleChange,
  onOpenSendModal,
  notifications,
  onMarkNotificationsRead,
  darkMode,
  onToggleDarkMode,
  onNavigate,
  onSignOut,
  transactions = [],
  onToggleMobileMenu,
}) => {
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Global Transaction Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchPopover, setShowSearchPopover] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cleanQuery = searchQuery.trim().toLowerCase();
  const matchingTransactions = cleanQuery && transactions
    ? transactions.filter((t) => {
        const phoneMatch = t.customerPhone?.toLowerCase().includes(cleanQuery);
        const nameMatch = t.customerName?.toLowerCase().includes(cleanQuery);
        const idMatch = t.id?.toLowerCase().includes(cleanQuery);
        const mpesaMatch = t.mpesaReceipt?.toLowerCase().includes(cleanQuery);
        const descMatch = t.description?.toLowerCase().includes(cleanQuery);
        const accMatch = t.accountNumber?.toLowerCase().includes(cleanQuery);
        const shortcodeMatch = t.shortcodeOrNumber?.toLowerCase().includes(cleanQuery);
        return phoneMatch || nameMatch || idMatch || mpesaMatch || descMatch || accMatch || shortcodeMatch;
      })
    : [];

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Determine if current user is allowed multi-branch access
  const MULTI_BRANCH_ROLES: UserRole[] = ['SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'];
  const canAccessMultipleBranches = MULTI_BRANCH_ROLES.includes(currentUser.role) && !currentUser.branchId;

  const assignedBranch = branches.find((b) => b.id === (currentUser.branchId || activeBranchId)) || branches[0];

  return (
    <header className="sticky top-0 z-40 glass-header px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 transition-colors border-b border-slate-200/80 dark:border-white/10">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Menu Toggle & Search Bar */}
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-xl">
          {/* Mobile Hamburger Toggle */}
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
              title="Open Navigation Menu"
              aria-label="Toggle Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Search Input */}
          <div ref={searchContainerRef} className="relative w-full">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchPopover(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setShowSearchPopover(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShowSearchPopover(false);
                    onNavigate('transactions');
                  } else if (e.key === 'Escape') {
                    setShowSearchPopover(false);
                  }
                }}
                placeholder="Search transactions..."
                className="w-full pl-9 pr-8 py-2 min-h-[44px] sm:min-h-0 rounded-xl glass-input text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 sm:top-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchPopover(false);
                  }}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Global Search Results Dropdown Popover */}
            {showSearchPopover && cleanQuery.length > 0 && (
              <div className="absolute left-0 top-full mt-2 w-full min-w-[280px] sm:min-w-[380px] md:min-w-[420px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Search Results ({matchingTransactions.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSearchPopover(false);
                      onNavigate('transactions');
                    }}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
                  {matchingTransactions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                      No transactions found matching "<span className="font-semibold text-slate-700 dark:text-slate-300">{searchQuery}</span>"
                    </div>
                  ) : (
                    matchingTransactions.slice(0, 6).map((tx) => (
                      <div
                        key={tx.id}
                        onClick={() => {
                          setShowSearchPopover(false);
                          onNavigate('transactions');
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10 border border-slate-200/80 dark:border-slate-800/80 transition cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            <Receipt className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{tx.mpesaReceipt || tx.id}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase shrink-0 ${
                              tx.status === 'SUCCESS'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : tx.status === 'PENDING'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1 truncate">
                            <UserIcon className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{tx.customerName || 'Customer'}</span>
                          </div>
                          <div className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                            KES {tx.amount.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1 truncate">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-mono">{tx.customerPhone}</span>
                          </div>
                          <div className="text-right text-[10px] text-slate-400">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {matchingTransactions.length > 6 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSearchPopover(false);
                        onNavigate('transactions');
                      }}
                      className="text-[11px] font-bold text-slate-500 hover:text-emerald-500 transition cursor-pointer"
                    >
                      + {matchingTransactions.length - 6} more result(s). Click to view all →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Tenant Business Name Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <Building className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-bold truncate max-w-[120px]">{currentBusiness.name}</span>
          </div>

          {/* User Role Badge */}
          <div className="hidden sm:flex px-2.5 py-1.5 rounded-xl glass-card text-xs font-semibold text-slate-700 dark:text-slate-200 items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="hidden md:inline text-slate-400">Role:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[100px] md:max-w-none">
              {formatRoleLabel(currentUser.role)}
            </span>
          </div>

          {/* Branch Control */}
          {canAccessMultipleBranches ? (
            <select
              value={activeBranchId}
              onChange={(e) => onBranchChange(e.target.value)}
              className="hidden lg:block px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="ALL">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Till {b.tillNumber})
                </option>
              ))}
            </select>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Store className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-bold truncate max-w-[100px]">{assignedBranch?.name || 'Assigned Branch'}</span>
            </div>
          )}

          {/* Send STK Push CTA */}
          <button
            onClick={onOpenSendModal}
            className="px-3 py-2 sm:px-3.5 sm:py-2 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition cursor-pointer"
            title="Send STK Push"
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Send STK Push</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifPopover(!showNotifPopover);
                if (!showNotifPopover) onMarkNotificationsRead();
              }}
              className="p-2 sm:p-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition relative flex items-center justify-center cursor-pointer"
              title="M-PESA Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifPopover && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">M-PESA Notifications</span>
                  <button
                    onClick={() => {
                      onNavigate('notifications');
                      setShowNotifPopover(false);
                    }}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">No new notifications</div>
                  ) : (
                    notifications.slice(0, 4).map((n) => (
                      <div
                        key={n.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs space-y-0.5"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                          <span>{n.title}</span>
                          {n.amount && <span className="text-emerald-500">KES {n.amount.toLocaleString()}</span>}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{n.message}</p>
                        <div className="text-[9px] text-slate-400">{new Date(n.createdAt).toLocaleTimeString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 sm:p-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition flex items-center justify-center cursor-pointer"
            title="Toggle Light / Dark Mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User Profile Avatar / Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1 p-1 min-h-[44px] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-xl object-cover border border-emerald-500/40"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-xs flex items-center justify-center border border-emerald-500/40 shadow-sm">
                  {getUserInitials(currentUser.name)}
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in duration-150">
                {/* User Details */}
                <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover border border-emerald-500/40"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-sm flex items-center justify-center border border-emerald-500/40 shadow-sm">
                      {getUserInitials(currentUser.name)}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-bold">
                        {formatRoleLabel(currentUser.role)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium cursor-pointer min-h-[40px] flex items-center"
                  >
                    User Account & Profile
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('settings');
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium cursor-pointer min-h-[40px] flex items-center"
                  >
                    Daraja & Webhook Settings
                  </button>
                </div>

                {/* Role QA / Testing Selector */}
                <div className="mt-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" /> QA Test Account Role
                  </div>
                  <div className="grid grid-cols-1 gap-1 px-1 mt-1">
                    {[
                      { role: 'BUSINESS_OWNER', label: 'Business Owner' },
                      { role: 'MANAGER', label: 'Manager' },
                      { role: 'BRANCH_MANAGER', label: 'Branch Manager' },
                      { role: 'CASHIER', label: 'Cashier' },
                      { role: 'SUPER_ADMIN', label: 'Super Admin' },
                    ].map((r) => (
                      <button
                        key={r.role}
                        onClick={() => {
                          onRoleChange(r.role as UserRole);
                          setShowUserDropdown(false);
                        }}
                        className={`text-left px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition flex items-center justify-between cursor-pointer min-h-[36px] ${
                          currentUser.role === r.role
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>{r.label}</span>
                        {currentUser.role === r.role && <span className="text-[9px] font-mono text-emerald-500">Active</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      if (onSignOut) {
                        onSignOut();
                      } else {
                        onNavigate('landing');
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-2 font-semibold cursor-pointer min-h-[40px]"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

