export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar: string;
  bio: string;
  website?: string;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  role: 'user' | 'creator' | 'admin';
  isFollowing?: boolean;
}

export interface Sound {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  audioUrl?: string;
  durationSeconds: number;
  useCount: number;
}

export interface VideoDimensions {
  width: number;
  height: number;
}

export interface Video {
  id: string;
  authorId: string;
  author: User;
  title?: string;
  caption: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  dimensions?: VideoDimensions;
  fileSize?: number;
  visibility?: 'public' | 'followers' | 'private';
  processingStatus?: 'processing' | 'ready' | 'failed';
  created_at?: string;
  updated_at?: string;
  hashtags: string[];
  sound: Sound;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  sharesCount: number;
  viewsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: string;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  privacy: 'public' | 'followers' | 'private';
  allowComments?: boolean;
  allowDuet?: boolean;
  status: 'ready' | 'processing' | 'failed';
  isTakenDown?: boolean;
}

export interface FeedResponse {
  videos: Video[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface Comment {
  id: string;
  videoId: string;
  author: User;
  text: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
  repliesCount: number;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system';
  actor: User;
  videoId?: string;
  videoThumbnail?: string;
  text: string;
  read: boolean;
  createdAt: string;
}

export interface MessageReactionMap {
  [emoji: string]: string[]; // emoji key -> array of userIds
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  text: string;
  sentAt: string;
  read: boolean;
  readAt?: string;
  type?: 'text' | 'video' | 'profile';
  sharedVideo?: Video;
  sharedProfile?: User;
  reactions?: MessageReactionMap;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface MessageConversation {
  id: string;
  user: User;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderId?: string;
  unreadCount: number;
  isOnline?: boolean;
  lastSeen?: string;
  isBlockedByMe?: boolean;
  isBlockedByThem?: boolean;
  messages: ChatMessage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BlockedUserItem {
  id: string;
  user: User;
  blockedAt: string;
}

export interface ReportItem {
  id: string;
  videoId: string;
  videoCaption: string;
  authorUsername: string;
  reportedBy: string;
  reason: 'inappropriate' | 'spam' | 'harassment' | 'copyright' | 'misinformation';
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface VideoRetentionPoint {
  second: number;
  percent: number;
}

export interface VideoTrafficSource {
  source: string;
  percent: number;
}

export interface VideoAnalyticsItem {
  videoId: string;
  video: Video;
  views: number;
  uniqueViewers: number;
  avgWatchTimeSeconds: number;
  avgWatchTimeFormatted: string;
  completionRate: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followerConversions: number;
  retentionGraph: VideoRetentionPoint[];
  trafficSources: VideoTrafficSource[];
}

export type TimeFilterRange = '7d' | '28d' | '90d' | 'custom';

export interface CreatorStudioDashboard {
  timeRange: TimeFilterRange;
  dateRangeLabel: string;
  totalViews: number;
  viewsGrowth: number;
  totalLikes: number;
  likesGrowth: number;
  totalComments: number;
  commentsGrowth: number;
  totalShares: number;
  sharesGrowth: number;
  totalSaves: number;
  savesGrowth: number;
  followersTotal: number;
  followerGrowth: number;
  followerGrowthPct: number;
  totalWatchTimeHours: number;
  avgCompletionRate: number;
  timeseries: {
    date: string;
    views: number;
    watchTimeHours: number;
    likes: number;
    followersGained: number;
  }[];
  followerTimeseries: {
    date: string;
    netFollowers: number;
    gained: number;
    lost: number;
  }[];
  videos: VideoAnalyticsItem[];
}

export interface CreatorAnalytics {
  viewsTotal: number;
  viewsGrowth: number;
  watchTimeHours: number;
  followersNetChange: number;
  avgCompletionRate: number;
  engagementRate: number;
  recentViews: { day: string; views: number }[];
  audienceTopCountries: { country: string; percentage: number }[];
}

export type FeedType = 'foryou' | 'following' | 'trending';

export type AppRoute =
  | 'landing'
  | 'home'
  | 'explore'
  | 'following'
  | 'messages'
  | 'notifications'
  | 'profile'
  | 'upload'
  | 'settings'
  | 'admin'
  | 'studio'
  | 'login'
  | 'register'
  | 'forgot-password';

export interface UserSettings {
  account: {
    username: string;
    email: string;
    displayName: string;
    bio: string;
  };
  privacy: {
    isPrivateAccount: boolean;
    allowDuetWithMe: 'everyone' | 'friends' | 'no_one';
    allowCommentsFrom: 'everyone' | 'friends' | 'no_one';
    showLikedVideos: boolean;
  };
  notifications: {
    pushLikes: boolean;
    pushComments: boolean;
    pushNewFollowers: boolean;
    pushDirectMessages: boolean;
    emailDigest: boolean;
  };
}
