import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Key,
  Copy,
  Check,
  RefreshCw,
  Lock,
  QrCode,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  Send,
  Zap,
  Info,
  Sliders,
  X,
} from 'lucide-react';

interface StaffEnrollment {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  isEnrolled: boolean;
  enrolledAt?: string;
}

interface TwoFactorConfig {
  businessId: string;
  enabled: boolean;
  requiredRoles: ('ADMIN' | 'MANAGER' | 'CASHIER')[];
  enforceGracePeriodDays: number;
  issuerName: string;
  totpSecret: string;
  backupCodes: string[];
  staffEnrollment: StaffEnrollment[];
}

export const TwoFactorSecurityTab: React.FC<{ business: any }> = ({ business }) => {
  const [config, setConfig] = useState<TwoFactorConfig>({
    businessId: business?.id || 'biz-001',
    enabled: true,
    requiredRoles: ['ADMIN', 'MANAGER'],
    enforceGracePeriodDays: 7,
    issuerName: 'PesaRequest',
    totpSecret: 'JBSWY3DPEHPK3PXP',
    backupCodes: [],
    staffEnrollment: [],
  });
  const [totpUri, setTotpUri] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Test Code Verification State
  const [testCode, setTestCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyFeedback, setVerifyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Copy feedback
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetch2FAData();
  }, []);

  const fetch2FAData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/security/2fa');
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
        setTotpUri(data.totpUri || '');
      }
    } catch (err) {
      console.error('Failed to load 2FA settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnable = async (newEnabled: boolean) => {
    const updated = { ...config, enabled: newEnabled };
    setConfig(updated);
    await saveSettings(updated);
  };

  const handleRoleToggle = (role: 'ADMIN' | 'MANAGER' | 'CASHIER') => {
    let updatedRoles = [...config.requiredRoles];
    if (updatedRoles.includes(role)) {
      if (updatedRoles.length === 1) return; // Must keep at least one role
      updatedRoles = updatedRoles.filter((r) => r !== role);
    } else {
      updatedRoles.push(role);
    }
    const updated = { ...config, requiredRoles: updatedRoles };
    setConfig(updated);
  };

  const saveSettings = async (cfgToSave = config) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/security/2fa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfgToSave),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: data.message || 'Two-Factor Authentication policy updated!',
        });
        setConfig(data.config);
      } else {
        setFeedback({
          type: 'error',
          message: data.message || 'Failed to update 2FA policy',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Network error saving 2FA settings',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateKeys = async () => {
    if (
      !window.confirm(
        'Are you sure you want to generate a new TOTP secret and backup codes? Existing authenticator app bindings will need to be re-scanned.'
      )
    ) {
      return;
    }
    setRegenerating(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/security/2fa/regenerate-secret', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setTotpUri(data.totpUri || '');
        setFeedback({
          type: 'success',
          message: 'New TOTP Secret Key & Backup Codes generated successfully!',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Failed to regenerate TOTP keys',
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleVerifyTestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCode.trim()) return;
    setVerifying(true);
    setVerifyFeedback(null);
    try {
      const res = await fetch('/api/security/2fa/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: testCode.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifyFeedback({
          type: 'success',
          message: data.message,
        });
        setTestCode('');
        fetch2FAData(); // Refresh to reflect consumed backup code if applicable
      } else {
        setVerifyFeedback({
          type: 'error',
          message: data.message || 'Invalid 2FA code',
        });
      }
    } catch (err) {
      setVerifyFeedback({
        type: 'error',
        message: 'Network error verifying TOTP code',
      });
    } finally {
      setVerifying(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(config.totpSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(config.backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
        <p className="text-xs font-semibold">Loading 2FA Security Configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between font-semibold text-xs border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 2FA Status Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span
              className={`p-2.5 rounded-2xl ${
                config.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2.5">
                Staff Two-Factor Authentication (2FA)
                <span
                  className={`px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                    config.enabled
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {config.enabled ? 'ENFORCED FOR STAFF' : 'DISABLED'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Require staff members to provide a 6-digit dynamic TOTP token generated by Google Authenticator, Authy, or 1Password when logging in.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => handleToggleEnable(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* Policy & Enforcement Configuration */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-500" /> Staff Role Enforcement Scope
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select which staff access roles are required to pass TOTP verification during sign-in.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { role: 'ADMIN', title: 'Business Administrators', desc: 'Full system management & Daraja API keys' },
            { role: 'MANAGER', title: 'Finance Managers', desc: 'Reconciliations, reports & refunds' },
            { role: 'CASHIER', title: 'Store Cashiers', desc: 'STK Push triggers & customer register' },
          ].map((r) => {
            const isSelected = config.requiredRoles.includes(r.role as any);
            return (
              <button
                key={r.role}
                type="button"
                onClick={() => handleRoleToggle(r.role as any)}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-500/5 border-emerald-500/40 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wide">{r.title}</span>
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{r.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              New Staff Setup Grace Period
            </label>
            <select
              value={config.enforceGracePeriodDays}
              onChange={(e) => {
                const val = Number(e.target.value);
                const updated = { ...config, enforceGracePeriodDays: val };
                setConfig(updated);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={0}>Instant Enforcement (Mandatory upon first login)</option>
              <option value={3}>3 Days Grace Period</option>
              <option value={7}>7 Days Grace Period (Recommended)</option>
              <option value={14}>14 Days Grace Period</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Authenticator App Issuer Branding
            </label>
            <input
              type="text"
              value={config.issuerName}
              onChange={(e) => setConfig({ ...config, issuerName: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. PesaRequest-Store"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => saveSettings(config)}
            disabled={saving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save 2FA Policy Settings'}</span>
          </button>
        </div>
      </div>

      {/* TOTP Setup & QR Code Simulator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Code & Secret Key Box */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-500" /> Authenticator App Setup (TOTP)
            </h3>
            <button
              type="button"
              onClick={handleRegenerateKeys}
              disabled={regenerating}
              className="text-[11px] font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate Key</span>
            </button>
          </div>

          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            {/* Styled Simulated QR Code Canvas */}
            <div className="w-40 h-40 p-2.5 bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col items-center justify-center relative group">
              <div className="w-full h-full border-2 border-dashed border-slate-800 rounded-xl p-2 flex flex-col items-center justify-center gap-1 bg-slate-950 text-white">
                <Smartphone className="w-8 h-8 text-emerald-400" />
                <span className="text-[10px] font-mono font-bold text-emerald-400">PesaRequest 2FA</span>
                <span className="text-[9px] font-mono text-slate-400">Scan via Authenticator</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Scan with <strong>Google Authenticator</strong>, <strong>Authy</strong>, or <strong>Microsoft Authenticator</strong>.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Manual Setup Secret Key
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center tracking-widest">
                {config.totpSecret}
              </code>
              <button
                type="button"
                onClick={copySecret}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedSecret ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Test Verification & Emergency Backup Codes */}
        <div className="space-y-6">
          {/* Test Verification Input */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Key className="w-4 h-4 text-emerald-500" /> Verify 2FA Token Code
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test your 6-digit TOTP app code or an 8-digit backup code to verify system alignment.
            </p>

            <form onSubmit={handleVerifyTestCode} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={10}
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value)}
                  placeholder="Enter 6-digit code e.g. 123456"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono font-bold text-center tracking-widest outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={verifying || !testCode.trim()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  {verifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>

              {verifyFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    verifyFeedback.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {verifyFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span>{verifyFeedback.message}</span>
                </div>
              )}
            </form>
          </div>

          {/* Emergency Backup Codes Box */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500" /> Emergency Single-Use Recovery Codes
              </h3>
              <button
                type="button"
                onClick={copyBackupCodes}
                className="text-[11px] font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
              >
                {copiedCodes ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodes ? 'Copied Codes' : 'Copy All'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Keep these codes secure. They allow staff to bypass TOTP prompt if they lose access to their phone.
            </p>

            <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 font-bold text-center">
              {config.backupCodes.map((code, idx) => (
                <div key={idx} className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  {code}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Staff Enrollment Directory */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" /> Staff Member 2FA Enrollment Directory
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {config.staffEnrollment.filter((s) => s.isEnrolled).length} of {config.staffEnrollment.length} Enrolled
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Staff Member</th>
                  <th className="p-3.5">System Role</th>
                  <th className="p-3.5">2FA Enrollment Status</th>
                  <th className="p-3.5">Enrolled Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {config.staffEnrollment.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      <div>{staff.name}</div>
                      <div className="text-[11px] font-normal text-slate-500">{staff.email}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px]">
                        {staff.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {staff.isEnrolled ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> ENROLLED
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px] inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-500" /> PENDING SETUP
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {staff.enrolledAt ? new Date(staff.enrolledAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-3.5 text-right">
                      {!staff.isEnrolled && (
                        <button
                          type="button"
                          onClick={() => alert(`2FA Setup reminder sent to ${staff.email}!`)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3 text-emerald-500" /> Send Reminder
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
