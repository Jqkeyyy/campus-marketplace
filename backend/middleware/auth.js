const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { jwtVerifyOptions } = require('../config/auth');

const getToken = (req) => {
  const authHeader = req.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return req.cookies?.auth_token;
};

const loadAuthenticatedUser = async (token) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET, jwtVerifyOptions);
  const result = await db.query(
    `SELECT "UserID", email, display_name, phone, created_at, is_admin, status, email_verified
     FROM "User" WHERE "UserID" = $1`,
    [payload.sub]
  );

  const user = result.rows[0];
  if (!user || user.status !== 'active' || !user.email_verified) {
    return null;
  }

  return user;
};

const authenticateToken = async (req, res, next) => {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = await loadAuthenticatedUser(token);
    if (!user) {
      return res.status(401).json({ error: 'Account is inactive or unavailable' });
    }
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    return next(error);
  }
};

const optionalAuthenticateToken = async (req, res, next) => {
  const token = getToken(req);
  if (!token) {
    return next();
  }

  try {
    req.user = await loadAuthenticatedUser(token);
  } catch (error) {
    if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') {
      return next(error);
    }
  }
  return next();
};

const isAdmin = (req, res, next) => {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
};

module.exports = { authenticateToken, optionalAuthenticateToken, isAdmin };
