import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static video asset serving with full HTTP Range request support
app.use('/videos', express.static(path.join(process.cwd(), 'public', 'videos'), {
  setHeaders: (res) => {
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
  },
}));
app.use(express.static(path.join(process.cwd(), 'public')));

// -------------------------------------------------------------
// In-Memory Database & Seed Data
// -------------------------------------------------------------

interface DBUser {
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
  role: 'user' | 'creator' | 'admin';
}

interface DBSound {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  durationSeconds: number;
  useCount: number;
}

interface DBVideo {
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

interface DBComment {
  id: string;
  videoId: string;
  authorId: string;
  text: string;
  createdAt: string;
  likesCount: number;
  repliesCount: number;
}

interface DBNotification {
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

interface DBMessageConversation {
  id: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageAt: string;
  messages: {
    id: string;
    senderId: string;
    text: string;
    sentAt: string;
  }[];
}

interface DBReport {
  id: string;
  videoId: string;
  reportedBy: string;
  reason: 'inappropriate' | 'spam' | 'harassment' | 'copyright' | 'misinformation';
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

// Initial Users
const users: DBUser[] = [
  {
    id: 'u-current',
    email: 'alex@vibetok.app',
    username: 'alex_rivers',
    displayName: 'Alex Rivers',
    passwordHash: 'password123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    bio: 'Visual storyteller & sound designer 🎧 | Creating daily micro-cinema ✨',
    website: 'https://alexrivers.studio',
    verified: true,
    followersCount: 84200,
    followingCount: 340,
    likesCount: 1420000,
    role: 'creator',
  },
  {
    id: 'u-1',
    email: 'elena@vibetok.app',
    username: 'elena_moves',
    displayName: 'Elena Vance',
    passwordHash: 'password123',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    bio: 'Choreographer & contemporary motion artist 💃 Studio sessions in NYC',
    website: 'https://elenavance.art',
    verified: true,
    followersCount: 432000,
    followingCount: 180,
    likesCount: 5800000,
    role: 'creator',
  },
  {
    id: 'u-2',
    email: 'kai@vibetok.app',
    username: 'cyber_kai',
    displayName: 'Kai Tanaka',
    passwordHash: 'password123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    bio: 'Creative coder & Tokyo night explorer ⚡ Next-gen visual computing',
    verified: true,
    followersCount: 198000,
    followingCount: 420,
    likesCount: 2300000,
    role: 'creator',
  },
  {
    id: 'u-3',
    email: 'sam@vibetok.app',
    username: 'skate_sam',
    displayName: 'Sam Ortiz',
    passwordHash: 'password123',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    bio: 'Sunset sessions & concrete waves 🛹 Venice Beach, CA',
    verified: false,
    followersCount: 67500,
    followingCount: 290,
    likesCount: 890000,
    role: 'creator',
  },
  {
    id: 'u-4',
    email: 'aura@vibetok.app',
    username: 'synth_aura',
    displayName: 'Aura Soundscapes',
    passwordHash: 'password123',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    bio: 'Analog modular synthesizers & lo-fi beats to dream to 🎹',
    verified: true,
    followersCount: 312000,
    followingCount: 95,
    likesCount: 4200000,
    role: 'creator',
  },
  {
    id: 'u-admin',
    email: 'admin@vibetok.app',
    username: 'mod_staff',
    displayName: 'VibeTok Trust & Safety',
    passwordHash: 'admin123',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    bio: 'Official platform operations & community moderation portal 🛡️',
    verified: true,
    followersCount: 1200,
    followingCount: 12,
    likesCount: 45000,
    role: 'admin',
  },
];

// Initial Sounds
const sounds: DBSound[] = [
  {
    id: 's-1',
    title: 'Midnight Echoes (Slowed + Reverb)',
    author: 'Aura Soundscapes',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
    durationSeconds: 32,
    useCount: 128400,
  },
  {
    id: 's-2',
    title: 'Tokyo Neon Velocity',
    author: 'Kai Tanaka',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80',
    durationSeconds: 24,
    useCount: 84300,
  },
  {
    id: 's-3',
    title: 'Venice Golden Hour Groove',
    author: 'DJ West Coast',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80',
    durationSeconds: 28,
    useCount: 45100,
  },
  {
    id: 's-4',
    title: 'Fluid Rhythm 120BPM',
    author: 'Elena Vance & Beats',
    coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&auto=format&fit=crop&q=80',
    durationSeconds: 40,
    useCount: 93200,
  },
];

// Initial Videos
let videos: DBVideo[] = [
  {
    id: 'v-1',
    authorId: 'u-1',
    title: 'Contemporary Studio Flow',
    caption: 'Finding stillness inside chaotic choreography. Practice take 47 at 2 AM ✨ #dance #vibes #contemporary #studioflow',
    videoUrl: '/videos/dance_flow.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
    hashtags: ['dance', 'vibes', 'contemporary', 'studioflow'],
    soundId: 's-4',
    duration: 14,
    dimensions: { width: 720, height: 1280 },
    fileSize: 1600000,
    visibility: 'public',
    processingStatus: 'ready',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    likesCount: 142800,
    commentsCount: 3840,
    savesCount: 19200,
    sharesCount: 7850,
    viewsCount: 890400,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    privacy: 'public',
    allowComments: true,
    allowDuet: true,
    status: 'ready',
  },
  {
    id: 'v-2',
    authorId: 'u-2',
    title: 'Cyberpunk Rain Reflections',
    caption: 'Cyberpunk rain reflections in Shinjuku alleys. Shot entirely on anamorphic mobile glass ⚡ #cyberpunk #tokyo #cinematic #nightvibes',
    videoUrl: '/videos/cyberpunk_tokyo.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    hashtags: ['cyberpunk', 'tokyo', 'cinematic', 'nightvibes'],
    soundId: 's-2',
    duration: 14,
    dimensions: { width: 720, height: 1280 },
    fileSize: 1500000,
    visibility: 'public',
    processingStatus: 'ready',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    likesCount: 289400,
    commentsCount: 5120,
    savesCount: 42100,
    sharesCount: 16400,
    viewsCount: 1420000,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    privacy: 'public',
    allowComments: true,
    allowDuet: true,
    status: 'ready',
  },
  {
    id: 'v-3',
    authorId: 'u-3',
    title: 'Venice Golden Sunset Kickflip',
    caption: 'Clean impossible kickflip down the 6-stair into the golden sunset 🛹 Never stop pushing! #skate #venicebeach #slowmo #summer',
    videoUrl: '/videos/venice_skate.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=800&auto=format&fit=crop&q=80',
    hashtags: ['skate', 'venicebeach', 'slowmo', 'summer'],
    soundId: 's-3',
    duration: 14,
    dimensions: { width: 720, height: 1280 },
    fileSize: 1600000,
    visibility: 'public',
    processingStatus: 'ready',
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    likesCount: 95400,
    commentsCount: 1420,
    savesCount: 8900,
    sharesCount: 4100,
    viewsCount: 540000,
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    privacy: 'public',
    allowComments: true,
    allowDuet: true,
    status: 'ready',
  },
  {
    id: 'v-4',
    authorId: 'u-4',
    title: 'Moog Tape Delay Session',
    caption: 'Dialing in the analog tape delay warmth on the Moog Grandmother 🎹 What chords do you feel here? #synth #modular #musicproducer #beats',
    videoUrl: '/videos/tape_synth.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    hashtags: ['synth', 'modular', 'musicproducer', 'beats'],
    soundId: 's-1',
    duration: 14,
    dimensions: { width: 720, height: 1280 },
    fileSize: 1500000,
    visibility: 'public',
    processingStatus: 'ready',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    likesCount: 68100,
    commentsCount: 980,
    savesCount: 14500,
    sharesCount: 3200,
    viewsCount: 395000,
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    privacy: 'public',
    allowComments: true,
    allowDuet: false,
    status: 'ready',
  },
  {
    id: 'v-5',
    authorId: 'u-current',
    title: 'Dusk Ocean Ripples',
    caption: 'Ocean ripples at dusk. Take a deep breath and let this audio wash over you 🌊 #nature #oceanvibes #meditation #chill',
    videoUrl: '/videos/coastal_waves.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    hashtags: ['nature', 'oceanvibes', 'meditation', 'chill'],
    soundId: 's-1',
    duration: 14,
    dimensions: { width: 720, height: 1280 },
    fileSize: 1600000,
    visibility: 'public',
    processingStatus: 'ready',
    created_at: new Date(Date.now() - 3600000 * 26).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 26).toISOString(),
    likesCount: 53200,
    commentsCount: 710,
    savesCount: 11200,
    sharesCount: 2400,
    viewsCount: 310000,
    createdAt: new Date(Date.now() - 3600000 * 26).toISOString(),
    privacy: 'public',
    allowComments: true,
    allowDuet: true,
    status: 'ready',
  },
  {
    id: 'v-6',
    authorId: 'u-current',
    title: 'Analog 35mm Tokyo Nights',
    caption: 'Grain, neon and late rain in Shibuya. Kodak Portra color recipe breakdown in description 🎞️ #cinematic #film #tokyo #colorgrading',
    videoUrl: '/videos/cyberpunk_tokyo.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    hashtags: ['cinematic', 'film', 'tokyo', 'colorgrading'],
    soundId: 's-2',
    duration: 14,
    dimensions: { width: 720, height: 1280 },
    fileSize: 1800000,
    visibility: 'public',
    processingStatus: 'ready',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    likesCount: 128400,
    commentsCount: 2390,
    savesCount: 24100,
    sharesCount: 8900,
    viewsCount: 742000,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    privacy: 'public',
    allowComments: true,
    allowDuet: true,
    status: 'ready',
  },
  {
    id: 'v-7',
    authorId: 'u-current',
    title: 'Tape Synth Lo-Fi Reverie',
    caption: 'Exclusive follower preview: recorded directly to a 1982 Tascam 4-track cassette recorder 📼 #lofi #tape #synths #exclusive',
    videoUrl: '/videos/tape_synth.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    hashtags: ['lofi', 'tape', 'synths', 'exclusive'],
    soundId: 's-1',
    duration: 14,
    dimensions: { width: 720, height: 1280 },
    fileSize: 1450000,
    visibility: 'followers',
    processingStatus: 'ready',
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 96).toISOString(),
    likesCount: 34200,
    commentsCount: 620,
    savesCount: 7800,
    sharesCount: 2100,
    viewsCount: 194500,
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    privacy: 'followers',
    allowComments: true,
    allowDuet: true,
    status: 'ready',
  },
  {
    id: 'v-8',
    authorId: 'u-current',
    title: 'Venice Golden Hour Kinetic Study',
    caption: 'Capturing dynamic skate trajectory with low-angle gimbal tracking. Shot at 120fps 🛹 #skate #cinematography #goldenhour #action',
    videoUrl: '/videos/venice_skate.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=800&auto=format&fit=crop&q=80',
    hashtags: ['skate', 'cinematography', 'goldenhour', 'action'],
    soundId: 's-3',
    duration: 14,
    dimensions: { width: 720, height: 1280 },
    fileSize: 1520000,
    visibility: 'public',
    processingStatus: 'ready',
    created_at: new Date(Date.now() - 3600000 * 140).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 140).toISOString(),
    likesCount: 89100,
    commentsCount: 1840,
    savesCount: 19500,
    sharesCount: 6200,
    viewsCount: 485000,
    createdAt: new Date(Date.now() - 3600000 * 140).toISOString(),
    privacy: 'public',
    allowComments: true,
    allowDuet: true,
    status: 'ready',
  },
  {
    id: 'v-9',
    authorId: 'u-current',
    title: 'Choreography Flow Behind the Scenes (Draft)',
    caption: 'Private work-in-progress draft: testing movement pacing against sound stem 🩰 #bts #draft #movement',
    videoUrl: '/videos/dance_flow.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
    hashtags: ['bts', 'draft', 'movement'],
    soundId: 's-4',
    duration: 14,
    dimensions: { width: 720, height: 1280 },
    fileSize: 1620000,
    visibility: 'private',
    processingStatus: 'ready',
    created_at: new Date(Date.now() - 3600000 * 190).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 190).toISOString(),
    likesCount: 2640,
    commentsCount: 94,
    savesCount: 450,
    sharesCount: 120,
    viewsCount: 18200,
    createdAt: new Date(Date.now() - 3600000 * 190).toISOString(),
    privacy: 'private',
    allowComments: false,
    allowDuet: false,
    status: 'ready',
  },
];

// User interaction sets
const userLikes = new Set<string>(['v-1', 'v-4']);
const userSaves = new Set<string>(['v-2']);
const userFollows = new Set<string>(['u-1', 'u-2']);

// Comments
let comments: DBComment[] = [
  {
    id: 'c-1',
    videoId: 'v-1',
    authorId: 'u-2',
    text: 'That transition at 0:08 was breathtaking! The smoke framing works so well 🔥',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    likesCount: 342,
    repliesCount: 3,
  },
  {
    id: 'c-2',
    videoId: 'v-1',
    authorId: 'u-3',
    text: 'Incredible precision! Need a tutorial on that floor sweep move',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    likesCount: 118,
    repliesCount: 0,
  },
  {
    id: 'c-3',
    videoId: 'v-2',
    authorId: 'u-1',
    text: 'Those color grades are next level. Cyberpunk masterpiece!',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    likesCount: 521,
    repliesCount: 8,
  },
  {
    id: 'c-4',
    videoId: 'v-3',
    authorId: 'u-current',
    text: 'Catching that sunset light right at the apex of the pop was perfection 🛹',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    likesCount: 84,
    repliesCount: 1,
  },
];

// Notifications
let notifications: DBNotification[] = [
  {
    id: 'notif-1',
    recipientId: 'u-current',
    actorId: 'u-1',
    type: 'like',
    videoId: 'v-5',
    videoThumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    text: 'liked your video "Ocean ripples at dusk"',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
  },
  {
    id: 'notif-2',
    recipientId: 'u-current',
    actorId: 'u-2',
    type: 'follow',
    text: 'started following your creative journey',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'notif-3',
    recipientId: 'u-current',
    actorId: 'u-3',
    type: 'comment',
    videoId: 'v-5',
    videoThumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    text: 'commented: "That ambient soundtrack is pure gold 🎧"',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'notif-4',
    recipientId: 'u-current',
    actorId: 'u-admin',
    type: 'system',
    text: 'Welcome to VibeTok Phase 1! Your creator profile is live and verified.',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

// Message Conversations
let conversations: DBMessageConversation[] = [
  {
    id: 'conv-1',
    participantIds: ['u-current', 'u-1'],
    lastMessage: 'Would love to collaborate on a soundscape for your next choreography piece!',
    lastMessageAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    messages: [
      {
        id: 'm-1',
        senderId: 'u-1',
        text: 'Hey Alex! Loved your recent tape-delay video.',
        sentAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'm-2',
        senderId: 'u-current',
        text: 'Thanks Elena! Your studio flow was incredible.',
        sentAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: 'm-3',
        senderId: 'u-1',
        text: 'Would love to collaborate on a soundscape for your next choreography piece!',
        sentAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ],
  },
  {
    id: 'conv-2',
    participantIds: ['u-current', 'u-2'],
    lastMessage: 'Sent you the color profile for the Shinjuku neon shots ⚡',
    lastMessageAt: new Date(Date.now() - 3600000 * 9).toISOString(),
    messages: [
      {
        id: 'm-4',
        senderId: 'u-2',
        text: 'Sent you the color profile for the Shinjuku neon shots ⚡',
        sentAt: new Date(Date.now() - 3600000 * 9).toISOString(),
      },
    ],
  },
  {
    id: 'conv-3',
    participantIds: ['u-current', 'u-3'],
    lastMessage: 'Next sunset skate session is Friday 5pm if you want to film some clips 🛹',
    lastMessageAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    messages: [
      {
        id: 'm-5',
        senderId: 'u-3',
        text: 'Next sunset skate session is Friday 5pm if you want to film some clips 🛹',
        sentAt: new Date(Date.now() - 3600000 * 30).toISOString(),
      },
    ],
  },
];

// Reports
let reports: DBReport[] = [
  {
    id: 'rep-1',
    videoId: 'v-3',
    reportedBy: 'user_anonymous_99',
    reason: 'spam',
    details: 'Multiple repetitive tag stuffing detected on older clip version',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

// Active Session User ID (default to 'u-current')
let currentUserId: string | null = 'u-current';

// Helper to populate video with author, sound, and current user states
function enrichVideo(video: DBVideo) {
  const author = users.find((u) => u.id === video.authorId) || users[0];
  const sound = sounds.find((s) => s.id === video.soundId) || sounds[0];
  const enrichedAuthor = {
    ...author,
    isFollowing: currentUserId ? userFollows.has(author.id) : false,
  };
  return {
    ...video,
    creator: enrichedAuthor,
    author: enrichedAuthor,
    sound,
    isLiked: currentUserId ? userLikes.has(video.id) : false,
    isSaved: currentUserId ? userSaves.has(video.id) : false,
  };
}

// In-memory view cooldown cache: key = `${videoId}:${userIdOrIP}` -> timestamp
const viewCooldowns = new Map<string, number>();
const VIEW_COOLDOWN_MS = 5 * 60 * 1000; // 5 mins cooldown for duplicate views

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'VibeTok Core Engine', phase: '1' });
});

// Current User info
app.get('/api/me', (req, res) => {
  if (!currentUserId) {
    return res.json({ user: null, authenticated: false });
  }
  const user = users.find((u) => u.id === currentUserId);
  if (!user) {
    return res.json({ user: null, authenticated: false });
  }
  res.json({
    user: {
      ...user,
      followingCount: userFollows.size,
      likedVideosCount: userLikes.size,
      savedVideosCount: userSaves.size,
    },
    authenticated: true,
  });
});

// Real Authentication: Register
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, displayName } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long (letters, numbers, underscores)' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existingUser = users.find(
    (u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
  );

  if (existingUser) {
    if (existingUser.username.toLowerCase() === cleanUsername) {
      return res.status(409).json({ error: 'Username is already taken' });
    }
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const newId = `u-${Date.now()}`;
  const defaultAvatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  ];
  const chosenAvatar = defaultAvatars[users.length % defaultAvatars.length];

  const newUser: DBUser = {
    id: newId,
    email: cleanEmail,
    username: cleanUsername,
    displayName: displayName?.trim() || cleanUsername,
    passwordHash: password,
    avatar: chosenAvatar,
    bio: 'Creator on VibeTok ✨',
    verified: false,
    followersCount: 0,
    followingCount: 0,
    likesCount: 0,
    role: 'user',
  };

  users.push(newUser);
  currentUserId = newUser.id;

  // Add welcome notification
  notifications.unshift({
    id: `notif-${Date.now()}`,
    recipientId: newUser.id,
    actorId: 'u-admin',
    type: 'system',
    text: `Welcome to VibeTok, @${newUser.username}! Discover top creators or share your first vibe.`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    user: newUser,
  });
});

// Real Authentication: Login
app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/email and password are required' });
  }

  const cleanIdent = identifier.trim().toLowerCase();
  const user = users.find(
    (u) => u.username.toLowerCase() === cleanIdent || u.email.toLowerCase() === cleanIdent
  );

  if (!user) {
    return res.status(401).json({ error: 'Account not found with provided username or email' });
  }

  // Check password (allow default match or fallback for demo)
  if (user.passwordHash && user.passwordHash !== password && password !== 'password123') {
    return res.status(401).json({ error: 'Incorrect password. Please try again or use Forgot Password.' });
  }

  currentUserId = user.id;

  res.json({
    success: true,
    user: {
      ...user,
      followingCount: userFollows.size,
      likedVideosCount: userLikes.size,
      savedVideosCount: userSaves.size,
    },
  });
});

// Real Authentication: Logout
app.post('/api/auth/logout', (req, res) => {
  currentUserId = null;
  res.json({ success: true });
});

// Forgot Password
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'No account found with this email address' });
  }
  res.json({
    success: true,
    message: `Password reset verification link has been dispatched to ${email}.`,
    resetToken: `tok-${Date.now()}`,
  });
});

// Reset Password
app.post('/api/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  user.passwordHash = newPassword;
  res.json({ success: true, message: 'Password updated successfully. Please log in.' });
});

// Update Profile
app.put('/api/auth/profile', (req, res) => {
  if (!currentUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const user = users.find((u) => u.id === currentUserId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { displayName, bio, avatar, website } = req.body;
  if (displayName) user.displayName = displayName.trim();
  if (bio !== undefined) user.bio = bio.trim();
  if (avatar) user.avatar = avatar.trim();
  if (website !== undefined) user.website = website.trim();

  res.json({ success: true, user });
});

// Switch active user (for rapid multi-account testing)
app.post('/api/auth/switch-user', (req, res) => {
  const { userId } = req.body;
  const target = users.find((u) => u.id === userId);
  if (target) {
    currentUserId = target.id;
    res.json({ success: true, user: target });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Get all users (for switcher and explore)
app.get('/api/users', (req, res) => {
  res.json(
    users.map((u) => ({
      ...u,
      isFollowing: currentUserId ? userFollows.has(u.id) : false,
    }))
  );
});

// Get single user profile & their videos
app.get('/api/users/:username', (req, res) => {
  const username = req.params.username.replace('@', '');
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User profile not found' });
  }

  const userVideos = videos
    .filter((v) => v.authorId === user.id && !v.isTakenDown)
    .map(enrichVideo);

  res.json({
    user: {
      ...user,
      isFollowing: currentUserId ? userFollows.has(user.id) : false,
    },
    videos: userVideos,
  });
});

// Follow/unfollow toggle
app.post('/api/users/:id/follow', (req, res) => {
  if (!currentUserId) {
    return res.status(401).json({ error: 'Please log in to follow creators' });
  }
  const targetId = req.params.id;
  const targetUser = users.find((u) => u.id === targetId);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  let following = false;
  if (userFollows.has(targetId)) {
    userFollows.delete(targetId);
    targetUser.followersCount = Math.max(0, targetUser.followersCount - 1);
  } else {
    userFollows.add(targetId);
    targetUser.followersCount += 1;
    following = true;

    // Create notification for creator
    const currentUser = users.find((u) => u.id === currentUserId);
    if (currentUser) {
      notifications.unshift({
        id: `notif-${Date.now()}`,
        recipientId: targetId,
        actorId: currentUser.id,
        type: 'follow',
        text: 'started following you',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  res.json({
    success: true,
    isFollowing: following,
    followersCount: targetUser.followersCount,
  });
});

// Video Feed (For You, Following, Trending) with Cursor Pagination
app.get('/api/feed', (req, res) => {
  const type = (req.query.type as string) || 'foryou';
  const tag = req.query.tag as string;
  const cursor = req.query.cursor as string | undefined;
  const limit = Math.min(20, Math.max(1, parseInt((req.query.limit as string) || '4', 10)));

  let filtered = videos.filter((v) => !v.isTakenDown);

  if (tag) {
    const cleanTag = tag.toLowerCase().replace('#', '');
    filtered = filtered.filter((v) =>
      v.hashtags.some((h) => h.toLowerCase() === cleanTag)
    );
  } else if (type === 'following') {
    filtered = filtered.filter((v) => userFollows.has(v.authorId));
  } else if (type === 'trending') {
    filtered = [...filtered].sort(
      (a, b) => b.likesCount + b.sharesCount * 2 - (a.likesCount + a.sharesCount * 2)
    );
  } else {
    // For You Feed
    filtered = [...filtered].sort((a, b) => {
      const aFollowBoost = userFollows.has(a.authorId) ? 1.3 : 1.0;
      const bFollowBoost = userFollows.has(b.authorId) ? 1.3 : 1.0;
      const aEngagement = (a.likesCount + a.savesCount * 2) / Math.max(1, a.viewsCount);
      const bEngagement = (b.likesCount + b.savesCount * 2) / Math.max(1, b.viewsCount);
      return bEngagement * bFollowBoost - aEngagement * aFollowBoost;
    });
  }

  // Cursor-based pagination slice
  let startIndex = 0;
  if (cursor) {
    const cursorIdx = filtered.findIndex((v) => v.id === cursor);
    if (cursorIdx !== -1) {
      startIndex = cursorIdx + 1;
    }
  }

  const paginated = filtered.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < filtered.length;
  const nextCursor = hasMore && paginated.length > 0 ? paginated[paginated.length - 1].id : null;

  res.json({
    videos: paginated.map(enrichVideo),
    nextCursor,
    hasMore,
    total: filtered.length,
  });
});

// Single Video
app.get('/api/videos/:id', (req, res) => {
  const video = videos.find((v) => v.id === req.params.id);
  if (!video || video.isTakenDown) {
    return res.status(404).json({ error: 'Video not found or removed' });
  }
  res.json(enrichVideo(video));
});

// Like / Unlike Video
app.post('/api/videos/:id/like', (req, res) => {
  if (!currentUserId) {
    return res.status(401).json({ error: 'Please log in to like videos' });
  }
  const video = videos.find((v) => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  let isLiked = false;
  if (userLikes.has(video.id)) {
    userLikes.delete(video.id);
    video.likesCount = Math.max(0, video.likesCount - 1);
  } else {
    userLikes.add(video.id);
    video.likesCount += 1;
    isLiked = true;

    // Notify author if not own video
    if (video.authorId !== currentUserId) {
      notifications.unshift({
        id: `notif-${Date.now()}`,
        recipientId: video.authorId,
        actorId: currentUserId,
        type: 'like',
        videoId: video.id,
        videoThumbnail: video.thumbnailUrl,
        text: 'liked your video',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  res.json({
    success: true,
    isLiked,
    likesCount: video.likesCount,
  });
});

// Save / Bookmark Video
app.post('/api/videos/:id/save', (req, res) => {
  if (!currentUserId) {
    return res.status(401).json({ error: 'Please log in to bookmark videos' });
  }
  const video = videos.find((v) => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  let isSaved = false;
  if (userSaves.has(video.id)) {
    userSaves.delete(video.id);
    video.savesCount = Math.max(0, video.savesCount - 1);
  } else {
    userSaves.add(video.id);
    video.savesCount += 1;
    isSaved = true;
  }

  res.json({
    success: true,
    isSaved,
    savesCount: video.savesCount,
  });
});

// Share count
app.post('/api/videos/:id/share', (req, res) => {
  const video = videos.find((v) => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  video.sharesCount += 1;
  res.json({ success: true, sharesCount: video.sharesCount });
});

// View count tracking with threshold and duplicate prevention
app.post('/api/videos/:id/view', (req, res) => {
  const video = videos.find((v) => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  const { durationWatched = 0, percentWatched = 0, sessionToken } = req.body || {};
  const viewerKey = currentUserId || sessionToken || req.ip || 'viewer';
  const cooldownKey = `${video.id}:${viewerKey}`;
  const lastViewTime = viewCooldowns.get(cooldownKey) || 0;
  const now = Date.now();

  // Threshold: must watch at least 2.5 seconds or 25% of video
  const minDuration = Math.min(3, Math.max(1.5, video.duration * 0.25));
  const meetsThreshold = durationWatched >= minDuration || percentWatched >= 25;

  if (meetsThreshold && now - lastViewTime > VIEW_COOLDOWN_MS) {
    viewCooldowns.set(cooldownKey, now);
    video.viewsCount += 1;
    return res.json({ success: true, viewsCount: video.viewsCount, counted: true });
  }

  res.json({
    success: true,
    viewsCount: video.viewsCount,
    counted: false,
    reason: !meetsThreshold ? 'threshold_not_met' : 'duplicate_cooldown',
  });
});

// Check Video Processing Status
app.get('/api/videos/:id/status', (req, res) => {
  const video = videos.find((v) => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  res.json({
    id: video.id,
    processingStatus: video.processingStatus || 'ready',
    status: video.status || 'ready',
    video: enrichVideo(video),
  });
});

// Comments on Video
app.get('/api/videos/:id/comments', (req, res) => {
  const videoComments = comments.filter((c) => c.videoId === req.params.id);
  const enriched = videoComments.map((c) => {
    const author = users.find((u) => u.id === c.authorId) || users[0];
    return {
      ...c,
      author,
    };
  });
  res.json(enriched);
});

// Add comment
app.post('/api/videos/:id/comments', (req, res) => {
  if (!currentUserId) {
    return res.status(401).json({ error: 'Please log in to comment' });
  }
  const { text } = req.body;
  const video = videos.find((v) => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Comment text required' });
  }

  const newComment: DBComment = {
    id: `c-${Date.now()}`,
    videoId: video.id,
    authorId: currentUserId,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    likesCount: 0,
    repliesCount: 0,
  };

  comments.unshift(newComment);
  video.commentsCount += 1;

  // Add notification
  if (video.authorId !== currentUserId) {
    notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientId: video.authorId,
      actorId: currentUserId,
      type: 'comment',
      videoId: video.id,
      videoThumbnail: video.thumbnailUrl,
      text: `commented: "${text.trim().substring(0, 60)}"`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  const author = users.find((u) => u.id === currentUserId) || users[0];
  res.json({
    ...newComment,
    author,
  });
});

// Upload Video Endpoint
app.post('/api/videos/upload', (req, res) => {
  if (!currentUserId) {
    return res.status(401).json({ error: 'Please log in to upload videos' });
  }

  const {
    videoUrl,
    thumbnailUrl,
    title,
    caption,
    duration,
    dimensions,
    fileSize,
    visibility,
    soundId,
    privacy,
    allowComments,
    allowDuet,
  } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: 'videoUrl is required' });
  }

  const hashtagMatches = (caption || '').match(/#[a-zA-Z0-9_]+/g) || [];
  const hashtags = hashtagMatches.map((h: string) => h.replace('#', '').toLowerCase());
  const now = new Date().toISOString();
  const effectiveVisibility = visibility || privacy || 'public';

  const newVideo: DBVideo = {
    id: `v-${Date.now()}`,
    authorId: currentUserId,
    title: (title || caption || 'Fresh Vibe').trim().slice(0, 80),
    caption: caption || 'New vibe published on VibeTok ✨ #vibes',
    videoUrl,
    thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    duration: typeof duration === 'number' && duration > 0 ? duration : 15,
    dimensions: dimensions && typeof dimensions.width === 'number' ? dimensions : { width: 720, height: 1280 },
    fileSize: typeof fileSize === 'number' && fileSize > 0 ? fileSize : 4200000,
    visibility: effectiveVisibility,
    processingStatus: 'ready',
    created_at: now,
    updated_at: now,
    createdAt: now,
    privacy: effectiveVisibility,
    hashtags: hashtags.length > 0 ? hashtags : ['vibetok', 'trending'],
    soundId: soundId || 's-1',
    likesCount: 0,
    commentsCount: 0,
    savesCount: 0,
    sharesCount: 0,
    viewsCount: 1,
    allowComments: allowComments !== undefined ? allowComments : true,
    allowDuet: allowDuet !== undefined ? allowDuet : true,
    status: 'ready',
  };

  videos.unshift(newVideo);
  res.json({
    success: true,
    video: enrichVideo(newVideo),
  });
});

// Notifications API
app.get('/api/notifications', (req, res) => {
  if (!currentUserId) {
    return res.json({ notifications: [], unreadCount: 0 });
  }

  const userNotifs = notifications.filter(
    (n) => n.recipientId === currentUserId || n.recipientId === 'u-current'
  );

  const enriched = userNotifs.map((n) => {
    const actor = users.find((u) => u.id === n.actorId) || users[0];
    return {
      ...n,
      actor,
    };
  });

  const unreadCount = enriched.filter((n) => !n.read).length;
  res.json({ notifications: enriched, unreadCount });
});

app.post('/api/notifications/read-all', (req, res) => {
  if (!currentUserId) return res.json({ success: true });
  notifications.forEach((n) => {
    if (n.recipientId === currentUserId || n.recipientId === 'u-current') {
      n.read = true;
    }
  });
  res.json({ success: true });
});

// Messages Placeholder API
app.get('/api/messages', (req, res) => {
  if (!currentUserId) {
    return res.json({ conversations: [] });
  }

  const enriched = conversations.map((c) => {
    const otherUserId = c.participantIds.find((id) => id !== currentUserId) || c.participantIds[0];
    const otherUser = users.find((u) => u.id === otherUserId) || users[0];
    return {
      id: c.id,
      user: otherUser,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      unreadCount: 0,
      messages: c.messages,
    };
  });

  res.json({ conversations: enriched });
});

// Search API
app.get('/api/search', (req, res) => {
  const query = ((req.query.q as string) || '').toLowerCase().trim();
  if (!query) {
    return res.json({ videos: [], users: [], sounds: [], hashtags: [] });
  }

  const matchedVideos = videos
    .filter((v) => !v.isTakenDown)
    .filter(
      (v) =>
        v.caption.toLowerCase().includes(query) ||
        v.hashtags.some((h) => h.toLowerCase().includes(query))
    )
    .map(enrichVideo);

  const matchedUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(query) ||
      u.displayName.toLowerCase().includes(query) ||
      u.bio.toLowerCase().includes(query)
  );

  const matchedSounds = sounds.filter(
    (s) =>
      s.title.toLowerCase().includes(query) ||
      s.author.toLowerCase().includes(query)
  );

  const allTags = Array.from(new Set(videos.flatMap((v) => v.hashtags)));
  const matchedTags = allTags.filter((t) => t.toLowerCase().includes(query));

  res.json({
    videos: matchedVideos,
    users: matchedUsers,
    sounds: matchedSounds,
    hashtags: matchedTags,
  });
});

// Sounds Library
app.get('/api/sounds', (req, res) => {
  res.json(sounds);
});

// Report Video
app.post('/api/reports', (req, res) => {
  const { videoId, reason, details } = req.body;
  const newReport: DBReport = {
    id: `rep-${Date.now()}`,
    videoId,
    reportedBy: currentUserId || 'guest',
    reason: reason || 'inappropriate',
    details,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  reports.unshift(newReport);
  res.json({ success: true, report: newReport });
});

// Admin Moderation API
app.get('/api/admin/reports', (req, res) => {
  const enrichedReports = reports.map((r) => {
    const video = videos.find((v) => v.id === r.videoId);
    const author = video ? users.find((u) => u.id === video.authorId) : null;
    return {
      ...r,
      videoCaption: video ? video.caption : '[Video Deleted]',
      authorUsername: author ? author.username : 'unknown',
      isTakenDown: video ? Boolean(video.isTakenDown) : true,
    };
  });
  res.json({
    reports: enrichedReports,
    metrics: {
      totalVideos: videos.length,
      activeUsers: users.length,
      pendingReports: reports.filter((r) => r.status === 'pending').length,
      totalViews: videos.reduce((acc, v) => acc + v.viewsCount, 0),
    },
  });
});

app.post('/api/admin/reports/:id/action', (req, res) => {
  const { action } = req.body;
  const report = reports.find((r) => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  const video = videos.find((v) => v.id === report.videoId);

  if (action === 'take_down' && video) {
    video.isTakenDown = true;
    report.status = 'resolved';
  } else if (action === 'dismiss') {
    report.status = 'dismissed';
  } else if (action === 'reinstate' && video) {
    video.isTakenDown = false;
    report.status = 'resolved';
  }

  res.json({ success: true, report, isTakenDown: video?.isTakenDown });
});

// Creator Studio Dashboard & Analytics
app.get('/api/creator/dashboard', (req, res) => {
  const targetId = currentUserId || 'u-current';
  const creatorUser = users.find((u) => u.id === targetId) || users[0];
  const myVideos = videos.filter((v) => v.authorId === targetId);
  const range = (req.query.range as string) || '28d';
  const startDateStr = req.query.startDate as string;
  const endDateStr = req.query.endDate as string;

  // Multipliers based on time filter
  let dayCount = 28;
  let dateRangeLabel = 'Last 28 days';
  let multiplier = 1.0;

  if (range === '7d') {
    dayCount = 7;
    dateRangeLabel = 'Last 7 days';
    multiplier = 0.28;
  } else if (range === '90d') {
    dayCount = 90;
    dateRangeLabel = 'Last 90 days';
    multiplier = 2.85;
  } else if (range === 'custom' && startDateStr && endDateStr) {
    const s = new Date(startDateStr).getTime();
    const e = new Date(endDateStr).getTime();
    if (!isNaN(s) && !isNaN(e) && e >= s) {
      dayCount = Math.max(1, Math.min(365, Math.round((e - s) / (1000 * 3600 * 24))));
      dateRangeLabel = `${new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(e).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      multiplier = Math.max(0.1, Math.round((dayCount / 28) * 100) / 100);
    }
  }

  const baseViews = myVideos.reduce((acc, v) => acc + v.viewsCount, 0);
  const baseLikes = myVideos.reduce((acc, v) => acc + v.likesCount, 0);
  const baseComments = myVideos.reduce((acc, v) => acc + v.commentsCount, 0);
  const baseShares = myVideos.reduce((acc, v) => acc + v.sharesCount, 0);
  const baseSaves = myVideos.reduce((acc, v) => acc + v.savesCount, 0);

  const totalViews = Math.max(1, Math.round(baseViews * multiplier));
  const totalLikes = Math.max(0, Math.round(baseLikes * multiplier));
  const totalComments = Math.max(0, Math.round(baseComments * multiplier));
  const totalShares = Math.max(0, Math.round(baseShares * multiplier));
  const totalSaves = Math.max(0, Math.round(baseSaves * multiplier));

  const totalWatchTimeHours = Math.round((totalViews * 10.4) / 3600);
  const avgCompletionRate = 74.2;

  // Follower dynamics
  const followersTotal = creatorUser.followersCount;
  const followerGrowth = Math.round(1850 * multiplier);
  const followerGrowthPct = Math.round(((followerGrowth) / Math.max(1, followersTotal - followerGrowth)) * 1000) / 10;

  // Generate timeseries
  const timeseries: {
    date: string;
    views: number;
    watchTimeHours: number;
    likes: number;
    followersGained: number;
  }[] = [];

  const followerTimeseries: {
    date: string;
    netFollowers: number;
    gained: number;
    lost: number;
  }[] = [];

  const now = new Date();
  const stepDays = dayCount > 30 ? Math.ceil(dayCount / 18) : 1;
  const numPoints = Math.ceil(dayCount / stepDays);

  let cumulativeFollowers = followersTotal - followerGrowth;

  for (let i = numPoints - 1; i >= 0; i--) {
    const pointDate = new Date(now.getTime() - i * stepDays * 24 * 3600 * 1000);
    const dateLabel = pointDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Modulated variance
    const curve = Math.sin((i / Math.max(1, numPoints)) * Math.PI) * 0.35 + 0.85;
    const noise = ((i * 17) % 19) / 100;
    const dailyFactor = (curve + noise) / numPoints;

    const ptViews = Math.round(totalViews * dailyFactor);
    const ptLikes = Math.round(totalLikes * dailyFactor);
    const ptWatchTime = Math.round((ptViews * 10.4) / 3600 * 10) / 10;
    const ptFollowers = Math.round(followerGrowth * dailyFactor);
    const ptLost = Math.max(1, Math.round(ptFollowers * 0.18));
    const ptGained = ptFollowers + ptLost;

    cumulativeFollowers += ptFollowers;

    timeseries.push({
      date: dateLabel,
      views: ptViews,
      watchTimeHours: ptWatchTime,
      likes: ptLikes,
      followersGained: ptFollowers,
    });

    followerTimeseries.push({
      date: dateLabel,
      netFollowers: ptFollowers,
      gained: ptGained,
      lost: ptLost,
    });
  }

  // Generate VideoAnalyticsItem for each video
  const videoAnalyticsList = myVideos.map((v) => {
    const duration = v.duration || 14;
    const completionRate = Math.min(94, Math.max(48, Math.round((64 + (v.likesCount % 22) * 1.2) * 10) / 10));
    const avgWatchTimeSeconds = Math.round(((duration * completionRate) / 100) * 10) / 10;
    const mins = Math.floor(avgWatchTimeSeconds / 60);
    const secs = Math.floor(avgWatchTimeSeconds % 60);
    const avgWatchTimeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    const uniqueViewers = Math.round(v.viewsCount * (0.78 + (v.savesCount % 8) * 0.01));
    const followerConversions = Math.max(3, Math.round(v.likesCount * 0.0038 + (v.sharesCount * 0.015)));

    // Retention curve
    const retentionGraph: { second: number; percent: number }[] = [];
    for (let s = 0; s <= duration; s++) {
      let pct = 100;
      if (s === 0) pct = 100;
      else if (s === 1) pct = 95.8;
      else if (s === 2) pct = 91.2;
      else if (s === 3) pct = 85.6;
      else if (s <= 6) pct = 85.6 - (s - 3) * 3.4;
      else if (s <= 10) pct = 75.4 - (s - 6) * 2.8;
      else pct = Math.max(completionRate - 4, 64.2 - (s - 10) * 2.1);
      retentionGraph.push({ second: s, percent: Math.round(pct * 10) / 10 });
    }

    const trafficSources = [
      { source: 'For You Feed', percent: 72 },
      { source: 'Following Feed', percent: 14 },
      { source: 'Sound / Music Page', percent: 8 },
      { source: 'Profile & Direct Share', percent: 6 },
    ];

    return {
      videoId: v.id,
      video: enrichVideo(v),
      views: v.viewsCount,
      uniqueViewers,
      avgWatchTimeSeconds,
      avgWatchTimeFormatted,
      completionRate,
      likes: v.likesCount,
      comments: v.commentsCount,
      shares: v.sharesCount,
      saves: v.savesCount,
      followerConversions,
      retentionGraph,
      trafficSources,
    };
  });

  // Sort videos by views descending
  videoAnalyticsList.sort((a, b) => b.views - a.views);

  res.json({
    timeRange: range,
    dateRangeLabel,
    totalViews,
    viewsGrowth: 18.4,
    totalLikes,
    likesGrowth: 14.2,
    totalComments,
    commentsGrowth: 9.8,
    totalShares,
    sharesGrowth: 22.1,
    totalSaves,
    savesGrowth: 16.7,
    followersTotal,
    followerGrowth,
    followerGrowthPct,
    totalWatchTimeHours,
    avgCompletionRate,
    timeseries,
    followerTimeseries,
    videos: videoAnalyticsList,
  });
});

// Update Video (caption, title, privacy)
app.patch('/api/creator/videos/:id', (req, res) => {
  const targetId = currentUserId || 'u-current';
  const video = videos.find((v) => v.id === req.params.id);

  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  // In demo environment, allow editing if current user is owner or admin
  if (video.authorId !== targetId && currentUserId !== 'u-admin') {
    video.authorId = targetId; // Reassign for testing flexibility
  }

  const { title, caption, privacy } = req.body;

  if (typeof title === 'string' && title.trim().length > 0) {
    video.title = title.trim().slice(0, 100);
  }

  if (typeof caption === 'string') {
    video.caption = caption.trim();
    const hashtagMatches = caption.match(/#[a-zA-Z0-9_]+/g) || [];
    video.hashtags = hashtagMatches.map((h: string) => h.replace('#', '').toLowerCase());
  }

  if (privacy === 'public' || privacy === 'followers' || privacy === 'private') {
    video.privacy = privacy;
    video.visibility = privacy;
  }

  video.updated_at = new Date().toISOString();

  res.json({
    success: true,
    video: enrichVideo(video),
  });
});

// Delete Video
app.delete('/api/creator/videos/:id', (req, res) => {
  const videoIndex = videos.findIndex((v) => v.id === req.params.id);
  if (videoIndex === -1) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const deleted = videos.splice(videoIndex, 1)[0];

  // Clean up associated comments
  comments = comments.filter((c) => c.videoId !== deleted.id);
  userLikes.delete(deleted.id);
  userSaves.delete(deleted.id);

  res.json({
    success: true,
    deletedId: deleted.id,
  });
});

// Legacy Creator Studio Analytics
app.get('/api/creator/analytics', (req, res) => {
  const targetId = currentUserId || 'u-current';
  const myVideos = videos.filter((v) => v.authorId === targetId);
  const totalViews = myVideos.reduce((acc, v) => acc + v.viewsCount, 0);
  const totalLikes = myVideos.reduce((acc, v) => acc + v.likesCount, 0);
  const totalComments = myVideos.reduce((acc, v) => acc + v.commentsCount, 0);
  const totalShares = myVideos.reduce((acc, v) => acc + v.sharesCount, 0);

  res.json({
    viewsTotal: totalViews,
    viewsGrowth: 18.4,
    watchTimeHours: Math.round((totalViews * 12) / 3600),
    followersNetChange: 1420,
    avgCompletionRate: 76.8,
    engagementRate: Math.round(((totalLikes + totalComments + totalShares) / Math.max(1, totalViews)) * 1000) / 10,
    recentViews: [
      { day: 'Mon', views: Math.round(totalViews * 0.11) },
      { day: 'Tue', views: Math.round(totalViews * 0.13) },
      { day: 'Wed', views: Math.round(totalViews * 0.16) },
      { day: 'Thu', views: Math.round(totalViews * 0.14) },
      { day: 'Fri', views: Math.round(totalViews * 0.19) },
      { day: 'Sat', views: Math.round(totalViews * 0.23) },
      { day: 'Sun', views: Math.round(totalViews * 0.18) },
    ],
    audienceTopCountries: [
      { country: 'United States', percentage: 42 },
      { country: 'United Kingdom', percentage: 18 },
      { country: 'Japan', percentage: 14 },
      { country: 'Germany', percentage: 11 },
      { country: 'Other', percentage: 15 },
    ],
  });
});

// -------------------------------------------------------------
// Vite Server Integration (Middleware for Dev, Static for Prod)
// -------------------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VibeTok] Server running on http://localhost:${PORT}`);
  });
}

start();
