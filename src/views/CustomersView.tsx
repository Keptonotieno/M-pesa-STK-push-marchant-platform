import React, { useState } from 'react';
import { Users, Search, Plus, Send, Phone, Mail, Award, Calendar, RefreshCw, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { Customer } from '../types';
import { saveCustomerToFirestore, deleteCustomerFromFirestore } from '../lib/firestoreService';

interface Props {
  customers: Customer[];
  onAddCustomer: (customer: Partial<Customer>) => void;
  onSendStkToCustomer: (customer: Customer) => void;
  onRefreshData: () => void;
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

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-200">
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
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition"
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

