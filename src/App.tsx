import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SendPaymentModal } from './components/SendPaymentModal';
import { ErrorBoundary } from './components/ErrorBoundary';

import { LandingPageView } from './views/LandingPageView';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { CustomersView } from './views/CustomersView';
import { BranchesView } from './views/BranchesView';
import { StaffView } from './views/StaffView';
import { ReportsView } from './views/ReportsView';
import { SubscriptionsView } from './views/SubscriptionsView';
import { NotificationsView } from './views/NotificationsView';
import { SettingsView } from './views/SettingsView';
import { MonitoringView } from './views/MonitoringView';
import { AuditLogsView } from './views/AuditLogsView';
import { HelpView } from './views/HelpView';
import { ProfileView } from './views/ProfileView';
import { BusinessesView } from './views/BusinessesView';
import { PaymentMethodsView } from './views/PaymentMethodsView';
import { AuthView } from './views/AuthView';
import { AlertTriangle } from 'lucide-react';

import { auth, logoutFirebase } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import {
  subscribeToBusiness,
  subscribeToTransactions,
  subscribeToCustomers,
  subscribeToBranches,
  subscribeToPaymentMethods,
  saveTransactionToFirestore,
  saveCustomerToFirestore,
  saveBranchToFirestore,
  saveBusinessToFirestore,
  savePaymentMethodToFirestore,
  deletePaymentMethodFromFirestore,
  saveUserToFirestore,
  subscribeToUser,
} from './lib/firestoreService';

import {
  User,
  Business,
  Branch,
  Customer,
  Transaction,
  NotificationItem,
  AuditLog,
  AnalyticsSummary,
  UserRole,
  PaymentMethodConfig,
} from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [activeBranchId, setActiveBranchId] = useState<string>('ALL');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);

  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync dark mode class on document.documentElement for Tailwind dark utilities & custom CSS
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial Data Fetch with Tenant Scoping & Branch Filtering
  const fetchData = async (targetBizId?: string, targetBranchId?: string) => {
    try {
      const activeBizId = targetBizId || business?.id;
      const bId = targetBranchId !== undefined ? targetBranchId : activeBranchId;
      const reqHeaders: Record<string, string> = {};
      if (activeBizId) {
        reqHeaders['x-business-id'] = activeBizId;
      }

      const safeFetchJson = async (url: string, options?: RequestInit) => {
        try {
          const res = await fetch(url, options);
          const contentType = res.headers.get('content-type') || '';
          if (!res.ok || !contentType.includes('application/json')) {
            console.warn(`Non-JSON or non-OK response from ${url}: HTTP ${res.status}`);
            return null;
          }
          return await res.json();
        } catch (e) {
          console.error(`Fetch exception for ${url}:`, e);
          return null;
        }
      };

      const meData = await safeFetchJson(`/api/auth/me${activeBizId ? `?businessId=${activeBizId}` : ''}`, { headers: reqHeaders });
      if (meData) {
        if (meData.user) {
          // Preserve role and avatar if already set locally or from Firestore
          setCurrentUser((prev) => (prev ? { ...meData.user, role: prev.role, avatar: prev.avatar ?? meData.user.avatar } : meData.user));
        }
        if (meData.business) setBusiness(meData.business);
      }

      const [txData, custData, brData, pmData, staffData, analyticsData, notifData, auditData] = await Promise.all([
        safeFetchJson('/api/transactions', { headers: reqHeaders }),
        safeFetchJson('/api/customers', { headers: reqHeaders }),
        safeFetchJson('/api/branches', { headers: reqHeaders }),
        safeFetchJson('/api/payment-methods', { headers: reqHeaders }),
        safeFetchJson('/api/staff', { headers: reqHeaders }),
        safeFetchJson(`/api/analytics/dashboard?branchId=${encodeURIComponent(bId)}`, { headers: reqHeaders }),
        safeFetchJson('/api/notifications', { headers: reqHeaders }),
        safeFetchJson('/api/audit-logs', { headers: reqHeaders }),
      ]);

      if (txData) setTransactions(txData.transactions || []);
      if (custData) setCustomers(custData.customers || []);
      if (brData) setBranches(brData.branches || []);
      if (pmData) setPaymentMethods(pmData.paymentMethods || []);
      if (staffData) setStaffUsers(staffData.users || []);
      if (analyticsData) setAnalytics(analyticsData);
      if (notifData) setNotifications(notifData.notifications || []);
      if (auditData) setAuditLogs(auditData.logs || []);
    } catch (err) {
      console.error('Error fetching PesaRequest data:', err);
    }
  };

  // Firebase Auth State Listener & Firestore User Sync
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const unsubUserDoc = subscribeToUser(fbUser.uid, (firestoreUser) => {
          if (firestoreUser) {
            setCurrentUser(firestoreUser);
          } else {
            // Document doesn't exist yet, seed initial user profile in Firestore
            const initialProfile: User = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Authenticated User',
              email: fbUser.email || '',
              phone: fbUser.phoneNumber || '+254 700 000 000',
              role: 'BUSINESS_OWNER',
              businessId: business?.id || 'biz-001',
              status: 'ACTIVE',
              createdAt: new Date().toISOString(),
            };
            saveUserToFirestore(initialProfile);
            setCurrentUser(initialProfile);
          }
        });
        return () => unsubUserDoc();
      }
    });

    return () => unsubAuth();
  }, [business?.id]);

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time polling auto-refresh effect (user-toggleable to save API load & quota)
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchData(business?.id, activeBranchId);
    }, 10000); // Polling every 10s when active

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, business?.id, activeBranchId]);

  // Set up real-time Firestore collection subscribers for live tenant data
  useEffect(() => {
    if (!business?.id) return;

    const unsubBiz = subscribeToBusiness(business.id, (liveBiz) => {
      if (liveBiz) {
        setBusiness(liveBiz);
      }
    });

    const unsubTx = subscribeToTransactions(business.id, (liveTxs) => {
      if (liveTxs && liveTxs.length > 0) {
        setTransactions(liveTxs);
      }
    });

    const unsubCust = subscribeToCustomers(business.id, (liveCusts) => {
      if (liveCusts && liveCusts.length > 0) {
        setCustomers(liveCusts);
      }
    });

    const unsubBr = subscribeToBranches(business.id, (liveBranches) => {
      if (liveBranches && liveBranches.length > 0) {
        setBranches(liveBranches);
      }
    });

    const unsubPm = subscribeToPaymentMethods(business.id, (livePm) => {
      if (livePm && livePm.length > 0) {
        setPaymentMethods(livePm);
      }
    });

    return () => {
      unsubBiz();
      unsubTx();
      unsubCust();
      unsubBr();
      unsubPm();
    };
  }, [business?.id]);

  // Payment Method CRUD Handlers
  const handleAddPaymentMethod = async (methodData: Partial<PaymentMethodConfig>) => {
    const res = await fetch('/api/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(methodData),
    });
    const data = await res.json();
    if (data.success && data.paymentMethod) {
      setPaymentMethods((prev) => [data.paymentMethod, ...prev]);
      await savePaymentMethodToFirestore(data.paymentMethod);
    }
  };

  const handleUpdatePaymentMethod = async (id: string, updates: Partial<PaymentMethodConfig>) => {
    const res = await fetch(`/api/payment-methods/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.success && data.paymentMethod) {
      setPaymentMethods((prev) =>
        prev.map((pm) => (pm.id === id ? data.paymentMethod : updates.isDefault ? { ...pm, isDefault: false } : pm))
      );
      await savePaymentMethodToFirestore(data.paymentMethod);
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    const activeBizId = business?.id;
    const reqHeaders: Record<string, string> = {};
    if (activeBizId) reqHeaders['x-business-id'] = activeBizId;

    const res = await fetch(`/api/payment-methods/${id}`, { method: 'DELETE', headers: reqHeaders });
    const data = await res.json();
    if (data.success) {
      setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
      await deletePaymentMethodFromFirestore(id);
      fetchData(activeBizId, activeBranchId);
    } else {
      throw new Error(data.message || 'Failed to delete payment method');
    }
  };

  const handleSetDefaultPaymentMethod = async (id: string) => {
    await handleUpdatePaymentMethod(id, { isDefault: true });
  };

  // Handle STK Push sent
  const handleStkPushSent = async (tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev]);
    await saveTransactionToFirestore(tx);
    fetchData();
  };

  // Handle Role Change for RBAC evaluation & QA testing
  const handleRoleChange = async (newRole: UserRole) => {
    if (currentUser) {
      // Restrict branch for cashiers or branch managers
      const assignedBranchId =
        newRole === 'CASHIER' || newRole === 'BRANCH_MANAGER'
          ? currentUser.branchId || branches[0]?.id || 'br-001'
          : undefined;

      const updated: User = { ...currentUser, role: newRole, branchId: assignedBranchId };
      setCurrentUser(updated);

      if (assignedBranchId) {
        setActiveBranchId(assignedBranchId);
      } else {
        setActiveBranchId('ALL');
      }

      await saveUserToFirestore(updated);
      fetchData(business?.id, assignedBranchId || 'ALL');
    }
  };

  const handleSimulateAction = async (checkoutRequestId: string, action: 'ENTER_PIN' | 'CANCEL', pin?: string) => {
    try {
      await fetch('/api/stkpush/simulate-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutRequestId, action, pin }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpgradePlan = async (planId: string, phone: string) => {
    try {
      const activeBizId = business?.id;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (activeBizId) headers['x-business-id'] = activeBizId;

      const res = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers,
        body: JSON.stringify({ planId, phone }),
      });
      const data = await res.json();
      if (data.success && data.business) {
        setBusiness(data.business);
        saveBusinessToFirestore(data.business);
        fetchData(data.business.id);
      }
    } catch (err) {
      console.error('Failed to upgrade subscription plan:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await logoutFirebase();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setCurrentUser(null);
    setBusiness(null);
    setActiveView('dashboard');
  };

  const handleSwitchTenant = async (bizId: string) => {
    try {
      const res = await fetch('/api/auth/switch-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: bizId }),
      });
      const data = await res.json();
      if (data.success) {
        setBusiness(data.business);
        setCurrentUser(data.user);
        fetchData(data.business.id);
      }
    } catch (err) {
      console.error('Failed to switch tenant workspace:', err);
    }
  };

  if (!currentUser || !business) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <AuthView
          onLoginSuccess={(u, b) => {
            setCurrentUser(u);
            setBusiness(b);
            fetchData(b.id);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex relative overflow-hidden`}>
      {/* Frosted Glass Ambient Lighting Effects */}
      <div className="fixed top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="fixed bottom-0 left-1/3 -ml-20 -mb-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed top-1/2 left-0 -ml-40 w-[450px] h-[450px] bg-teal-500/10 rounded-full blur-[130px] pointer-events-none z-0"></div>

      {/* Sidebar Navigation */}
      {activeView !== 'landing' && (
        <ErrorBoundary fallbackTitle="Navigation Sidebar Recovered">
          <Sidebar
            activeView={activeView}
            onNavigate={setActiveView}
            userRole={currentUser.role}
            currentBusiness={business}
            onOpenSendModal={() => setIsSendModalOpen(true)}
            mobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
        </ErrorBoundary>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Subscription Expired / Suspended Global Banner */}
        {business && (business.subscriptionStatus === 'EXPIRED' || business.subscriptionStatus === 'SUSPENDED') && (
          <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white text-xs px-4 py-2.5 font-bold flex items-center justify-between shadow-md z-40 border-b border-rose-500/30 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
              <span>
                <strong>Subscription {business.subscriptionStatus}:</strong> Your workspace subscription is {business.subscriptionStatus.toLowerCase()}. Payment processing operations are locked. Renew via M-PESA to restore access.
              </span>
            </div>
            <button
              onClick={() => setActiveView('subscriptions')}
              className="bg-white text-rose-700 hover:bg-rose-50 px-3 py-1 rounded-lg text-[11px] font-black transition cursor-pointer shrink-0 shadow-sm ml-4"
            >
              Renew Subscription →
            </button>
          </div>
        )}

        {/* Top Header */}
        <Header
          currentUser={currentUser}
          currentBusiness={business}
          branches={branches}
          activeBranchId={activeBranchId}
          onBranchChange={setActiveBranchId}
          onRoleChange={handleRoleChange}
          onOpenSendModal={() => setIsSendModalOpen(true)}
          notifications={notifications}
          onMarkNotificationsRead={() => {
            fetch('/api/notifications/mark-read', { method: 'POST' });
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          }}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onNavigate={setActiveView}
          onSignOut={handleSignOut}
          transactions={transactions}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary fallbackTitle="View Screen Recovered">
            {activeView === 'landing' && (
              <LandingPageView
                onGetStarted={() => setActiveView('dashboard')}
                onOpenSendModal={() => setIsSendModalOpen(true)}
              />
            )}

          {activeView === 'dashboard' && (
            <DashboardView
              analytics={analytics}
              branches={branches}
              activeBranchId={activeBranchId}
              onSelectBranch={(branchId) => {
                setActiveBranchId(branchId);
                fetchData(business?.id, branchId);
              }}
              autoRefreshEnabled={autoRefreshEnabled}
              onToggleAutoRefresh={(enabled) => setAutoRefreshEnabled(enabled)}
              onOpenSendModal={() => setIsSendModalOpen(true)}
              onNavigate={setActiveView}
              userRole={currentUser.role}
              onRefreshData={() => fetchData(business?.id, activeBranchId)}
              onAddBranch={async (b) => {
                const activeBizId = business?.id;
                const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
                if (activeBizId) reqHeaders['x-business-id'] = activeBizId;

                await fetch('/api/branches', {
                  method: 'POST',
                  headers: reqHeaders,
                  body: JSON.stringify(b),
                });
                fetchData(activeBizId, activeBranchId);
              }}
            />
          )}

          {activeView === 'payment-methods' && (
            <PaymentMethodsView
              paymentMethods={paymentMethods}
              branches={branches}
              onAddPaymentMethod={handleAddPaymentMethod}
              onUpdatePaymentMethod={handleUpdatePaymentMethod}
              onDeletePaymentMethod={handleDeletePaymentMethod}
              onSetDefaultPaymentMethod={handleSetDefaultPaymentMethod}
            />
          )}

          {activeView === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              branches={branches}
              onRefreshData={fetchData}
              onRetryStkPush={async (tx) => {
                const res = await fetch('/api/stkpush/bulk-retry', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ transactionIds: [tx.id] }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.message);
                fetchData();
              }}
              onBulkRetryStkPush={async (txIds) => {
                const res = await fetch('/api/stkpush/bulk-retry', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ transactionIds: txIds }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.message);
                fetchData();
              }}
            />
          )}

          {activeView === 'customers' && (
            <CustomersView
              customers={customers}
              onAddCustomer={async (c) => {
                await fetch('/api/customers', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(c),
                });
                fetchData();
              }}
              onSendStkToCustomer={(c) => {
                setIsSendModalOpen(true);
              }}
              onRefreshData={fetchData}
            />
          )}

          {activeView === 'branches' && (
            <BranchesView
              branches={branches}
              onAddBranch={async (b) => {
                await fetch('/api/branches', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(b),
                });
                fetchData();
              }}
            />
          )}

          {activeView === 'staff' && (
            <StaffView
              users={staffUsers.length > 0 ? staffUsers : [currentUser]}
              branches={branches}
              onInviteStaff={async (u) => {
                await fetch('/api/staff', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(u),
                });
                fetchData();
              }}
              onUpdateRole={async (userId, role) => {
                await fetch(`/api/staff/${userId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ role }),
                });
                fetchData();
              }}
            />
          )}

          {activeView === 'reports' && <ReportsView analytics={analytics} />}

          {activeView === 'subscriptions' && (
            <SubscriptionsView
              currentBusiness={business}
              onUpgradePlan={(planId, phone) => {
                handleUpgradePlan(planId, phone);
              }}
            />
          )}

          {activeView === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onMarkAllRead={() => {
                fetch('/api/notifications/mark-read', { method: 'POST' });
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
              }}
            />
          )}

          {activeView === 'monitoring' && <MonitoringView business={business} />}

          {activeView === 'audit-logs' && <AuditLogsView business={business} />}

          {activeView === 'settings' && (
            <SettingsView
              business={business}
              auditLogs={auditLogs}
              onUpdateBusiness={(updated) => setBusiness(updated)}
              onSaveSettings={async (st) => {
                await fetch('/api/settings/daraja', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(st),
                });
                fetchData();
              }}
            />
          )}

          {activeView === 'help' && <HelpView />}

          {activeView === 'profile' && (
            <ProfileView
              user={currentUser}
              business={business}
              onUpdateUser={(updated) => setCurrentUser(updated)}
            />
          )}

          {activeView === 'businesses' && (
            <BusinessesView
              currentBusiness={business}
              onRefreshGlobalData={fetchData}
              onSwitchTenant={handleSwitchTenant}
            />
          )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Modals */}
      <SendPaymentModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        branches={branches}
        customers={customers}
        paymentMethods={paymentMethods}
        onStkPushSent={handleStkPushSent}
      />
    </div>
  );
}
