import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  initialBusiness,
  initialBranches,
  initialUsers,
  initialCustomers,
  initialTransactions,
  subscriptionPlans,
  initialNotifications,
  initialAuditLogs,
} from './src/data/mockData';
import {
  Transaction,
  Customer,
  Branch,
  User,
  NotificationItem,
  AuditLog,
  Business,
  PaymentMethodConfig,
  MpesaPaymentMethodType,
  SubscriptionInvoice,
  SubscriptionPlan,
  WebhookLog,
} from './src/types';

// In-memory data store for live CRUD & STK push simulation
let businessState: Business = { ...initialBusiness };
let activeSessionUser: User | null = null;
let activeSessionBiz: Business | null = null;
let businessesList: Business[] = [{ ...initialBusiness }];
let branchesState: Branch[] = [...initialBranches];
let usersState: User[] = [...initialUsers];
let customersState: Customer[] = [...initialCustomers];
let transactionsState: Transaction[] = [...initialTransactions];
let notificationsState: NotificationItem[] = [...initialNotifications];
let auditLogsState: AuditLog[] = [...initialAuditLogs];

// Database-driven Subscription Plans & Billing Invoices State
let subscriptionPlansState: SubscriptionPlan[] = [...subscriptionPlans];

let subscriptionInvoicesState: SubscriptionInvoice[] = [
  {
    id: 'INV-2026-001',
    businessId: 'biz-001',
    businessName: 'My Business',
    planId: 'plan-starter',
    planName: 'Basic Merchant',
    tier: 'STARTER',
    amountKes: 1500,
    status: 'PAID',
    mpesaReceipt: 'QKH849201A',
    customerPhone: '+254 700 000 000',
    issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 120000).toISOString(),
    periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    periodEnd: new Date().toISOString(),
    vatAmountKes: 240,
    paymentMethod: 'M-PESA STK Push',
  },
];

// Webhook Callback Logs State (Last 50 raw incoming M-PESA callbacks)
let webhookLogsState: WebhookLog[] = [
  {
    id: 'wh-1008',
    businessId: 'biz-001',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    eventType: 'STK_PUSH_CALLBACK',
    merchantRequestId: 'MR-92810-7482',
    checkoutRequestId: 'ws_CO_01082026163012',
    resultCode: 0,
    resultDesc: 'The service request is processed successfully.',
    mpesaReceipt: 'QKH849201A',
    amount: 2500,
    customerPhone: '254712345678',
    ipAddress: '196.201.214.200',
    httpStatus: 200,
    rawPayload: {
      Body: {
        stkCallback: {
          MerchantRequestID: 'MR-92810-7482',
          CheckoutRequestID: 'ws_CO_01082026163012',
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 2500 },
              { Name: 'MpesaReceiptNumber', Value: 'QKH849201A' },
              { Name: 'Balance' },
              { Name: 'TransactionDate', Value: 20260801163012 },
              { Name: 'PhoneNumber', Value: 254712345678 },
            ],
          },
        },
      },
    },
  },
  {
    id: 'wh-1007',
    businessId: 'biz-001',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    eventType: 'STK_PUSH_CALLBACK',
    merchantRequestId: 'MR-92810-7480',
    checkoutRequestId: 'ws_CO_01082026160500',
    resultCode: 1032,
    resultDesc: 'Request cancelled by user on handset PIN prompt.',
    amount: 1200,
    customerPhone: '254798765432',
    ipAddress: '196.201.214.200',
    httpStatus: 200,
    rawPayload: {
      Body: {
        stkCallback: {
          MerchantRequestID: 'MR-92810-7480',
          CheckoutRequestID: 'ws_CO_01082026160500',
          ResultCode: 1032,
          ResultDesc: 'Request cancelled by user on handset PIN prompt.',
        },
      },
    },
  },
  {
    id: 'wh-1006',
    businessId: 'biz-001',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    eventType: 'C2B_CONFIRMATION',
    merchantRequestId: 'C2B-94812-102',
    checkoutRequestId: 'c2b_CO_94812102',
    resultCode: 0,
    resultDesc: 'C2B PayBill direct payment received.',
    mpesaReceipt: 'QKH771920B',
    amount: 4500,
    customerPhone: '254722001122',
    ipAddress: '196.201.214.201',
    httpStatus: 200,
    rawPayload: {
      TransactionType: 'Pay Bill',
      TransID: 'QKH771920B',
      TransTime: '20260801143000',
      TransAmount: '4500.00',
      BusinessShortCode: '522522',
      BillRefNumber: 'INV-1029',
      InvoiceNumber: 'INV-1029',
      OrgAccountBalance: '849200.00',
      ThirdPartyTransID: '',
      MSISDN: '254722001122',
      FirstName: 'JOHN',
      MiddleName: 'KAMAU',
      LastName: 'NJOROGE',
    },
  },
  {
    id: 'wh-1005',
    businessId: 'biz-001',
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    eventType: 'STK_PUSH_CALLBACK',
    merchantRequestId: 'MR-92810-7475',
    checkoutRequestId: 'ws_CO_01082026113000',
    resultCode: 1037,
    resultDesc: 'DS timeout user cannot be reached / phone off.',
    amount: 800,
    customerPhone: '254701112233',
    ipAddress: '196.201.214.200',
    httpStatus: 200,
    rawPayload: {
      Body: {
        stkCallback: {
          MerchantRequestID: 'MR-92810-7475',
          CheckoutRequestID: 'ws_CO_01082026113000',
          ResultCode: 1037,
          ResultDesc: 'DS timeout user cannot be reached / phone off.',
        },
      },
    },
  },
  {
    id: 'wh-1004',
    businessId: 'biz-001',
    timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    eventType: 'STK_PUSH_CALLBACK',
    merchantRequestId: 'MR-92810-7470',
    checkoutRequestId: 'ws_CO_01082026091500',
    resultCode: 0,
    resultDesc: 'The service request is processed successfully.',
    mpesaReceipt: 'QKH665431C',
    amount: 15000,
    customerPhone: '254712009988',
    ipAddress: '196.201.214.200',
    httpStatus: 200,
    rawPayload: {
      Body: {
        stkCallback: {
          MerchantRequestID: 'MR-92810-7470',
          CheckoutRequestID: 'ws_CO_01082026091500',
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 15000 },
              { Name: 'MpesaReceiptNumber', Value: 'QKH665431C' },
              { Name: 'Balance' },
              { Name: 'TransactionDate', Value: 20260801091500 },
              { Name: 'PhoneNumber', Value: 254712009988 },
            ],
          },
        },
      },
    },
  },
];

function recordWebhookPayload(
  eventType: 'STK_PUSH_CALLBACK' | 'C2B_VALIDATION' | 'C2B_CONFIRMATION' | 'B2C_RESULT',
  merchantRequestId: string,
  checkoutRequestId: string,
  resultCode: number,
  resultDesc: string,
  rawPayload: any,
  businessId?: string,
  mpesaReceipt?: string,
  amount?: number,
  customerPhone?: string
) {
  const newLog: WebhookLog = {
    id: 'wh-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
    businessId: businessId || 'biz-001',
    timestamp: new Date().toISOString(),
    eventType,
    merchantRequestId,
    checkoutRequestId,
    resultCode,
    resultDesc,
    mpesaReceipt,
    amount,
    customerPhone,
    rawPayload,
    ipAddress: '196.201.214.200',
    httpStatus: 200,
  };
  webhookLogsState.unshift(newLog);
  if (webhookLogsState.length > 50) {
    webhookLogsState = webhookLogsState.slice(0, 50);
  }
}

// Default initial M-PESA payment methods per tenant business
let paymentMethodsState: PaymentMethodConfig[] = [
  {
    id: 'pm-001',
    businessId: 'biz-001',
    name: 'HQ Till Number (Buy Goods)',
    type: 'TILL_NUMBER',
    shortcodeOrNumber: '174379',
    isDefault: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    provider: 'SAFARICOM_MPESA',
    notes: 'Primary Till Number for Main Store Counter',
  },
  {
    id: 'pm-002',
    businessId: 'biz-001',
    name: 'Corporate PayBill (KCB 522522)',
    type: 'PAYBILL',
    shortcodeOrNumber: '522522',
    accountNumber: 'ACC-STORE-01',
    isDefault: false,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    provider: 'SAFARICOM_MPESA',
    notes: 'PayBill for bulk orders & invoice collection',
  },
  {
    id: 'pm-003',
    businessId: 'biz-001',
    name: 'Mama Mboga Pochi Account',
    type: 'POCHI_LA_BIASHARA',
    shortcodeOrNumber: '0712345678',
    isDefault: false,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    provider: 'SAFARICOM_MPESA',
    notes: 'Trader M-PESA Pochi line for quick retail micro-payments',
  },
  {
    id: 'pm-004',
    businessId: 'biz-001',
    name: 'Direct Merchant Phone (Send Money)',
    type: 'SEND_MONEY',
    shortcodeOrNumber: '0722000111',
    isDefault: false,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    provider: 'SAFARICOM_MPESA',
    notes: 'Direct business phone number for peer-to-peer customer transfers',
  },
];

export interface HelpArticle {
  id: string;
  question: string;
  answer: string;
  category: string;
  createdAt: string;
}

let helpArticlesState: HelpArticle[] = [
  {
    id: 'help-1',
    question: 'How fast is the M-PESA STK Push prompt delivered to the customer?',
    answer: 'STK Push prompts are delivered in 1-2 seconds via Safaricom Daraja 2.0 API directly to any active Safaricom line (+254 7XX or 07XX).',
    category: 'STK_PUSH',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'help-2',
    question: 'What happens if a customer cancels the prompt or enters an incorrect PIN?',
    answer: 'The transaction status updates immediately to FAILED or CANCELLED with Safaricom ResultCode 1032. You can retry the STK Push with one click.',
    category: 'STK_PUSH',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'help-3',
    question: 'Can I connect multiple till numbers for different store branches?',
    answer: 'Yes! PesaRequest supports multi-tenant branch management. Each branch can be assigned a unique shortcode or Till Number.',
    category: 'BRANCHES',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'help-4',
    question: 'How do I export my transaction statements to Google Sheets or Excel?',
    answer: 'Navigate to Transaction History or Financial Reports and click "Export to CSV / Sheets". The file is instantly formatted for direct import.',
    category: 'REPORTS',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

// Active pending STK push requests for real-time phone simulator
export interface ActiveStkPrompt {
  merchantRequestId: string;
  checkoutRequestId: string;
  phone: string;
  amount: number;
  customerName: string;
  description: string;
  businessName: string;
  createdAt: string;
  status: 'WAITING_FOR_PIN' | 'PIN_ENTERED' | 'CANCELLED';
  paymentMethodType?: MpesaPaymentMethodType;
  paymentMethodName?: string;
  shortcodeOrNumber?: string;
  accountNumber?: string;
}

let activeStkPrompts: ActiveStkPrompt[] = [];

// Helper to generate Safaricom-like M-PESA Receipt (e.g., QKH89210XZ)
function generateMpesaReceipt(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  let res = 'QKH';
  for (let i = 0; i < 5; i++) res += digits.charAt(Math.floor(Math.random() * digits.length));
  for (let i = 0; i < 2; i++) res += letters.charAt(Math.floor(Math.random() * letters.length));
  return res;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  // --- API ROUTES ---

  // Helper to resolve current tenant business ID for strict tenant data isolation
  function getTenantId(req: express.Request): string {
    const headerTenant = req.headers['x-business-id'] as string;
    const queryTenant = req.query.businessId as string;
    return headerTenant || queryTenant || (activeSessionBiz ? activeSessionBiz.id : businessState.id);
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'PesaRequest M-PESA SaaS Multi-Tenant Engine' });
  });

  // Auth / Current User / Roles
  app.get('/api/auth/me', (req, res) => {
    const role = (req.query.role as string);
    const tenantHeader = req.headers['x-business-id'] as string;
    const tenantQuery = req.query.businessId as string;
    const tenantId = tenantHeader || tenantQuery;

    if (tenantId) {
      const tenantBiz = businessesList.find((b) => b.id === tenantId) || activeSessionBiz || businessState;
      const tenantUsers = (tenantBiz && tenantBiz.id) ? usersState.filter((u) => u.businessId === tenantBiz.id) : [];
      const currentUser = (role ? tenantUsers.find((u) => u.role === role) : null) || tenantUsers[0] || activeSessionUser || usersState[0] || null;
      return res.json({
        user: currentUser || null,
        business: tenantBiz || businessState || null,
        availableRoles: [
          'SUPER_ADMIN',
          'BUSINESS_OWNER',
          'MANAGER',
          'BRANCH_MANAGER',
          'CASHIER',
          'ACCOUNTANT',
          'AUDITOR',
          'SUPPORT_STAFF',
        ],
      });
    }

    if (activeSessionUser && activeSessionBiz) {
      return res.json({
        user: activeSessionUser,
        business: activeSessionBiz,
        availableRoles: [
          'SUPER_ADMIN',
          'BUSINESS_OWNER',
          'MANAGER',
          'BRANCH_MANAGER',
          'CASHIER',
          'ACCOUNTANT',
          'AUDITOR',
          'SUPPORT_STAFF',
        ],
      });
    }

    // Unauthenticated state: return user: null
    return res.json({
      user: null,
      business: null,
      availableRoles: [
        'SUPER_ADMIN',
        'BUSINESS_OWNER',
        'MANAGER',
        'BRANCH_MANAGER',
        'CASHIER',
        'ACCOUNTANT',
        'AUDITOR',
        'SUPPORT_STAFF',
      ],
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }
    const user = usersState.find((u) => u.email.toLowerCase() === email?.toLowerCase());
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found. Please register your business.' });
    }
    const userBiz = businessesList.find((b) => b.id === user.businessId) || businessState;
    businessState = userBiz;
    activeSessionUser = user;
    activeSessionBiz = userBiz;
    res.json({
      success: true,
      user,
      business: userBiz,
      token: 'jwt_mock_token_pesarequest_' + user.id,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    activeSessionUser = null;
    activeSessionBiz = null;
    res.json({ success: true, message: 'Signed out successfully' });
  });

  app.post('/api/auth/switch-tenant', (req, res) => {
    const { businessId } = req.body;
    const targetBiz = businessesList.find((b) => b.id === businessId);
    if (!targetBiz) {
      return res.status(404).json({ success: false, message: 'Tenant business not found' });
    }
    businessState = targetBiz;
    activeSessionBiz = targetBiz;
    const tenantOwner = usersState.find((u) => u.businessId === businessId) || {
      id: 'usr-' + Date.now(),
      name: targetBiz.name + ' Admin',
      email: targetBiz.contactEmail,
      phone: targetBiz.contactPhone,
      role: 'BUSINESS_OWNER',
      businessId: targetBiz.id,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    activeSessionUser = tenantOwner;
    res.json({ success: true, business: targetBiz, user: tenantOwner });
  });

  // OTP cache for onboarding verification
  const otpStore: Record<string, { code: string; expiresAt: number; lastSentAt: number }> = {};

  // Endpoint to check email & phone availability
  app.post('/api/auth/check-availability', (req, res) => {
    const { email, phone } = req.body;
    if (email) {
      const existingEmail = usersState.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
      if (existingEmail) {
        return res.status(200).json({ available: false, field: 'email', message: 'An account with this email address already exists. Please sign in.' });
      }
    }
    if (phone) {
      const cleanPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
      const existingPhone = usersState.find((u) => u.phone.replace(/[\s\-\(\)]/g, '') === cleanPhone);
      if (existingPhone) {
        return res.status(200).json({ available: false, field: 'phone', message: 'An account with this phone number is already registered.' });
      }
    }
    return res.json({ available: true });
  });

  // Endpoint to send OTP via SMS / Email for onboarding
  app.post('/api/auth/send-otp', (req, res) => {
    const { target, type } = req.body;
    if (!target) {
      return res.status(400).json({ success: false, message: 'Target phone or email is required' });
    }
    const cleanTarget = target.toLowerCase().trim();

    // Cooldown check (60 seconds)
    const existing = otpStore[cleanTarget];
    if (existing && existing.lastSentAt && Date.now() - existing.lastSentAt < 60000) {
      const waitSec = Math.ceil((60000 - (Date.now() - existing.lastSentAt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSec}s before requesting a new OTP.`,
        cooldownRemainingSeconds: waitSec,
      });
    }

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    otpStore[cleanTarget] = {
      code,
      expiresAt,
      lastSentAt: Date.now(),
    };

    const channelName = type === 'EMAIL' ? 'SMTP Email Gateway' : 'Safaricom SMS Gateway';

    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: type === 'EMAIL' ? 'EMAIL_OTP_SENT' : 'SMS_OTP_SENT',
      actorName: 'System Gatekeeper',
      actorRole: 'SUPPORT_STAFF',
      details: `Generated & dispatched 6-digit OTP (${code}) to ${target} via ${channelName}. Expires in 10 minutes.`,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || '197.237.10.45',
    });

    console.log(`[OTP DISPATCH] ${type || 'SMS'} OTP for ${cleanTarget}: ${code}`);

    return res.json({
      success: true,
      message: `${type === 'EMAIL' ? 'Email verification' : 'M-PESA Phone OTP'} code sent successfully to ${target}`,
      demoCode: code,
      expiresInMinutes: 10,
    });
  });

  // Endpoint to verify OTP
  app.post('/api/auth/verify-otp', (req, res) => {
    const { target, code } = req.body;
    if (!target || !code) {
      return res.status(400).json({ success: false, message: 'Target and 6-digit OTP code are required' });
    }
    const cleanTarget = target.toLowerCase().trim();
    const stored = otpStore[cleanTarget];

    if (!stored) {
      if (code.trim() === '123456') {
        return res.json({ success: true, message: 'OTP verified successfully using master test code!' });
      }
      return res.status(400).json({ success: false, message: 'No active OTP requested for this contact. Click "Send OTP".' });
    }

    if (Date.now() > stored.expiresAt) {
      delete otpStore[cleanTarget];
      auditLogsState.unshift({
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'OTP_EXPIRED',
        actorName: 'System Gatekeeper',
        actorRole: 'SUPPORT_STAFF',
        details: `Expired OTP attempt for ${target}`,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || '197.237.10.45',
      });
      return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new code.' });
    }

    const inputCode = code.trim();
    if (stored.code !== inputCode && inputCode !== '123456') {
      auditLogsState.unshift({
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'OTP_VERIFICATION_FAILED',
        actorName: 'System Gatekeeper',
        actorRole: 'SUPPORT_STAFF',
        details: `Incorrect OTP code entered for ${target}`,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || '197.237.10.45',
      });
      return res.status(400).json({ success: false, message: 'Incorrect OTP verification code. Please try again.' });
    }

    // OTP verified successfully
    delete otpStore[cleanTarget];

    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'OTP_VERIFIED',
      actorName: 'System Gatekeeper',
      actorRole: 'SUPPORT_STAFF',
      details: `Successfully verified contact ownership for ${target}`,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || '197.237.10.45',
    });

    return res.json({ success: true, message: 'OTP Code verified successfully!' });
  });

  // Endpoint to perform automated merchant KYC & Daraja verification
  app.post('/api/auth/verify-merchant', (req, res) => {
    const { businessId, kraPin } = req.body;
    const targetBiz = businessesList.find((b) => b.id === businessId);
    if (!targetBiz) {
      return res.status(404).json({ success: false, message: 'Business record not found for verification' });
    }

    // Validate KRA PIN format
    const pinPattern = /^[A|P|C]\d{9}[A-Z]$/i;
    const cleanPin = (kraPin || targetBiz.kraPin || '').trim().toUpperCase();
    if (cleanPin && !pinPattern.test(cleanPin)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid KRA PIN format. Kenyan Tax PIN must start with P, A, or C followed by 9 digits and end with a letter (e.g. P051928374Z).',
      });
    }

    // Upgrade business status to ACTIVE / VERIFIED
    targetBiz.status = 'ACTIVE';
    if (cleanPin) targetBiz.kraPin = cleanPin;

    businessState = targetBiz;
    activeSessionBiz = targetBiz;

    const ownerUser = usersState.find((u) => u.businessId === targetBiz.id) || {
      id: 'usr-' + Date.now(),
      name: targetBiz.name + ' Admin',
      email: targetBiz.contactEmail,
      phone: targetBiz.contactPhone,
      role: 'BUSINESS_OWNER',
      businessId: targetBiz.id,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    activeSessionUser = ownerUser;

    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'MERCHANT_KYC_VERIFIED',
      actorName: 'Safaricom Daraja Verification Engine',
      actorRole: 'SUPER_ADMIN',
      details: `Automated Merchant Verification PASSED for ${targetBiz.name} (KRA PIN: ${targetBiz.kraPin}). Account activated.`,
      ipAddress: '197.237.10.45',
    });

    return res.json({
      success: true,
      message: 'Merchant workspace verified and activated!',
      business: targetBiz,
      user: ownerUser,
    });
  });

  app.post('/api/auth/register', (req, res) => {
    const { businessName, email, phone, fullName, kraPin, paybill, tillNumber, address, category, customCategory, subscriptionTier, userId, businessId } = req.body;
    if (!businessName || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Missing required business details' });
    }

    const selectedTier = subscriptionTier || 'STARTER';
    const plan = subscriptionPlans.find((p) => p.tier === selectedTier) || subscriptionPlans[0];
    const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const newBizId = businessId || ('biz-' + Date.now());
    const newBizTill = tillNumber || ('174' + Math.floor(100 + Math.random() * 900));
    const newBizPaybill = paybill || '522522';

    const newBiz: Business = {
      id: newBizId,
      name: businessName,
      category: category || 'SME',
      customCategory: customCategory || '',
      paybill: newBizPaybill,
      tillNumber: newBizTill,
      subscriptionTier: selectedTier,
      subscriptionRenewalDate: renewalDate,
      subscriptionStatus: 'ACTIVE',
      maxBranches: plan.maxBranches,
      maxStaff: plan.maxStaff,
      maxTransactions: plan.maxTransactions,
      unlockedFeatures: plan.features,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      address: address || 'Nairobi, Kenya',
      kraPin: kraPin ? kraPin.toUpperCase().trim() : ('P051' + Math.floor(1000000 + Math.random() * 9000000) + 'Z'),
      contactEmail: email,
      contactPhone: phone,
    };

    const newUser: User = {
      id: userId || ('usr-' + Date.now()),
      name: fullName || 'Business Owner',
      email,
      phone,
      role: 'BUSINESS_OWNER',
      businessId: newBizId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    businessesList.unshift(newBiz);
    businessState = newBiz;
    activeSessionUser = newUser;
    activeSessionBiz = newBiz;
    usersState.unshift(newUser);

    // Add initial branch for this tenant
    const newBranch: Branch = {
      id: 'br-' + Date.now(),
      businessId: newBizId,
      name: businessName + ' HQ',
      code: 'HQ-01',
      location: address || 'Nairobi CBD',
      managerName: newUser.name,
      phone,
      tillNumber: newBizTill,
      status: 'ACTIVE',
      totalRevenue: 0,
      transactionCount: 0,
    };
    branchesState.push(newBranch);

    // Add default payment methods for newly registered tenant
    const defaultTill: PaymentMethodConfig = {
      id: 'pm-' + Date.now() + '-1',
      businessId: newBizId,
      name: 'Buy Goods Till (' + newBizTill + ')',
      type: 'TILL_NUMBER',
      shortcodeOrNumber: newBizTill,
      isDefault: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      provider: 'SAFARICOM_MPESA',
      notes: 'Primary Buy Goods Till Number',
    };

    const defaultPaybill: PaymentMethodConfig = {
      id: 'pm-' + Date.now() + '-2',
      businessId: newBizId,
      name: 'PayBill Account (' + newBizPaybill + ')',
      type: 'PAYBILL',
      shortcodeOrNumber: newBizPaybill,
      accountNumber: 'ACC-001',
      isDefault: false,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      provider: 'SAFARICOM_MPESA',
      notes: 'Primary PayBill Account',
    };

    paymentMethodsState.unshift(defaultTill, defaultPaybill);

    // Audit log
    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      businessId: newBizId,
      timestamp: new Date().toISOString(),
      action: 'TENANT_REGISTERED',
      actorName: newUser.name,
      actorRole: 'BUSINESS_OWNER',
      details: `Registered new merchant workspace for ${newBiz.name} (${newBiz.category})`,
      ipAddress: '197.237.10.45',
    });

    res.json({ success: true, user: newUser, business: newBiz });
  });

  // --- PAYMENT METHODS MODULE API ---

  // Get configured payment methods for tenant
  app.get('/api/payment-methods', (req, res) => {
    const tenantId = getTenantId(req);
    const list = paymentMethodsState.filter((pm) => pm.businessId === tenantId);
    res.json({ success: true, paymentMethods: list });
  });

  // Add new payment method
  app.post('/api/payment-methods', (req, res) => {
    const tenantId = getTenantId(req);
    const { name, type, shortcodeOrNumber, accountNumber, passkey, consumerKey, consumerSecret, environment, darajaStatus, isDefault, notes, branchId, provider } = req.body;

    if (!name || !type || !shortcodeOrNumber) {
      return res.status(400).json({ success: false, message: 'Name, payment method type, and shortcode/number are required.' });
    }

    if (isDefault) {
      paymentMethodsState.forEach((pm) => {
        if (pm.businessId === tenantId) pm.isDefault = false;
      });
    }

    const newMethod: PaymentMethodConfig = {
      id: 'pm-' + Date.now(),
      businessId: tenantId,
      name,
      type,
      shortcodeOrNumber: shortcodeOrNumber.trim(),
      accountNumber: accountNumber ? accountNumber.trim() : '',
      passkey: passkey ? passkey.trim() : '',
      consumerKey: consumerKey ? consumerKey.trim() : '',
      consumerSecret: consumerSecret ? consumerSecret.trim() : '',
      environment: environment || 'SANDBOX',
      darajaStatus: darajaStatus || (consumerKey && consumerSecret ? 'VERIFIED' : 'PENDING'),
      c2bUrlRegistered: type === 'PAYBILL' || type === 'TILL_NUMBER',
      b2cReady: Boolean(consumerKey && consumerSecret),
      isDefault: Boolean(isDefault || paymentMethodsState.filter(pm => pm.businessId === tenantId).length === 0),
      status: 'ACTIVE',
      branchId: branchId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: notes || '',
      provider: provider || 'SAFARICOM_MPESA',
    };

    paymentMethodsState.unshift(newMethod);

    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'PAYMENT_METHOD_CREATED',
      actorName: 'Business Admin',
      actorRole: 'BUSINESS_OWNER',
      details: `Added new ${type} payment collection method with Daraja integration: ${name} (${shortcodeOrNumber})`,
      ipAddress: '197.237.10.45',
    });

    res.json({ success: true, paymentMethod: newMethod });
  });

  // Update or toggle payment method status
  app.put('/api/payment-methods/:id', (req, res) => {
    const tenantId = getTenantId(req);
    const method = paymentMethodsState.find((pm) => pm.id === req.params.id);
    if (!method) return res.status(404).json({ success: false, message: 'Payment method configuration not found.' });

    const { name, type, shortcodeOrNumber, accountNumber, passkey, consumerKey, consumerSecret, environment, darajaStatus, c2bUrlRegistered, b2cReady, isDefault, status, notes, branchId, provider } = req.body;

    if (isDefault) {
      paymentMethodsState.forEach((pm) => {
        if (pm.businessId === tenantId) pm.isDefault = false;
      });
      method.isDefault = true;
    }

    if (name) method.name = name;
    if (type) method.type = type;
    if (shortcodeOrNumber) method.shortcodeOrNumber = shortcodeOrNumber.trim();
    if (accountNumber !== undefined) method.accountNumber = accountNumber.trim();
    if (passkey !== undefined) method.passkey = passkey.trim();
    if (consumerKey !== undefined) method.consumerKey = consumerKey.trim();
    if (consumerSecret !== undefined) method.consumerSecret = consumerSecret.trim();
    if (environment) method.environment = environment;
    if (darajaStatus) method.darajaStatus = darajaStatus;
    if (c2bUrlRegistered !== undefined) method.c2bUrlRegistered = Boolean(c2bUrlRegistered);
    if (b2cReady !== undefined) method.b2cReady = Boolean(b2cReady);
    if (status) method.status = status;
    if (notes !== undefined) method.notes = notes;
    if (branchId !== undefined) method.branchId = branchId;
    if (provider) method.provider = provider;
    method.updatedAt = new Date().toISOString();

    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'PAYMENT_METHOD_UPDATED',
      actorName: 'Business Admin',
      actorRole: 'BUSINESS_OWNER',
      details: `Updated payment method: ${method.name} (${method.type} - Daraja Status: ${method.darajaStatus || 'ACTIVE'})`,
      ipAddress: '197.237.10.45',
    });

    res.json({ success: true, paymentMethod: method });
  });

  // --- SAFARICOM DARAJA API GATEWAY CONNECTION TEST & C2B REGISTRATION ---
  app.post('/api/daraja/test-connection', (req, res) => {
    const { consumerKey, consumerSecret, passkey, environment, shortcodeOrNumber, paymentMethodId } = req.body;

    // Simulate authenticating against Safaricom Daraja API OAuth Gateway
    const isCustomKey = consumerKey && consumerKey.trim().length > 5;
    const isCustomSecret = consumerSecret && consumerSecret.trim().length > 5;

    // Generate simulated Safaricom OAuth Token response
    const token = 'ag_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresIn = '3599'; // 1 hour

    if (paymentMethodId) {
      const pm = paymentMethodsState.find(p => p.id === paymentMethodId);
      if (pm) {
        pm.darajaStatus = 'VERIFIED';
        if (consumerKey) pm.consumerKey = consumerKey.trim();
        if (consumerSecret) pm.consumerSecret = consumerSecret.trim();
        if (passkey) pm.passkey = passkey.trim();
        if (environment) pm.environment = environment;
      }
    }

    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'DARAJA_API_TESTED',
      actorName: 'Business Admin',
      actorRole: 'BUSINESS_OWNER',
      details: `Tested Daraja OAuth 2.0 Gateway authentication for ${shortcodeOrNumber || 'Merchant Shortcode'} (${environment || 'SANDBOX'}). Status: 200 OK`,
      ipAddress: '197.237.10.45',
    });

    return res.json({
      success: true,
      message: 'Safaricom Daraja API Gateway credentials authenticated successfully!',
      gatewayStatus: 'ONLINE_CONNECTED',
      environment: environment || 'SANDBOX',
      oauthToken: token,
      expiresInSeconds: Number(expiresIn),
      latencyMs: Math.floor(80 + Math.random() * 60),
      capabilities: {
        stkPushExpress: true,
        c2bValidationUrl: true,
        b2cDisbursement: true,
        transactionStatusQuery: true,
      },
    });
  });

  app.post('/api/daraja/register-urls', (req, res) => {
    const { shortcodeOrNumber, responseType, paymentMethodId } = req.body;
    const callbackUrl = 'https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/stkpush/callback';

    if (paymentMethodId) {
      const pm = paymentMethodsState.find(p => p.id === paymentMethodId);
      if (pm) {
        pm.c2bUrlRegistered = true;
      }
    }

    webhookLogsState.unshift({
      id: 'wh-' + Date.now(),
      timestamp: new Date().toISOString(),
      eventType: 'C2B_VALIDATION',
      merchantRequestId: 'REG-' + Date.now(),
      checkoutRequestId: 'C2B-REG-01',
      resultCode: 0,
      resultDesc: 'C2B Validation and Confirmation URLs registered successfully on Daraja API Gateway',
      amount: 0,
      mpesaReceipt: 'C2B_REGISTERED',
      customerPhone: shortcodeOrNumber || 'Shortcode',
      rawPayload: {
        ShortCode: shortcodeOrNumber || '174379',
        ResponseType: responseType || 'Completed',
        ConfirmationURL: callbackUrl,
        ValidationURL: callbackUrl,
        ResponseCode: '0',
        ResponseDescription: 'Success',
      },
      ipAddress: '196.201.214.200',
      httpStatus: 200,
    });

    return res.json({
      success: true,
      message: `C2B Validation & Confirmation URLs registered successfully on Safaricom Daraja for shortcode ${shortcodeOrNumber || 'Till/Paybill'}`,
      confirmationUrl: callbackUrl,
      validationUrl: callbackUrl,
      responseCode: '0',
    });
  });

  // Delete payment method
  app.delete('/api/payment-methods/:id', (req, res) => {
    const tenantId = getTenantId(req);
    const idx = paymentMethodsState.findIndex((pm) => pm.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Payment method not found.' });

    const deleted = paymentMethodsState.splice(idx, 1)[0];

    // If deleted method was default, set another method as default for this tenant
    if (deleted.isDefault) {
      const remaining = paymentMethodsState.filter((pm) => pm.businessId === tenantId);
      if (remaining.length > 0) {
        remaining[0].isDefault = true;
      }
    }

    const currentUser = usersState.find((u) => u.businessId === tenantId) || usersState[0];

    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'PAYMENT_METHOD_DELETED',
      actorName: currentUser ? currentUser.name : 'Business Admin',
      actorRole: currentUser ? currentUser.role : 'BUSINESS_OWNER',
      details: `Deleted ${deleted.type} payment method: ${deleted.name} (${deleted.shortcodeOrNumber})`,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || '197.237.10.45',
    });

    res.json({ success: true, message: 'Payment method removed successfully.', deleted });
  });

  // --- STK PUSH ENGINE & CALLBACK SIMULATION ---

  // Initiate STK Push
  app.post('/api/stkpush/initiate', (req, res) => {
    const { phone, amount, customerName, description, branchId, paymentMethodId, paymentMethodType, shortcodeOrNumber, accountNumber } = req.body;

    if (!phone || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid phone number or payment amount' });
    }

    // Format phone number to clean Kenyan format (07XX XXX XXX or 01XX XXX XXX)
    let formattedPhone = phone.trim().replace(/\s+/g, '');
    if (formattedPhone.startsWith('+254')) formattedPhone = '0' + formattedPhone.slice(4);
    if (formattedPhone.startsWith('254')) formattedPhone = '0' + formattedPhone.slice(3);

    const branch = branchesState.find((b) => b.id === branchId) || branchesState[0];
    const tenantId = getTenantId(req);

    // Enforce subscription STK Push quota limit
    const tenantBiz = businessesList.find((b) => b.id === tenantId) || businessState;
    const currentPlan = subscriptionPlansState.find((p) => p.tier === tenantBiz.subscriptionTier) || subscriptionPlansState[0];
    const maxTxs = tenantBiz.maxTransactions !== undefined ? tenantBiz.maxTransactions : currentPlan.maxTransactions;
    const currentMonthlyTxs = transactionsState.filter((t) => t.businessId === tenantId).length;

    if (maxTxs > 0 && currentMonthlyTxs >= maxTxs) {
      return res.status(403).json({
        success: false,
        message: `Monthly STK Push quota limit reached (${currentMonthlyTxs}/${maxTxs}) for your ${tenantBiz.subscriptionTier} plan. Please upgrade your subscription to process more M-PESA payments.`,
      });
    }
    
    // Resolve payment method configuration
    let selectedPm: PaymentMethodConfig | undefined;
    if (paymentMethodId) {
      selectedPm = paymentMethodsState.find(pm => pm.id === paymentMethodId);
    }
    if (!selectedPm) {
      // Find default active method for this tenant
      selectedPm = paymentMethodsState.find(pm => pm.businessId === tenantId && pm.isDefault && pm.status === 'ACTIVE')
        || paymentMethodsState.find(pm => pm.businessId === tenantId && pm.status === 'ACTIVE');
    }

    const resolvedType = paymentMethodType || selectedPm?.type || 'TILL_NUMBER';
    const resolvedName = selectedPm?.name || (resolvedType === 'PAYBILL' ? 'Corporate PayBill' : resolvedType === 'POCHI_LA_BIASHARA' ? 'Pochi la Biashara' : resolvedType === 'SEND_MONEY' ? 'Send Money Line' : 'Counter Buy Goods Till');
    const resolvedShortcode = shortcodeOrNumber || selectedPm?.shortcodeOrNumber || (resolvedType === 'PAYBILL' ? tenantBiz.paybill || '522522' : tenantBiz.tillNumber || '174379');
    const resolvedAcc = accountNumber || selectedPm?.accountNumber || '';

    const timestamp = new Date().toISOString();
    const merchantReqId = 'MR-' + Math.floor(10000 + Math.random() * 90000) + '-' + Date.now().toString().slice(-3);
    const checkoutReqId = 'ws_CO_' + Date.now();

    // Create pending transaction with payment method details
    const newTx: Transaction = {
      id: 'trx-' + Date.now(),
      merchantRequestId: merchantReqId,
      checkoutRequestId: checkoutReqId,
      customerPhone: formattedPhone,
      customerName: customerName || 'Valued Customer (' + formattedPhone + ')',
      amount: Number(amount),
      status: 'PENDING',
      description: description || 'Payment Request via STK Push',
      businessId: tenantId,
      branchId: branch ? branch.id : 'br-001',
      branchName: branch ? branch.name : 'Main HQ',
      paymentMethodId: selectedPm?.id,
      paymentMethodType: resolvedType,
      paymentMethodName: resolvedName,
      shortcodeOrNumber: resolvedShortcode,
      accountNumber: resolvedAcc,
      createdByStaffName: activeSessionUser?.name || 'Cashier',
      createdAt: timestamp,
    };

    transactionsState.unshift(newTx);

    // Add to customer DB or update existing customer
    let existingCust = customersState.find((c) => c.phone.replace(/\s+/g, '') === formattedPhone);
    if (!existingCust) {
      existingCust = {
        id: 'cust-' + Date.now(),
        businessId: tenantId,
        name: customerName || 'Customer (' + formattedPhone + ')',
        phone: formattedPhone,
        email: formattedPhone + '@customer.m-pesa.co.ke',
        totalSpent: 0,
        transactionCount: 0,
        category: 'NEW',
        lastTransactionAt: timestamp,
      };
      customersState.unshift(existingCust);
    }

    // Add to active STK prompts for the phone simulator!
    const promptItem: ActiveStkPrompt = {
      merchantRequestId: merchantReqId,
      checkoutRequestId: checkoutReqId,
      phone: formattedPhone,
      amount: Number(amount),
      customerName: existingCust.name,
      description: newTx.description,
      businessName: tenantBiz.name,
      createdAt: timestamp,
      status: 'WAITING_FOR_PIN',
      paymentMethodType: resolvedType,
      paymentMethodName: resolvedName,
      shortcodeOrNumber: resolvedShortcode,
      accountNumber: resolvedAcc,
    };
    activeStkPrompts.unshift(promptItem);

    // Audit log
    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      businessId: tenantId,
      timestamp,
      action: 'STK_PUSH_INITIATED',
      actorName: activeSessionUser?.name || tenantBiz.name,
      actorRole: activeSessionUser?.role || 'BUSINESS_OWNER',
      details: `Initiated STK Push of KES ${Number(amount).toLocaleString()} to ${formattedPhone} (${newTx.description})`,
      ipAddress: '197.237.10.45',
    });

    res.json({
      success: true,
      message: 'STK Push query sent successfully. Awaiting customer M-PESA PIN prompt on phone.',
      merchantRequestId: merchantReqId,
      checkoutRequestId: checkoutReqId,
      transaction: newTx,
      prompt: promptItem,
    });
  });

  // Bulk retry failed STK push transactions
  app.post('/api/stkpush/bulk-retry', (req, res) => {
    const tenantId = getTenantId(req);
    const tenantBiz = businessesList.find((b) => b.id === tenantId) || businessState;
    const { transactionIds } = req.body;
    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No transaction IDs provided for bulk retry' });
    }

    const retriedList: Transaction[] = [];
    const timestamp = new Date().toISOString();

    transactionIds.forEach((id: string) => {
      const tx = transactionsState.find((t) => t.id === id);
      if (tx) {
        const merchantReqId = 'MR-' + Math.floor(10000 + Math.random() * 90000) + '-' + Date.now().toString().slice(-3);
        const checkoutReqId = 'ws_CO_' + Date.now() + Math.floor(Math.random() * 1000);

        tx.status = 'PENDING';
        tx.merchantRequestId = merchantReqId;
        tx.checkoutRequestId = checkoutReqId;
        tx.resultCode = undefined;
        tx.resultDesc = 'STK Push re-sent via Bulk Retry';
        tx.createdAt = timestamp;

        // Add to active prompts
        activeStkPrompts.unshift({
          merchantRequestId: merchantReqId,
          checkoutRequestId: checkoutReqId,
          phone: tx.customerPhone,
          amount: tx.amount,
          customerName: tx.customerName,
          description: (tx.description || 'Payment Request') + ' (Bulk Retry)',
          businessName: tenantBiz.name,
          createdAt: timestamp,
          status: 'WAITING_FOR_PIN',
          paymentMethodType: tx.paymentMethodType,
          paymentMethodName: tx.paymentMethodName,
          shortcodeOrNumber: tx.shortcodeOrNumber,
          accountNumber: tx.accountNumber,
        });

        retriedList.push(tx);
      }
    });

    const currentUser = usersState.find((u) => u.businessId === tenantId) || usersState[0];

    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      timestamp,
      action: 'STK_PUSH_BULK_RETRY',
      actorName: currentUser ? currentUser.name : 'System Admin',
      actorRole: currentUser ? currentUser.role : 'BUSINESS_OWNER',
      details: `Re-sent STK Push requests for ${retriedList.length} transaction(s)`,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || '197.237.10.45',
    });

    notificationsState.unshift({
      id: 'notif-' + Date.now(),
      type: 'SYSTEM',
      title: 'Bulk STK Push Retry Initiated',
      message: `Re-sent M-PESA STK Push prompts to ${retriedList.length} customer phone(s).`,
      createdAt: timestamp,
      read: false,
      amount: retriedList.reduce((acc, curr) => acc + curr.amount, 0),
      phone: retriedList.length === 1 ? retriedList[0].customerPhone : `${retriedList.length} customers`,
    });

    res.json({
      success: true,
      message: `Successfully re-sent STK Push prompts for ${retriedList.length} customer(s).`,
      count: retriedList.length,
      retriedTransactions: retriedList,
    });
  });

  // Get STK Push Retry Policy
  app.get('/api/settings/stk-retry-policy', (req, res) => {
    const tenantId = getTenantId(req);
    const tenantBiz = businessesList.find((b) => b.id === tenantId) || businessState;
    const defaultPolicy = {
      maxRetries: 3,
      retryDelaySeconds: 5,
      backoffStrategy: 'EXPONENTIAL',
      autoRetryOnTimeout: true,
      autoRetryOnNetworkError: true,
      autoRetryOnUserCancel: false,
      notifyCustomerOnRetry: true,
      maxTimeoutSeconds: 30,
    };
    res.json({
      success: true,
      policy: tenantBiz.stkRetryPolicy || defaultPolicy,
    });
  });

  // Update STK Push Retry Policy
  app.put('/api/settings/stk-retry-policy', (req, res) => {
    const tenantId = getTenantId(req);
    const tenantBiz = businessesList.find((b) => b.id === tenantId) || businessState;
    const policy = req.body;
    tenantBiz.stkRetryPolicy = policy;

    const timestamp = new Date().toISOString();
    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      timestamp,
      action: 'UPDATE_STK_RETRY_POLICY',
      actorName: 'Business Admin',
      actorRole: 'BUSINESS_OWNER',
      details: `Updated STK Push Retry Policy: Max ${policy.maxRetries} retries, ${policy.retryDelaySeconds}s delay (${policy.backoffStrategy})`,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || '197.237.10.45',
    });

    res.json({
      success: true,
      message: 'STK Push Retry Policy updated successfully',
      policy: tenantBiz.stkRetryPolicy,
    });
  });

  // Test / Simulate STK Push Retry Policy execution
  app.post('/api/stkpush/test-retry-policy', (req, res) => {
    const { policy, testPhone } = req.body;
    const phone = testPhone || '+254712345678';
    const activePolicy = policy || {
      maxRetries: 3,
      retryDelaySeconds: 5,
      backoffStrategy: 'EXPONENTIAL',
      autoRetryOnTimeout: true,
      autoRetryOnNetworkError: true,
      autoRetryOnUserCancel: false,
      notifyCustomerOnRetry: true,
      maxTimeoutSeconds: 30,
    };

    const timeline = [];
    let currentDelay = activePolicy.retryDelaySeconds || 5;

    // Simulation steps
    timeline.push({
      step: 0,
      phase: 'INITIAL_REQUEST',
      timeOffsetMs: 0,
      status: 'FAILED',
      resultCode: 1037,
      resultDesc: 'M-PESA USSD Request Timed Out (Customer did not enter PIN in 30s)',
      actionTaken: 'Triggered STK Push Retry Policy Engine',
    });

    for (let i = 1; i <= (activePolicy.maxRetries || 3); i++) {
      let delayForStep = currentDelay;
      if (activePolicy.backoffStrategy === 'EXPONENTIAL') {
        delayForStep = currentDelay * Math.pow(2, i - 1);
      } else if (activePolicy.backoffStrategy === 'IMMEDIATE') {
        delayForStep = 0;
      }

      timeline.push({
        step: i,
        phase: `RETRY_ATTEMPT_${i}`,
        delaySeconds: delayForStep,
        status: i === activePolicy.maxRetries ? 'SUCCESS' : 'SIMULATED_RETRY',
        resultCode: i === activePolicy.maxRetries ? 0 : 1037,
        resultDesc: i === activePolicy.maxRetries 
          ? 'M-PESA STK Push Successful! Payment Confirmed' 
          : `Auto-Retrying STK Push to ${phone} after ${delayForStep}s delay...`,
        smsAlertSent: activePolicy.notifyCustomerOnRetry,
      });
    }

    res.json({
      success: true,
      message: `Simulated STK Push Policy execution for ${phone}`,
      policyUsed: activePolicy,
      timeline,
      totalEstimatedTimeSeconds: timeline.reduce((acc, curr) => acc + (curr.delaySeconds || 0), 0),
    });
  });

  // Get current active STK prompt for live phone simulator
  app.get('/api/stkpush/active-prompt', (req, res) => {
    const active = activeStkPrompts.find((p) => p.status === 'WAITING_FOR_PIN') || null;
    res.json({ prompt: active });
  });

  // Simulate customer entering M-PESA PIN on phone or cancelling
  app.post('/api/stkpush/simulate-action', (req, res) => {
    const { checkoutRequestId, action, pin } = req.body; // action: 'ENTER_PIN' | 'CANCEL'
    const promptIdx = activeStkPrompts.findIndex((p) => p.checkoutRequestId === checkoutRequestId);
    const tx = transactionsState.find((t) => t.checkoutRequestId === checkoutRequestId);

    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaction request not found' });
    }

    const timestamp = new Date().toISOString();

    if (action === 'ENTER_PIN') {
      const receipt = generateMpesaReceipt();
      tx.status = 'SUCCESS';
      tx.mpesaReceipt = receipt;
      tx.completedAt = timestamp;
      tx.resultCode = 0;
      tx.resultDesc = 'The service request is processed successfully.';

      // Update customer stats
      const cust = customersState.find((c) => c.phone.replace(/\s+/g, '') === tx.customerPhone.replace(/\s+/g, ''));
      if (cust) {
        cust.totalSpent += tx.amount;
        cust.transactionCount += 1;
        cust.lastTransactionAt = timestamp;
        if (cust.transactionCount >= 5 && cust.category !== 'VIP') cust.category = 'VIP';
      }

      // Update branch stats
      const branch = branchesState.find((b) => b.id === tx.branchId);
      if (branch) {
        branch.totalRevenue += tx.amount;
        branch.transactionCount += 1;
      }

      // Push notification
      notificationsState.unshift({
        id: 'notif-' + Date.now(),
        type: 'PAYMENT_RECEIVED',
        title: 'M-PESA Payment Received!',
        message: `KES ${tx.amount.toLocaleString()} received from ${tx.customerName} (${tx.customerPhone}). Receipt: ${receipt}`,
        createdAt: timestamp,
        read: false,
        amount: tx.amount,
        phone: tx.customerPhone,
        transactionId: tx.id,
      });

      auditLogsState.unshift({
        id: 'log-' + Date.now(),
        timestamp,
        action: 'MPESA_CALLBACK_SUCCESS',
        actorName: 'Safaricom Daraja API Gateway',
        actorRole: 'SUPER_ADMIN',
        details: `Received success callback for KES ${tx.amount} with receipt code ${receipt}`,
        ipAddress: '196.201.214.200',
      });

      // Record Raw Webhook Payload for Debugging Log Stream
      const rawSuccessPayload = {
        Body: {
          stkCallback: {
            MerchantRequestID: tx.merchantRequestId,
            CheckoutRequestID: tx.checkoutRequestId,
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully.',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: tx.amount },
                { Name: 'MpesaReceiptNumber', Value: receipt },
                { Name: 'Balance' },
                { Name: 'TransactionDate', Value: Number(new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14)) },
                { Name: 'PhoneNumber', Value: Number(tx.customerPhone.replace(/\D/g, '')) },
              ],
            },
          },
        },
      };

      recordWebhookPayload(
        'STK_PUSH_CALLBACK',
        tx.merchantRequestId,
        tx.checkoutRequestId,
        0,
        'The service request is processed successfully.',
        rawSuccessPayload,
        tx.businessId,
        receipt,
        tx.amount,
        tx.customerPhone
      );

      // Check if this payment is a PesaRequest Subscription upgrade/renewal payment
      if (tx.description && tx.description.startsWith('PesaRequest Subscription:')) {
        const inv = subscriptionInvoicesState.find(
          (i) => i.checkoutRequestId === checkoutRequestId || (i.planName && tx.description.includes(i.planName))
        );
        if (inv) {
          inv.status = 'PAID';
          inv.mpesaReceipt = receipt;
          inv.paidAt = timestamp;
        }

        const targetPlan =
          subscriptionPlansState.find((p) => tx.description.includes(p.name)) ||
          subscriptionPlansState.find((p) => p.priceKes === tx.amount) ||
          subscriptionPlansState[1];

        const tenantBiz = businessesList.find((b) => b.id === tx.businessId) || businessState;
        const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        tenantBiz.subscriptionTier = targetPlan.tier;
        tenantBiz.subscriptionRenewalDate = renewalDate;
        tenantBiz.subscriptionStatus = 'ACTIVE';
        tenantBiz.maxBranches = targetPlan.maxBranches;
        tenantBiz.maxStaff = targetPlan.maxStaff;
        tenantBiz.maxTransactions = targetPlan.maxTransactions;
        tenantBiz.unlockedFeatures = targetPlan.features;

        if (tenantBiz.id === businessState.id) {
          businessState = { ...tenantBiz };
        }

        notificationsState.unshift({
          id: 'notif-' + Date.now(),
          businessId: tx.businessId,
          type: 'SUBSCRIPTION',
          title: '🎉 Subscription Paid & Activated!',
          message: `M-PESA receipt ${receipt} verified. Workspace updated to ${targetPlan.name} (${targetPlan.tier} Tier). All limits & features unlocked!`,
          createdAt: timestamp,
          read: false,
          amount: tx.amount,
        });

        auditLogsState.unshift({
          id: 'log-' + Date.now(),
          businessId: tx.businessId,
          timestamp,
          action: 'SUBSCRIPTION_ACTIVATED_VIA_MPESA',
          actorName: 'Safaricom M-PESA Callback Engine',
          actorRole: 'SUPER_ADMIN',
          details: `Successfully activated plan ${targetPlan.name} (${targetPlan.tier} tier) for tenant ${tx.businessId} via receipt ${receipt}`,
          ipAddress: '196.201.214.200',
        });
      }

      if (promptIdx !== -1) activeStkPrompts.splice(promptIdx, 1);

      return res.json({
        success: true,
        message: `Payment of KES ${tx.amount} completed successfully! M-PESA Receipt: ${receipt}`,
        transaction: tx,
      });
    } else {
      tx.status = 'CANCELLED';
      tx.completedAt = timestamp;
      tx.resultCode = 1032;
      tx.resultDesc = 'Request cancelled by user or PIN prompt timed out.';

      if (tx.description && tx.description.startsWith('PesaRequest Subscription:')) {
        const inv = subscriptionInvoicesState.find((i) => i.checkoutRequestId === checkoutRequestId);
        if (inv) inv.status = 'FAILED';
      }

      notificationsState.unshift({
        id: 'notif-' + Date.now(),
        type: 'PAYMENT_FAILED',
        title: 'M-PESA Payment Cancelled',
        message: `Payment request of KES ${tx.amount.toLocaleString()} to ${tx.customerName} was cancelled by user on phone.`,
        createdAt: timestamp,
        read: false,
        amount: tx.amount,
        phone: tx.customerPhone,
        transactionId: tx.id,
      });

      auditLogsState.unshift({
        id: 'log-' + Date.now(),
        timestamp,
        action: 'MPESA_CALLBACK_CANCELLED',
        actorName: 'Safaricom Daraja API Gateway',
        actorRole: 'SUPER_ADMIN',
        details: `Transaction ${tx.checkoutRequestId} was cancelled by user. ResultCode: 1032`,
        ipAddress: '196.201.214.200',
      });

      // Record Raw Webhook Payload for Cancelled Request
      const rawCancelPayload = {
        Body: {
          stkCallback: {
            MerchantRequestID: tx.merchantRequestId,
            CheckoutRequestID: tx.checkoutRequestId,
            ResultCode: 1032,
            ResultDesc: 'Request cancelled by user or PIN prompt timed out.',
          },
        },
      };

      recordWebhookPayload(
        'STK_PUSH_CALLBACK',
        tx.merchantRequestId,
        tx.checkoutRequestId,
        1032,
        'Request cancelled by user or PIN prompt timed out.',
        rawCancelPayload,
        tx.businessId,
        undefined,
        tx.amount,
        tx.customerPhone
      );

      if (promptIdx !== -1) activeStkPrompts.splice(promptIdx, 1);

      return res.json({
        success: false,
        message: 'STK Push request cancelled by customer on phone screen.',
        transaction: tx,
      });
    }
  });

  // Daraja Webhook Callback Receiver Endpoint
  app.post('/api/stkpush/callback', (req, res) => {
    console.log('Received M-PESA Daraja Callback:', JSON.stringify(req.body));
    const body = req.body || {};
    const stkCallback = body?.Body?.stkCallback || {};
    const merchantReqId = stkCallback.MerchantRequestID || 'MR-' + Math.floor(10000 + Math.random() * 90000);
    const checkoutReqId = stkCallback.CheckoutRequestID || 'ws_CO_' + Date.now();
    const resultCode = stkCallback.ResultCode !== undefined ? stkCallback.ResultCode : 0;
    const resultDesc = stkCallback.ResultDesc || 'Callback received successfully.';

    let receipt: string | undefined;
    let amount: number | undefined;
    let phone: string | undefined;

    if (stkCallback.CallbackMetadata && Array.isArray(stkCallback.CallbackMetadata.Item)) {
      for (const item of stkCallback.CallbackMetadata.Item) {
        if (item.Name === 'MpesaReceiptNumber') receipt = String(item.Value);
        if (item.Name === 'Amount') amount = Number(item.Value);
        if (item.Name === 'PhoneNumber') phone = String(item.Value);
      }
    }

    recordWebhookPayload(
      'STK_PUSH_CALLBACK',
      merchantReqId,
      checkoutReqId,
      resultCode,
      resultDesc,
      req.body,
      getTenantId(req),
      receipt,
      amount,
      phone
    );

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  });

  // Webhooks Debugging API
  app.get('/api/webhooks/logs', (req, res) => {
    const tenantId = getTenantId(req);
    const tenantLogs = webhookLogsState.filter((l) => !l.businessId || l.businessId === tenantId).slice(0, 50);
    res.json({ success: true, logs: tenantLogs, total: tenantLogs.length });
  });

  app.post('/api/webhooks/clear', (req, res) => {
    const tenantId = getTenantId(req);
    webhookLogsState = webhookLogsState.filter((l) => l.businessId && l.businessId !== tenantId);
    res.json({ success: true, message: 'All webhook callback logs cleared.' });
  });

  // --- BUSINESSES (MULTI-TENANT SUPER ADMIN) API ---
  app.get('/api/businesses', (req, res) => {
    const search = req.query.search as string;
    let list = [...businessesList];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.kraPin.toLowerCase().includes(q) ||
          (b.tillNumber && b.tillNumber.includes(q)) ||
          (b.category && b.category.toLowerCase().includes(q)) ||
          b.contactEmail.toLowerCase().includes(q)
      );
    }
    res.json({ businesses: list, total: list.length });
  });

  app.post('/api/businesses', (req, res) => {
    const { name, paybill, tillNumber, subscriptionTier, kraPin, contactEmail, contactPhone, address, category, customCategory } = req.body;
    if (!name || !contactEmail || !contactPhone) {
      return res.status(400).json({ success: false, message: 'Business name, email, and phone required' });
    }

    const selectedTier = subscriptionTier || 'STARTER';
    const plan = subscriptionPlans.find((p) => p.tier === selectedTier) || subscriptionPlans[0];
    const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const newBiz: Business = {
      id: 'biz-' + Date.now(),
      name,
      category: category || 'SME',
      customCategory: customCategory || '',
      paybill: paybill || '522522',
      tillNumber: tillNumber || '174' + Math.floor(100 + Math.random() * 900),
      subscriptionTier: selectedTier,
      subscriptionRenewalDate: renewalDate,
      subscriptionStatus: 'ACTIVE',
      maxBranches: plan.maxBranches,
      maxStaff: plan.maxStaff,
      maxTransactions: plan.maxTransactions,
      unlockedFeatures: plan.features,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      address: address || 'Nairobi, Kenya',
      kraPin: kraPin || 'P05' + Math.floor(10000000 + Math.random() * 90000000) + 'Z',
      contactEmail,
      contactPhone,
    };

    businessesList.unshift(newBiz);

    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'BUSINESS_CREATED',
      actorName: 'Super Admin',
      actorRole: 'SUPER_ADMIN',
      details: `Registered new tenant business: ${name} (${newBiz.category || 'SME'} - ${newBiz.subscriptionTier})`,
      ipAddress: '197.237.10.45',
    });

    res.json({ success: true, business: newBiz });
  });

  app.put('/api/businesses/:id', (req, res) => {
    const biz = businessesList.find((b) => b.id === req.params.id);
    if (!biz) return res.status(404).json({ success: false, message: 'Business not found' });

    const { name, paybill, tillNumber, subscriptionTier, status, kraPin, contactEmail, contactPhone, address, category, customCategory } = req.body;
    if (name) biz.name = name;
    if (category) biz.category = category;
    if (customCategory !== undefined) biz.customCategory = customCategory;
    if (paybill !== undefined) biz.paybill = paybill;
    if (tillNumber !== undefined) biz.tillNumber = tillNumber;
    if (subscriptionTier && subscriptionTier !== biz.subscriptionTier) {
      biz.subscriptionTier = subscriptionTier;
      const plan = subscriptionPlans.find((p) => p.tier === subscriptionTier) || subscriptionPlans[0];
      biz.maxBranches = plan.maxBranches;
      biz.maxStaff = plan.maxStaff;
      biz.maxTransactions = plan.maxTransactions;
      biz.unlockedFeatures = plan.features;
      biz.subscriptionRenewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      biz.subscriptionStatus = 'ACTIVE';
    }
    if (status) biz.status = status;
    if (kraPin) biz.kraPin = kraPin;
    if (contactEmail) biz.contactEmail = contactEmail;
    if (contactPhone) biz.contactPhone = contactPhone;
    if (address) biz.address = address;

    if (biz.id === businessState.id) {
      businessState = { ...biz };
    }

    res.json({ success: true, business: biz });
  });

  app.delete('/api/businesses/:id', (req, res) => {
    const idx = businessesList.findIndex((b) => b.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Business not found' });

    const deleted = businessesList.splice(idx, 1)[0];
    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'BUSINESS_DELETED',
      actorName: 'Super Admin',
      actorRole: 'SUPER_ADMIN',
      details: `Archived/Deleted business tenant ${deleted.name} (${deleted.id})`,
      ipAddress: '197.237.10.45',
    });

    res.json({ success: true, message: 'Business deleted successfully', deleted });
  });

  // --- TRANSACTIONS API ---
  app.get('/api/transactions', (req, res) => {
    const { status, search, branchId, limit } = req.query;
    const tenantId = getTenantId(req);
    let list = transactionsState.filter((t) => t.businessId === tenantId);

    if (status && status !== 'ALL') {
      list = list.filter((t) => t.status === status);
    }
    if (branchId && branchId !== 'ALL') {
      list = list.filter((t) => t.branchId === branchId);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(
        (t) =>
          t.customerName.toLowerCase().includes(q) ||
          t.customerPhone.includes(q) ||
          (t.mpesaReceipt && t.mpesaReceipt.toLowerCase().includes(q)) ||
          t.description.toLowerCase().includes(q)
      );
    }

    if (limit) {
      list = list.slice(0, Number(limit));
    }

    res.json({ transactions: list, total: list.length });
  });

  app.get('/api/transactions/:id', (req, res) => {
    const tx = transactionsState.find((t) => t.id === req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ transaction: tx });
  });

  app.put('/api/transactions/:id', (req, res) => {
    const tx = transactionsState.find((t) => t.id === req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });

    const { description, status, mpesaReceipt } = req.body;
    if (description) tx.description = description;
    if (status) tx.status = status;
    if (mpesaReceipt) tx.mpesaReceipt = mpesaReceipt;

    res.json({ success: true, transaction: tx });
  });

  app.delete('/api/transactions/:id', (req, res) => {
    const idx = transactionsState.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Transaction not found' });

    const deleted = transactionsState.splice(idx, 1)[0];
    res.json({ success: true, message: 'Transaction record deleted', deleted });
  });

  // Export Transactions as CSV / Sheets format
  app.get('/api/transactions/export', (req, res) => {
    const tenantId = getTenantId(req);
    const tenantTxs = transactionsState.filter((t) => t.businessId === tenantId);
    const headers = 'Transaction ID,M-PESA Receipt,Customer Name,Phone Number,Amount (KES),Status,Branch,Description,Date & Time\n';
    const rows = tenantTxs
      .map(
        (t) =>
          `"${t.id}","${t.mpesaReceipt || 'N/A'}","${t.customerName}","${t.customerPhone}",${t.amount},"${t.status}","${t.branchName}","${t.description.replace(/"/g, '""')}","${t.createdAt}"`
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="PesaRequest_Transactions_Export.csv"');
    res.status(200).send(headers + rows);
  });

  // --- CUSTOMERS (CRM) API ---
  app.get('/api/customers', (req, res) => {
    const search = req.query.search as string;
    const tenantId = getTenantId(req);
    let list = customersState.filter((c) => c.businessId === tenantId);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q));
    }
    res.json({ customers: list, total: list.length });
  });

  app.post('/api/customers', (req, res) => {
    const { name, phone, email, notes } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'Name and phone required' });
    const tenantId = getTenantId(req);

    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      businessId: tenantId,
      name,
      phone,
      email: email || `${phone}@customer.co.ke`,
      totalSpent: 0,
      transactionCount: 0,
      category: 'NEW',
      lastTransactionAt: new Date().toISOString(),
      notes,
    };
    customersState.unshift(newCust);
    res.json({ success: true, customer: newCust });
  });

  app.put('/api/customers/:id', (req, res) => {
    const cust = customersState.find((c) => c.id === req.params.id);
    if (!cust) return res.status(404).json({ success: false, message: 'Customer not found' });

    const { name, phone, email, notes, category } = req.body;
    if (name) cust.name = name;
    if (phone) cust.phone = phone;
    if (email) cust.email = email;
    if (notes !== undefined) cust.notes = notes;
    if (category) cust.category = category;

    res.json({ success: true, customer: cust });
  });

  app.delete('/api/customers/:id', (req, res) => {
    const idx = customersState.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Customer not found' });

    const deleted = customersState.splice(idx, 1)[0];
    res.json({ success: true, message: 'Customer record deleted', deleted });
  });

  // --- BRANCHES API ---
  app.get('/api/branches', (req, res) => {
    const tenantId = getTenantId(req);
    const tenantBranches = branchesState.filter((b) => b.businessId === tenantId);
    res.json({ branches: tenantBranches });
  });

  app.post('/api/branches', (req, res) => {
    const { name, location, managerName, phone, tillNumber } = req.body;
    if (!name || !location) return res.status(400).json({ message: 'Name and location required' });
    const tenantId = getTenantId(req);
    const tenantBiz = businessesList.find((b) => b.id === tenantId) || businessState;
    const plan = subscriptionPlans.find((p) => p.tier === tenantBiz.subscriptionTier) || subscriptionPlans[0];
    const maxBranches = tenantBiz.maxBranches !== undefined ? tenantBiz.maxBranches : plan.maxBranches;
    const currentBranchesCount = branchesState.filter((b) => b.businessId === tenantId).length;

    if (maxBranches > 0 && currentBranchesCount >= maxBranches) {
      return res.status(403).json({
        success: false,
        message: `Branch limit reached (${currentBranchesCount}/${maxBranches}) for your ${tenantBiz.subscriptionTier} plan. Please upgrade your subscription to add more store locations.`,
      });
    }

    const newBranch: Branch = {
      id: 'br-' + Date.now(),
      businessId: tenantId,
      name,
      code: 'BR-' + (branchesState.filter((b) => b.businessId === tenantId).length + 1).toString().padStart(2, '0'),
      location,
      managerName: managerName || 'Unassigned',
      phone: phone || tenantBiz.contactPhone,
      tillNumber: tillNumber || tenantBiz.tillNumber || '174379',
      status: 'ACTIVE',
      totalRevenue: 0,
      transactionCount: 0,
    };
    branchesState.push(newBranch);
    res.json({ success: true, branch: newBranch });
  });

  app.put('/api/branches/:id', (req, res) => {
    const branch = branchesState.find((b) => b.id === req.params.id);
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });

    const { name, location, managerName, phone, tillNumber, status } = req.body;
    if (name) branch.name = name;
    if (location) branch.location = location;
    if (managerName) branch.managerName = managerName;
    if (phone) branch.phone = phone;
    if (tillNumber) branch.tillNumber = tillNumber;
    if (status) branch.status = status;

    res.json({ success: true, branch });
  });

  app.delete('/api/branches/:id', (req, res) => {
    const idx = branchesState.findIndex((b) => b.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Branch not found' });

    const deleted = branchesState.splice(idx, 1)[0];
    res.json({ success: true, message: 'Branch deleted', deleted });
  });

  // --- STAFF & RBAC API ---
  app.get('/api/staff', (req, res) => {
    const tenantId = getTenantId(req);
    const tenantStaff = usersState.filter((u) => u.businessId === tenantId);
    res.json({ users: tenantStaff });
  });

  app.post('/api/staff', (req, res) => {
    const { name, email, phone, role, branchId } = req.body;
    if (!name || !email || !role) return res.status(400).json({ message: 'Name, email, and role required' });
    const tenantId = getTenantId(req);
    const tenantBiz = businessesList.find((b) => b.id === tenantId) || businessState;
    const plan = subscriptionPlans.find((p) => p.tier === tenantBiz.subscriptionTier) || subscriptionPlans[0];
    const maxStaff = tenantBiz.maxStaff !== undefined ? tenantBiz.maxStaff : plan.maxStaff;
    const currentStaffCount = usersState.filter((u) => u.businessId === tenantId).length;

    if (maxStaff > 0 && currentStaffCount >= maxStaff) {
      return res.status(403).json({
        success: false,
        message: `Staff account limit reached (${currentStaffCount}/${maxStaff}) for your ${tenantBiz.subscriptionTier} plan. Please upgrade your subscription to invite more staff members.`,
      });
    }

    const newUser: User = {
      id: 'usr-' + Date.now(),
      name,
      email,
      phone: phone || '+254 700 000 000',
      role,
      businessId: tenantId,
      branchId: branchId || undefined,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    usersState.push(newUser);

    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'STAFF_INVITED',
      actorName: name,
      actorRole: role,
      details: `Invited new staff member ${name} (${role}) for tenant ${tenantId}`,
      ipAddress: '197.237.10.45',
    });

    res.json({ success: true, user: newUser });
  });

  app.put('/api/staff/:id', (req, res) => {
    const { name, email, phone, role, status, branchId } = req.body;
    const user = usersState.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ message: 'Staff user not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;
    if (branchId !== undefined) user.branchId = branchId;

    res.json({ success: true, user });
  });

  app.delete('/api/staff/:id', (req, res) => {
    const idx = usersState.findIndex((u) => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Staff user not found' });

    const deleted = usersState.splice(idx, 1)[0];
    res.json({ success: true, message: 'Staff account revoked', deleted });
  });

  // --- ANALYTICS & DASHBOARD SUMMARY ---
  app.get('/api/analytics/dashboard', (req, res) => {
    const tenantId = getTenantId(req);
    const branchIdParam = (req.query.branchId as string) || (req.headers['x-branch-id'] as string);

    let tenantTxs = transactionsState.filter((t) => t.businessId === tenantId);
    const tenantBranches = branchesState.filter((b) => b.businessId === tenantId);

    let selectedBranchObj: Branch | null = null;
    if (branchIdParam && branchIdParam !== 'ALL') {
      selectedBranchObj = tenantBranches.find((b) => b.id === branchIdParam) || null;
      if (selectedBranchObj) {
        tenantTxs = tenantTxs.filter(
          (t) => t.branchId === branchIdParam || t.branchName?.toLowerCase() === selectedBranchObj!.name.toLowerCase()
        );
      } else {
        tenantTxs = tenantTxs.filter((t) => t.branchId === branchIdParam);
      }
    }

    const successTxs = tenantTxs.filter((t) => t.status === 'SUCCESS');
    const pendingTxs = tenantTxs.filter((t) => t.status === 'PENDING');
    const failedTxs = tenantTxs.filter((t) => t.status === 'FAILED' || t.status === 'CANCELLED');

    const todayRevenue = successTxs.reduce((acc, t) => acc + t.amount, 0);
    const todayCount = successTxs.length;
    const pendingCount = pendingTxs.length;
    const failedCount = failedTxs.length;
    const totalCount = tenantTxs.length;
    const successRate = totalCount > 0 ? Math.round((todayCount / totalCount) * 100) : 100;

    // Daily chart
    const revenueChart = [
      { date: 'Jul 25', amount: Math.round(todayRevenue * 0.4), count: Math.max(0, Math.round(todayCount * 0.4)) },
      { date: 'Jul 26', amount: Math.round(todayRevenue * 0.6), count: Math.max(0, Math.round(todayCount * 0.6)) },
      { date: 'Jul 27', amount: Math.round(todayRevenue * 0.5), count: Math.max(0, Math.round(todayCount * 0.5)) },
      { date: 'Jul 28', amount: Math.round(todayRevenue * 0.7), count: Math.max(0, Math.round(todayCount * 0.7)) },
      { date: 'Jul 29', amount: Math.round(todayRevenue * 0.9), count: Math.max(0, Math.round(todayCount * 0.9)) },
      { date: 'Jul 30', amount: Math.round(todayRevenue * 0.8), count: Math.max(0, Math.round(todayCount * 0.8)) },
      { date: 'Jul 31', amount: todayRevenue, count: todayCount },
    ];

    const statusBreakdown = [
      { name: 'Successful', value: todayCount, color: '#10B981' },
      { name: 'Pending', value: pendingCount, color: '#F59E0B' },
      { name: 'Failed / Cancelled', value: failedCount, color: '#EF4444' },
    ];

    const branchBreakdown = tenantBranches.map((b) => {
      const bTxs = transactionsState.filter(
        (t) => t.businessId === tenantId && (t.branchId === b.id || t.branchName?.toLowerCase() === b.name.toLowerCase())
      );
      const bSuccess = bTxs.filter((t) => t.status === 'SUCCESS');
      const bRevenue = bSuccess.reduce((acc, t) => acc + t.amount, 0);
      return {
        id: b.id,
        name: b.name,
        location: b.location,
        tillNumber: b.tillNumber || '174379',
        managerName: b.managerName || 'Branch Manager',
        status: b.status,
        revenue: bRevenue || b.totalRevenue || 0,
        transactions: bTxs.length || b.transactionCount || 0,
      };
    });

    res.json({
      selectedBranchId: branchIdParam || 'ALL',
      selectedBranch: selectedBranchObj,
      branches: tenantBranches,
      todayRevenue,
      todayCount,
      pendingCount,
      failedCount,
      successRate,
      monthlyRevenue: todayRevenue * 12,
      monthlyCount: todayCount * 12,
      revenueChart,
      statusBreakdown,
      branchBreakdown,
      recentTransactions: tenantTxs.slice(0, 8),
    });
  });

  // --- SUBSCRIPTIONS & BILLING API ---
  app.get('/api/subscriptions/plans', (req, res) => {
    const tenantId = getTenantId(req);
    const tenantBiz = businessesList.find((b) => b.id === tenantId) || businessState;
    const tenantTxs = transactionsState.filter((t) => t.businessId === tenantId);
    const tenantBranches = branchesState.filter((b) => b.businessId === tenantId);
    const tenantStaff = usersState.filter((u) => u.businessId === tenantId);
    const tenantInvoices = subscriptionInvoicesState.filter((i) => i.businessId === tenantId);

    const plan = subscriptionPlansState.find((p) => p.tier === tenantBiz.subscriptionTier) || subscriptionPlansState[0];

    res.json({
      success: true,
      plans: subscriptionPlansState,
      currentTier: tenantBiz.subscriptionTier,
      currentBusiness: tenantBiz,
      invoices: tenantInvoices,
      usage: {
        branchesCount: tenantBranches.length,
        maxBranches: tenantBiz.maxBranches !== undefined ? tenantBiz.maxBranches : plan.maxBranches,
        staffCount: tenantStaff.length,
        maxStaff: tenantBiz.maxStaff !== undefined ? tenantBiz.maxStaff : plan.maxStaff,
        monthlyTxsCount: tenantTxs.length,
        maxTransactions: tenantBiz.maxTransactions !== undefined ? tenantBiz.maxTransactions : plan.maxTransactions,
      },
    });
  });

  app.get('/api/subscriptions/invoices', (req, res) => {
    const tenantId = getTenantId(req);
    const tenantInvoices = subscriptionInvoicesState.filter((i) => i.businessId === tenantId);
    res.json({ success: true, invoices: tenantInvoices });
  });

  app.get('/api/subscriptions/invoices/:id', (req, res) => {
    const inv = subscriptionInvoicesState.find((i) => i.id === req.params.id);
    if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, invoice: inv });
  });

  app.post('/api/subscriptions/upgrade', (req, res) => {
    const { planId, phone } = req.body;
    const plan = subscriptionPlansState.find((p) => p.id === planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Subscription plan not found' });

    const tenantId = getTenantId(req);
    const tenantBiz = businessesList.find((b) => b.id === tenantId) || businessState;
    const timestamp = new Date().toISOString();
    const formattedPhone = phone ? phone.trim().replace(/\s+/g, '') : tenantBiz.contactPhone;

    // Free plan activation (no STK push required)
    if (plan.priceKes === 0) {
      tenantBiz.subscriptionTier = plan.tier;
      tenantBiz.subscriptionRenewalDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      tenantBiz.subscriptionStatus = 'ACTIVE';
      tenantBiz.maxBranches = plan.maxBranches;
      tenantBiz.maxStaff = plan.maxStaff;
      tenantBiz.maxTransactions = plan.maxTransactions;
      tenantBiz.unlockedFeatures = plan.features;

      if (tenantBiz.id === businessState.id) {
        businessState = { ...tenantBiz };
      }

      const inv: SubscriptionInvoice = {
        id: 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
        businessId: tenantId,
        businessName: tenantBiz.name,
        planId: plan.id,
        planName: plan.name,
        tier: plan.tier,
        amountKes: 0,
        status: 'PAID',
        mpesaReceipt: 'FREE_PLAN',
        customerPhone: formattedPhone,
        issuedAt: timestamp,
        paidAt: timestamp,
        periodStart: timestamp,
        periodEnd: tenantBiz.subscriptionRenewalDate,
        vatAmountKes: 0,
        paymentMethod: 'Free Tier',
      };
      subscriptionInvoicesState.unshift(inv);

      notificationsState.unshift({
        id: 'notif-' + Date.now(),
        businessId: tenantId,
        type: 'SUBSCRIPTION',
        title: 'Free Starter Plan Switched',
        message: 'Your workspace is now on the Free Starter plan. Tier limits and features applied.',
        createdAt: timestamp,
        read: false,
      });

      auditLogsState.unshift({
        id: 'log-' + Date.now(),
        businessId: tenantId,
        timestamp,
        action: 'SUBSCRIPTION_SWITCHED_FREE',
        actorName: 'Business Owner',
        actorRole: 'BUSINESS_OWNER',
        details: `Switched plan to ${plan.name} (${plan.tier} tier)`,
        ipAddress: '197.237.10.45',
      });

      return res.json({
        success: true,
        message: `Switched workspace plan to ${plan.name}!`,
        business: tenantBiz,
        plan,
        invoice: inv,
        activeImmediately: true,
      });
    }

    // Paid Plan Subscription Upgrade via M-PESA STK Push
    const merchantReqId = 'MR-SUB-' + Math.floor(10000 + Math.random() * 90000);
    const checkoutReqId = 'ws_CO_SUB_' + Date.now();

    const newInvoice: SubscriptionInvoice = {
      id: 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      businessId: tenantId,
      businessName: tenantBiz.name,
      planId: plan.id,
      planName: plan.name,
      tier: plan.tier,
      amountKes: plan.priceKes,
      status: 'PENDING',
      checkoutRequestId: checkoutReqId,
      customerPhone: formattedPhone,
      issuedAt: timestamp,
      periodStart: timestamp,
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      vatAmountKes: Math.round(plan.priceKes * 0.16),
      paymentMethod: 'M-PESA STK Push',
    };
    subscriptionInvoicesState.unshift(newInvoice);

    // Pending STK Transaction
    const newTx: Transaction = {
      id: 'trx-sub-' + Date.now(),
      merchantRequestId: merchantReqId,
      checkoutRequestId: checkoutReqId,
      customerPhone: formattedPhone,
      customerName: tenantBiz.name + ' (Plan Upgrade)',
      amount: plan.priceKes,
      status: 'PENDING',
      description: `PesaRequest Subscription: ${plan.name} (${plan.tier})`,
      businessId: tenantId,
      branchId: 'HQ',
      branchName: 'Main Store',
      createdByStaffName: 'Billing Admin',
      createdAt: timestamp,
    };
    transactionsState.unshift(newTx);

    // Active STK Prompt for Phone Simulator
    const promptItem: ActiveStkPrompt = {
      merchantRequestId: merchantReqId,
      checkoutRequestId: checkoutReqId,
      phone: formattedPhone,
      amount: plan.priceKes,
      customerName: tenantBiz.name,
      description: `Activate ${plan.name} Subscription (KES ${plan.priceKes.toLocaleString()}/mo)`,
      businessName: 'PesaRequest Billing System',
      createdAt: timestamp,
      status: 'WAITING_FOR_PIN',
      paymentMethodType: 'PAYBILL',
      paymentMethodName: 'PesaRequest Subscriptions PayBill',
      shortcodeOrNumber: '522522',
      accountNumber: 'SUB-' + plan.tier,
    };
    activeStkPrompts.unshift(promptItem);

    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      businessId: tenantId,
      timestamp,
      action: 'SUBSCRIPTION_PAYMENT_INITIATED',
      actorName: 'Business Owner',
      actorRole: 'BUSINESS_OWNER',
      details: `Initiated M-PESA payment of KES ${plan.priceKes.toLocaleString()} for ${plan.name} (${plan.tier}) to ${formattedPhone}`,
      ipAddress: '197.237.10.45',
    });

    res.json({
      success: true,
      message: `M-PESA STK Push prompt sent to ${formattedPhone}. Enter M-PESA PIN to activate ${plan.name}!`,
      merchantRequestId: merchantReqId,
      checkoutRequestId: checkoutReqId,
      transaction: newTx,
      invoice: newInvoice,
      prompt: promptItem,
      requiresPayment: true,
    });
  });

  app.post('/api/subscriptions/renew', (req, res) => {
    const tenantId = getTenantId(req);
    const tenantBiz = businessesList.find((b) => b.id === tenantId) || businessState;
    const currentPlan = subscriptionPlansState.find((p) => p.tier === tenantBiz.subscriptionTier) || subscriptionPlansState[1];
    const { phone } = req.body;
    const formattedPhone = phone ? phone.trim().replace(/\s+/g, '') : tenantBiz.contactPhone;

    const merchantReqId = 'MR-RNW-' + Math.floor(10000 + Math.random() * 90000);
    const checkoutReqId = 'ws_CO_RNW_' + Date.now();
    const timestamp = new Date().toISOString();

    const newInvoice: SubscriptionInvoice = {
      id: 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      businessId: tenantId,
      businessName: tenantBiz.name,
      planId: currentPlan.id,
      planName: currentPlan.name,
      tier: currentPlan.tier,
      amountKes: currentPlan.priceKes,
      status: 'PENDING',
      checkoutRequestId: checkoutReqId,
      customerPhone: formattedPhone,
      issuedAt: timestamp,
      periodStart: timestamp,
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      vatAmountKes: Math.round(currentPlan.priceKes * 0.16),
      paymentMethod: 'M-PESA STK Push',
    };
    subscriptionInvoicesState.unshift(newInvoice);

    const newTx: Transaction = {
      id: 'trx-rnw-' + Date.now(),
      merchantRequestId: merchantReqId,
      checkoutRequestId: checkoutReqId,
      customerPhone: formattedPhone,
      customerName: tenantBiz.name + ' (Subscription Renewal)',
      amount: currentPlan.priceKes,
      status: 'PENDING',
      description: `PesaRequest Subscription: Renewal ${currentPlan.name} (${currentPlan.tier})`,
      businessId: tenantId,
      branchId: 'HQ',
      branchName: 'Main Store',
      createdByStaffName: 'Billing Admin',
      createdAt: timestamp,
    };
    transactionsState.unshift(newTx);

    const promptItem: ActiveStkPrompt = {
      merchantRequestId: merchantReqId,
      checkoutRequestId: checkoutReqId,
      phone: formattedPhone,
      amount: currentPlan.priceKes,
      customerName: tenantBiz.name,
      description: `Renew ${currentPlan.name} Subscription (KES ${currentPlan.priceKes.toLocaleString()}/mo)`,
      businessName: 'PesaRequest Billing System',
      createdAt: timestamp,
      status: 'WAITING_FOR_PIN',
    };
    activeStkPrompts.unshift(promptItem);

    res.json({
      success: true,
      message: `Renewal payment STK Push triggered to ${formattedPhone}. Enter M-PESA PIN to extend subscription!`,
      checkoutRequestId: checkoutReqId,
      transaction: newTx,
      invoice: newInvoice,
    });
  });

  app.post('/api/subscriptions/cancel', (req, res) => {
    const tenantId = getTenantId(req);
    const tenantBiz = businessesList.find((b) => b.id === tenantId) || businessState;

    tenantBiz.subscriptionStatus = 'CANCELLED';
    if (tenantBiz.id === businessState.id) {
      businessState = { ...tenantBiz };
    }

    notificationsState.unshift({
      id: 'notif-' + Date.now(),
      businessId: tenantId,
      type: 'SUBSCRIPTION',
      title: 'Subscription Cancelled',
      message: 'Auto-renewal disabled. Existing features will remain active until the current billing period ends.',
      createdAt: new Date().toISOString(),
      read: false,
    });

    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      businessId: tenantId,
      timestamp: new Date().toISOString(),
      action: 'SUBSCRIPTION_CANCELLED',
      actorName: 'Business Owner',
      actorRole: 'BUSINESS_OWNER',
      details: `Cancelled subscription auto-renewal for tenant ${tenantId}`,
      ipAddress: '197.237.10.45',
    });

    res.json({
      success: true,
      message: 'Subscription auto-renewal has been cancelled. Existing features remain active until your renewal date.',
      business: tenantBiz,
    });
  });

  app.post('/api/subscriptions/simulate-expiry', (req, res) => {
    const tenantId = getTenantId(req);
    const tenantBiz = businessesList.find((b) => b.id === tenantId) || businessState;

    if (tenantBiz.subscriptionStatus === 'EXPIRED') {
      tenantBiz.subscriptionStatus = 'ACTIVE';
    } else {
      tenantBiz.subscriptionStatus = 'EXPIRED';
    }

    if (tenantBiz.id === businessState.id) {
      businessState = { ...tenantBiz };
    }

    res.json({
      success: true,
      message: `Toggled subscription status to ${tenantBiz.subscriptionStatus}`,
      business: tenantBiz,
    });
  });

  // --- NOTIFICATIONS API ---
  app.get('/api/notifications', (req, res) => {
    const tenantId = getTenantId(req);
    const tenantNotifs = notificationsState.filter((n) => !n.businessId || n.businessId === tenantId);
    res.json({ notifications: tenantNotifs, unreadCount: tenantNotifs.filter((n) => !n.read).length });
  });

  app.post('/api/notifications/mark-read', (req, res) => {
    const tenantId = getTenantId(req);
    notificationsState.forEach((n) => {
      if (!n.businessId || n.businessId === tenantId) n.read = true;
    });
    res.json({ success: true, unreadCount: 0 });
  });

  app.delete('/api/notifications/:id', (req, res) => {
    const idx = notificationsState.findIndex((n) => n.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Notification not found' });
    const deleted = notificationsState.splice(idx, 1)[0];
    res.json({ success: true, message: 'Notification deleted', deleted });
  });

  app.delete('/api/notifications', (req, res) => {
    notificationsState = [];
    res.json({ success: true, message: 'All notifications cleared' });
  });

  // --- HELP CENTRE & TICKETS API ---
  app.get('/api/help/articles', (req, res) => {
    res.json({ articles: helpArticlesState });
  });

  app.post('/api/help/articles', (req, res) => {
    const { question, answer, category } = req.body;
    if (!question || !answer) return res.status(400).json({ message: 'Question and answer required' });

    const newArticle: HelpArticle = {
      id: 'help-' + Date.now(),
      question,
      answer,
      category: category || 'GENERAL',
      createdAt: new Date().toISOString(),
    };
    helpArticlesState.push(newArticle);
    res.json({ success: true, article: newArticle });
  });

  app.delete('/api/help/articles/:id', (req, res) => {
    const idx = helpArticlesState.findIndex((h) => h.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Article not found' });
    const deleted = helpArticlesState.splice(idx, 1)[0];
    res.json({ success: true, message: 'Help article removed', deleted });
  });

  // --- USER & BUSINESS PROFILES API ---
  app.put('/api/user/profile', (req, res) => {
    const tenantId = getTenantId(req);
    const { name, phone, email } = req.body;
    const tenantUsers = usersState.filter((u) => u.businessId === tenantId);
    const targetUser = activeSessionUser || tenantUsers[0] || usersState[0];
    if (targetUser) {
      if (name) targetUser.name = name;
      if (phone) targetUser.phone = phone;
      if (email) targetUser.email = email;
      return res.json({ success: true, user: targetUser });
    }
    res.json({ success: true, user: null });
  });

  app.put('/api/business/profile', (req, res) => {
    const tenantId = getTenantId(req);
    const tenantBiz = businessesList.find((b) => b.id === tenantId) || businessState;
    const { name, address, contactEmail, contactPhone, kraPin, paybill, tillNumber, passkey } = req.body;
    if (name) tenantBiz.name = name;
    if (address) tenantBiz.address = address;
    if (contactEmail) tenantBiz.contactEmail = contactEmail;
    if (contactPhone) tenantBiz.contactPhone = contactPhone;
    if (kraPin) tenantBiz.kraPin = kraPin;
    if (paybill) tenantBiz.paybill = paybill;
    if (tillNumber) tenantBiz.tillNumber = tillNumber;
    if (passkey) tenantBiz.passkey = passkey;

    if (tenantBiz.id === businessState.id) {
      businessState = { ...tenantBiz };
    }

    res.json({ success: true, business: tenantBiz });
  });

  // --- AUDIT LOGS & SETTINGS API ---
  app.get('/api/audit-logs', (req, res) => {
    const tenantId = getTenantId(req);
    const tenantLogs = auditLogsState.filter((l) => !l.businessId || l.businessId === tenantId);
    res.json({ logs: tenantLogs });
  });

  app.get('/api/settings/daraja', (req, res) => {
    const tenantId = getTenantId(req);
    const tenantBiz = businessesList.find((b) => b.id === tenantId) || businessState;
    res.json({
      paybill: tenantBiz.paybill,
      tillNumber: tenantBiz.tillNumber,
      passkey: tenantBiz.passkey,
      environment: 'SANDBOX_AND_LIVE',
      callbackUrl: 'https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/stkpush/callback',
      shortcode: tenantBiz.tillNumber || tenantBiz.paybill || '174379',
    });
  });

  app.post('/api/settings/daraja', (req, res) => {
    const tenantId = getTenantId(req);
    const tenantBiz = businessesList.find((b) => b.id === tenantId) || businessState;
    const { paybill, tillNumber, passkey } = req.body;
    if (paybill) tenantBiz.paybill = paybill;
    if (tillNumber) tenantBiz.tillNumber = tillNumber;
    if (passkey) tenantBiz.passkey = passkey;

    if (tenantBiz.id === businessState.id) {
      businessState = { ...tenantBiz };
    }
    res.json({ success: true, message: 'Daraja M-PESA configuration saved successfully', business: tenantBiz });
  });

  // Catch-all 404 handler for unhandled API endpoints to prevent Vite SPA middleware returning HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // Serve static / Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PesaRequest Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
