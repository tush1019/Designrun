/* ==========================================================================
   DESIGNRUN backend — server.js
   Express + SQLite API for the DESIGNRUN website.

   Run:   cd backend && npm install && npm start
   Open:  http://localhost:3000   (the frontend is served from here)

   Endpoints
     GET    /api/health
     GET    /api/sync                      → site docs + users (+ submissions for admins)
     POST   /api/bootstrap                 → seed an empty server from the frontend
     POST   /api/auth/signup               → starts 6-digit OTP verification
     POST   /api/auth/resend               → new OTP
     POST   /api/auth/verify               → creates the account, returns JWT
     POST   /api/auth/login                → returns JWT
     GET    /api/auth/me                   → current user
     PUT    /api/settings|contact-info|projects|team
     POST   /api/contact-messages|consultations|analysis-requests
     PUT    /api/admin/users               (admin) replace name/role list
     POST   /api/admin/reset               (admin) wipe site data
     GET    /api/admin/submissions         (admin) all enquiries
   ========================================================================== */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const store = require('./db');

const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = process.env.DB_PATH || path.join(__dirname, 'data', 'designrun.db');
const FRONTEND_DIR = path.join(__dirname, '..', 'DESIGNRUN');
const JWT_TTL = '30d';
const OTP_TTL_MS = 5 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const db = store.openDb(DB_FILE);

/* JWT secret — prefer an environment variable in production; otherwise generate
   once and keep it next to the database for local/dev runs. */
function loadSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16) {
    return process.env.JWT_SECRET;
  }
  const file = path.join(path.dirname(DB_FILE), 'jwt-secret.key');
  try { return fs.readFileSync(file, 'utf8').trim(); } catch (err) { /* generate below */ }
  const secret = crypto.randomBytes(48).toString('hex');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, secret, { encoding: 'utf8', mode: 0o600 });
  return secret;
}
const SECRET = loadSecret();

function signToken(user) {
  return jwt.sign({ email: user.email, role: user.role }, SECRET, { expiresIn: JWT_TTL });
}

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((pair) => {
    const i = pair.indexOf('=');
    if (i < 0) return;
    const k = pair.slice(0, i).trim();
    if (k) out[k] = decodeURIComponent(pair.slice(i + 1).trim());
  });
  return out;
}

function readToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return parseCookies(req).dr_token || null;
}

/* Auth cookie so the private admin page can be verified on a normal page
   navigation — the SPA token lives in localStorage and is not sent on full
   page loads. */
function setAuthCookie(res, token) {
  res.cookie('dr_token', token, {
    httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000, path: '/'
  });
}
function clearAuthCookie(res) {
  res.clearCookie('dr_token', { path: '/' });
}

function userFromRequest(req) {
  const token = readToken(req);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, SECRET);
    return store.findUser(db, payload.email);
  } catch (err) {
    return null;
  }
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

/* Attach the current user when a valid token is present (never fatal). */
app.use('/api', (req, res, next) => {
  req.user = userFromRequest(req);
  next();
});

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in first.' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in first.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' });
  next();
}

/* ============================ core / sync ============================== */
/* Submissions are stored under generic kinds but delivered to the frontend
   under its LocalStorage keys (DR.KEYS) so applySync can write them back. */
function submissionsByStorageKey() {
  const raw = store.listSubmissions(db);
  const out = {};
  Object.keys(store.SUBMISSION_KINDS).forEach((storageKey) => {
    out[storageKey] = raw[store.SUBMISSION_KINDS[storageKey]] || [];
  });
  return out;
}

function syncPayload(req) {
  const payload = {
    ok: true,
    empty: store.isEmpty(db),
    docs: {},
    users: store.listUsersPublic(db)
  };
  store.DOC_KEYS.forEach((key) => { payload.docs[key] = store.getDoc(db, key); });
  if (req.user && req.user.role === 'admin') {
    payload.submissions = submissionsByStorageKey();
  }
  return payload;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, name: 'designrun-backend', time: new Date().toISOString() });
});

app.get('/api/sync', (req, res) => {
  res.json(syncPayload(req));
});

/* First visit seeds the empty server with the site content the frontend
   already has (its LocalStorage state or the DR.DEFAULTS). */
app.post('/api/bootstrap', (req, res) => {
  if (!store.isEmpty(db)) {
    return res.status(409).json({ error: 'Server already initialised.', sync: syncPayload(req) });
  }
  const docs = (req.body && req.body.docs) || {};
  store.DOC_KEYS.forEach((key) => {
    if (docs[key] !== undefined && docs[key] !== null) store.setDoc(db, key, docs[key]);
  });
  res.json(syncPayload(req));
});

/* ============================== auth ================================== */
app.post('/api/auth/signup', (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (name.length < 2) return res.status(400).json({ error: 'Enter your name.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter valid email.' });
  if (password.length < 6) return res.status(400).json({ error: 'Min 6 characters.' });
  if (store.findUser(db, email)) {
    return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
  }

  const otp = String(crypto.randomInt(100000, 1000000));
  store.setPending(db, {
    name,
    email,
    passHash: bcrypt.hashSync(password, 10),
    otp,
    ttlMs: OTP_TTL_MS
  });

  /* No email provider is wired in, so the OTP is returned for on-screen
     verification. Remove `otp` from this response once email delivery is
     configured and send it instead. */
  res.json({
    ok: true,
    otp,
    expiresInMinutes: OTP_TTL_MS / 60000,
    note: 'Demo mode: OTP returned by the API. Configure an email provider to deliver it.'
  });
});

app.post('/api/auth/resend', (req, res) => {
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  const pending = store.getPending(db, email);
  if (!pending) return res.status(404).json({ error: 'No pending sign-up for this email. Please start again.' });
  if (store.findUser(db, email)) return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });

  const otp = String(crypto.randomInt(100000, 1000000));
  store.setPending(db, {
    name: pending.name,
    email,
    passHash: pending.pass_hash,
    otp,
    ttlMs: OTP_TTL_MS
  });
  res.json({ ok: true, otp, expiresInMinutes: OTP_TTL_MS / 60000 });
});

app.post('/api/auth/verify', (req, res) => {
  const body = req.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const otp = String(body.otp || '').trim();

  const pending = store.getPending(db, email);
  if (!pending) return res.status(404).json({ error: 'Please fill details first.' });
  if (Date.now() > pending.expires_at) return res.status(400).json({ error: 'OTP expired. Please resend.' });
  if (!crypto.timingSafeEqual(Buffer.from(otp.padEnd(6, '0')), Buffer.from(pending.otp.padEnd(6, '0')))) {
    return res.status(400).json({ error: 'Incorrect OTP. Please check the code.' });
  }
  if (store.findUser(db, email)) return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });

  const role = store.listUsers(db).length === 0 ? 'admin' : 'user';
  const user = store.createUser(db, { name: pending.name, email, passHash: pending.pass_hash, role });
  store.deletePending(db, email);

  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ ok: true, token, user });
});

app.post('/api/auth/login', (req, res) => {
  const body = req.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  const user = store.findUser(db, email);
  if (!user) return res.status(404).json({ error: 'No account found for this email. Please sign up first.' });
  if (!bcrypt.compareSync(password, user.pass_hash)) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }
  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ ok: true, token, user: store.publicUser(user) });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: store.publicUser(req.user) });
});

app.post('/api/auth/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

/* =========================== site documents ============================ */
/* Content edits (projects, team, stats, contact info) mirror what the
   frontend already allows without a login, so they are open here too.
   Admin-only actions live under /api/admin below. */

function putDocRoute(key) {
  return (req, res) => {
    if (req.body === undefined || req.body === null) {
      return res.status(400).json({ error: 'Missing document body.' });
    }
    store.setDoc(db, key, req.body);
    res.json({ ok: true, value: store.getDoc(db, key) });
  };
}

app.put('/api/settings', putDocRoute('dr_settings'));
app.put('/api/contact-info', putDocRoute('dr_contact_info'));
app.put('/api/projects', putDocRoute('dr_projects'));
app.put('/api/team', putDocRoute('dr_team'));

/* =========================== submissions ============================== */
function submissionHandler(kind) {
  return (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Invalid submission.' });
    }
    const saved = store.addSubmission(db, kind, body);
    res.json({ ok: true, entry: saved });
  };
}

app.post('/api/contact-messages', submissionHandler('contact'));
app.post('/api/consultations', submissionHandler('consultation'));
app.post('/api/analysis-requests', submissionHandler('analysis'));

/* ============================== admin ================================= */
app.get('/api/admin/submissions', requireAdmin, (req, res) => {
  res.json({ ok: true, submissions: submissionsByStorageKey() });
});

/* The admin Users screen sends the whole (password-free) user list back;
   existing password hashes are always preserved server-side. */
app.put('/api/admin/users', requireAdmin, (req, res) => {
  const incoming = Array.isArray(req.body && req.body.users) ? req.body.users : [];
  const rows = store.listUsers(db);
  const existing = new Map(rows.map((r) => [r.email, r]));

  const seen = new Set();
  incoming.forEach((u) => {
    const email = String((u && u.email) || '').trim().toLowerCase();
    if (!email || seen.has(email)) return;
    seen.add(email);
    const name = String((u && u.name) || email).trim() || email;
    const role = u && u.role === 'admin' ? 'admin' : 'user';
    const row = existing.get(email);
    if (row) {
      db.prepare('UPDATE users SET name = ?, role = ? WHERE email = ?').run(name, role, email);
    } else {
      db.prepare('INSERT INTO users (name, email, pass_hash, role, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(name, email, '', role, new Date().toISOString());
    }
  });

  rows.forEach((row) => {
    if (!seen.has(row.email)) db.prepare('DELETE FROM users WHERE email = ?').run(row.email);
  });

  res.json({ ok: true, users: store.listUsersPublic(db) });
});

app.post('/api/admin/reset', requireAdmin, (req, res) => {
  store.clearDocs(db);
  store.clearSubmissions(db);
  db.prepare('DELETE FROM users').run();
  db.prepare('DELETE FROM pending_signups').run();
  res.json({ ok: true, sync: syncPayload(req) });
});

/* ============================ errors / static ========================= */
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found: ' + req.method + ' ' + req.originalUrl });
});

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }
  console.error('[designrun-backend]', err);
  res.status(500).json({ error: 'Internal server error.' });
});

/* Serve the DESIGNRUN website itself (so one server = site + API).
   - hashed assets (js/css/images) are cached hard
   - .html is always revalidated (frontend already uses ?v= cache-busters) */
/* ----- Private admin panel -----
   admin.html is only served to a signed-in administrator. Everyone else is
   redirected to the login page, so the panel never renders for the public.
   (The /api/admin/* data routes are independently protected by requireAdmin.) */
app.get('/admin.html', (req, res, next) => {
  const user = userFromRequest(req);
  if (!user || user.role !== 'admin') return res.redirect('/login.html');
  next();
});

app.use(express.static(FRONTEND_DIR, {
  setHeaders(res, filePath) {
    if (/\.(js|css|woff2?|png|jpe?g|gif|svg|webp|ico)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    } else if (/\.html$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

/* SPA-style fallback: unknown non-API GET routes render the site shell so
   deep links (e.g. /projects) still load the app instead of a 404. */
app.get(/^\/(?!api\/).*/, (req, res, next) => {
  if (req.method !== 'GET') return next();
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log('DESIGNRUN backend running → http://localhost:' + PORT);
  console.log('Serving frontend : ' + FRONTEND_DIR);
  console.log('Database         : ' + DB_FILE);
});


