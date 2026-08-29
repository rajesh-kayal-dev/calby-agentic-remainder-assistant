import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  /** Maximum number of requests allowed within the window. */
  maxRequests: number;
  /** Time window in milliseconds. */
  windowMs: number;
  /** Optional message for the 429 response. */
  message?: string;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Periodic cleanup to prevent memory leaks from stale entries
const CLEANUP_INTERVAL_MS = 60_000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanupTimer(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [, store] of stores) {
      for (const [key, entry] of store) {
        if (now > entry.resetAt) {
          store.delete(key);
        }
      }
    }
  }, CLEANUP_INTERVAL_MS);
  // Allow the process to exit even if the timer is running
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

/**
 * Simple in-memory sliding window rate limiter.
 *
 * Usage:
 *   app.use("/api/agent", rateLimiter({ maxRequests: 30, windowMs: 60_000 }));
 *
 * Keyed by IP address. For production with multiple instances, swap to Redis-based.
 */
export function rateLimiter(options: RateLimiterOptions) {
  const { maxRequests, windowMs, message } = options;

  // Each rate limiter instance gets its own store
  const storeKey = `${maxRequests}:${windowMs}:${Math.random()}`;
  const store = new Map<string, RateLimitEntry>();
  stores.set(storeKey, store);
  startCleanupTimer();

  return function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    // Key by IP — works behind proxies if trust proxy is configured
    const clientKey = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    const entry = store.get(clientKey);

    if (!entry || now > entry.resetAt) {
      // New window
      store.set(clientKey, { count: 1, resetAt: now + windowMs });
      res.setHeader("X-RateLimit-Limit", String(maxRequests));
      res.setHeader("X-RateLimit-Remaining", String(maxRequests - 1));
      next();
      return;
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSec));
      res.setHeader("X-RateLimit-Limit", String(maxRequests));
      res.setHeader("X-RateLimit-Remaining", "0");
      res.status(429).json({
        error: message || "Too many requests. Please try again later.",
        retryAfterSeconds: retryAfterSec,
      });
      return;
    }

    res.setHeader("X-RateLimit-Limit", String(maxRequests));
    res.setHeader(
      "X-RateLimit-Remaining",
      String(maxRequests - entry.count),
    );
    next();
  };
}
