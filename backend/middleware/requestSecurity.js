const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const getAllowedOrigins = () => (
  process.env.CORS_ORIGIN || 'http://localhost:3000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigin = (origin, callback) => {
  if (!origin || getAllowedOrigins().includes(origin)) {
    return callback(null, true);
  }
  const error = new Error('Origin is not allowed by CORS');
  error.status = 403;
  return callback(error);
};

const requireTrustedOrigin = (req, res, next) => {
  if (SAFE_METHODS.has(req.method) || !req.cookies?.auth_token) {
    return next();
  }

  const origin = req.get('origin');
  if (!origin || !getAllowedOrigins().includes(origin)) {
    return res.status(403).json({ error: 'Untrusted request origin' });
  }

  return next();
};

module.exports = { corsOrigin, requireTrustedOrigin };
