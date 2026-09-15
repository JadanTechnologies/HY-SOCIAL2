import type { Handler, HandlerEvent } from "@netlify/functions";
import { videos, json, userSaves, getUserId } from '../../../../_lib';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const uid = getUserId(event);
  if (!uid) return json({ error: 'Please log in to bookmark videos' }, 401);

  const videoId = event.path.split('/')[event.path.split('/').length - 2] || event.queryStringParameters?.id;
  const video = videos.find((v) => v.id === videoId);
  if (!video) return json({ error: 'Video not found' }, 404);

  let isSaved = false;
  if (userSaves.has(video.id)) {
    userSaves.delete(video.id);
    video.savesCount = Math.max(0, video.savesCount - 1);
  } else {
    userSaves.add(video.id);
    video.savesCount += 1;
    isSaved = true;
  }
  return json({ success: true, isSaved, savesCount: video.savesCount });
};

function handleOptions() {
  return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }, body: '' };
}

function getUserId(event: HandlerEvent): string | null {
  return event.headers['x-user-id'] || event.headers['X-User-Id'] || null;
}