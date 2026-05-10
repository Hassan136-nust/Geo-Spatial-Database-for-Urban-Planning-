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
let isConnecting = false;

export async function connectRedis() {
  if (client && (isConnected || isConnecting)) return client;
  
  let url = process.env.REDIS_URL || 'redis://localhost:6379';
  
  // Ensure 'default' username is present if missing in a password-protected cloud URL
  if (url.includes('@') && !url.includes('redis://default:') && url.startsWith('redis://:')) {
    url = url.replace('redis://:', 'redis://default:');
  }
  
  isConnecting = true;

  try {
    client = createClient({
      url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 20) return new Error('[Redis] Max retries reached');
          return Math.min(retries * 100, 1500); // Faster initial retries
        },
        keepAlive: 15000,
        connectTimeout: 15000,
        family: 4
      },
      pingInterval: 15000
    });

    client.on('error', (err) => {
      if (err.code === 'ECONNRESET') {
        // Suppress scary logs for common network blips
        if (isConnected) console.log(' [Redis] Network handshake refreshed');
      } else {
        console.warn(' [Redis] Cache state updated:', err.message);
      }
      isConnected = false;
    });

    client.on('connect', () => {
      console.log(' [Redis] Production instance connected');
      isConnected = true;
      isConnecting = false;
    });

    client.on('end', () => {
      isConnected = false;
      isConnecting = false;
    });

    await client.connect();
    return client;
  } catch (err) {
    console.warn(' [Redis] Handshake failed — falling back to DB storage');
    isConnecting = false;
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
