import type { VercelRequest, VercelResponse } from '@vercel/node';
import { users, json, getUserId, currentUserId, userLikes, userSaves, userFollows, notifications, enrichVideo } from './_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json(res, {});
  if (req.method !== 'GET') return json(res, { error: 'Method not allowed' }, 405);

  const uid = getUserId(req);
  if (!uid) return json(res, { user: null, authenticated: false });

  const user = users.find((u) => u.id === uid);
  if (!user) return json(res, { user: null, authenticated: false });

  const { passwordHash: _pw, ...userSafe } = user;
  return json(res, {
    user: { ...userSafe, followingCount: userFollows.size, likedVideosCount: userLikes.size, savedVideosCount: userSaves.size },
    authenticated: true,
  });
}