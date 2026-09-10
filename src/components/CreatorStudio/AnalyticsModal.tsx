import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  Eye,
  Sparkles,
  ArrowUpRight,
  X,
  Award,
} from 'lucide-react';
import { CreatorAnalytics } from '../../types';
import { api } from '../../services/api';
import { formatCount } from '../../utils/formatters';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnalyticsModal({ isOpen, onClose }: AnalyticsModalProps) {
  const [data, setData] = useState<CreatorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getCreatorAnalytics()
        .then((res) => setData(res))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="analytics-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="analytics-modal-content"
        className="w-full max-w-2xl bg-[#161b22] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-brand font-bold text-white text-lg">Creator Studio Insights</h3>
              <p className="text-xs text-gray-400">Audience retention, completion velocity & performance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading || !data ? (
          <div className="py-16 text-center text-gray-400 text-sm animate-pulse">
            Calculating engagement signals...
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-xs font-semibold">Total Views</span>
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <p className="text-lg font-bold text-white">{formatCount(data.viewsTotal)}</p>
                <p className="text-[10px] text-emerald-400 font-semibold flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3" /> +{data.viewsGrowth}% this week
                </p>
              </div>

              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-xs font-semibold">Watch Time</span>
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <p className="text-lg font-bold text-white">{data.watchTimeHours} hrs</p>
                <p className="text-[10px] text-cyan-400 font-semibold mt-1">High retention</p>
              </div>

              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-xs font-semibold">Completion</span>
                  <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <p className="text-lg font-bold text-white">{data.avgCompletionRate}%</p>
                <p className="text-[10px] text-emerald-400 font-semibold mt-1">Top 5% on VibeTok</p>
              </div>

              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-xs font-semibold">New Followers</span>
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-lg font-bold text-white">+{formatCount(data.followersNetChange)}</p>
                <p className="text-[10px] text-gray-400 mt-1">Past 7 days</p>
              </div>
            </div>

            {/* 7-Day Views Histogram */}
            <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Daily Views Velocity (Past 7 Days)
                </h4>
                <span className="text-xs text-cyan-400 font-semibold">
                  Avg {formatCount(Math.round(data.viewsTotal / 7))}/day
                </span>
              </div>

              <div className="flex items-end justify-between gap-2 h-32 pt-4">
                {data.recentViews.map((item) => {
                  const maxView = Math.max(...data.recentViews.map((v) => v.views));
                  const heightPercent = Math.max(15, Math.round((item.views / maxView) * 100));
                  return (
                    <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] text-gray-400 font-mono">
                        {formatCount(item.views)}
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-cyan-500/40 to-cyan-400 rounded-t-lg transition-all hover:brightness-125 cursor-pointer"
                        style={{ height: `${heightPercent}%` }}
                        title={`${item.day}: ${item.views} views`}
                      />
                      <span className="text-xs font-semibold text-gray-400">{item.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Top Audience Regions
              </h4>
              <div className="space-y-2.5">
                {data.audienceTopCountries.map((c) => (
                  <div key={c.country} className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>{c.country}</span>
                      <span className="font-semibold text-cyan-400">{c.percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
