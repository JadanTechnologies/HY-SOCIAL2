import type { VercelRequest, VercelResponse } from '@vercel/node';
import { videos, json } from '../../_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json(res, {});
  if (req.method !== 'POST') return json(res, { error: 'Method not allowed' }, 405);

  const video = videos.find((v) => v.id === req.query.id);
  if (!video) return json(res, { error: 'Video not found' }, 404);
  video.sharesCount += 1;
  return json(res, { success: true, sharesCount: video.sharesCount });
}