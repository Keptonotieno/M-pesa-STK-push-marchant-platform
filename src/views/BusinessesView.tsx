import React, { useState, useEffect } from 'react';
import { Building2, Search, CheckCircle, ShieldCheck, AlertCircle, Plus, Edit2, Trash2, RefreshCw, X, Tag, ExternalLink } from 'lucide-react';
import { Business, BUSINESS_CATEGORIES } from '../types';

interface Props {
  currentBusiness: Business;
  onRefreshGlobalData?: () => void;
  onSwitchTenant?: (bizId: string) => void;
}

export const BusinessesView: React.FC<Props> = ({ currentBusiness, onRefreshGlobalData, onSwitchTenant }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    category: 'Retail Shop',
    customCategory: '',
    paybill: '522522',
    tillNumber: '174379',
    subscriptionTier: 'STARTER' as Business['subscriptionTier'],
    kraPin: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
  });

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setBusinesses(data.businesses || []);
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [searchQuery]);

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      category: 'Retail Shop',
      customCategory: '',
      paybill: '522522',
      tillNumber: '174379',
      subscriptionTier: 'STARTER',
      kraPin: 'P051' + Math.floor(100000 + Math.random() * 900000) + 'A',
      address: 'Nairobi, Kenya',
      contactEmail: '',
      contactPhone: '0712 345 678',
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (b: Business) => {
    setEditingBusiness(b);
    setFormData({
      name: b.name,
      category: b.category || 'Retail Shop',
      customCategory: b.customCategory || '',
      paybill: b.paybill || '522522',
      tillNumber: b.tillNumber || '174379',
      subscriptionTier: b.subscriptionTier,
      kraPin: b.kraPin || '',
      address: b.address || '',
      contactEmail: b.contactEmail || '',
      contactPhone: b.contactPhone || '',
    });
    setFormError('');
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.contactEmail.trim() || !formData.contactPhone.trim()) {
      setFormError('Please fill in business name, email, and contact phone.');
      return;
    }

    try {
      if (editingBusiness) {
        // Update
        const res = await fetch(`/api/businesses/${editingBusiness.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setSuccessMsg(`Business "${formData.name}" updated successfully.`);
          setEditingBusiness(null);
          fetchBusinesses();
          if (onRefreshGlobalData) onRefreshGlobalData();
        } else {
          setFormError(data.message || 'Failed to update business');
        }
      } else {
        // Create
        const res = await fetch('/api/businesses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setSuccessMsg(`New tenant business "${formData.name}" created successfully.`);
          setShowAddModal(false);
          fetchBusinesses();
          if (onRefreshGlobalData) onRefreshGlobalData();
        } else {
          setFormError(data.message || 'Failed to create business');
        }
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError('Network error trying to save business.');
    }
  };

  const handleDeleteBusiness = async (id: string) => {
    try {
      const res = await fetch(`/api/businesses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Business tenant archived/deleted.');
        setDeletingId(null);
        fetchBusinesses();
        if (onRefreshGlobalData) onRefreshGlobalData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to delete business:', err);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-500" />
            Super Admin Tenant Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global multi-tenant management of registered Kenyan businesses & KRA PIN compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBusinesses}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Business</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by business name, KRA PIN, email, till..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
        <div className="text-xs text-slate-400 font-mono">Total Tenants: {businesses.length}</div>
      </div>

      {/* Grid of Tenants */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
          <span>Loading dynamic tenant records...</span>
        </div>
      ) : businesses.length === 0 ? (
        <div className="p-12 text-center text-slate-400 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          No registered business tenants match your search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {businesses.map((b) => (
            <div
              key={b.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between hover:border-emerald-500/50 transition group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    {b.subscriptionTier} TIER
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">KRA: {b.kraPin}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3 flex items-center justify-between">
                  <span>{b.name}</span>
                  {b.id === currentBusiness.id && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500 text-slate-950">ACTIVE WORKSPACE</span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-emerald-500" />
                  <span>{b.category || 'Retail Shop'}</span>
                </p>

                <div className="mt-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-mono space-y-1">
                  <div>Till Number: {b.tillNumber || '174379'}</div>
                  <div>Paybill: {b.paybill || '522522'}</div>
                  <div className="truncate text-slate-400 text-[10px]">{b.contactEmail}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                {onSwitchTenant && b.id !== currentBusiness.id ? (
                  <button
                    onClick={() => onSwitchTenant(b.id)}
                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] rounded-lg flex items-center gap-1 transition"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Switch Tenant</span>
                  </button>
                ) : (
                  <span className="font-mono text-slate-400">{b.contactPhone}</span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(b)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition"
                    title="Edit Business"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(b.id)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition"
                    title="Delete Business"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Business Modal */}
      {(showAddModal || editingBusiness) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSaveBusiness}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-500" />
                {editingBusiness ? `Edit Business: ${editingBusiness.name}` : 'Register New Business Tenant'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingBusiness(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
                {formError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Java House Westlands"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={formData.subscriptionTier}
                    onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="STARTER">STARTER</option>
                    <option value="GROWTH">GROWTH</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">KRA PIN</label>
                  <input
                    type="text"
                    value={formData.kraPin}
                    onChange={(e) => setFormData({ ...formData, kraPin: e.target.value })}
                    placeholder="P051234567A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Paybill Shortcode</label>
                  <input
                    type="text"
                    value={formData.paybill}
                    onChange={(e) => setFormData({ ...formData, paybill: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Till Number</label>
                  <input
                    type="text"
                    value={formData.tillNumber}
                    onChange={(e) => setFormData({ ...formData, tillNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="finance@company.co.ke"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="0712 345 678"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Headquarters Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Westlands Commercial Center, Nairobi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingBusiness(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
              >
                {editingBusiness ? 'Save Changes' : 'Register Business'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" /> Confirm Business Archive / Deletion
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete this business tenant? This action will archive all associated branches and transaction logs.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBusiness(deletingId)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md"
              >
                Delete Business
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

