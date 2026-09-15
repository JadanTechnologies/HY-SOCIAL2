import type { Handler, HandlerEvent } from "@netlify/functions";
import { videos, json, enrichVideo } from '../../../../_lib';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const videoId = event.path.split('/').pop() || event.queryStringParameters?.id;
  const video = videos.find((v) => v.id === videoId);
  if (!video || video.isTakenDown) return json({ error: 'Video not found or removed' }, 404);
  return json(enrichVideo(video));
};

function handleOptions() {
  return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }, body: '' };
}