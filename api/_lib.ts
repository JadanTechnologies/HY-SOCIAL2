import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface DBUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  avatar: string;
  bio: string;
  website?: string;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  role: 'user' | 'creator';
}

export interface DBSound {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  durationSeconds: number;
  useCount: number;
}

export interface DBVideo {
  id: string;
  authorId: string;
  title: string;
  caption: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  dimensions: { width: number; height: number };
  fileSize: number;
  visibility: 'public' | 'followers' | 'private';
  processingStatus: 'processing' | 'ready' | 'failed';
  created_at: string;
  updated_at: string;
  hashtags: string[];
  soundId: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  sharesCount: number;
  viewsCount: number;
  createdAt: string;
  privacy: 'public' | 'followers' | 'private';
  allowComments?: boolean;
  allowDuet?: boolean;
  status: 'ready' | 'processing' | 'failed';
  isTakenDown?: boolean;
}

export interface DBComment {
  id: string;
  videoId: string;
  authorId: string;
  text: string;
  createdAt: string;
  likesCount: number;
  repliesCount: number;
}

export interface DBNotification {
  id: string;
  recipientId: string;
  actorId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system';
  videoId?: string;
  videoThumbnail?: string;
  text: string;
  read: boolean;
  createdAt: string;
}

export interface DBMessageReactionMap {
  [emoji: string]: string[];
}

export interface DBMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  text: string;
  sentAt: string;
  read: boolean;
  readAt?: string;
  type?: 'text' | 'video' | 'profile';
  sharedVideoId?: string;
  sharedUserId?: string;
  reactions?: DBMessageReactionMap;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface DBMessageConversation {
  id: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageAt: string;
  lastSenderId?: string;
  createdAt: string;
  messages: DBMessage[];
}

export interface DBBlockedUser {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface DBMessageReport {
  id: string;
  conversationId: string;
  messageId?: string;
  reportedBy: string;
  targetUserId: string;
  reason: string;
  details?: string;
  createdAt: string;
}

export interface DBReport {
  id: string;
  videoId: string;
  reportedBy: string;
  reason: 'inappropriate' | 'spam' | 'harassment' | 'copyright' | 'misinformation';
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

// In-memory storage (per function invocation - for demo only)
const users: DBUser[] = [
  {
    id: 'u-jadan',
    email: 'jadanexpress.info@gmail.com',
    username: 'jadan',
    displayName: 'Jabir Dangaskiya',
    passwordHash: 'jadan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    bio: 'Tech innovator, Creator & Media Producer 🚀🇳🇬 | Building the future on HY | Kano & Abuja ✨',
    website: 'https://jadanexpress.info',
    verified: true,
    followersCount: 315000,
    followingCount: 280,
    likesCount: 4200000,
    role: 'creator',
  },
  {
    id: 'u-current',
    email: 'tobi@hy.app',
    username: 'tobi_bakare',
    displayName: 'Tobi Bakare',
    passwordHash: 'password123',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    bio: 'Filmmaker & Visual Storyteller 🎥 | Capturing Lagos golden hours & street stories 🇳🇬✨ Lekki, Lagos',
    website: 'https://tobibakare.ng',
    verified: true,
    followersCount: 184200,
    followingCount: 340,
    likesCount: 2420000,
    role: 'creator',
  },
  {
    id: 'u-1',
    email: 'amaka@hy.app',
    username: 'amaka_steps',
    displayName: 'Amaka Okafor',
    passwordHash: 'password123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    bio: 'Afrobeats & Amapiano choreographer 💃🏿 Lagos dance academy | Catch the rhythm 🇳🇬✨',
    website: 'https://amakasteps.com',
    verified: true,
    followersCount: 532000,
    followingCount: 180,
    likesCount: 6800000,
    role: 'creator',
  },
  {
    id: 'u-2',
    email: 'tunde@hy.app',
    username: 'tunde_soundz',
    displayName: 'Tunde Adebayo',
    passwordHash: 'password123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    bio: 'Afro-fusion music producer & audio architect 🎹 Lekki Phase 1, Lagos | Grammy season loading ⚡🇳🇬',
    website: 'https://tundesoundz.io',
    verified: true,
    followersCount: 398000,
    followingCount: 420,
    likesCount: 4300000,
    role: 'creator',
  },
  {
    id: 'u-3',
    email: 'kemi@hy.app',
    username: 'kemi_delights',
    displayName: 'Kemi Adeleke',
    passwordHash: 'password123',
    avatar: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=400&auto=format&fit=crop&q=80',
    bio: 'Jollof connoisseur, food creator & Naija street-food explorer 🍲 Suya & spicy treats 🌶️ Abuja & Lagos',
    website: 'https://kemidelights.ng',
    verified: true,
    followersCount: 267500,
    followingCount: 290,
    likesCount: 3890000,
    role: 'creator',
  },
  {
    id: 'u-4',
    email: 'emeka@hy.app',
    username: 'emeka_skates',
    displayName: 'Emeka Nwosu',
    passwordHash: 'password123',
    avatar: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400&auto=format&fit=crop&q=80',
    bio: 'Lagos street skater & concrete pioneer 🛹 National Stadium Surulere & TBS sessions 🇳🇬',
    verified: false,
    followersCount: 142000,
    followingCount: 195,
    likesCount: 1950000,
    role: 'creator',
  },
];

const sounds: DBSound[] = [
  { id: 's-1', title: 'Gbagbe (Afrobeats Instrumental)', author: 'Tunde Adebayo & The Lagos All-Stars', coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80', durationSeconds: 32, useCount: 248400 },
  { id: 's-2', title: 'Lekki Sunset Amapiano Log Drum', author: 'Amaka Okafor & DJ Spinall', coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80', durationSeconds: 26, useCount: 184300 },
  { id: 's-3', title: 'Ojuelegba Vibe (Acoustic Remix)', author: 'Mainland Strings Lagos', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80', durationSeconds: 28, useCount: 95100 },
  { id: 's-4', title: 'Naija Party Beat 128BPM', author: 'Sarz Type Beats Lagos', coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&auto=format&fit=crop&q=80', durationSeconds: 35, useCount: 163200 },
];

const videos: DBVideo[] = [
  { id: 'v-1', authorId: 'u-1', title: 'Lekki Amapiano Footwork Challenge', caption: 'Learned this new South African log-drum step and added Lagos energy! Wait for the drop at 0:08 💃🏿🔥 #afrobeats #amapiano #lagosdance #nigeria #vibes', videoUrl: '/videos/dance_flow.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80', hashtags: ['afrobeats', 'amapiano', 'lagosdance', 'nigeria', 'vibes'], soundId: 's-2', duration: 14, dimensions: { width: 720, height: 1280 }, fileSize: 1600000, visibility: 'public', processingStatus: 'ready', created_at: new Date(Date.now() - 3600000 * 4).toISOString(), updated_at: new Date(Date.now() - 3600000 * 4).toISOString(), likesCount: 142800, commentsCount: 3840, savesCount: 19200, sharesCount: 7850, viewsCount: 890400, createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), privacy: 'public', allowComments: true, allowDuet: true, status: 'ready' },
  { id: 'v-2', authorId: 'u-2', title: 'Producing an Afrobeats Banger in Lekki Phase 1', caption: 'Cooking up live melodies in the Lekki studio with pure Lagos energy! When that log drum drops 🎹⚡ #afrobeats #musicproducer #lagosmusic #burnaboy #wizkid', videoUrl: '/videos/cyberpunk_tokyo.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80', hashtags: ['afrobeats', 'musicproducer', 'lagosmusic', 'lagos', 'vibes'], soundId: 's-1', duration: 14, dimensions: { width: 720, height: 1280 }, fileSize: 1500000, visibility: 'public', processingStatus: 'ready', created_at: new Date(Date.now() - 3600000 * 8).toISOString(), updated_at: new Date(Date.now() - 3600000 * 8).toISOString(), likesCount: 289400, commentsCount: 5120, savesCount: 42100, sharesCount: 16400, viewsCount: 1420000, createdAt: new Date(Date.now() - 3600000 * 8).toISOString(), privacy: 'public', allowComments: true, allowDuet: true, status: 'ready' },
  { id: 'v-3', authorId: 'u-4', title: 'Skating through Marina & Lagos Island', caption: 'Dodging yellow Danfo buses and hitting a clean tre-flip on Marina road 🛹 Lagos traffic cannot stop this skate grind! #lagos #skateboarding #nigeria #marina #energy', videoUrl: '/videos/venice_skate.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=800&auto=format&fit=crop&q=80', hashtags: ['lagos', 'skateboarding', 'nigeria', 'marina', 'energy'], soundId: 's-3', duration: 14, dimensions: { width: 720, height: 1280 }, fileSize: 1600000, visibility: 'public', processingStatus: 'ready', created_at: new Date(Date.now() - 3600000 * 14).toISOString(), updated_at: new Date(Date.now() - 3600000 * 14).toISOString(), likesCount: 95400, commentsCount: 1420, savesCount: 8900, sharesCount: 4100, viewsCount: 540000, createdAt: new Date(Date.now() - 3600000 * 14).toISOString(), privacy: 'public', allowComments: true, allowDuet: true, status: 'ready' },
];

const userLikes = new Set<string>(['v-1', 'v-4']);
const userSaves = new Set<string>(['v-2']);
const userFollows = new Set<string>(['u-1', 'u-2']);
const notifications: DBNotification[] = [];
let currentUserId: string | null = 'u-current';

function enrichVideo(video: DBVideo) {
  const author = users.find((u) => u.id === video.authorId) || users[0];
  const sound = sounds.find((s) => s.id === video.soundId) || sounds[0];
  const enrichedAuthor = { ...author, isFollowing: currentUserId ? userFollows.has(author.id) : false };
  return { ...video, creator: enrichedAuthor, author: enrichedAuthor, sound, isLiked: currentUserId ? userLikes.has(video.id) : false, isSaved: currentUserId ? userSaves.has(video.id) : false };
}

function json(res: VercelResponse, data: any, status = 200) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res.status(status).json(data);
}

function getUserId(req: VercelRequest): string | null {
  return (req.headers['x-user-id'] as string) || currentUserId;
}

export { users, sounds, videos, userLikes, userSaves, userFollows, notifications, currentUserId, enrichVideo, json, getUserId, DBUser, DBSound, DBVideo, DBComment, DBNotification, DBMessage, DBMessageConversation, DBBlockedUser, DBMessageReport, DBReport };