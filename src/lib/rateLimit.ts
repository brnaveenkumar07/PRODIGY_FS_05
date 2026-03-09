interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export function rateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt <= now) {
    const newEntry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
    store.set(identifier, newEntry);
    return { success: true, remaining: maxRequests - 1, resetAt: newEntry.resetAt };
  }

  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { success: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

// Preset rate limiters
export function authRateLimit(ip: string) {
  return rateLimit(`auth:${ip}`, 10, 60 * 1000); // 10 requests per minute
}

export function postRateLimit(userId: string) {
  return rateLimit(`post:${userId}`, 20, 60 * 1000); // 20 posts per minute
}

export function commentRateLimit(userId: string) {
  return rateLimit(`comment:${userId}`, 30, 60 * 1000); // 30 comments per minute
}
