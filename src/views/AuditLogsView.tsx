import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { AuditLogsManager } from '../components/AuditLogsManager';

export const AuditLogsView: React.FC<{ business: any }> = ({ business }) => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            Security & Audit Logs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete audit trail recording logins, configuration changes, payment events, API requests, and user activities with timestamps and IP addresses.
          </p>
        </div>
      </div>

      <AuditLogsManager business={business} />
    </div>
  );
};
