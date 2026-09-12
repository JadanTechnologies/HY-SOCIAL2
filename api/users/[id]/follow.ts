import type { VercelRequest, VercelResponse } from '@vercel/node';
import { users, json, userFollows } from '../_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json(res, {});
  if (req.method !== 'POST') return json(res, { error: 'Method not allowed' }, 405);

  const uid = (req.headers['x-user-id'] as string) || null;
  if (!uid) return json(res, { error: 'Please log in to follow creators' }, 401);

  const targetId = req.query.id as string;
  const targetUser = users.find((u) => u.id === targetId);
  if (!targetUser) return json(res, { error: 'User not found' }, 404);

  let following = false;
  if (userFollows.has(targetId)) {
    userFollows.delete(targetId);
    targetUser.followersCount = Math.max(0, targetUser.followersCount - 1);
  } else {
    userFollows.add(targetId);
    targetUser.followersCount += 1;
    following = true;
  }

  return json(res, { success: true, isFollowing: following, followersCount: targetUser.followersCount });
}