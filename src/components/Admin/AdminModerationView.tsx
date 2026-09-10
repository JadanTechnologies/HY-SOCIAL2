import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  Trash2,
  Check,
  RefreshCw,
  Sparkles,
  History,
  Lock,
} from 'lucide-react';
import { ReportItem } from '../../types';
import { api } from '../../services/api';
import { formatCount, timeAgo } from '../../utils/formatters';

interface AdminModerationViewProps {
  onVideoModified?: () => void;
}

interface AuditLogEntry {
  id: string;
  action: string;
  targetId: string;
  admin: string;
  timestamp: string;
}

export function AdminModerationView({ onVideoModified }: AdminModerationViewProps) {
  const [reports, setReports] = useState<(ReportItem & { isTakenDown: boolean })[]>([]);
  const [metrics, setMetrics] = useState<{
    totalVideos: number;
    activeUsers: number;
    pendingReports: number;
    totalViews: number;
  }>({ totalVideos: 0, activeUsers: 0, pendingReports: 0, totalViews: 0 });
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'log-1',
      action: 'Dismissed copyright flag on #cyberpunk neon',
      targetId: 'v-2',
      admin: 'mod_staff',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'log-2',
      action: 'Reviewed safety report on dance choreography',
      targetId: 'v-1',
      admin: 'mod_staff',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
    },
  ]);

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
    fetchAdminData();
  }, []);

  const handleAction = async (reportId: string, action: 'take_down' | 'dismiss' | 'reinstate') => {
    setActionInProgress(reportId);
    try {
      await api.takeModerationAction(reportId, action);
      const rep = reports.find((r) => r.id === reportId);
      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        action: `${action.toUpperCase()} action applied to report ${reportId} (${rep?.videoCaption || 'video'})`,
        targetId: rep?.videoId || reportId,
        admin: 'mod_staff',
        timestamp: new Date().toISOString(),
      };
      setAuditLogs((prev) => [newLog, ...prev]);

      await fetchAdminData();
      onVideoModified?.();
    } catch (err) {
      console.error('Moderation action failed', err);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div id="admin-moderation-root" className="min-h-screen bg-[#070a0f] text-slate-100 pt-16 md:pt-20 pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-brand text-white">Trust & Safety Portal</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Staff Route
              </span>
            </div>
            <p className="text-xs text-slate-400">Moderation queue, community safety filters, and action audit log</p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Platform Health Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="p-4 bg-[#0e131d] rounded-2xl border border-white/10 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold block">Total Published</span>
          <span className="text-xl font-bold text-white mt-1 block">{metrics.totalVideos} vibes</span>
        </div>
        <div className="p-4 bg-[#0e131d] rounded-2xl border border-white/10 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold block">Active Creators</span>
          <span className="text-xl font-bold text-cyan-400 mt-1 block">{metrics.activeUsers} accounts</span>
        </div>
        <div className="p-4 bg-[#0e131d] rounded-2xl border border-white/10 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold block">Pending Flags</span>
          <span
            className={`text-xl font-bold mt-1 block ${
              metrics.pendingReports > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {metrics.pendingReports} reports
          </span>
        </div>
        <div className="p-4 bg-[#0e131d] rounded-2xl border border-white/10 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold block">Community Views</span>
          <span className="text-xl font-bold text-white mt-1 block">{formatCount(metrics.totalViews)}</span>
        </div>
      </div>

      {/* Queue & Logs Columns */}
      <div className="space-y-8">
        {/* Flagged Content Queue */}
        <div className="p-6 rounded-2xl bg-[#0e131d] border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Reported Videos Queue ({reports.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Scanning report queue...
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-white">All clear!</p>
              <p className="text-xs">No pending flags in the community moderation queue.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-white/20"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wide bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                        {item.reason}
                      </span>
                      <span className="text-xs text-slate-500">
                        Reported {timeAgo(item.createdAt)}
                      </span>
                      {item.isTakenDown && (
                        <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          TAKEN DOWN
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-white">
                      "{item.videoCaption}"
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Author: <span className="text-cyan-400 font-medium">@{item.authorUsername}</span> · Flagged by: <span className="font-mono text-slate-300">{item.reportedBy}</span>
                    </p>
                    {item.details && (
                      <p className="text-xs text-slate-400 italic mt-1.5 bg-black/40 p-2.5 rounded-lg border border-white/5">
                        "{item.details}"
                      </p>
                    )}
                  </div>

                  {/* Moderation Controls (Dismiss, Hide/Remove, Reinstate) */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!item.isTakenDown ? (
                      <button
                        id={`take-down-btn-${item.id}`}
                        disabled={actionInProgress === item.id}
                        onClick={() => handleAction(item.id, 'take_down')}
                        className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Video</span>
                      </button>
                    ) : (
                      <button
                        id={`reinstate-btn-${item.id}`}
                        disabled={actionInProgress === item.id}
                        onClick={() => handleAction(item.id, 'reinstate')}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
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
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Dismiss Flag
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Basic Audit Log */}
        <div className="p-6 rounded-2xl bg-[#0e131d] border border-white/10 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Moderation Audit Log
            </h2>
          </div>

          <div className="divide-y divide-white/5 space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="pt-2 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white">{log.action}</span>
                  <span className="text-slate-500 block text-[11px] mt-0.5">
                    Target: {log.targetId} · Handled by @{log.admin}
                  </span>
                </div>
                <span className="text-slate-500 text-[11px]">{timeAgo(log.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
