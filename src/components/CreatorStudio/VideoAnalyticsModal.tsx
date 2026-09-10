import React from 'react';
import {
  X,
  Eye,
  Users,
  Clock,
  CheckCircle2,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  UserPlus,
  Play,
  Lock,
  Globe,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { VideoAnalyticsItem } from '../../types';
import { formatCount, formatTimeAgo } from '../../utils/formatters';

interface VideoAnalyticsModalProps {
  item: VideoAnalyticsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayVideo?: () => void;
}

export function VideoAnalyticsModal({
  item,
  isOpen,
  onClose,
  onPlayVideo,
}: VideoAnalyticsModalProps) {
  if (!isOpen || !item) return null;

  const { video } = item;

  return (
    <div
      id="video-analytics-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="video-analytics-modal-container"
        className="w-full max-w-4xl bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Video Performance</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border ${
                    video.privacy === 'public'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : video.privacy === 'followers'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {video.privacy}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Published {formatTimeAgo(video.createdAt)} • {video.duration}s duration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* Top Video Snapshot Row */}
          <div className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 items-start md:items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="relative w-16 h-24 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-white/10 cursor-pointer group"
                onClick={onPlayVideo}
              >
                <img
                  src={video.thumbnailUrl}
                  alt={video.title || 'Video thumbnail'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white line-clamp-1">
                  {video.title || video.caption.slice(0, 50)}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-2 mt-1">
                  {video.caption}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {video.hashtags.map((h) => (
                    <span
                      key={h}
                      className="text-[11px] text-cyan-400 font-medium"
                    >
                      #{h}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {onPlayVideo && (
              <button
                onClick={onPlayVideo}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white border border-white/10 flex items-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Watch Video</span>
              </button>
            )}
          </div>

          {/* Primary Metrics Grid (Views, Unique, Watch Time, Completion, Followers) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {/* Views */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Views</span>
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <p className="text-lg font-bold text-white">{formatCount(item.views)}</p>
              <p className="text-[11px] text-slate-400 mt-1">Total plays</p>
            </div>

            {/* Unique Viewers */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Unique Viewers</span>
                <Users className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <p className="text-lg font-bold text-white">{formatCount(item.uniqueViewers)}</p>
              <p className="text-[11px] text-indigo-300/80 mt-1">
                {Math.round((item.uniqueViewers / Math.max(1, item.views)) * 100)}% reach ratio
              </p>
            </div>

            {/* Avg Watch Time */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Avg Watch Time</span>
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-white">{item.avgWatchTimeFormatted}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {item.avgWatchTimeSeconds}s of {video.duration}s
              </p>
            </div>

            {/* Completion Rate */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Completion Rate</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <p className="text-lg font-bold text-white">{item.completionRate}%</p>
              <p className="text-[11px] text-emerald-400 font-medium mt-1">Strong retention</p>
            </div>

            {/* Follower Conversions */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Follower Conversions</span>
                <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <p className="text-lg font-bold text-cyan-300">+{item.followerConversions}</p>
              <p className="text-[11px] text-slate-400 mt-1">New followers gained</p>
            </div>
          </div>

          {/* Secondary Engagement Breakdown (Likes, Comments, Shares, Saves) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Likes</p>
                <p className="text-sm font-bold text-white">{formatCount(item.likes)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Comments</p>
                <p className="text-sm font-bold text-white">{formatCount(item.comments)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Share2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Shares</p>
                <p className="text-sm font-bold text-white">{formatCount(item.shares)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Bookmark className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Saves</p>
                <p className="text-sm font-bold text-white">{formatCount(item.saves)}</p>
              </div>
            </div>
          </div>

          {/* Retention Curve Analysis Chart */}
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Audience Retention Curve</h4>
                <p className="text-xs text-slate-400">
                  Percentage of viewers watching at each second of video duration
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-cyan-400">
                  {item.completionRate}% finished
                </span>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={item.retentionGraph}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="second"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `${val}s`}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#0e131d] border border-white/15 px-3 py-2 rounded-lg shadow-xl text-xs">
                            <p className="font-semibold text-slate-200">Second: {label}s</p>
                            <p className="text-cyan-400 font-bold">
                              Retention: {payload[0].value}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="percent"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#retentionGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
              <span>0:00 (Hook Phase)</span>
              <span>Middle (Content Flow)</span>
              <span>{video.duration}s (Call to Action / Loop)</span>
            </div>
          </div>

          {/* Traffic Sources Breakdown */}
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <h4 className="text-sm font-bold text-white">Traffic Sources</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {item.trafficSources.map((source) => (
                <div
                  key={source.source}
                  className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{source.source}</span>
                    <span className="font-bold text-white">{source.percent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{ width: `${source.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
