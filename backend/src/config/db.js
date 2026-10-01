import pg from 'pg';
import { newDb } from 'pg-mem';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool = null;
let isInMemory = false;

export async function getDbPool() {
  if (pool) return pool;

  if (config.databaseUrl && !config.useInMemoryDb) {
    try {
      console.log('Connecting to external PostgreSQL database...');
      const externalPool = new pg.Pool({
        connectionString: config.databaseUrl,
        ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
      });
      // Test connectivity
      await externalPool.query('SELECT 1');
      console.log('Connected to PostgreSQL successfully.');
      pool = externalPool;
      isInMemory = false;
      return pool;
    } catch (err) {
      console.warn(`PostgreSQL connection failed (${err.message}). Falling back to embedded in-memory PostgreSQL (pg-mem).`);
    }
  }

  // Embedded PostgreSQL instance via pg-mem
  console.log('Initializing embedded in-memory PostgreSQL database (pg-mem)...');
  const memDb = newDb();
  
  // Register common pg functions if needed
  memDb.public.registerFunction({
    name: 'now',
    returns: memDb.public.getType('timestamp with time zone') || undefined,
    implementation: () => new Date(),
  });

  const adapter = memDb.adapters.createPg();
  pool = new adapter.Pool();
  isInMemory = true;
  return pool;
}

export async function query(text, params = []) {
  const currentPool = await getDbPool();
  return currentPool.query(text, params);
}

export async function getClient() {
  const currentPool = await getDbPool();
  return currentPool.connect();
}

export async function initDb(seed = true) {
  const currentPool = await getDbPool();
  const migrationsDir = path.resolve(__dirname, '../../migrations');

  try {
    const schemaSql = fs.readFileSync(path.join(migrationsDir, '001_initial_schema.sql'), 'utf-8');
    await currentPool.query(schemaSql);
    console.log('✓ Migration 001_initial_schema applied.');

    if (seed) {
      const seedSql = fs.readFileSync(path.join(migrationsDir, '002_seed_data.sql'), 'utf-8');
      await currentPool.query(seedSql);
      console.log('✓ Migration 002_seed_data applied.');
    }
  } catch (err) {
    console.error('Error initializing database:', err.message);
    throw err;
  }
}

export function isUsingInMemory() {
  return isInMemory;
}

export default {
  query,
  getClient,
  getDbPool,
  initDb,
  isUsingInMemory,
};
