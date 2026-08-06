import React from 'react';
import { Activity } from 'lucide-react';
import { IntegrationHealthTab } from '../components/IntegrationHealthTab';

export const MonitoringView: React.FC<{ business: any }> = ({ business }) => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-500" />
            Real-Time Integration Health & Monitoring
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Continuous real-time probing of Safaricom Daraja API OAuth, STK Callbacks, C2B Webhooks, and configuration health.
          </p>
        </div>
      </div>

      <IntegrationHealthTab business={business} />
    </div>
  );
};
