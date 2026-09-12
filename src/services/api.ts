import { User, Video, Comment, Sound, ReportItem, CreatorAnalytics, CreatorStudioDashboard, TimeFilterRange, FeedType, NotificationItem, MessageConversation, ChatMessage, MessageReactionMap, BlockedUserItem, FeedResponse } from '../types';

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
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(data.user));
    return data;
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
    const res = await fetch(`/api/users/${encodeURIComponent(username)}`);
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  async toggleFollow(userId: string): Promise<{ success: boolean; isFollowing: boolean; followersCount: number }> {
    const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle follow');
    return data;
  },

  // Feed with cursor pagination
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
    const res = await fetch(`/api/feed?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch feed');
    return res.json();
  },

  async getVideo(id: string): Promise<Video> {
    const res = await fetch(`/api/videos/${id}`);
    if (!res.ok) throw new Error('Failed to fetch video');
    return res.json();
  },

  async getVideoStatus(id: string): Promise<{ id: string; processingStatus: 'processing' | 'ready' | 'failed'; status: string; video: Video }> {
    const res = await fetch(`/api/videos/${id}/status`);
    if (!res.ok) throw new Error('Failed to fetch video status');
    return res.json();
  },

  // Interactions
  async toggleLike(videoId: string): Promise<{ success: boolean; isLiked: boolean; likesCount: number }> {
    const res = await fetch(`/api/videos/${videoId}/like`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle like');
    return data;
  },

  async toggleSave(videoId: string): Promise<{ success: boolean; isSaved: boolean; savesCount: number }> {
    const res = await fetch(`/api/videos/${videoId}/save`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle save');
    return data;
  },

  async recordShare(videoId: string): Promise<{ success: boolean; sharesCount: number }> {
    const res = await fetch(`/api/videos/${videoId}/share`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to record share');
    return res.json();
  },

  async recordView(
    videoId: string,
    payload?: { durationWatched?: number; percentWatched?: number; sessionToken?: string }
  ): Promise<{ success: boolean; viewsCount: number; counted?: boolean; reason?: string }> {
    const res = await fetch(`/api/videos/${videoId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    if (!res.ok) throw new Error('Failed to record view');
    return res.json();
  },

  // Comments
  async getComments(videoId: string): Promise<Comment[]> {
    const res = await fetch(`/api/videos/${videoId}/comments`);
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  },

  async addComment(videoId: string, text: string): Promise<Comment> {
    const res = await fetch(`/api/videos/${videoId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add comment');
    return data;
  },

  // Upload
  async uploadVideo(payload: {
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
  }): Promise<{ success: boolean; video: Video }> {
    const res = await fetch('/api/videos/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload video');
    return data;
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

  async getAdminReports(): Promise<{
    reports: (ReportItem & { isTakenDown: boolean })[];
    metrics: { totalVideos: number; activeUsers: number; pendingReports: number; totalViews: number };
  }> {
    const res = await fetch('/api/admin/reports');
    if (!res.ok) throw new Error('Failed to fetch admin reports');
    return res.json();
  },

  async takeModerationAction(reportId: string, action: 'take_down' | 'dismiss' | 'reinstate'): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/reports/${reportId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error('Failed to perform moderation action');
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
