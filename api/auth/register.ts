import type { VercelRequest, VercelResponse } from '@vercel/node';
import { users, json, currentUserId, notifications } from './_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json(res, {});
  if (req.method !== 'POST') return json(res, { error: 'Method not allowed' }, 405);

  const { username, email, password, displayName } = req.body || {};
  if (!username || !email || !password) return json(res, { error: 'Username, email, and password are required' }, 400);

  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (cleanUsername.length < 3) return json(res, { error: 'Username must be at least 3 characters long' }, 400);

  const cleanEmail = email.trim().toLowerCase();
  const existingUser = users.find((u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail);
  if (existingUser) {
    return json(res, { error: existingUser.username.toLowerCase() === cleanUsername ? 'Username is already taken' : 'An account with this email already exists' }, 409);
  }

  const newId = `u-${Date.now()}`;
  const defaultAvatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  ];
  const chosenAvatar = defaultAvatars[users.length % defaultAvatars.length];

  const newUser = {
    id: newId, email: cleanEmail, username: cleanUsername,
    displayName: displayName?.trim() || cleanUsername, passwordHash: password,
    avatar: chosenAvatar, bio: 'Creator on HY 🇳🇬✨', verified: false,
    followersCount: 0, followingCount: 0, likesCount: 0, role: 'user' as const,
  };
  users.push(newUser);

  notifications.unshift({ id: `notif-${Date.now()}`, recipientId: newUser.id, actorId: 'u-1', type: 'system', text: `Welcome to HY, @${newUser.username}!`, read: false, createdAt: new Date().toISOString() });

  const { passwordHash: _pw, ...userSafe } = newUser;
  return json(res, { success: true, user: userSafe }, 201);
}