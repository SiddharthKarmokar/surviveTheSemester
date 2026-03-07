const defaultKeyGenerator = (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown';

function createLimiterStore(windowMs, max) {
  const store = new Map();

  return (key) => {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      const nextEntry = { count: 1, resetAt: now + windowMs };
      store.set(key, nextEntry);
      return { allowed: true, remaining: max - 1, resetAt: nextEntry.resetAt };
    }

    if (entry.count >= max) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count += 1;
    return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
  };
}

export function createRateLimiter({ windowMs, max, message, keyGenerator = defaultKeyGenerator }) {
  const checkLimit = createLimiterStore(windowMs, max);

  return (req, res, next) => {
    const key = keyGenerator(req);
    const result = checkLimit(key);

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, result.remaining)));
    res.setHeader('X-RateLimit-Reset', String(result.resetAt));

    if (!result.allowed) {
      return res.status(429).json({
        success: false,
        message: message || 'Too many requests. Please try again later.',
      });
    }

    return next();
  };
}

export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: 'Too many authentication attempts. Please try again later.',
  keyGenerator: (req) => `${defaultKeyGenerator(req)}:${req.baseUrl || ''}${req.path || ''}`,
});

export const searchRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many search requests. Please slow down.',
  keyGenerator: (req) => req.user?.id || defaultKeyGenerator(req),
});

export const socialRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: 'Too many social actions. Please slow down.',
  keyGenerator: (req) => req.user?.id || defaultKeyGenerator(req),
});