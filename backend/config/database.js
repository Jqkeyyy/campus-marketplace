const { Pool } = require('pg');
require('dotenv').config();

// Support both DATABASE_URL (production) and individual vars (local dev)
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
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
console.log('Using DATABASE_URL?', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  try {
    const parts = process.env.DATABASE_URL.split('@')[1]?.split('?')[0];
    console.log('DB host (from URL):', parts);
  } catch {
    console.log('Could not parse DB host from DATABASE_URL');
  }
}

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
