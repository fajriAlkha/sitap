import Database from 'better-sqlite3';
import fs from 'node:fs';

const DB_PATH = 'data/sitap.db';
fs.mkdirSync('data', { recursive: true });
export const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY, case_id TEXT UNIQUE NOT NULL, title TEXT NOT NULL, type TEXT NOT NULL,
      category TEXT NOT NULL, description TEXT NOT NULL, province TEXT NOT NULL, regency TEXT NOT NULL,
      district TEXT NOT NULL, village TEXT NOT NULL, location TEXT, visibility TEXT NOT NULL DEFAULT 'public',
      process_status TEXT NOT NULL, decision_outcome TEXT NOT NULL DEFAULT 'Belum ada', implementation_status TEXT NOT NULL DEFAULT 'Belum direncanakan',
      responsible_institution TEXT, owner_name TEXT NOT NULL DEFAULT 'Andi Pratama', created_at TEXT NOT NULL,
      public_summary TEXT, progress INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY, case_id TEXT NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE, actor TEXT NOT NULL, role TEXT NOT NULL,
      institution TEXT NOT NULL, action TEXT NOT NULL, before_status TEXT, after_status TEXT, note TEXT, is_public INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS decisions (
      id INTEGER PRIMARY KEY, case_id TEXT UNIQUE NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE, outcome TEXT NOT NULL, reason TEXT NOT NULL, consideration TEXT NOT NULL, official TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY, case_id TEXT UNIQUE NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE, responsiveness INTEGER NOT NULL, transparency INTEGER NOT NULL, timeliness INTEGER NOT NULL, result_score INTEGER NOT NULL, comment TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY, document_id TEXT UNIQUE NOT NULL, case_id TEXT, title TEXT NOT NULL, source_institution TEXT NOT NULL, target_institution TEXT NOT NULL,
      letter_number TEXT NOT NULL, letter_date TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'Terdaftar', verification_token TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL
    );
  `);
}
export const now = () => new Date().toISOString();
export const addEvent = (caseId, data) => db.prepare(`INSERT INTO events (case_id,actor,role,institution,action,before_status,after_status,note,is_public,created_at) VALUES (@caseId,@actor,@role,@institution,@action,@beforeStatus,@afterStatus,@note,@isPublic,@createdAt)`).run({ caseId, ...data, createdAt: now(), isPublic: data.isPublic ? 1 : 0 });
