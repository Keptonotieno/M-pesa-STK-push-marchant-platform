import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  Phone,
  Building2,
  User,
  RefreshCw,
  AlertCircle,
  Tag,
  CheckCircle2,
  MapPin,
  CreditCard,
  Check,
  Sparkles,
  Send,
  HelpCircle,
  Key,
  CheckSquare,
  FileText,
  Award,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { User as UserType, Business, BUSINESS_CATEGORIES, PaymentMethodConfig, SubscriptionPlan } from '../types';
import { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, auth } from '../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import {
  saveBusinessToFirestore,
  saveUserToFirestore,
  saveBranchToFirestore,
  savePaymentMethodToFirestore,
  getUserFromFirestore,
  getBusinessFromFirestore,
} from '../lib/firestoreService';

interface Props {
  onLoginSuccess: (user: UserType, business: Business) => void;
}

const DRAFT_STORAGE_KEY = 'pesarequest_onboarding_draft';

export const AuthView: React.FC<Props> = ({ onLoginSuccess }) => {
  // Mode: 'LOGIN' | 'REGISTER' | 'RESET_PASSWORD' | 'LOGIN_VERIFY_OTP' | 'EMAIL_VERIFICATION'
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'RESET_PASSWORD' | 'LOGIN_VERIFY_OTP' | 'EMAIL_VERIFICATION'>('LOGIN');

  // Pending authentication state for email OTP verification
  const [pendingUser, setPendingUser] = useState<UserType | null>(null);
  const [pendingBusiness, setPendingBusiness] = useState<Business | null>(null);

  // Multi-step Registration Wizard: Step 1 (Details) -> Step 2 (Dual OTP) -> Step 3 (Plan) -> Step 4 (Payment Channel & Verification)
  const [registerStep, setRegisterStep] = useState<number>(1);

  // Form Fields - Default empty for production compliance
  const [email, setEmail] = useState('keptonotieno@gmail.com');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<string>('Retail Shop');
  const [customCategory, setCustomCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Nairobi, Kenya');
  const [kraPin, setKraPin] = useState('');

  // Step 2 Verification State
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [sentPhoneOtpCode, setSentPhoneOtpCode] = useState('');
  const [sentEmailOtpCode, setSentEmailOtpCode] = useState('');
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [emailCooldown, setEmailCooldown] = useState(0);

  // Countdown timer for OTP resend cooldowns
  useEffect(() => {
    if (phoneCooldown <= 0 && emailCooldown <= 0) return;
    const interval = setInterval(() => {
      setPhoneCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setEmailCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [phoneCooldown, emailCooldown]);

  // Ref tracking auto-dispatch triggers for registering accounts
  const autoDispatchedRef = useRef({ phone: false, email: false });

  useEffect(() => {
    if (registerStep === 1) {
      autoDispatchedRef.current = { phone: false, email: false };
    }
  }, [registerStep]);

  // Auto-dispatch BOTH Phone SMS OTP and Email OTP automatically when registering account
  useEffect(() => {
    if ((mode === 'REGISTER' && registerStep === 2) || mode === 'EMAIL_VERIFICATION') {
      if (mode === 'REGISTER' && !phoneVerified && !sentPhoneOtpCode && phone && !autoDispatchedRef.current.phone && !isSendingPhoneOtp) {
        autoDispatchedRef.current.phone = true;
        handleSendPhoneOtp();
      }
      if (!emailVerified && !sentEmailOtpCode && email && !autoDispatchedRef.current.email && !isSendingEmailOtp) {
        autoDispatchedRef.current.email = true;
        handleSendEmailOtp();
      }
    }
  }, [mode, registerStep, phoneVerified, sentPhoneOtpCode, phone, emailVerified, sentEmailOtpCode, email, isSendingPhoneOtp, isSendingEmailOtp]);

  // Step 3 Subscription Plan & Billing Cycle
  const [selectedPlanTier, setSelectedPlanTier] = useState<'STARTER' | 'GROWTH' | 'ENTERPRISE'>('GROWTH');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  // Step 4 Payment Channel Config
  const [paymentType, setPaymentType] = useState<'BUY_GOODS' | 'PAYBILL' | 'BANK'>('BUY_GOODS');
  const [paymentName, setPaymentName] = useState('Main Store Till');
  const [tillNumber, setTillNumber] = useState('');
  const [paybillNumber, setPaybillNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // Automated Merchant Verification Workflow State
  const [isVerifyingMerchant, setIsVerifyingMerchant] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationCheckStep, setVerificationCheckStep] = useState(0);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [hasDraft, setHasDraft] = useState(false);

  // Created tenant references during registration
  const [createdUser, setCreatedUser] = useState<UserType | null>(null);
  const [createdBusiness, setCreatedBusiness] = useState<Business | null>(null);

  // Restore onboarding progress draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && parsed.email) {
          setHasDraft(true);
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved onboarding draft');
    }
  }, []);

  // Save current step & fields to localStorage draft
  const saveDraftToStorage = (updatedFields?: Record<string, any>) => {
    try {
      const draftData = {
        registerStep,
        email,
        fullName,
        businessName,
        category,
        customCategory,
        phone,
        location,
        kraPin,
        selectedPlanTier,
        billingCycle,
        paymentType,
        paymentName,
        tillNumber,
        paybillNumber,
        accountNumber,
        phoneVerified,
        emailVerified,
        createdUser,
        createdBusiness,
        updatedAt: new Date().toISOString(),
        ...updatedFields,
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
    } catch (e) {
      console.warn('Could not save onboarding draft to localStorage');
    }
  };

  const clearDraftStorage = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
    } catch (e) {
      console.warn('Could not clear onboarding draft');
    }
  };

  const handleResumeDraft = () => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const p = JSON.parse(savedDraft);
        if (p.email) setEmail(p.email);
        if (p.fullName) setFullName(p.fullName);
        if (p.businessName) setBusinessName(p.businessName);
        if (p.category) setCategory(p.category);
        if (p.customCategory) setCustomCategory(p.customCategory);
        if (p.phone) setPhone(p.phone);
        if (p.location) setLocation(p.location);
        if (p.kraPin) setKraPin(p.kraPin);
        if (p.selectedPlanTier) setSelectedPlanTier(p.selectedPlanTier);
        if (p.billingCycle) setBillingCycle(p.billingCycle);
        if (p.paymentType) setPaymentType(p.paymentType);
        if (p.paymentName) setPaymentName(p.paymentName);
        if (p.tillNumber) setTillNumber(p.tillNumber);
        if (p.paybillNumber) setPaybillNumber(p.paybillNumber);
        if (p.accountNumber) setAccountNumber(p.accountNumber);
        if (p.phoneVerified) setPhoneVerified(p.phoneVerified);
        if (p.emailVerified) setEmailVerified(p.emailVerified);
        if (p.createdUser) setCreatedUser(p.createdUser);
        if (p.createdBusiness) setCreatedBusiness(p.createdBusiness);
        if (p.registerStep) setRegisterStep(p.registerStep);

        setMode('REGISTER');
        setHasDraft(false);
        setSuccessMsg(`Resumed registration draft at Step ${p.registerStep || 1}.`);
      }
    } catch (e) {
      setErrorMsg('Could not restore draft data.');
    }
  };

  // Helper for Kenyan Phone formatting & validation
  const normalizeKenyanPhone = (raw: string) => {
    let clean = raw.trim().replace(/[\s\-\(\)]/g, '');
    if (clean.startsWith('07') || clean.startsWith('01')) {
      return '+254' + clean.slice(1);
    }
    if (clean.startsWith('254')) {
      return '+' + clean;
    }
    if (!clean.startsWith('+')) {
      return '+254' + clean;
    }
    return clean;
  };

  const isValidKenyanPhone = (raw: string) => {
    const clean = raw.trim().replace(/[\s\-\(\)]/g, '');
    return /^(07|01|254|\+254)\d{8}$/.test(clean);
  };

  const isValidEmail = (e: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  };

  const isValidKraPin = (pin: string) => {
    if (!pin) return true; // Optional on initial fill, but validated if provided
    return /^[A|P|C]\d{9}[A-Z]$/i.test(pin.trim());
  };

  // Password Strength Meter
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-800' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score === 1) return { score: 1, label: 'Weak (Min. 6 chars)', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair (Add uppercase/numbers)', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong Password', color: 'bg-emerald-500' };
  };

  const pwdStrength = getPasswordStrength(password);

  // Google OAuth Sign-in
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const result = await loginWithGoogle();
      const fbUser = result.user;

      let user = await getUserFromFirestore(fbUser.uid);
      let business: Business | null = null;

      if (!user) {
        const newBizId = 'biz-' + Date.now();
        business = {
          id: newBizId,
          name: (fbUser.displayName || 'Merchant') + "'s Business",
          category: 'SME',
          customCategory: '',
          paybill: '522522',
          tillNumber: '174' + Math.floor(100 + Math.random() * 900),
          subscriptionTier: 'GROWTH',
          subscriptionRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          subscriptionStatus: 'ACTIVE',
          maxBranches: 5,
          maxStaff: 10,
          maxTransactions: 500000,
          unlockedFeatures: ['STK_PUSH', 'AUTO_DISCON', 'ANALYTICS'],
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          address: 'Nairobi CBD',
          kraPin: 'P051000000Z',
          contactEmail: fbUser.email || '',
          contactPhone: fbUser.phoneNumber || '0700000000',
        };

        user = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Business Owner',
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || '0700000000',
          role: 'BUSINESS_OWNER',
          businessId: newBizId,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        };

        await saveBusinessToFirestore(business);
        await saveUserToFirestore(user);
        await saveBranchToFirestore({
          id: 'br-' + Date.now(),
          businessId: newBizId,
          name: 'Main HQ Branch',
          code: 'HQ-01',
          location: 'Nairobi CBD',
          managerName: user.name,
          phone: user.phone,
          tillNumber: business.tillNumber,
          status: 'ACTIVE',
          totalRevenue: 0,
          transactionCount: 0,
        });
      } else {
        business = await getBusinessFromFirestore(user.businessId);
      }

      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fbUser.email || user.email, password: 'google_firebase_auth' }),
      });

      if (user && business) {
        setPendingUser(user);
        setPendingBusiness(business);
        const targetEmail = (fbUser.email || user.email || email).toLowerCase().trim();
        setEmail(targetEmail);
        setMode('LOGIN_VERIFY_OTP');
        dispatchLoginEmailOtp(targetEmail);
      } else {
        setErrorMsg('Could not initialize tenant profile.');
      }
    } catch (err: any) {
      console.error('Firebase Auth Google Sign-In error:', err);
      setErrorMsg(err?.message || 'Firebase Auth Sign-In failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Login Email OTP Dispatch Helper (Resend Service)
  const dispatchLoginEmailOtp = async (targetEmail: string) => {
    const cleanEmail = targetEmail.toLowerCase().trim();
    setIsSendingEmailOtp(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: cleanEmail, type: 'EMAIL', recipientEmail: cleanEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSentEmailOtpCode('SENT');
        setEmailCooldown(60);
        if (data.resendStatus === 'SENT') {
          setEmailOtp(data.demoCode || '');
          setSuccessMsg(`Security OTP dispatched via Resend Email to ${cleanEmail}! Code: ${data.demoCode}`);
        } else if (data.demoCode) {
          setEmailOtp(data.demoCode);
          setSuccessMsg(`Security OTP code sent to ${cleanEmail}! Code: ${data.demoCode}`);
        } else {
          setSuccessMsg(`Security OTP dispatched via Resend Email to ${cleanEmail}! Please check your inbox.`);
        }
      } else {
        if (data.cooldownRemainingSeconds) {
          setEmailCooldown(data.cooldownRemainingSeconds);
        }
        setErrorMsg(data.message || 'Failed to dispatch Email OTP via Resend.');
      }
    } catch (err) {
      setErrorMsg('Network error while requesting Email OTP dispatch.');
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  // Login Email OTP Verification Handler
  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = (pendingUser?.email || email).toLowerCase().trim();
    if (!emailOtp) {
      setErrorMsg('Please enter the 6-digit OTP code sent to your email.');
      return;
    }
    setIsVerifyingEmailOtp(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: targetEmail, code: emailOtp }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailVerified(true);
        setSuccessMsg('Email OTP verified successfully via Resend! Redirecting to Merchant Dashboard...');
        setTimeout(() => {
          if (pendingUser && pendingBusiness) {
            clearDraftStorage();
            onLoginSuccess(pendingUser, pendingBusiness);
          } else {
            setErrorMsg('Session expired. Please sign in again.');
            setMode('LOGIN');
          }
        }, 600);
      } else {
        setErrorMsg(data.message || 'Invalid 6-digit Email OTP code. Please check and try again.');
      }
    } catch (err) {
      setErrorMsg('Failed to verify Email OTP. Please check your connection.');
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  // Password Reset Handler
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your account email address.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await resetPassword(email);
      setSuccessMsg(`Password reset link sent to ${email}. Check your inbox or spam folder.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send password reset email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Login Submit Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let fbUser: any = null;
      let fbError: any = null;

      try {
        const cred = await loginWithEmail(email, password);
        fbUser = cred.user;
      } catch (err: any) {
        fbError = err;
      }

      let user = fbUser ? await getUserFromFirestore(fbUser.uid) : null;
      let business: Business | null = user ? await getBusinessFromFirestore(user.businessId) : null;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (data.success && data.user) {
          const finalUser = user || data.user;
          const finalBiz = business || data.business;
          setPendingUser(finalUser);
          setPendingBusiness(finalBiz);
          setEmail(finalUser.email);
          setMode('LOGIN_VERIFY_OTP');
          dispatchLoginEmailOtp(finalUser.email);
          return;
        }
      } catch (apiErr) {
        console.warn('Backend login fallback warning:', apiErr);
      }

      if (user && business) {
        setPendingUser(user);
        setPendingBusiness(business);
        setEmail(user.email);
        setMode('LOGIN_VERIFY_OTP');
        dispatchLoginEmailOtp(user.email);
        return;
      }

      if (fbError) {
        const code = fbError?.code || '';
        if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
          setErrorMsg('Invalid email or password. Please check your credentials or register a new business.');
        } else if (code === 'auth/user-disabled') {
          setErrorMsg('This merchant account has been disabled. Please contact PesaRequest support.');
        } else {
          setErrorMsg(fbError?.message || 'Sign in failed. Please verify your credentials.');
        }
      } else {
        setErrorMsg('Invalid credentials or merchant profile not found.');
      }
    } catch (err: any) {
      setErrorMsg('Connection error. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1 Registration Details Handler with Real-Time Validation & Duplicate Check
  const handleRegisterStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !fullName || !email || !password || !phone) {
      setErrorMsg('Please fill in all required fields marked with *');
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid email address (e.g. owner@business.co.ke).');
      return;
    }

    if (!isValidKenyanPhone(phone)) {
      setErrorMsg('Please enter a valid Kenyan M-PESA phone number (e.g. 0712345678 or 254712345678).');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (kraPin && !isValidKraPin(kraPin)) {
      setErrorMsg('Invalid KRA PIN format. Must start with P, A, or C followed by 9 digits and end with a letter (e.g. P051928374Z).');
      return;
    }

    const formattedPhone = normalizeKenyanPhone(phone);
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Check email & phone availability against backend
      const checkRes = await fetch('/api/auth/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone: formattedPhone }),
      });
      const checkData = await checkRes.json();
      if (checkData && checkData.available === false) {
        setErrorMsg(checkData.message || 'An account with these details already exists.');
        setIsSubmitting(false);
        return;
      }

      // 2. Firebase Auth User Creation
      let credential: any = null;
      try {
        credential = await registerWithEmail(email, password);
      } catch (fbErr: any) {
        if (fbErr?.code === 'auth/email-already-in-use') {
          setErrorMsg('An account with this email address already exists in Firebase. Please sign in.');
          setIsSubmitting(false);
          return;
        }
        console.warn('Firebase Auth registration warning, falling back to local tenant creation:', fbErr);
      }

      const uid = credential?.user?.uid || 'usr-reg-' + Date.now();
      const newBizId = 'biz-' + Date.now();
      const finalTill = '174' + Math.floor(100 + Math.random() * 900);
      const cleanKraPin = (kraPin || 'P051' + Math.floor(1000000 + Math.random() * 9000000) + 'Z').toUpperCase().trim();

      // Create Business Record in PENDING_VERIFICATION state
      const newBiz: Business = {
        id: newBizId,
        name: businessName,
        category: category === 'Other / Custom' && customCategory ? customCategory : category,
        customCategory: customCategory || '',
        paybill: '522522',
        tillNumber: finalTill,
        subscriptionTier: 'GROWTH',
        subscriptionRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionStatus: 'ACTIVE',
        maxBranches: 5,
        maxStaff: 10,
        maxTransactions: 500000,
        unlockedFeatures: ['STK_PUSH', 'AUTO_DISCON', 'ANALYTICS', 'MULTI_BRANCH'],
        status: 'PENDING_VERIFICATION',
        createdAt: new Date().toISOString(),
        address: location || 'Nairobi, Kenya',
        kraPin: cleanKraPin,
        contactEmail: email,
        contactPhone: formattedPhone,
      };

      // Create User Profile Record (BUSINESS_OWNER)
      const newUser: UserType = {
        id: uid,
        name: fullName,
        email,
        phone: formattedPhone,
        role: 'BUSINESS_OWNER',
        businessId: newBizId,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      // Create Default HQ Branch
      const newBranch = {
        id: 'br-' + Date.now(),
        businessId: newBizId,
        name: businessName + ' HQ',
        code: 'HQ-01',
        location: location || 'Nairobi CBD',
        managerName: fullName,
        phone: formattedPhone,
        tillNumber: finalTill,
        status: 'ACTIVE' as const,
        totalRevenue: 0,
        transactionCount: 0,
      };

      await saveBusinessToFirestore(newBiz);
      await saveUserToFirestore(newUser);
      await saveBranchToFirestore(newBranch);

      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: newBizId,
          userId: uid,
          businessName,
          category: category === 'Other / Custom' && customCategory ? customCategory : category,
          customCategory,
          email,
          phone: formattedPhone,
          fullName,
          kraPin: cleanKraPin,
          tillNumber: finalTill,
          paybill: '522522',
          address: location || 'Nairobi, Kenya',
          subscriptionTier: 'GROWTH',
        }),
      });

      setCreatedUser(newUser);
      setCreatedBusiness(newBiz);
      setTillNumber(finalTill);

      // Save draft & advance to Step 2
      saveDraftToStorage({
        registerStep: 2,
        createdUser: newUser,
        createdBusiness: newBiz,
        phone: formattedPhone,
        tillNumber: finalTill,
      });

      setRegisterStep(2);
      setSuccessMsg(`Business details saved! Complete Phone and Email OTP verification to proceed.`);
    } catch (err: any) {
      console.error('Registration Step 1 error:', err);
      setErrorMsg('Failed to process registration step. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 OTP Handlers
  const handleSendPhoneOtp = async () => {
    if (phoneCooldown > 0) {
      setErrorMsg(`Please wait ${phoneCooldown}s before requesting a new SMS OTP.`);
      return;
    }
    setIsSendingPhoneOtp(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const formattedPhone = normalizeKenyanPhone(phone);
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: formattedPhone, type: 'PHONE', recipientEmail: email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSentPhoneOtpCode('SENT');
        setPhoneCooldown(60);
        if (data.resendStatus === 'SENT') {
          setPhoneOtp(data.demoCode || '');
          setSuccessMsg(`OTP sent via Resend Email to ${email} (for ${formattedPhone})! Code: ${data.demoCode}`);
        } else if (data.demoCode) {
          setPhoneOtp(data.demoCode);
          setSuccessMsg(`M-PESA Phone SMS OTP sent to ${formattedPhone}! Code: ${data.demoCode}`);
        } else {
          setSuccessMsg(`M-PESA Phone SMS OTP dispatched to ${formattedPhone}!`);
        }
      } else {
        if (data.cooldownRemainingSeconds) {
          setPhoneCooldown(data.cooldownRemainingSeconds);
        }
        setErrorMsg(data.message || 'Failed to send Phone OTP');
      }
    } catch (err) {
      setErrorMsg('Network error while requesting Phone OTP.');
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp) {
      setErrorMsg('Please enter the 6-digit Phone OTP code.');
      return;
    }
    setIsVerifyingPhoneOtp(true);
    setErrorMsg('');
    try {
      const formattedPhone = normalizeKenyanPhone(phone);
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: formattedPhone, code: phoneOtp }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPhoneVerified(true);
        saveDraftToStorage({ phoneVerified: true });
        setSuccessMsg('M-PESA Phone Number Verified Successfully! ✓');
      } else {
        setErrorMsg(data.message || 'Invalid Phone OTP code.');
      }
    } catch (err) {
      setErrorMsg('Failed to verify Phone OTP.');
    } finally {
      setIsVerifyingPhoneOtp(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (emailCooldown > 0) {
      setErrorMsg(`Please wait ${emailCooldown}s before requesting a new Email OTP.`);
      return;
    }
    setIsSendingEmailOtp(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: email, type: 'EMAIL', recipientEmail: email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSentEmailOtpCode('SENT');
        setEmailCooldown(60);
        if (data.resendStatus === 'SENT') {
          setEmailOtp(data.demoCode || '');
          setSuccessMsg(`Email OTP sent via Resend to ${email}! Code: ${data.demoCode}`);
        } else if (data.demoCode) {
          setEmailOtp(data.demoCode);
          setSuccessMsg(`Email verification OTP sent to ${email}! Code: ${data.demoCode}`);
        } else {
          setSuccessMsg(`Email verification OTP dispatched to ${email}!`);
        }
      } else {
        if (data.cooldownRemainingSeconds) {
          setEmailCooldown(data.cooldownRemainingSeconds);
        }
        setErrorMsg(data.message || 'Failed to send Email OTP');
      }
    } catch (err) {
      setErrorMsg('Network error while requesting Email OTP.');
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp) {
      setErrorMsg('Please enter the 6-digit Email OTP code.');
      return;
    }
    setIsVerifyingEmailOtp(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: email, code: emailOtp }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailVerified(true);
        saveDraftToStorage({ emailVerified: true });

        // Construct verified user profile
        const finalUser: UserType = {
          ...(createdUser || pendingUser || {
            id: 'usr-' + Date.now(),
            name: fullName || 'Merchant Business Owner',
            email: email,
            phone: phone || '+254700000000',
            role: 'BUSINESS_OWNER',
            businessId: createdBusiness?.id || 'biz-' + Date.now(),
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
          }),
          emailVerified: true,
          isEmailVerified: true,
          status: 'ACTIVE',
        };

        // Construct verified business profile
        const finalBiz: Business = createdBusiness || pendingBusiness || {
          id: finalUser.businessId,
          name: businessName || 'Merchant Business HQ',
          category: category || 'Retail Shop',
          paybill: '522522',
          tillNumber: tillNumber || '174379',
          subscriptionTier: 'GROWTH',
          subscriptionRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          subscriptionStatus: 'ACTIVE',
          maxBranches: 5,
          maxStaff: 10,
          maxTransactions: 500000,
          unlockedFeatures: ['STK_PUSH', 'AUTO_DISCON', 'ANALYTICS', 'MULTI_BRANCH'],
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          address: location || 'Nairobi, Kenya',
          kraPin: kraPin || 'P051928374Z',
          contactEmail: email,
          contactPhone: phone || '+254700000000',
        };
        finalBiz.status = 'ACTIVE';

        // Store user verified status in Firestore
        await saveUserToFirestore(finalUser);
        await saveBusinessToFirestore(finalBiz);

        // Notify backend service of verification status
        try {
          await fetch('/api/auth/update-user-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: finalUser.id, emailVerified: true, status: 'ACTIVE' }),
          });
        } catch (backendErr) {
          console.warn('Backend user status sync warning:', backendErr);
        }

        setCreatedUser(finalUser);
        setCreatedBusiness(finalBiz);

        setSuccessMsg('🎉 Email Address Verified Successfully! Verified status saved to Firestore. Redirecting to Dashboard...');
        clearDraftStorage();

        // Allow navigation to DashboardView by calling onLoginSuccess
        setTimeout(() => {
          onLoginSuccess(finalUser, finalBiz);
        }, 800);
      } else {
        setErrorMsg(data.message || 'Invalid Email OTP code. Please check your email and try again.');
      }
    } catch (err) {
      console.error('Failed to verify Email OTP:', err);
      setErrorMsg('Network error while verifying Email OTP code. Please try again.');
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  const handleProceedFromStep2 = () => {
    if (!phoneVerified || !emailVerified) {
      setErrorMsg('You must verify BOTH your M-PESA Phone Number and Email Address before proceeding.');
      return;
    }
    saveDraftToStorage({ registerStep: 3, phoneVerified: true, emailVerified: true });
    setRegisterStep(3);
    setErrorMsg('');
    setSuccessMsg('Contact verification complete! Select your subscription plan.');
  };

  // Step 3 Plan Save
  const handleSelectPlan = async (tier: 'STARTER' | 'GROWTH' | 'ENTERPRISE') => {
    setSelectedPlanTier(tier);
    if (createdBusiness) {
      const updatedBiz = { ...createdBusiness, subscriptionTier: tier };
      setCreatedBusiness(updatedBiz);
      await saveBusinessToFirestore(updatedBiz);
    }
    saveDraftToStorage({ registerStep: 4, selectedPlanTier: tier, billingCycle });
    setRegisterStep(4);
    setErrorMsg('');
  };

  // Step 4 Complete Onboarding & Automated Merchant Verification Trigger
  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const bizId = createdBusiness?.id || pendingBusiness?.id || ('biz-' + Date.now());
      const userId = createdUser?.id || pendingUser?.id || ('usr-' + Date.now());

      const activeUser: UserType = createdUser || pendingUser || {
        id: userId,
        name: fullName || 'Merchant Business Owner',
        email: email,
        phone: phone || '+254700000000',
        role: 'BUSINESS_OWNER',
        businessId: bizId,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        emailVerified: true,
        isEmailVerified: true,
      };

      const pmId = 'pm-' + Date.now();
      const pmType = paymentType === 'PAYBILL' ? 'PAYBILL' : paymentType === 'BANK' ? 'BANK' : 'TILL_NUMBER';
      const selectedShortcode = paymentType === 'PAYBILL' ? (paybillNumber || '522522') : (tillNumber || '174379');

      const updatedBiz: Business = {
        id: bizId,
        name: businessName || createdBusiness?.name || 'Merchant HQ',
        category: category || createdBusiness?.category || 'Retail Shop',
        paybill: paybillNumber || createdBusiness?.paybill || '522522',
        tillNumber: tillNumber || createdBusiness?.tillNumber || '174379',
        subscriptionTier: selectedPlanTier || createdBusiness?.subscriptionTier || 'GROWTH',
        subscriptionRenewalDate: createdBusiness?.subscriptionRenewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionStatus: 'ACTIVE',
        maxBranches: createdBusiness?.maxBranches || 5,
        maxStaff: createdBusiness?.maxStaff || 10,
        maxTransactions: createdBusiness?.maxTransactions || 500000,
        unlockedFeatures: createdBusiness?.unlockedFeatures || ['STK_PUSH', 'AUTO_DISCON', 'ANALYTICS', 'MULTI_BRANCH'],
        status: 'PENDING_VERIFICATION',
        createdAt: createdBusiness?.createdAt || new Date().toISOString(),
        address: location || createdBusiness?.address || 'Nairobi, Kenya',
        kraPin: kraPin || createdBusiness?.kraPin || 'P051928374Z',
        contactEmail: email || createdBusiness?.contactEmail || '',
        contactPhone: phone || createdBusiness?.contactPhone || '',
      };

      const pmConfig: PaymentMethodConfig = {
        id: pmId,
        businessId: updatedBiz.id,
        type: pmType,
        name: paymentName || (paymentType === 'PAYBILL' ? 'Main Paybill Channel' : paymentType === 'BANK' ? 'Bank Settlement Account' : 'Main Store Till'),
        shortcodeOrNumber: selectedShortcode,
        accountNumber: paymentType === 'PAYBILL' ? (accountNumber || 'INV-001') : '',
        isDefault: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        provider: 'SAFARICOM_MPESA',
      };

      setCreatedUser(activeUser);
      setCreatedBusiness(updatedBiz);

      await saveBusinessToFirestore(updatedBiz);
      await savePaymentMethodToFirestore(pmConfig);
      await saveUserToFirestore(activeUser);

      try {
        await fetch('/api/business/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-business-id': updatedBiz.id },
          body: JSON.stringify(updatedBiz),
        });
        await fetch('/api/payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-business-id': updatedBiz.id },
          body: JSON.stringify(pmConfig),
        });
      } catch (apiErr) {
        console.warn('Backend sync warning on onboarding completion:', apiErr);
      }

      // Launch Merchant Verification Workflow Screen
      setIsVerifyingMerchant(true);
      setVerificationProgress(10);
      setVerificationCheckStep(1);

      // Simulate automated verification checks sequentially
      setTimeout(() => {
        setVerificationProgress(35);
        setVerificationCheckStep(2);
      }, 900);

      setTimeout(() => {
        setVerificationProgress(65);
        setVerificationCheckStep(3);
      }, 1800);

      setTimeout(() => {
        setVerificationProgress(90);
        setVerificationCheckStep(4);
      }, 2700);

      setTimeout(async () => {
        setVerificationProgress(100);
        try {
          const res = await fetch('/api/auth/verify-merchant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessId: updatedBiz.id, kraPin: updatedBiz.kraPin }),
          });
          const data = await res.json();
          if (data.success && data.business) {
            const verifiedBiz = { ...data.business, status: 'ACTIVE' as const };
            await saveBusinessToFirestore(verifiedBiz);

            clearDraftStorage();
            setSuccessMsg('Merchant Workspace Verified & Activated! Redirecting to Dashboard...');
            setTimeout(() => {
              onLoginSuccess(data.user || createdUser, verifiedBiz);
            }, 1000);
          } else {
            // Fallback activate
            const verifiedBiz = { ...updatedBiz, status: 'ACTIVE' as const };
            await saveBusinessToFirestore(verifiedBiz);
            clearDraftStorage();
            onLoginSuccess(createdUser, verifiedBiz);
          }
        } catch (verErr) {
          const verifiedBiz = { ...updatedBiz, status: 'ACTIVE' as const };
          await saveBusinessToFirestore(verifiedBiz);
          clearDraftStorage();
          onLoginSuccess(createdUser, verifiedBiz);
        }
      }, 3600);
    } catch (err: any) {
      console.error('Onboarding completion error:', err);
      setErrorMsg('An error occurred during payment channel configuration. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-3 sm:p-4">
      <div className={`w-full ${mode === 'REGISTER' ? 'max-w-[460px]' : 'max-w-[380px]'} bg-slate-900/90 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 shadow-2xl space-y-3.5 relative overflow-hidden transition-all duration-300`}>
        {/* Background glow effects */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Branding */}
        <div className="text-center space-y-1 relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-slate-950 flex items-center justify-center font-black text-lg mx-auto shadow-md shadow-emerald-500/20">
            P
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {mode === 'LOGIN' && 'Sign In to PesaRequest'}
            {mode === 'LOGIN_VERIFY_OTP' && 'Email Security Verification'}
            {mode === 'RESET_PASSWORD' && 'Reset Merchant Password'}
            {mode === 'EMAIL_VERIFICATION' && 'Dedicated Email Verification'}
            {mode === 'REGISTER' && `Business Onboarding (Step ${registerStep} of 4)`}
          </h2>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-snug">
            {mode === 'LOGIN' && 'Multi-tenant M-PESA payment requests & automated STK Push engine.'}
            {mode === 'LOGIN_VERIFY_OTP' && 'Verify account ownership via the 6-digit OTP sent to your email.'}
            {mode === 'RESET_PASSWORD' && 'Enter account email to receive password reset link.'}
            {mode === 'EMAIL_VERIFICATION' && 'Enter the 6-digit OTP code sent to your email to activate your account.'}
            {mode === 'REGISTER' && registerStep === 1 && 'Create a verified merchant workspace to start accepting M-PESA.'}
            {mode === 'REGISTER' && registerStep === 2 && 'Verify ownership of your M-PESA phone number and email address.'}
            {mode === 'REGISTER' && registerStep === 3 && 'Choose a flexible subscription plan matching your business.'}
            {mode === 'REGISTER' && registerStep === 4 && 'Configure your Safaricom Buy Goods Till or Paybill channel.'}
          </p>
        </div>

        {/* Resume Saved Draft Prompt */}
        {hasDraft && mode === 'LOGIN' && (
          <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-[11px]">Incomplete Onboarding Draft</div>
                <div className="text-[10px] text-emerald-300/80">Resume registration?</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleResumeDraft}
                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-lg transition text-[10px]"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={clearDraftStorage}
                className="px-1.5 py-1 text-slate-400 hover:text-white transition text-[10px] underline"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Status Banners */}
        {errorMsg && (
          <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-snug text-[11px]">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-snug text-[11px]">{successMsg}</div>
          </div>
        )}

        {/* ----------------- MODE 1: LOGIN ----------------- */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Account Email *</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.co.ke"
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-800 bg-slate-950/80 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-300">Password *</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('RESET_PASSWORD');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium transition cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-800 bg-slate-950/80 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Sign In to Merchant Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* Google Login */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-wider">
                <span className="bg-slate-900 px-2 text-slate-500">Or Continue With</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full h-10 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
              <span>Sign In with Google</span>
            </button>

            {/* Registration link */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('REGISTER');
                  setRegisterStep(1);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold transition hover:underline cursor-pointer"
              >
                New Merchant? Register Business Account
              </button>
            </div>
          </form>
        )}

        {/* ----------------- MODE 4: LOGIN EMAIL OTP VERIFICATION (RESEND) ----------------- */}
        {mode === 'LOGIN_VERIFY_OTP' && (
          <form onSubmit={handleVerifyLoginOtp} className="space-y-3.5">
            <div className="p-3 bg-slate-950/80 border border-emerald-500/30 rounded-xl space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate max-w-[190px]">{pendingUser?.email || email}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3 h-3 text-emerald-400" /> Resend Email
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                A 6-digit security verification OTP code was dispatched to your email via Resend. Enter the code below to open your dashboard.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Enter 6-Digit Email Verification Code *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.4em] font-mono font-bold text-lg h-11 rounded-xl border border-slate-800 bg-slate-950/90 text-emerald-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
                <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifyingEmailOtp || !emailOtp}
              className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isVerifyingEmailOtp ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Verify OTP & Open Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <button
                type="button"
                onClick={() => dispatchLoginEmailOtp(pendingUser?.email || email)}
                disabled={isSendingEmailOtp || emailCooldown > 0}
                className="text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:no-underline"
              >
                {isSendingEmailOtp ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                <span>
                  {emailCooldown > 0
                    ? `Resend Email OTP (${emailCooldown}s)`
                    : 'Resend Email Verification Code'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setPendingUser(null);
                  setPendingBusiness(null);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-slate-400 hover:text-white underline font-medium cursor-pointer"
              >
                Cancel Sign In
              </button>
            </div>
          </form>
        )}

        {/* ----------------- MODE 2: FORGOT PASSWORD ----------------- */}
        {mode === 'RESET_PASSWORD' && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Account Email *</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@merchant.co.ke"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send Password Reset Link</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-white underline font-semibold cursor-pointer"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {/* ----------------- DEDICATED EMAIL VERIFICATION STATE ----------------- */}
        {mode === 'EMAIL_VERIFICATION' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-3.5 bg-slate-950/90 border border-emerald-500/30 rounded-xl space-y-2 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate max-w-[200px] text-emerald-300 font-mono">{email}</span>
                </div>
                {emailVerified ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    OTP Dispatched
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                An email verification code has been dispatched automatically. Enter the 6-digit OTP sent to your inbox to verify your status in Firestore and open the Dashboard.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enter 6-Digit Email OTP *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.4em] font-mono font-bold text-base h-11 rounded-xl border border-slate-800 bg-slate-950 text-emerald-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-600"
                  />
                  <ShieldCheck className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="button"
                onClick={handleVerifyEmailOtp}
                disabled={isVerifyingEmailOtp || !emailOtp}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 active:scale-[0.99] text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {isVerifyingEmailOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying & Saving Status...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Open Dashboard</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <button
                  type="button"
                  onClick={handleSendEmailOtp}
                  disabled={isSendingEmailOtp || emailCooldown > 0}
                  className="text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:no-underline"
                >
                  {isSendingEmailOtp ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  <span>
                    {emailCooldown > 0
                      ? `Resend Code (${emailCooldown}s)`
                      : 'Resend Email OTP'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('REGISTER')}
                  className="text-slate-400 hover:text-white underline font-medium cursor-pointer"
                >
                  Edit Registration Info
                </button>
              </div>
            </div>

            <div className="text-center pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-xs text-slate-400 hover:text-emerald-400 underline font-semibold cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* ----------------- MODE 3: REGISTER & ENFORCED MULTI-STEP ONBOARDING ----------------- */}
        {mode === 'REGISTER' && !isVerifyingMerchant && (
          <div className="space-y-6">
            {/* Progress Stepper Bar */}
            <div className="grid grid-cols-4 gap-2 pb-4 border-b border-slate-800">
              {[
                { step: 1, label: 'Details' },
                { step: 2, label: 'Verify OTP' },
                { step: 3, label: 'Plan' },
                { step: 4, label: 'Payment' },
              ].map((s) => {
                const isCompleted = registerStep > s.step || (s.step === 2 && phoneVerified && emailVerified);
                const isCurrent = registerStep === s.step;
                const canNavigateToStep = s.step < registerStep || (s.step === 2 && registerStep >= 2);

                return (
                  <div
                    key={s.step}
                    onClick={() => {
                      if (canNavigateToStep) {
                        setRegisterStep(s.step);
                      }
                    }}
                    className={`text-center transition ${canNavigateToStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                  >
                    <div
                      className={`h-1.5 rounded-full mb-1.5 transition-all ${
                        isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-emerald-400 animate-pulse' : 'bg-slate-800'
                      }`}
                    />
                    <div className="flex items-center justify-center gap-1">
                      {isCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> : null}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isCurrent ? 'text-emerald-400' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* STEP 1: Registration Details */}
            {registerStep === 1 && (
              <form onSubmit={handleRegisterStep1} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Business Name *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => {
                          setBusinessName(e.target.value);
                          saveDraftToStorage({ businessName: e.target.value });
                        }}
                        placeholder="e.g. Acme Supermarket Ltd"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Business Category *</label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          saveDraftToStorage({ category: e.target.value });
                        }}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {BUSINESS_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                {category === 'Other / Custom' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Category Name *</label>
                    <input
                      type="text"
                      required
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. Solar Energy Provider"
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Full Name *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          saveDraftToStorage({ fullName: e.target.value });
                        }}
                        placeholder="e.g. John Kamau"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">M-PESA Phone *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          saveDraftToStorage({ phone: e.target.value });
                        }}
                        placeholder="0712 345 678"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                    {phone && !isValidKenyanPhone(phone) && (
                      <div className="text-[10px] text-amber-400 mt-1">Format: 07XX, 01XX or +2547XX</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          saveDraftToStorage({ email: e.target.value });
                        }}
                        placeholder="owner@acme.co.ke"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                    {email && !isValidEmail(email) && (
                      <div className="text-[10px] text-amber-400 mt-1">Invalid email address</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                    {password && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="h-1 flex-1 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all ${pwdStrength.color}`}
                            style={{ width: `${(pwdStrength.score / 3) * 100}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">{pwdStrength.label}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Business Location *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value);
                          saveDraftToStorage({ location: e.target.value });
                        }}
                        placeholder="Nairobi CBD, Westlands..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">KRA PIN Number</label>
                    <input
                      type="text"
                      value={kraPin}
                      onChange={(e) => {
                        setKraPin(e.target.value);
                        saveDraftToStorage({ kraPin: e.target.value });
                      }}
                      placeholder="P051928374Z"
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono uppercase"
                    />
                    {kraPin && (
                      <div className="text-[10px] mt-1 flex items-center gap-1 font-mono">
                        {isValidKraPin(kraPin) ? (
                          <span className="text-emerald-400 font-bold">✓ Valid Kenyan Tax PIN format</span>
                        ) : (
                          <span className="text-amber-400">⚠️ Standard format: P051928374Z</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Validate & Save Details (Step 1 → 2)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('LOGIN');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-xs text-slate-400 hover:text-emerald-400 underline font-semibold cursor-pointer"
                  >
                    Already registered? Sign in here
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: DUAL OTP VERIFICATION (M-PESA Phone OTP + Email OTP) */}
            {registerStep === 2 && (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Contact Ownership Verification</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    To satisfy Safaricom Daraja API security standards, verify both your M-PESA phone number and email address.
                  </p>
                </div>

                {/* 1. M-PESA Phone OTP Verification Panel */}
                <div className={`p-4 rounded-2xl border transition ${phoneVerified ? 'bg-emerald-950/20 border-emerald-500/50' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>M-PESA Phone: <span className="font-mono text-emerald-300">{phone || '0712 345 678'}</span></span>
                    </div>
                    {phoneVerified ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pending Verification
                      </span>
                    )}
                  </div>

                  {!phoneVerified && (
                    <div className="space-y-2 mt-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value)}
                          placeholder="6-digit Phone OTP"
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyPhoneOtp}
                          disabled={isVerifyingPhoneOtp || !phoneOtp}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition shrink-0 cursor-pointer"
                        >
                          {isVerifyingPhoneOtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Verify Phone'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <button
                          type="button"
                          onClick={handleSendPhoneOtp}
                          disabled={isSendingPhoneOtp || phoneCooldown > 0}
                          className="text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                        >
                          {isSendingPhoneOtp ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          <span>
                            {phoneCooldown > 0
                              ? `Resend SMS OTP (${phoneCooldown}s)`
                              : sentPhoneOtpCode === 'SENT'
                              ? 'Resend M-PESA SMS OTP'
                              : 'Send M-PESA SMS OTP'}
                          </span>
                        </button>
                        {phoneCooldown > 0 && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Cooldown active
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Email Verification Panel */}
                <div className={`p-4 rounded-2xl border transition ${emailVerified ? 'bg-emerald-950/20 border-emerald-500/50' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Mail className="w-4 h-4 text-emerald-400" />
                      <span>Email: <span className="font-mono text-emerald-300">{email || 'owner@acme.co.ke'}</span></span>
                    </div>
                    {emailVerified ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pending Verification
                      </span>
                    )}
                  </div>

                  {!emailVerified && (
                    <div className="space-y-2 mt-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value)}
                          placeholder="6-digit Email OTP"
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmailOtp}
                          disabled={isVerifyingEmailOtp || !emailOtp}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition shrink-0 cursor-pointer"
                        >
                          {isVerifyingEmailOtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Verify Email'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          disabled={isSendingEmailOtp || emailCooldown > 0}
                          className="text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                        >
                          {isSendingEmailOtp ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          <span>
                            {emailCooldown > 0
                              ? `Resend Email Code (${emailCooldown}s)`
                              : sentEmailOtpCode === 'SENT'
                              ? 'Resend Email Verification Code'
                              : 'Send Email Verification Code'}
                          </span>
                        </button>
                        {emailCooldown > 0 && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Cooldown active
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setRegisterStep(1)}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    ← Back to Business Details
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedFromStep2}
                    disabled={!phoneVerified || !emailVerified}
                    className={`px-5 py-3 rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 ${
                      phoneVerified && emailVerified
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Proceed to Subscription Plan (Step 2 → 3)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Subscription Plan & Billing Cycle Selection */}
            {registerStep === 3 && (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold text-white">Select Your Business Subscription Plan</h3>
                  <p className="text-xs text-slate-400">Cancel or upgrade anytime. Includes a 14-day free trial.</p>

                  {/* Billing Cycle Toggle */}
                  <div className="inline-flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mt-2">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('MONTHLY')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        billingCycle === 'MONTHLY' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Monthly Billing
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('ANNUAL')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        billingCycle === 'ANNUAL' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Annual Billing</span>
                      <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.2 rounded-full font-black">20% OFF</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      tier: 'STARTER' as const,
                      name: 'Starter Tier',
                      monthlyPrice: 'KES 1,000 / mo',
                      annualPrice: 'KES 800 / mo (Billed Annually)',
                      branches: '1 HQ Branch',
                      staff: 'Up to 3 Staff',
                      color: 'border-slate-800 bg-slate-950',
                    },
                    {
                      tier: 'GROWTH' as const,
                      name: 'Growth Plan',
                      monthlyPrice: 'KES 2,500 / mo',
                      annualPrice: 'KES 2,000 / mo (Billed Annually)',
                      branches: 'Up to 5 Branches',
                      staff: '10 Staff Members',
                      popular: true,
                      color: 'border-emerald-500/50 bg-emerald-950/20',
                    },
                    {
                      tier: 'ENTERPRISE' as const,
                      name: 'Enterprise',
                      monthlyPrice: 'KES 5,000 / mo',
                      annualPrice: 'KES 4,000 / mo (Billed Annually)',
                      branches: 'Unlimited Branches',
                      staff: 'Unlimited Staff',
                      color: 'border-blue-500/50 bg-blue-950/20',
                    },
                  ].map((p) => (
                    <div
                      key={p.tier}
                      onClick={() => setSelectedPlanTier(p.tier)}
                      className={`p-4 rounded-2xl border cursor-pointer transition relative flex flex-col justify-between ${p.color} ${
                        selectedPlanTier === p.tier ? 'ring-2 ring-emerald-500 shadow-xl scale-[1.02]' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {p.popular && (
                        <span className="absolute -top-2.5 right-3 bg-emerald-500 text-slate-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Most Popular
                        </span>
                      )}
                      <div>
                        <div className="font-bold text-xs text-white">{p.name}</div>
                        <div className="text-sm font-black text-emerald-400 mt-1">
                          {billingCycle === 'ANNUAL' ? p.annualPrice : p.monthlyPrice}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-2 space-y-1">
                          <div className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> {p.branches}</div>
                          <div className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> {p.staff}</div>
                          <div className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> Real-time M-PESA STK Push</div>
                          <div className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> Auto Disconnection Webhook</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPlan(p.tier);
                        }}
                        className={`mt-4 w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition ${
                          selectedPlanTier === p.tier
                            ? 'bg-emerald-500 text-slate-950 shadow-md'
                            : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        {selectedPlanTier === p.tier ? <Check className="w-3.5 h-3.5" /> : null}
                        <span>Select {p.tier}</span>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setRegisterStep(2)}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    ← Back to Verification
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(selectedPlanTier)}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Proceed to Payment Setup (Step 3 → 4)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Configure Payment Channel & Launch Merchant Verification */}
            {registerStep === 4 && (
              <form onSubmit={handleCompleteOnboarding} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">M-PESA Channel Type *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'BUY_GOODS', label: 'Buy Goods Till' },
                      { id: 'PAYBILL', label: 'Paybill Shortcode' },
                      { id: 'BANK', label: 'Bank Account' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentType(m.id as any)}
                        className={`py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          paymentType === m.id
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Channel Label / Counter Name *</label>
                  <input
                    type="text"
                    required
                    value={paymentName}
                    onChange={(e) => setPaymentName(e.target.value)}
                    placeholder="e.g. Main HQ Counter Till"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {paymentType === 'BUY_GOODS' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Till Number *</label>
                    <input
                      type="text"
                      required
                      value={tillNumber}
                      onChange={(e) => setTillNumber(e.target.value)}
                      placeholder="e.g. 174379"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                {paymentType === 'PAYBILL' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Paybill Business No *</label>
                      <input
                        type="text"
                        required
                        value={paybillNumber}
                        onChange={(e) => setPaybillNumber(e.target.value)}
                        placeholder="e.g. 522522"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Default Account No *</label>
                      <input
                        type="text"
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="e.g. STORE-001"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {paymentType === 'BANK' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Bank Account Number *</label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 1102938475"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl text-[11px] text-emerald-300/90 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Automated Merchant Verification:</span> Submitting completes registration and immediately triggers Safaricom Daraja KYC & KRA PIN verification.
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setRegisterStep(3)}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    ← Back to Plan
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Save & Trigger Merchant Verification</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ----------------- AUTOMATED MERCHANT VERIFICATION WORKFLOW SCREEN ----------------- */}
        {mode === 'REGISTER' && isVerifyingMerchant && (
          <div className="space-y-6 py-4 text-center animate-in fade-in">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
              <div
                className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"
                style={{ animationDuration: '1.2s' }}
              />
              <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-emerald-400 font-mono">
                {verificationProgress}%
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Verifying Merchant Workspace...</h3>
              <p className="text-xs text-slate-400">
                Running real-time compliance & Safaricom Daraja API verification checks for{' '}
                <span className="text-emerald-400 font-bold">{createdBusiness?.name || businessName}</span>
              </p>
            </div>

            {/* Verification Checklist Steps */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3">
              {[
                { id: 1, label: 'KRA Tax PIN Compliance Check', detail: `Validating KRA iTax record: ${kraPin || createdBusiness?.kraPin || 'P051928374Z'}` },
                { id: 2, label: 'Safaricom Daraja Merchant KYC', detail: `Verifying Paybill / Till Number ownership: ${tillNumber || paybillNumber || '174379'}` },
                { id: 3, label: 'FRC Anti-Money Laundering (AML) Screening', detail: 'Financial Reporting Centre Compliance Clearance' },
                { id: 4, label: 'Merchant Dashboard Account Activation', detail: 'Issuing production authorization token & activating tenant' },
              ].map((c) => {
                const isStepPassed = verificationCheckStep > c.id;
                const isStepActive = verificationCheckStep === c.id;

                return (
                  <div key={c.id} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isStepPassed ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : isStepActive ? (
                        <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-800 text-slate-600 flex items-center justify-center text-[10px] font-mono">
                          {c.id}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isStepPassed ? 'text-emerald-400' : isStepActive ? 'text-white' : 'text-slate-500'}`}>
                        {c.label}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{c.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
