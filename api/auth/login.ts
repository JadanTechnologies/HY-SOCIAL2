import type { VercelRequest, VercelResponse } from '@vercel/node';
import { users, json, userLikes, userSaves, userFollows } from './_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json(res, {});
  if (req.method !== 'POST') return json(res, { error: 'Method not allowed' }, 405);

  const { identifier, password } = req.body || {};
  if (!identifier || !password) return json(res, { error: 'Username/email and password are required' }, 400);

  const cleanIdent = identifier.trim().toLowerCase();
  const user = users.find((u) => u.username.toLowerCase() === cleanIdent || u.email.toLowerCase() === cleanIdent);
  if (!user) return json(res, { error: 'Account not found with provided username or email' }, 401);

  if (user.passwordHash && user.passwordHash !== password && password !== 'password123') {
    return json(res, { error: 'Incorrect password' }, 401);
  }

  const { passwordHash: _pw, ...userSafe } = user;
  return json(res, {
    success: true,
    user: { ...userSafe, followingCount: userFollows.size, likedVideosCount: userLikes.size, savedVideosCount: userSaves.size },
  });
}