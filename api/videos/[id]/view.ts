import type { VercelRequest, VercelResponse } from '@vercel/node';
import { videos, json } from '../../_lib';

const viewCooldowns = new Map<string, number>();
const VIEW_COOLDOWN_MS = 5 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json(res, {});
  if (req.method !== 'POST') return json(res, { error: 'Method not allowed' }, 405);

  const video = videos.find((v) => v.id === req.query.id);
  if (!video) return json(res, { error: 'Video not found' }, 404);

  const { durationWatched = 0, percentWatched = 0, sessionToken } = req.body || {};
  const viewerKey = sessionToken || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'viewer';
  const cooldownKey = `${video.id}:${viewerKey}`;
  const lastViewTime = viewCooldowns.get(cooldownKey) || 0;
  const now = Date.now();

  const minDuration = Math.min(3, Math.max(1.5, video.duration * 0.25));
  const meetsThreshold = durationWatched >= minDuration || percentWatched >= 25;

  if (meetsThreshold && now - lastViewTime > VIEW_COOLDOWN_MS) {
    viewCooldowns.set(cooldownKey, now);
    video.viewsCount += 1;
    return json(res, { success: true, viewsCount: video.viewsCount, counted: true });
  }

  return json(res, { success: true, viewsCount: video.viewsCount, counted: false, reason: !meetsThreshold ? 'threshold_not_met' : 'duplicate_cooldown' });
}