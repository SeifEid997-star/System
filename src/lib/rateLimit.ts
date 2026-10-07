interface RateLimitEntry {
  attempts: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitEntry>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const MAX_ATTEMPTS = 5;

// Periodically purge expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.resetTime) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export function checkLoginRateLimit(identifier: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordFailedLoginAttempt(identifier: string): void {
  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    memoryStore.set(identifier, {
      attempts: 1,
      resetTime: now + WINDOW_MS,
    });
  } else {
    entry.attempts += 1;
  }
}

export function resetLoginRateLimit(identifier: string): void {
  memoryStore.delete(identifier);
}
