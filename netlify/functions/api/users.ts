import type { Handler, HandlerEvent } from "@netlify/functions";
import { users, json, userFollows } from '../../../_lib';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const uid = getUserId(event);
  return json(users.map((u) => ({ ...u, isFollowing: uid ? userFollows.has(u.id) : false })));
};

function handleOptions() {
  return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }, body: '' };
}

function getUserId(event: HandlerEvent): string | null {
  return event.headers['x-user-id'] || event.headers['X-User-Id'] || null;
}