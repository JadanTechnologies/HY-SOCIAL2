import { User, Video, Comment, Sound, ReportItem, CreatorAnalytics, CreatorStudioDashboard, TimeFilterRange, FeedType, NotificationItem, MessageConversation, ChatMessage, MessageReactionMap, BlockedUserItem, FeedResponse } from '../types';
import { localVideoStorage } from './localVideoStorage';

const STORAGE_KEY_AUTH = 'vibetok_auth_session';

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.id) {
        headers['x-user-id'] = u.id;
      }
    }
  } catch {}
  return headers;
}

export const api = {
  // Current user & session
  async getMe(): Promise<{ user: User | null; authenticated: boolean }> {
    try {
      const res = await fetch('/api/me');
      if (!res.ok) throw new Error('Failed to fetch user');
      const data = await res.json();
      if (data.authenticated && data.user) {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(data.user));
      }
      return data;
    } catch {
      // Offline / fallback from localStorage
      const cached = localStorage.getItem(STORAGE_KEY_AUTH);
      if (cached) {
        try {
          return { user: JSON.parse(cached), authenticated: true };
        } catch {
          // ignore
        }
      }
      return { user: null, authenticated: false };
    }
  },

  async register(payload: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
  }): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(data.user));
    return data;
  },

  async login(payload: {
    identifier: string;
    password: string;
  }): Promise<{ success: boolean; user: User }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(data.user));
        return data;
      }
    } catch (err) {
      console.warn('[API] Backend login request error, checking local users', err);
    }

    // Local / Offline fallback support for jadan and preset users
    const ident = payload.identifier.trim().toLowerCase();
    if ((ident === 'jadan' || ident === 'jadanexpress.info@gmail.com') && payload.password === 'jadan') {
      const jadanUser: User = {
        id: 'u-jadan',
        email: 'jadanexpress.info@gmail.com',
        username: 'jadan',
        displayName: 'Jabir Dangaskiya',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        bio: 'Tech innovator, Creator & Media Producer 🚀🇳🇬 | Building the future on HY | Kano & Abuja ✨',
        website: 'https://jadanexpress.info',
        verified: true,
        followersCount: 315000,
        followingCount: 280,
        likesCount: 4200000,
        role: 'creator',
      };
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(jadanUser));
      return { success: true, user: jadanUser };
    }

    throw new Error('Invalid username or password');
  },

  async logout(): Promise<{ success: boolean }> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
    return { success: true };
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset failed');
    return data;
  },

  async resetPassword(payload: { email: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password update failed');
    return data;
  },

  async updateProfile(payload: {
    displayName?: string;
    bio?: string;
    avatar?: string;
    website?: string;
  }): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Profile update failed');
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(data.user));
    return data;
  },

  async switchUser(userId: string): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/auth/switch-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to switch user');
    const data = await res.json();
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(data.user));
    return data;
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getUserProfile(username: string): Promise<{ user: User; videos: Video[] }> {
    let profileData: { user: User; videos: Video[] } = {
      user: {
        id: `u-${username}`,
        username,
        displayName: username,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        bio: '',
        verified: false,
        followersCount: 0,
        followingCount: 0,
        likesCount: 0,
        role: 'user',
      },
      videos: [],
    };

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}`);
      if (res.ok) {
        profileData = await res.json();
      }
    } catch (e) {
      console.warn('[API] Backend user profile fetch error', e);
    }

    // Merge locally saved videos authored by this user
    try {
      const localVideos = await localVideoStorage.getLocalVideos();
      const userLocals = localVideos.filter(
        (v) => v.author?.username?.toLowerCase() === username.toLowerCase()
      );
      if (userLocals.length > 0) {
        const existingIds = new Set(userLocals.map((v) => v.id));
        const rest = profileData.videos.filter((v) => !existingIds.has(v.id));
        profileData.videos = [...userLocals, ...rest];
      }
    } catch {}

    return profileData;
  },

  async toggleFollow(userId: string): Promise<{ success: boolean; isFollowing: boolean; followersCount: number }> {
    const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle follow');
    return data;
  },

  // Feed with cursor pagination & local storage integration
  async getFeed(
    type: FeedType = 'foryou',
    tag?: string,
    cursor?: string | null,
    limit?: number
  ): Promise<FeedResponse> {
    const query = new URLSearchParams();
    query.set('type', type);
    if (tag) query.set('tag', tag);
    if (cursor) query.set('cursor', cursor);
    if (limit) query.set('limit', limit.toString());

    let backendResponse: FeedResponse = {
      videos: [],
      nextCursor: null,
      hasMore: false,
      total: 0,
    };

    try {
      const res = await fetch(`/api/feed?${query.toString()}`);
      if (res.ok) {
        backendResponse = await res.json();
      }
    } catch (err) {
      console.warn('[API] Backend feed request failed, falling back to local videos', err);
    }

    // Retrieve locally saved videos
    let localVideos: Video[] = [];
    try {
      localVideos = await localVideoStorage.getLocalVideos();
    } catch (err) {
      console.warn('[API] Local storage getLocalVideos error', err);
    }

    // Filter local videos by tag if present
    let matchedLocal = localVideos;
    if (tag) {
      const cleanTag = tag.replace('#', '').toLowerCase();
      matchedLocal = localVideos.filter((v) =>
        v.hashtags.some((h) => h.toLowerCase() === cleanTag)
      );
    }

    // If on first page (no cursor), prepend locally saved content to the feed
    let combinedVideos: Video[] = [];
    if (!cursor) {
      const localIdSet = new Set(matchedLocal.map((v) => v.id));
      const filteredBackend = backendResponse.videos.filter((v) => !localIdSet.has(v.id));
      combinedVideos = [...matchedLocal, ...filteredBackend];
    } else {
      combinedVideos = backendResponse.videos;
    }

    return {
      videos: combinedVideos,
      nextCursor: backendResponse.nextCursor,
      hasMore: backendResponse.hasMore,
      total: backendResponse.total + matchedLocal.length,
    };
  },

  async getVideo(id: string): Promise<Video> {
    if (localVideoStorage.isLocalVideo(id)) {
      const local = await localVideoStorage.getLocalVideoById(id);
      if (local) return local;
    }
    const res = await fetch(`/api/videos/${id}`);
    if (!res.ok) {
      const local = await localVideoStorage.getLocalVideoById(id);
      if (local) return local;
      throw new Error('Failed to fetch video');
    }
    return res.json();
  },

  async getVideoStatus(id: string): Promise<{ id: string; processingStatus: 'processing' | 'ready' | 'failed'; status: string; video: Video }> {
    if (localVideoStorage.isLocalVideo(id)) {
      const local = await localVideoStorage.getLocalVideoById(id);
      if (local) {
        return { id, processingStatus: 'ready', status: 'ready', video: local };
      }
    }
    const res = await fetch(`/api/videos/${id}/status`);
    if (!res.ok) throw new Error('Failed to fetch video status');
    return res.json();
  },

  // Interactions (delegating to localVideoStorage if local video)
  async toggleLike(videoId: string): Promise<{ success: boolean; isLiked: boolean; likesCount: number }> {
    if (localVideoStorage.isLocalVideo(videoId)) {
      return localVideoStorage.toggleLocalLike(videoId);
    }
    try {
      const res = await fetch(`/api/videos/${videoId}/like`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle like');
      return data;
    } catch {
      return localVideoStorage.toggleLocalLike(videoId);
    }
  },

  async toggleSave(videoId: string): Promise<{ success: boolean; isSaved: boolean; savesCount: number }> {
    if (localVideoStorage.isLocalVideo(videoId)) {
      return localVideoStorage.toggleLocalSave(videoId);
    }
    try {
      const res = await fetch(`/api/videos/${videoId}/save`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle save');
      return data;
    } catch {
      return localVideoStorage.toggleLocalSave(videoId);
    }
  },

  async recordShare(videoId: string): Promise<{ success: boolean; sharesCount: number }> {
    if (localVideoStorage.isLocalVideo(videoId)) {
      return localVideoStorage.recordLocalShare(videoId);
    }
    try {
      const res = await fetch(`/api/videos/${videoId}/share`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to record share');
      return res.json();
    } catch {
      return localVideoStorage.recordLocalShare(videoId);
    }
  },

  async recordView(
    videoId: string,
    payload?: { durationWatched?: number; percentWatched?: number; sessionToken?: string }
  ): Promise<{ success: boolean; viewsCount: number; counted?: boolean; reason?: string }> {
    if (localVideoStorage.isLocalVideo(videoId)) {
      const res = await localVideoStorage.recordLocalView(videoId);
      return { success: true, viewsCount: res.viewsCount, counted: true };
    }
    try {
      const res = await fetch(`/api/videos/${videoId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
      });
      if (!res.ok) throw new Error('Failed to record view');
      return res.json();
    } catch {
      return localVideoStorage.recordLocalView(videoId);
    }
  },

  // Comments (delegating or combining with local comments)
  async getComments(videoId: string): Promise<Comment[]> {
    const localComments = await localVideoStorage.getLocalComments(videoId);
    if (localVideoStorage.isLocalVideo(videoId)) {
      return localComments;
    }
    try {
      const res = await fetch(`/api/videos/${videoId}/comments`);
      if (!res.ok) return localComments;
      const serverComments: Comment[] = await res.json();
      const localIds = new Set(localComments.map((c) => c.id));
      return [...localComments, ...serverComments.filter((c) => !localIds.has(c.id))];
    } catch {
      return localComments;
    }
  },

  async addComment(videoId: string, text: string): Promise<Comment> {
    if (localVideoStorage.isLocalVideo(videoId)) {
      let author: User = {
        id: 'u-jadan',
        email: 'jadanexpress.info@gmail.com',
        username: 'jadan',
        displayName: 'Jabir Dangaskiya',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        bio: 'Tech innovator, Creator & Media Producer 🚀🇳🇬 | Building the future on HY',
        verified: true,
        followersCount: 315000,
        followingCount: 280,
        likesCount: 4200000,
        role: 'creator',
      };
      try {
        const raw = localStorage.getItem(STORAGE_KEY_AUTH);
        if (raw) author = JSON.parse(raw);
      } catch {}
      return localVideoStorage.addLocalComment(videoId, text, author);
    }

    const res = await fetch(`/api/videos/${videoId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add comment');
    return data;
  },

  // Upload (with real video Blob persistence in local storage)
  async uploadVideo(
    payload: {
      videoUrl: string;
      thumbnailUrl?: string;
      title?: string;
      caption: string;
      duration?: number;
      dimensions?: { width: number; height: number };
      fileSize?: number;
      visibility?: 'public' | 'followers' | 'private';
      soundId?: string;
      privacy?: 'public' | 'followers' | 'private';
      allowComments?: boolean;
      allowDuet?: boolean;
    },
    videoBlob?: Blob | File
  ): Promise<{ success: boolean; video: Video }> {
    let videoResult: Video | null = null;

    // Try posting to backend database
    try {
      const res = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.video) {
          videoResult = data.video;
        }
      }
    } catch (err) {
      console.warn('[API] Backend video upload failed, continuing with local storage service', err);
    }

    // Fallback construct if backend is refining or down
    if (!videoResult) {
      let currentUser: User = {
        id: 'u-jadan',
        email: 'jadanexpress.info@gmail.com',
        username: 'jadan',
        displayName: 'Jabir Dangaskiya',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        bio: 'Tech innovator, Creator & Media Producer 🚀🇳🇬 | Building the future on HY | Kano & Abuja ✨',
        website: 'https://jadanexpress.info',
        verified: true,
        followersCount: 315000,
        followingCount: 280,
        likesCount: 4200000,
        role: 'creator',
      };
      try {
        const raw = localStorage.getItem(STORAGE_KEY_AUTH);
        if (raw) currentUser = JSON.parse(raw);
      } catch {}

      const hashtagMatches = (payload.caption || '').match(/#[a-zA-Z0-9_]+/g) || [];
      const hashtags = hashtagMatches.map((h: string) => h.replace('#', '').toLowerCase());
      const now = new Date().toISOString();

      videoResult = {
        id: `v-local-${Date.now()}`,
        authorId: currentUser.id,
        author: currentUser,
        title: payload.title || payload.caption.slice(0, 40) || 'New Vibe',
        caption: payload.caption,
        videoUrl: payload.videoUrl,
        thumbnailUrl: payload.thumbnailUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
        duration: payload.duration || 15,
        dimensions: payload.dimensions || { width: 720, height: 1280 },
        fileSize: payload.fileSize || 4500000,
        visibility: payload.visibility || payload.privacy || 'public',
        privacy: payload.privacy || 'public',
        hashtags: hashtags.length > 0 ? hashtags : ['hy', 'vibes'],
        sound: {
          id: payload.soundId || 's-1',
          title: 'Original Sound - HY Studio',
          author: currentUser.displayName,
          coverUrl: currentUser.avatar,
          durationSeconds: payload.duration || 15,
          useCount: 1,
        },
        likesCount: 0,
        commentsCount: 0,
        savesCount: 0,
        sharesCount: 0,
        viewsCount: 1,
        isLiked: false,
        isSaved: false,
        createdAt: now,
        status: 'ready',
        processingStatus: 'ready',
        allowComments: payload.allowComments ?? true,
        allowDuet: payload.allowDuet ?? true,
      };
    }

    // Persist video and binary videoBlob into local storage layer
    const storedVideo = await localVideoStorage.saveLocalVideo(videoResult, videoBlob);
    return { success: true, video: storedVideo };
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    const res = await fetch('/api/notifications');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    const res = await fetch('/api/notifications/read-all', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to mark read');
    return res.json();
  },

  // Messages
  async getMessages(): Promise<{ conversations: MessageConversation[] }> {
    const res = await fetch('/api/messages');
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  // Search
  async search(query: string): Promise<{
    videos: Video[];
    users: User[];
    sounds: Sound[];
    hashtags: string[];
  }> {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  // Sounds
  async getSounds(): Promise<Sound[]> {
    const res = await fetch('/api/sounds');
    if (!res.ok) throw new Error('Failed to fetch sounds');
    return res.json();
  },

  // Reporting & Moderation
  async reportVideo(payload: { videoId: string; reason: string; details?: string }): Promise<{ success: boolean }> {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to submit report');
    return res.json();
  },

  // Creator Analytics
  async getCreatorAnalytics(): Promise<CreatorAnalytics> {
    const res = await fetch('/api/creator/analytics');
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  // Creator Studio Dashboard (Phase 6)
  async getCreatorStudioDashboard(
    range: TimeFilterRange = '28d',
    startDate?: string,
    endDate?: string
  ): Promise<CreatorStudioDashboard> {
    const params = new URLSearchParams();
    params.set('range', range);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    const res = await fetch(`/api/creator/dashboard?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch creator dashboard');
    return res.json();
  },

  async updateCreatorVideo(
    videoId: string,
    payload: { title?: string; caption?: string; privacy?: 'public' | 'followers' | 'private' }
  ): Promise<{ success: boolean; video: Video }> {
    const res = await fetch(`/api/creator/videos/${videoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update video');
    return data;
  },

  async deleteCreatorVideo(videoId: string): Promise<{ success: boolean; deletedId: string }> {
    const res = await fetch(`/api/creator/videos/${videoId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete video');
    return data;
  },

  // ==========================================
  // PHASE 7: REAL-TIME MESSAGING API METHODS
  // ==========================================
  async getConversations(): Promise<{ conversations: MessageConversation[]; totalUnread: number }> {
    const res = await fetch('/api/messages', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  async getUnreadMessagesCount(): Promise<{ unreadCount: number }> {
    const res = await fetch('/api/messages/unread-count', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return { unreadCount: 0 };
    return res.json();
  },

  async getConversation(conversationId: string): Promise<{ conversation: MessageConversation }> {
    const res = await fetch(`/api/messages/${conversationId}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch conversation');
    return data;
  },

  async sendMessage(
    conversationId: string,
    payload: {
      text?: string;
      type?: 'text' | 'video' | 'profile';
      sharedVideoId?: string;
      sharedUserId?: string;
    }
  ): Promise<{ message: ChatMessage; conversation: MessageConversation }> {
    const res = await fetch(`/api/messages/${conversationId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send message');
    return data;
  },

  async startConversation(payload: {
    targetUserId: string;
    initialText?: string;
    sharedVideoId?: string;
    sharedUserId?: string;
  }): Promise<{ conversation: MessageConversation }> {
    const res = await fetch('/api/messages/start', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to start conversation');
    return data;
  },

  async markConversationAsRead(conversationId: string): Promise<{ success: boolean; updatedCount: number }> {
    const res = await fetch(`/api/messages/${conversationId}/read`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark conversation as read');
    return res.json();
  },

  async toggleMessageReaction(
    conversationId: string,
    messageId: string,
    emoji: string
  ): Promise<{ success: boolean; reactions: MessageReactionMap }> {
    const res = await fetch(`/api/messages/${conversationId}/reaction`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ messageId, emoji }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update reaction');
    return data;
  },

  async sendTypingStatus(conversationId: string, isTyping: boolean): Promise<{ success: boolean }> {
    const res = await fetch(`/api/messages/${conversationId}/typing`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isTyping }),
    });
    if (!res.ok) return { success: false };
    return res.json();
  },

  async blockUser(userId: string): Promise<{ success: boolean; isBlocked: boolean }> {
    const res = await fetch(`/api/users/${userId}/block`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to block user');
    return data;
  },

  async unblockUser(userId: string): Promise<{ success: boolean; isBlocked: boolean }> {
    const res = await fetch(`/api/users/${userId}/unblock`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to unblock user');
    return data;
  },

  async getBlockedUsers(): Promise<{ blockedUsers: BlockedUserItem[] }> {
    const res = await fetch('/api/users/blocked', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch blocked users');
    return res.json();
  },

  async searchUsers(query?: string): Promise<User[]> {
    if (!query || !query.trim()) {
      return this.getUsers();
    }
    const res = await this.search(query);
    return res.users || [];
  },

  async reportConversationOrMessage(payload: {
    conversationId: string;
    messageId?: string;
    targetUserId: string;
    reason: string;
    details?: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/messages/report', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit report');
    return data;
  },
};
