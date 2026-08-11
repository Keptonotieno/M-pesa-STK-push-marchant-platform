import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Building2,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  Globe,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Info,
  ExternalLink,
  Key,
} from 'lucide-react';
import {
  auth,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  resetPassword,
  parseAuthError,
  checkFirebaseStartupConfig,
  AuthErrorDetails,
  FirebaseStartupStatus,
} from '../lib/firebase';
import { User, Business } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: Partial<User>, business?: Partial<Business>) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'DIAGNOSTICS'>('LOGIN');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');

  // Execution states
  const [isLoading, setIsLoading] = useState(false);
  const [parsedError, setParsedError] = useState<AuthErrorDetails | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [startupStatus, setStartupStatus] = useState<FirebaseStartupStatus | null>(null);

  useEffect(() => {
    if (isOpen) {
      const status = checkFirebaseStartupConfig();
      setStartupStatus(status);
      setParsedError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Email Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setParsedError(null);
    setSuccessMessage(null);

    try {
      const cred = await loginWithEmail(email.trim(), password);
      setIsLoading(false);
      setSuccessMessage('Authentication successful! Welcome back.');

      setTimeout(() => {
        onAuthSuccess({
          id: cred.user.uid,
          email: cred.user.email || email,
          name: cred.user.displayName || email.split('@')[0],
          role: 'BUSINESS_OWNER',
        });
        onClose();
      }, 800);
    } catch (err: any) {
      setIsLoading(false);
      console.error('Sign-in error:', err);
      setParsedError(parseAuthError(err));
    }
  };

  // Handle Email Registration
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || password.length < 6) {
      setParsedError({
        code: 'auth/weak-password',
        title: 'Validation Error',
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    setIsLoading(true);
    setParsedError(null);
    setSuccessMessage(null);

    try {
      const cred = await registerWithEmail(email.trim(), password);
      setIsLoading(false);
      setSuccessMessage('Account registered! A verification email has been sent to your inbox.');

      setTimeout(() => {
        onAuthSuccess(
          {
            id: cred.user.uid,
            email: cred.user.email || email,
            name: fullName || email.split('@')[0],
            phone: phone || '0700830335',
            role: 'BUSINESS_OWNER',
          },
          {
            name: businessName || `${fullName || 'Merchant'} Enterprise`,
            contactEmail: email,
            contactPhone: phone || '0700830335',
          }
        );
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsLoading(false);
      console.error('Registration error:', err);
      setParsedError(parseAuthError(err));
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setParsedError(null);
    setSuccessMessage(null);

    try {
      const cred = await loginWithGoogle();
      setIsLoading(false);
      setSuccessMessage('Google Sign-In verified!');

      setTimeout(() => {
        onAuthSuccess({
          id: cred.user.uid,
          email: cred.user.email || '',
          name: cred.user.displayName || 'Google User',
          role: 'BUSINESS_OWNER',
        });
        onClose();
      }, 800);
    } catch (err: any) {
      setIsLoading(false);
      console.error('Google Auth error:', err);
      setParsedError(parseAuthError(err));
    }
  };

  // Handle Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setParsedError({
        code: 'auth/invalid-email',
        title: 'Missing Email',
        message: 'Please enter your account email address to receive password reset instructions.',
      });
      return;
    }

    setIsLoading(true);
    setParsedError(null);
    setSuccessMessage(null);

    try {
      await resetPassword(email.trim());
      setIsLoading(false);
      setSuccessMessage('Password reset email dispatched! Please check your inbox.');
    } catch (err: any) {
      setIsLoading(false);
      setParsedError(parseAuthError(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {mode === 'LOGIN' && 'Merchant Sign In'}
            {mode === 'REGISTER' && 'Create Business Account'}
            {mode === 'FORGOT_PASSWORD' && 'Reset Password'}
            {mode === 'DIAGNOSTICS' && 'Firebase Auth Diagnostics'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'LOGIN' && 'Sign in to manage your M-PESA payment gateway'}
            {mode === 'REGISTER' && 'Register your store and setup Daraja 2.0 credentials'}
            {mode === 'FORGOT_PASSWORD' && 'Enter your email to receive a password reset link'}
            {mode === 'DIAGNOSTICS' && 'Configuration and authorized domain status'}
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setParsedError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition ${
              mode === 'LOGIN'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setParsedError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition ${
              mode === 'REGISTER'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('DIAGNOSTICS');
              setParsedError(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
              mode === 'DIAGNOSTICS'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="View Firebase Authorized Domains & Provider Config"
          >
            <Globe className="w-3.5 h-3.5" />
            Config
          </button>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">Success</h4>
              <p className="mt-0.5">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Detailed Actionable Error Display */}
        {parsedError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white">{parsedError.title}</h4>
                <p className="mt-0.5 leading-relaxed">{parsedError.message}</p>
              </div>
            </div>

            {parsedError.actionHint && (
              <div className="p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] leading-relaxed border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> How to Resolve:
                </span>
                <p>{parsedError.actionHint}</p>

                {parsedError.isDomainError && (
                  <div className="pt-2 border-t border-slate-800 text-[10px] text-emerald-400 font-mono">
                    Current Host: <span className="underline">{startupStatus?.currentHost}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="merchant@business.co.ke"
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => setMode('FORGOT_PASSWORD')}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'REGISTER' && (
          <form onSubmit={handleEmailRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jane Wanjiku"
                  className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Business / Store Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Westlands Supermarket"
                  className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@westlands.co.ke"
                  className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Business Account'
              )}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'FORGOT_PASSWORD' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="merchant@business.co.ke"
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Sending Reset Email...' : 'Send Password Reset Link'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white underline font-semibold"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* DIAGNOSTICS VIEW */}
        {mode === 'DIAGNOSTICS' && startupStatus && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Firebase Status:</span>
                <span className="font-bold text-emerald-500 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Initialized
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Firebase Project ID:</span>
                <span className="font-bold text-slate-900 dark:text-white">{startupStatus.projectId}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Auth Domain:</span>
                <span className="font-bold text-slate-900 dark:text-white">{startupStatus.authDomain}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Current App Host:</span>
                <span className="font-bold text-emerald-400">{startupStatus.currentHost}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-800 dark:text-slate-200 space-y-2">
              <h4 className="font-extrabold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Info className="w-4 h-4" /> Firebase Production Checklist
              </h4>
              <ul className="space-y-1.5 text-[11px] list-disc pl-4 text-slate-600 dark:text-slate-300">
                <li>
                  <strong>Authorized Domains:</strong> Add <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">{startupStatus.currentHost}</code> under Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains.
                </li>
                <li>
                  <strong>Auth Providers:</strong> Enable both <strong>Email/Password</strong> and <strong>Google</strong> under Firebase Console &gt; Authentication &gt; Sign-in method.
                </li>
                <li>
                  <strong>Vercel Environment Variables:</strong> Ensure <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">VITE_FIREBASE_API_KEY</code> and <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">VITE_FIREBASE_PROJECT_ID</code> are configured in Vercel.
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setMode('LOGIN')}
              className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider transition"
            >
              Return to Sign In
            </button>
          </div>
        )}

        {/* Divider & Google Sign-In Option */}
        {mode !== 'DIAGNOSTICS' && (
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="relative text-center">
              <span className="px-3 bg-white dark:bg-slate-900 text-[10px] font-bold uppercase tracking-widest text-slate-400 relative z-10">
                Or Continue With
              </span>
              <div className="absolute top-1/2 left-0 w-full border-t border-slate-200 dark:border-slate-800" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-xs transition flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google Account</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
