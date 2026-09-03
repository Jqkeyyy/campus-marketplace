const test = require('node:test');
const assert = require('node:assert/strict');
const {
  makeVerificationToken,
  hashVerificationToken,
} = require('../services/email');
const { authCookieOptions } = require('../config/auth');
const { corsOrigin, requireTrustedOrigin } = require('../middleware/requestSecurity');

test('verification tokens are random, hashed, and expire', () => {
  const first = makeVerificationToken();
  const second = makeVerificationToken();

  assert.equal(first.token.length, 64);
  assert.equal(first.hash.length, 64);
  assert.notEqual(first.token, first.hash);
  assert.notEqual(first.token, second.token);
  assert.equal(hashVerificationToken(first.token), first.hash);
  assert.ok(first.expiresAt.getTime() > Date.now());
});

test('authentication cookie is inaccessible to browser JavaScript', () => {
  assert.equal(authCookieOptions.httpOnly, true);
});

test('CORS accepts configured origins and rejects other sites', async () => {
  const previousOrigin = process.env.CORS_ORIGIN;
  process.env.CORS_ORIGIN = 'https://market.example';

  await new Promise((resolve, reject) => {
    corsOrigin('https://market.example', (error, allowed) => {
      try {
        assert.equal(error, null);
        assert.equal(allowed, true);
        resolve();
      } catch (assertionError) {
        reject(assertionError);
      }
    });
  });

  await new Promise((resolve, reject) => {
    corsOrigin('https://evil.example', (error) => {
      try {
        assert.equal(error.status, 403);
        resolve();
      } catch (assertionError) {
        reject(assertionError);
      }
    });
  });

  if (previousOrigin === undefined) delete process.env.CORS_ORIGIN;
  else process.env.CORS_ORIGIN = previousOrigin;
});

test('cookie-authenticated writes require a trusted Origin header', () => {
  const previousOrigin = process.env.CORS_ORIGIN;
  process.env.CORS_ORIGIN = 'https://market.example';
  let responseStatus;

  const req = {
    method: 'POST',
    cookies: { auth_token: 'test' },
    get: () => 'https://evil.example',
  };
  const res = {
    status(status) {
      responseStatus = status;
      return this;
    },
    json() {},
  };

  requireTrustedOrigin(req, res, () => assert.fail('untrusted request reached next()'));
  assert.equal(responseStatus, 403);

  if (previousOrigin === undefined) delete process.env.CORS_ORIGIN;
  else process.env.CORS_ORIGIN = previousOrigin;
});
