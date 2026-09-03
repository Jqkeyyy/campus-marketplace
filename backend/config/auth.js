const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === 'production';
const sameSite = process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax');

if (!['lax', 'strict', 'none'].includes(sameSite)) {
  throw new Error('COOKIE_SAME_SITE must be lax, strict, or none');
}

if (sameSite === 'none' && !isProduction) {
  console.warn('COOKIE_SAME_SITE=none requires HTTPS in modern browsers');
}

const authCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite,
  maxAge: ONE_DAY_MS,
  path: '/',
};

const clearAuthCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite,
  path: '/',
};

module.exports = {
  authCookieOptions,
  clearAuthCookieOptions,
  jwtOptions: {
    algorithm: 'HS256',
    expiresIn: '1d',
    issuer: 'campus-marketplace-api',
    audience: 'campus-marketplace-web',
  },
  jwtVerifyOptions: {
    algorithms: ['HS256'],
    issuer: 'campus-marketplace-api',
    audience: 'campus-marketplace-web',
  },
};
