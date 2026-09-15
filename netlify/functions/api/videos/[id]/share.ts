import type { Handler, HandlerEvent } from "@netlify/functions";
import { videos, json } from '../../../../_lib';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const videoId = event.path.split('/')[event.path.split('/').length - 2] || event.queryStringParameters?.id;
  const video = videos.find((v) => v.id === videoId);
  if (!video) return json({ error: 'Video not found' }, 404);
  video.sharesCount += 1;
  return json({ success: true, sharesCount: video.sharesCount });
};

function handleOptions() {
  return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }, body: '' };
}