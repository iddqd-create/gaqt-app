import { Redis } from '@upstash/redis';

// Initialize Redis client (optional, only if environment variables are set)
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export const isRedisEnabled = () => redis !== null;

// Cache keys
export const CACHE_KEYS = {
  LEADERBOARD: 'leaderboard:top100',
  ACTIVE_QUESTS: 'quests:active',
  DAILY_QUESTS: 'quests:daily',
  USER_PROFILE: (userId: string) => `user:${userId}:profile`,
  USER_QUESTS: (userId: string) => `user:${userId}:quests`,
};

// Cache TTL (in seconds)
export const CACHE_TTL = {
  LEADERBOARD: 3600, // 1 hour
  QUESTS: 1800, // 30 minutes
  USER_PROFILE: 300, // 5 minutes
};

/**
 * Get cached data
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  
  try {
    const data = await redis.get(key);
    return data as T | null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set cached data with TTL
 */
export async function setCached<T>(key: string, data: T, ttl: number): Promise<boolean> {
  if (!redis) return false;
  
  try {
    await redis.set(key, JSON.stringify(data), { ex: ttl });
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

/**
 * Delete cached data
 */
export async function deleteCached(key: string): Promise<boolean> {
  if (!redis) return false;
  
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
}

/**
 * Cache leaderboard data
 */
export async function cacheLeaderboard(data: any[]): Promise<boolean> {
  return setCached(CACHE_KEYS.LEADERBOARD, data, CACHE_TTL.LEADERBOARD);
}

/**
 * Get cached leaderboard
 */
export async function getCachedLeaderboard(): Promise<any[] | null> {
  return getCached<any[]>(CACHE_KEYS.LEADERBOARD);
}

/**
 * Cache active quests
 */
export async function cacheActiveQuests(data: any[]): Promise<boolean> {
  return setCached(CACHE_KEYS.ACTIVE_QUESTS, data, CACHE_TTL.QUESTS);
}

/**
 * Get cached active quests
 */
export async function getCachedActiveQuests(): Promise<any[] | null> {
  return getCached<any[]>(CACHE_KEYS.ACTIVE_QUESTS);
}

/**
 * Cache daily quests
 */
export async function cacheDailyQuests(data: any[]): Promise<boolean> {
  return setCached(CACHE_KEYS.DAILY_QUESTS, data, CACHE_TTL.QUESTS);
}

/**
 * Get cached daily quests
 */
export async function getCachedDailyQuests(): Promise<any[] | null> {
  return getCached<any[]>(CACHE_KEYS.DAILY_QUESTS);
}

/**
 * Invalidate quest caches
 */
export async function invalidateQuestCaches(): Promise<void> {
  if (!redis) return;
  
  try {
    await Promise.all([
      deleteCached(CACHE_KEYS.ACTIVE_QUESTS),
      deleteCached(CACHE_KEYS.DAILY_QUESTS),
    ]);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Batch get multiple keys
 */
export async function batchGet<T>(keys: string[]): Promise<(T | null)[]> {
  if (!redis || keys.length === 0) return keys.map(() => null);
  
  try {
    const pipeline = redis.pipeline();
    keys.forEach(key => pipeline.get(key));
    const results = await pipeline.exec();
    return results as (T | null)[];
  } catch (error) {
    console.error('Redis batch get error:', error);
    return keys.map(() => null);
  }
}

/**
 * Batch set multiple keys
 */
export async function batchSet(items: Array<{ key: string; value: any; ttl: number }>): Promise<boolean> {
  if (!redis || items.length === 0) return false;
  
  try {
    const pipeline = redis.pipeline();
    items.forEach(item => {
      pipeline.set(item.key, JSON.stringify(item.value), { ex: item.ttl });
    });
    await pipeline.exec();
    return true;
  } catch (error) {
    console.error('Redis batch set error:', error);
    return false;
  }
}

export default redis;
