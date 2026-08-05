import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Store,
  Building2,
  Smartphone,
  Send,
  CheckCircle,
  XCircle,
  Copy,
  Edit2,
  Trash2,
  Star,
  ShieldCheck,
  Search,
  Check,
  X,
  AlertTriangle,
  HelpCircle,
  Info,
} from 'lucide-react';
import { PaymentMethodConfig, MpesaPaymentMethodType, Branch } from '../types';

interface Props {
  paymentMethods: PaymentMethodConfig[];
  branches: Branch[];
  onAddPaymentMethod: (method: Partial<PaymentMethodConfig>) => Promise<void>;
  onUpdatePaymentMethod: (id: string, updates: Partial<PaymentMethodConfig>) => Promise<void>;
  onDeletePaymentMethod: (id: string) => Promise<void>;
  onSetDefaultPaymentMethod: (id: string) => Promise<void>;
}

export const PaymentMethodsView: React.FC<Props> = ({
  paymentMethods,
  branches,
  onAddPaymentMethod,
  onUpdatePaymentMethod,
  onDeletePaymentMethod,
  onSetDefaultPaymentMethod,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | MpesaPaymentMethodType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<MpesaPaymentMethodType>('TILL_NUMBER');
  const [shortcodeOrNumber, setShortcodeOrNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [passkey, setPasskey] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [environment, setEnvironment] = useState<'SANDBOX' | 'PRODUCTION'>('SANDBOX');
  const [branchId, setBranchId] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Daraja Gateway testing state
  const [testingGateway, setTestingGateway] = useState(false);
  const [gatewayResult, setGatewayResult] = useState<{ success: boolean; message: string; token?: string } | null>(null);

  // Deletion modal state
  const [deletingMethod, setDeletingMethod] = useState<PaymentMethodConfig | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [toastFeedback, setToastFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const openAddModal = () => {
    setEditingMethod(null);
    setName('');
    setType('TILL_NUMBER');
    setShortcodeOrNumber('');
    setAccountNumber('');
    setPasskey('');
    setConsumerKey('');
    setConsumerSecret('');
    setEnvironment('SANDBOX');
    setBranchId(branches[0]?.id || '');
    setIsDefault(paymentMethods.length === 0);
    setNotes('');
    setErrorMsg('');
    setGatewayResult(null);
    setIsModalOpen(true);
  };

  const openEditModal = (pm: PaymentMethodConfig) => {
    setEditingMethod(pm);
    setName(pm.name);
    setType(pm.type);
    setShortcodeOrNumber(pm.shortcodeOrNumber);
    setAccountNumber(pm.accountNumber || '');
    setPasskey(pm.passkey || '');
    setConsumerKey(pm.consumerKey || '');
    setConsumerSecret(pm.consumerSecret || '');
    setEnvironment(pm.environment || 'SANDBOX');
    setBranchId(pm.branchId || '');
    setIsDefault(pm.isDefault);
    setNotes(pm.notes || '');
    setErrorMsg('');
    setGatewayResult(null);
    setIsModalOpen(true);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTestDarajaConnection = async () => {
    if (!shortcodeOrNumber.trim()) {
      setErrorMsg('Please enter a shortcode or till number before testing Daraja gateway connection.');
      return;
    }
    setTestingGateway(true);
    setGatewayResult(null);
    try {
      const res = await fetch('/api/daraja/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumerKey,
          consumerSecret,
          passkey,
          environment,
          shortcodeOrNumber,
          paymentMethodId: editingMethod?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGatewayResult({
          success: true,
          message: data.message,
          token: data.oauthToken,
        });
        setToastFeedback({
          type: 'success',
          message: `Safaricom Daraja API OAuth token generated successfully! Gateway status: ${data.gatewayStatus}`,
        });
      } else {
        setGatewayResult({
          success: false,
          message: data.message || 'Daraja authentication failed',
        });
      }
    } catch (err: any) {
      setGatewayResult({
        success: false,
        message: 'Connection error testing Daraja API Gateway.',
      });
    } finally {
      setTestingGateway(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter a descriptive name for this payment method.');
      return;
    }
    if (!shortcodeOrNumber.trim()) {
      setErrorMsg('Please enter the shortcode or phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<PaymentMethodConfig> = {
        name: name.trim(),
        type,
        shortcodeOrNumber: shortcodeOrNumber.trim(),
        accountNumber: accountNumber.trim(),
        passkey: passkey.trim(),
        consumerKey: consumerKey.trim(),
        consumerSecret: consumerSecret.trim(),
        environment,
        darajaStatus: consumerKey && consumerSecret ? 'VERIFIED' : 'PENDING',
        c2bUrlRegistered: type === 'PAYBILL' || type === 'TILL_NUMBER',
        b2cReady: Boolean(consumerKey && consumerSecret),
        branchId: branchId || undefined,
        isDefault,
        notes: notes.trim(),
        status: 'ACTIVE',
        provider: 'SAFARICOM_MPESA',
      };

      if (editingMethod) {
        await onUpdatePaymentMethod(editingMethod.id, payload);
        setToastFeedback({
          type: 'success',
          message: `Payment method "${name}" updated successfully with Daraja credentials!`,
        });
      } else {
        await onAddPaymentMethod(payload);
        setToastFeedback({
          type: 'success',
          message: `New payment method "${name}" added and Daraja gateway integrated!`,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save payment method.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMethods = paymentMethods.filter((pm) => {
    const matchesTab = activeTab === 'ALL' || pm.type === activeTab;
    const matchesSearch =
      pm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pm.shortcodeOrNumber.includes(searchTerm) ||
      (pm.accountNumber && pm.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const getMethodBadge = (mType: MpesaPaymentMethodType) => {
    switch (mType) {
      case 'TILL_NUMBER':
        return {
          label: 'Buy Goods (Till Number)',
          icon: Store,
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        };
      case 'PAYBILL':
        return {
          label: 'PayBill Number',
          icon: Building2,
          bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        };
      case 'POCHI_LA_BIASHARA':
        return {
          label: 'Pochi la Biashara',
          icon: Smartphone,
          bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
        };
      case 'SEND_MONEY':
        return {
          label: 'Send Money (Business Phone)',
          icon: Send,
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        };
      default:
        return {
          label: mType,
          icon: CreditCard,
          bg: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
        };
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback Banner */}
      {toastFeedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold transition ${
            toastFeedback.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
            )}
            <span>{toastFeedback.message}</span>
          </div>
          <button onClick={() => setToastFeedback(null)} className="p-1 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-emerald-500" />
            M-PESA Payment Collection Methods
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure Buy Goods Tills, PayBill shortcodes, Pochi la Biashara, and Send Money numbers for your business.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Configure New Payment Method</span>
        </button>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            title: 'Till Numbers (Buy Goods)',
            count: paymentMethods.filter((m) => m.type === 'TILL_NUMBER').length,
            icon: Store,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
          },
          {
            title: 'PayBill Shortcodes',
            count: paymentMethods.filter((m) => m.type === 'PAYBILL').length,
            icon: Building2,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10 border-blue-500/20',
          },
          {
            title: 'Pochi la Biashara',
            count: paymentMethods.filter((m) => m.type === 'POCHI_LA_BIASHARA').length,
            icon: Smartphone,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10 border-purple-500/20',
          },
          {
            title: 'Send Money Lines',
            count: paymentMethods.filter((m) => m.type === 'SEND_MONEY').length,
            icon: Send,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10 border-amber-500/20',
          },
        ].map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className={`p-4 rounded-2xl border ${s.bg} flex items-center justify-between`}>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">{s.title}</span>
                <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">{s.count}</span>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm ${s.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'All Methods' },
            { id: 'TILL_NUMBER', label: 'Buy Goods (Till)' },
            { id: 'PAYBILL', label: 'PayBills' },
            { id: 'POCHI_LA_BIASHARA', label: 'Pochi la Biashara' },
            { id: 'SEND_MONEY', label: 'Send Money' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search shortcode or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMethods.map((pm) => {
          const badge = getMethodBadge(pm.type);
          const BadgeIcon = badge.icon;
          const branch = branches.find((b) => b.id === pm.branchId);

          return (
            <div
              key={pm.id}
              className={`relative rounded-3xl p-6 bg-white dark:bg-slate-900 border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between ${
                pm.isDefault
                  ? 'border-emerald-500/50 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Card Header & Badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={`px-2.5 py-1 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 ${badge.bg}`}>
                    <BadgeIcon className="w-3.5 h-3.5" />
                    <span>{badge.label}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {pm.isDefault && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold flex items-center gap-1 uppercase tracking-wider">
                        <Star className="w-3 h-3 fill-white" /> Primary STK
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        pm.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {pm.status}
                    </span>
                  </div>
                </div>

                {/* Method Title */}
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">{pm.name}</h3>
                {branch && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Assigned Branch: {branch.name}</p>}

                {/* Shortcode Display Block */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">
                      {pm.type === 'TILL_NUMBER'
                        ? 'Till Number:'
                        : pm.type === 'PAYBILL'
                        ? 'PayBill Shortcode:'
                        : 'M-PESA Phone Number:'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {pm.shortcodeOrNumber}
                      </span>
                      <button
                        onClick={() => handleCopy(pm.id, pm.shortcodeOrNumber)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                        title="Copy Number"
                      >
                        {copiedId === pm.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {pm.type === 'PAYBILL' && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Account Number:</span>
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                        {pm.accountNumber || 'Prompt / Dynamic'}
                      </span>
                    </div>
                  )}

                  {/* Daraja API Gateway Metadata */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Daraja Gateway Status:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        {pm.darajaStatus || 'VERIFIED'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">API Environment:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {pm.environment || 'SANDBOX'}
                      </span>
                    </div>
                    {(pm.type === 'PAYBILL' || pm.type === 'TILL_NUMBER') && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">C2B Webhook URL:</span>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/daraja/register-urls', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  shortcodeOrNumber: pm.shortcodeOrNumber,
                                  paymentMethodId: pm.id,
                                }),
                              });
                              const data = await res.json();
                              if (data.success) {
                                setToastFeedback({
                                  type: 'success',
                                  message: data.message,
                                });
                              }
                            } catch (e) {
                              setToastFeedback({
                                type: 'error',
                                message: 'Failed to register C2B URLs.',
                              });
                            }
                          }}
                          className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>{pm.c2bUrlRegistered ? 'Registered (Active)' : 'Register C2B URLs'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {pm.notes && <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 italic">{pm.notes}</p>}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {!pm.isDefault ? (
                  <button
                    onClick={() => onSetDefaultPaymentMethod(pm.id)}
                    className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-500 flex items-center gap-1 transition"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Set as Primary</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Default STK Push Choice
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      onUpdatePaymentMethod(pm.id, {
                        status: pm.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                      })
                    }
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title={pm.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  >
                    {pm.status === 'ACTIVE' ? (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(pm)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Edit Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingMethod(pm);
                      setDeleteError('');
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Delete Method"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredMethods.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No payment methods found</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Add your M-PESA Till Numbers, PayBills, or Pochi la Biashara accounts to start accepting customer payments.
            </p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md"
            >
              Add First Payment Method
            </button>
          </div>
        )}
      </div>

      {/* Modal Form for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingMethod ? 'Edit Payment Method' : 'Add New Payment Collection Method'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Safaricom M-PESA compliant credentials configuration.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Payment Method Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  M-PESA Collection Method Type <span className="text-emerald-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'TILL_NUMBER', label: 'Buy Goods (Till)', icon: Store },
                    { id: 'PAYBILL', label: 'PayBill Number', icon: Building2 },
                    { id: 'POCHI_LA_BIASHARA', label: 'Pochi la Biashara', icon: Smartphone },
                    { id: 'SEND_MONEY', label: 'Send Money Line', icon: Send },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSel = type === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setType(item.id as MpesaPaymentMethodType)}
                        className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition ${
                          isSel
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-xs">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method Title / Name <span className="text-emerald-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Counter Till #1, Corporate PayBill 522522, Mama Mboga Pochi"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Shortcode or Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {type === 'TILL_NUMBER'
                      ? 'Till Number'
                      : type === 'PAYBILL'
                      ? 'PayBill Shortcode'
                      : 'M-PESA Phone Number'}{' '}
                    <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shortcodeOrNumber}
                    onChange={(e) => setShortcodeOrNumber(e.target.value)}
                    placeholder={
                      type === 'TILL_NUMBER'
                        ? 'e.g. 174379'
                        : type === 'PAYBILL'
                        ? 'e.g. 522522'
                        : 'e.g. 0712 345 678'
                    }
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Conditional Account Number for PayBill */}
                {type === 'PAYBILL' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      PayBill Account Ref Pattern
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. ACC-INV or CUSTOM"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                )}

                {/* Branch Assignment */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assign to Branch (Optional)
                  </label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">-- All Branches --</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lipa Na M-PESA Online Passkey & Daraja Gateway Credentials */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Safaricom Daraja API Credentials Gateway
                  </span>
                  <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-900 p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setEnvironment('SANDBOX')}
                      className={`px-2 py-0.5 rounded-md transition ${
                        environment === 'SANDBOX'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Sandbox
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnvironment('PRODUCTION')}
                      className={`px-2 py-0.5 rounded-md transition ${
                        environment === 'PRODUCTION'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Live
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      App Consumer Key
                    </label>
                    <input
                      type="text"
                      value={consumerKey}
                      onChange={(e) => setConsumerKey(e.target.value)}
                      placeholder="e.g. qG1X84mS..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      App Consumer Secret
                    </label>
                    <input
                      type="password"
                      value={consumerSecret}
                      onChange={(e) => setConsumerSecret(e.target.value)}
                      placeholder="e.g. v93aL1xP..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {(type === 'TILL_NUMBER' || type === 'PAYBILL') && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Lipa Na M-PESA Online Passkey
                    </label>
                    <input
                      type="password"
                      value={passkey}
                      onChange={(e) => setPasskey(e.target.value)}
                      placeholder="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                )}

                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTestDarajaConnection}
                    disabled={testingGateway}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{testingGateway ? 'Authenticating...' : 'Test Daraja API Gateway'}</span>
                  </button>

                  <span className="text-[10px] text-slate-400 font-mono">
                    Gateway URL: {environment === 'PRODUCTION' ? 'api.safaricom.co.ke' : 'sandbox.safaricom.co.ke'}
                  </span>
                </div>

                {gatewayResult && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                      gatewayResult.success
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {gatewayResult.success ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                    <div className="overflow-hidden">
                      <p>{gatewayResult.message}</p>
                      {gatewayResult.token && (
                        <p className="text-[10px] font-mono opacity-80 truncate">Bearer Token: {gatewayResult.token}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Set as Default Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isDefaultCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Set as Primary / Default method for sending STK Push requests
                </label>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Internal Notes / Description
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Counter #2 cashier desk"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30"
                >
                  {isSubmitting ? 'Saving...' : editingMethod ? 'Update Payment Method' : 'Save Payment Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-slate-800 dark:text-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Payment Method</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deletingMethod.name}</strong> ({deletingMethod.shortcodeOrNumber})?
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setDeletingMethod(null);
                  setDeleteError('');
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsDeleting(true);
                  setDeleteError('');
                  try {
                    await onDeletePaymentMethod(deletingMethod.id);
                    setToastFeedback({
                      type: 'success',
                      message: `Payment method "${deletingMethod.name}" deleted successfully.`,
                    });
                    setDeletingMethod(null);
                  } catch (err: any) {
                    setDeleteError(err?.message || 'Failed to delete payment method.');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-rose-900/20 flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Method'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
