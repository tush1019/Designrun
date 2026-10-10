# DESIGNRUN — Civil & Structure Solution

A premium multi-page civil engineering business website built with **plain HTML5 + CSS3 + vanilla JavaScript**.
No Node.js, no npm, no build step. Open `index.html` in any modern browser and it works.

> **Slogan:** From Concept to Completion — We Build with Precision.
> Better Designs. Stronger Structures. A Safer Tomorrow.

## File structure

```
DESIGNRUN/
├── index.html          → Dashboard (hero, stats, recent projects, services)
├── projects.html       → Project gallery + search / filters + add/edit/delete
├── services.html       → Service catalogue + consultation request form
├── analysis.html       → Design & Analysis intake (requirements tool)
├── login.html          → Log in (email + password, browser accounts)
├── signup.html         → Sign up with 6-digit OTP verification
├── admin.html          → Admin Panel (projects, enquiries, stats, users)
├── reports.html        → Report register + print + optional PDF export
├── team.html           → Team cards + add / edit / remove
├── resources.html      → Articles, documents, reference links + filters
├── contact.html        → Enquiry form + editable business contact info
├── css/
│   ├── style.css       → Design system (navy sidebar, blue accents, cards)
│   └── responsive.css  → Desktop → laptop → tablet → mobile breakpoints
├── js/
│   ├── storage.js      → Site data + LocalStorage helpers (DR.* API)
│   ├── api.js          → Backend bridge (sync + write-through to ../backend)
│   ├── app.js          → Sidebar, topbar, footer, icons, search, modals
│   ├── dashboard.js    → Homepage widgets (stats, projects, file picker)
│   ├── projects.js     → Projects CRUD + filters + detail modal
│   ├── services.js     → Service modals + consultation form
│   ├── analysis.js     → Requirements form + summary + saved requests
│   ├── reports.js      → Report search/filters + detail + print + PDF
│   ├── team.js         → Team CRUD (local only, placeholder-safe)
│   ├── contact.js      → Enquiry validation + business info editor
│   ├── auth.js         → Login / signup / OTP verification
│   ├── admin.js        → Admin Panel control centre
│   └── resources.js    → Resource filters + article reader
├── assets/
│   ├── images/         → Local SVG fallbacks (hero, favicon, 5 projects)
│   └── documents/      → Printable brochure + report template
└── README.md           → This file
```

**Option A — double-click (easiest):**
1. Open the `DESIGNRUN` folder.
2. Double-click `index.html`. It opens in your default browser.
3. Use the sidebar to visit all 8 pages.

**Option B — VS Code Live Server:**
1. Open the `DESIGNRUN` folder in VS Code.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click `index.html` → **Open with Live Server**.

> No terminal, no npm install, no build. Internet is only needed for Google
> Fonts, Unsplash photos, and the optional jsPDF CDN — layout, icons and
> local SVG fallbacks all work fully offline.

## Implemented features

- **Global layout:** dark navy sidebar (#0B1B2E) with 8 working nav links +
  active-page highlight, founder profile editor, slogan; topbar with global
  search, notification dropdown, profile menu, mobile slide-out menu; footer.
- **Dashboard:** construction hero + promo card + Get a Quote; 4 configurable
  stat cards; 4 recent project cards + View All; 5 service cards; Quick
  Links, Upload Project Files (real picker, local-only), Download Brochure
  (real file), Expertise grid, quote banner.
- **Projects:** search, category/status filters, sort, detail modal, add/edit/
  delete with confirmation + validation, LocalStorage, empty states.
- **Services:** 5 services with deliverables + suitable types, Learn More
  modals, consultation form (validates + saves locally).
- **Design & Analysis:** intake form + validation + printable requirement
  summary + recent requests. A requirements tool only — no fake calculations.
- **Reports:** search + filters, detail modal, print layout, PDF export via
  jsPDF CDN with print fallback. Approvals/certificates always require
  qualified professional sign-off.
- **Team:** profile cards, add/edit/remove stored locally.
- **Resources:** in-app articles, real-file-only downloads, external links,
  search + type/category filters.
- **Contact:** full validation, success/error feedback, ?subject= pre-fill,
  editable business info panel.
- **Login / Sign-up / OTP:** `login.html` + `signup.html` — accounts live on
  the backend (bcrypt-hashed passwords; the first registered account
  automatically becomes administrator). Signup verifies a 6-digit OTP issued
  by the API. The topbar avatar menu and sidebar profile update
  automatically (Log in / Log out states).
- **Admin Panel (control centre):** `admin.html`, administrator only —
  Overview KPIs, Projects manager (view / cycle status / delete), Enquiries
  inbox (contact + consultation + analysis requests), Stats Control (edit
  the 4 homepage numbers live), Users manager (promote to admin / remove),
  and a one-click data reset. The Admin link appears in the sidebar + footer
  only for administrators; everyone else sees a locked page.
- **Premium look:** navy + engineering-blue + gold theme, glass topbar, hero
  with gold gradient text, animated stat cards, gold status badges, glowing
  quote panel, `btn-gold` accent buttons, scroll-reveal motion.
- **Cross-cutting:** toasts, confirms, ESC handling, skip link, ARIA labels,
  responsive breakpoints, image fallbacks, XSS-safe rendering.
## Customising site content

- Edit `js/storage.js` → `DR.DEFAULTS` to change founder name/title,
  statistics, contact info, projects, services, team, reports, resources.
- Sidebar profile: avatar menu → Profile settings (live edit).
- Contact page business details: "Edit business details" button (live edit).
- Use **Reset site data** (profile menu) to restore the originals.
- Replace `assets/documents/*.html` with your own brochure/reports.
- Add project photos in `assets/images/` and reference them in
  `DR.DEFAULTS.projects[].image`.

## Backend (included)

The site ships with its own backend in `../backend` — Node.js + Express +
SQLite. It stores accounts, projects, team, settings and every enquiry in one
shared database, and serves the website itself:

```bash
cd ../backend
npm install        # first time only
npm start          # → http://localhost:3000
```

Open **http://localhost:3000** to browse the site with the backend running.
`js/api.js` (loaded on every page) syncs server data into LocalStorage before
the first render and mirrors every save back to the API — so data is shared
across browsers/devices. If the server is not running, the site automatically
falls back to the original LocalStorage-only mode.

Full API reference, endpoints and security notes: **`../backend/README.md`**.
Automated end-to-end checks: `cd ../backend && npm run smoke`.

## Limitations (by design)

- Backend included (`backend/`): it must be running for shared data,
  cross-device accounts and the admin inbox — without it the site falls back
  to per-browser LocalStorage.
- Email delivery and file uploads are not implemented yet: enquiries are
  stored in the database (Admin → Enquiries) but no email is sent.
- LocalStorage is only a cache now — clearing browser storage does not remove
  server data (it is re-synced on the next page load).
- Analysis page collects requirements only; no engineering analysis occurs.
- Approvals and certificates are issued only by qualified professionals —
  this site never claims to issue them.
- Team profiles should be replaced with real details (with consent).

**Owner:** Ritik Chaudhary · +91 80069 03841 · ritikchaudhary126@gmail.com
