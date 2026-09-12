import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

interface ReportMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  targetUserId: string;
  targetUsername: string;
  messageId?: string;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS = [
  { id: 'harassment', label: 'Harassment or Bullying', desc: 'Unwanted contact, offensive remarks, or targeting' },
  { id: 'spam', label: 'Spam, Phishing or Commercial Scams', desc: 'Repetitive spam, harmful links, or unsolicited advertising' },
  { id: 'inappropriate', label: 'Inappropriate or Explicit Content', desc: 'Nudity, sexual content, or graphic violence' },
  { id: 'hate_speech', label: 'Hate Speech or Discrimination', desc: 'Attacks based on race, religion, gender, or identity' },
  { id: 'impersonation', label: 'Impersonation or Fake Account', desc: 'Pretending to be someone else or misleading identity' },
  { id: 'other', label: 'Other Harmful Behavior', desc: 'Any other violation of HY safety guidelines' },
];

export function ReportMessageModal({
  isOpen,
  onClose,
  conversationId,
  targetUserId,
  targetUsername,
  messageId,
  onReportSubmitted,
}: ReportMessageModalProps) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0].id);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.reportConversationOrMessage({
        conversationId,
        messageId,
        targetUserId,
        reason: selectedReason,
        details,
      });
      setSubmitted(true);
      onReportSubmitted?.();
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="report-message-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="report-message-modal-content"
        className="w-full max-w-md bg-[#0e131d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-brand font-bold text-white text-base">Report Conversation</h3>
              <p className="text-[11px] text-slate-400">Target: @{targetUsername}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="font-bold text-white text-base">Report Received</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Thank you for keeping HY safe. Our trust &amp; safety moderation team will review this conversation log.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Why are you reporting this?
              </label>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      selectedReason === r.id
                        ? 'border-cyan-500/50 bg-cyan-500/10'
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.id}
                      checked={selectedReason === r.id}
                      onChange={() => setSelectedReason(r.id)}
                      className="mt-0.5 text-cyan-400 focus:ring-0"
                    />
                    <div>
                      <span className="block text-xs font-bold text-white">{r.label}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{r.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide any context that will help our safety moderators..."
                rows={3}
                maxLength={500}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              />
              <div className="flex justify-end text-[10px] text-slate-500 mt-1">
                {details.length}/500
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
