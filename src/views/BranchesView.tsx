import React, { useState } from 'react';
import { GitBranch, Plus, Store, Phone, MapPin, User, CheckCircle, Shield, Edit2, Trash2, AlertCircle, X } from 'lucide-react';
import { Branch } from '../types';
import { saveBranchToFirestore } from '../lib/firestoreService';

interface Props {
  branches: Branch[];
  onAddBranch: (branch: Partial<Branch>) => void;
  onRefreshData?: () => void;
}

export const BranchesView: React.FC<Props> = ({ branches, onAddBranch, onRefreshData }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
  const [tillNumber, setTillNumber] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setName('');
    setLocation('');
    setManagerName('');
    setPhone('');
    setTillNumber('');
    setStatus('ACTIVE');
    setShowModal(true);
  };

  const handleOpenEdit = (b: Branch) => {
    setEditingBranch(b);
    setName(b.name);
    setLocation(b.location);
    setManagerName(b.managerName);
    setPhone(b.phone);
    setTillNumber(b.tillNumber);
    setStatus(b.status);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) return;

    if (editingBranch) {
      try {
        const updatedBranch = { ...editingBranch, name, location, managerName, phone, tillNumber, status };
        await saveBranchToFirestore(updatedBranch);
        await fetch(`/api/branches/${editingBranch.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, location, managerName, phone, tillNumber, status }),
        });
        if (onRefreshData) onRefreshData();
      } catch (err) {
        console.error('Failed to update branch:', err);
      }
    } else {
      onAddBranch({ name, location, managerName, phone, tillNumber });
    }

    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/branches/${id}`, { method: 'DELETE' });
      setDeletingId(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Failed to delete branch:', err);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-emerald-500" />
            Branch & Till Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure multi-location stores with independent Safaricom Till Numbers & Paybills.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Branch</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {branches.map((b) => (
          <div
            key={b.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between hover:border-emerald-500/40 transition group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                  {b.code}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                    {b.status}
                  </span>
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-500 transition"
                    title="Edit Branch"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(b.id)}
                    className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition"
                    title="Delete Branch"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3 flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-500" />
                {b.name}
              </h3>

              <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{b.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Manager: {b.managerName}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{b.phone}</span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">M-PESA Till Number</div>
                  <div className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    {b.tillNumber}
                  </div>
                </div>
                <Shield className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                <div className="text-[9px] text-slate-400 uppercase font-bold">Total Revenue</div>
                <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                  KES {(b.totalRevenue / 1000).toFixed(0)}k
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                <div className="text-[9px] text-slate-400 uppercase font-bold">Transactions</div>
                <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                  {b.transactionCount}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingBranch ? `Edit Branch: ${editingBranch.name}` : 'Add Store Branch'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Westlands Branch"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location Address *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Waiyaki Way, Westlands"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Branch Manager Name
                </label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Manager Full Name"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Till / Paybill Number
                </label>
                <input
                  type="text"
                  value={tillNumber}
                  onChange={(e) => setTillNumber(e.target.value)}
                  placeholder="174380"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
              >
                {editingBranch ? 'Update Branch' : 'Save Branch'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" /> Confirm Branch Deletion
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete this branch store?
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
                Delete Branch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

