import React, { useState, useEffect } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, AtSign, CheckCheck, Sparkles, Filter } from 'lucide-react';
import { NotificationItem, User as UserType } from '../../types';
import { api } from '../../services/api';
import { formatRelativeTime } from '../../utils/formatters';

interface NotificationsViewProps {
  onSelectUser: (username: string) => void;
  onSelectVideo?: (videoId: string) => void;
  currentUser: UserType | null;
}

export function NotificationsView({
  onSelectUser,
  onSelectVideo,
  currentUser,
}: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'like' | 'comment' | 'follow' | 'mention'>('all');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentUser]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications read', err);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const getIconForType = (type: NotificationItem['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="w-3.5 h-3.5 text-rose-400 fill-current" />;
      case 'comment':
        return <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />;
      case 'follow':
        return <UserPlus className="w-3.5 h-3.5 text-indigo-400" />;
      case 'mention':
        return <AtSign className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div id="notifications-view" className="min-h-screen bg-[#070a0f] text-slate-100 pt-16 md:pt-20 pb-20 px-4 sm:px-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-brand text-white">Activity & Notifications</h1>
            <p className="text-xs text-slate-400">Updates on your videos, interactions, and follows</p>
          </div>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            id="notifs-mark-read-btn"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
        {(['all', 'like', 'comment', 'follow', 'mention'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap capitalize transition-all ${
              filter === tab
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            {tab === 'all' ? 'All Activity' : `${tab}s`}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Loading activity stream...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No notifications here</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              When people like your videos, comment, or start following you, you'll see alerts here.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                item.read
                  ? 'bg-white/[0.02] border-white/5 text-slate-300'
                  : 'bg-cyan-500/[0.04] border-cyan-500/20 text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar with type badge */}
                <div className="relative shrink-0">
                  <img
                    src={item.actor.avatar}
                    alt={item.actor.displayName}
                    onClick={() => onSelectUser(item.actor.username)}
                    className="w-10 h-10 rounded-full object-cover border border-white/10 cursor-pointer hover:opacity-80"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-white/15 flex items-center justify-center">
                    {getIconForType(item.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm">
                    <button
                      onClick={() => onSelectUser(item.actor.username)}
                      className="font-bold text-white hover:underline cursor-pointer"
                    >
                      {item.actor.displayName}
                    </button>{' '}
                    <span className="text-slate-300">{item.text}</span>
                  </p>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
              </div>

              {/* Video Thumbnail (if attached) */}
              {item.videoThumbnail && (
                <div
                  onClick={() => item.videoId && onSelectVideo?.(item.videoId)}
                  className="w-10 h-14 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-slate-900 cursor-pointer hover:border-cyan-400 transition-colors"
                >
                  <img
                    src={item.videoThumbnail}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
