import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Bell,
  Sliders,
  LogOut,
  Trash2,
  Check,
  AlertTriangle,
  Lock,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserSettings } from '../../types';

interface SettingsViewProps {
  onOpenEditProfile: () => void;
  onOpenForgotPassword: () => void;
  onOpenStudio?: () => void;
}

export function SettingsView({
  onOpenEditProfile,
  onOpenForgotPassword,
  onOpenStudio,
}: SettingsViewProps) {
  const { currentUser, logout } = useAuth();

  const [settings, setSettings] = useState<UserSettings>({
    account: {
      username: currentUser?.username || '',
      email: currentUser?.email || '',
      displayName: currentUser?.displayName || '',
      bio: currentUser?.bio || '',
    },
    privacy: {
      isPrivateAccount: false,
      allowDuetWithMe: 'everyone',
      allowCommentsFrom: 'everyone',
      showLikedVideos: true,
    },
    notifications: {
      pushLikes: true,
      pushComments: true,
      pushNewFollowers: true,
      pushDirectMessages: true,
      emailDigest: false,
    },
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleClearCache = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div id="settings-view-root" className="min-h-screen bg-[#070a0f] text-slate-100 pt-16 md:pt-20 pb-20 px-4 sm:px-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-brand text-white">Settings & Privacy</h1>
            <p className="text-xs text-slate-400">Manage account credentials, safety filters, and preferences</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Preferences saved</span>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Creator Tools Banner */}
        {onOpenStudio && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-[#0e131d] to-indigo-950/30 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Creator Studio</h3>
                <p className="text-xs text-slate-400">
                  Track video views, watch time, retention curves & manage your vibes
                </p>
              </div>
            </div>
            <button
              onClick={onOpenStudio}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-500/20 shrink-0"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Section 1: Account Information */}
        <section className="p-6 rounded-2xl bg-[#0e131d] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
            <User className="w-4 h-4 text-cyan-400" />
            <span>Account Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-slate-400 block mb-1 font-semibold">Username</span>
              <p className="text-sm font-mono bg-slate-900/80 px-3.5 py-2 rounded-xl border border-white/10 text-slate-200">
                @{currentUser?.username || 'anonymous'}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-1 font-semibold">Email</span>
              <p className="text-sm font-mono bg-slate-900/80 px-3.5 py-2 rounded-xl border border-white/10 text-slate-200">
                {currentUser?.email || 'user@hy.app'}
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onOpenEditProfile}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
            >
              Edit Profile Information
            </button>
            <button
              onClick={onOpenForgotPassword}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Change Password</span>
            </button>
          </div>
        </section>

        {/* Section 2: Privacy & Safety */}
        <section className="p-6 rounded-2xl bg-[#0e131d] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Privacy & Community Safety</span>
          </div>

          <div className="space-y-3 divide-y divide-white/5">
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-xs sm:text-sm font-bold text-white">Private Account</p>
                <p className="text-xs text-slate-400">Only approved followers can view your clips and likes</p>
              </div>
              <input
                type="checkbox"
                checked={settings.privacy.isPrivateAccount}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, isPrivateAccount: e.target.checked },
                  });
                  handleSave();
                }}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs sm:text-sm font-bold text-white">Who can comment on your vibes</p>
                <p className="text-xs text-slate-400">Filter unverified or non-follower comments</p>
              </div>
              <select
                value={settings.privacy.allowCommentsFrom}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, allowCommentsFrom: e.target.value as any },
                  });
                  handleSave();
                }}
                className="bg-slate-900 border border-white/15 text-xs text-white rounded-lg px-3 py-1.5 cursor-pointer"
              >
                <option value="everyone">Everyone</option>
                <option value="friends">Followers Only</option>
                <option value="no_one">No One</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs sm:text-sm font-bold text-white">Allow Duets & Remixes</p>
                <p className="text-xs text-slate-400">Permit creators to stitch or remix your original sound</p>
              </div>
              <select
                value={settings.privacy.allowDuetWithMe}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, allowDuetWithMe: e.target.value as any },
                  });
                  handleSave();
                }}
                className="bg-slate-900 border border-white/15 text-xs text-white rounded-lg px-3 py-1.5 cursor-pointer"
              >
                <option value="everyone">Everyone</option>
                <option value="friends">Followers Only</option>
                <option value="no_one">No One</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 3: Notification Preferences */}
        <section className="p-6 rounded-2xl bg-[#0e131d] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            <span>Push & Digest Notifications</span>
          </div>

          <div className="space-y-3 divide-y divide-white/5">
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs sm:text-sm text-slate-300">Likes on your vibes</span>
              <input
                type="checkbox"
                checked={settings.notifications.pushLikes}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, pushLikes: e.target.checked },
                  });
                  handleSave();
                }}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-xs sm:text-sm text-slate-300">Comments & replies</span>
              <input
                type="checkbox"
                checked={settings.notifications.pushComments}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, pushComments: e.target.checked },
                  });
                  handleSave();
                }}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-xs sm:text-sm text-slate-300">New followers</span>
              <input
                type="checkbox"
                checked={settings.notifications.pushNewFollowers}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, pushNewFollowers: e.target.checked },
                  });
                  handleSave();
                }}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* Section 4: Account Actions & Danger Zone */}
        <section className="p-6 rounded-2xl bg-rose-500/[0.03] border border-rose-500/20 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-rose-300 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Session & Storage</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleClearCache}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Clear Local Storage</span>
            </button>

            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-bold text-rose-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
