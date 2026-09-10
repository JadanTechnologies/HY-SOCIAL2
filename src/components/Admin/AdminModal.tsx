import { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Check,
  RefreshCw,
  X,
  Sparkles,
} from 'lucide-react';
import { ReportItem } from '../../types';
import { api } from '../../services/api';
import { formatCount, timeAgo } from '../../utils/formatters';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoModified?: () => void;
}

export function AdminModal({ isOpen, onClose, onVideoModified }: AdminModalProps) {
  const [reports, setReports] = useState<(ReportItem & { isTakenDown: boolean })[]>([]);
  const [metrics, setMetrics] = useState<{
    totalVideos: number;
    activeUsers: number;
    pendingReports: number;
    totalViews: number;
  }>({ totalVideos: 0, activeUsers: 0, pendingReports: 0, totalViews: 0 });
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminReports();
      setReports(data.reports);
      setMetrics(data.metrics);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAction = async (reportId: string, action: 'take_down' | 'dismiss' | 'reinstate') => {
    setActionInProgress(reportId);
    try {
      await api.takeModerationAction(reportId, action);
      await fetchAdminData();
      onVideoModified?.();
    } catch (err) {
      console.error('Moderation action failed', err);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div
      id="admin-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="admin-modal-content"
        className="w-full max-w-3xl bg-[#161b22] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h3 className="font-brand font-bold text-white text-lg">Trust & Safety Portal</h3>
              <p className="text-xs text-gray-400">Community content moderation, reports & platform audit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Platform Health Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-[11px] text-gray-400 font-semibold block">Total Published</span>
            <span className="text-lg font-bold text-white mt-1 block">{metrics.totalVideos} videos</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-[11px] text-gray-400 font-semibold block">Active Creators</span>
            <span className="text-lg font-bold text-cyan-400 mt-1 block">{metrics.activeUsers} accounts</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-[11px] text-gray-400 font-semibold block">Pending Flags</span>
            <span className={`text-lg font-bold mt-1 block ${metrics.pendingReports > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {metrics.pendingReports} reports
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-[11px] text-gray-400 font-semibold block">Community Views</span>
            <span className="text-lg font-bold text-white mt-1 block">{formatCount(metrics.totalViews)}</span>
          </div>
        </div>

        {/* Reports Queue */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Flagged Content Queue ({reports.length})
            </h4>
            <button
              onClick={fetchAdminData}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400 animate-pulse">
              Loading moderation queue...
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-white">All clear!</p>
              <p className="text-xs">No pending flags in the community queue.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {reports.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wide bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                        {item.reason}
                      </span>
                      <span className="text-xs text-gray-400">
                        Reported {timeAgo(item.createdAt)}
                      </span>
                      {item.isTakenDown && (
                        <span className="text-[10px] font-bold bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">
                          TAKEN DOWN
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-white mt-1.5">
                      "{item.videoCaption}"
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Author: <span className="text-cyan-400 font-medium">@{item.authorUsername}</span> • Flagged by: <span className="font-mono">{item.reportedBy}</span>
                    </p>
                    {item.details && (
                      <p className="text-xs text-gray-400 italic mt-1 bg-black/30 p-2 rounded-lg">
                        "{item.details}"
                      </p>
                    )}
                  </div>

                  {/* Moderation Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!item.isTakenDown ? (
                      <button
                        id={`take-down-btn-${item.id}`}
                        disabled={actionInProgress === item.id}
                        onClick={() => handleAction(item.id, 'take_down')}
                        className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-rose-500/20 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Video</span>
                      </button>
                    ) : (
                      <button
                        id={`reinstate-btn-${item.id}`}
                        disabled={actionInProgress === item.id}
                        onClick={() => handleAction(item.id, 'reinstate')}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Reinstate</span>
                      </button>
                    )}

                    {item.status === 'pending' && (
                      <button
                        id={`dismiss-report-btn-${item.id}`}
                        disabled={actionInProgress === item.id}
                        onClick={() => handleAction(item.id, 'dismiss')}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
