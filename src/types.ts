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
  emailVerified?: boolean;
  phoneVerified?: boolean;
  isEmailVerified?: boolean;
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

export type MpesaPaymentMethodType = 
  | 'TILL_NUMBER' 
  | 'PAYBILL' 
  | 'POCHI_LA_BIASHARA' 
  | 'SEND_MONEY' 
  | 'BANK' 
  | 'STRIPE' 
  | 'PAYPAL' 
  | 'FLUTTERWAVE' 
  | 'PESAPAL' 
  | 'CARD_GATEWAY';

export interface PaymentMethodConfig {
  id: string;
  businessId: string;
  name: string; // e.g., "Main HQ Till", "Stripe USD Checkout", "PayPal Express"
  type: MpesaPaymentMethodType;
  shortcodeOrNumber: string; // Till Number, Paybill Shortcode, Phone Number, or Gateway Account ID
  accountNumber?: string; // Account Number pattern for PayBill or settlement IBAN/account
  
  // Safaricom Daraja M-PESA Credentials
  passkey?: string; // Lipa Na M-PESA Online Passkey
  consumerKey?: string; // Safaricom Daraja App Consumer Key
  consumerSecret?: string; // Safaricom Daraja App Consumer Secret
  initiatorName?: string; // Safaricom Daraja Initiator Name for B2C/B2B/Status
  securityCredential?: string; // Safaricom Daraja Security Credential
  callbackUrl?: string; // Custom or system Daraja Webhook Callback Receiver URL
  validationUrl?: string; // Daraja C2B Validation URL
  confirmationUrl?: string; // Daraja C2B Confirmation URL
  queueTimeoutUrl?: string; // Daraja Queue Timeout URL for B2C/B2B/Status/Reversal
  resultUrl?: string; // Daraja Result URL for B2C/B2B/Status/Reversal
  b2cCommandId?: string; // e.g. BusinessPayment, SalaryPayment, PromotionPayment
  b2bCommandId?: string; // e.g. BusinessPayBill, BusinessBuyGoods, DisburseFundsToBusiness
  responseType?: string; // Completed or Cancelled for C2B registration
  enableB2c?: boolean;
  enableB2b?: boolean;
  enableReversal?: boolean;
  enableStatusQuery?: boolean;
  enableAccountBalance?: boolean;
  
  // Global Gateway Credentials (Stripe, PayPal, Flutterwave, Pesapal)
  gatewayCategory?: 'MPESA' | 'GLOBAL_GATEWAY' | 'CARD' | 'WALLET';
  stripePublishableKey?: string;
  stripeSecretKey?: string; // Encrypted in Firestore
  stripeWebhookSecret?: string; // Encrypted in Firestore
  paypalClientId?: string;
  paypalClientSecret?: string; // Encrypted in Firestore
  paypalMode?: 'sandbox' | 'live';
  flutterwavePublicKey?: string;
  flutterwaveSecretKey?: string; // Encrypted in Firestore
  flutterwaveEncryptionKey?: string;
  pesapalConsumerKey?: string;
  pesapalConsumerSecret?: string; // Encrypted in Firestore
  isEncrypted?: boolean;
  encryptionAlgorithm?: string;

  environment?: 'SANDBOX' | 'PRODUCTION'; // Gateway Environment
  darajaStatus?: 'VERIFIED' | 'TESTING' | 'PENDING' | 'DISCONNECTED';
  c2bUrlRegistered?: boolean;
  b2cReady?: boolean;
  isDefault: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  branchId?: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  provider?: string; // e.g. 'SAFARICOM_MPESA', 'STRIPE', 'PAYPAL', 'FLUTTERWAVE', 'PESAPAL'
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
  category?: 'LOGIN' | 'CONFIG' | 'PAYMENT' | 'API_REQUEST' | 'USER_ACTIVITY' | 'SECURITY';
  actorName: string;
  actorRole: UserRole;
  details: string;
  ipAddress: string;
  userAgent?: string;
  status?: 'SUCCESS' | 'FAILED' | 'WARNING';
}

export interface WebhookLog {
  id: string;
  businessId?: string;
  timestamp: string;
  eventType: 'STK_PUSH_CALLBACK' | 'C2B_VALIDATION' | 'C2B_CONFIRMATION' | 'B2C_RESULT' | string;
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

export interface SystemErrorLog {
  id: string;
  timestamp: string;
  businessId: string;
  businessName: string;
  category: 'DARAJA_GATEWAY' | 'WEBHOOK_DISPATCH' | 'AUTH_SECURITY' | 'DATABASE_SYNC' | 'EMAIL_SERVICE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  errorCode: string;
  errorMessage: string;
  actionableGuidance: string;
  autoRetryCount: number;
  maxRetries: number;
  retryStatus: 'AUTOMATICALLY_RESOLVED' | 'RETRYING_BACKGROUND' | 'MAX_RETRIES_EXCEEDED' | 'PENDING_MANUAL';
  lastRetryAt?: string;
  requestPath: string;
  httpMethod: string;
}

export interface PerformanceMetrics {
  avgResponseTimeMs: number;
  totalRequests: number;
  cacheHitCount: number;
  cacheMissCount: number;
  cacheHitRatePercent: number;
  cachedKeysCount: number;
  activeBackgroundWorkers: number;
  queuedBackgroundJobs: number;
  processedBackgroundJobs: number;
  requestsPerSecond: number;
  databaseQueryAvgLatencyMs: number;
  memoryUsageMb: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  recentBackgroundJobs: {
    id: string;
    type: string;
    status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    durationMs: number;
    createdAt: string;
  }[];
}

export interface IdempotencyRecord {
  id: string;
  key: string;
  endpoint: string;
  status: 'PROCESSING' | 'COMPLETED' | 'REJECTED_DUPLICATE';
  requestPayloadHash: string;
  responseStatusCode: number;
  responseBody: any;
  createdAt: string;
  expiresAt: string;
}

export interface DuplicatePaymentAlert {
  id: string;
  mpesaReceiptNumber?: string;
  phone: string;
  amount: number;
  checkoutRequestId: string;
  detectionReason: string;
  actionTaken: 'BLOCKED_DUPLICATE' | 'FLAGGED_FOR_REVIEW' | 'AUTO_REFUNDED';
  timestamp: string;
}

export interface WebhookVerificationLog {
  id: string;
  eventType: string;
  merchantRequestId: string;
  checkoutRequestId: string;
  sourceIp: string;
  signatureValid: boolean;
  integrityStatus: 'VERIFIED' | 'INVALID_SIGNATURE' | 'PAYLOAD_TAMPERED' | 'IP_UNAUTHORIZED';
  receivedAt: string;
}

export interface ReconciliationItem {
  id: string;
  mpesaReceiptNumber: string;
  transactionDate: string;
  amount: number;
  phone: string;
  darajaStatus: string;
  ledgerStatus: 'MATCHED' | 'UNMATCHED_RECEIPT' | 'AMOUNT_MISMATCH' | 'PENDING_RECONCILIATION';
  matchedInvoiceId?: string;
  reconciledAt?: string;
}

export interface PaymentReliabilitySummary {
  totalIdempotentRequests: number;
  duplicateRequestsPrevented: number;
  webhookSignaturesVerified: number;
  failedSignaturesBlocked: number;
  matchedReconciliationCount: number;
  unmatchedReconciliationCount: number;
  reconciliationAccuracyPercent: number;
  idempotencyRecords: IdempotencyRecord[];
  duplicateAlerts: DuplicatePaymentAlert[];
  webhookLogs: WebhookVerificationLog[];
  reconciliationItems: ReconciliationItem[];
}

export interface TenantIsolationTestResult {
  testName: string;
  category: 'DATABASE_QUERY_SCOPING' | 'API_CREDENTIAL_ISOLATION' | 'CROSS_TENANT_READ_ATTEMPT' | 'WEBHOOK_HEADER_SECURITY';
  targetBusinessId: string;
  attemptedByBusinessId: string;
  status: 'PASSED_ISOLATED' | 'FAILED_LEAKAGE';
  details: string;
  timestamp: string;
}

export interface TenantSecuritySummary {
  activeTenantId: string;
  activeTenantName: string;
  isolationScorePercent: number;
  totalTenantEntitiesIsolated: {
    transactions: number;
    customers: number;
    branches: number;
    apiKeys: number;
    auditLogs: number;
  };
  securityPolicies: {
    dbQueryFilteringStrict: boolean;
    headerValidationMandatory: boolean;
    credentialsEncryptedPerTenant: boolean;
    crossTenantAccessBlocked: boolean;
  };
  recentIsolationTests: TenantIsolationTestResult[];
}

export interface TenantShardMetric {
  shardId: string;
  region: string;
  activeTenantsCount: number;
  readReplicaLagMs: number;
  status: 'OPTIMAL' | 'SCALING_UP' | 'HIGH_LOAD';
  avgLatencyMs: number;
}

export interface WorkerQueueStatus {
  queueName: string;
  activeWorkers: number;
  pendingJobs: number;
  processedPerSec: number;
  failureRatePercent: number;
}

export interface IntegrationPlugin {
  id: string;
  name: string;
  category: 'ACCOUNTING' | 'ERP' | 'COMMERCE' | 'BANK_GATEWAY';
  version: string;
  status: 'ACTIVE_ISOLATED' | 'STANDBY';
  decoupledEventBus: boolean;
  tenantCountUsing: number;
}

export interface ScalabilitySummary {
  architecturePattern: string;
  supportedTenantCapacity: number;
  activeProvisions: number;
  globalTpsCapacity: number;
  shards: TenantShardMetric[];
  workerQueues: WorkerQueueStatus[];
  plugins: IntegrationPlugin[];
}

export interface ConfigurationIssue {
  id: string;
  category: 'SECURITY' | 'CREDENTIALS' | 'WEBHOOK_SSL' | 'RETRY_POLICY' | 'NETWORK';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  recommendedFix: string;
  canAutoFix: boolean;
  fixed: boolean;
}

export interface IntegrationHealthSummary {
  overallStatus: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  lastCheckedAt: string;
  apiStatus: {
    darajaAuthStatus: 'HEALTHY' | 'UNAVAILABLE' | 'EXPIRING_SOON';
    endpointUrl: string;
    tokenExpiryMinutes: number;
    latencyMs: number;
    httpStatusCode: number;
  };
  callbackStatus: {
    stkPushCallbackUrl: string;
    reachability: 'REACHABLE' | 'UNREACHABLE';
    deliverySuccessRate: number;
    averageCallbackLatencyMs: number;
    lastCallbackAt: string;
  };
  webhookHealth: {
    c2bListenerStatus: 'ACTIVE' | 'PAUSED' | 'FAILED';
    signatureVerification: 'ENABLED_PASS' | 'DISABLED_RISK';
    queueDepth: number;
    processed24hCount: number;
  };
  lastSuccessfulTransaction: {
    receiptNumber: string;
    amount: number;
    phone: string;
    completedAt: string;
    latencyMs: number;
    channel: string;
  } | null;
  issues: ConfigurationIssue[];
}


