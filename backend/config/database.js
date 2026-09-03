const { Pool } = require('pg');
require('dotenv').config({ quiet: true });

// Support both DATABASE_URL (production) and individual vars (local dev).
// TLS verification is enabled by default in production. Set DB_SSL_CA when
// the database provider uses a private certificate authority.
const useSsl = process.env.DB_SSL === 'true' || (
  process.env.NODE_ENV === 'production' && process.env.DB_SSL !== 'false'
);
const ssl = useSsl
  ? {
      rejectUnauthorized: true,
      ...(process.env.DB_SSL_CA && {
        ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n'),
      }),
    }
  : false;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'campus_marketplace',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

// 👇 add these logs
const pool = new Pool(poolConfig);

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
