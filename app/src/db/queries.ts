import { ensureDb } from './schema';

// ========== User Queries ==========

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  username: string;
  created_at: string;
}

export async function createUser(id: string, email: string, passwordHash: string, username: string): Promise<DbUser> {
  const db = await ensureDb();
  await db.execute({
    sql: 'INSERT INTO users (id, email, password_hash, username) VALUES (?, ?, ?, ?)',
    args: [id, email, passwordHash, username],
  });
  return (await getUserById(id))!;
}

export async function getUserByEmail(email: string): Promise<DbUser | undefined> {
  const db = await ensureDb();
  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email],
  });
  return result.rows[0] as unknown as DbUser | undefined;
}

export async function getUserById(id: string): Promise<DbUser | undefined> {
  const db = await ensureDb();
  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [id],
  });
  return result.rows[0] as unknown as DbUser | undefined;
}

export async function getUserByUsername(username: string): Promise<DbUser | undefined> {
  const db = await ensureDb();
  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE username = ?',
    args: [username],
  });
  return result.rows[0] as unknown as DbUser | undefined;
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

export async function createGame(
  id: string,
  userId: string,
  seedCode: string,
  config: string,
  name?: string,
  description?: string,
  parentSeed?: string
): Promise<DbGame> {
  const db = await ensureDb();
  await db.execute({
    sql: `INSERT INTO games (id, user_id, seed_code, config, name, description, parent_seed)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, userId, seedCode, config, name || null, description || null, parentSeed || null],
  });
  return (await getGameById(id))!;
}

export async function getGameById(id: string): Promise<DbGame | undefined> {
  const db = await ensureDb();
  const result = await db.execute({
    sql: 'SELECT * FROM games WHERE id = ?',
    args: [id],
  });
  return result.rows[0] as unknown as DbGame | undefined;
}

export async function getGameBySeedCode(seedCode: string): Promise<DbGame | undefined> {
  const db = await ensureDb();
  const result = await db.execute({
    sql: 'SELECT * FROM games WHERE seed_code = ?',
    args: [seedCode],
  });
  return result.rows[0] as unknown as DbGame | undefined;
}

export async function getGamesByUserId(userId: string): Promise<DbGame[]> {
  const db = await ensureDb();
  const result = await db.execute({
    sql: 'SELECT * FROM games WHERE user_id = ? ORDER BY created_at DESC',
    args: [userId],
  });
  return result.rows as unknown as DbGame[];
}

export async function incrementPlayCount(seedCode: string): Promise<void> {
  const db = await ensureDb();
  await db.execute({
    sql: 'UPDATE games SET play_count = play_count + 1 WHERE seed_code = ?',
    args: [seedCode],
  });
}

export async function getRecentGames(limit: number = 20): Promise<DbGame[]> {
  const db = await ensureDb();
  const result = await db.execute({
    sql: 'SELECT * FROM games ORDER BY created_at DESC LIMIT ?',
    args: [limit],
  });
  return result.rows as unknown as DbGame[];
}

export async function getPopularGames(limit: number = 20): Promise<DbGame[]> {
  const db = await ensureDb();
  const result = await db.execute({
    sql: 'SELECT * FROM games ORDER BY play_count DESC LIMIT ?',
    args: [limit],
  });
  return result.rows as unknown as DbGame[];
}

export async function getRemixesOfGame(parentSeed: string): Promise<DbGame[]> {
  const db = await ensureDb();
  const result = await db.execute({
    sql: 'SELECT * FROM games WHERE parent_seed = ? ORDER BY created_at DESC',
    args: [parentSeed],
  });
  return result.rows as unknown as DbGame[];
}
