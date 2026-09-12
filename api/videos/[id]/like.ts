import type { VercelRequest, VercelResponse } from '@vercel/node';
import { videos, json, userLikes, userFollows, notifications } from '../../_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json(res, {});
  if (req.method !== 'POST') return json(res, { error: 'Method not allowed' }, 405);

  const uid = (req.headers['x-user-id'] as string) || null;
  if (!uid) return json(res, { error: 'Please log in to like videos' }, 401);

  const video = videos.find((v) => v.id === req.query.id);
  if (!video) return json(res, { error: 'Video not found' }, 404);

  let isLiked = false;
  if (userLikes.has(video.id)) {
    userLikes.delete(video.id);
    video.likesCount = Math.max(0, video.likesCount - 1);
  } else {
    userLikes.add(video.id);
    video.likesCount += 1;
    isLiked = true;
    if (video.authorId !== uid) {
      notifications.unshift({ id: `notif-${Date.now()}`, recipientId: video.authorId, actorId: uid, type: 'like', videoId: video.id, videoThumbnail: video.thumbnailUrl, text: 'liked your video', read: false, createdAt: new Date().toISOString() });
    }
  }
  return json(res, { success: true, isLiked, likesCount: video.likesCount });
}