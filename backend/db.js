/* ==========================================================================
   DESIGNRUN backend — db.js
   SQLite via the built-in node:sqlite module (no native build step).
   Tables:
     users            → registered accounts (bcrypt hashed passwords)
     pending_signups  → 6-digit OTP verification window (5 minutes)
     docs             → JSON site documents (settings, projects, team, ...)
     submissions      → enquiries (contact / consultation / analysis)
   ========================================================================== */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

/* Storage keys used by the frontend (js/storage.js → DR.KEYS). */
const DOC_KEYS = [
  'dr_settings',
  'dr_contact_info',
  'dr_projects',
  'dr_team',
  'dr_notifications'
];

const SUBMISSION_KINDS = {
  dr_contact_messages: 'contact',
  dr_consultation_requests: 'consultation',
  dr_analysis_requests: 'analysis'
};

function openDb(file) {
  if (file !== ':memory:') {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS docs (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      pass_hash  TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pending_signups (
      email      TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      pass_hash  TEXT NOT NULL,
      otp        TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS submissions (
      kind       TEXT NOT NULL,
      id         TEXT NOT NULL,
      data       TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (kind, id)
    );
  `);
  return db;
}

/* ----------------------------- docs (JSON) ----------------------------- */
function getDoc(db, key) {
  const row = db.prepare('SELECT value FROM docs WHERE key = ?').get(key);
  if (!row) return null;
  try { return JSON.parse(row.value); } catch (err) { return null; }
}

function setDoc(db, key, value) {
  db.prepare(`
    INSERT INTO docs (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, JSON.stringify(value === undefined ? null : value), new Date().toISOString());
}

function clearDocs(db) { db.prepare('DELETE FROM docs').run(); }

/* ------------------------------- users -------------------------------- */
function publicUser(row) {
  if (!row) return null;
  return { name: row.name, email: row.email, role: row.role, at: row.created_at };
}

function findUser(db, email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').toLowerCase()) || null;
}

function listUsers(db) {
  return db.prepare('SELECT * FROM users ORDER BY id').all();
}

function listUsersPublic(db) {
  return listUsers(db).map(publicUser);
}

/* --------------------------- pending signups --------------------------- */
function setPending(db, { name, email, passHash, otp, ttlMs }) {
  db.prepare(`
    INSERT INTO pending_signups (email, name, pass_hash, otp, expires_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      name = excluded.name, pass_hash = excluded.pass_hash,
      otp = excluded.otp, expires_at = excluded.expires_at
  `).run(String(email).toLowerCase(), String(name), passHash, String(otp), Date.now() + (ttlMs || 5 * 60 * 1000));
}

function getPending(db, email) {
  return db.prepare('SELECT * FROM pending_signups WHERE email = ?').get(String(email || '').toLowerCase()) || null;
}

function deletePending(db, email) {
  db.prepare('DELETE FROM pending_signups WHERE email = ?').run(String(email || '').toLowerCase());
}

/* ---------------------------- submissions ----------------------------- */
function addSubmission(db, kind, entry) {
  const data = Object.assign({}, entry || {});
  if (!data.id) data.id = 'srv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  if (!data.createdAt) data.createdAt = new Date().toISOString();
  db.prepare(`
    INSERT INTO submissions (kind, id, data, created_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(kind, id) DO UPDATE SET data = excluded.data
  `).run(kind, String(data.id), JSON.stringify(data), data.createdAt);
  return data;
}

function listSubmissions(db, kinds) {
  const out = {};
  const wanted = kinds || Object.values(SUBMISSION_KINDS);
  wanted.forEach((kind) => {
    const rows = db.prepare('SELECT data FROM submissions WHERE kind = ? ORDER BY created_at DESC').all(kind);
    out[kind] = rows.map((r) => {
      try { return JSON.parse(r.data); } catch (err) { return null; }
    }).filter(Boolean);
  });
  return out;
}

function clearSubmissions(db) { db.prepare('DELETE FROM submissions').run(); }

/* ------------------------------- state -------------------------------- */
function isEmpty(db) {
  const users = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  const docs = db.prepare('SELECT COUNT(*) AS n FROM docs').get().n;
  const subs = db.prepare('SELECT COUNT(*) AS n FROM submissions').get().n;
  return users === 0 && docs === 0 && subs === 0;
}

module.exports = {
  DOC_KEYS,
  SUBMISSION_KINDS,
  openDb,
  getDoc,
  setDoc,
  clearDocs,
  findUser,
  listUsers,
  listUsersPublic,
  createUser,
  publicUser,
  setPending,
  getPending,
  deletePending,
  addSubmission,
  listSubmissions,
  clearSubmissions,
  isEmpty
};

function createUser(db, { name, email, passHash, role }) {
  const now = new Date().toISOString();
  const em = String(email).toLowerCase();
  db.prepare('INSERT INTO users (name, email, pass_hash, role, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(String(name), em, passHash, role === 'admin' ? 'admin' : 'user', now);
  return publicUser(findUser(db, em));
}
