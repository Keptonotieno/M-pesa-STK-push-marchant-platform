import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Send,
  Phone,
  Mail,
  Award,
  Calendar,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Settings,
  FileText,
  Check,
} from 'lucide-react';
import { Customer } from '../types';
import { saveCustomerToFirestore, deleteCustomerFromFirestore } from '../lib/firestoreService';

interface Props {
  customers: Customer[];
  onAddCustomer: (customer: Partial<Customer>) => void;
  onSendStkToCustomer: (customer: Customer) => void;
  onRefreshData: () => void;
}

interface ParsedRowValidation {
  rowIndex: number;
  raw: Record<string, string>;
  name: string;
  phone: string;
  email: string;
  category: 'NEW' | 'REGULAR' | 'VIP';
  isValid: boolean;
  errors: string[];
  selected: boolean;
}

// Helper: Parse raw CSV text respecting quotes and commas
function parseCSVContent(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

// Helper: Validate Kenyan M-PESA phone format
function validateKenyanPhone(phoneRaw: string): { valid: boolean; formatted: string; message?: string } {
  if (!phoneRaw) return { valid: false, formatted: '', message: 'Phone number is missing' };
  let cleaned = phoneRaw.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+254')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('254') && cleaned.length >= 12) {
    cleaned = '0' + cleaned.slice(3);
  }

  if (/^(07|01)\d{8}$/.test(cleaned)) {
    return { valid: true, formatted: cleaned };
  } else {
    return {
      valid: false,
      formatted: cleaned,
      message: `Invalid Kenyan phone format (${cleaned || 'empty'}). Must be 10 digits starting with 07 or 01`,
    };
  }
}

export const CustomersView: React.FC<Props> = ({
  customers,
  onAddCustomer,
  onSendStkToCustomer,
  onRefreshData,
}) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [category, setCategory] = useState<'NEW' | 'REGULAR' | 'VIP'>('NEW');

  // CSV Import Modal State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvStep, setCsvStep] = useState<'UPLOAD' | 'MAP_AND_PREVIEW'>('UPLOAD');
  const [rawCsvText, setRawCsvText] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);

  // Field Mapping state (CSV Header index -> Customer field)
  const [nameCol, setNameCol] = useState<number>(-1);
  const [phoneCol, setPhoneCol] = useState<number>(-1);
  const [emailCol, setEmailCol] = useState<number>(-1);
  const [categoryCol, setCategoryCol] = useState<number>(-1);

  const [validatedRows, setValidatedRows] = useState<ParsedRowValidation[]>([]);
  const [importing, setImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setCategory('NEW');
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setNewName(c.name);
    setNewPhone(c.phone);
    setNewEmail(c.email);
    setCategory(c.category);
    setShowAddModal(true);
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    if (editingCustomer) {
      try {
        const updatedCust = { ...editingCustomer, name: newName, phone: newPhone, email: newEmail, category };
        await saveCustomerToFirestore(updatedCust);
        await fetch(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName, phone: newPhone, email: newEmail, category }),
        });
        onRefreshData();
      } catch (err) {
        console.error('Failed to update customer:', err);
      }
    } else {
      onAddCustomer({ name: newName, phone: newPhone, email: newEmail });
    }

    setShowAddModal(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomerFromFirestore(id);
      await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      setDeletingId(null);
      onRefreshData();
    } catch (err) {
      console.error('Failed to delete customer:', err);
    }
  };

  // CSV Processing Handlers
  const handleOpenCsvModal = () => {
    setCsvStep('UPLOAD');
    setRawCsvText('');
    setCsvHeaders([]);
    setCsvRows([]);
    setValidatedRows([]);
    setImportFeedback(null);
    setShowCsvModal(true);
  };

  const downloadSampleCsv = () => {
    const csvContent =
      'Full Name,M-PESA Phone,Email Address,Category\n' +
      'Samuel Kimani,0712345678,samuel.kimani@gmail.com,VIP\n' +
      'Grace Wanjiku,0722001122,grace.wanjiku@yahoo.com,REGULAR\n' +
      'Peter Omondi,254733445566,peter.omondi@co.ke,NEW\n' +
      'Amina Hassan,0700998877,amina.hassan@domain.ke,VIP\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'PesaRequest_Customers_Sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        if (content) {
          processRawCsv(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const processRawCsv = (content: string) => {
    const { headers, rows } = parseCSVContent(content);
    if (headers.length === 0) {
      setImportFeedback({ type: 'error', message: 'CSV file is empty or formatted incorrectly.' });
      return;
    }

    setCsvHeaders(headers);
    setCsvRows(rows);

    // Auto-detect column mapping
    let autoName = -1;
    let autoPhone = -1;
    let autoEmail = -1;
    let autoCategory = -1;

    headers.forEach((h, idx) => {
      const lower = h.toLowerCase();
      if (autoName === -1 && (lower.includes('name') || lower.includes('customer') || lower.includes('client'))) {
        autoName = idx;
      }
      if (autoPhone === -1 && (lower.includes('phone') || lower.includes('mobile') || lower.includes('mpesa') || lower.includes('contact') || lower.includes('number'))) {
        autoPhone = idx;
      }
      if (autoEmail === -1 && (lower.includes('email') || lower.includes('mail'))) {
        autoEmail = idx;
      }
      if (autoCategory === -1 && (lower.includes('category') || lower.includes('tier') || lower.includes('type'))) {
        autoCategory = idx;
      }
    });

    setNameCol(autoName !== -1 ? autoName : 0);
    setPhoneCol(autoPhone !== -1 ? autoPhone : headers.length > 1 ? 1 : -1);
    setEmailCol(autoEmail);
    setCategoryCol(autoCategory);

    // Perform validation for parsed rows using auto-mapped columns
    validateAllRows(rows, headers, autoName !== -1 ? autoName : 0, autoPhone !== -1 ? autoPhone : headers.length > 1 ? 1 : -1, autoEmail, autoCategory);

    setCsvStep('MAP_AND_PREVIEW');
  };

  const validateAllRows = (
    rows: string[][],
    headers: string[],
    nCol: number,
    pCol: number,
    eCol: number,
    cCol: number
  ) => {
    const validated: ParsedRowValidation[] = rows.map((row, idx) => {
      const nameVal = nCol >= 0 && row[nCol] ? row[nCol].trim() : '';
      const phoneRaw = pCol >= 0 && row[pCol] ? row[pCol].trim() : '';
      const emailVal = eCol >= 0 && row[eCol] ? row[eCol].trim() : '';
      const categoryRaw = cCol >= 0 && row[cCol] ? row[cCol].trim().toUpperCase() : 'NEW';

      const errors: string[] = [];

      // Validate Name
      if (!nameVal || nameVal.length < 2) {
        errors.push('Customer name is missing or too short.');
      }

      // Validate Phone
      const phoneResult = validateKenyanPhone(phoneRaw);
      if (!phoneResult.valid) {
        errors.push(phoneResult.message || 'Invalid Kenyan phone format.');
      }

      // Validate Category
      const validCategory: 'NEW' | 'REGULAR' | 'VIP' = ['NEW', 'REGULAR', 'VIP'].includes(categoryRaw)
        ? (categoryRaw as any)
        : 'NEW';

      const rawRecord: Record<string, string> = {};
      headers.forEach((h, i) => {
        rawRecord[h] = row[i] || '';
      });

      const isValid = errors.length === 0;

      return {
        rowIndex: idx + 1,
        raw: rawRecord,
        name: nameVal,
        phone: phoneResult.formatted || phoneRaw,
        email: emailVal,
        category: validCategory,
        isValid,
        errors,
        selected: isValid,
      };
    });

    setValidatedRows(validated);
  };

  // Re-run validation when field mapping column changes
  const handleMappingChange = (target: 'name' | 'phone' | 'email' | 'category', colIdx: number) => {
    let newN = nameCol;
    let newP = phoneCol;
    let newE = emailCol;
    let newC = categoryCol;

    if (target === 'name') {
      newN = colIdx;
      setNameCol(colIdx);
    } else if (target === 'phone') {
      newP = colIdx;
      setPhoneCol(colIdx);
    } else if (target === 'email') {
      newE = colIdx;
      setEmailCol(colIdx);
    } else if (target === 'category') {
      newC = colIdx;
      setCategoryCol(colIdx);
    }

    validateAllRows(csvRows, csvHeaders, newN, newP, newE, newC);
  };

  const handleToggleRowSelect = (index: number) => {
    setValidatedRows((prev) =>
      prev.map((r, idx) => (idx === index ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleToggleSelectAllValid = (select: boolean) => {
    setValidatedRows((prev) =>
      prev.map((r) => (r.isValid ? { ...r, selected: select } : r))
    );
  };

  const handleExecuteImport = async () => {
    const rowsToImport = validatedRows.filter((r) => r.selected && r.isValid);
    if (rowsToImport.length === 0) {
      setImportFeedback({ type: 'error', message: 'No valid rows selected for import.' });
      return;
    }

    setImporting(true);
    setImportFeedback(null);

    try {
      const payload = rowsToImport.map((r) => ({
        name: r.name,
        phone: r.phone,
        email: r.email,
        category: r.category,
      }));

      const res = await fetch('/api/customers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: payload }),
      });

      const data = await res.json();
      if (data.success && data.customers) {
        // Sync each newly imported customer to Firestore for tenant persistence
        for (const cust of data.customers) {
          await saveCustomerToFirestore(cust);
        }

        setImportFeedback({
          type: 'success',
          message: `Successfully bulk-imported ${data.importedCount} customers into your Directory!`,
        });

        setTimeout(() => {
          setShowCsvModal(false);
          onRefreshData();
        }, 1200);
      } else {
        setImportFeedback({
          type: 'error',
          message: data.message || 'Failed to bulk import customers.',
        });
      }
    } catch (err: any) {
      setImportFeedback({
        type: 'error',
        message: 'Network error attempting bulk customer import.',
      });
    } finally {
      setImporting(false);
    }
  };

  const validCount = validatedRows.filter((r) => r.isValid).length;
  const invalidCount = validatedRows.filter((r) => !r.isValid).length;
  const selectedValidCount = validatedRows.filter((r) => r.isValid && r.selected).length;

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-200">
      {importFeedback && !showCsvModal && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between font-semibold text-xs border ${
            importFeedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {importFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <span>{importFeedback.message}</span>
          </div>
          <button onClick={() => setImportFeedback(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            Customer Directory (CRM)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage repeat Kenyan customers, track lifetime value & send instant STK Push payment requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCsvModal}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Bulk Import CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, phone, email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Showing <span className="text-slate-900 dark:text-white font-bold">{filtered.length}</span> Customers
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    c.category === 'VIP'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : c.category === 'REGULAR'
                      ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {c.category} CUSTOMER
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono">{c.transactionCount} Txns</span>
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 transition"
                    title="Edit Customer"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setDeletingId(c.id)}
                    className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition"
                    title="Delete Customer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">{c.name}</h3>
              <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2 font-mono">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{c.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{c.email}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Total Spent</div>
                <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  KES {c.totalSpent.toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => onSendStkToCustomer(c)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send STK</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CSV BULK IMPORT MODAL */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Bulk Import Customer Directory
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload CSV contact list with field mapping & phone number format validation.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {importFeedback && (
              <div
                className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-semibold border ${
                  importFeedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  {importFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span>{importFeedback.message}</span>
                </div>
                <button onClick={() => setImportFeedback(null)}>
                  <X className="w-4 h-4 opacity-70" />
                </button>
              </div>
            )}

            {csvStep === 'UPLOAD' && (
              <div className="space-y-5">
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-950/50 space-y-3 relative hover:border-emerald-500 transition">
                  <input
                    type="file"
                    accept=".csv, .txt"
                    onChange={handleFileDrop}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Click to choose CSV file or drag & drop here
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Supports comma-separated values (.csv) with headers for Name & Phone number.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadSampleCsv();
                      }}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Download Sample CSV Template</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Or Paste Raw CSV Text Data
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">header row + values</span>
                  </div>
                  <textarea
                    rows={4}
                    value={rawCsvText}
                    onChange={(e) => setRawCsvText(e.target.value)}
                    placeholder={'Full Name,M-PESA Phone,Email,Category\nSamuel Kimani,0712345678,samuel@gmail.com,VIP\nGrace Wanjiku,0722001122,grace@yahoo.com,REGULAR'}
                    className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCsvModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!rawCsvText.trim()}
                    onClick={() => processRawCsv(rawCsvText)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    <span>Parse & Validate CSV</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {csvStep === 'MAP_AND_PREVIEW' && (
              <div className="space-y-5">
                {/* Field Mapping Configuration */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                    <Settings className="w-3.5 h-3.5 text-emerald-500" /> Map CSV Columns to Customer Fields
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <select
                        value={nameCol}
                        onChange={(e) => handleMappingChange('name', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 outline-none"
                      >
                        <option value={-1}>-- Select Column --</option>
                        {csvHeaders.map((h, i) => (
                          <option key={i} value={i}>
                            Col {i + 1}: {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        M-PESA Phone *
                      </label>
                      <select
                        value={phoneCol}
                        onChange={(e) => handleMappingChange('phone', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 outline-none"
                      >
                        <option value={-1}>-- Select Column --</option>
                        {csvHeaders.map((h, i) => (
                          <option key={i} value={i}>
                            Col {i + 1}: {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address
                      </label>
                      <select
                        value={emailCol}
                        onChange={(e) => handleMappingChange('email', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 outline-none"
                      >
                        <option value={-1}>None / Ignore</option>
                        {csvHeaders.map((h, i) => (
                          <option key={i} value={i}>
                            Col {i + 1}: {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Category (VIP/REGULAR)
                      </label>
                      <select
                        value={categoryCol}
                        onChange={(e) => handleMappingChange('category', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 outline-none"
                      >
                        <option value={-1}>Default: NEW</option>
                        {csvHeaders.map((h, i) => (
                          <option key={i} value={i}>
                            Col {i + 1}: {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Validation Summary Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Total Parsed: <span className="font-mono text-emerald-500">{validatedRows.length}</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {validCount} Valid
                    </span>
                    {invalidCount > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> {invalidCount} Invalid/Skipped
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSelectAllValid(true)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    >
                      Select All Valid
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleSelectAllValid(false)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* Validation Preview Table */}
                <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3 w-10 text-center">Include</th>
                        <th className="p-3 w-12 text-center">#</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Mapped Name</th>
                        <th className="p-3">Formatted Phone</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {validatedRows.map((r, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-950/50 ${
                            !r.isValid ? 'bg-rose-500/5' : r.selected ? 'bg-emerald-500/5' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={r.selected}
                              disabled={!r.isValid}
                              onChange={() => handleToggleRowSelect(idx)}
                              className="rounded accent-emerald-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 text-center text-slate-400 font-mono text-[11px]">{r.rowIndex}</td>
                          <td className="p-3">
                            {r.isValid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                Valid
                              </span>
                            ) : (
                              <div className="text-rose-600 dark:text-rose-400 text-[11px] font-sans">
                                <span className="inline-flex items-center gap-1 font-bold">
                                  <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  Invalid
                                </span>
                                <div className="text-[10px] text-rose-500 opacity-90">{r.errors.join(' | ')}</div>
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-sans font-bold text-slate-800 dark:text-slate-200">
                            {r.name || <span className="text-rose-400 italic">Missing Name</span>}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                            {r.phone || <span className="text-rose-400 italic">Missing Phone</span>}
                          </td>
                          <td className="p-3 font-sans text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                            {r.email || '-'}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.category === 'VIP'
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                  : r.category === 'REGULAR'
                                  ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {r.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCsvStep('UPLOAD')}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Back to Upload
                  </button>
                  <button
                    type="button"
                    disabled={importing || selectedValidCount === 0}
                    onClick={handleExecuteImport}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>
                      {importing
                        ? 'Importing Customers...'
                        : `Import ${selectedValidCount} Selected Customers`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmitNew}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Add New Customer'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Samuel Kimani"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  M-PESA Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="samuel@gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {editingCustomer && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none"
                  >
                    <option value="NEW">NEW</option>
                    <option value="REGULAR">REGULAR</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
              >
                {editingCustomer ? 'Update Customer' : 'Save Customer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" /> Confirm Customer Deletion
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete this customer record?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md"
              >
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


