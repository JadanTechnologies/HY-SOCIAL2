import React, { useState, useEffect } from 'react';
import {
  User as UserType,
  Video,
} from '../../types';
import { api } from '../../services/api';
import { formatCount } from '../../utils/formatters';
import {
  Grid,
  Heart,
  Bookmark,
  Share2,
  Check,
  Plus,
  Play,
  Settings,
  Sparkles,
  Edit3,
  MessageSquare,
  Lock,
  Globe,
  BarChart3,
} from 'lucide-react';

interface ProfileViewProps {
  username?: string;
  currentUser: UserType | null;
  onSelectVideo: (video: Video) => void;
  onOpenUpload: () => void;
  onOpenEditProfile: () => void;
  onOpenSettings: () => void;
  onOpenStudio?: () => void;
  onOpenMessagesWithUser?: (username: string) => void;
}

export function ProfileView({
  username,
  currentUser,
  onSelectVideo,
  onOpenUpload,
  onOpenEditProfile,
  onOpenSettings,
  onOpenStudio,
  onOpenMessagesWithUser,
}: ProfileViewProps) {
  const targetUsername = username || currentUser?.username || 'tobi_bakare';
  const isOwnProfile = currentUser?.username.toLowerCase() === targetUsername.toLowerCase();

  const [profileUser, setProfileUser] = useState<UserType | null>(null);
  const [userVideos, setUserVideos] = useState<Video[]>([]);
  const [activeTab, setActiveTab] = useState<'videos' | 'liked' | 'saved'>('videos');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await api.getUserProfile(targetUsername);
        setProfileUser(res.user);
        setUserVideos(res.videos);
        setIsFollowing(Boolean(res.user.isFollowing));
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [targetUsername, currentUser]);

  const handleFollowToggle = async () => {
    if (!profileUser) return;
    try {
      const res = await api.toggleFollow(profileUser.id);
      setIsFollowing(res.isFollowing);
      setProfileUser((prev) =>
        prev ? { ...prev, followersCount: res.followersCount } : null
      );
    } catch (err) {
      console.error('Follow error', err);
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#070a0f] pt-24 text-center text-slate-400">
        <Sparkles className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
        <p className="text-xs">Loading creator profile...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="w-full min-h-screen bg-[#070a0f] pt-24 text-center text-slate-400">
        <p className="text-base text-white font-bold">Creator profile not found</p>
      </div>
    );
  }

  return (
    <div
      id="profile-view-main"
      className="w-full min-h-screen bg-[#070a0f] text-slate-100 pt-16 md:pt-20 pb-24 px-4 md:px-8 max-w-4xl mx-auto text-left"
    >
      {/* Profile Card Header */}
      <div className="bg-[#0e131d] border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <img
              src={profileUser.avatar}
              alt={profileUser.displayName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-cyan-400/40 shadow-xl"
            />
            {profileUser.verified && (
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-xs font-black shadow-md">
                ✓
              </span>
            )}
          </div>

          {/* User Info & Bio */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold font-brand text-white truncate">
                {profileUser.displayName}
              </h1>
              <span className="text-xs sm:text-sm font-semibold text-slate-400">
                @{profileUser.username}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed max-w-xl">
              {profileUser.bio || 'Creating original vibes on HY.'}
            </p>

            {profileUser.website && (
              <a
                href={profileUser.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline mt-2 font-medium"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{profileUser.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}

            {/* Counters: Followers, Following, Total Likes */}
            <div className="flex items-center gap-6 mt-4 pt-3 border-t border-white/5">
              <div>
                <span className="text-sm sm:text-base font-bold text-white">
                  {formatCount(profileUser.followingCount)}
                </span>
                <span className="text-[11px] text-slate-400 block">Following</span>
              </div>
              <div>
                <span className="text-sm sm:text-base font-bold text-white">
                  {formatCount(profileUser.followersCount)}
                </span>
                <span className="text-[11px] text-slate-400 block">Followers</span>
              </div>
              <div>
                <span className="text-sm sm:text-base font-bold text-white">
                  {formatCount(profileUser.likesCount)}
                </span>
                <span className="text-[11px] text-slate-400 block">Likes</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex sm:flex-col items-center gap-2 self-stretch sm:self-auto justify-end pt-2 sm:pt-0">
            {isOwnProfile ? (
              <>
                <button
                  id="profile-studio-btn"
                  onClick={onOpenStudio}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-transform active:scale-98 shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Creator Studio</span>
                </button>
                <div className="flex items-center gap-2 w-full">
                  <button
                    id="profile-edit-btn"
                    onClick={onOpenEditProfile}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    id="profile-settings-btn"
                    onClick={onOpenSettings}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  id="profile-follow-btn"
                  onClick={handleFollowToggle}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all active:scale-98 cursor-pointer whitespace-nowrap ${
                    isFollowing
                      ? 'bg-white/10 hover:bg-white/15 border border-white/15 text-white'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onOpenMessagesWithUser?.(profileUser.username)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Direct Message"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>

                <button
                  onClick={handleShareProfile}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Share Profile"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {copiedLink && (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-in fade-in">
            Link copied to clipboard!
          </div>
        )}
      </div>

      {/* Profile Tabs (Videos, Liked, Saved) */}
      <div className="flex items-center justify-center border-b border-white/10 mt-8 mb-6">
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'videos'
              ? 'border-cyan-400 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Videos ({userVideos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('liked')}
          className={`flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'liked'
              ? 'border-cyan-400 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Liked</span>
          {!isOwnProfile && <Lock className="w-3 h-3 text-slate-500 ml-0.5" />}
        </button>

        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'saved'
                ? 'border-cyan-400 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved</span>
          </button>
        )}
      </div>

      {/* Grid Content */}
      {activeTab === 'videos' ? (
        userVideos.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">No videos published yet</p>
            {isOwnProfile && (
              <button
                onClick={onOpenUpload}
                className="mt-4 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
              >
                Upload your first vibe
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {userVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => onSelectVideo(video)}
                className="group relative rounded-xl overflow-hidden aspect-[9/14] bg-slate-900 border border-white/10 shadow-md cursor-pointer hover:border-cyan-400/50 transition-all"
              >
                <img
                  src={video.thumbnailUrl}
                  alt={video.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <span className="text-xs font-bold text-white line-clamp-2 leading-snug">
                    {video.caption}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-semibold mt-1">
                    <Play className="w-3 h-3 fill-current" />
                    <span>{formatCount(video.viewsCount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'liked' ? (
        !isOwnProfile ? (
          <div className="py-16 text-center text-slate-400">
            <Lock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">This user's liked videos are private</p>
            <p className="text-xs text-slate-500 mt-1">Videos liked by @{profileUser.username} are currently hidden.</p>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <Heart className="w-8 h-8 text-rose-500/40 mx-auto mb-2" />
            <p className="text-sm text-slate-300">Your favorite and liked videos are saved to your account stream.</p>
          </div>
        )
      ) : (
        <div className="py-12 text-center text-slate-400">
          <Bookmark className="w-8 h-8 text-amber-500/40 mx-auto mb-2" />
          <p className="text-sm text-slate-300">Only you can see your bookmarked vibes.</p>
        </div>
      )}
    </div>
  );
}
