import type { VercelRequest, VercelResponse } from '@vercel/node';
import { users, json, userFollows } from './_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json(res, {});
  if (req.method !== 'GET') return json(res, { error: 'Method not allowed' }, 405);

  const uid = (req.headers['x-user-id'] as string) || null;
  return json(res, users.map((u) => ({ ...u, isFollowing: uid ? userFollows.has(u.id) : false })));
}