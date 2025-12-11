import { createClient, RedisClientType } from "redis";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";

let redisClient: RedisClientType | null = null;

export async function initRedis(): Promise<RedisClientType> {
  if (redisClient) {
    return redisClient;
  }

  redisClient = createClient({
    url: env.redisUrl,
  });

  redisClient.on("error", (err) => {
    logger.error({ err, msg: "Redis client error" });
  });

  redisClient.on("connect", () => {
    logger.info("Redis client connected");
  });

  await redisClient.connect();
  return redisClient;
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error("Redis client is not initialized. Call initRedis() first.");
  }
  return redisClient;
}

export async function redisSetJson(
  key: string,
  value: unknown,
  ttlSeconds?: number,
): Promise<void> {
  const client = await initRedis();
  const json = JSON.stringify(value);

  if (ttlSeconds && ttlSeconds > 0) {
    await client.set(key, json, { EX: ttlSeconds });
  } else {
    await client.set(key, json);
  }
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
  const client = await initRedis();
  const raw = await client.get(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.error({ err, key, msg: "Failed to parse JSON from Redis" });
    return null;
  }
}
