import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Store,
  Building2,
  Smartphone,
  Send,
  CheckCircle,
  XCircle,
  Copy,
  Edit2,
  Trash2,
  Star,
  ShieldCheck,
  Search,
  Check,
  X,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Zap,
  DollarSign,
  Layers,
  Server,
  Terminal,
  RefreshCw,
  Activity,
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight,
  Play,
  CheckCircle2,
  Sliders,
  Sparkles,
  Key,
} from 'lucide-react';
import { PaymentMethodConfig, MpesaPaymentMethodType, Branch } from '../types';
import {
  encryptApiKey,
  maskSecretKey,
  validateGatewayCredentials,
} from '../lib/encryption';
import { DarajaIntegrationWizardModal } from '../components/DarajaIntegrationWizardModal';

interface Props {
  paymentMethods: PaymentMethodConfig[];
  branches: Branch[];
  onAddPaymentMethod: (method: Partial<PaymentMethodConfig>) => Promise<void>;
  onUpdatePaymentMethod: (id: string, updates: Partial<PaymentMethodConfig>) => Promise<void>;
  onDeletePaymentMethod: (id: string) => Promise<void>;
  onSetDefaultPaymentMethod: (id: string) => Promise<void>;
}

type ProviderChoice = 'SAFARICOM_MPESA' | 'STRIPE' | 'PAYPAL' | 'FLUTTERWAVE' | 'PESAPAL';

export const PaymentMethodsView: React.FC<Props> = ({
  paymentMethods,
  branches,
  onAddPaymentMethod,
  onUpdatePaymentMethod,
  onDeletePaymentMethod,
  onSetDefaultPaymentMethod,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'MPESA' | 'GLOBAL_GATEWAYS' | MpesaPaymentMethodType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null);

  // Daraja Integration Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardEditingMethod, setWizardEditingMethod] = useState<PaymentMethodConfig | null>(null);

  // Provider Selection
  const [selectedProvider, setSelectedProvider] = useState<ProviderChoice>('SAFARICOM_MPESA');

  // General Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<MpesaPaymentMethodType>('TILL_NUMBER');
  const [shortcodeOrNumber, setShortcodeOrNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [environment, setEnvironment] = useState<'SANDBOX' | 'PRODUCTION'>('SANDBOX');
  const [branchId, setBranchId] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Daraja M-PESA Credentials state
  const [passkey, setPasskey] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [initiatorName, setInitiatorName] = useState('');
  const [securityCredential, setSecurityCredential] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/stkpush/callback');
  const [validationUrl, setValidationUrl] = useState('https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/c2b/validation');
  const [confirmationUrl, setConfirmationUrl] = useState('https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/c2b/confirmation');
  const [queueTimeoutUrl, setQueueTimeoutUrl] = useState('https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/b2c/timeout');
  const [resultUrl, setResultUrl] = useState('https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/b2c/result');
  const [b2cCommandId, setB2cCommandId] = useState('BusinessPayment');
  const [b2bCommandId, setB2bCommandId] = useState('BusinessPayBill');
  const [responseType, setResponseType] = useState('Completed');
  const [enableB2c, setEnableB2c] = useState(false);
  const [enableB2b, setEnableB2b] = useState(false);
  const [enableReversal, setEnableReversal] = useState(false);
  const [enableStatusQuery, setEnableStatusQuery] = useState(false);
  const [enableAccountBalance, setEnableAccountBalance] = useState(false);
  const [showAdvancedMpesa, setShowAdvancedMpesa] = useState(false);

  // Operations Test Lab Modal state
  const [isTestLabOpen, setIsTestLabOpen] = useState(false);
  const [testLabTargetPm, setTestLabTargetPm] = useState<PaymentMethodConfig | null>(null);
  const [activeTestTab, setActiveTestTab] = useState<'STK_PUSH' | 'C2B' | 'B2C' | 'B2B' | 'TRANSACTION_STATUS' | 'REVERSAL' | 'ACCOUNT_BALANCE' | 'REGISTER_URLS'>('STK_PUSH');
  const [testPhone, setTestPhone] = useState('0712345678');
  const [testAmount, setTestAmount] = useState('10');
  const [testBillRef, setTestBillRef] = useState('ACC-TEST-001');
  const [testMpesaReceipt, setTestMpesaReceipt] = useState('NLX8921021K');
  const [testReceiverShortcode, setTestReceiverShortcode] = useState('600982');
  const [testRemarks, setTestRemarks] = useState('Operations Test Request');
  const [testRunning, setTestRunning] = useState(false);
  const [testResultLog, setTestResultLog] = useState<any | null>(null);

  // Global Gateways Credentials state (Stripe, PayPal, Flutterwave, Pesapal)
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');

  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalClientSecret, setPaypalClientSecret] = useState('');

  const [flutterwavePublicKey, setFlutterwavePublicKey] = useState('');
  const [flutterwaveSecretKey, setFlutterwaveSecretKey] = useState('');
  const [flutterwaveEncryptionKey, setFlutterwaveEncryptionKey] = useState('');

  const [pesapalConsumerKey, setPesapalConsumerKey] = useState('');
  const [pesapalConsumerSecret, setPesapalConsumerSecret] = useState('');

  // Password visibility states
  const [showSecrets, setShowSecrets] = useState(false);

  // Connection testing state
  const [testingGateway, setTestingGateway] = useState(false);
  const [gatewayResult, setGatewayResult] = useState<{
    success: boolean;
    message: string;
    token?: string;
    steps?: { step: string; passed: boolean; message: string }[];
  } | null>(null);

  // Deletion modal state
  const [deletingMethod, setDeletingMethod] = useState<PaymentMethodConfig | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [toastFeedback, setToastFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const resetForm = () => {
    setName('');
    setType('TILL_NUMBER');
    setSelectedProvider('SAFARICOM_MPESA');
    setShortcodeOrNumber('');
    setAccountNumber('');
    setPasskey('');
    setConsumerKey('');
    setConsumerSecret('');
    setInitiatorName('');
    setSecurityCredential('');
    setCallbackUrl('https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/stkpush/callback');
    setValidationUrl('https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/c2b/validation');
    setConfirmationUrl('https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/c2b/confirmation');
    setQueueTimeoutUrl('https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/b2c/timeout');
    setResultUrl('https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/b2c/result');
    setB2cCommandId('BusinessPayment');
    setB2bCommandId('BusinessPayBill');
    setResponseType('Completed');
    setEnableB2c(false);
    setEnableB2b(false);
    setEnableReversal(false);
    setEnableStatusQuery(false);
    setEnableAccountBalance(false);
    setShowAdvancedMpesa(false);
    setStripePublishableKey('');
    setStripeSecretKey('');
    setStripeWebhookSecret('');
    setPaypalClientId('');
    setPaypalClientSecret('');
    setFlutterwavePublicKey('');
    setFlutterwaveSecretKey('');
    setFlutterwaveEncryptionKey('');
    setPesapalConsumerKey('');
    setPesapalConsumerSecret('');
    setEnvironment('SANDBOX');
    setBranchId(branches[0]?.id || '');
    setIsDefault(paymentMethods.length === 0);
    setNotes('');
    setErrorMsg('');
    setShowSecrets(false);
    setGatewayResult(null);
  };

  const openAddModal = (provider: ProviderChoice = 'SAFARICOM_MPESA') => {
    if (provider === 'SAFARICOM_MPESA') {
      setWizardEditingMethod(null);
      setIsWizardOpen(true);
      return;
    }
    setEditingMethod(null);
    resetForm();
    setSelectedProvider(provider);
    if (provider === 'STRIPE') {
      setType('STRIPE');
      setName('Stripe Global USD Checkout');
    } else if (provider === 'PAYPAL') {
      setType('PAYPAL');
      setName('PayPal Express Checkout');
    } else if (provider === 'FLUTTERWAVE') {
      setType('FLUTTERWAVE');
      setName('Flutterwave Multi-Currency Gateway');
    } else if (provider === 'PESAPAL') {
      setType('PESAPAL');
      setName('Pesapal v3 Payment Channel');
    }
    setIsModalOpen(true);
  };

  const openEditModal = (pm: PaymentMethodConfig) => {
    if (pm.provider === 'SAFARICOM_MPESA' || ['TILL_NUMBER', 'PAYBILL', 'POCHI_LA_BIASHARA', 'SEND_MONEY'].includes(pm.type)) {
      setWizardEditingMethod(pm);
      setIsWizardOpen(true);
      return;
    }

    setEditingMethod(pm);
    setName(pm.name);
    setType(pm.type);

    let prov: ProviderChoice = 'SAFARICOM_MPESA';
    if (pm.type === 'STRIPE' || pm.provider === 'STRIPE') prov = 'STRIPE';
    else if (pm.type === 'PAYPAL' || pm.provider === 'PAYPAL') prov = 'PAYPAL';
    else if (pm.type === 'FLUTTERWAVE' || pm.provider === 'FLUTTERWAVE') prov = 'FLUTTERWAVE';
    else if (pm.type === 'PESAPAL' || pm.provider === 'PESAPAL') prov = 'PESAPAL';

    setSelectedProvider(prov);
    setShortcodeOrNumber(pm.shortcodeOrNumber || '');
    setAccountNumber(pm.accountNumber || '');
    setPasskey(pm.passkey || '');
    setConsumerKey(pm.consumerKey || '');
    setConsumerSecret(pm.consumerSecret || '');
    setInitiatorName(pm.initiatorName || '');
    setSecurityCredential(pm.securityCredential || '');
    setCallbackUrl(pm.callbackUrl || 'https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/stkpush/callback');
    setValidationUrl(pm.validationUrl || 'https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/c2b/validation');
    setConfirmationUrl(pm.confirmationUrl || 'https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/c2b/confirmation');
    setQueueTimeoutUrl(pm.queueTimeoutUrl || 'https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/b2c/timeout');
    setResultUrl(pm.resultUrl || 'https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/b2c/result');
    setB2cCommandId(pm.b2cCommandId || 'BusinessPayment');
    setB2bCommandId(pm.b2bCommandId || 'BusinessPayBill');
    setResponseType(pm.responseType || 'Completed');
    setEnableB2c(Boolean(pm.enableB2c || pm.b2cReady));
    setEnableB2b(Boolean(pm.enableB2b));
    setEnableReversal(Boolean(pm.enableReversal));
    setEnableStatusQuery(Boolean(pm.enableStatusQuery));
    setEnableAccountBalance(Boolean(pm.enableAccountBalance));

    setStripePublishableKey(pm.stripePublishableKey || '');
    setStripeSecretKey(pm.stripeSecretKey || '');
    setStripeWebhookSecret(pm.stripeWebhookSecret || '');

    setPaypalClientId(pm.paypalClientId || '');
    setPaypalClientSecret(pm.paypalClientSecret || '');

    setFlutterwavePublicKey(pm.flutterwavePublicKey || '');
    setFlutterwaveSecretKey(pm.flutterwaveSecretKey || '');
    setFlutterwaveEncryptionKey(pm.flutterwaveEncryptionKey || '');

    setPesapalConsumerKey(pm.pesapalConsumerKey || '');
    setPesapalConsumerSecret(pm.pesapalConsumerSecret || '');

    setEnvironment(pm.environment || 'SANDBOX');
    setBranchId(pm.branchId || '');
    setIsDefault(pm.isDefault);
    setNotes(pm.notes || '');
    setErrorMsg('');
    setShowSecrets(false);
    setGatewayResult(null);
    setIsModalOpen(true);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunTestLab = async () => {
    setTestRunning(true);
    setTestResultLog(null);

    const pm = testLabTargetPm || paymentMethods.find((p) => p.provider === 'SAFARICOM_MPESA' || p.gatewayCategory === 'MPESA') || paymentMethods[0];

    try {
      let endpoint = '';
      let body: any = {};

      if (activeTestTab === 'STK_PUSH') {
        endpoint = '/api/stkpush';
        body = {
          phoneNumber: testPhone,
          amount: parseFloat(testAmount) || 10,
          accountReference: testBillRef,
          transactionDesc: testRemarks,
          paymentMethodId: pm?.id,
        };
      } else if (activeTestTab === 'C2B') {
        endpoint = '/api/c2b/simulate';
        body = {
          shortCode: pm?.shortcodeOrNumber || '600982',
          commandID: 'CustomerPayBillOnline',
          amount: parseFloat(testAmount) || 10,
          msisdn: testPhone,
          billRefNumber: testBillRef,
          paymentMethodId: pm?.id,
        };
      } else if (activeTestTab === 'B2C') {
        endpoint = '/api/b2c/payout';
        body = {
          phoneNumber: testPhone,
          amount: parseFloat(testAmount) || 10,
          remarks: testRemarks,
          commandID: pm?.b2cCommandId || 'BusinessPayment',
          paymentMethodId: pm?.id,
        };
      } else if (activeTestTab === 'B2B') {
        endpoint = '/api/b2b/transfer';
        body = {
          receiverShortCode: testReceiverShortcode,
          amount: parseFloat(testAmount) || 100,
          remarks: testRemarks,
          accountReference: testBillRef,
          commandID: pm?.b2bCommandId || 'BusinessPayBill',
          paymentMethodId: pm?.id,
        };
      } else if (activeTestTab === 'TRANSACTION_STATUS') {
        endpoint = '/api/daraja/transaction-status';
        body = {
          mpesaReceiptNumber: testMpesaReceipt,
          remarks: testRemarks,
          paymentMethodId: pm?.id,
        };
      } else if (activeTestTab === 'REVERSAL') {
        endpoint = '/api/daraja/reversal';
        body = {
          transactionID: testMpesaReceipt,
          amount: parseFloat(testAmount) || 10,
          remarks: testRemarks,
          paymentMethodId: pm?.id,
        };
      } else if (activeTestTab === 'ACCOUNT_BALANCE') {
        endpoint = '/api/daraja/account-balance';
        body = {
          remarks: testRemarks,
          paymentMethodId: pm?.id,
        };
      } else if (activeTestTab === 'REGISTER_URLS') {
        endpoint = '/api/daraja/register-c2b-urls';
        body = {
          shortCode: pm?.shortcodeOrNumber || '600982',
          confirmationUrl: pm?.confirmationUrl || 'https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/c2b/confirmation',
          validationUrl: pm?.validationUrl || 'https://ais-dev-k6isovulwhkhbyepvroai5-9288613014.europe-west3.run.app/api/c2b/validation',
          responseType: pm?.responseType || 'Completed',
          paymentMethodId: pm?.id,
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setTestResultLog({
        status: res.status,
        ok: res.ok,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      setTestResultLog({
        status: 500,
        ok: false,
        error: err?.message || 'Failed to connect to Daraja endpoint.',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setTestRunning(false);
    }
  };

  const handleTestConnection = async () => {
    setErrorMsg('');
    setTestingGateway(true);
    setGatewayResult(null);

    try {
      if (selectedProvider === 'SAFARICOM_MPESA') {
        if (!shortcodeOrNumber.trim()) {
          setErrorMsg('Please enter a shortcode or till number.');
          setTestingGateway(false);
          return;
        }
        const res = await fetch('/api/daraja/validate-integration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consumerKey,
            consumerSecret,
            passkey,
            shortcodeOrNumber,
            initiatorName,
            securityCredential,
            callbackUrl,
            environment,
            type,
            paymentMethodId: editingMethod?.id,
          }),
        });
        const data = await res.json();
        setGatewayResult({
          success: Boolean(data.success),
          message: data.message || 'M-PESA validation process completed.',
          token: data.oauthToken,
          steps: data.steps,
        });
      } else {
        // Global Gateways client validation check
        let credentialsPayload: any = {};
        if (selectedProvider === 'STRIPE') {
          credentialsPayload = { publishableKey: stripePublishableKey, secretKey: stripeSecretKey, webhookSecret: stripeWebhookSecret };
        } else if (selectedProvider === 'PAYPAL') {
          credentialsPayload = { clientId: paypalClientId, clientSecret: paypalClientSecret };
        } else if (selectedProvider === 'FLUTTERWAVE') {
          credentialsPayload = { publicKey: flutterwavePublicKey, secretKey: flutterwaveSecretKey };
        } else if (selectedProvider === 'PESAPAL') {
          credentialsPayload = { consumerKey: pesapalConsumerKey, consumerSecret: pesapalConsumerSecret };
        }

        const clientVal = validateGatewayCredentials(selectedProvider as any, credentialsPayload);
        if (!clientVal.isValid) {
          setErrorMsg(clientVal.errors.join(' '));
          setTestingGateway(false);
          return;
        }

        const res = await fetch('/api/gateways/validate-credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: selectedProvider,
            credentials: credentialsPayload,
          }),
        });
        const data = await res.json();
        setGatewayResult({
          success: Boolean(data.success),
          message: data.message || `${selectedProvider} validation completed.`,
          steps: data.steps,
        });
      }
    } catch (err: any) {
      setGatewayResult({
        success: false,
        message: 'Network error communicating with gateway validator.',
      });
    } finally {
      setTestingGateway(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter a descriptive name for this payment gateway.');
      return;
    }

    // Validate provider specific credentials strictly
    if (selectedProvider === 'SAFARICOM_MPESA') {
      const validationErrors: string[] = [];

      if (!shortcodeOrNumber.trim()) {
        validationErrors.push('Shortcode, Till Number, or Phone Line is required.');
      } else {
        const cleaned = shortcodeOrNumber.trim().replace(/\s+/g, '');
        if (type === 'TILL_NUMBER' || type === 'PAYBILL') {
          if (!/^\d{4,8}$/.test(cleaned)) {
            validationErrors.push('Till/PayBill Shortcode must be numeric (4 to 8 digits).');
          }
        }
      }

      if (!consumerKey.trim() || consumerKey.trim().length < 6) {
        validationErrors.push('Consumer Key is required (min 6 characters).');
      }

      if (!consumerSecret.trim() || consumerSecret.trim().length < 6) {
        validationErrors.push('Consumer Secret is required (min 6 characters).');
      }

      if (type === 'TILL_NUMBER' || type === 'PAYBILL') {
        if (!passkey.trim() || passkey.trim().length < 10) {
          validationErrors.push('Lipa Na M-PESA Online Passkey is required for Till / PayBill STK Push.');
        }
        if (!validationUrl.trim() || (!validationUrl.startsWith('http://') && !validationUrl.startsWith('https://'))) {
          validationErrors.push('Valid C2B Validation URL (HTTPS/HTTP) is required.');
        }
        if (!confirmationUrl.trim() || (!confirmationUrl.startsWith('http://') && !confirmationUrl.startsWith('https://'))) {
          validationErrors.push('Valid C2B Confirmation URL (HTTPS/HTTP) is required.');
        }
      }

      if (!callbackUrl.trim() || (!callbackUrl.startsWith('http://') && !callbackUrl.startsWith('https://'))) {
        validationErrors.push('Valid Webhook Callback Receiver URL (HTTPS/HTTP) is required.');
      }

      if (enableB2c || enableB2b || enableReversal || enableStatusQuery || enableAccountBalance) {
        if (!initiatorName.trim()) {
          validationErrors.push('Initiator Name is required for B2C/B2B/Reversal/Status/Balance.');
        }
        if (!securityCredential.trim()) {
          validationErrors.push('Security Credential is required for B2C/B2B/Reversal/Status/Balance.');
        }
        if (!queueTimeoutUrl.trim() || (!queueTimeoutUrl.startsWith('http://') && !queueTimeoutUrl.startsWith('https://'))) {
          validationErrors.push('Valid Queue Timeout URL (HTTPS/HTTP) is required.');
        }
        if (!resultUrl.trim() || (!resultUrl.startsWith('http://') && !resultUrl.startsWith('https://'))) {
          validationErrors.push('Valid Result URL (HTTPS/HTTP) is required.');
        }
      }

      if (validationErrors.length > 0) {
        setErrorMsg('Validation Failed: ' + validationErrors.join(' | '));
        return;
      }
    } else if (selectedProvider === 'STRIPE') {
      const val = validateGatewayCredentials('STRIPE', { publishableKey: stripePublishableKey, secretKey: stripeSecretKey, webhookSecret: stripeWebhookSecret });
      if (!val.isValid) {
        setErrorMsg(val.errors.join(' '));
        return;
      }
    } else if (selectedProvider === 'PAYPAL') {
      const val = validateGatewayCredentials('PAYPAL', { clientId: paypalClientId, clientSecret: paypalClientSecret });
      if (!val.isValid) {
        setErrorMsg(val.errors.join(' '));
        return;
      }
    } else if (selectedProvider === 'FLUTTERWAVE') {
      const val = validateGatewayCredentials('FLUTTERWAVE', { publicKey: flutterwavePublicKey, secretKey: flutterwaveSecretKey });
      if (!val.isValid) {
        setErrorMsg(val.errors.join(' '));
        return;
      }
    } else if (selectedProvider === 'PESAPAL') {
      const val = validateGatewayCredentials('PESAPAL', { consumerKey: pesapalConsumerKey, consumerSecret: pesapalConsumerSecret });
      if (!val.isValid) {
        setErrorMsg(val.errors.join(' '));
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Encrypt sensitive secrets before persisting
      const encryptedStripeSecret = stripeSecretKey ? encryptApiKey(stripeSecretKey).cipherText : undefined;
      const encryptedPaypalSecret = paypalClientSecret ? encryptApiKey(paypalClientSecret).cipherText : undefined;
      const encryptedFlwSecret = flutterwaveSecretKey ? encryptApiKey(flutterwaveSecretKey).cipherText : undefined;
      const encryptedPesapalSecret = pesapalConsumerSecret ? encryptApiKey(pesapalConsumerSecret).cipherText : undefined;

      const payload: Partial<PaymentMethodConfig> = {
        name: name.trim(),
        type: selectedProvider === 'STRIPE' ? 'STRIPE' : selectedProvider === 'PAYPAL' ? 'PAYPAL' : selectedProvider === 'FLUTTERWAVE' ? 'FLUTTERWAVE' : selectedProvider === 'PESAPAL' ? 'PESAPAL' : type,
        provider: selectedProvider,
        gatewayCategory: selectedProvider === 'SAFARICOM_MPESA' ? 'MPESA' : 'GLOBAL_GATEWAY',
        shortcodeOrNumber: selectedProvider === 'SAFARICOM_MPESA' ? shortcodeOrNumber.trim() : (stripePublishableKey || paypalClientId || flutterwavePublicKey || pesapalConsumerKey || 'GLOBAL_GW').trim(),
        accountNumber: accountNumber.trim(),
        
        // M-PESA
        passkey: passkey.trim(),
        consumerKey: consumerKey.trim(),
        consumerSecret: consumerSecret.trim(),
        initiatorName: initiatorName.trim(),
        securityCredential: securityCredential.trim(),
        callbackUrl: callbackUrl.trim(),
        validationUrl: validationUrl.trim(),
        confirmationUrl: confirmationUrl.trim(),
        queueTimeoutUrl: queueTimeoutUrl.trim(),
        resultUrl: resultUrl.trim(),
        b2cCommandId,
        b2bCommandId,
        responseType,
        enableB2c,
        enableB2b,
        enableReversal,
        enableStatusQuery,
        enableAccountBalance,

        // Stripe
        stripePublishableKey: stripePublishableKey.trim(),
        stripeSecretKey: encryptedStripeSecret,
        stripeWebhookSecret: stripeWebhookSecret.trim(),

        // PayPal
        paypalClientId: paypalClientId.trim(),
        paypalClientSecret: encryptedPaypalSecret,
        paypalMode: environment === 'PRODUCTION' ? 'live' : 'sandbox',

        // Flutterwave
        flutterwavePublicKey: flutterwavePublicKey.trim(),
        flutterwaveSecretKey: encryptedFlwSecret,
        flutterwaveEncryptionKey: flutterwaveEncryptionKey.trim(),

        // Pesapal
        pesapalConsumerKey: pesapalConsumerKey.trim(),
        pesapalConsumerSecret: encryptedPesapalSecret,

        isEncrypted: true,
        encryptionAlgorithm: 'AES-256-GCM',
        environment,
        darajaStatus: 'VERIFIED',
        branchId: branchId || undefined,
        isDefault,
        notes: notes.trim(),
        status: 'ACTIVE',
      };

      if (editingMethod) {
        await onUpdatePaymentMethod(editingMethod.id, payload);
        setToastFeedback({
          type: 'success',
          message: `Gateway "${name}" updated successfully with AES-256 encrypted storage!`,
        });
      } else {
        await onAddPaymentMethod(payload);
        setToastFeedback({
          type: 'success',
          message: `New gateway "${name}" configured and encrypted securely!`,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save payment gateway.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMethods = paymentMethods.filter((pm) => {
    let matchesTab = true;
    if (activeTab === 'MPESA') {
      matchesTab = ['TILL_NUMBER', 'PAYBILL', 'POCHI_LA_BIASHARA', 'SEND_MONEY', 'BANK'].includes(pm.type) || pm.provider === 'SAFARICOM_MPESA';
    } else if (activeTab === 'GLOBAL_GATEWAYS') {
      matchesTab = ['STRIPE', 'PAYPAL', 'FLUTTERWAVE', 'PESAPAL', 'CARD_GATEWAY'].includes(pm.type) || pm.gatewayCategory === 'GLOBAL_GATEWAY';
    } else if (activeTab !== 'ALL') {
      matchesTab = pm.type === activeTab;
    }

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      pm.name.toLowerCase().includes(searchLower) ||
      pm.shortcodeOrNumber.includes(searchLower) ||
      (pm.provider && pm.provider.toLowerCase().includes(searchLower)) ||
      (pm.stripePublishableKey && pm.stripePublishableKey.toLowerCase().includes(searchLower)) ||
      (pm.paypalClientId && pm.paypalClientId.toLowerCase().includes(searchLower));

    return matchesTab && matchesSearch;
  });

  const getMethodBadge = (mType: MpesaPaymentMethodType, provider?: string) => {
    switch (mType) {
      case 'STRIPE':
        return {
          label: 'Stripe API Gateway',
          icon: Globe,
          bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        };
      case 'PAYPAL':
        return {
          label: 'PayPal REST API',
          icon: DollarSign,
          bg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
        };
      case 'FLUTTERWAVE':
        return {
          label: 'Flutterwave Gateway',
          icon: Zap,
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        };
      case 'PESAPAL':
        return {
          label: 'Pesapal v3 Gateway',
          icon: Layers,
          bg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
        };
      case 'TILL_NUMBER':
        return {
          label: 'Buy Goods (Till)',
          icon: Store,
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        };
      case 'PAYBILL':
        return {
          label: 'PayBill Shortcode',
          icon: Building2,
          bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        };
      case 'POCHI_LA_BIASHARA':
        return {
          label: 'Pochi la Biashara',
          icon: Smartphone,
          bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
        };
      case 'SEND_MONEY':
        return {
          label: 'Send Money Line',
          icon: Send,
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        };
      default:
        return {
          label: provider || mType,
          icon: CreditCard,
          bg: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
        };
    }
  };

  const mpesaCount = paymentMethods.filter(
    (m) => ['TILL_NUMBER', 'PAYBILL', 'POCHI_LA_BIASHARA', 'SEND_MONEY'].includes(m.type) || m.provider === 'SAFARICOM_MPESA'
  ).length;

  const globalCount = paymentMethods.filter(
    (m) => ['STRIPE', 'PAYPAL', 'FLUTTERWAVE', 'PESAPAL', 'CARD_GATEWAY'].includes(m.type) || m.gatewayCategory === 'GLOBAL_GATEWAY'
  ).length;

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback Banner */}
      {toastFeedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold transition ${
            toastFeedback.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
            )}
            <span>{toastFeedback.message}</span>
          </div>
          <button onClick={() => setToastFeedback(null)} className="p-1 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-emerald-500" />
            Payment Collection Methods & Global Gateways
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage M-PESA Till/Paybills alongside Stripe, PayPal, Flutterwave & Pesapal API credentials with bank-grade AES-256 encrypted storage.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setTestLabTargetPm(paymentMethods.find((p) => p.provider === 'SAFARICOM_MPESA') || null);
              setIsTestLabOpen(true);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>🧪 Daraja Test Lab</span>
          </button>

          <button
            onClick={() => openAddModal('SAFARICOM_MPESA')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add M-PESA Channel</span>
          </button>

          <button
            onClick={() => openAddModal('STRIPE')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>Add Global Gateway</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            title: 'M-PESA Channels',
            count: mpesaCount,
            icon: Store,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
          },
          {
            title: 'Global API Gateways',
            count: globalCount,
            icon: Globe,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10 border-indigo-500/20',
          },
          {
            title: 'AES-256 Encrypted',
            count: paymentMethods.length,
            icon: Lock,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10 border-purple-500/20',
          },
          {
            title: 'Active Gateways',
            count: paymentMethods.filter((m) => m.status === 'ACTIVE').length,
            icon: CheckCircle,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10 border-blue-500/20',
          },
        ].map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className={`p-4 rounded-2xl border ${s.bg} flex items-center justify-between`}>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">{s.title}</span>
                <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">{s.count}</span>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm ${s.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'All Methods' },
            { id: 'MPESA', label: 'M-PESA Channels' },
            { id: 'GLOBAL_GATEWAYS', label: 'Global Gateways (Stripe/PayPal)' },
            { id: 'TILL_NUMBER', label: 'Buy Goods (Till)' },
            { id: 'PAYBILL', label: 'PayBills' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search gateway name or key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMethods.map((pm) => {
          const badge = getMethodBadge(pm.type, pm.provider);
          const BadgeIcon = badge.icon;
          const branch = branches.find((b) => b.id === pm.branchId);

          return (
            <div
              key={pm.id}
              className={`relative rounded-3xl p-6 bg-white dark:bg-slate-900 border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between ${
                pm.isDefault
                  ? 'border-emerald-500/50 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Card Header & Badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={`px-2.5 py-1 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 ${badge.bg}`}>
                    <BadgeIcon className="w-3.5 h-3.5" />
                    <span>{badge.label}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-[9px] font-extrabold flex items-center gap-1 uppercase">
                      <Lock className="w-3 h-3" /> AES-256
                    </span>
                    {pm.isDefault && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold flex items-center gap-1 uppercase tracking-wider">
                        <Star className="w-3 h-3 fill-white" /> Primary
                      </span>
                    )}
                  </div>
                </div>

                {/* Method Title */}
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">{pm.name}</h3>
                {branch && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Assigned Branch: {branch.name}</p>}

                {/* Key / Shortcode Display Block */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  {pm.type === 'STRIPE' && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Publishable Key:</span>
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {maskSecretKey(pm.stripePublishableKey || pm.shortcodeOrNumber)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Secret Key:</span>
                        <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-purple-500" />
                          {maskSecretKey(pm.stripeSecretKey || 'sk_live_enc')}
                        </span>
                      </div>
                    </>
                  )}

                  {pm.type === 'PAYPAL' && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Client ID:</span>
                        <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                          {maskSecretKey(pm.paypalClientId || pm.shortcodeOrNumber)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Client Secret:</span>
                        <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-purple-500" />
                          {maskSecretKey(pm.paypalClientSecret || 'enc_paypal')}
                        </span>
                      </div>
                    </>
                  )}

                  {pm.type === 'FLUTTERWAVE' && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Public Key:</span>
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          {maskSecretKey(pm.flutterwavePublicKey || pm.shortcodeOrNumber)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Secret Key:</span>
                        <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-purple-500" />
                          {maskSecretKey(pm.flutterwaveSecretKey || 'enc_flw')}
                        </span>
                      </div>
                    </>
                  )}

                  {pm.type === 'PESAPAL' && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Consumer Key:</span>
                        <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                          {maskSecretKey(pm.pesapalConsumerKey || pm.shortcodeOrNumber)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Consumer Secret:</span>
                        <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-purple-500" />
                          {maskSecretKey(pm.pesapalConsumerSecret || 'enc_pesapal')}
                        </span>
                      </div>
                    </>
                  )}

                  {!['STRIPE', 'PAYPAL', 'FLUTTERWAVE', 'PESAPAL'].includes(pm.type) && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">
                        {pm.type === 'TILL_NUMBER'
                          ? 'Till Number:'
                          : pm.type === 'PAYBILL'
                          ? 'PayBill Shortcode:'
                          : 'Phone Number:'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {pm.shortcodeOrNumber}
                        </span>
                        <button
                          onClick={() => handleCopy(pm.id, pm.shortcodeOrNumber)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                          title="Copy Number"
                        >
                          {copiedId === pm.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Metadata info */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Gateway Verification:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        {pm.darajaStatus || 'VERIFIED'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Environment Mode:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                        {pm.environment || 'SANDBOX'}
                      </span>
                    </div>
                  </div>

                  {pm.notes && <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 italic">{pm.notes}</p>}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {!pm.isDefault ? (
                  <button
                    onClick={() => onSetDefaultPaymentMethod(pm.id)}
                    className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-500 flex items-center gap-1 transition"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Set Primary</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Primary Gateway
                  </span>
                )}

                <div className="flex items-center gap-1">
                  {(pm.provider === 'SAFARICOM_MPESA' || pm.gatewayCategory === 'MPESA') && (
                    <button
                      onClick={() => {
                        setTestLabTargetPm(pm);
                        setIsTestLabOpen(true);
                      }}
                      className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                      title="Run Daraja 11-Service Operations Test Lab"
                    >
                      <Terminal className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() =>
                      onUpdatePaymentMethod(pm.id, {
                        status: pm.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                      })
                    }
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title={pm.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  >
                    {pm.status === 'ACTIVE' ? (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(pm)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Edit Credentials"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingMethod(pm);
                      setDeleteError('');
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Delete Method"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredMethods.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No payment gateways configured</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Add M-PESA Till Numbers, PayBills, or Global Gateways (Stripe, PayPal, Flutterwave, Pesapal).
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => openAddModal('SAFARICOM_MPESA')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Add M-PESA Method
              </button>
              <button
                onClick={() => openAddModal('STRIPE')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Add Global Gateway
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="relative w-full max-w-xl max-h-[90vh] my-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 overflow-y-auto text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingMethod ? 'Edit Payment Gateway' : 'Add New Payment Gateway'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure M-PESA or Global Payment Gateways with encrypted storage.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Provider Selector Tabs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Gateway Provider <span className="text-emerald-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'SAFARICOM_MPESA', label: 'Safaricom M-PESA', color: 'border-emerald-500 text-emerald-600' },
                    { id: 'STRIPE', label: 'Stripe API', color: 'border-indigo-500 text-indigo-600' },
                    { id: 'PAYPAL', label: 'PayPal REST', color: 'border-sky-500 text-sky-600' },
                    { id: 'FLUTTERWAVE', label: 'Flutterwave', color: 'border-amber-500 text-amber-600' },
                    { id: 'PESAPAL', label: 'Pesapal v3', color: 'border-teal-500 text-teal-600' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProvider(p.id as ProviderChoice);
                        if (p.id === 'STRIPE') {
                          setType('STRIPE');
                          if (!name || name === 'Main HQ Till') setName('Stripe USD Checkout');
                        } else if (p.id === 'PAYPAL') {
                          setType('PAYPAL');
                          if (!name || name === 'Main HQ Till') setName('PayPal Express Checkout');
                        } else if (p.id === 'FLUTTERWAVE') {
                          setType('FLUTTERWAVE');
                          if (!name || name === 'Main HQ Till') setName('Flutterwave Channel');
                        } else if (p.id === 'PESAPAL') {
                          setType('PESAPAL');
                          if (!name || name === 'Main HQ Till') setName('Pesapal Channel');
                        } else {
                          setType('TILL_NUMBER');
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        selectedProvider === p.id
                          ? `bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm`
                          : `bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100`
                      }`}
                    >
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gateway Display Title <span className="text-emerald-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Main HQ Till, Stripe USD Gateway, PayPal Web Express"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* M-PESA Specific Credentials & Configuration Fields */}
              {selectedProvider === 'SAFARICOM_MPESA' && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      M-PESA Channel Type <span className="text-emerald-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'TILL_NUMBER', label: 'Buy Goods (Till)', icon: Store },
                        { id: 'PAYBILL', label: 'PayBill Number', icon: Building2 },
                        { id: 'POCHI_LA_BIASHARA', label: 'Pochi la Biashara', icon: Smartphone },
                        { id: 'SEND_MONEY', label: 'Send Money Line', icon: Send },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSel = type === item.id;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => setType(item.id as MpesaPaymentMethodType)}
                            className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition ${
                              isSel
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="text-[11px] leading-tight">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {type === 'TILL_NUMBER'
                          ? 'Buy Goods Till Number'
                          : type === 'PAYBILL'
                          ? 'PayBill Shortcode'
                          : 'Phone Line / MSISDN'}{' '}
                        <span className="text-emerald-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shortcodeOrNumber}
                        onChange={(e) => setShortcodeOrNumber(e.target.value)}
                        placeholder={
                          type === 'TILL_NUMBER'
                            ? 'e.g. 174379'
                            : type === 'PAYBILL'
                            ? 'e.g. 522522'
                            : 'e.g. 0712345678'
                        }
                        required
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 outline-none"
                      />
                    </div>

                    {type === 'PAYBILL' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Account Reference Pattern
                        </label>
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="e.g. INV-001 or ACC-XYZ"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Safaricom Daraja OAuth Credentials */}
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-emerald-500" />
                        Safaricom Daraja OAuth 2.0 Credentials
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold">
                        AES-256 Vault Guard
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Consumer Key <span className="text-emerald-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={consumerKey}
                          onChange={(e) => setConsumerKey(e.target.value)}
                          placeholder="Safaricom App Consumer Key"
                          required
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            Consumer Secret <span className="text-emerald-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowSecrets(!showSecrets)}
                            className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                          >
                            {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showSecrets ? 'Hide' : 'Reveal'}</span>
                          </button>
                        </div>
                        <input
                          type={showSecrets ? 'text' : 'password'}
                          value={consumerSecret}
                          onChange={(e) => setConsumerSecret(e.target.value)}
                          placeholder="Safaricom App Consumer Secret"
                          required
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                        />
                      </div>
                    </div>

                    {(type === 'TILL_NUMBER' || type === 'PAYBILL') && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            Lipa Na M-PESA Online Passkey <span className="text-emerald-500">*</span>
                          </label>
                          <span className="text-[10px] text-slate-400">Required for STK Push Express</span>
                        </div>
                        <input
                          type={showSecrets ? 'text' : 'password'}
                          value={passkey}
                          onChange={(e) => setPasskey(e.target.value)}
                          placeholder="bfb279f9aa9bdbcf158e97dd71a467cd..."
                          required={type === 'TILL_NUMBER' || type === 'PAYBILL'}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Webhook & Callback Receiver URLs */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Server className="w-4 h-4 text-emerald-500" />
                        Daraja Webhook Callback Receiver URLs
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">HTTPS Endpoints Required</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Webhook Callback Receiver URL <span className="text-emerald-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={callbackUrl}
                          onChange={(e) => setCallbackUrl(e.target.value)}
                          placeholder="https://yourdomain.com/api/stkpush/callback"
                          required
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-emerald-600 dark:text-emerald-400 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy('cb_url', callbackUrl)}
                          className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          {copiedId === 'cb_url' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {(type === 'TILL_NUMBER' || type === 'PAYBILL') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            C2B Validation URL <span className="text-emerald-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={validationUrl}
                            onChange={(e) => setValidationUrl(e.target.value)}
                            placeholder="https://.../api/c2b/validation"
                            required
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            C2B Confirmation URL <span className="text-emerald-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={confirmationUrl}
                            onChange={(e) => setConfirmationUrl(e.target.value)}
                            placeholder="https://.../api/c2b/confirmation"
                            required
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Advanced Daraja Operations Accordion */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedMpesa(!showAdvancedMpesa)}
                      className="w-full flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-emerald-500" />
                        Advanced Services (B2C, B2B, Reversal, Status, Account Balance)
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 underline">
                        {showAdvancedMpesa ? 'Hide Controls' : 'Configure Advanced Capabilities'}
                      </span>
                    </button>

                    {showAdvancedMpesa && (
                      <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 text-xs font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={enableB2c}
                              onChange={(e) => setEnableB2c(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>B2C Disbursements</span>
                          </label>

                          <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 text-xs font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={enableB2b}
                              onChange={(e) => setEnableB2b(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>B2B Transfers</span>
                          </label>

                          <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 text-xs font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={enableReversal}
                              onChange={(e) => setEnableReversal(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Reversals Engine</span>
                          </label>

                          <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 text-xs font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={enableStatusQuery}
                              onChange={(e) => setEnableStatusQuery(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Status Queries</span>
                          </label>

                          <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 text-xs font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={enableAccountBalance}
                              onChange={(e) => setEnableAccountBalance(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Account Balance</span>
                          </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Initiator Name <span className="text-emerald-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={initiatorName}
                              onChange={(e) => setInitiatorName(e.target.value)}
                              placeholder="e.g. pesa_initiator"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Security Credential <span className="text-emerald-500">*</span>
                            </label>
                            <input
                              type={showSecrets ? 'text' : 'password'}
                              value={securityCredential}
                              onChange={(e) => setSecurityCredential(e.target.value)}
                              placeholder="Encrypted Security Credential Password"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Queue Timeout URL
                            </label>
                            <input
                              type="text"
                              value={queueTimeoutUrl}
                              onChange={(e) => setQueueTimeoutUrl(e.target.value)}
                              placeholder="https://.../api/b2c/timeout"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Result URL
                            </label>
                            <input
                              type="text"
                              value={resultUrl}
                              onChange={(e) => setResultUrl(e.target.value)}
                              placeholder="https://.../api/b2c/result"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              B2C Command ID
                            </label>
                            <select
                              value={b2cCommandId}
                              onChange={(e) => setB2cCommandId(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                            >
                              <option value="BusinessPayment">BusinessPayment (Standard Payout)</option>
                              <option value="SalaryPayment">SalaryPayment (Payroll Disbursements)</option>
                              <option value="PromotionPayment">PromotionPayment (Rewards & Cashbacks)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              B2B Command ID
                            </label>
                            <select
                              value={b2bCommandId}
                              onChange={(e) => setB2bCommandId(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                            >
                              <option value="BusinessPayBill">BusinessPayBill (PayBill Transfer)</option>
                              <option value="BusinessBuyGoods">BusinessBuyGoods (Till Settlement)</option>
                              <option value="DisburseFundsToBusiness">DisburseFundsToBusiness (Corporate Transfer)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stripe Form Fields */}
              {selectedProvider === 'STRIPE' && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-indigo-500" />
                      Stripe API Keys (Card, Apple Pay, Google Pay)
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-mono font-bold">
                      AES-256 Encrypted
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Publishable Key (`pk_test_...` or `pk_live_...`) <span className="text-indigo-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={stripePublishableKey}
                      onChange={(e) => setStripePublishableKey(e.target.value)}
                      placeholder="pk_test_51M..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Secret Key (`sk_test_...` or `sk_live_...`) <span className="text-indigo-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSecrets(!showSecrets)}
                        className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center gap-1"
                      >
                        {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showSecrets ? 'Hide' : 'Reveal'}</span>
                      </button>
                    </div>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={stripeSecretKey}
                      onChange={(e) => setStripeSecretKey(e.target.value)}
                      placeholder="sk_test_51M..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Webhook Signing Secret (`whsec_...`) [Optional]
                    </label>
                    <input
                      type="text"
                      value={stripeWebhookSecret}
                      onChange={(e) => setStripeWebhookSecret(e.target.value)}
                      placeholder="whsec_..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* PayPal Form Fields */}
              {selectedProvider === 'PAYPAL' && (
                <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-sky-500" />
                      PayPal REST API App Credentials
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-600 dark:text-sky-300 text-[10px] font-mono font-bold">
                      AES-256 Encrypted
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      PayPal Client ID <span className="text-sky-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={paypalClientId}
                      onChange={(e) => setPaypalClientId(e.target.value)}
                      placeholder="e.g. A21AAI_..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        PayPal Client Secret <span className="text-sky-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSecrets(!showSecrets)}
                        className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center gap-1"
                      >
                        {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showSecrets ? 'Hide' : 'Reveal'}</span>
                      </button>
                    </div>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={paypalClientSecret}
                      onChange={(e) => setPaypalClientSecret(e.target.value)}
                      placeholder="e.g. EGX..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Flutterwave Form Fields */}
              {selectedProvider === 'FLUTTERWAVE' && (
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Flutterwave API Credentials
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px] font-mono font-bold">
                      AES-256 Encrypted
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Public Key (`FLWPUBK_TEST-` or `FLWPUBK-`) <span className="text-amber-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={flutterwavePublicKey}
                      onChange={(e) => setFlutterwavePublicKey(e.target.value)}
                      placeholder="FLWPUBK_TEST-..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Secret Key (`FLWSECK_TEST-` or `FLWSECK-`) <span className="text-amber-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSecrets(!showSecrets)}
                        className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center gap-1"
                      >
                        {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showSecrets ? 'Hide' : 'Reveal'}</span>
                      </button>
                    </div>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={flutterwaveSecretKey}
                      onChange={(e) => setFlutterwaveSecretKey(e.target.value)}
                      placeholder="FLWSECK_TEST-..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Pesapal Form Fields */}
              {selectedProvider === 'PESAPAL' && (
                <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-teal-500" />
                      Pesapal v3 Consumer Credentials
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-600 dark:text-teal-300 text-[10px] font-mono font-bold">
                      AES-256 Encrypted
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Consumer Key <span className="text-teal-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={pesapalConsumerKey}
                        onChange={(e) => setPesapalConsumerKey(e.target.value)}
                        placeholder="Consumer Key"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Consumer Secret <span className="text-teal-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowSecrets(!showSecrets)}
                          className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center gap-1"
                        >
                          {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                      <input
                        type={showSecrets ? 'text' : 'password'}
                        value={pesapalConsumerSecret}
                        onChange={(e) => setPesapalConsumerSecret(e.target.value)}
                        placeholder="Consumer Secret"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Environment Toggle & Encryption Box */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Lock className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Environment Mode:</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-900 p-0.5 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setEnvironment('SANDBOX')}
                    className={`px-3 py-1 rounded-md transition ${
                      environment === 'SANDBOX'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Sandbox / Test
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnvironment('PRODUCTION')}
                    className={`px-3 py-1 rounded-md transition ${
                      environment === 'PRODUCTION'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Live Production
                  </button>
                </div>
              </div>

              {/* Validation & Test Connection Action */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingGateway}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{testingGateway ? 'Validating Connection...' : `Test & Validate ${selectedProvider} API`}</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">
                    AES-256-GCM Vault Guard Active
                  </span>
                </div>

                {gatewayResult && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold space-y-2 border ${
                      gatewayResult.success
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {gatewayResult.success ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                      <p>{gatewayResult.message}</p>
                    </div>
                    {gatewayResult.steps && gatewayResult.steps.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 space-y-1">
                        {gatewayResult.steps.map((st, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                            {st.passed ? (
                              <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                            ) : (
                              <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
                            )}
                            <span className={st.passed ? 'text-slate-700 dark:text-slate-300' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                              {st.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Set Primary Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isDefaultCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Set as Primary Default Gateway for online customer checkout
                </label>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30"
                >
                  {isSubmitting ? 'Saving Encrypted Gateway...' : editingMethod ? 'Update Gateway Credentials' : 'Save Encrypted Gateway'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Operations Test Lab Modal */}
      {isTestLabOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] my-auto bg-slate-900 text-slate-100 rounded-3xl shadow-2xl border border-slate-800 p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    M-PESA Daraja 11-Service Operations Test Lab
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                      LIVE ENVIRONMENT
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Test target gateway: <strong className="text-emerald-400">{testLabTargetPm?.name || 'Default Daraja Target'}</strong> ({testLabTargetPm?.shortcodeOrNumber || 'Shortcode'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTestLabOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Tabs */}
            <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
              {[
                { id: 'STK_PUSH', label: 'STK Push Express' },
                { id: 'C2B', label: 'C2B Simulate' },
                { id: 'B2C', label: 'B2C Payout' },
                { id: 'B2B', label: 'B2B Transfer' },
                { id: 'TRANSACTION_STATUS', label: 'Status Query' },
                { id: 'REVERSAL', label: 'Reversal' },
                { id: 'ACCOUNT_BALANCE', label: 'Account Balance' },
                { id: 'REGISTER_URLS', label: 'Register C2B URLs' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTestTab(tab.id as any);
                    setTestResultLog(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    activeTestTab === tab.id
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Form Inputs */}
            <div className="mt-4 space-y-4">
              {activeTestTab === 'STK_PUSH' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Payer Phone Number (MSISDN)</label>
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="e.g. 0712345678"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (KES)</label>
                    <input
                      type="number"
                      value={testAmount}
                      onChange={(e) => setTestAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Account Reference</label>
                    <input
                      type="text"
                      value={testBillRef}
                      onChange={(e) => setTestBillRef(e.target.value)}
                      placeholder="INV-001"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction Description</label>
                    <input
                      type="text"
                      value={testRemarks}
                      onChange={(e) => setTestRemarks(e.target.value)}
                      placeholder="Test STK Push"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none"
                    />
                  </div>
                </div>
              )}

              {activeTestTab === 'C2B' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Simulated Customer Phone</label>
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (KES)</label>
                    <input
                      type="number"
                      value={testAmount}
                      onChange={(e) => setTestAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Bill Reference Number</label>
                    <input
                      type="text"
                      value={testBillRef}
                      onChange={(e) => setTestBillRef(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 outline-none"
                    />
                  </div>
                </div>
              )}

              {activeTestTab === 'B2C' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Phone Number</label>
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Payout Amount (KES)</label>
                    <input
                      type="number"
                      value={testAmount}
                      onChange={(e) => setTestAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-white outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Remarks / Note</label>
                    <input
                      type="text"
                      value={testRemarks}
                      onChange={(e) => setTestRemarks(e.target.value)}
                      placeholder="Supplier Payment / Dividend"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none"
                    />
                  </div>
                </div>
              )}

              {activeTestTab === 'B2B' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Receiver Shortcode</label>
                    <input
                      type="text"
                      value={testReceiverShortcode}
                      onChange={(e) => setTestReceiverShortcode(e.target.value)}
                      placeholder="e.g. 600982"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (KES)</label>
                    <input
                      type="number"
                      value={testAmount}
                      onChange={(e) => setTestAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Account Reference</label>
                    <input
                      type="text"
                      value={testBillRef}
                      onChange={(e) => setTestBillRef(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 outline-none"
                    />
                  </div>
                </div>
              )}

              {(activeTestTab === 'TRANSACTION_STATUS' || activeTestTab === 'REVERSAL') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">M-PESA Receipt Number</label>
                    <input
                      type="text"
                      value={testMpesaReceipt}
                      onChange={(e) => setTestMpesaReceipt(e.target.value)}
                      placeholder="e.g. NLX8921021K"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 outline-none"
                    />
                  </div>
                  {activeTestTab === 'REVERSAL' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Reversal Amount (KES)</label>
                      <input
                        type="number"
                        value={testAmount}
                        onChange={(e) => setTestAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-white outline-none"
                      />
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Remarks</label>
                    <input
                      type="text"
                      value={testRemarks}
                      onChange={(e) => setTestRemarks(e.target.value)}
                      placeholder="Audit / Query"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none"
                    />
                  </div>
                </div>
              )}

              {activeTestTab === 'ACCOUNT_BALANCE' && (
                <div>
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    Executes Daraja Account Balance query for shortcode{' '}
                    <strong className="text-emerald-400 font-mono">{testLabTargetPm?.shortcodeOrNumber || 'Shortcode'}</strong>.
                    Results will be posted asynchronously to the registered Result URL.
                  </p>
                </div>
              )}

              {activeTestTab === 'REGISTER_URLS' && (
                <div>
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                    <div>Registers C2B Validation & Confirmation endpoints with Safaricom Daraja API:</div>
                    <div className="font-mono text-[11px] text-emerald-400">
                      Validation: {testLabTargetPm?.validationUrl || 'https://.../api/c2b/validation'}
                    </div>
                    <div className="font-mono text-[11px] text-emerald-400">
                      Confirmation: {testLabTargetPm?.confirmationUrl || 'https://.../api/c2b/confirmation'}
                    </div>
                  </p>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  OAuth 2.0 Auth Header Auto-Generated
                </span>

                <button
                  onClick={handleRunTestLab}
                  disabled={testRunning}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                >
                  {testRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Executing Request...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>Execute Daraja Request</span>
                    </>
                  )}
                </button>
              </div>

              {/* Execution Output Console */}
              {testResultLog && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      Response Log [{testResultLog.timestamp.slice(11, 19)}]
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        testResultLog.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      HTTP {testResultLog.status}
                    </span>
                  </div>

                  <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-48 leading-relaxed">
                    {JSON.stringify(testResultLog.data || testResultLog, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-slate-800 dark:text-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Payment Gateway</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{deletingMethod.name}</strong>?
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setDeletingMethod(null);
                  setDeleteError('');
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsDeleting(true);
                  setDeleteError('');
                  try {
                    await onDeletePaymentMethod(deletingMethod.id);
                    setToastFeedback({
                      type: 'success',
                      message: `Gateway "${deletingMethod.name}" deleted successfully.`,
                    });
                    setDeletingMethod(null);
                  } catch (err: any) {
                    setDeleteError(err?.message || 'Failed to delete gateway.');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-rose-900/20 flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Gateway'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* M-PESA Daraja Integration Wizard Modal */}
      <DarajaIntegrationWizardModal
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setWizardEditingMethod(null);
        }}
        branches={branches}
        editingMethod={wizardEditingMethod}
        onSavePaymentMethod={async (payload) => {
          if (wizardEditingMethod) {
            await onUpdatePaymentMethod(wizardEditingMethod.id, payload);
            setToastFeedback({
              type: 'success',
              message: `M-PESA channel "${payload.name || wizardEditingMethod.name}" updated & validated successfully!`,
            });
          } else {
            await onAddPaymentMethod(payload);
            setToastFeedback({
              type: 'success',
              message: `M-PESA channel "${payload.name}" created & activated successfully!`,
            });
          }
          setIsWizardOpen(false);
          setWizardEditingMethod(null);
        }}
      />
    </div>
  );
};
