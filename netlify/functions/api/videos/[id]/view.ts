import type { Handler, HandlerEvent } from "@netlify/functions";
import { videos, json } from '../../../../_lib';

const viewCooldowns = new Map<string, number>();
const VIEW_COOLDOWN_MS = 5 * 60 * 1000;

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const videoId = event.path.split('/')[event.path.split('/').length - 2] || event.queryStringParameters?.id;
  const video = videos.find((v) => v.id === videoId);
  if (!video) return json({ error: 'Video not found' }, 404);

  const body = parseBody(event);
  const { durationWatched = 0, percentWatched = 0, sessionToken } = body;
  const viewerKey = sessionToken || event.headers['x-forwarded-for'] || 'viewer';
  const cooldownKey = `${video.id}:${viewerKey}`;
  const lastViewTime = viewCooldowns.get(cooldownKey) || 0;
  const now = Date.now();

  const minDuration = Math.min(3, Math.max(1.5, video.duration * 0.25));
  const meetsThreshold = durationWatched >= minDuration || percentWatched >= 25;

  if (meetsThreshold && now - lastViewTime > VIEW_COOLDOWN_MS) {
    viewCooldowns.set(cooldownKey, now);
    video.viewsCount += 1;
    return json({ success: true, viewsCount: video.viewsCount, counted: true });
  }

  return json({ success: true, viewsCount: video.viewsCount, counted: false, reason: !meetsThreshold ? 'threshold_not_met' : 'duplicate_cooldown' });
};

function handleOptions() {
  return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }, body: '' };
}

function parseBody(event: HandlerEvent): any {
  if (!event.body) return {};
  try { return JSON.parse(event.body); } catch { return {}; }
}