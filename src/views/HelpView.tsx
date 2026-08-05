import React, { useState } from 'react';
import { HelpCircle, Search, MessageSquare, BookOpen, Send, Phone, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const HelpView: React.FC = () => {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      q: 'How fast is the M-PESA STK Push prompt delivered to the customer?',
      a: 'STK Push prompts are delivered in 1-2 seconds via Safaricom Daraja 2.0 API directly to any active Safaricom line (+254 7XX or 07XX).',
    },
    {
      q: 'What happens if a customer cancels the prompt or enters an incorrect PIN?',
      a: 'The transaction status updates immediately to FAILED or CANCELLED with Safaricom ResultCode 1032. You can retry the STK Push with one click.',
    },
    {
      q: 'Can I connect multiple till numbers for different store branches?',
      a: 'Yes! PesaRequest supports multi-tenant branch management. Each branch can be assigned a unique shortcode or Till Number.',
    },
    {
      q: 'How do I export my transaction statements to Google Sheets or Excel?',
      a: 'Navigate to Transaction History or Financial Reports and click "Export to CSV / Sheets". The file is instantly formatted for direct import.',
    },
  ];

  const handleTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject) return;
    setSubmitted(true);
    setTicketSubject('');
    setTicketMsg('');
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-emerald-500" />
          Help Centre & Daraja Support
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Knowledge base, troubleshooting guides, and 24/7 Safaricom Daraja technical support.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* FAQs */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-500" /> Frequently Asked Questions
          </h3>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                  className="w-full px-4 py-3 text-left text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between"
                >
                  <span>{faq.q}</span>
                  {openFaqIdx === idx ? <ChevronUp className="w-4 h-4 text-emerald-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {openFaqIdx === idx && (
                  <div className="px-4 pb-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Support Ticket */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" /> Contact Support Team
          </h3>

          {submitted && (
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Support ticket submitted! Our Nairobi team will reply within 15 minutes.</span>
            </div>
          )}

          <form onSubmit={handleTicket} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject / Issue Summary
              </label>
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. Daraja Passkey update query"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description & Transaction Code
              </label>
              <textarea
                rows={4}
                required
                value={ticketMsg}
                onChange={(e) => setTicketMsg(e.target.value)}
                placeholder="Provide details about your query..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Submit Ticket
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
