import { User, Video, Comment, Sound, FeedResponse, FeedType } from '../types';

const KEYS = {
  USERS: 'hy_users',
  CURRENT_USER_ID: 'hy_current_user_id',
  VIDEOS: 'hy_videos',
  SOUNDS: 'hy_sounds',
  USER_LIKES: 'hy_user_likes',
  USER_SAVES: 'hy_user_saves',
  USER_FOLLOWS: 'hy_user_follows',
  COMMENTS: 'hy_comments',
  NOTIFICATIONS: 'hy_notifications',
  MESSAGES: 'hy_messages',
  VIEWS: 'hy_views',
  INITIALIZED: 'hy_initialized',
};

interface StoredUser extends User {
  password?: string;
}

interface StoredVideo extends Omit<Video, 'author' | 'sound'> {
  authorId: string;
  soundId?: string;
}

function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function setToStorage(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('[LocalStorageDB] Failed to save', key, err);
  }
}

function seedData(): void {
  if (localStorage.getItem(KEYS.INITIALIZED)) return;
  setToStorage(KEYS.USERS, []);
  setToStorage(KEYS.SOUNDS, []);
  setToStorage(KEYS.VIDEOS, []);
  setToStorage(KEYS.COMMENTS, []);
  setToStorage(KEYS.USER_LIKES, []);
  setToStorage(KEYS.USER_SAVES, []);
  setToStorage(KEYS.USER_FOLLOWS, []);
  setToStorage(KEYS.NOTIFICATIONS, []);
  setToStorage(KEYS.MESSAGES, []);
  setToStorage(KEYS.VIEWS, {});
  setToStorage(KEYS.INITIALIZED, 'true');
}

export interface UserWithPassword extends User {
  password?: string;
}

export interface FollowState {
  following: string[];
  followers: Record<string, number>;
}

export interface LikeState {
  videoIds: string[];
}

export interface SaveState {
  videoIds: string[];
}

export const localStorageDB = {
  // ---- Initialization ----
  init(): void {
    seedData();
  },

  // ---- Users ----
  getUsers(): User[] {
    const users = getFromStorage<User[]>(KEYS.USERS, []);
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      email: u.email,
      avatar: u.avatar,
      bio: u.bio,
      website: u.website,
      verified: u.verified,
      followersCount: u.followersCount,
      followingCount: u.followingCount,
      likesCount: u.likesCount,
      role: u.role,
    }));
  },

  getUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find((u) => u.id === id) || null;
  },

  getUserByUsername(username: string): User | null {
    const users = this.getUsers();
    return users.find((u) => u.username.toLowerCase() === username.toLowerCase()) || null;
  },

  saveUser(user: UserWithPassword): void {
    const users = this.getUsersWithPassword();
    const existing = users.findIndex((u) => u.id === user.id);
    if (existing !== -1) {
      users[existing] = user;
    } else {
      users.push(user);
    }
    setToStorage(KEYS.USERS, users);
  },

  getUsersWithPassword(): UserWithPassword[] {
    return getFromStorage<UserWithPassword[]>(KEYS.USERS, []);
  },

  // ---- Current Session ----
  getCurrentUserId(): string | null {
    return localStorage.getItem(KEYS.CURRENT_USER_ID);
  },

  setCurrentUserId(id: string | null): void {
    if (id) {
      localStorage.setItem(KEYS.CURRENT_USER_ID, id);
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER_ID);
    }
  },

  // ---- Videos ----
  getVideos(): Video[] {
    const videos = getFromStorage<StoredVideo[]>(KEYS.VIDEOS, []);
    return videos.map((v) => {
      const author = this.getUserById(v.authorId) || {
        id: v.authorId,
        username: 'unknown',
        displayName: 'Unknown',
        avatar: '',
        bio: '',
        verified: false,
        followersCount: 0,
        followingCount: 0,
        likesCount: 0,
        role: 'user' as const,
      };
      const sound = this.getSounds().find((s) => s.id === v.soundId) || {
        id: 's-1',
        title: 'Original Sound',
        author: author.displayName,
        coverUrl: '',
        durationSeconds: v.duration,
        useCount: 1,
      };
      return {
        ...v,
        author,
        sound,
        isLiked: this.isLiked(v.id),
        isSaved: this.isSaved(v.id),
      };
    });
  },

  getVideo(id: string): Video | null {
    const videos = this.getVideos();
    return videos.find((v) => v.id === id) || null;
  },

  saveVideo(video: Video): void {
    const videos = getFromStorage<StoredVideo[]>(KEYS.VIDEOS, []);
    const stored = video as StoredVideo;
    const existing = videos.findIndex((v) => v.id === video.id);
    if (existing !== -1) {
      videos[existing] = stored;
    } else {
      videos.unshift(stored);
    }
    setToStorage(KEYS.VIDEOS, videos);
  },

  // ---- Sounds ----
  getSounds(): Sound[] {
    return getFromStorage<Sound[]>(KEYS.SOUNDS, []);
  },

  // ---- Feed ----
  getFeed(type: FeedType = 'foryou', tag?: string, cursor?: string | null, limit = 20): FeedResponse {
    let videos = this.getVideos().filter((v) => !v.isTakenDown);

    if (tag) {
      const cleanTag = tag.replace('#', '').toLowerCase();
      videos = videos.filter((v) => v.hashtags.some((h) => h.toLowerCase() === cleanTag));
    } else if (type === 'following') {
      const following = this.getFollowing();
      videos = videos.filter((v) => following.includes(v.authorId));
    } else if (type === 'trending') {
      videos = [...videos].sort(
        (a, b) => (b.likesCount + b.sharesCount * 2) - (a.likesCount + a.sharesCount * 2)
      );
    } else {
      videos = [...videos].sort((a, b) => {
        const aFollowBoost = this.getFollowing().includes(a.authorId) ? 1.3 : 1.0;
        const bFollowBoost = this.getFollowing().includes(b.authorId) ? 1.3 : 1.0;
        const aEngagement = (a.likesCount + a.savesCount * 2) / Math.max(1, a.viewsCount);
        const bEngagement = (b.likesCount + b.savesCount * 2) / Math.max(1, b.viewsCount);
        return bEngagement * bFollowBoost - aEngagement * aFollowBoost;
      });
    }

    let startIndex = 0;
    if (cursor) {
      const cursorIdx = videos.findIndex((v) => v.id === cursor);
      if (cursorIdx !== -1) startIndex = cursorIdx + 1;
    }

    const paginated = videos.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < videos.length;
    const nextCursor = hasMore && paginated.length > 0 ? paginated[paginated.length - 1].id : null;

    return { videos: paginated, nextCursor, hasMore, total: videos.length };
  },

  // ---- Interactions ----
  getFollowing(): string[] {
    return getFromStorage<string[]>(KEYS.USER_FOLLOWS, []);
  },

  toggleFollow(userId: string): { success: boolean; isFollowing: boolean; followersCount: number } {
    const following = this.getFollowing();
    const targetUser = this.getUserById(userId);
    if (!targetUser) return { success: false, isFollowing: false, followersCount: 0 };

    let isFollowing: boolean;
    if (following.includes(userId)) {
      const idx = following.indexOf(userId);
      following.splice(idx, 1);
      targetUser.followersCount = Math.max(0, targetUser.followersCount - 1);
      isFollowing = false;
    } else {
      following.push(userId);
      targetUser.followersCount += 1;
      isFollowing = true;
    }

    setToStorage(KEYS.USER_FOLLOWS, following);
    this.saveUser(targetUser);

    return { success: true, isFollowing, followersCount: targetUser.followersCount };
  },

  isLiked(videoId: string): boolean {
    const likes = getFromStorage<string[]>(KEYS.USER_LIKES, []);
    return likes.includes(videoId);
  },

  toggleLike(videoId: string): { success: boolean; isLiked: boolean; likesCount: number } {
    const videos = this.getVideos();
    const video = videos.find((v) => v.id === videoId);
    if (!video) return { success: false, isLiked: false, likesCount: 0 };

    const likes = getFromStorage<string[]>(KEYS.USER_LIKES, []);
    let isLiked: boolean;
    if (likes.includes(videoId)) {
      const idx = likes.indexOf(videoId);
      likes.splice(idx, 1);
      video.likesCount = Math.max(0, video.likesCount - 1);
      isLiked = false;
    } else {
      likes.push(videoId);
      video.likesCount += 1;
      isLiked = true;
    }

    setToStorage(KEYS.USER_LIKES, likes);
    this.saveVideo(video);

    return { success: true, isLiked, likesCount: video.likesCount };
  },

  isSaved(videoId: string): boolean {
    const saves = getFromStorage<string[]>(KEYS.USER_SAVES, []);
    return saves.includes(videoId);
  },

  toggleSave(videoId: string): { success: boolean; isSaved: boolean; savesCount: number } {
    const videos = this.getVideos();
    const video = videos.find((v) => v.id === videoId);
    if (!video) return { success: false, isSaved: false, savesCount: 0 };

    const saves = getFromStorage<string[]>(KEYS.USER_SAVES, []);
    let isSaved: boolean;
    if (saves.includes(videoId)) {
      const idx = saves.indexOf(videoId);
      saves.splice(idx, 1);
      video.savesCount = Math.max(0, video.savesCount - 1);
      isSaved = false;
    } else {
      saves.push(videoId);
      video.savesCount += 1;
      isSaved = true;
    }

    setToStorage(KEYS.USER_SAVES, saves);
    this.saveVideo(video);

    return { success: true, isSaved, savesCount: video.savesCount };
  },

  // ---- Comments ----
  getComments(videoId: string): Comment[] {
    const allComments = getFromStorage<Comment[]>(KEYS.COMMENTS, []);
    return allComments.filter((c) => c.videoId === videoId);
  },

  addComment(videoId: string, text: string, author: User): Comment | null {
    const allComments = getFromStorage<Comment[]>(KEYS.COMMENTS, []);
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      videoId,
      author,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      likesCount: 0,
      repliesCount: 0,
    };
    allComments.unshift(newComment);
    setToStorage(KEYS.COMMENTS, allComments);

    const video = this.getVideo(videoId);
    if (video) {
      video.commentsCount += 1;
      this.saveVideo(video);
    }

    return newComment;
  },

  // ---- Notifications ----
  getNotifications(): { notifications: any[]; unreadCount: number } {
    const currentUserId = this.getCurrentUserId();
    const allNotifs: any[] = getFromStorage(KEYS.NOTIFICATIONS, []);
    const userNotifs = allNotifs.filter((n) => n.recipientId === currentUserId);
    return { notifications: userNotifs, unreadCount: userNotifs.filter((n) => !n.read).length };
  },

  addNotification(notification: any): void {
    const allNotifs = getFromStorage<any[]>(KEYS.NOTIFICATIONS, []);
    allNotifs.unshift(notification);
    setToStorage(KEYS.NOTIFICATIONS, allNotifs);
  },

  markAllNotificationsRead(): void {
    const currentUserId = this.getCurrentUserId();
    const allNotifs = getFromStorage<any[]>(KEYS.NOTIFICATIONS, []);
    allNotifs.forEach((n) => {
      if (n.recipientId === currentUserId) n.read = true;
    });
    setToStorage(KEYS.NOTIFICATIONS, allNotifs);
  },

  // ---- Views ----
  recordView(videoId: string): { success: boolean; viewsCount: number; counted: boolean } {
    const views = getFromStorage<Record<string, number>>(KEYS.VIEWS, {});
    const key = `${videoId}`;
    const now = Date.now();
    const cooldownMs = 5 * 60 * 1000;
    const lastView = views[key] || 0;

    if (now - lastView > cooldownMs) {
      views[key] = now;
      setToStorage(KEYS.VIEWS, views);
      const video = this.getVideo(videoId);
      if (video) {
        video.viewsCount += 1;
        this.saveVideo(video);
      }
      return { success: true, viewsCount: video?.viewsCount || 1, counted: true };
    }

    const video = this.getVideo(videoId);
    return { success: true, viewsCount: video?.viewsCount || 1, counted: false };
  },

  // ---- Search ----
  search(query: string): { videos: Video[]; users: User[]; sounds: Sound[]; hashtags: string[] } {
    const q = query.toLowerCase();
    const users = this.getUsers().filter(
      (u) => u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)
    );
    const videos = this.getVideos().filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.caption.toLowerCase().includes(q) ||
        v.hashtags.some((h) => h.includes(q))
    );
    const sounds = this.getSounds().filter(
      (s) => s.title.toLowerCase().includes(q) || s.author.toLowerCase().includes(q)
    );
    const allHashtags: string[] = [];
    this.getVideos().forEach((v) => v.hashtags.forEach((h) => allHashtags.push(h)));
    const hashtagSet = new Set(allHashtags.filter((h) => h.includes(q)));
    const hashtags = Array.from(hashtagSet);
    return { videos, users, sounds, hashtags };
  },

// ---- Messages ----
  getConversations(): any[] {
    return getFromStorage<any[]>(KEYS.MESSAGES, []);
  },

  saveConversations(conversations: any[]): void {
    setToStorage(KEYS.MESSAGES, conversations);
  },

  getConversation(conversationId: string): any | null {
    const conversations = this.getConversations();
    return conversations.find((c) => c.id === conversationId) || null;
  },

  startConversation(targetUserId: string, initialText?: string): any {
    const targetUser = this.getUserById(targetUserId);
    if (!targetUser) throw new Error('User not found');
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) throw new Error('Authentication required');

    const conversations = this.getConversations();
    const existing = conversations.find(
      (c) => c.user.id === targetUserId || c.participantIds?.includes(targetUserId)
    );
    if (existing) return existing;

    const newConv: any = {
      id: `conv-${Date.now()}`,
      user: targetUser,
      participantIds: [currentUserId, targetUserId],
      lastMessage: initialText || '',
      lastMessageAt: new Date().toISOString(),
      lastSenderId: initialText ? currentUserId : undefined,
      unreadCount: 0,
      isOnline: false,
      isBlockedByMe: false,
      isBlockedByThem: false,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (initialText) {
      const msg: any = {
        id: `msg-${Date.now()}`,
        conversationId: newConv.id,
        senderId: currentUserId,
        recipientId: targetUserId,
        text: initialText,
        sentAt: new Date().toISOString(),
        read: false,
        type: 'text',
        status: 'sent',
      };
      newConv.messages.push(msg);
      newConv.lastMessage = initialText;
      newConv.lastSenderId = currentUserId;
    }

    conversations.unshift(newConv);
    this.saveConversations(conversations);
    return newConv;
  },

  sendMessage(conversationId: string, payload: { text?: string; type?: string; sharedVideoId?: string; sharedUserId?: string }): any {
    const conversations = this.getConversations();
    const idx = conversations.findIndex((c) => c.id === conversationId);
    if (idx === -1) throw new Error('Conversation not found');

    const conv = conversations[idx];
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) throw new Error('Authentication required');

    const text = payload.text || '';
    let messageText = text;
    if (payload.type === 'video') {
      const video = this.getVideo(payload.sharedVideoId || '');
      messageText = text || `Shared a video${video ? ` by @${video.author.username}` : ''}`;
    } else if (payload.type === 'profile') {
      const profileUser = this.getUserById(payload.sharedUserId || '');
      messageText = text || `Shared creator card${profileUser ? ` for @${profileUser.username}` : ''}`;
    }

    const newMsg: any = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      conversationId,
      senderId: currentUserId,
      recipientId: conv.user.id,
      text: messageText,
      sentAt: new Date().toISOString(),
      read: false,
      type: payload.type || 'text',
      status: 'sent',
      reactions: {},
    };

    if (payload.type === 'video' && payload.sharedVideoId) {
      newMsg.sharedVideo = this.getVideo(payload.sharedVideoId) || undefined;
    }
    if (payload.type === 'profile' && payload.sharedUserId) {
      newMsg.sharedProfile = this.getUserById(payload.sharedUserId) || undefined;
    }

    conv.messages.push(newMsg);
    conv.lastMessage = messageText;
    conv.lastMessageAt = newMsg.sentAt;
    conv.lastSenderId = currentUserId;
    conv.updatedAt = newMsg.sentAt;

    this.saveConversations(conversations);
    return { message: newMsg, conversation: conv };
  },

  markConversationRead(conversationId: string): void {
    const conversations = this.getConversations();
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    const currentUserId = this.getCurrentUserId();
    conv.messages.forEach((m: any) => {
      if (m.recipientId === currentUserId) {
        m.read = true;
        m.readAt = new Date().toISOString();
        m.status = 'read';
      }
    });
    conv.unreadCount = 0;
    this.saveConversations(conversations);
  },

  toggleMessageReaction(conversationId: string, messageId: string, emoji: string): { success: boolean; reactions: any } {
    const conversations = this.getConversations();
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) throw new Error('Conversation not found');
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) throw new Error('Authentication required');

    const msg = conv.messages.find((m: any) => m.id === messageId);
    if (!msg) throw new Error('Message not found');

    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

    const userIndex = msg.reactions[emoji].indexOf(currentUserId);
    if (userIndex !== -1) {
      msg.reactions[emoji].splice(userIndex, 1);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    } else {
      msg.reactions[emoji].push(currentUserId);
    }

    this.saveConversations(conversations);
    return { success: true, reactions: msg.reactions };
  },

  blockUser(userId: string): { success: boolean; isBlocked: boolean } {
    const conversations = this.getConversations();
    const conv = conversations.find((c) => c.user.id === userId);
    if (conv) {
      conv.isBlockedByMe = true;
      this.saveConversations(conversations);
    }
    return { success: true, isBlocked: true };
  },

  unblockUser(userId: string): { success: boolean; isBlocked: boolean } {
    const conversations = this.getConversations();
    const conv = conversations.find((c) => c.user.id === userId);
    if (conv) {
      conv.isBlockedByMe = false;
      this.saveConversations(conversations);
    }
    return { success: true, isBlocked: false };
  },

  getBlockedUsers(): { blockedUsers: any[] } {
    const conversations = this.getConversations();
    const blocked = conversations
      .filter((c) => c.isBlockedByMe)
      .map((c) => ({ id: c.user.id, user: c.user, blockedAt: c.updatedAt || new Date().toISOString() }));
    return { blockedUsers: blocked };
  },

  // ---- Reports ----
  addReport(report: any): void {
    const reports = getFromStorage<any[]>('hy_reports', []);
    reports.push(report);
    setToStorage('hy_reports', reports);
  },

  // ---- Profile Update ----
  updateProfile(updates: Partial<User>): boolean {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) return false;
    const users = this.getUsersWithPassword();
    const user = users.find((u) => u.id === currentUserId);
    if (!user) return false;

    Object.assign(user, updates);
    setToStorage(KEYS.USERS, users);
    return true;
  },
};

