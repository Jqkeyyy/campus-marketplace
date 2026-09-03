const crypto = require('crypto');
const sendgrid = require('@sendgrid/mail');

const TOKEN_TTL_MS = 30 * 60 * 1000;

const makeVerificationToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    hash: crypto.createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  };
};

const hashVerificationToken = (token) => (
  crypto.createHash('sha256').update(token).digest('hex')
);

const sendVerificationEmail = async (email, token) => {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM;
  const frontendUrl = process.env.FRONTEND_URL;

  if (!apiKey || !from || !frontendUrl) {
    throw new Error('Email verification is not configured');
  }

  const verificationUrl = new URL('/verify-email', frontendUrl);
  verificationUrl.searchParams.set('token', token);

  sendgrid.setApiKey(apiKey);
  await sendgrid.send({
    to: email,
    from,
    subject: 'Verify your Campus Marketplace email',
    text: `Verify your email within 30 minutes: ${verificationUrl.toString()}`,
    html: `<p>Verify your email within 30 minutes:</p><p><a href="${verificationUrl.toString()}">Verify email</a></p><p>If you did not request this account, ignore this message.</p>`,
  });
};

module.exports = {
  makeVerificationToken,
  hashVerificationToken,
  sendVerificationEmail,
};
