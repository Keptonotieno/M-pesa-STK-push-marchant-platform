import React, { useState } from 'react';
import { Settings, ShieldCheck, Key, RefreshCw, CheckCircle, Copy, AlertCircle, FileText, Server, Radio, Building, RotateCcw, Sliders, Clock, Zap, Play, CheckCircle2 } from 'lucide-react';
import { Business, AuditLog, StkRetryPolicy } from '../types';
import { WebhookLogsTab } from '../components/WebhookLogsTab';
import { saveBusinessToFirestore } from '../lib/firestoreService';

interface Props {
  business: Business;
  auditLogs: AuditLog[];
  onSaveSettings: (settings: any) => void;
  onUpdateBusiness?: (business: Business) => void;
}

export const SettingsView: React.FC<Props> = ({ business, auditLogs, onSaveSettings, onUpdateBusiness }) => {
  const [activeTab, setActiveTab] = useState<'DARAJA' | 'RETRY_POLICY' | 'BUSINESS' | 'AUDIT_LOGS' | 'WEBHOOKS'>('DARAJA');
  const [paybill, setPaybill] = useState(business.paybill || '522522');
  const [tillNumber, setTillNumber] = useState(business.tillNumber || '174379');
  const [passkey, setPasskey] = useState(business.passkey || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919');
  const [consumerKey, setConsumerKey] = useState(business.consumerKey || 'dARajA20_KeY_mP3Sa_991823');
  const [consumerSecret, setConsumerSecret] = useState(business.consumerSecret || 'S3cr3t_P3saR3qu3st_Daraja_2026');
  const [env, setEnv] = useState<'SANDBOX' | 'PRODUCTION'>(business.environment || 'PRODUCTION');
  const [isSaved, setIsSaved] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Business editing form state
  const [bizName, setBizName] = useState(business.name);
  const [bizKraPin, setBizKraPin] = useState(business.kraPin || '');
  const [bizAddress, setBizAddress] = useState(business.address || '');
  const [bizPhone, setBizPhone] = useState(business.contactPhone || '');
  const [bizEmail, setBizEmail] = useState(business.contactEmail || '');
  const [bizCategory, setBizCategory] = useState(business.category || 'Retail');
  const [bizSaved, setBizSaved] = useState(false);

  // STK Push Retry Policy state
  const [maxRetries, setMaxRetries] = useState<number>(business.stkRetryPolicy?.maxRetries ?? 3);
  const [retryDelaySeconds, setRetryDelaySeconds] = useState<number>(business.stkRetryPolicy?.retryDelaySeconds ?? 5);
  const [backoffStrategy, setBackoffStrategy] = useState<'FIXED' | 'EXPONENTIAL' | 'IMMEDIATE'>(business.stkRetryPolicy?.backoffStrategy ?? 'EXPONENTIAL');
  const [autoRetryOnTimeout, setAutoRetryOnTimeout] = useState<boolean>(business.stkRetryPolicy?.autoRetryOnTimeout ?? true);
  const [autoRetryOnNetworkError, setAutoRetryOnNetworkError] = useState<boolean>(business.stkRetryPolicy?.autoRetryOnNetworkError ?? true);
  const [autoRetryOnUserCancel, setAutoRetryOnUserCancel] = useState<boolean>(business.stkRetryPolicy?.autoRetryOnUserCancel ?? false);
  const [notifyCustomerOnRetry, setNotifyCustomerOnRetry] = useState<boolean>(business.stkRetryPolicy?.notifyCustomerOnRetry ?? true);
  const [maxTimeoutSeconds, setMaxTimeoutSeconds] = useState<number>(business.stkRetryPolicy?.maxTimeoutSeconds ?? 30);

  const [retryPolicySaved, setRetryPolicySaved] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any | null>(null);
  const [isSimulatingPolicy, setIsSimulatingPolicy] = useState(false);
  const [testPhoneInput, setTestPhoneInput] = useState('+254712345678');

  const webhookUrl = 'https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/stkpush/callback';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedBiz: Business = {
      ...business,
      paybill,
      tillNumber,
      passkey,
      consumerKey,
      consumerSecret,
      environment: env,
    };
    await saveBusinessToFirestore(updatedBiz);
    if (onUpdateBusiness) onUpdateBusiness(updatedBiz);
    onSaveSettings({ paybill, tillNumber, passkey, consumerKey, consumerSecret, env });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSaveRetryPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    const policyObj: StkRetryPolicy = {
      maxRetries,
      retryDelaySeconds,
      backoffStrategy,
      autoRetryOnTimeout,
      autoRetryOnNetworkError,
      autoRetryOnUserCancel,
      notifyCustomerOnRetry,
      maxTimeoutSeconds,
    };

    const updatedBiz: Business = {
      ...business,
      stkRetryPolicy: policyObj,
    };

    await saveBusinessToFirestore(updatedBiz);

    try {
      await fetch('/api/settings/stk-retry-policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-business-id': business.id },
        body: JSON.stringify(policyObj),
      });
    } catch (err) {
      console.error(err);
    }

    if (onUpdateBusiness) onUpdateBusiness(updatedBiz);
    setRetryPolicySaved(true);
    setTimeout(() => setRetryPolicySaved(false), 3000);
  };

  const handleSimulatePolicy = async () => {
    setIsSimulatingPolicy(true);
    setSimulationResults(null);
    try {
      const policyObj: StkRetryPolicy = {
        maxRetries,
        retryDelaySeconds,
        backoffStrategy,
        autoRetryOnTimeout,
        autoRetryOnNetworkError,
        autoRetryOnUserCancel,
        notifyCustomerOnRetry,
        maxTimeoutSeconds,
      };

      const res = await fetch('/api/stkpush/test-retry-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy: policyObj, testPhone: testPhoneInput }),
      });
      const data = await res.json();
      setSimulationResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulatingPolicy(false);
    }
  };

  const handleTestConnection = async () => {
    setTestResult('Connecting to Safaricom Daraja API Gateway...');
    try {
      const res = await fetch('/api/daraja/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumerKey,
          consumerSecret,
          passkey,
          environment: env,
          shortcodeOrNumber: tillNumber || paybill,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(`✅ ${data.message} (Status: ${data.gatewayStatus}, Latency: ${data.latencyMs}ms, Token: ${data.oauthToken.slice(0, 16)}...)`);
      } else {
        setTestResult(`❌ Connection Failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setTestResult('❌ Network error attempting to reach Safaricom Daraja Gateway API.');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-500" />
            Daraja M-PESA & System Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure Safaricom Daraja 2.0 API credentials, STK Push Retry Policies, Paybill/Till shortcodes, and webhooks.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'DARAJA', label: 'Safaricom Daraja API Credentials' },
          { id: 'RETRY_POLICY', label: '🔄 STK Push Retry Policy' },
          { id: 'WEBHOOKS', label: '⚡ Webhooks & Callback Debugger' },
          { id: 'BUSINESS', label: 'Business & KRA Details' },
          { id: 'AUDIT_LOGS', label: 'Security Audit Logs' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === t.id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'DARAJA' && (
        <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
          {isSaved && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Daraja configuration saved successfully!</span>
            </div>
          )}

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-500" /> API Gateway Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  M-PESA Paybill Number
                </label>
                <input
                  type="text"
                  value={paybill}
                  onChange={(e) => setPaybill(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Default Till Number
                </label>
                <input
                  type="text"
                  value={tillNumber}
                  onChange={(e) => setTillNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lipa Na M-PESA Online Passkey
              </label>
              <input
                type="text"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-600 dark:text-slate-300"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Consumer Key
                </label>
                <input
                  type="password"
                  value={consumerKey}
                  onChange={(e) => setConsumerKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Consumer Secret
                </label>
                <input
                  type="password"
                  value={consumerSecret}
                  onChange={(e) => setConsumerSecret(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
                />
              </div>
            </div>

            {/* Webhook Callback Endpoint */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-900 dark:text-white">
                Live Daraja Webhook Callback Receiver URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-emerald-600 dark:text-emerald-400"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(webhookUrl)}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleTestConnection}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2"
            >
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Test Daraja Connection</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg"
            >
              Save Configuration
            </button>
          </div>

          {testResult && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400">
              {testResult}
            </div>
          )}
        </form>
      )}

      {activeTab === 'RETRY_POLICY' && (
        <div className="space-y-6 max-w-4xl">
          <form onSubmit={handleSaveRetryPolicy} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
            {retryPolicySaved && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>STK Push Retry Policy saved and synchronized across tenant instances!</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-emerald-500" /> M-PESA STK Push Automatic Retry Policy Engine
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Automate payment request retries when M-PESA prompts time out or encounter gateway network failures.
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-bold self-start sm:self-auto">
                Status: {maxRetries > 0 ? `Active (${maxRetries} Retries, ${backoffStrategy})` : 'Disabled'}
              </span>
            </div>

            {/* Core Retry Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Maximum Retry Attempts *
                </label>
                <select
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={0}>0 - Disabled (No Auto-Retries)</option>
                  <option value={1}>1 Retry Attempt</option>
                  <option value={2}>2 Retry Attempts</option>
                  <option value={3}>3 Retry Attempts (Recommended)</option>
                  <option value={5}>5 Retry Attempts (Aggressive)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Times system re-sends STK Push before marking transaction failed.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Delay Between Attempts *
                </label>
                <select
                  value={retryDelaySeconds}
                  onChange={(e) => setRetryDelaySeconds(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={3}>3 Seconds</option>
                  <option value={5}>5 Seconds (Standard)</option>
                  <option value={10}>10 Seconds</option>
                  <option value={15}>15 Seconds</option>
                  <option value={30}>30 Seconds</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Base waiting interval before triggering the next STK Push prompt.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Backoff Strategy *
                </label>
                <select
                  value={backoffStrategy}
                  onChange={(e) => setBackoffStrategy(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="EXPONENTIAL">EXPONENTIAL (5s → 10s → 20s)</option>
                  <option value="FIXED">FIXED (5s → 5s → 5s)</option>
                  <option value="IMMEDIATE">IMMEDIATE (0s Delay)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Exponential backoff reduces network spam and gives user time to respond.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  M-PESA Response Timeout Threshold
                </label>
                <select
                  value={maxTimeoutSeconds}
                  onChange={(e) => setMaxTimeoutSeconds(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={15}>15 Seconds</option>
                  <option value={30}>30 Seconds (Safaricom Standard)</option>
                  <option value={45}>45 Seconds</option>
                  <option value={60}>60 Seconds</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Time waited for customer PIN response before declaring a timeout.
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notifyCustomerOnRetry"
                  checked={notifyCustomerOnRetry}
                  onChange={(e) => setNotifyCustomerOnRetry(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="notifyCustomerOnRetry" className="text-xs cursor-pointer">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    SMS Alert Prior to Retry
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Send customer an SMS notification: "Re-sending M-PESA payment prompt to your phone".
                  </span>
                </label>
              </div>
            </div>

            {/* Triggers & Conditions */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Automatic Retry Trigger Conditions
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRetryOnTimeout}
                    onChange={(e) => setAutoRetryOnTimeout(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      USSD Timeout (1037)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Auto-retry if user did not enter PIN before prompt timed out.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRetryOnNetworkError}
                    onChange={(e) => setAutoRetryOnNetworkError(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Gateway 5xx Failure
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Auto-retry on Safaricom Daraja 500 / 503 / 504 server errors.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRetryOnUserCancel}
                    onChange={(e) => setAutoRetryOnUserCancel(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Customer Cancelled (1032)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Re-prompt if customer explicitly tapped Cancel on phone screen.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                Save Retry Policy
              </button>
            </div>
          </form>

          {/* Interactive Live Simulator */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> Policy Engine Test Bench & Timeline Simulator
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Test how your configured policy will execute during a real-world M-PESA STK Push failure.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={testPhoneInput}
                  onChange={(e) => setTestPhoneInput(e.target.value)}
                  placeholder="+254712345678"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs w-36"
                />
                <button
                  type="button"
                  onClick={handleSimulatePolicy}
                  disabled={isSimulatingPolicy}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer"
                >
                  {isSimulatingPolicy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>Run Simulation</span>
                </button>
              </div>
            </div>

            {simulationResults && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <span>Simulation Schedule Timeline</span>
                  <span className="font-mono text-emerald-500">
                    Est. Duration: {simulationResults.totalEstimatedTimeSeconds}s
                  </span>
                </div>

                <div className="space-y-2">
                  {simulationResults.timeline.map((step: any, index: number) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5 ${
                            step.step === 0
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                              : step.status === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                          }`}
                        >
                          {step.step}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>{step.phase}</span>
                            {step.delaySeconds !== undefined && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-500">
                                Delay: {step.delaySeconds}s
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                            {step.resultDesc}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                            step.status === 'SUCCESS'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : step.status === 'FAILED'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {step.status}
                        </span>
                        {step.smsAlertSent && (
                          <span className="block text-[10px] text-emerald-500 mt-1">
                            📱 SMS Sent
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'WEBHOOKS' && <WebhookLogsTab business={business} />}

      {activeTab === 'BUSINESS' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const updatedBiz: Business = {
              ...business,
              name: bizName,
              kraPin: bizKraPin,
              address: bizAddress,
              contactPhone: bizPhone,
              contactEmail: bizEmail,
              category: bizCategory,
            };
            await saveBusinessToFirestore(updatedBiz);
            try {
              await fetch('/api/business/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-business-id': business.id },
                body: JSON.stringify(updatedBiz),
              });
            } catch (err) {
              console.error(err);
            }
            if (onUpdateBusiness) onUpdateBusiness(updatedBiz);
            setBizSaved(true);
            setTimeout(() => setBizSaved(false), 3000);
          }}
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 max-w-3xl"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-500" /> Business Workspace Profile & Tax Compliance
            </h3>
            {bizSaved && (
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Registered Business Name *
              </label>
              <input
                type="text"
                required
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                KRA PIN Number *
              </label>
              <input
                type="text"
                required
                value={bizKraPin}
                onChange={(e) => setBizKraPin(e.target.value)}
                placeholder="P051000000Z"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Headquarters Address
              </label>
              <input
                type="text"
                value={bizAddress}
                onChange={(e) => setBizAddress(e.target.value)}
                placeholder="e.g. Westlands Commercial Center, Nairobi"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Industry Category
              </label>
              <select
                value={bizCategory}
                onChange={(e) => setBizCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
              >
                <option value="Retail & FMCG">Retail & FMCG</option>
                <option value="Supermarket / Grocery">Supermarket / Grocery</option>
                <option value="Hospitality & Restaurant">Hospitality & Restaurant</option>
                <option value="Pharmacy & Healthcare">Pharmacy & Healthcare</option>
                <option value="Services & Consulting">Services & Consulting</option>
                <option value="E-Commerce & Online Store">E-Commerce & Online Store</option>
                <option value="Hardware & Construction">Hardware & Construction</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Contact Phone
              </label>
              <input
                type="text"
                value={bizPhone}
                onChange={(e) => setBizPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Contact Email
              </label>
              <input
                type="email"
                value={bizEmail}
                onChange={(e) => setBizEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
            >
              Update Business Profile
            </button>
          </div>
        </form>
      )}

      {activeTab === 'AUDIT_LOGS' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-950">
                    <td className="py-3 px-4 font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{log.action}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {log.actorName} ({log.actorRole})
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{log.details}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
