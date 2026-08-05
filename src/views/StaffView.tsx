import React, { useState } from 'react';
import { UserCheck, Plus, ShieldCheck, Mail, Phone, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { User, UserRole, Branch } from '../types';
import { getUserInitials } from '../components/Header';

interface Props {
  users: User[];
  branches: Branch[];
  onInviteStaff: (user: Partial<User>) => void;
  onUpdateRole: (userId: string, role: UserRole) => void;
}

export const StaffView: React.FC<Props> = ({
  users,
  branches,
  onInviteStaff,
  onUpdateRole,
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('CASHIER');
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || '');

  const rolesList: { role: UserRole; label: string; permissions: string }[] = [
    { role: 'BUSINESS_OWNER', label: 'Business Owner', permissions: 'Full access to Daraja credentials, billing, staff & branches' },
    { role: 'MANAGER', label: 'Branch Manager', permissions: 'Manage branch cashiers, issue refunds & view reports' },
    { role: 'CASHIER', label: 'Cashier', permissions: 'Initiate M-PESA STK Push requests & view daily cash log' },
    { role: 'AUDITOR', label: 'Auditor', permissions: 'Read-only access to transaction history & financial compliance' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    onInviteStaff({ name, email, phone, role, branchId: selectedBranchId });
    setName('');
    setEmail('');
    setPhone('');
    setShowInviteModal(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-500" />
            Staff & Role-Based Access (RBAC)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assign granular security permissions for owners, managers, cashiers, and auditors.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Staff Member</span>
        </button>
      </div>

      {/* Staff User List */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Assigned Branch</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {users.map((u) => {
                const branch = branches.find((b) => b.id === u.branchId);
                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {getUserInitials(u.name)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{u.name}</div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                      {branch ? branch.name : 'All Branches (HQ)'}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-500">{u.phone}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        {u.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <select
                        value={u.role}
                        onChange={(e) => onUpdateRole(u.id, e.target.value as UserRole)}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-[10px] font-bold outline-none"
                      >
                        {rolesList.map((r) => (
                          <option key={r.role} value={r.role}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={async () => {
                          if (confirm(`Revoke account for ${u.name}?`)) {
                            try {
                              await fetch(`/api/staff/${u.id}`, { method: 'DELETE' });
                              if (onInviteStaff) {
                                // Refresh list
                                window.location.reload();
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition text-[10px] font-bold"
                        title="Revoke Staff Account"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix Overview */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-500" />
          Role Permission Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rolesList.map((r) => (
            <div key={r.role} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">{r.label}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{r.permissions}</p>
            </div>
          ))}
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Invite New Staff Account</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Staff Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Kamau"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@merchant.co.ke"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {rolesList.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Branch
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Branches (HQ)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                Send Invite Email
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
