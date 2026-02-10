import { getDb } from './schema';

// ========== User Queries ==========

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  username: string;
  created_at: string;
}

export function createUser(id: string, email: string, passwordHash: string, username: string): DbUser {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO users (id, email, password_hash, username) VALUES (?, ?, ?, ?)'
  );
  stmt.run(id, email, passwordHash, username);
  return getUserById(id)!;
}

export function getUserByEmail(email: string): DbUser | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as DbUser | undefined;
}

export function getUserById(id: string): DbUser | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined;
}

export function getUserByUsername(username: string): DbUser | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as DbUser | undefined;
}

// ========== Game Queries ==========

export interface DbGame {
  id: string;
  user_id: string;
  seed_code: string;
  config: string; // JSON string
  name: string | null;
  description: string | null;
  parent_seed: string | null;
  play_count: number;
  created_at: string;
}

export function createGame(
  id: string,
  userId: string,
  seedCode: string,
  config: string,
  name?: string,
  description?: string,
  parentSeed?: string
): DbGame {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO games (id, user_id, seed_code, config, name, description, parent_seed)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  stmt.run(id, userId, seedCode, config, name || null, description || null, parentSeed || null);
  return getGameById(id)!;
}

export function getGameById(id: string): DbGame | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM games WHERE id = ?').get(id) as DbGame | undefined;
}

export function getGameBySeedCode(seedCode: string): DbGame | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM games WHERE seed_code = ?').get(seedCode) as DbGame | undefined;
}

export function getGamesByUserId(userId: string): DbGame[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM games WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId) as DbGame[];
}

export function incrementPlayCount(seedCode: string): void {
  const db = getDb();
  db.prepare('UPDATE games SET play_count = play_count + 1 WHERE seed_code = ?').run(seedCode);
}

export function getRecentGames(limit: number = 20): DbGame[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM games ORDER BY created_at DESC LIMIT ?'
  ).all(limit) as DbGame[];
}

export function getPopularGames(limit: number = 20): DbGame[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM games ORDER BY play_count DESC LIMIT ?'
  ).all(limit) as DbGame[];
}

export function getRemixesOfGame(parentSeed: string): DbGame[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM games WHERE parent_seed = ? ORDER BY created_at DESC'
  ).all(parentSeed) as DbGame[];
}
