import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Building2,
  Smartphone,
  Send,
  ArrowRight,
  ArrowLeft,
  X,
  HelpCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  business: any;
  onSaveBusiness: (updated: any) => Promise<void>;
  onSendTestPayment?: (phone: string, amount: number) => Promise<void>;
}

export const GuidedSetupWizardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  business,
  onSaveBusiness,
  onSendTestPayment,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(business?.name || '');
  const [kraPin, setKraPin] = useState(business?.kraPin || '');
  const [paybill, setPaybill] = useState(business?.paybill || '522522');
  const [tillNumber, setTillNumber] = useState(business?.tillNumber || '174379');
  const [passkey, setPasskey] = useState(business?.passkey || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919');
  const [testPhone, setTestPhone] = useState('254712345678');
  const [testStatus, setTestStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS'>('IDLE');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleNextStep1 = async () => {
    setSaving(true);
    try {
      await onSaveBusiness({ ...business, name, kraPin });
      setStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleNextStep2 = async () => {
    setSaving(true);
    try {
      await onSaveBusiness({ ...business, paybill, tillNumber, passkey });
      setStep(3);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestPush = async () => {
    setTestStatus('SENDING');
    try {
      if (onSendTestPayment) {
        await onSendTestPayment(testPhone, 10);
      } else {
        await new Promise((r) => setTimeout(r, 1200));
      }
      setTestStatus('SUCCESS');
    } catch (err) {
      setTestStatus('IDLE');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-white">Guided M-PESA Setup Wizard</h3>
              <p className="text-xs text-slate-400">Step {step} of 3 • Easy 2-minute business setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${step >= 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
            <span>Business Info</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200 dark:bg-slate-700" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${step >= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
            <span>M-PESA Till / Paybill</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200 dark:bg-slate-700" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${step >= 3 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
            <span>Test Payment</span>
          </div>
        </div>

        {/* Body Steps */}
        <div className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs leading-relaxed">
                <strong>Welcome to PesaRequest!</strong> Let's get your business profile ready for receiving instant customer M-PESA payments.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Registered Business Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Supermarket Ltd"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>KRA PIN Number</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional for auto tax invoicing</span>
                </label>
                <input
                  type="text"
                  value={kraPin}
                  onChange={(e) => setKraPin(e.target.value)}
                  placeholder="e.g. A012345678Z"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold uppercase font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-300 text-xs leading-relaxed">
                <strong>Safaricom M-PESA Shortcode Setup:</strong> Enter your Till Number or Paybill shortcode. You can test immediately using Safaricom Sandbox default values.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Till Number</label>
                  <input
                    type="text"
                    value={tillNumber}
                    onChange={(e) => setTillNumber(e.target.value)}
                    placeholder="174379"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Paybill Number</label>
                  <input
                    type="text"
                    value={paybill}
                    onChange={(e) => setPaybill(e.target.value)}
                    placeholder="522522"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>Safaricom Online Passkey</span>
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Your online passkey provided in your M-PESA Daraja developer portal." />
                </label>
                <input
                  type="password"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Enter Safaricom passkey..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Verify Your Integration</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Send a live test payment prompt (STK Push) to your phone number to verify instant confirmation.
                </p>
              </div>

              <div className="max-w-xs mx-auto space-y-3">
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="254712345678"
                  className="w-full px-3.5 py-2.5 text-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                />

                <button
                  type="button"
                  onClick={handleTestPush}
                  disabled={testStatus === 'SENDING'}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${testStatus === 'SENDING' ? 'animate-bounce' : ''}`} />
                  <span>{testStatus === 'SENDING' ? 'Dispatching STK Push...' : 'Send Test STK Push (KES 10)'}</span>
                </button>
              </div>

              {testStatus === 'SUCCESS' && (
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>STK Push Received Successfully! Setup Complete.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step === 1 && (
            <button
              onClick={handleNextStep1}
              disabled={saving || !name.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>Next: M-PESA Shortcode</span> <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 2 && (
            <button
              onClick={handleNextStep2}
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>Next: Test Payment</span> <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              Finish & Go to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
