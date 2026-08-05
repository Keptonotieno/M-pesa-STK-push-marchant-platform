import React from 'react';
import { Bell, CheckCircle, XCircle, ShieldCheck, CreditCard, Clock, RefreshCw, Trash2 } from 'lucide-react';
import { NotificationItem } from '../types';

interface Props {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onRefreshData?: () => void;
}

export const NotificationsView: React.FC<Props> = ({ notifications, onMarkAllRead, onRefreshData }) => {
  const handleDeleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await fetch('/api/notifications', { method: 'DELETE' });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-500" />
            Notifications & Callbacks
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time feed of M-PESA STK Push payment confirmations, system alerts & Daraja webhook status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onMarkAllRead}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Mark All Read
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-rose-500/10 text-rose-500 text-xs font-bold rounded-xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            No notifications available.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 group ${
                n.read
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  : 'bg-emerald-500/5 dark:bg-emerald-950/30 border-emerald-500/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {n.type === 'PAYMENT_RECEIVED' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                  {n.type === 'PAYMENT_FAILED' && <XCircle className="w-5 h-5 text-rose-500" />}
                  {n.type === 'SUBSCRIPTION' && <CreditCard className="w-5 h-5 text-indigo-500" />}
                  {n.type === 'SYSTEM' && <ShieldCheck className="w-5 h-5 text-amber-500" />}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                  <div className="text-[10px] text-slate-400 mt-2 font-mono">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {n.amount && (
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    KES {n.amount.toLocaleString()}
                  </div>
                )}
                <button
                  onClick={() => handleDeleteNotification(n.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                  title="Delete Notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
