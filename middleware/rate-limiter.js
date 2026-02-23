const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Too Many Requests', message: 'Request rate exceeded, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) return forwarded.split(',')[0].trim();
        if (req.headers['x-real-ip']) return req.headers['x-real-ip'];
        return req.ip || req.connection.remoteAddress;
    },
    handler: (req, res) => {
        console.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ error: 'Too Many Requests', retryAfter: req.rateLimit.resetTime });
    }
});

module.exports = limiter;
