import fs from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config.js';
import { schemaStatements } from './schema.js';

let db;

const ensureTurnsTypeColumn = (database) => {
  const turnColumns = database
    .prepare(`PRAGMA table_info(turns)`)
    .all();
  const hasTypeColumn = turnColumns.some((column) => column.name === 'type');

  if (!hasTypeColumn) {
    database.exec(
      `ALTER TABLE turns ADD COLUMN type TEXT NOT NULL DEFAULT 'story_text'`,
    );
  }
};

export const getDb = () => {
  if (!db) {
    throw new Error('Database has not been initialized yet.');
  }

  return db;
};

export const initializeDatabase = async () => {
  await fs.mkdir(path.dirname(config.sqlite.path), { recursive: true });

  db = new DatabaseSync(config.sqlite.path);
  db.exec(`PRAGMA foreign_keys = ON`);
  db.exec(`PRAGMA journal_mode = WAL`);

  for (const statement of schemaStatements) {
    db.exec(statement);
  }

  ensureTurnsTypeColumn(db);
};

export const withTransaction = async (work) => {
  const database = getDb();

  database.exec('BEGIN');

  try {
    const result = await work(database);
    database.exec('COMMIT');
    return result;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
};
