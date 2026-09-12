import type { VercelRequest, VercelResponse } from '@vercel/node';
import { videos, json, userSaves } from '../../_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json(res, {});
  if (req.method !== 'POST') return json(res, { error: 'Method not allowed' }, 405);

  const uid = (req.headers['x-user-id'] as string) || null;
  if (!uid) return json(res, { error: 'Please log in to bookmark videos' }, 401);

  const video = videos.find((v) => v.id === req.query.id);
  if (!video) return json(res, { error: 'Video not found' }, 404);

  let isSaved = false;
  if (userSaves.has(video.id)) {
    userSaves.delete(video.id);
    video.savesCount = Math.max(0, video.savesCount - 1);
  } else {
    userSaves.add(video.id);
    video.savesCount += 1;
    isSaved = true;
  }
  return json(res, { success: true, isSaved, savesCount: video.savesCount });
}