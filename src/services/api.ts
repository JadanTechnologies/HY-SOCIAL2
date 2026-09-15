import { User, Video, Comment, Sound, ReportItem, CreatorAnalytics, CreatorStudioDashboard, TimeFilterRange, FeedType, NotificationItem, MessageConversation, ChatMessage, MessageReactionMap, BlockedUserItem, FeedResponse } from '../types';
import { localVideoStorage } from './localVideoStorage';
import { localStorageDB } from './localStorageDB';

const STORAGE_KEY_AUTH = 'vibetok_auth_session';

async function getAllStoredVideos(): Promise<Video[]> {
  const [databaseVideos, uploadedVideos] = await Promise.all([
    Promise.resolve(localStorageDB.getVideos()),
    localVideoStorage.getLocalVideos(),
  ]);

  const videosById = new Map<string, Video>();
  databaseVideos.forEach((video) => videosById.set(video.id, video));
  uploadedVideos.forEach((video) => videosById.set(video.id, video));

  return Array.from(videosById.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export const api = {
  async getMe(): Promise<{ user: User | null; authenticated: boolean }> {
    const currentUserId = localStorageDB.getCurrentUserId();
    if (!currentUserId) return { user: null, authenticated: false };
    const user = localStorageDB.getUserById(currentUserId);
    if (!user) return { user: null, authenticated: false };
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
    return { user, authenticated: true };
  },

  async register(payload: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
  }): Promise<{ success: boolean; user: User }> {
    const cleanUsername = payload.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }
    const cleanEmail = payload.email.trim().toLowerCase();
    const existingUsers = localStorageDB.getUsersWithPassword();
    const existing = existingUsers.find(
      (u) => u.username.toLowerCase() === cleanUsername || u.email?.toLowerCase() === cleanEmail
    );
    if (existing) {
      if (existing.username.toLowerCase() === cleanUsername) {
        throw new Error('Username is already taken');
      }
      throw new Error('An account with this email already exists');
    }

    const newUser: User & { password?: string } = {
      id: `u-${Date.now()}`,
      email: cleanEmail,
      username: cleanUsername,
      displayName: payload.displayName?.trim() || cleanUsername,
      password: payload.password,
      avatar: '',
      bio: '',
      verified: false,
      followersCount: 0,
      followingCount: 0,
      likesCount: 0,
      role: 'user',
    };

    localStorageDB.saveUser(newUser);
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(newUser));
    localStorageDB.setCurrentUserId(newUser.id);

    return { success: true, user: newUser };
  },

  async login(payload: {
    identifier: string;
    password: string;
  }): Promise<{ success: boolean; user: User }> {
    const ident = payload.identifier.trim().toLowerCase();
    const users = localStorageDB.getUsersWithPassword();
    const user = users.find(
      (u) => u.username.toLowerCase() === ident || u.email?.toLowerCase() === ident
    );

    if (!user) {
      throw new Error('Account not found with provided username or email');
    }

    if (user.password && user.password !== payload.password) {
      throw new Error('Incorrect password. Please try again or use Forgot Password.');
    }

    const { password: _pw, ...safeUser } = user;
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(safeUser));
    localStorageDB.setCurrentUserId(user.id);

    return { success: true, user: safeUser };
  },

  async logout(): Promise<{ success: boolean }> {
    localStorage.removeItem(STORAGE_KEY_AUTH);
    localStorageDB.setCurrentUserId(null);
    return { success: true };
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const users = localStorageDB.getUsersWithPassword();
    const user = users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      throw new Error('No account found with this email address');
    }
    return { success: true, message: `Password reset verification link has been dispatched to ${email}.` };
  },

  async resetPassword(payload: { email: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    const users = localStorageDB.getUsersWithPassword();
    const user = users.find((u) => u.email?.toLowerCase() === payload.email.trim().toLowerCase());
    if (!user) {
      throw new Error('User not found');
    }
    user.password = payload.newPassword;
    localStorageDB.saveUser(user);
    return { success: true, message: 'Password updated successfully. Please log in.' };
  },

  async updateProfile(payload: {
    displayName?: string;
    bio?: string;
    avatar?: string;
    website?: string;
  }): Promise<{ success: boolean; user: User }> {
    const currentUserId = localStorageDB.getCurrentUserId();
    if (!currentUserId) throw new Error('Authentication required');
    const users = localStorageDB.getUsersWithPassword();
    const user = users.find((u) => u.id === currentUserId);
    if (!user) throw new Error('User not found');

    if (payload.displayName) user.displayName = payload.displayName.trim();
    if (payload.bio !== undefined) user.bio = payload.bio.trim();
    if (payload.avatar) user.avatar = payload.avatar.trim();
    if (payload.website !== undefined) user.website = payload.website.trim();

    localStorageDB.saveUser(user);
    const { password: _pw, ...safeUser } = user;
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(safeUser));
    return { success: true, user: safeUser };
  },

  async switchUser(userId: string): Promise<{ success: boolean; user: User }> {
    const user = localStorageDB.getUserById(userId);
    if (!user) throw new Error('User not found');
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
    localStorageDB.setCurrentUserId(userId);
    return { success: true, user };
  },

  async getUsers(): Promise<User[]> {
    return localStorageDB.getUsers();
  },

  async getUserProfile(username: string): Promise<{ user: User; videos: Video[] }> {
    const user = localStorageDB.getUserByUsername(username);
    if (!user) throw new Error('User profile not found');

    const allVideos = localStorageDB.getVideos();
    const userVideos = allVideos.filter((v) => v.authorId === user.id);

    // Merge with locally uploaded videos (IndexedDB)
    try {
      const localVideos = await localVideoStorage.getLocalVideos();
      const userLocals = localVideos.filter((v) => v.authorId === user.id);
      if (userLocals.length > 0) {
        const existingIds = new Set(userLocals.map((v) => v.id));
        const rest = userVideos.filter((v) => !existingIds.has(v.id));
        return { user, videos: [...userLocals, ...rest] };
      }
    } catch {}

    return { user, videos: userVideos };
  },

  async toggleFollow(userId: string): Promise<{ success: boolean; isFollowing: boolean; followersCount: number }> {
    return localStorageDB.toggleFollow(userId);
  },

  async getFeed(
    type: FeedType = 'foryou',
    tag?: string,
    cursor?: string | null,
    limit?: number
  ): Promise<FeedResponse> {
    const pageSize = Math.min(20, Math.max(1, limit || 20));
    const videos = await getAllStoredVideos();
    let filtered = videos.filter((video) => !video.isTakenDown);
    const currentUserId = localStorageDB.getCurrentUserId();

    if (tag) {
      const cleanTag = tag.replace('#', '').toLowerCase();
      filtered = filtered.filter((video) =>
        video.hashtags.some((hashtag) => hashtag.toLowerCase() === cleanTag)
      );
    } else if (type === 'following') {
      const following = localStorageDB.getFollowing();
      filtered = filtered.filter((video) => following.includes(video.authorId));
    } else if (type === 'trending') {
      filtered = [...filtered].sort(
        (a, b) =>
          b.likesCount + b.sharesCount * 2 - (a.likesCount + a.sharesCount * 2)
      );
    } else {
      filtered = [...filtered].sort((a, b) => {
        const followedBoost = (video: Video) =>
          currentUserId && video.authorId !== currentUserId
            ? localStorageDB.getFollowing().includes(video.authorId)
              ? 1.25
              : 1
            : 1;
        const engagementA =
          ((a.likesCount + a.savesCount * 2) / Math.max(1, a.viewsCount)) *
          followedBoost(a);
        const engagementB =
          ((b.likesCount + b.savesCount * 2) / Math.max(1, b.viewsCount)) *
          followedBoost(b);
        return engagementB - engagementA;
      });
    }

    let startIndex = 0;
    if (cursor) {
      const cursorIndex = filtered.findIndex((video) => video.id === cursor);
      if (cursorIndex !== -1) startIndex = cursorIndex + 1;
    }

    const page = filtered.slice(startIndex, startIndex + pageSize);
    const hasMore = startIndex + pageSize < filtered.length;
    return {
      videos: page,
      nextCursor: hasMore && page.length > 0 ? page[page.length - 1].id : null,
      hasMore,
      total: filtered.length,
    };
  },

  async getVideo(id: string): Promise<Video> {
    if (localVideoStorage.isLocalVideo(id)) {
      const local = await localVideoStorage.getLocalVideoById(id);
      if (local) return local;
    }
    const video = localStorageDB.getVideo(id);
    if (video) return video;
    throw new Error('Video not found');
  },

  async getVideoStatus(id: string): Promise<{ id: string; processingStatus: 'processing' | 'ready' | 'failed'; status: string; video: Video }> {
    if (localVideoStorage.isLocalVideo(id)) {
      const local = await localVideoStorage.getLocalVideoById(id);
      if (local) {
        return { id, processingStatus: 'ready', status: 'ready', video: local };
      }
    }
    const video = localStorageDB.getVideo(id);
    if (video) {
      return { id, processingStatus: video.processingStatus || 'ready', status: video.status || 'ready', video };
    }
    throw new Error('Video not found');
  },

  async toggleLike(videoId: string): Promise<{ success: boolean; isLiked: boolean; likesCount: number }> {
    if (localVideoStorage.isLocalVideo(videoId)) {
      return localVideoStorage.toggleLocalLike(videoId);
    }
    return localStorageDB.toggleLike(videoId);
  },

  async toggleSave(videoId: string): Promise<{ success: boolean; isSaved: boolean; savesCount: number }> {
    if (localVideoStorage.isLocalVideo(videoId)) {
      return localVideoStorage.toggleLocalSave(videoId);
    }
    return localStorageDB.toggleSave(videoId);
  },

  async recordShare(videoId: string): Promise<{ success: boolean; sharesCount: number }> {
    if (localVideoStorage.isLocalVideo(videoId)) {
      return localVideoStorage.recordLocalShare(videoId);
    }
    const video = localStorageDB.getVideo(videoId);
    if (!video) throw new Error('Video not found');
    video.sharesCount += 1;
    localStorageDB.saveVideo(video);
    return { success: true, sharesCount: video.sharesCount };
  },

  async recordView(
    videoId: string,
    payload?: { durationWatched?: number; percentWatched?: number; sessionToken?: string }
  ): Promise<{ success: boolean; viewsCount: number; counted?: boolean; reason?: string }> {
    if (localVideoStorage.isLocalVideo(videoId)) {
      const res = await localVideoStorage.recordLocalView(videoId);
      return { success: true, viewsCount: res.viewsCount, counted: true };
    }
    return localStorageDB.recordView(videoId);
  },

  async getComments(videoId: string): Promise<Comment[]> {
    const localComments = await localVideoStorage.getLocalComments(videoId);
    if (localVideoStorage.isLocalVideo(videoId)) {
      return localComments;
    }
    const serverComments = localStorageDB.getComments(videoId);
    const localIds = new Set(localComments.map((c) => c.id));
    return [...localComments, ...serverComments.filter((c) => !localIds.has(c.id))];
  },

  async addComment(videoId: string, text: string): Promise<Comment> {
    if (localVideoStorage.isLocalVideo(videoId)) {
      const currentUserId = localStorageDB.getCurrentUserId();
      if (!currentUserId) throw new Error('Please log in to comment');
      const author = localStorageDB.getUserById(currentUserId);
      if (!author) throw new Error('User not found');
      return localVideoStorage.addLocalComment(videoId, text, author);
    }

    const currentUserId = localStorageDB.getCurrentUserId();
    if (!currentUserId) throw new Error('Please log in to comment');
    const author = localStorageDB.getUserById(currentUserId);
    if (!author) throw new Error('User not found');

    const comment = localStorageDB.addComment(videoId, text, author);
    if (!comment) throw new Error('Failed to add comment');
    return comment;
  },

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
    const currentUserId = localStorageDB.getCurrentUserId();
    if (!currentUserId) throw new Error('Please log in to upload videos');

    const author = localStorageDB.getUserById(currentUserId);
    if (!author) throw new Error('User not found');

    const hashtagMatches = (payload.caption || '').match(/#[a-zA-Z0-9_]+/g) || [];
    const hashtags = hashtagMatches.map((h: string) => h.replace('#', '').toLowerCase());
    const now = new Date().toISOString();

    const newVideo: Video = {
      id: `v-${Date.now()}`,
      authorId: currentUserId,
      author,
      title: payload.title || payload.caption.slice(0, 40) || 'New Vibe',
      caption: payload.caption,
      videoUrl: payload.videoUrl,
      thumbnailUrl: payload.thumbnailUrl || '',
      duration: payload.duration || 15,
      dimensions: payload.dimensions || { width: 720, height: 1280 },
      fileSize: payload.fileSize || 4500000,
      visibility: payload.visibility || payload.privacy || 'public',
      privacy: payload.privacy || 'public',
      hashtags: hashtags.length > 0 ? hashtags : [],
      sound: {
        id: payload.soundId || 's-1',
        title: 'Original Sound - HY Studio',
        author: author.displayName,
        coverUrl: author.avatar,
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

    const storedVideo = await localVideoStorage.saveLocalVideo(newVideo, videoBlob);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hy-feed-updated', { detail: storedVideo }));
    }

    return { success: true, video: storedVideo };
  },

  async getNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    return localStorageDB.getNotifications();
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    localStorageDB.markAllNotificationsRead();
    return { success: true };
  },

  async getMessages(): Promise<{ conversations: MessageConversation[] }> {
    return { conversations: localStorageDB.getConversations() as MessageConversation[] };
  },

  async search(query: string): Promise<{
    videos: Video[];
    users: User[];
    sounds: Sound[];
    hashtags: string[];
  }> {
    const databaseSearch = localStorageDB.search(query);
    const uploadedVideos = (await getAllStoredVideos()).filter((video) => {
      const normalizedQuery = query.toLowerCase();
      return (
        video.title?.toLowerCase().includes(normalizedQuery) ||
        video.caption.toLowerCase().includes(normalizedQuery) ||
        video.hashtags.some((hashtag) => hashtag.includes(normalizedQuery))
      );
    });
    const uploadedIds = new Set(uploadedVideos.map((video) => video.id));
    const videos = [
      ...uploadedVideos,
      ...databaseSearch.videos.filter((video) => !uploadedIds.has(video.id)),
    ];
    const hashtags = Array.from(
      new Set([...databaseSearch.hashtags, ...videos.flatMap((video) => video.hashtags)])
    );

    return { videos, users: databaseSearch.users, sounds: databaseSearch.sounds, hashtags };
  },

  async getSounds(): Promise<Sound[]> {
    return localStorageDB.getSounds();
  },

  async reportVideo(payload: { videoId: string; reason: string; details?: string }): Promise<{ success: boolean }> {
    localStorageDB.addReport({
      id: `rep-${Date.now()}`,
      ...payload,
      reportedBy: localStorageDB.getCurrentUserId() || 'anonymous',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    return { success: true };
  },

  async getCreatorAnalytics(): Promise<CreatorAnalytics> {
    const videos = await getAllStoredVideos();
    const totalViews = videos.reduce((sum, v) => sum + v.viewsCount, 0);
    const totalLikes = videos.reduce((sum, v) => sum + v.likesCount, 0);
    const totalComments = videos.reduce((sum, v) => sum + v.commentsCount, 0);
    const totalShares = videos.reduce((sum, v) => sum + v.sharesCount, 0);
    return {
      viewsTotal: totalViews,
      viewsGrowth: 12.5,
      watchTimeHours: totalViews * 0.15,
      followersNetChange: videos.length * 3,
      avgCompletionRate: 65.5,
      engagementRate: (totalLikes + totalComments + totalShares) / Math.max(1, totalViews) * 100,
      recentViews: [],
      audienceTopCountries: [],
    };
  },

  async getCreatorStudioDashboard(
    _range: TimeFilterRange = '28d',
    _startDate?: string,
    _endDate?: string
  ): Promise<CreatorStudioDashboard> {
    const videos = await getAllStoredVideos();
    const totalViews = videos.reduce((sum, v) => sum + v.viewsCount, 0);
    const totalLikes = videos.reduce((sum, v) => sum + v.likesCount, 0);
    const totalComments = videos.reduce((sum, v) => sum + v.commentsCount, 0);
    const totalShares = videos.reduce((sum, v) => sum + v.sharesCount, 0);
    const totalSaves = videos.reduce((sum, v) => sum + v.savesCount, 0);
    const followersTotal = videos.length * 1000;
    return {
      timeRange: _range,
      dateRangeLabel: 'Last 28 days',
      totalViews,
      viewsGrowth: 15.2,
      totalLikes,
      likesGrowth: 8.7,
      totalComments,
      commentsGrowth: 11.3,
      totalShares,
      sharesGrowth: 5.4,
      totalSaves,
      savesGrowth: 9.1,
      followersTotal,
      followerGrowth: 342,
      followerGrowthPct: 12.5,
      totalWatchTimeHours: totalViews * 0.15,
      avgCompletionRate: 68.3,
      timeseries: [],
      followerTimeseries: [],
      videos: videos.map((v) => ({
        videoId: v.id,
        video: v,
        views: v.viewsCount,
        uniqueViewers: Math.floor(v.viewsCount * 0.7),
        avgWatchTimeSeconds: v.duration * 0.65,
        avgWatchTimeFormatted: `${Math.floor(v.duration * 0.65)}s`,
        completionRate: 65,
        likes: v.likesCount,
        comments: v.commentsCount,
        shares: v.sharesCount,
        saves: v.savesCount,
        followerConversions: Math.floor(v.likesCount * 0.02),
        retentionGraph: [],
        trafficSources: [],
      })),
    };
  },

  async updateCreatorVideo(
    videoId: string,
    payload: { title?: string; caption?: string; privacy?: 'public' | 'followers' | 'private' }
  ): Promise<{ success: boolean; video: Video }> {
    const video = localStorageDB.getVideo(videoId);
    if (!video) throw new Error('Video not found');
    if (payload.title) video.title = payload.title;
    if (payload.caption) video.caption = payload.caption;
    if (payload.privacy) {
      video.privacy = payload.privacy;
      video.visibility = payload.privacy;
    }
    localStorageDB.saveVideo(video);
    return { success: true, video };
  },

  async deleteCreatorVideo(videoId: string): Promise<{ success: boolean; deletedId: string }> {
    if (localVideoStorage.isLocalVideo(videoId)) {
      await localVideoStorage.deleteLocalVideo(videoId);
      return { success: true, deletedId: videoId };
    }

    const videos = localStorageDB.getVideos().filter((v) => v.id !== videoId);
    localStorage.setItem('hy_videos', JSON.stringify(videos));
    return { success: true, deletedId: videoId };
  },

  async getConversations(): Promise<{ conversations: MessageConversation[]; totalUnread: number }> {
    const conversations = localStorageDB.getConversations() as MessageConversation[];
    const currentUserId = localStorageDB.getCurrentUserId();
    const totalUnread = conversations.reduce(
      (sum, c) => sum + (c.unreadCount || 0),
      0
    );
    return { conversations, totalUnread };
  },

  async getUnreadMessagesCount(): Promise<{ unreadCount: number }> {
    const conversations = localStorageDB.getConversations() as MessageConversation[];
    const totalUnread = conversations.reduce(
      (sum, c) => sum + (c.unreadCount || 0),
      0
    );
    return { unreadCount: totalUnread };
  },

  async getConversation(conversationId: string): Promise<{ conversation: MessageConversation }> {
    const conv = localStorageDB.getConversation(conversationId) as MessageConversation;
    if (!conv) throw new Error('Conversation not found');
    return { conversation: conv };
  },

  async sendMessage(
    conversationId: string,
    payload: { text?: string; type?: 'text' | 'video' | 'profile'; sharedVideoId?: string; sharedUserId?: string }
  ): Promise<{ message: ChatMessage; conversation: MessageConversation }> {
    const res = localStorageDB.sendMessage(conversationId, payload);
    return { message: res.message as ChatMessage, conversation: res.conversation as MessageConversation };
  },

  async startConversation(payload: {
    targetUserId: string;
    initialText?: string;
    sharedVideoId?: string;
    sharedUserId?: string;
  }): Promise<{ conversation: MessageConversation }> {
    const conv = localStorageDB.startConversation(payload.targetUserId, payload.initialText);
    return { conversation: conv as MessageConversation };
  },

  async markConversationAsRead(conversationId: string): Promise<{ success: boolean; updatedCount: number }> {
    localStorageDB.markConversationRead(conversationId);
    return { success: true, updatedCount: 1 };
  },

  async toggleMessageReaction(
    conversationId: string,
    messageId: string,
    emoji: string
  ): Promise<{ success: boolean; reactions: MessageReactionMap }> {
    const res = localStorageDB.toggleMessageReaction(conversationId, messageId, emoji);
    return { success: res.success, reactions: res.reactions as MessageReactionMap };
  },

  async sendTypingStatus(_conversationId: string, _isTyping: boolean): Promise<{ success: boolean }> {
    return { success: true };
  },

  async blockUser(userId: string): Promise<{ success: boolean; isBlocked: boolean }> {
    return localStorageDB.blockUser(userId);
  },

  async unblockUser(userId: string): Promise<{ success: boolean; isBlocked: boolean }> {
    return localStorageDB.unblockUser(userId);
  },

  async getBlockedUsers(): Promise<{ blockedUsers: BlockedUserItem[] }> {
    const res = localStorageDB.getBlockedUsers();
    return { blockedUsers: res.blockedUsers as BlockedUserItem[] };
  },

  async searchUsers(query?: string): Promise<User[]> {
    if (!query || !query.trim()) {
      return this.getUsers();
    }
    const res = await this.search(query);
    return res.users || [];
  },

  async reportConversationOrMessage(_payload: {
    conversationId: string;
    messageId?: string;
    targetUserId: string;
    reason: string;
    details?: string;
  }): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Report submitted' };
  },
};
