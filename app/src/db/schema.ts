import { createClient, type Client } from '@libsql/client';

let db: Client | null = null;
let initialized = false;

export function getDb(): Client {
  if (!db) {
    db = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return db;
}

export async function ensureDb(): Promise<Client> {
  const client = getDb();
  if (!initialized) {
    await initializeDb(client);
    initialized = true;
  }
  return client;
}

async function initializeDb(db: Client) {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      seed_code TEXT UNIQUE NOT NULL,
      config TEXT NOT NULL,
      name TEXT,
      description TEXT,
      parent_seed TEXT,
      play_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
    CREATE INDEX IF NOT EXISTS idx_games_seed_code ON games(seed_code);
    CREATE INDEX IF NOT EXISTS idx_games_parent_seed ON games(parent_seed);
  `);
}
