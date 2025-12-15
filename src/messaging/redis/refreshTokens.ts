import { getRedisClient } from "./client";

export async function saveRefreshToken(
  userId: string,
  fingerprint: string | null,
  token: string,
  ttlSeconds: number,
): Promise<void> {
  const fp = fingerprint ?? "none";
  const key = `rt:${userId}:${fp}`;

  const client = getRedisClient();
  await client.set(key, token, { EX: ttlSeconds });
}

export async function loadRefreshToken(
  userId: string,
  fingerprint: string | null,
): Promise<string | null> {
  const fp = fingerprint ?? "none";
  const key = `rt:${userId}:${fp}`;

  const client = getRedisClient();
  return client.get(key);
}

export async function deleteRefreshToken(
  userId: string,
  fingerprint: string | null,
): Promise<void> {
  const fp = fingerprint ?? "none";
  const key = `rt:${userId}:${fp}`;

  const client = getRedisClient();
  await client.del(key);
}
