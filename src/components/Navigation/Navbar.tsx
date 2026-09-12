import React, { useState } from 'react';
import {
  Home,
  Compass,
  PlusSquare,
  User,
  BarChart3,
  Search,
  Sparkles,
  Users,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { AppRoute, User as UserType } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  activeRoute: AppRoute;
  setActiveRoute: (route: AppRoute) => void;
  onOpenUpload: () => void;
  onOpenSearch: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  unreadNotifsCount?: number;
  unreadMessagesCount?: number;
}

export function Navbar({
  activeRoute,
  setActiveRoute,
  onOpenUpload,
  onOpenSearch,
  onOpenLogin,
  onOpenRegister,
  unreadNotifsCount = 0,
  unreadMessagesCount = 0,
}: NavbarProps) {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleAuthenticatedAction = (action: () => void) => {
    if (!isAuthenticated) {
      onOpenLogin();
    } else {
      action();
    }
  };

  return (
    <>
      {/* Desktop Navigation Header */}
      <header
        id="vibetok-desktop-nav"
        className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-[#070a0f]/95 backdrop-blur-md border-b border-white/10 z-40 px-6 items-center justify-between"
      >
        {/* Brand & Search */}
        <div className="flex items-center gap-6">
          <button
            id="desktop-logo-btn"
            onClick={() => setActiveRoute('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="font-brand text-2xl font-black tracking-tight text-white flex items-center gap-1">
                H<span className="text-cyan-400">Y</span>
              </span>
            </div>
          </button>

          {/* Search Trigger */}
          <button
            id="desktop-search-trigger"
            onClick={onOpenSearch}
            className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-all w-64 text-left cursor-pointer"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search vibes, creators...</span>
          </button>
        </div>

        {/* Desktop Primary Nav Links (Home, Explore, Following, Messages, Notifications, Profile) */}
        <nav className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/10">
          <button
            id="nav-tab-home"
            onClick={() => setActiveRoute('home')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeRoute === 'home'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            id="nav-tab-explore"
            onClick={() => setActiveRoute('explore')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeRoute === 'explore'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Explore</span>
          </button>

          <button
            id="nav-tab-following"
            onClick={() => handleAuthenticatedAction(() => setActiveRoute('following'))}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeRoute === 'following'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Following</span>
          </button>

          <button
            id="nav-tab-messages"
            onClick={() => handleAuthenticatedAction(() => setActiveRoute('messages'))}
            className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeRoute === 'messages'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages</span>
            {unreadMessagesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            )}
          </button>

          <button
            id="nav-tab-notifications"
            onClick={() => handleAuthenticatedAction(() => setActiveRoute('notifications'))}
            className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeRoute === 'notifications'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
            {unreadNotifsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            )}
          </button>

          <button
            id="nav-tab-studio"
            onClick={() => handleAuthenticatedAction(() => setActiveRoute('studio'))}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeRoute === 'studio'
                ? 'bg-white/15 text-cyan-300 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Studio</span>
          </button>

          <button
            id="nav-tab-profile"
            onClick={() => handleAuthenticatedAction(() => setActiveRoute('profile'))}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeRoute === 'profile'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </nav>

        {/* Right Actions: Create Button + Profile Menu / Auth Buttons */}
        <div className="flex items-center gap-3">
          {/* Create Button */}
          <button
            id="desktop-create-btn"
            onClick={() => handleAuthenticatedAction(onOpenUpload)}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-cyan-500/20 transition-all hover:scale-102 cursor-pointer"
          >
            <PlusSquare className="w-4 h-4" />
            <span>Create</span>
          </button>

          {isAuthenticated && currentUser ? (
            <div className="relative">
              <button
                id="desktop-user-menu-trigger"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 pl-1.5 pr-3 py-1.5 rounded-full transition-all cursor-pointer"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.displayName}
                  className="w-7 h-7 rounded-full object-cover border border-cyan-400/40"
                />
                <span className="text-xs font-semibold text-slate-200">
                  @{currentUser.username}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div
                  id="desktop-user-dropdown"
                  className="absolute right-0 mt-2 w-48 rounded-xl bg-[#0e131d] border border-white/15 py-1.5 shadow-2xl z-50 text-xs"
                >
                  <button
                    onClick={() => {
                      setActiveRoute('profile');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-white/10 flex items-center gap-2 text-slate-200"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveRoute('studio');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-white/10 flex items-center gap-2 text-cyan-300 font-semibold"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Creator Studio</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveRoute('settings');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-white/10 flex items-center gap-2 text-slate-200"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Settings</span>
                  </button>

                  <div className="my-1 border-t border-white/10"></div>

                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-white/10 flex items-center gap-2 text-rose-400"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="desktop-login-btn"
                onClick={onOpenLogin}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Log In
              </button>
              <button
                id="desktop-signup-btn"
                onClick={onOpenRegister}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Top Header */}
      <header
        id="vibetok-mobile-top-bar"
        className="md:hidden fixed top-0 left-0 right-0 h-14 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-40 px-4 flex items-center justify-between"
      >
        <button
          onClick={() => setActiveRoute('home')}
          className="flex items-center gap-2 focus:outline-none"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-400 to-rose-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
          </div>
          <span className="font-brand text-lg font-black tracking-tight text-white">
            H<span className="text-cyan-400">Y</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAuthenticatedAction(() => setActiveRoute('messages'))}
            className="relative w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
            aria-label="Direct Messages"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadMessagesCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400"></span>
            )}
          </button>
          {isAuthenticated && currentUser ? (
            <button
              onClick={() => setActiveRoute('profile')}
              className="w-8 h-8 rounded-full overflow-hidden border border-cyan-400/50"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.displayName}
                className="w-full h-full object-cover"
              />
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-3 py-1 rounded-full bg-cyan-500 text-slate-950 text-xs font-bold"
            >
              Log in
            </button>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation (Home, Discover, Create, Inbox, Profile) */}
      <nav
        id="vibetok-mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#070a0f]/95 backdrop-blur-xl border-t border-white/10 z-40 px-3 flex items-center justify-around"
      >
        {/* Home */}
        <button
          id="mobile-nav-home"
          onClick={() => setActiveRoute('home')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeRoute === 'home' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">Home</span>
        </button>

        {/* Discover */}
        <button
          id="mobile-nav-discover"
          onClick={() => setActiveRoute('explore')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeRoute === 'explore' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">Discover</span>
        </button>

        {/* Create Center Button */}
        <button
          id="mobile-nav-create"
          onClick={() => handleAuthenticatedAction(onOpenUpload)}
          className="relative -top-2 flex items-center justify-center w-12 h-10 rounded-xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-rose-500 text-white shadow-lg shadow-cyan-500/30 active:scale-95 transition-transform"
          aria-label="Upload Video"
        >
          <div className="w-[42px] h-[34px] rounded-[10px] bg-[#070a0f] flex items-center justify-center">
            <PlusSquare className="w-5 h-5 text-white" />
          </div>
        </button>

        {/* Inbox (Notifications + Messages) */}
        <button
          id="mobile-nav-inbox"
          onClick={() =>
            handleAuthenticatedAction(() =>
              setActiveRoute(activeRoute === 'messages' ? 'messages' : 'notifications')
            )
          }
          className={`relative flex flex-col items-center justify-center py-1 transition-colors ${
            activeRoute === 'notifications' || activeRoute === 'messages'
              ? 'text-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">Inbox</span>
          {(unreadNotifsCount > 0 || unreadMessagesCount > 0) && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-cyan-400"></span>
          )}
        </button>

        {/* Profile */}
        <button
          id="mobile-nav-profile"
          onClick={() => handleAuthenticatedAction(() => setActiveRoute('profile'))}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeRoute === 'profile' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">Profile</span>
        </button>
      </nav>
    </>
  );
}
