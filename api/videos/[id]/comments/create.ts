import type { VercelRequest, VercelResponse } from '@vercel/node';
import { comments, users, videos, json, notifications } from '../../../../_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json(res, {});
  if (req.method !== 'POST') return json(res, { error: 'Method not allowed' }, 405);

  const uid = (req.headers['x-user-id'] as string) || null;
  if (!uid) return json(res, { error: 'Please log in to comment' }, 401);

  const { text } = req.body || {};
  const video = videos.find((v) => v.id === req.query.id);
  if (!video) return json(res, { error: 'Video not found' }, 404);
  if (!text || text.trim().length === 0) return json(res, { error: 'Comment text required' }, 400);

  const newComment = { id: `c-${Date.now()}`, videoId: video.id, authorId: uid, text: text.trim(), createdAt: new Date().toISOString(), likesCount: 0, repliesCount: 0 };
  comments.unshift(newComment);
  video.commentsCount += 1;

  if (video.authorId !== uid) {
    notifications.unshift({ id: `notif-${Date.now()}`, recipientId: video.authorId, actorId: uid, type: 'comment', videoId: video.id, videoThumbnail: video.thumbnailUrl, text: `commented: "${text.trim().substring(0, 60)}"`, read: false, createdAt: new Date().toISOString() });
  }

  const author = users.find((u) => u.id === uid) || users[0];
  return json(res, { ...newComment, author });
}