import { Business, Branch, Customer, Transaction, User, SubscriptionPlan, NotificationItem, AuditLog } from '../types';

export const initialBusiness: Business = {
  id: 'biz-001',
  name: 'Merchant Business HQ',
  category: 'Retail & FMCG',
  paybill: '522522',
  tillNumber: '174379',
  passkey: '',
  logo: '',
  subscriptionTier: 'GROWTH',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  address: 'Kenyatta Avenue, Nairobi',
  kraPin: 'P051882910Z',
  contactEmail: 'contact@merchant.co.ke',
  contactPhone: '+254 700 000 000',
};

export const initialBranches: Branch[] = [];

export const initialUsers: User[] = [];

export const initialCustomers: Customer[] = [];

export const initialTransactions: Transaction[] = [];

export const initialNotifications: NotificationItem[] = [];

export const initialAuditLogs: AuditLog[] = [];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'plan-free',
    name: 'Free Starter',
    tier: 'FREE',
    priceKes: 0,
    period: 'MONTHLY',
    maxTransactions: 50,
    maxBranches: 1,
    maxStaff: 2,
    features: [
      'Up to 50 STK Pushes / mo',
      'Single Branch Access',
      '2 Staff Accounts',
      'Basic Email Support',
      'Standard Dashboard',
    ],
  },
  {
    id: 'plan-starter',
    name: 'Basic Merchant',
    tier: 'STARTER',
    priceKes: 1500,
    period: 'MONTHLY',
    maxTransactions: 500,
    maxBranches: 2,
    maxStaff: 5,
    features: [
      '500 STK Pushes / mo',
      '2 Branches included',
      '5 Staff Accounts (Roles & Permissions)',
      'Real-time SMS & Web Notifications',
      'CSV / Google Sheets Export',
      'Standard Daraja API Integration',
    ],
  },
  {
    id: 'plan-growth',
    name: 'Professional Plan',
    tier: 'GROWTH',
    priceKes: 4500,
    period: 'MONTHLY',
    maxTransactions: 5000,
    maxBranches: 10,
    maxStaff: 25,
    features: [
      '5,000 STK Pushes / mo',
      'Up to 10 Branches & Tills',
      '25 Staff Accounts with granular RBAC',
      'Live Webhook Integration & Daraja Sandbox/Live',
      'Advanced Financial Reports & Peak-Hour Analytics',
      'Priority Support (WhatsApp & Phone 24/7)',
      'Audit Logs & Security Encryption',
    ],
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise Ultra',
    tier: 'ENTERPRISE',
    priceKes: 12500,
    period: 'MONTHLY',
    maxTransactions: 0, // Unlimited
    maxBranches: 999,
    maxStaff: 999,
    features: [
      'Unlimited M-PESA STK Pushes',
      'Unlimited Multi-Branch & Custom Tills/Paybills',
      'Unlimited Staff Users & Admin Roles',
      'Dedicated Account Manager & SLA',
      'Custom ERP/POS Webhook Integrations',
      'Multi-Factor Authentication (MFA) & IP Whitelisting',
      'Custom SLA 99.99% Uptime Guarantee',
    ],
  },
];
