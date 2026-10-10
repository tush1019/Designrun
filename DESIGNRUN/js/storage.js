/* ==========================================================================
   DESIGNRUN — storage.js
   Site data + safe browser-storage helpers. Content is saved in this
   browser only (LocalStorage) — no backend is used.
   Edit the DR.DEFAULTS section to change content and contact details.
   ========================================================================== */
(function () {
  'use strict';

  window.DR = window.DR || {};

  /* ---------------- Storage keys ---------------- */
  var DATA_VERSION = 'v3-real-business';
  var VERSION_KEY = 'dr_data_version';
  var KEYS = {
    settings: 'dr_settings',
    contactInfo: 'dr_contact_info',
    projects: 'dr_projects',
    team: 'dr_team',
    reports: 'dr_reports',
    resources: 'dr_resources',
    notifications: 'dr_notifications',
    readNotifications: 'dr_read_notifications',
    contactMessages: 'dr_contact_messages',
    consultations: 'dr_consultation_requests',
    analysisRequests: 'dr_analysis_requests',
    demoUsers: 'dr_demo_users',
    demoSession: 'dr_demo_session'
  };
  DR.KEYS = KEYS;

  /* ==========================================================================
     FORM BACKEND (Formspree)
     Put your Formspree endpoint here, e.g.:
       formEndpoint: 'https://formspree.io/f/abcdwxyz'
     While it is empty, forms validate + save locally (no email is sent).
     Get a free endpoint at https://formspree.io in 2 minutes.
     ========================================================================== */
  DR.CONFIG = { formEndpoint: '' };

  DR.formEndpoint = function () {
    var ep = (DR.store.get('dr_form_endpoint', null) || DR.CONFIG.formEndpoint || '').trim();
    return ep;
  };
  DR.setFormEndpoint = function (ep) { return DR.store.set('dr_form_endpoint', String(ep || '').trim()); };

  /* POST a payload to the configured form endpoint (JSON). Rejects on error. */
  DR.sendToForm = function (payload) {
    var ep = DR.formEndpoint();
    if (!ep) { return Promise.reject(new Error('No form endpoint configured')); }
    return fetch(ep, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) { return res.json().catch(function () { return {}; }).then(function (d) { throw new Error(d.error || ('Server responded ' + res.status)); }); }
      return res;
    });
  };

  /* ---------------- Tiny storage wrapper (safe JSON) ---------------- */
  DR.store = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (err) {
        console.warn('[DESIGNRUN] Could not read "' + key + '"', err);
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (err) {
        console.warn('[DESIGNRUN] Could not save "' + key + '"', err);
        return false;
      }
    },
    remove: function (key) {
      try { window.localStorage.removeItem(key); } catch (err) { /* ignore */ }
    }
  };

  /* ==========================================================================
     DATA MIGRATION — if the stored version is older than this build, clear
     the old cached content so the current site content is seeded fresh.
     Accounts and the session are intentionally kept so the owner does not
     get logged out by an upgrade.
     ========================================================================== */
  (function migrate() {
    try {
      var storedVersion = DR.store.get(VERSION_KEY, null);
      if (storedVersion !== DATA_VERSION) {
        [KEYS.settings, KEYS.projects, KEYS.team, KEYS.reports, KEYS.resources,
         KEYS.notifications, KEYS.readNotifications, KEYS.contactInfo
        ].forEach(function (k) { DR.store.remove(k); });
        DR.store.set(VERSION_KEY, DATA_VERSION);
      }
    } catch (err) { /* never block the site on a migration error */ }
  })();

  /* ---------------- Small helpers ---------------- */
  DR.uid = function () {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  };

  /* Escape untrusted text before inserting it into HTML strings. */
  DR.esc = function (value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  DR.fmtDate = function (value, options) {
    if (!value) return '—';
    var d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return String(value);
    var opts = options || { day: '2-digit', month: 'short', year: 'numeric' };
    try { return d.toLocaleDateString('en-GB', opts); } catch (e) { return d.toDateString(); }
  };

  DR.fmtBytes = function (bytes) {
    if (!bytes && bytes !== 0) return '';
    var units = ['B', 'KB', 'MB', 'GB'];
    var i = 0;
    var n = bytes;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i += 1; }
    return n.toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
  };

  DR.debounce = function (fn, wait) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait || 180);
    };
  };

  DR.queryParam = function (name) {
    try {
      return new URLSearchParams(window.location.search).get(name) || '';
    } catch (e) { return ''; }
  };

  /* Simple initials avatar as an inline SVG data URI (no external service). */
  DR.initialsAvatar = function (name, hue) {
    var parts = String(name || '?').trim().split(/\s+/);
    var initials = (parts[0] || '?').charAt(0);
    if (parts.length > 1) initials += parts[parts.length - 1].charAt(0);
    initials = initials.toUpperCase();
    var h = typeof hue === 'number' ? hue : 210;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">' +
      '<rect width="96" height="96" rx="48" fill="hsl(' + h + ',58%,44%)"/>' +
      '<text x="48" y="60" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="34" font-weight="700" fill="#FFFFFF">' +
      DR.esc(initials) + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };

  /* Demo project images (external photos with local SVG fallbacks). */
  var IMG = {
    hero: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80',
    residential: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
    industrial: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1000&q=80',
    highrise: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80',
    bridge: 'https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?auto=format&fit=crop&w=1000&q=80'
  };
  DR.IMG = IMG;


  /* ==========================================================================
     DEFAULT / SEED DATA  —  edit these to match your real company content
     ========================================================================== */
  DR.DEFAULTS = {

    /* Founder / profile shown in the sidebar (editable from the profile menu). */
    settings: {
      founderName: 'Ritik Chaudhary',
      founderTitle: 'Founder & Structural Engineer',
      founderHue: 212,
      /* Extra personal / premium profile fields (editable in Profile settings). */
      founderBio: 'Civil & structural engineer focused on precise, safe and code-compliant design — from concept to completion.',
      founderPhone: '',
      founderLocation: '',
      founderAvatar: '',
      /* Premium UI theme: 'light' | 'dark' | 'ocean' | 'sunset' | 'forest'. */
      theme: 'light',
      /* Business statistics shown on the dashboard. Update these numbers
         from the Admin Panel to match your real company track record. */
      demoStats: {
        completedProjects: 25,
        analysisServices: 40,
        happyClients: 30,
        qualityYears: 5
      }
    },

    /* Real business contact information shown on the Contact page (editable in-app + admin). */
    contactInfo: {
      email: 'ritikchaudhary126@gmail.com',
      phone: '+91 80069 03841',
      address: 'DESIGNRUN — Civil & Structure Solution, India (site visits as per project location)',
      hours: 'Mon – Sat : 9:30 AM – 6:30 PM',
      website: ''
    },

    /* File manifest — a file is offered for download only when it really exists. */
    documents: {
      brochure: { available: true, path: 'assets/documents/designrun-brochure.html', label: 'Company Brochure (printable HTML)' },
      reportTemplate: { available: true, path: 'assets/documents/demo-report-template.html', label: 'Project Report Template' }
    },

    projects: [
      {
        id: 'demo-1',
        name: 'G+5 Residential Building',
        category: 'Structural Design & Analysis',
        status: 'Completed',
        date: '2025-11-12',
        location: 'Pune, Maharashtra',
        description: 'RCC framed residential building with five upper floors over ground parking — structural design, member scheduling and construction-ready detailing drawings.',
        image: IMG.residential,
        fallback: 'residential',
        demo: false
      },
      {
        id: 'demo-2',
        name: 'PEB Industrial Shed',
        category: 'Design & Steel Detailing',
        status: 'In Progress',
        date: '2026-01-20',
        location: 'Chennai, Tamil Nadu',
        description: 'Pre-engineered building shed with portal frames and crane gantry provision — steel design, connection detailing and erection coordination.',
        image: IMG.industrial,
        fallback: 'industrial',
        demo: false
      },
      {
        id: 'demo-3',
        name: 'High-Rise Building',
        category: 'Wind Load Analysis',
        status: 'Completed',
        date: '2025-08-02',
        location: 'Mumbai, Maharashtra',
        description: 'Commercial high-rise — wind environment study, cladding pressure zones and code-based design review for the structural scheme.',
        image: IMG.highrise,
        fallback: 'highrise',
        demo: false
      },
      {
        id: 'demo-4',
        name: 'Bridge Structure',
        category: 'Design & Consultancy',
        status: 'Planning',
        date: '2026-03-01',
        location: 'Nagpur, Maharashtra',
        description: 'Culvert and approach structure under preliminary planning — scope definition, design consultancy and drawing review support.',
        image: IMG.bridge,
        fallback: 'bridge',
        demo: false
      }
    ],

    services: [
      {
        id: 'svc-1',
        icon: 'ruler',
        title: 'Structural Design & Detailing',
        description: 'Complete RCC and steel structural design with construction-ready detailing drawings prepared against the applicable design codes.',
        deliverables: ['Design basis & assumption notes', 'Structural drawing set', 'Member scheduling sheets', 'Bar bending schedules (RCC)'],
        suitable: ['Residential buildings', 'Commercial buildings', 'Institutional projects']
      },
      {
        id: 'svc-2',
        icon: 'wind',
        title: 'Wind Load Analysis (CFD)',
        description: 'Wind environment and pressure studies for tall and complex shapes using validated CFD workflows and code-based review.',
        deliverables: ['Wind study summary report', 'Cladding pressure zones', 'Pedestrian comfort notes', 'Model inputs & assumptions list'],
        suitable: ['High-rise towers', 'Long-span roofs', 'Open industrial sites']
      },
      {
        id: 'svc-3',
        icon: 'layers',
        title: 'RCC & Steel Design (RCDC)',
        description: 'Design coordination and output review using industry-standard design tools, with clear documentation of the code references used.',
        deliverables: ['Beam / column / footing schedules', 'Steel member selection report', 'Quantity summary', 'Drawing issue register'],
        suitable: ['Frame structures', 'Industrial steelwork', 'Foundation packages']
      },
      {
        id: 'svc-4',
        icon: 'blueprint',
        title: '3D Modeling & BIM (Revit)',
        description: 'Coordinated 3D structural models, drawings and quantity take-offs that help contractors build with fewer site conflicts.',
        deliverables: ['Coordination 3D model', 'Sheet set from model', 'Clash review notes', 'Material quantity take-off'],
        suitable: ['Multi-discipline projects', 'Complex geometries', 'Large floor plates']
      },
      {
        id: 'svc-5',
        icon: 'shield',
        title: 'Consultancy & Technical Support',
        description: 'Independent design review, value engineering inputs, site technical support and clear communication with your project team.',
        deliverables: ['Design review comments', 'Value engineering options', 'Site query responses', 'Progress review meetings'],
        suitable: ['Ongoing projects', 'Third-party checks', 'Site troubleshooting']
      }
    ],

    team: [
      { id: 'team-1', name: 'Ritik Chaudhary', title: 'Founder & Structural Engineer', bio: 'Founder of DESIGNRUN — Civil & Structure Solution. Leads structural design, analysis coordination and client consultation for residential, commercial and industrial projects. Call +91 80069 03841 or email ritikchaudhary126@gmail.com to discuss your project.', expertise: ['Structural Design', 'RCC & Steel', 'Client Consultation'], email: 'ritikchaudhary126@gmail.com', hue: 212, placeholder: false }
    ],

    /* Project report records — tracked per project on the Reports page. */
    reports: [
      {
        id: 'rep-1',
        title: 'Structural Design Summary',
        project: 'G+5 Residential Building',
        type: 'Design Summary',
        date: '2025-11-20',
        author: 'Ritik Chaudhary',
        status: 'Issued',
        file: null,
        notes: 'Design basis, material grades, grid layout and drawing references for the residential building package.',
        demo: false
      },
      {
        id: 'rep-2',
        title: 'Wind Load Study Overview',
        project: 'High-Rise Building',
        type: 'CFD Overview',
        date: '2025-08-15',
        author: 'Ritik Chaudhary',
        status: 'Issued',
        file: null,
        notes: 'Wind study scope, model inputs, pressure zones and review notes for the high-rise structural scheme.',
        demo: false
      },
      {
        id: 'rep-3',
        title: 'Steel Detailing Notes',
        project: 'PEB Industrial Shed',
        type: 'Detailing Notes',
        date: '2026-02-02',
        author: 'Ritik Chaudhary',
        status: 'In Review',
        file: null,
        notes: 'GA drawings, member list, connection sketches and bolt schedules for the industrial shed package.',
        demo: false
      },
      {
        id: 'rep-4',
        title: 'Seismic Screening Checklist',
        project: 'Bridge Structure',
        type: 'Safety Checklist',
        date: '2026-03-10',
        author: 'Ritik Chaudhary',
        status: 'Draft',
        file: null,
        notes: 'Preliminary seismic screening checklist. Final assessment follows the applicable code and qualified professional review.',
        demo: false
      },
      {
        id: 'rep-5',
        title: 'Project Initiation Report',
        project: 'G+5 Residential Building',
        type: 'Project Report',
        date: '2025-09-05',
        author: 'Ritik Chaudhary',
        status: 'Issued',
        file: 'assets/documents/demo-report-template.html',
        notes: 'Initiation report with scope, milestones and document register — download the printable template file.',
        demo: false
      }
    ],

    /* Resource library — articles, documents and external reference links. */
    resources: [
      {
        id: 'res-art-1',
        kind: 'Article',
        title: 'Understanding Wind Loads on High-Rise Structures',
        category: 'Wind Engineering',
        summary: 'A plain-language overview of how wind affects tall buildings and what inputs a wind study normally needs.',
        body: 'Tall, slender buildings respond to wind in two main ways: overall lateral movement (acceleration that occupants may feel) and local pressures on the cladding. A typical wind study collects the site wind climate, surrounding terrain and building geometry before running validated CFD or wind tunnel simulations.\n\nResults are usually presented as direction-dependent base forces, drift guidance and cladding pressure zones. These outputs must be interpreted against the applicable design code and reviewed by a qualified professional before construction.\n\nThis article is general educational content from the DESIGNRUN resource library. It is not project-specific engineering advice.'
      },
      {
        id: 'res-art-2',
        kind: 'Article',
        title: 'RCC vs Steel: Choosing the Right Structural Frame',
        category: 'Structural Design',
        summary: 'Key considerations when comparing reinforced concrete and structural steel frames for a project.',
        body: 'Reinforced concrete is often chosen for residential and institutional buildings because the material is locally available, fire performance is inherent and formwork allows flexible layouts. Steel frames suit industrial sheds, warehouses and long-span roofs where erection speed and strength-to-weight ratio matter.\n\nCommon decision factors include span and load demands, construction programme, corrosion exposure, availability of skilled labour, fire protection strategy and lifecycle cost. Most real projects mix both systems.\n\nThis article is general educational content from the DESIGNRUN resource library, not a design recommendation.'
      },
      {
        id: 'res-art-3',
        kind: 'Article',
        title: 'BIM Coordination Basics for Small Engineering Firms',
        category: 'BIM',
        summary: 'Practical first steps for introducing coordinated 3D modeling into a small structural practice.',
        body: 'Start with a clear model purpose: coordination, drawings or quantity take-off. Agree naming conventions for levels, grids and families before modelling begins, and keep a shared coordinate system with the architect and MEP team.\n\nRun clash reviews at defined milestones rather than continuously, and issue a short written record of resolved items. A lightweight BIM execution plan — even one page — prevents most rework.\n\nThis article is general educational content from the DESIGNRUN resource library.'
      },
      {
        id: 'res-art-4',
        kind: 'Article',
        title: 'Five Checks Before Submitting Structural Drawings',
        category: 'Practice',
        summary: 'A quick pre-submission checklist that helps catch common drawing issues early.',
        body: '1. Title block, revision number and drawing register are up to date.\n2. Grid dimensions, levels and section references match across all sheets.\n3. Notes reference the correct design code revision and material grades.\n4. Opening sizes, ledge offsets and architectural backgrounds are coordinated.\n5. An independent checker has reviewed and signed the set.\n\nThis article is general educational content from the DESIGNRUN resource library and is not a substitute for your firm\'s QA procedure.'
      },
      { id: 'res-doc-1', kind: 'Document', title: 'DESIGNRUN Company Brochure', category: 'Company', summary: 'Printable company brochure with services, project types and contact details.', file: 'assets/documents/designrun-brochure.html', available: true },
      { id: 'res-doc-2', kind: 'Document', title: 'Project Report Template', category: 'Templates', summary: 'Printable project report template used for initiation and progress documentation.', file: 'assets/documents/demo-report-template.html', available: true },
      { id: 'res-link-1', kind: 'Link', title: 'Bureau of Indian Standards (IS codes)', category: 'Codes & Standards', summary: 'Official source for Indian Standards including IS 456 (RCC) and IS 800 (Steel).', url: 'https://www.bis.org.in/' },
      { id: 'res-link-2', kind: 'Link', title: 'National Building Code of India (NBC 2016)', category: 'Codes & Standards', summary: 'Reference publication portal for NBC 2016 material.', url: 'https://www.iitk.ac.in/nbc/' },
      { id: 'res-link-3', kind: 'Link', title: 'American Institute of Steel Construction', category: 'Codes & Standards', summary: 'Steel design resources and specification reference (AISC 360).', url: 'https://www.aisc.org/' },
      { id: 'res-link-4', kind: 'Link', title: 'American Concrete Institute', category: 'Codes & Standards', summary: 'Concrete design resources and specification reference (ACI 318).', url: 'https://www.concrete.org/' },
      { id: 'res-link-5', kind: 'Link', title: 'Structural Engineering Magazine', category: 'Learning', summary: 'Practical articles and case studies for structural engineers.', url: 'https://www.structuremag.org/' }
    ],

    notifications: [
      { id: 'ntf-1', title: 'Welcome to DESIGNRUN', text: 'Structural design, analysis and consultancy — call +91 80069 03841 or send an enquiry to start your project.', time: '2026-01-01T09:00:00', icon: 'info' },
      { id: 'ntf-2', title: 'Company brochure available', text: 'Download the DESIGNRUN brochure from Quick Links or the Resources page.', time: '2026-01-01T09:05:00', icon: 'download' },
      { id: 'ntf-3', title: 'Track your project', text: 'Submit requirements from Design & Analysis and follow progress on the Projects page.', time: '2026-01-01T09:10:00', icon: 'alert' },
      { id: 'ntf-4', title: 'Talk to us directly', text: 'Write to ritikchaudhary126@gmail.com — every enquiry is answered personally.', time: '2026-01-01T09:15:00', icon: 'mail' }
    ]
  };

  /* ==========================================================================
     Getters / setters  (seed LocalStorage on first run)
     ========================================================================== */
  function seed(key, seedValue) {
    var stored = DR.store.get(key, null);
    if (stored === null || stored === undefined) {
      DR.store.set(key, seedValue);
      return seedValue;
    }
    return stored;
  }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  DR.getSettings = function () {
    var defaults = clone(DR.DEFAULTS.settings);
    var stored = DR.store.get(KEYS.settings, null) || {};
    return {
      founderName: stored.founderName || defaults.founderName,
      founderTitle: stored.founderTitle || defaults.founderTitle,
      founderHue: typeof stored.founderHue === 'number' ? stored.founderHue : defaults.founderHue,
      founderBio: typeof stored.founderBio === 'string' ? stored.founderBio : defaults.founderBio,
      founderPhone: typeof stored.founderPhone === 'string' ? stored.founderPhone : defaults.founderPhone,
      founderLocation: typeof stored.founderLocation === 'string' ? stored.founderLocation : defaults.founderLocation,
      founderAvatar: typeof stored.founderAvatar === 'string' ? stored.founderAvatar : defaults.founderAvatar,
      theme: DR.THEMES.indexOf(stored.theme) !== -1 ? stored.theme : defaults.theme,
      demoStats: stored.demoStats || defaults.demoStats
    };
  };
  DR.saveSettings = function (settings) { return DR.store.set(KEYS.settings, settings); };

  /* ==========================================================================
     PREMIUM — UI theme + profile data layer
     ========================================================================== */
  DR.THEMES = ['light', 'dark', 'ocean', 'sunset', 'forest'];
  DR.THEME_LABELS = {
    light: 'Light', dark: 'Dark', ocean: 'Ocean', sunset: 'Sunset', forest: 'Forest'
  };

  /* Read the active theme without normalising (so the early anti-flash script
     can pick the raw stored value before storage.js fully runs). */
  DR.getTheme = function () {
    var stored = DR.store.get(KEYS.settings, null);
    return (stored && DR.THEMES.indexOf(stored.theme) !== -1) ? stored.theme : 'light';
  };
  DR.setTheme = function (theme) {
    if (DR.THEMES.indexOf(theme) === -1) { theme = 'light'; }
    var s = DR.getSettings();
    s.theme = theme;
    DR.saveSettings(s);
    DR.applyTheme(theme);
    return theme;
  };
  DR.applyTheme = function (theme) {
    var docEl = document.documentElement;
    if (theme && theme !== 'light') { docEl.setAttribute('data-theme', theme); }
    else { docEl.removeAttribute('data-theme'); }
  };

  /* Profile helpers — resolve the effective avatar (uploaded image or initials). */
  DR.profileAvatar = function () {
    var s = DR.getSettings();
    return s.founderAvatar || DR.initialsAvatar(s.founderName, s.founderHue);
  };

  DR.getProjects = function () { return seed(KEYS.projects, clone(DR.DEFAULTS.projects)); };
  DR.saveProjects = function (list) { return DR.store.set(KEYS.projects, list); };
  DR.getProject = function (id) {
    var list = DR.getProjects();
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
    return null;
  };

  DR.getTeam = function () { return seed(KEYS.team, clone(DR.DEFAULTS.team)); };
  DR.saveTeam = function (list) { return DR.store.set(KEYS.team, list); };

  DR.getReports = function () { return clone(DR.DEFAULTS.reports); };
  DR.getResources = function () { return clone(DR.DEFAULTS.resources); };
  DR.getServices = function () { return clone(DR.DEFAULTS.services); };
  DR.getDocuments = function () { return DR.DEFAULTS.documents; };

  DR.getContactInfo = function () {
    var stored = DR.store.get(KEYS.contactInfo, null) || {};
    var base = clone(DR.DEFAULTS.contactInfo);
    return {
      email: stored.email || base.email,
      phone: stored.phone || base.phone,
      address: stored.address || base.address,
      hours: stored.hours || base.hours,
      website: stored.website || base.website
    };
  };
  DR.saveContactInfo = function (info) { return DR.store.set(KEYS.contactInfo, info); };

  DR.getNotifications = function () { return seed(KEYS.notifications, clone(DR.DEFAULTS.notifications)); };
  DR.getReadNotifications = function () { return DR.store.get(KEYS.readNotifications, []); };
  DR.markAllNotificationsRead = function () {
    var all = DR.getNotifications().map(function (n) { return n.id; });
    DR.store.set(KEYS.readNotifications, all);
  };
  DR.unreadCount = function () {
    var read = DR.getReadNotifications();
    return DR.getNotifications().filter(function (n) { return read.indexOf(n.id) === -1; }).length;
  };

  /* Append a locally saved form submission (never sent anywhere). */
  DR.pushLocal = function (key, entry) {
    var list = DR.store.get(key, []);
    list.unshift(entry);
    if (list.length > 50) list = list.slice(0, 50);
    return DR.store.set(key, list);
  };

  /* ==========================================================================
     DEMO AUTH — frontend-only demo accounts, NOT real security.
     Passwords are hashed (SHA-256 via SubtleCrypto with a sync fallback) and
     everything stays in this browser's LocalStorage. Real login / OTP needs
     a backend (Firebase Auth, Supabase Auth, or your own server). Never put
     real passwords here.
     ========================================================================== */
  function simpleHash(str) {
    var h1 = 0x811c9dc5, h2 = 0x01000193 ^ 0xdeadbeef;
    var s = 'dr$' + String(str);
    for (var i = 0; i < s.length; i++) {
      var ch = s.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 16777619);
      h2 = Math.imul(h2 ^ ch, 2246822519);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16);
  }

  DR.hashPassword = function (password, callback) {
    try {
      if (window.crypto && window.crypto.subtle && window.isSecureContext !== false) {
        window.crypto.subtle.digest('SHA-256', new TextEncoder().encode('designrun-demo$' + String(password)))
          .then(function (buf) {
            var bytes = new Uint8Array(buf), hex = '';
            for (var i = 0; i < bytes.length; i++) { hex += ('0' + bytes[i].toString(16)).slice(-2); }
            callback(hex);
          })
          .catch(function () { callback('fh:' + simpleHash(password)); });
        return;
      }
    } catch (e) { /* fall through */ }
    setTimeout(function () { callback('fh:' + simpleHash(password)); }, 0);
  };

  DR.getDemoUsers = function () { return seed(KEYS.demoUsers, []); };
  DR.saveDemoUsers = function (list) { return DR.store.set(KEYS.demoUsers, list); };
  DR.findDemoUser = function (email) {
    var list = DR.getDemoUsers();
    var em = String(email || '').trim().toLowerCase();
    for (var i = 0; i < list.length; i++) { if (list[i].email === em) return list[i]; }
    return null;
  };
  DR.getSession = function () { return DR.store.get(KEYS.demoSession, null); };
  DR.setSession = function (email, user) {
    if (!email) { DR.store.remove(KEYS.demoSession); return; }
    var s = { email: String(email).toLowerCase(), at: new Date().toISOString() };
    /* Cache the authenticated identity so the logged-in state (and Log out)
       survives even when the synced user list hasn't loaded yet (offline, or a
       sync still in flight). Prefer the live list entry when it exists. */
    if (user && typeof user === 'object') {
      s.user = {
        name: user.name,
        email: String(user.email || email).toLowerCase(),
        role: user.role === 'admin' ? 'admin' : 'user'
      };
    }
    DR.store.set(KEYS.demoSession, s);
  };
  DR.currentDemoUser = function () {
    var s = DR.getSession();
    if (!s || !s.email) return null;
    var u = DR.findDemoUser(s.email);
    if (u) return u;
    /* Fallback: session is valid but the user list isn't loaded (offline or a
       sync in progress). Use the cached identity from login so the logged-in
       state — including Log out — never flickers away. */
    if (s.user) {
      return { name: s.user.name, email: s.user.email, role: s.user.role, at: s.at };
    }
    return null;
  };
  DR.isDemoAdmin = function () {
    var u = DR.currentDemoUser();
    return !!(u && u.role === 'admin');
  };

  /* Reset all demo data (used from the profile menu). */
  DR.resetDemoData = function () {
    Object.keys(KEYS).forEach(function (k) { DR.store.remove(KEYS[k]); });
  };

  /* Common option lists used across pages. */
  DR.CATEGORIES = [
    'Structural Design & Analysis',
    'Design & Steel Detailing',
    'Wind Load Analysis',
    'Design & Consultancy',
    'RCC Design',
    '3D Modeling & BIM'
  ];
  DR.STATUSES = ['Planning', 'In Progress', 'Completed', 'On Hold'];

  DR.categoryOptions = function (selected) {
    return DR.CATEGORIES.map(function (c) {
      return '<option value="' + DR.esc(c) + '"' + (c === selected ? ' selected' : '') + '>' + DR.esc(c) + '</option>';
    }).join('');
  };
  DR.statusOptions = function (selected) {
    return DR.STATUSES.map(function (s) {
      return '<option value="' + DR.esc(s) + '"' + (s === selected ? ' selected' : '') + '>' + DR.esc(s) + '</option>';
    }).join('');
  };
})();





