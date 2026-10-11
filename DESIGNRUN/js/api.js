/* ==========================================================================
   DESIGNRUN — api.js
   Backend bridge for the Express + SQLite server in ../backend.

   - On every page load it syncs the server's data into LocalStorage (which
     keeps acting as a fast read cache), so the existing DR.* helpers work
     unchanged.
   - Every save (projects, team, settings, enquiries, users, reset) is also
     pushed to the server.
   - Page rendering waits for the sync (DOMContentLoaded is queued behind
     DR.ready), so the first paint already shows server data.
   - If the server is unreachable the site keeps working offline in
     LocalStorage mode, exactly like before.

   API base: same origin when served by the backend (port 3000),
   otherwise http://localhost:3000 (e.g. VS Code Live Server).
   Override with window.DR_API_BASE or localStorage 'dr_api_base'.
   ========================================================================== */
(function () {
  'use strict';

  var DR = window.DR;
  var K = DR.KEYS;
  var TOKEN_KEY = 'dr_token';

  var SUBMIT_PATHS = {};
  SUBMIT_PATHS[K.contactMessages] = '/contact-messages';
  SUBMIT_PATHS[K.consultations] = '/consultations';
  SUBMIT_PATHS[K.analysisRequests] = '/analysis-requests';

  var DOC_PUT_PATHS = {};
  DOC_PUT_PATHS[K.settings] = '/settings';
  DOC_PUT_PATHS[K.contactInfo] = '/contact-info';
  DOC_PUT_PATHS[K.projects] = '/projects';
  DOC_PUT_PATHS[K.team] = '/team';

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function defaultBase() {
    try {
      if (window.DR_API_BASE !== undefined && window.DR_API_BASE !== null) return String(window.DR_API_BASE);
      var saved = window.localStorage.getItem('dr_api_base');
      if (saved) return String(JSON.parse(saved));
    } catch (e) { /* fall through */ }
    var loc = window.location;
    if (loc.protocol === 'file:') return 'http://localhost:3000';
    /* Local dev on a non-3000 port (e.g. VS Code Live Server on 5500) still
       needs to reach the backend running on :3000. */
    if (/^(localhost|127\.0\.0\.1)$/.test(loc.hostname) && loc.port && loc.port !== '3000') {
      return 'http://localhost:3000';
    }
    /* Everything else — localhost:3000 locally, or the deployed domain
       (e.g. Render) — is served BY the backend, so the API is same-origin. */
    return '';
  }

  var base = defaultBase();

  /* ------------------------------ API core ------------------------------ */
  DR.api = {
    base: base,
    offline: false,
    syncDone: false,
    token: function () { return DR.store.get(TOKEN_KEY, null); },
    setToken: function (t) { if (t) DR.store.set(TOKEN_KEY, t); else DR.store.remove(TOKEN_KEY); },
    request: function (method, path, body) {
      var headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
      var t = DR.api.token();
      if (t) headers.Authorization = 'Bearer ' + t;
      return fetch(base + '/api' + path, {
        method: method,
        headers: headers,
        credentials: 'include',
        body: body === undefined || body === null ? undefined : JSON.stringify(body)
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) {
            var e = new Error((data && data.error) || ('Server responded ' + res.status));
            e.status = res.status;
            throw e;
          }
          return data;
        });
      }).catch(function (err) {
        if (err && typeof err.status === 'number') throw err; /* real API error */
        DR.api.offline = true;
        var e = new Error('Cannot reach the DESIGNRUN server at ' + (base || window.location.origin) + '.');
        e.network = true;
        throw e;
      });
    }
  };

  function warn(err) {
    console.warn('[DESIGNRUN] server sync failed:', err && err.message);
  }

  function toastError(err) {
    if (DR.toast && err && err.message) DR.toast(err.message, 'error');
    else warn(err);
  }

  /* --------------------------- sync / apply ----------------------------- */
  function mergeById(serverList, localList) {
    var seen = {};
    var out = [];
    (serverList || []).concat(localList || []).forEach(function (entry) {
      if (!entry) return;
      if (entry.id) {
        if (seen[entry.id]) return;
        seen[entry.id] = true;
      }
      out.push(entry);
    });
    return out;
  }

  function applySync(s) {
    if (!s) return;
    if (s.docs) {
      Object.keys(s.docs).forEach(function (key) {
        if (s.docs[key] !== null && s.docs[key] !== undefined) DR.store.set(key, s.docs[key]);
      });
    }
    if (s.users) DR.store.set(K.demoUsers, s.users);
    if (s.submissions) {
      Object.keys(s.submissions).forEach(function (key) {
        var local = DR.store.get(key, []) || [];
        DR.store.set(key, mergeById(s.submissions[key], local));
      });
    }
  }

  function boot() {
    return DR.api.request('GET', '/sync')
      .then(function (s) {
        DR.api.offline = false;
        if (s && s.empty) {
          return DR.api.request('POST', '/bootstrap', { docs: bootstrapDocs() })
            .then(function (r) { applySync(r.sync || r); })
            .catch(function (err) { warn(err); return DR.api.refresh(); });
        }
        applySync(s);
      })
      .catch(function (err) { DR.api.offline = true; warn(err); })
      .then(function () { DR.api.syncDone = true; });
  }

  /* Re-fetch everything (used after login / sign-up). */
  DR.api.refresh = function () {
    return DR.api.request('GET', '/sync').then(function (s) {
      DR.api.offline = false;
      applySync(s);
      return s;
    }).catch(function (err) { DR.api.offline = true; warn(err); });
  };

  /* ------------------ hold rendering until sync finishes ---------------- */
  /* Every page boots through DOMContentLoaded; queue those callbacks behind
     DR.ready so the first render already contains server data. */
  var nativeAddEventListener = document.addEventListener.bind(document);
  var readyResolved = false;

  document.addEventListener = function (type, fn, opts) {
    if (type === 'DOMContentLoaded' && !readyResolved) {
      DR.ready.then(function () {
        if (document.readyState === 'loading') {
          nativeAddEventListener('DOMContentLoaded', fn, opts);
        } else if (typeof fn === 'function') {
          fn.call(document, new Event('DOMContentLoaded'));
        }
      });
      return;
    }
    return nativeAddEventListener(type, fn, opts);
  };

  /* Safety net: never leave a page blank if the sync hangs. */
  var forceReady = new Promise(function (resolve) { setTimeout(resolve, 5000); });
  DR.ready = Promise.race([boot(), forceReady]).then(function (value) {
    readyResolved = true;
    DR.api.syncDone = true;
    return value;
  });

  /* ------------------------ write-through wrappers ---------------------- */
  function putDoc(key, value) {
    var path = DOC_PUT_PATHS[key];
    if (!path || DR.api.offline) return;
    DR.api.request('PUT', path, value).catch(function (err) {
      warn(err);
      if (!err.network && DR.toast) DR.toast('Saved locally — server sync failed.', 'info');
    });
  }

  DR.saveSettings = function (settings) {
    var ok = DR.store.set(K.settings, settings);
    putDoc(K.settings, settings);
    return ok;
  };

  DR.saveProjects = function (list) {
    var ok = DR.store.set(K.projects, list);
    putDoc(K.projects, list);
    return ok;
  };

  DR.saveTeam = function (list) {
    var ok = DR.store.set(K.team, list);
    putDoc(K.team, list);
    return ok;
  };

  DR.saveContactInfo = function (info) {
    var ok = DR.store.set(K.contactInfo, info);
    putDoc(K.contactInfo, info);
    return ok;
  };

  var origPushLocal = DR.pushLocal;
  DR.pushLocal = function (key, entry) {
    var ok = origPushLocal(key, entry);
    var path = SUBMIT_PATHS[key];
    if (path && !DR.api.offline) {
      DR.api.request('POST', path, entry).catch(function (err) {
        warn(err);
        if (!err.network && DR.toast) DR.toast('Enquiry saved locally — server sync failed.', 'info');
      });
    }
    return ok;
  };

  DR.saveDemoUsers = function (list) {
    var ok = DR.store.set(K.demoUsers, list);
    if (DR.api.offline) return ok;
    DR.api.request('PUT', '/admin/users', { users: list })
      .then(function (r) { if (r && r.users) DR.store.set(K.demoUsers, r.users); })
      .catch(toastError);
    return ok;
  };

  var origReset = DR.resetDemoData;
  DR.resetDemoData = function () {
    var wasAdmin = DR.isDemoAdmin();
    origReset();
    DR.api.setToken(null);
    if (wasAdmin && !DR.api.offline) {
      DR.api.request('POST', '/admin/reset', {}).catch(warn);
    }
  };

  /* Logging out also clears the API token + server auth cookie. */
  DR.api.logout = function () {
    return DR.api.request('POST', '/auth/logout', {}).catch(warn);
  };
  var origSetSession = DR.setSession;
  DR.setSession = function (email, user) {
    if (!email) {
      DR.api.setToken(null);
      DR.api.logout();
    }
    return origSetSession(email, user);
  };

  /* ---------------------------- auth helpers ---------------------------- */
  function applyAuth(res) {
    DR.api.setToken(res.token);
    origSetSession(res.user.email, res.user);
    return DR.api.refresh().then(function () { return res; });
  }

  DR.api.signup = function (name, email, password) {
    return DR.api.request('POST', '/auth/signup', { name: name, email: email, password: password });
  };
  DR.api.resendOtp = function (email) {
    return DR.api.request('POST', '/auth/resend', { email: email });
  };
  DR.api.verifyOtp = function (email, otp) {
    return DR.api.request('POST', '/auth/verify', { email: email, otp: otp }).then(applyAuth);
  };
  DR.api.login = function (email, password) {
    return DR.api.request('POST', '/auth/login', { email: email, password: password }).then(applyAuth);
  };

  /* Server content for a fresh database (keeps any LocalStorage edits the
     owner already made, otherwise the shipped DR.DEFAULTS). */
  function bootstrapDocs() {
    var docs = {};
    docs[K.settings] = DR.store.get(K.settings, null) || clone(DR.DEFAULTS.settings);
    docs[K.contactInfo] = DR.store.get(K.contactInfo, null) || clone(DR.DEFAULTS.contactInfo);
    docs[K.projects] = DR.store.get(K.projects, null) || clone(DR.DEFAULTS.projects);
    docs[K.team] = DR.store.get(K.team, null) || clone(DR.DEFAULTS.team);
    docs[K.notifications] = DR.store.get(K.notifications, null) || clone(DR.DEFAULTS.notifications);
    return docs;
  }
})();
