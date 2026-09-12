import type { VercelRequest, VercelResponse } from '@vercel/node';
import { videos, json, enrichVideo } from '../_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json(res, {});
  if (req.method !== 'GET') return json(res, { error: 'Method not allowed' }, 405);

  const video = videos.find((v) => v.id === req.query.id);
  if (!video || video.isTakenDown) return json(res, { error: 'Video not found or removed' }, 404);
  return json(res, enrichVideo(video));
}