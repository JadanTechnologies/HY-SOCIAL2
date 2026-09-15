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

const SEED_USERS: StoredUser[] = [
  {
    id: 'u-jadan',
    email: 'jadanexpress.info@gmail.com',
    username: 'jadan',
    displayName: 'Jabir Dangaskiya',
    password: 'jadan',
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
    password: 'password123',
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
    password: 'password123',
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
    password: 'password123',
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
    password: 'password123',
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
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400&auto=format&fit=crop&q=80',
    bio: 'Lagos street skater & concrete pioneer 🛹 National Stadium Surulere & TBS sessions 🇳🇬',
    verified: false,
    followersCount: 142000,
    followingCount: 195,
    likesCount: 1950000,
    role: 'creator',
  },
];

const SEED_SOUNDS: Sound[] = [
  {
    id: 's-1',
    title: 'Gbagbe (Afrobeats Instrumental)',
    author: 'Tunde Adebayo & The Lagos All-Stars',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
    durationSeconds: 32,
    useCount: 248400,
  },
  {
    id: 's-2',
    title: 'Lekki Sunset Amapiano Log Drum',
    author: 'Amaka Okafor & DJ Spinall',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80',
    durationSeconds: 26,
    useCount: 184300,
  },
  {
    id: 's-3',
    title: 'Ojuelegba Vibe (Acoustic Remix)',
    author: 'Mainland Strings Lagos',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80',
    durationSeconds: 28,
    useCount: 95100,
  },
  {
    id: 's-4',
    title: 'Naija Party Beat 128BPM',
    author: 'Sarz Type Beats Lagos',
    coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&auto=format&fit=crop&q=80',
    durationSeconds: 35,
    useCount: 163200,
  },
];

const SEED_VIDEOS: StoredVideo[] = [
  {
    id: 'v-1',
    authorId: 'u-1',
    title: 'Lekki Amapiano Footwork Challenge',
    caption: 'Learned this new South African log-drum step and added Lagos energy! Wait for the drop at 0:08 💃🏿🔥 Who wants the full tutorial? #afrobeats #amapiano #lagosdance #nigeria #vibes',
    videoUrl: '/videos/dance_flow.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
    hashtags: ['afrobeats', 'amapiano', 'lagosdance', 'nigeria', 'vibes'],
    soundId: 's-2',
    duration: 14,
    dimensions: { width: 720, height: 1280 },
    fileSize: 1600000,
    visibility: 'public',
    processingStatus: 'ready',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    likesCount: 142800,
    commentsCount: 3840,
    savesCount: 19200,
    sharesCount: 7850,
    viewsCount: 890400,
    privacy: 'public',
    allowComments: true,
    allowDuet: true,
    status: 'ready',
  },
  {
    id: 'v-2',
    authorId: 'u-2',
    title: 'Producing an Afrobeats Banger in Lekki Phase 1',
    caption: 'Cooking up live melodies in the Lekki studio with pure Lagos energy! When that log drum drops 🎹⚡ Tell me which Nigerian artist should jump on this! #afrobeats #musicproducer #lagosmusic #burnaboy #wizkid',
    videoUrl: '/videos/cyberpunk_tokyo.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    hashtags: ['afrobeats', 'musicproducer', 'lagosmusic', 'lagos', 'vibes'],
    soundId: 's-1',
    duration: 14,
    dimensions: { width: 720, height: 1280 },
    fileSize: 1500000,
    visibility: 'public',
    processingStatus: 'ready',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    likesCount: 289400,
    commentsCount: 5120,
    savesCount: 42100,
    sharesCount: 16400,
    viewsCount: 1420000,
    privacy: 'public',
    allowComments: true,
    allowDuet: true,
    status: 'ready',
  },
  {
    id: 'v-3',
    authorId: 'u-4',
    title: 'Skating through Marina & Lagos Island',
    caption: 'Dodging yellow Danfo buses and hitting a clean tre-flip on Marina road 🛹 Lagos traffic cannot stop this skate grind! #lagos #skateboarding #nigeria #marina #energy',
    videoUrl: '/videos/venice_skate.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=800&auto=format&fit=crop&q=80',
    hashtags: ['lagos', 'skateboarding', 'nigeria', 'marina', 'energy'],
    soundId: 's-3',
    duration: 14,
    dimensions: { width: 720, height: 1280 },
    fileSize: 1600000,
    visibility: 'public',
    processingStatus: 'ready',
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    likesCount: 95400,
    commentsCount: 1420,
    savesCount: 8900,
    sharesCount: 4100,
    viewsCount: 540000,
    privacy: 'public',
    allowComments: true,
    allowDuet: true,
    status: 'ready',
  },
  {
    id: 'v-4',
    authorId: 'u-3',
    title: 'Secret Smokey Party Jollof Recipe',
    caption: 'The real secret to authentic Nigerian party Jollof rice is all in the firewood smoke technique 🍲🔥 No shortcuts! Drop a comment if you want the ingredient list! #jollofrice #nigerianfood #naijaeats #foodie #lagos',
    videoUrl: '/videos/tape_synth.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    hashtags: ['jollofrice', 'nigerianfood', 'naijaeats', 'foodie', 'lagos'],
    soundId: 's-4',
    duration: 14,
    dimensions: { width: 720, height: 1280 },
    fileSize: 1500000,
    visibility: 'public',
    processingStatus: 'ready',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    likesCount: 68100,
    commentsCount: 980,
    savesCount: 14500,
    sharesCount: 3200,
    viewsCount: 395000,
    privacy: 'public',
    allowComments: true,
    allowDuet: false,
    status: 'ready',
  },
  {
    id: 'v-5',
    authorId: 'u-current',
    title: 'Tarkwa Bay Golden Hour Waves',
    caption: 'Took a boat ride out to Tarkwa Bay, Lagos at sunset. Pure peace away from the city hustle 🌊🇳🇬 Breathe in this serenity! #tarkwabay #lagos #nigeria #beachvibes #cinematic',
    videoUrl: '/videos/coastal_waves.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    hashtags: ['tarkwabay', 'lagos', 'nigeria', 'beachvibes', 'cinematic'],
    soundId: 's-1',
    duration: 14,
    dimensions: { width: 720, height: 1280 },
    fileSize: 1600000,
    visibility: 'public',
    processingStatus: 'ready',
    createdAt: new Date(Date.now() - 3600000 * 26).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 26).toISOString(),
    likesCount: 53200,
    commentsCount: 710,
    savesCount: 11200,
    sharesCount: 2400,
    viewsCount: 310000,
    privacy: 'public',
    allowComments: true,
    allowDuet: true,
    status: 'ready',
  },
  {
    id: 'v-6',
    authorId: 'u-current',
    title: 'Lekki-Ikoyi Link Bridge at Night',
    caption: 'Late night cinematics over the Lekki-Ikoyi bridge lights. Lagos at night has an unmatched spirit 🌉✨ #lagos #lekki #cinematography #nightlights #nigeria',
    videoUrl: '/videos/cyberpunk_tokyo.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    hashtags: ['lagos', 'lekki', 'cinematography', 'nightlights', 'nigeria'],
    soundId: 's-2',
    duration: 14,
    dimensions: { width: 720, height: 1280 },
    fileSize: 1800000,
    visibility: 'public',
    processingStatus: 'ready',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    likesCount: 128400,
    commentsCount: 2390,
    savesCount: 24100,
    sharesCount: 8900,
    viewsCount: 742000,
    privacy: 'public',
    allowComments: true,
    allowDuet: true,
    status: 'ready',
  },
  {
    id: 'v-jadan-1',
    authorId: 'u-jadan',
    title: 'Aso Rock Sunset & Abuja Tech Horizons',
    caption: 'Golden hour drone view overlooking Aso Rock and the Central Business District. Northern tech & creative community rising! 🇳🇬✨ #abuja #kano #nigeriatech #jadan #innovation #hy',
    videoUrl: '/videos/coastal_waves.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    hashtags: ['abuja', 'kano', 'nigeriatech', 'jadan', 'innovation', 'hy'],
    soundId: 's-1',
    duration: 14,
    dimensions: { width: 720, height: 1280 },
    fileSize: 1600000,
    visibility: 'public',
    processingStatus: 'ready',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    likesCount: 142300,
    commentsCount: 2310,
    savesCount: 18900,
    sharesCount: 7500,
    viewsCount: 890000,
    privacy: 'public',
    allowComments: true,
    allowDuet: true,
    status: 'ready',
  },
];

const SEED_COMMENTS: Comment[] = [
  {
    id: 'c-1',
    videoId: 'v-1',
    author: SEED_USERS[2],
    text: 'Omo that transition at 0:08 was too clean! The legwork is giving pure fire 🔥🇳🇬',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    likesCount: 342,
    repliesCount: 3,
  },
  {
    id: 'c-2',
    videoId: 'v-1',
    author: SEED_USERS[4],
    text: 'E choke! Senior woman abeg drop the footwork tutorial before Saturday party! 🙌',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    likesCount: 118,
    repliesCount: 0,
  },
  {
    id: 'c-3',
    videoId: 'v-2',
    author: SEED_USERS[0],
    text: 'This beat is mental! Rema or Asake need to hop on this immediately! 🎹🚀',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    likesCount: 521,
    repliesCount: 8,
  },
  {
    id: 'c-4',
    videoId: 'v-3',
    author: SEED_USERS[1],
    text: 'Landing that kickflip right beside the Danfo bus was wild! Lagos street energy is unmatched 🛹',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    likesCount: 84,
    repliesCount: 1,
  },
  {
    id: 'c-5',
    videoId: 'v-4',
    author: SEED_USERS[3],
    text: 'Party Jollof will always be superior to Sunday rice, no debate! 🍲🇳🇬',
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    likesCount: 246,
    repliesCount: 5,
  },
];

function seedData(): void {
  if (localStorage.getItem(KEYS.INITIALIZED)) return;

  setToStorage(KEYS.USERS, SEED_USERS);
  setToStorage(KEYS.SOUNDS, SEED_SOUNDS);
  setToStorage(KEYS.VIDEOS, SEED_VIDEOS);
  setToStorage(KEYS.COMMENTS, SEED_COMMENTS);
  setToStorage(KEYS.USER_LIKES, ['v-1', 'v-4']);
  setToStorage(KEYS.USER_SAVES, ['v-2']);
  setToStorage(KEYS.USER_FOLLOWS, ['u-1', 'u-2']);
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
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
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
        coverUrl: author.avatar,
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
    return getFromStorage<Sound[]>(KEYS.SOUNDS, SEED_SOUNDS);
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
  getMessages(): { conversations: any[] } {
    return { conversations: getFromStorage<any[]>(KEYS.MESSAGES, []) };
  },

  saveMessages(conversations: any[]): void {
    setToStorage(KEYS.MESSAGES, conversations);
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
