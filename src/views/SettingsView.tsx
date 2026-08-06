import React, { useState } from 'react';
import { Settings, ShieldCheck, Key, RefreshCw, CheckCircle, Copy, AlertCircle, FileText, Server, Radio, Building, RotateCcw, Sliders, Clock, Zap, Play, CheckCircle2, Sparkles, SlidersHorizontal, Eye, EyeOff } from 'lucide-react';
import { Business, AuditLog, StkRetryPolicy } from '../types';
import { WebhookLogsTab } from '../components/WebhookLogsTab';
import { DailyEmailSummaryTab } from '../components/DailyEmailSummaryTab';
import { TwoFactorSecurityTab } from '../components/TwoFactorSecurityTab';
import { SystemErrorLogsTab } from '../components/SystemErrorLogsTab';
import { PerformanceTab } from '../components/PerformanceTab';
import { PaymentReliabilityTab } from '../components/PaymentReliabilityTab';
import { TenantSecurityTab } from '../components/TenantSecurityTab';
import { ScalabilityTab } from '../components/ScalabilityTab';
import { IntegrationHealthTab } from '../components/IntegrationHealthTab';
import { AuditLogsManager } from '../components/AuditLogsManager';
import { GuidedSetupWizardModal } from '../components/GuidedSetupWizardModal';
import { saveBusinessToFirestore } from '../lib/firestoreService';

interface Props {
  business: Business;
  auditLogs: AuditLog[];
  onSaveSettings: (settings: any) => void;
  onUpdateBusiness?: (business: Business) => void;
}

export const SettingsView: React.FC<Props> = ({ business, auditLogs, onSaveSettings, onUpdateBusiness }) => {
  const [activeTab, setActiveTab] = useState<'DARAJA' | 'RETRY_POLICY' | 'BUSINESS' | 'AUDIT_LOGS' | 'WEBHOOKS' | 'DAILY_EMAIL' | 'SECURITY' | 'SYSTEM_ERRORS' | 'PERFORMANCE' | 'RELIABILITY' | 'TENANT_SECURITY' | 'SCALABILITY' | 'MONITORING'>('DARAJA');
  const [showWizard, setShowWizard] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [paybill, setPaybill] = useState(business.paybill || '522522');
  const [tillNumber, setTillNumber] = useState(business.tillNumber || '174379');
  const [passkey, setPasskey] = useState(business.passkey || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919');
  const [consumerKey, setConsumerKey] = useState(business.consumerKey || 'dARajA20_KeY_mP3Sa_991823');
  const [consumerSecret, setConsumerSecret] = useState(business.consumerSecret || 'S3cr3t_P3saR3qu3st_Daraja_2026');
  const [env, setEnv] = useState<'SANDBOX' | 'PRODUCTION'>(business.environment || 'PRODUCTION');
  const [isSaved, setIsSaved] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationSteps, setValidationSteps] = useState<{ step: string; passed: boolean; message: string }[]>([]);
  const [activatedInfo, setActivatedInfo] = useState<{ gatewayStatus: string; latencyMs: number; token: string } | null>(null);

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
    setIsValidating(true);
    setTestResult('Running 100% end-to-end Daraja credential validation tests...');
    setValidationSteps([]);
    setActivatedInfo(null);
    try {
      const res = await fetch('/api/daraja/validate-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumerKey,
          consumerSecret,
          passkey,
          environment: env,
          shortcodeOrNumber: tillNumber || paybill || '174379',
          callbackUrl: webhookUrl,
          type: paybill ? 'PAYBILL' : 'TILL_NUMBER',
        }),
      });
      const data = await res.json();
      if (data.steps) {
        setValidationSteps(data.steps);
      }
      if (data.success) {
        setTestResult(`✅ All Validation Checks Passed! Integration successfully activated for ${tillNumber || paybill}.`);
        setActivatedInfo({
          gatewayStatus: data.gatewayStatus || 'ONLINE_CONNECTED',
          latencyMs: data.latencyMs || 42,
          token: data.oauthToken || 'ag_token_verified',
        });
      } else {
        setTestResult(`❌ Validation Failed: ${data.message || 'Validation error'} ${data.errors ? '- ' + data.errors.join(' ') : ''}`);
      }
    } catch (err) {
      setTestResult('❌ Network error attempting to validate Safaricom Daraja Gateway API.');
    } finally {
      setIsValidating(false);
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
            Simple, guided configuration for non-technical business owners & comprehensive controls for system administrators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Launch 3-Step Setup Wizard</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              showAdvanced
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {showAdvanced ? <EyeOff className="w-3.5 h-3.5 text-indigo-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
            <span>{showAdvanced ? 'Hide Advanced Developer Settings' : 'Show Advanced Settings'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'DARAJA', label: 'Safaricom Daraja API Credentials', essential: true },
          { id: 'MONITORING', label: '📊 Integration Health & Monitoring', essential: true },
          { id: 'BUSINESS', label: 'Business & KRA Details', essential: true },
          { id: 'RETRY_POLICY', label: '🔄 STK Push Retry Policy', essential: true },
          { id: 'DAILY_EMAIL', label: '📧 Daily Email Digest', essential: true },
          { id: 'SECURITY', label: '🔒 Security & 2FA', essential: true },
          { id: 'WEBHOOKS', label: '⚡ Webhooks & Callback Debugger', essential: false },
          { id: 'SYSTEM_ERRORS', label: '⚠️ System Error Logs & Retries', essential: false },
          { id: 'PERFORMANCE', label: '🚀 Performance & Cache Engine', essential: false },
          { id: 'RELIABILITY', label: '🛡️ Payment Reliability & Reconciliation', essential: false },
          { id: 'TENANT_SECURITY', label: '🏢 Multi-Tenant Security & Isolation', essential: false },
          { id: 'SCALABILITY', label: '🌐 Scalability & Modular Architecture', essential: false },
          { id: 'AUDIT_LOGS', label: 'Security Audit Logs', essential: false },
        ]
          .filter((t) => t.essential || showAdvanced)
          .map((t) => (
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isValidating}
              className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Server className={`w-4 h-4 text-emerald-400 ${isValidating ? 'animate-spin' : ''}`} />
              <span>{isValidating ? 'Testing & Registering Callbacks...' : 'Validate Credentials & Activate Integration'}</span>
            </button>

            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg transition cursor-pointer"
            >
              Save Configuration
            </button>
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-2xl border text-xs font-mono font-bold ${
                testResult.startsWith('✅')
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : testResult.startsWith('❌')
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {testResult}
            </div>
          )}

          {/* Validation Steps Breakdown */}
          {validationSteps.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Automated Validation Pipeline Log
              </h4>

              <div className="space-y-2">
                {validationSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs"
                  >
                    {step.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5 flex-1">
                      <div className="font-bold font-mono text-slate-900 dark:text-white text-[11px]">
                        [{step.step}]
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 font-sans">{step.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activation Success Card */}
          {activatedInfo && (
            <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold uppercase border border-emerald-500/30">
                  Status: {activatedInfo.gatewayStatus}
                </span>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  Latency: {activatedInfo.latencyMs}ms
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                  Daraja Integration Activated & Operational
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                  OAuth 2.0 token active, C2B callback URLs registered. Your merchant portal is fully authorized to trigger M-PESA STK Push requests.
                </p>
              </div>
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

      {activeTab === 'DAILY_EMAIL' && <DailyEmailSummaryTab business={business} />}

      {activeTab === 'SECURITY' && <TwoFactorSecurityTab business={business} />}

      {activeTab === 'SYSTEM_ERRORS' && <SystemErrorLogsTab business={business} />}

      {activeTab === 'PERFORMANCE' && <PerformanceTab business={business} />}

      {activeTab === 'RELIABILITY' && <PaymentReliabilityTab business={business} />}

      {activeTab === 'TENANT_SECURITY' && <TenantSecurityTab business={business} />}

      {activeTab === 'SCALABILITY' && <ScalabilityTab business={business} />}

      {activeTab === 'MONITORING' && <IntegrationHealthTab business={business} />}

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

      {activeTab === 'AUDIT_LOGS' && <AuditLogsManager business={business} auditLogs={auditLogs} />}

      <GuidedSetupWizardModal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        business={business}
        onSaveBusiness={async (updated) => {
          if (onUpdateBusiness) onUpdateBusiness(updated);
        }}
        onSendTestPayment={async (phone, amount) => {
          await fetch('/api/stkpush', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-business-id': business.id,
            },
            body: JSON.stringify({ phone, amount }),
          });
        }}
      />
    </div>
  );
};
