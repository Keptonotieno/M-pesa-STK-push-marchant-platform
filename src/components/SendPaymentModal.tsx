import React, { useState, useEffect } from 'react';
import { Send, Smartphone, ShieldCheck, RefreshCw, X, User, DollarSign, Store, Building2, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react';
import { Branch, Customer, Transaction, PaymentMethodConfig } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  customers: Customer[];
  paymentMethods: PaymentMethodConfig[];
  onStkPushSent: (tx: Transaction, prompt: any) => void;
}

export const SendPaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  branches,
  customers,
  paymentMethods,
  onStkPushSent,
}) => {
  const [phone, setPhone] = useState('0712 345 678');
  const [amount, setAmount] = useState('1500');
  const [customerName, setCustomerName] = useState('James Mwangi');
  const [description, setDescription] = useState('Payment for order #GLS-1058');
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || '');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [customPaybillAccount, setCustomPaybillAccount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Set default payment method when opened
  useEffect(() => {
    if (paymentMethods.length > 0) {
      const defaultPm = paymentMethods.find((m) => m.isDefault && m.status === 'ACTIVE') || paymentMethods.find((m) => m.status === 'ACTIVE') || paymentMethods[0];
      if (defaultPm) {
        setSelectedPaymentMethodId(defaultPm.id);
        if (defaultPm.accountNumber) {
          setCustomPaybillAccount(defaultPm.accountNumber);
        }
      }
    }
  }, [paymentMethods, isOpen]);

  if (!isOpen) return null;

  const activeMethods = paymentMethods.filter((m) => m.status === 'ACTIVE');
  const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentMethodId);

  const quickAmounts = [500, 1000, 2500, 5000, 10000];

  const handleSelectCustomer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    const cust = customers.find((c) => c.id === custId);
    if (cust) {
      setCustomerName(cust.name);
      setPhone(cust.phone);
    }
  };

  const handleSelectPaymentMethod = (pmId: string) => {
    setSelectedPaymentMethodId(pmId);
    const pm = paymentMethods.find((m) => m.id === pmId);
    if (pm && pm.accountNumber) {
      setCustomPaybillAccount(pm.accountNumber);
    } else {
      setCustomPaybillAccount('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const numAmount = Number(amount);
    if (!phone.trim()) {
      setErrorMsg('Please enter a valid customer phone number.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid amount in Kenyan Shillings (KES).');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/stkpush/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          amount: numAmount,
          customerName,
          description,
          branchId: selectedBranchId,
          paymentMethodId: selectedPaymentMethodId,
          paymentMethodType: selectedMethod?.type,
          shortcodeOrNumber: selectedMethod?.shortcodeOrNumber,
          accountNumber: customPaybillAccount || selectedMethod?.accountNumber || '',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || 'Failed to send STK push request.');
        return;
      }

      // Notify parent to open Phone Simulator & update state
      onStkPushSent(data.transaction, data.prompt);
      onClose();
    } catch (err) {
      setErrorMsg('Server error. Could not connect to M-PESA Gateway.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-[540px] bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* STICKY HEADER */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 leading-tight">
                Send M-PESA STK Push
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Instant payment prompt directly to customer&apos;s phone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition shrink-0 min-h-[36px] min-w-[36px] cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SCROLLABLE FORM BODY */}
        <form id="stk-push-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick CRM Customer Select */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Customer from CRM <span className="text-[11px] font-normal text-slate-400">(Optional)</span>
            </label>
            <select
              onChange={handleSelectCustomer}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition"
            >
              <option value="">-- Choose Existing Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) - {c.category}
                </option>
              ))}
            </select>
          </div>

          {/* Two-Column Grid: Phone Number & Customer Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Customer Phone <span className="text-emerald-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setPhone('0700830335')}
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30 transition flex items-center gap-1 cursor-pointer"
                  title="Use subscriber testing phone 0700830335"
                >
                  <Smartphone className="w-2.5 h-2.5" />
                  <span>0700830335</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0700830335"
                  required
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Payment Amount & Presets */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Amount (KES) <span className="text-emerald-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 font-bold text-slate-400 text-xs sm:text-sm">KES</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1500"
                min="1"
                required
                className="w-full h-11 pl-14 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setAmount(q.toString())}
                  className={`px-2.5 py-1 min-h-[32px] rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    amount === q.toString()
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  KES {q.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector & Conditional PayBill Account */}
          <div className={selectedMethod?.type === 'PAYBILL' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3.5' : ''}>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Collection Method <span className="text-emerald-500">*</span>
              </label>
              <select
                value={selectedPaymentMethodId}
                onChange={(e) => handleSelectPaymentMethod(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {activeMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.type === 'TILL_NUMBER' ? '🏬 Buy Goods (' : m.type === 'PAYBILL' ? '🏢 PayBill (' : m.type === 'POCHI_LA_BIASHARA' ? '📱 Pochi (' : '📲 Direct ('}
                    {m.shortcodeOrNumber}) - {m.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedMethod?.type === 'PAYBILL' && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  PayBill Account Ref <span className="text-emerald-500">*</span>
                </label>
                <input
                  type="text"
                  value={customPaybillAccount}
                  onChange={(e) => setCustomPaybillAccount(e.target.value)}
                  placeholder="e.g. INV-1058"
                  required
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Branch & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Branch / Till
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.tillNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description / Ref #
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Order #GLS-1058"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Security Banner Note */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Encrypted via Safaricom Daraja 2.0 API. Customer gets standard M-PESA PIN prompt.</span>
          </div>
        </form>

        {/* STICKY FOOTER */}
        <div className="sticky bottom-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-3 sm:px-6 sm:py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 h-11 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer min-w-[80px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="stk-push-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 h-11 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer min-w-[160px]"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Initiating...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send STK Push</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
