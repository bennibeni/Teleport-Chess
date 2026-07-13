import { Redis } from "@upstash/redis";

// Reads Upstash REST credentials injected by the Vercel "Redis" marketplace
// integration (Storage tab -> Redis -> Connect to Project).
// If your integration used different env var names, update these two lines
// to match what appears in Project Settings -> Environment Variables.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "",
});

const GAME_TTL_SECONDS = 60 * 60 * 24 * 7; // games expire after 7 days of inactivity

export async function redisGetGame<T>(id: string): Promise<T | null> {
  const data = await redis.get<T>(`game:${id}`);
  return data ?? null;
}

export async function redisSaveGame<T>(id: string, value: T): Promise<void> {
  await redis.set(`game:${id}`, value, { ex: GAME_TTL_SECONDS });
}
