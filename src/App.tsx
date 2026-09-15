import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navigation/Navbar';
import { LandingView } from './components/Landing/LandingView';
import { VideoFeed } from './components/Feed/VideoFeed';
import { ExploreView } from './components/Explore/ExploreView';
import { ProfileView } from './components/Profile/ProfileView';
import { NotificationsView } from './components/Notifications/NotificationsView';
import { MessagesView } from './components/Messages/MessagesView';
import { SettingsView } from './components/Settings/SettingsView';
import { LoginModal } from './components/Auth/LoginModal';
import { RegisterModal } from './components/Auth/RegisterModal';
import { ForgotPasswordModal } from './components/Auth/ForgotPasswordModal';
import { SearchModal } from './components/Search/SearchModal';
import { CommentsDrawer } from './components/Comments/CommentsDrawer';
import { ShareModal } from './components/Share/ShareModal';
import { ReportModal } from './components/Report/ReportModal';
import { UploadModal } from './components/Upload/UploadModal';
import { EditProfileModal } from './components/Profile/EditProfileModal';
import { AnalyticsModal } from './components/CreatorStudio/AnalyticsModal';
import { CreatorStudioView } from './components/CreatorStudio/CreatorStudioView';
import { AppRoute, Video } from './types';
import { api } from './services/api';

function HYMain() {
  const { currentUser, isAuthenticated } = useAuth();
  const [activeRoute, setActiveRoute] = useState<AppRoute>('home');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [targetProfileUsername, setTargetProfileUsername] = useState<string | undefined>(undefined);
  const [unreadCount, setUnreadCount] = useState<number>(1);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [messagesTargetUser, setMessagesTargetUser] = useState<string | null>(null);
  const [messagesSharedVideo, setMessagesSharedVideo] = useState<Video | null>(null);

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Video interaction drawers
  const [activeCommentVideo, setActiveCommentVideo] = useState<Video | null>(null);
  const [activeShareVideo, setActiveShareVideo] = useState<Video | null>(null);
  const [activeReportVideo, setActiveReportVideo] = useState<Video | null>(null);

  // Fetch unread notifications & messages count
  useEffect(() => {
    if (isAuthenticated) {
      api.getNotifications()
        .then((res) => {
          const unread = res.notifications.filter((n) => !n.read).length;
          setUnreadCount(unread);
        })
        .catch(console.error);

      api.getUnreadMessagesCount()
        .then((res) => {
          setUnreadMessagesCount(res.unreadCount || 0);
        })
        .catch(console.error);
    }
  }, [isAuthenticated, activeRoute]);

  const handleSelectHashtag = (tag: string) => {
    setSelectedTag(tag);
    setActiveRoute('home');
  };

  const handleSelectUser = (username: string) => {
    setTargetProfileUsername(username);
    setActiveRoute('profile');
  };

  const handleSelectVideo = (video: Video) => {
    setSelectedTag(null);
    setActiveRoute('home');
  };

  const handleUploadSuccess = (newVideo: Video) => {
    setSelectedTag(null);
    setActiveRoute('home');
  };

  return (
    <div id="vibetok-root-container" className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Top / Bottom Navigation */}
      <Navbar
        activeRoute={activeRoute}
        setActiveRoute={(route) => {
          if (route === 'profile') {
            setTargetProfileUsername(currentUser?.username);
          }
          setActiveRoute(route);
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        unreadNotifsCount={unreadCount}
        unreadMessagesCount={unreadMessagesCount}
      />

      {/* Main View Router */}
      <main className="flex-1 w-full flex flex-col">
        {/* Landing Page (for unauthenticated intro or explicit view) */}
        {activeRoute === 'landing' && (
          <LandingView
            onExplore={() => setActiveRoute('home')}
            onLogin={() => setIsLoginOpen(true)}
            onRegister={() => setIsRegisterOpen(true)}
          />
        )}

        {/* Main Video Feed (Home / For You) */}
        {activeRoute === 'home' && (
          <VideoFeed
            initialTag={selectedTag}
            onClearTag={() => setSelectedTag(null)}
            onOpenComments={(v) => setActiveCommentVideo(v)}
            onOpenShare={(v) => setActiveShareVideo(v)}
            onOpenReport={(v) => setActiveReportVideo(v)}
            onSelectHashtag={handleSelectHashtag}
            onSelectUser={handleSelectUser}
            currentUser={currentUser}
          />
        )}

        {/* Following Feed */}
        {activeRoute === 'following' && (
          <div className="flex-1 flex flex-col">
            <div className="text-center pt-18 md:pt-20 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full border border-white/10">
                Following Creators Feed
              </span>
            </div>
            <VideoFeed
              initialTag={selectedTag}
              onClearTag={() => setSelectedTag(null)}
              onOpenComments={(v) => setActiveCommentVideo(v)}
              onOpenShare={(v) => setActiveShareVideo(v)}
              onOpenReport={(v) => setActiveReportVideo(v)}
              onSelectHashtag={handleSelectHashtag}
              onSelectUser={handleSelectUser}
              currentUser={currentUser}
            />
          </div>
        )}

        {/* Explore / Discover */}
        {activeRoute === 'explore' && (
          <ExploreView
            onSelectVideo={handleSelectVideo}
            onSelectHashtag={handleSelectHashtag}
            onSelectUser={handleSelectUser}
            currentUser={currentUser}
          />
        )}

        {/* Profile / Creator View */}
        {activeRoute === 'profile' && (
          <ProfileView
            username={targetProfileUsername}
            currentUser={currentUser}
            onSelectVideo={handleSelectVideo}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onOpenSettings={() => setActiveRoute('settings')}
            onOpenStudio={() => setActiveRoute('studio')}
            onOpenMessagesWithUser={(user) => {
              setMessagesTargetUser(user);
              setMessagesSharedVideo(null);
              setActiveRoute('messages');
            }}
          />
        )}

        {/* Creator Studio View (Phase 6) */}
        {activeRoute === 'studio' && (
          <div className="flex-1 pt-14 md:pt-16">
            <CreatorStudioView
              onOpenUpload={() => setIsUploadOpen(true)}
              onNavigateHome={() => setActiveRoute('home')}
            />
          </div>
        )}

        {/* Activity & Notifications */}
        {activeRoute === 'notifications' && (
          <NotificationsView
            onSelectUser={handleSelectUser}
            onSelectVideo={(vid) => {
              setActiveRoute('home');
            }}
            currentUser={currentUser}
          />
        )}

        {/* Direct Messages (Phase 7) */}
        {activeRoute === 'messages' && (
          <MessagesView
            onSelectUser={handleSelectUser}
            onSelectVideo={handleSelectVideo}
            currentUser={currentUser}
            initialTargetUsername={messagesTargetUser}
            initialSharedVideo={messagesSharedVideo}
          />
        )}

        {/* Settings View */}
        {activeRoute === 'settings' && (
          <SettingsView
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
            onOpenStudio={() => setActiveRoute('studio')}
          />
        )}
      </main>

      {/* Authentication Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onOpenRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
        onOpenForgotPassword={() => {
          setIsLoginOpen(false);
          setIsForgotPasswordOpen(true);
        }}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onOpenLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onOpenLogin={() => {
          setIsForgotPasswordOpen(false);
          setIsLoginOpen(true);
        }}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectUser={handleSelectUser}
        onSelectVideo={(_videoId) => {
          setSelectedTag(null);
          setActiveRoute('home');
        }}
        onSelectHashtag={handleSelectHashtag}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      {/* Comments Drawer */}
      <CommentsDrawer
        isOpen={Boolean(activeCommentVideo)}
        onClose={() => setActiveCommentVideo(null)}
        videoId={activeCommentVideo?.id || null}
        videoCaption={activeCommentVideo?.caption}
        currentUser={currentUser}
        onCommentAdded={() => {
          if (activeCommentVideo) {
            setActiveCommentVideo({
              ...activeCommentVideo,
              commentsCount: activeCommentVideo.commentsCount + 1,
            });
          }
        }}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={Boolean(activeShareVideo)}
        onClose={() => setActiveShareVideo(null)}
        video={activeShareVideo}
        onShareCompleted={() => {
          if (activeShareVideo) {
            setActiveShareVideo({
              ...activeShareVideo,
              sharesCount: activeShareVideo.sharesCount + 1,
            });
          }
        }}
        onShareToDM={(vid) => {
          setActiveShareVideo(null);
          setMessagesSharedVideo(vid);
          setMessagesTargetUser(null);
          setActiveRoute('messages');
        }}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={Boolean(activeReportVideo)}
        onClose={() => setActiveReportVideo(null)}
        video={activeReportVideo}
      />

      {/* Upload & Record Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      

      {/* Analytics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <HYMain />
      </AuthProvider>
    </ToastProvider>
  );
}
