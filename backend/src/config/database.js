// Only PostgreSQL/Supabase logic remains here.
// If you need to run raw SQL queries, use the 'pg' package and the Pool below.

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ella_ai',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

const pgPool = new Pool(pgConfig);

export const getDB = () => pgPool;

export default { getDB };
