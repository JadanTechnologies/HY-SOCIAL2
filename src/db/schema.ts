/**
 * VibeTok Foundational Database Schema
 * Defines relational entities, foreign keys, indexes, and domain models.
 */

export interface DBUserEntity {
  id: string; // Primary Key (UUID / CUID)
  email: string; // Unique Index
  username: string; // Unique Index, lowercase
  displayName: string;
  passwordHash: string;
  role: 'user' | 'creator';
  status: 'active' | 'suspended' | 'deactivated';
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface DBProfileEntity {
  id: string; // Primary Key
  userId: string; // Foreign Key -> users.id (Unique Index)
  avatarUrl: string;
  bio: string;
  websiteUrl?: string;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  isPrivate: boolean;
  updatedAt: string;
}

export interface DBVideoEntity {
  id: string; // Primary Key
  authorId: string; // Foreign Key -> users.id (Index: authorId_createdAt)
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  hashtags: string[]; // GIN / Array Index
  soundId?: string; // Foreign Key -> sounds.id (Index)
  duration: number; // in seconds
  privacy: 'public' | 'followers' | 'private';
  allowComments: boolean;
  allowDuet: boolean;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  sharesCount: number;
  status: 'ready' | 'processing' | 'failed';
  isTakenDown: boolean;
  createdAt: string; // Index: createdAt_desc
  updatedAt: string;
}

export interface DBFollowEntity {
  id: string; // Primary Key
  followerId: string; // Foreign Key -> users.id (Index: followerId)
  followingId: string; // Foreign Key -> users.id (Index: followingId)
  createdAt: string;
  // Composite Unique Index: (followerId, followingId)
}

export interface DBLikeEntity {
  id: string; // Primary Key
  userId: string; // Foreign Key -> users.id (Index)
  videoId: string; // Foreign Key -> videos.id (Index)
  createdAt: string;
  // Composite Unique Index: (userId, videoId)
}

export interface DBSaveEntity {
  id: string; // Primary Key
  userId: string; // Foreign Key -> users.id (Index)
  videoId: string; // Foreign Key -> videos.id (Index)
  createdAt: string;
  // Composite Unique Index: (userId, videoId)
}

export interface DBCommentEntity {
  id: string; // Primary Key
  videoId: string; // Foreign Key -> videos.id (Index: videoId_createdAt)
  authorId: string; // Foreign Key -> users.id (Index)
  text: string;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DBNotificationEntity {
  id: string; // Primary Key
  recipientId: string; // Foreign Key -> users.id (Index: recipientId_createdAt)
  actorId: string; // Foreign Key -> users.id
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system';
  videoId?: string; // Foreign Key -> videos.id
  commentId?: string; // Foreign Key -> comments.id
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DBSoundEntity {
  id: string; // Primary Key
  title: string;
  author: string;
  coverUrl: string;
  durationSeconds: number;
  useCount: number;
  createdAt: string;
}

/**
 * SQL Schema Definition (PostgreSQL / SQLite compatible reference DDL)
 */
export const SQL_SCHEMA_DDL = `
-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(64) NOT NULL UNIQUE,
  display_name VARCHAR(128) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email ON users (email);

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  avatar_url TEXT NOT NULL,
  bio TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  followers_count INT NOT NULL DEFAULT 0,
  following_count INT NOT NULL DEFAULT 0,
  likes_count INT NOT NULL DEFAULT 0,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_profiles_user_id ON profiles (user_id);

-- Sounds Table
CREATE TABLE IF NOT EXISTS sounds (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  cover_url TEXT NOT NULL,
  duration_seconds INT NOT NULL DEFAULT 30,
  use_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Videos Table
CREATE TABLE IF NOT EXISTS videos (
  id VARCHAR(64) PRIMARY KEY,
  author_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  hashtags TEXT[] DEFAULT '{}',
  sound_id VARCHAR(64) REFERENCES sounds(id) ON DELETE SET NULL,
  duration INT NOT NULL DEFAULT 15,
  privacy VARCHAR(32) NOT NULL DEFAULT 'public',
  allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
  allow_duet BOOLEAN NOT NULL DEFAULT TRUE,
  views_count INT NOT NULL DEFAULT 0,
  likes_count INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  saves_count INT NOT NULL DEFAULT 0,
  shares_count INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'ready',
  is_taken_down BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_videos_author_created ON videos (author_id, created_at DESC);
CREATE INDEX idx_videos_created ON videos (created_at DESC);

-- Follows Table
CREATE TABLE IF NOT EXISTS follows (
  id VARCHAR(64) PRIMARY KEY,
  follower_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_follow_pair UNIQUE (follower_id, following_id)
);
CREATE INDEX idx_follows_follower ON follows (follower_id);
CREATE INDEX idx_follows_following ON follows (following_id);

-- Likes Table
CREATE TABLE IF NOT EXISTS likes (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id VARCHAR(64) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_like_pair UNIQUE (user_id, video_id)
);
CREATE INDEX idx_likes_video ON likes (video_id);
CREATE INDEX idx_likes_user ON likes (user_id);

-- Saves / Bookmarks Table
CREATE TABLE IF NOT EXISTS saves (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id VARCHAR(64) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_save_pair UNIQUE (user_id, video_id)
);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(64) PRIMARY KEY,
  video_id VARCHAR(64) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  author_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  likes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_comments_video_created ON comments (video_id, created_at DESC);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  recipient_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL,
  video_id VARCHAR(64) REFERENCES videos(id) ON DELETE CASCADE,
  comment_id VARCHAR(64) REFERENCES comments(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notifications_recipient ON notifications (recipient_id, created_at DESC);
`;
