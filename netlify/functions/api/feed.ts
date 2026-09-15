import type { Handler, HandlerEvent } from "@netlify/functions";
import { users, videos, json, userFollows, enrichVideo } from '../../../_lib';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const type = event.queryStringParameters?.type || 'foryou';
  const tag = event.queryStringParameters?.tag;
  const cursor = event.queryStringParameters?.cursor;
  const limit = Math.min(20, Math.max(1, parseInt(event.queryStringParameters?.limit || '4', 10)));

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

  return json({ videos: paginated.map(enrichVideo), nextCursor, hasMore, total: filtered.length });
};

function handleOptions() {
  return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }, body: '' };
}