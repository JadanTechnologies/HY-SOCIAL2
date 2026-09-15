import type { Handler, HandlerEvent } from "@netlify/functions";
import { users, json, getUserId, userLikes, userSaves, userFollows } from './_lib';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const uid = getUserId(event);
  if (!uid) return json({ user: null, authenticated: false });

  const user = users.find((u) => u.id === uid);
  if (!user) return json({ user: null, authenticated: false });

  const { passwordHash: _pw, ...userSafe } = user;
  return json({ user: { ...userSafe, followingCount: userFollows.size, likedVideosCount: userLikes.size, savedVideosCount: userSaves.size }, authenticated: true });
};

function handleOptions() {
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' },
    body: '',
  };
}