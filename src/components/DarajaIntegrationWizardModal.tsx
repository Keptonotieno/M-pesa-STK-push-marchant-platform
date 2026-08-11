import React from 'react';
import { PaymentMethodConfig, Branch } from '../types';
import { MpesaInitializationWizard } from './MpesaInitializationWizard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  editingMethod?: PaymentMethodConfig | null;
  onSavePaymentMethod: (method: Partial<PaymentMethodConfig>) => Promise<void>;
  onRunTestPayment?: (phone: string, amount: number) => Promise<void>;
}

export const DarajaIntegrationWizardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  branches,
  editingMethod,
  onSavePaymentMethod,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh] p-4 md:p-6 overflow-y-auto">
        <MpesaInitializationWizard
          initialConfig={editingMethod}
          branches={branches}
          onComplete={async (config) => {
            await onSavePaymentMethod(config);
            onClose();
          }}
          onCancel={onClose}
          isInline={false}
        />
      </div>
    </div>
  );
};
