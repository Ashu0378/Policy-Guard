const rateLimit = require('express-rate-limit');

const scanRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 30, // Limit each IP to 30 scan requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many scan requests from this IP address. Please try again after 15 minutes.'
  }
});

module.exports = scanRateLimiter;
