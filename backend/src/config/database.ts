import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const { DB_USER, DB_HOST, DB_DATABASE, DB_PASSWORD, DB_PORT } = process.env;

const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_DATABASE,
  password: DB_PASSWORD,
  port: Number(DB_PORT)
});

pool.on('connect', () => {
  console.error('connection pool established with database');
});

pool.on('error', (err) => {
  console.error('connection pool error:', err);
  process.exit(1);
});

export default pool;
