import type { Handler, HandlerEvent } from "@netlify/functions";
import { users, json, userFollows, getUserId } from '../../../../_lib';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const uid = getUserId(event);
  if (!uid) return json({ error: 'Please log in to follow creators' }, 401);

  const targetId = event.path.split('/').pop() || event.queryStringParameters?.id;
  const targetUser = users.find((u) => u.id === targetId);
  if (!targetUser) return json({ error: 'User not found' }, 404);

  let following = false;
  if (userFollows.has(targetId)) {
    userFollows.delete(targetId);
    targetUser.followersCount = Math.max(0, targetUser.followersCount - 1);
  } else {
    userFollows.add(targetId);
    targetUser.followersCount += 1;
    following = true;
  }

  return json({ success: true, isFollowing: following, followersCount: targetUser.followersCount });
};

function handleOptions() {
  return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }, body: '' };
}

function getUserId(event: HandlerEvent): string | null {
  return event.headers['x-user-id'] || event.headers['X-User-Id'] || null;
}