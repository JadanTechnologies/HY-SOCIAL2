import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Users,
  UserPlus,
  Clock,
  CheckCircle2,
  Calendar,
  Filter,
  Search,
  MoreVertical,
  Edit3,
  Trash2,
  Play,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
  Globe,
  Lock,
  Layers,
  Sparkles,
  ChevronDown,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CreatorStudioDashboard,
  TimeFilterRange,
  VideoAnalyticsItem,
  Video,
} from '../../types';
import { api } from '../../services/api';
import { formatCount, formatTimeAgo } from '../../utils/formatters';
import { VideoAnalyticsModal } from './VideoAnalyticsModal';
import { VideoEditModal } from './VideoEditModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { VideoPreviewModal } from './VideoPreviewModal';

interface CreatorStudioViewProps {
  onOpenUpload: () => void;
  onNavigateHome?: () => void;
}

type StudioTab = 'overview' | 'content' | 'audience';
type ChartMetric = 'views' | 'watchTime' | 'likes' | 'followers';

export function CreatorStudioView({
  onOpenUpload,
  onNavigateHome,
}: CreatorStudioViewProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('overview');
  const [timeRange, setTimeRange] = useState<TimeFilterRange>('28d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState<boolean>(false);

  const [dashboard, setDashboard] = useState<CreatorStudioDashboard | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Chart Metric toggle in Overview
  const [chartMetric, setChartMetric] = useState<ChartMetric>('views');

  // Content tab filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'followers' | 'private'>('all');
  const [sortBy, setSortBy] = useState<'views' | 'date' | 'likes' | 'completion'>('views');

  // Modals state
  const [inspectingItem, setInspectingItem] = useState<VideoAnalyticsItem | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<Video | null>(null);
  const [previewingVideo, setPreviewingVideo] = useState<Video | null>(null);

  const fetchDashboard = async (range = timeRange, start = customStartDate, end = customEndDate) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getCreatorStudioDashboard(range, start, end);
      setDashboard(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load creator analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(timeRange, customStartDate, customEndDate);
  }, [timeRange]);

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStartDate || !customEndDate) return;
    setShowCustomPicker(false);
    setTimeRange('custom');
    fetchDashboard('custom', customStartDate, customEndDate);
  };

  const handleVideoUpdated = (updatedVideo: Video) => {
    if (!dashboard) return;
    const updatedList = dashboard.videos.map((item) => {
      if (item.videoId === updatedVideo.id) {
        return {
          ...item,
          video: updatedVideo,
        };
      }
      return item;
    });
    setDashboard({
      ...dashboard,
      videos: updatedList,
    });
  };

  const handleVideoDeleted = (deletedId: string) => {
    if (!dashboard) return;
    const updatedList = dashboard.videos.filter((item) => item.videoId !== deletedId);
    setDashboard({
      ...dashboard,
      videos: updatedList,
      totalViews: Math.max(0, dashboard.totalViews - (dashboard.videos.find((i) => i.videoId === deletedId)?.views || 0)),
    });
  };

  // Filtered & sorted videos for Content management tab
  const filteredVideos = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.videos
      .filter((item) => {
        const matchesPrivacy =
          privacyFilter === 'all' || item.video.privacy === privacyFilter;
        const matchesQuery =
          !searchQuery.trim() ||
          item.video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.video.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.video.hashtags?.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesPrivacy && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'views') return b.views - a.views;
        if (sortBy === 'likes') return b.likes - a.likes;
        if (sortBy === 'completion') return b.completionRate - a.completionRate;
        if (sortBy === 'date') {
          return new Date(b.video.createdAt).getTime() - new Date(a.video.createdAt).getTime();
        }
        return 0;
      });
  }, [dashboard, privacyFilter, searchQuery, sortBy]);

  // Dynamic chart data key & color
  const chartConfig = useMemo(() => {
    switch (chartMetric) {
      case 'views':
        return {
          label: 'Views',
          dataKey: 'views',
          stroke: '#06b6d4',
          fill: '#06b6d4',
          format: (v: number) => formatCount(v),
        };
      case 'watchTime':
        return {
          label: 'Watch Time (Hours)',
          dataKey: 'watchTimeHours',
          stroke: '#10b981',
          fill: '#10b981',
          format: (v: number) => `${v} hrs`,
        };
      case 'likes':
        return {
          label: 'Likes',
          dataKey: 'likes',
          stroke: '#f43f5e',
          fill: '#f43f5e',
          format: (v: number) => formatCount(v),
        };
      case 'followers':
        return {
          label: 'Followers Gained',
          dataKey: 'followersGained',
          stroke: '#6366f1',
          fill: '#6366f1',
          format: (v: number) => `+${formatCount(v)}`,
        };
    }
  }, [chartMetric]);

  return (
    <div
      id="creator-studio-view"
      className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-sans pb-16 selection:bg-cyan-500/30 selection:text-cyan-200"
    >
      {/* Studio Header Bar */}
      <header className="sticky top-0 z-30 bg-[#0b0f17]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Creator Studio
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold tracking-wide uppercase">
                Pro
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {dashboard?.dateRangeLabel || 'Analytics & Content Management'}
            </p>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Time Filter Pills */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                timeRange === '7d'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              7 days
            </button>
            <button
              onClick={() => setTimeRange('28d')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                timeRange === '28d'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              28 days
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                timeRange === '90d'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              90 days
            </button>
            <button
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                timeRange === 'custom'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Custom</span>
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => fetchDashboard()}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Create Video Button */}
          <button
            onClick={onOpenUpload}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Video</span>
          </button>
        </div>
      </header>

      {/* Custom Range Popover */}
      {showCustomPicker && (
        <div className="bg-[#0e131d] border-b border-white/10 px-4 sm:px-8 py-3.5">
          <form
            onSubmit={handleApplyCustomRange}
            className="max-w-xl flex flex-wrap items-center gap-3 text-xs"
          >
            <span className="font-semibold text-slate-300">Custom Date Range:</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                required
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                required
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={() => setShowCustomPicker(false)}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 cursor-pointer"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Studio Navigation Tabs */}
      <div className="border-b border-white/10 bg-[#070a0f] px-4 sm:px-8">
        <nav className="flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('content')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'content'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Content Management</span>
            {dashboard && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/10 text-slate-300">
                {dashboard.videos.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('audience')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'audience'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Followers & Growth</span>
          </button>
        </nav>
      </div>

      {/* Main Studio Body */}
      <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchDashboard()}
              className="underline font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW */}
        {/* ======================================================== */}
        {activeTab === 'overview' && dashboard && (
          <div className="space-y-6">
            {/* KPI Metric Cards (Strictly Non-slop: sleek dark slate, subtle borders, high legibility) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {/* Total Views */}
              <div className="p-4 rounded-xl bg-[#0d121c] border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Total Views</span>
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <p className="text-xl font-bold text-white tracking-tight">
                  {formatCount(dashboard.totalViews)}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{dashboard.viewsGrowth}%</span>
                </div>
              </div>

              {/* Likes */}
              <div className="p-4 rounded-xl bg-[#0d121c] border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Likes</span>
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <p className="text-xl font-bold text-white tracking-tight">
                  {formatCount(dashboard.totalLikes)}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{dashboard.likesGrowth}%</span>
                </div>
              </div>

              {/* Comments */}
              <div className="p-4 rounded-xl bg-[#0d121c] border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Comments</span>
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <p className="text-xl font-bold text-white tracking-tight">
                  {formatCount(dashboard.totalComments)}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{dashboard.commentsGrowth}%</span>
                </div>
              </div>

              {/* Shares */}
              <div className="p-4 rounded-xl bg-[#0d121c] border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Shares</span>
                  <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <p className="text-xl font-bold text-white tracking-tight">
                  {formatCount(dashboard.totalShares)}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{dashboard.sharesGrowth}%</span>
                </div>
              </div>

              {/* Followers */}
              <div className="p-4 rounded-xl bg-[#0d121c] border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Followers</span>
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <p className="text-xl font-bold text-white tracking-tight">
                  {formatCount(dashboard.followersTotal)}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+{formatCount(dashboard.followerGrowth)} net</span>
                </div>
              </div>

              {/* Watch Time */}
              <div className="p-4 rounded-xl bg-[#0d121c] border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Watch Time</span>
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-xl font-bold text-white tracking-tight">
                  {dashboard.totalWatchTimeHours} hrs
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{dashboard.avgCompletionRate}% completion</span>
                </div>
              </div>
            </div>

            {/* Primary Time-Series Analytics Chart */}
            <div className="p-6 rounded-2xl bg-[#0d121c] border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Performance Over Time
                  </h3>
                  <p className="text-xs text-slate-400">
                    Daily breakdown for the selected period ({dashboard.dateRangeLabel})
                  </p>
                </div>

                {/* Metric Selector Buttons */}
                <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                  <button
                    onClick={() => setChartMetric('views')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      chartMetric === 'views'
                        ? 'bg-white/15 text-cyan-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Views
                  </button>
                  <button
                    onClick={() => setChartMetric('watchTime')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      chartMetric === 'watchTime'
                        ? 'bg-white/15 text-emerald-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Watch Time
                  </button>
                  <button
                    onClick={() => setChartMetric('likes')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      chartMetric === 'likes'
                        ? 'bg-white/15 text-rose-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Likes
                  </button>
                  <button
                    onClick={() => setChartMetric('followers')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      chartMetric === 'followers'
                        ? 'bg-white/15 text-indigo-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Followers
                  </button>
                </div>
              </div>

              {/* Chart Container */}
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={dashboard.timeseries}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartConfig.fill} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={chartConfig.fill} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => formatCount(val)}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const val = Number(payload[0].value);
                          return (
                            <div className="bg-[#0b0f17] border border-white/15 px-3 py-2 rounded-xl shadow-2xl text-xs space-y-1">
                              <p className="font-semibold text-slate-300">{label}</p>
                              <p className="font-bold text-white flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full inline-block"
                                  style={{ backgroundColor: chartConfig.stroke }}
                                />
                                <span>{chartConfig.label}:</span>
                                <span className="text-cyan-300">{chartConfig.format(val)}</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={chartConfig.dataKey}
                      stroke={chartConfig.stroke}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#primaryAreaGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Two-Column Grid: Top Videos & Traffic Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Performing Videos Leaderboard */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0d121c] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      Video Performance Highlights
                    </h3>
                    <p className="text-xs text-slate-400">
                      Highest reaching vibes in this period
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('content')}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    View All Content →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {dashboard.videos.slice(0, 4).map((item, idx) => (
                    <div
                      key={item.videoId}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-all"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-xs font-bold text-slate-500 w-4">
                          0{idx + 1}
                        </span>
                        <div
                          className="relative w-12 h-16 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-white/10 cursor-pointer group"
                          onClick={() => setPreviewingVideo(item.video)}
                        >
                          <img
                            src={item.video.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-white truncate">
                            {item.video.title || item.video.caption.slice(0, 40)}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {formatTimeAgo(item.video.createdAt)} • {item.video.duration}s
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300">
                            <span className="font-semibold text-cyan-300">
                              {formatCount(item.views)} views
                            </span>
                            <span>•</span>
                            <span>{item.completionRate}% completion</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setInspectingItem(item)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 transition-colors cursor-pointer"
                        >
                          Analytics
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Traffic Distribution */}
              <div className="p-6 rounded-2xl bg-[#0d121c] border border-white/10 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Traffic Sources
                  </h3>
                  <p className="text-xs text-slate-400">
                    How viewers discovered your content
                  </p>
                </div>

                <div className="space-y-3.5 pt-2">
                  {[
                    { source: 'For You Feed', pct: 72, color: '#06b6d4' },
                    { source: 'Following Feed', pct: 14, color: '#6366f1' },
                    { source: 'Sound / Music Page', pct: 8, color: '#10b981' },
                    { source: 'Profile & Direct Shares', pct: 6, color: '#f59e0b' },
                  ].map((s) => (
                    <div key={s.source} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-300">{s.source}</span>
                        <span className="font-bold text-white">{s.pct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${s.pct}%`,
                            backgroundColor: s.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-xs text-slate-300 space-y-1 mt-4">
                  <span className="font-bold text-cyan-300">Creator Insight:</span>
                  <p className="text-[11px] text-slate-400">
                    72% of audience discovery is algorithm-driven via For You. Consistent upload pacing enhances recommendation velocity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CONTENT MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'content' && dashboard && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0d121c] border border-white/10">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your videos by title, caption, or #hashtag..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Privacy Pills & Sorting */}
              <div className="flex items-center flex-wrap gap-2 text-xs">
                {/* Privacy filters */}
                <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/10">
                  <button
                    onClick={() => setPrivacyFilter('all')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      privacyFilter === 'all'
                        ? 'bg-white/15 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setPrivacyFilter('public')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      privacyFilter === 'public'
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Public
                  </button>
                  <button
                    onClick={() => setPrivacyFilter('followers')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      privacyFilter === 'followers'
                        ? 'bg-indigo-500/20 text-indigo-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Followers
                  </button>
                  <button
                    onClick={() => setPrivacyFilter('private')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      privacyFilter === 'private'
                        ? 'bg-amber-500/20 text-amber-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Private
                  </button>
                </div>

                {/* Sort Selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="views" className="bg-[#0b0f17]">Sort by Views</option>
                  <option value="date" className="bg-[#0b0f17]">Sort by Date (Newest)</option>
                  <option value="likes" className="bg-[#0b0f17]">Sort by Likes</option>
                  <option value="completion" className="bg-[#0b0f17]">Sort by Completion %</option>
                </select>
              </div>
            </div>

            {/* Video List / Table */}
            <div className="rounded-2xl bg-[#0d121c] border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Video</th>
                      <th className="py-3.5 px-4">Privacy</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4 text-right">Views / Unique</th>
                      <th className="py-3.5 px-4 text-right">Watch Time / Completion</th>
                      <th className="py-3.5 px-4 text-right">Engagement</th>
                      <th className="py-3.5 px-4 text-right">Followers Gained</th>
                      <th className="py-3.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredVideos.map((item) => {
                      const { video } = item;
                      return (
                        <tr
                          key={item.videoId}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          {/* Video Thumbnail & Info */}
                          <td className="py-3.5 px-4 min-w-[240px]">
                            <div className="flex items-center gap-3">
                              <div
                                className="relative w-14 h-20 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-white/10 cursor-pointer group/thumb"
                                onClick={() => setPreviewingVideo(video)}
                              >
                                <img
                                  src={video.thumbnailUrl}
                                  alt=""
                                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                  <Play className="w-4 h-4 text-white fill-white" />
                                </div>
                                <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 text-[9px] font-semibold text-white">
                                  {video.duration}s
                                </span>
                              </div>
                              <div className="overflow-hidden">
                                <h4 className="font-bold text-white truncate max-w-[200px]">
                                  {video.title || video.caption.slice(0, 35)}
                                </h4>
                                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 max-w-[200px]">
                                  {video.caption}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  {video.hashtags.slice(0, 2).map((h) => (
                                    <span
                                      key={h}
                                      className="text-[10px] text-cyan-400"
                                    >
                                      #{h}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Privacy Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border flex items-center gap-1.5 w-fit ${
                                video.privacy === 'public'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : video.privacy === 'followers'
                                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {video.privacy === 'public' ? (
                                <Globe className="w-3 h-3" />
                              ) : video.privacy === 'followers' ? (
                                <Users className="w-3 h-3" />
                              ) : (
                                <Lock className="w-3 h-3" />
                              )}
                              <span>{video.privacy}</span>
                            </span>
                          </td>

                          {/* Date Published */}
                          <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                            {formatTimeAgo(video.createdAt)}
                          </td>

                          {/* Views & Unique Viewers */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <p className="font-bold text-white">{formatCount(item.views)}</p>
                            <p className="text-[11px] text-slate-400">
                              {formatCount(item.uniqueViewers)} unique
                            </p>
                          </td>

                          {/* Watch Time & Completion */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <p className="font-bold text-white">{item.avgWatchTimeFormatted}</p>
                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                              <span className="text-[11px] text-slate-400">{item.completionRate}%</span>
                              <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden inline-block">
                                <div
                                  className="h-full bg-cyan-400 rounded-full"
                                  style={{ width: `${item.completionRate}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Likes / Comments / Shares */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <p className="font-medium text-slate-200">
                              {formatCount(item.likes)} likes
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {formatCount(item.comments)} comm • {formatCount(item.shares)} shares
                            </p>
                          </td>

                          {/* Follower Conversions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span className="font-bold text-cyan-300">
                              +{item.followerConversions}
                            </span>
                          </td>

                          {/* Actions: View, Edit, Analytics, Delete */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Preview */}
                              <button
                                onClick={() => setPreviewingVideo(video)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title="View Video"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit details */}
                              <button
                                onClick={() => setEditingVideo(video)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                                title="Edit Caption & Privacy"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Analytics Deep Dive */}
                              <button
                                onClick={() => setInspectingItem(item)}
                                className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors cursor-pointer"
                                title="Review Performance"
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Video */}
                              <button
                                onClick={() => setDeletingVideo(video)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Delete Video"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredVideos.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <p className="text-sm font-semibold">No videos found</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Try adjusting your search terms or privacy filter.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: AUDIENCE & FOLLOWER GROWTH */}
        {/* ======================================================== */}
        {activeTab === 'audience' && dashboard && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-[#0d121c] border border-white/10 space-y-1">
                <span className="text-xs text-slate-400">Total Followers</span>
                <p className="text-2xl font-bold text-white">
                  {formatCount(dashboard.followersTotal)}
                </p>
                <p className="text-xs text-cyan-400">Live audience base</p>
              </div>

              <div className="p-5 rounded-xl bg-[#0d121c] border border-white/10 space-y-1">
                <span className="text-xs text-slate-400">Net Follower Growth</span>
                <p className="text-2xl font-bold text-emerald-400">
                  +{formatCount(dashboard.followerGrowth)}
                </p>
                <p className="text-xs text-slate-400">
                  +{dashboard.followerGrowthPct}% vs previous {dashboard.dateRangeLabel.toLowerCase()}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#0d121c] border border-white/10 space-y-1">
                <span className="text-xs text-slate-400">Follower Conversion Rate</span>
                <p className="text-2xl font-bold text-indigo-400">
                  {Math.round((dashboard.followerGrowth / Math.max(1, dashboard.totalViews)) * 10000) / 100}%
                </p>
                <p className="text-xs text-slate-400">Views converted into followers</p>
              </div>
            </div>

            {/* Follower Dynamics Chart */}
            <div className="p-6 rounded-2xl bg-[#0d121c] border border-white/10 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Follower Gain / Loss Dynamics
                </h3>
                <p className="text-xs text-slate-400">
                  Net new audience acquisition per interval
                </p>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboard.followerTimeseries}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const net = payload[0]?.value;
                          const gained = payload[1]?.value;
                          return (
                            <div className="bg-[#0b0f17] border border-white/15 px-3 py-2 rounded-xl shadow-2xl text-xs space-y-1">
                              <p className="font-semibold text-slate-300">{label}</p>
                              <p className="text-emerald-400 font-bold">
                                Gained: +{gained}
                              </p>
                              <p className="text-cyan-300 font-bold">
                                Net Change: +{net}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="netFollowers" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gained" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Follower Driving Videos */}
            <div className="p-6 rounded-2xl bg-[#0d121c] border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Top Videos Driving Follower Conversions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboard.videos
                  .sort((a, b) => b.followerConversions - a.followerConversions)
                  .slice(0, 3)
                  .map((item) => (
                    <div
                      key={item.videoId}
                      className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={item.video.thumbnailUrl}
                          alt=""
                          className="w-12 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">
                            {item.video.title || item.video.caption.slice(0, 30)}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {formatCount(item.views)} views
                          </p>
                          <p className="text-[11px] text-cyan-400 font-bold mt-1">
                            +{item.followerConversions} new followers
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setInspectingItem(item)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 transition-colors cursor-pointer shrink-0"
                      >
                        Inspect
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <VideoAnalyticsModal
        item={inspectingItem}
        isOpen={!!inspectingItem}
        onClose={() => setInspectingItem(null)}
        onPlayVideo={() => {
          if (inspectingItem) {
            setPreviewingVideo(inspectingItem.video);
            setInspectingItem(null);
          }
        }}
      />

      <VideoEditModal
        video={editingVideo}
        isOpen={!!editingVideo}
        onClose={() => setEditingVideo(null)}
        onVideoUpdated={handleVideoUpdated}
      />

      <DeleteConfirmModal
        video={deletingVideo}
        isOpen={!!deletingVideo}
        onClose={() => setDeletingVideo(null)}
        onVideoDeleted={handleVideoDeleted}
      />

      <VideoPreviewModal
        video={previewingVideo}
        isOpen={!!previewingVideo}
        onClose={() => setPreviewingVideo(null)}
        onOpenAnalytics={() => {
          if (previewingVideo && dashboard) {
            const match = dashboard.videos.find((i) => i.videoId === previewingVideo.id);
            if (match) {
              setInspectingItem(match);
            }
          }
        }}
      />
    </div>
  );
}
