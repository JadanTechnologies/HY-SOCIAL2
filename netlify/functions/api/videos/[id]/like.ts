import type { Handler, HandlerEvent } from "@netlify/functions";
import { videos, json, userLikes, getUserId, notifications } from '../../../../_lib';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const uid = getUserId(event);
  if (!uid) return json({ error: 'Please log in to like videos' }, 401);

  const videoId = event.path.split('/')[event.path.split('/').length - 2] || event.queryStringParameters?.id;
  const video = videos.find((v) => v.id === videoId);
  if (!video) return json({ error: 'Video not found' }, 404);

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
  return json({ success: true, isLiked, likesCount: video.likesCount });
};

function handleOptions() {
  return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }, body: '' };
}

function getUserId(event: HandlerEvent): string | null {
  return event.headers['x-user-id'] || event.headers['X-User-Id'] || null;
}