import type { Handler, HandlerEvent } from "@netlify/functions";
import { comments, users, videos, json, notifications, getUserId } from '../../../../../_lib';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();

  if (event.httpMethod === 'GET') {
    const videoId = event.path.split('/')[event.path.split('/').length - 3] || event.queryStringParameters?.id;
    const videoComments = comments.filter((c) => c.videoId === videoId);
    const enriched = videoComments.map((c) => ({ ...c, author: users.find((u) => u.id === c.authorId) || users[0] }));
    return json(enriched);
  }

  if (event.httpMethod === 'POST') {
    const uid = getUserId(event);
    if (!uid) return json({ error: 'Please log in to comment' }, 401);

    const body = parseBody(event);
    const { text } = body;
    const videoId = event.path.split('/')[event.path.split('/').length - 3] || event.queryStringParameters?.id;
    const video = videos.find((v) => v.id === videoId);
    if (!video) return json({ error: 'Video not found' }, 404);
    if (!text || text.trim().length === 0) return json({ error: 'Comment text required' }, 400);

    const newComment = { id: `c-${Date.now()}`, videoId: video.id, authorId: uid, text: text.trim(), createdAt: new Date().toISOString(), likesCount: 0, repliesCount: 0 };
    comments.unshift(newComment);
    video.commentsCount += 1;

    if (video.authorId !== uid) {
      notifications.unshift({ id: `notif-${Date.now()}`, recipientId: video.authorId, actorId: uid, type: 'comment', videoId: video.id, videoThumbnail: video.thumbnailUrl, text: `commented: "${text.trim().substring(0, 60)}"`, read: false, createdAt: new Date().toISOString() });
    }

    const author = users.find((u) => u.id === uid) || users[0];
    return json({ ...newComment, author });
  }

  return json({ error: 'Method not allowed' }, 405);
};

function handleOptions() {
  return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }, body: '' };
}

function parseBody(event: HandlerEvent): any {
  if (!event.body) return {};
  try { return JSON.parse(event.body); } catch { return {}; }
}

function getUserId(event: HandlerEvent): string | null {
  return event.headers['x-user-id'] || event.headers['X-User-Id'] || null;
}