import { createClient } from 'redis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// ═══════════════════════════════════════════════════════════
// Redis Client — Graceful fallback when Redis is unavailable
// ═══════════════════════════════════════════════════════════

let client = null;
let isConnected = false;

export async function connectRedis() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    client = createClient({ url });

    client.on('error', (err) => {
      // Only log first error to avoid spamming logs
      if (isConnected || !client._hasLoggedError) {
        console.warn('[Redis] Connection error — cache disabled:', err.message);
        client._hasLoggedError = true;
      }
      isConnected = false;
    });

    client.on('connect', () => {
      console.log('[Redis] ✅ Connected successfully');
      isConnected = true;
      client._hasLoggedError = false;
    });

    client.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });

    await client.connect();
    return client;
  } catch (err) {
    console.warn('[Redis] ⚠️  Could not connect — running without Redis cache:', err.message);
    isConnected = false;
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// Safe wrappers — always resolve, never throw
// Falls back to null if Redis is down
// ─────────────────────────────────────────────────────────

export async function redisGet(key) {
  if (!client || !isConnected) return null;
  try {
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    return null;
  }
}

export async function redisSet(key, value, ttlSeconds = 86400) {
  if (!client || !isConnected) return false;
  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (err) {
    return false;
  }
}

export async function redisDel(key) {
  if (!client || !isConnected) return false;
  try {
    await client.del(key);
    return true;
  } catch (err) {
    return false;
  }
}

export async function redisFlushPattern(pattern) {
  if (!client || !isConnected) return 0;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return keys.length;
  } catch (err) {
    return 0;
  }
}

export function getRedisStatus() {
  return { connected: isConnected, url: process.env.REDIS_URL || 'redis://localhost:6379' };
}

export default client;
