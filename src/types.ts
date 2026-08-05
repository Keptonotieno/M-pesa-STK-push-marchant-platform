export type UserRole =
  | 'SUPER_ADMIN'
  | 'BUSINESS_OWNER'
  | 'MANAGER'
  | 'BRANCH_MANAGER'
  | 'CASHIER'
  | 'ACCOUNTANT'
  | 'AUDITOR'
  | 'SUPPORT_STAFF';

export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'TIMED_OUT';

export type SubscriptionTier = 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export const BUSINESS_CATEGORIES = [
  'Public Transport (Matatus, Buses, Taxis)',
  'Restaurant',
  'Hotel',
  'Café',
  'Liquor Store',
  'Bar & Club',
  'Supermarket',
  'Retail Shop',
  'Wholesale Business',
  'Pharmacy',
  'Hospital & Clinic',
  'School & University',
  'Fuel Station',
  'Hardware Store',
  'Electronics Shop',
  'Salon & Barber Shop',
  'Gym & Fitness Centre',
  'Car Wash & Garage',
  'Service Provider',
  'Delivery Company',
  'Online Business',
  'NGO',
  'Government Institution',
  'SME',
  'Large Enterprise',
  'Other / Custom',
] as const;

export type BusinessCategoryType = typeof BUSINESS_CATEGORIES[number];

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  businessId: string;
  branchId?: string;
  avatar?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface StkRetryPolicy {
  maxRetries: number;
  retryDelaySeconds: number;
  backoffStrategy: 'FIXED' | 'EXPONENTIAL' | 'IMMEDIATE';
  autoRetryOnTimeout: boolean;
  autoRetryOnNetworkError: boolean;
  autoRetryOnUserCancel: boolean;
  notifyCustomerOnRetry: boolean;
  maxTimeoutSeconds: number;
}

export interface Business {
  id: string;
  name: string;
  category?: string;
  customCategory?: string;
  paybill?: string;
  tillNumber?: string;
  passkey?: string;
  consumerKey?: string;
  consumerSecret?: string;
  environment?: 'SANDBOX' | 'PRODUCTION';
  logo?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionRenewalDate?: string;
  subscriptionStatus?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'TRIAL';
  maxBranches?: number;
  maxStaff?: number;
  maxTransactions?: number;
  unlockedFeatures?: string[];
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  createdAt: string;
  address: string;
  kraPin: string;
  contactEmail: string;
  contactPhone: string;
  stkRetryPolicy?: StkRetryPolicy;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  code: string;
  location: string;
  managerName: string;
  phone: string;
  tillNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalRevenue: number;
  transactionCount: number;
}

export type MpesaPaymentMethodType = 'TILL_NUMBER' | 'PAYBILL' | 'POCHI_LA_BIASHARA' | 'SEND_MONEY' | 'BANK';

export interface PaymentMethodConfig {
  id: string;
  businessId: string;
  name: string; // e.g., "Main HQ Till", "PayBill Shortcode 400200", "Mama Mboga Pochi"
  type: MpesaPaymentMethodType;
  shortcodeOrNumber: string; // Till Number, Paybill Shortcode, or Phone Number
  accountNumber?: string; // Account Number pattern for PayBill
  passkey?: string; // Lipa Na M-PESA Online Passkey
  consumerKey?: string; // Safaricom Daraja App Consumer Key
  consumerSecret?: string; // Safaricom Daraja App Consumer Secret
  environment?: 'SANDBOX' | 'PRODUCTION'; // Daraja API Gateway Environment
  darajaStatus?: 'VERIFIED' | 'TESTING' | 'PENDING' | 'DISCONNECTED';
  c2bUrlRegistered?: boolean;
  b2cReady?: boolean;
  isDefault: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  branchId?: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  provider?: string; // e.g. 'SAFARICOM_MPESA', 'AIRTEL_MONEY'
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email: string;
  totalSpent: number;
  transactionCount: number;
  category: 'VIP' | 'REGULAR' | 'NEW';
  lastTransactionAt: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  mpesaReceipt?: string;
  merchantRequestId: string;
  checkoutRequestId: string;
  customerPhone: string;
  customerName: string;
  amount: number;
  status: TransactionStatus;
  description: string;
  businessId: string;
  branchId: string;
  branchName: string;
  paymentMethodId?: string;
  paymentMethodType?: MpesaPaymentMethodType;
  paymentMethodName?: string;
  shortcodeOrNumber?: string;
  accountNumber?: string;
  createdByStaffName: string;
  createdAt: string;
  completedAt?: string;
  resultCode?: number;
  resultDesc?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  priceKes: number;
  period: 'MONTHLY' | 'YEARLY';
  maxTransactions: number; // 0 for unlimited
  maxBranches: number;
  maxStaff: number;
  features: string[];
}

export interface SubscriptionInvoice {
  id: string;
  businessId: string;
  businessName: string;
  planId: string;
  planName: string;
  tier: SubscriptionTier;
  amountKes: number;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'CANCELLED';
  mpesaReceipt?: string;
  checkoutRequestId?: string;
  customerPhone: string;
  issuedAt: string;
  paidAt?: string;
  periodStart: string;
  periodEnd: string;
  vatAmountKes: number;
  paymentMethod?: string;
}

export interface NotificationItem {
  id: string;
  businessId?: string;
  type: 'PAYMENT_RECEIVED' | 'PAYMENT_FAILED' | 'SYSTEM' | 'SECURITY' | 'SUBSCRIPTION';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  amount?: number;
  phone?: string;
  transactionId?: string;
}

export interface AuditLog {
  id: string;
  businessId?: string;
  timestamp: string;
  action: string;
  actorName: string;
  actorRole: UserRole;
  details: string;
  ipAddress: string;
}

export interface WebhookLog {
  id: string;
  businessId?: string;
  timestamp: string;
  eventType: 'STK_PUSH_CALLBACK' | 'C2B_VALIDATION' | 'C2B_CONFIRMATION' | 'B2C_RESULT';
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  mpesaReceipt?: string;
  amount?: number;
  customerPhone?: string;
  rawPayload: any;
  ipAddress?: string;
  httpStatus?: number;
}

export interface StkPushRequestPayload {
  phone: string;
  amount: number;
  customerName?: string;
  description: string;
  branchId?: string;
  tillNumber?: string;
  paymentMethodId?: string;
  paymentMethodType?: MpesaPaymentMethodType;
  shortcodeOrNumber?: string;
  accountNumber?: string;
}

export interface StkPushResponse {
  success: boolean;
  message: string;
  merchantRequestId: string;
  checkoutRequestId: string;
  transaction: Transaction;
}

export interface AnalyticsSummary {
  selectedBranchId?: string;
  selectedBranch?: Branch | null;
  branches?: Branch[];
  todayRevenue: number;
  todayCount: number;
  pendingCount: number;
  failedCount: number;
  successRate: number;
  monthlyRevenue: number;
  monthlyCount: number;
  revenueChart: { date: string; amount: number; count: number }[];
  statusBreakdown: { name: string; value: number; color: string }[];
  branchBreakdown: {
    id?: string;
    name: string;
    location?: string;
    tillNumber?: string;
    managerName?: string;
    status?: string;
    revenue: number;
    transactions: number;
  }[];
  recentTransactions: Transaction[];
}
