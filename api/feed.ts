import type { VercelRequest, VercelResponse } from '@vercel/node';
import { users, videos, json, userFollows, enrichVideo } from '../_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json(res, {});
  if (req.method !== 'GET') return json(res, { error: 'Method not allowed' }, 405);

  const type = (req.query.type as string) || 'foryou';
  const tag = req.query.tag as string;
  const cursor = req.query.cursor as string;
  const limit = Math.min(20, Math.max(1, parseInt((req.query.limit as string) || '4', 10)));

  let filtered = videos.filter((v) => !v.isTakenDown);
  if (tag) {
    const cleanTag = tag.toLowerCase().replace('#', '');
    filtered = filtered.filter((v) => v.hashtags.some((h) => h.toLowerCase() === cleanTag));
  } else if (type === 'following') {
    filtered = filtered.filter((v) => userFollows.has(v.authorId));
  } else if (type === 'trending') {
    filtered = [...filtered].sort((a, b) => b.likesCount + b.sharesCount * 2 - (a.likesCount + a.sharesCount * 2));
  } else {
    filtered = [...filtered].sort((a, b) => {
      const aBoost = userFollows.has(a.authorId) ? 1.3 : 1.0;
      const bBoost = userFollows.has(b.authorId) ? 1.3 : 1.0;
      const aEng = (a.likesCount + a.savesCount * 2) / Math.max(1, a.viewsCount);
      const bEng = (b.likesCount + b.savesCount * 2) / Math.max(1, b.viewsCount);
      return bEng * bBoost - aEng * aBoost;
    });
  }

  let startIndex = 0;
  if (cursor) {
    const cursorIdx = filtered.findIndex((v) => v.id === cursor);
    if (cursorIdx !== -1) startIndex = cursorIdx + 1;
  }

  const paginated = filtered.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < filtered.length;
  const nextCursor = hasMore && paginated.length > 0 ? paginated[paginated.length - 1].id : null;

  return json(res, { videos: paginated.map(enrichVideo), nextCursor, hasMore, total: filtered.length });
}