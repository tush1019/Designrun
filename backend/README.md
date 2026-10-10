# DESIGNRUN backend

Node.js + Express + SQLite backend for the DESIGNRUN website.
It stores accounts, site content and enquiries in one shared database and
also serves the frontend, so the whole site runs from a single process.

## Quick start

```bash
cd backend
npm install        # first time only
npm start          # → http://localhost:3000
```

Open **http://localhost:3000** — the DESIGNRUN site + API both live there.

- Database file: `backend/data/designrun.db` (SQLite via built-in `node:sqlite`,
  no native build tools needed)
- JWT secret: `backend/data/jwt-secret.key` (auto-generated on first run; set
  the `JWT_SECRET` env var in production instead — see `../DEPLOY.md`)
- Smoke tests: `npm run smoke` (starts a throw-away server on port 3100)

## Deployment

This is production-ready. One server serves the site **and** the API, so only
the `backend/` folder needs hosting (`npm install` + `npm start`).

- Honors `PORT` and binds `0.0.0.0` (works on Render / Railway / Vercel / a VPS)
- Configs included: `render.yaml`, `railway.json`, `vercel.json`
- Full step-by-step guide: **`../DEPLOY.md`**

Quick env for production:

```bash
JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
npm start
```

## How the frontend connects

`DESIGNRUN/js/api.js` (loaded on every page after `storage.js`):

1. On page load it calls `GET /api/sync` and writes the server's data into
   LocalStorage, which keeps acting as the read cache for the existing
   `DR.*` helpers. Page rendering waits for this sync.
2. On the first visit of an empty database it POSTs `/api/bootstrap` with the
   site's content (LocalStorage state or the shipped `DR.DEFAULTS`).
3. Every save (`DR.saveProjects`, `DR.saveTeam`, `DR.saveSettings`,
   `DR.saveContactInfo`, `DR.pushLocal`, `DR.saveDemoUsers`, reset) is
   mirrored to the matching API route.
4. If the server is unreachable the site silently keeps working in
   LocalStorage-only mode.

API base URL detection:

| Page served from          | API base               |
| -------------------------- | ---------------------- |
| the backend (port 3000)    | same origin            |
| VS Code Live Server, etc.  | `http://localhost:3000`|
| `file://`                  | `http://localhost:3000`|

Override with `window.DR_API_BASE = 'https://your-api'` before `api.js`,
or `localStorage.dr_api_base`.

## API overview

| Method | Route | Auth | Purpose |
| ------ | ----- | ---- | ------- |
| GET  | `/api/health` | – | liveness check |
| GET  | `/api/sync` | optional | site docs + users; `submissions` only for admins |
| POST | `/api/bootstrap` | – | seed an empty server (returns 409 once initialised) |
| POST | `/api/auth/signup` | – | starts OTP verification (OTP in response, demo mode) |
| POST | `/api/auth/resend` | – | new OTP (5 min TTL) |
| POST | `/api/auth/verify` | – | creates the account → JWT; **first account = admin** |
| POST | `/api/auth/login` | – | → JWT (30 days) |
| GET  | `/api/auth/me` | Bearer | current user |
| PUT  | `/api/settings` `/api/contact-info` `/api/projects` `/api/team` | – | replace site document |
| POST | `/api/contact-messages` `/api/consultations` `/api/analysis-requests` | – | store an enquiry |
| GET  | `/api/admin/submissions` | admin | all enquiries |
| PUT  | `/api/admin/users` | admin | promote/remove users (password hashes preserved) |
| POST | `/api/admin/reset` | admin | wipe docs, enquiries and accounts |

Storage keys used by the frontend ↔ server documents:

`dr_settings`, `dr_contact_info`, `dr_projects`, `dr_team`, `dr_notifications`
→ `docs` table · `dr_contact_messages`, `dr_consultation_requests`,
`dr_analysis_requests` → `submissions` table.

## Security notes / limitations

- Passwords are hashed with **bcrypt**; sessions are **JWT** (HS256).
- The signup OTP is currently returned in the API response because no email
  provider is configured — remove `otp` from that response once real email
  delivery is added.
- Content routes (projects, team, stats, contact info) are intentionally open
  to match the site's original "anyone can edit" behaviour; only user
  management and reset require an admin token. Add auth middleware if you
  need stricter rules.
