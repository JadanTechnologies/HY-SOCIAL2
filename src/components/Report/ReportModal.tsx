import { useState, FormEvent } from 'react';
import { X, Flag, AlertTriangle, Check } from 'lucide-react';
import { Video } from '../../types';
import { api } from '../../services/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: Video | null;
}

export function ReportModal({ isOpen, onClose, video }: ReportModalProps) {
  const [reason, setReason] = useState<'inappropriate' | 'spam' | 'harassment' | 'copyright' | 'misinformation'>('inappropriate');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !video) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.reportVideo({
        videoId: video.id,
        reason,
        details: details.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to submit report', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="report-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="report-modal-content"
        className="w-full max-w-md bg-[#161b22] border border-white/10 rounded-2xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-rose-400" />
            <h3 className="font-brand font-bold text-white text-lg">Report Content</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-white font-bold text-base">Report Submitted</h4>
            <p className="text-xs text-gray-400">
              Thank you for keeping VibeTok safe. Our moderation team will review this content promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-2">
                Why are you reporting this video?
              </label>
              <div className="space-y-2">
                {[
                  { id: 'inappropriate', label: 'Inappropriate or explicit content' },
                  { id: 'spam', label: 'Spam, bot activity, or commercial scam' },
                  { id: 'harassment', label: 'Hate speech, bullying, or harassment' },
                  { id: 'copyright', label: 'Copyright or intellectual property infringement' },
                  { id: 'misinformation', label: 'Harmful misinformation or impersonation' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      reason === item.id
                        ? 'bg-rose-500/10 border-rose-500/40 text-white'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={item.id}
                      checked={reason === item.id}
                      onChange={() => setReason(item.id as any)}
                      className="accent-rose-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                Additional Details (Optional)
              </label>
              <textarea
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Help our moderation team understand the context..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-report-btn"
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white transition-colors cursor-pointer"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
