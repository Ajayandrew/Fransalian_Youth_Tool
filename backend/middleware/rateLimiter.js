// Lightweight zero-dependency sliding window rate-limiter for high traffic
const rateLimitMap = new Map();

// Periodic cleanup of expired window entries every 5 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

const createLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
  const max = options.max || 300; // max 300 requests per window
  const message = options.message || 'Too many requests from this IP, please try again after 15 minutes.';

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const key = `${options.prefix || 'limit'}:${ip}`;
    const now = Date.now();

    let record = rateLimitMap.get(key);
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitMap.set(key, record);
      return next();
    }

    record.count++;

    if (record.count > max) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    next();
  };
};

const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500, // 500 requests per 15 mins for standard browsing
  prefix: 'api',
  message: 'API rate limit exceeded. Please slow down.'
});

const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 attempts per 15 mins for login protection
  prefix: 'auth',
  message: 'Too many authentication attempts. Please try again in 15 minutes.'
});

module.exports = { apiLimiter, authLimiter };
