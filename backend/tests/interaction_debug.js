/* Load REAL storage.js + api.js + app.js in the headless DOM, sign in against the
   live server, then actually FIRE clicks on bell / avatar / profile / logout to
   see if any hidden exception breaks wiring. */
const { createDocument } = require('./dom.js');

const mem = new Map();
const ls = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { mem.set(k, String(v)); },
  removeItem: (k) => { mem.delete(k); }
};

const document = createDocument();
['sidebar-root', 'topbar-root', 'footer-root', 'modal-root', 'toast-root'].forEach(id => {
  const d = document.createElement('div'); d.setAttribute('id', id); document.body.appendChild(d);
});
document.body.setAttribute('data-page', 'dashboard');
document.readyState = 'complete';

global.document = document;
global.Event = class { constructor(t) { this.type = t; } };
global.window = {
  localStorage: ls,
  location: { protocol: 'http:', port: '5500', origin: 'http://localhost:5500', href: 'http://localhost:5500/index.html' },
  addEventListener: () => {},
  crypto: undefined,
  isSecureContext: false
};
global.fetch = fetch;
global.DR = {};
global.window.DR = global.DR;

const errors = [];
const origErr = console.error;
console.error = (...a) => { errors.push(a.join(' ')); origErr(...a); };

require('../../DESIGNRUN/js/storage.js');
require('../../DESIGNRUN/js/api.js');
require('../../DESIGNRUN/js/app.js');

const DR = global.window.DR;
const P = (...a) => process.stdout.write(a.join(' ') + '\n');

(async () => {
  await DR.ready;
  P('offline?', DR.api.offline);

  const email = 'ui.test' + Date.now() + '@demo.test';
  const su = await DR.api.signup('UI Tester', email, 'secret12');
  await DR.api.verifyOtp(email, su.otp);
  const me = DR.currentDemoUser();
  P('currentDemoUser:', me ? (me.name + ' / ' + me.role) : 'NULL');

  // Re-render chrome the way a signed-in page would:
  DR.refreshChrome();
  P('--- after refreshChrome ---');

  const bell = document.getElementById('bell-btn');
  const bellMenu = document.getElementById('bell-menu');
  P('bell-btn present?', !!bell, '| bell-menu present?', !!bellMenu);

  const prof = document.getElementById('profile-btn');
  const profMenu = document.getElementById('profile-menu');
  P('profile-btn present?', !!prof, '| profile-menu present?', !!profMenu);

  let logoutBtn = document.querySelector('[data-action="logout"]');
  P('logout button in DOM (before opening menu)?', !!logoutBtn);

  // Fire bell click
  if (bell) { try { bell.click(); P('bell click OK. bell-menu.hidden =', bellMenu && bellMenu.hidden); } catch (e) { P('BELL CLICK THREW:', e.message); } }

  // Fire avatar click
  if (prof) { try { prof.click(); P('avatar click OK. profile-menu.hidden =', profMenu && profMenu.hidden); } catch (e) { P('AVATAR CLICK THREW:', e.message); } }

  logoutBtn = document.querySelector('[data-action="logout"]');
  P('logout button findable after menu open?', !!logoutBtn);

  // Fire logout click
  if (logoutBtn) {
    try {
      logoutBtn.click();
      const sess = DR.getSession();
      P('logout click OK. session after =', JSON.stringify(sess));
      P('currentDemoUser after logout =', DR.currentDemoUser() ? 'STILL SET' : 'null (correct)');
    } catch (e) { P('LOGOUT CLICK THREW:', e.message); }
  }

  P('--- captured console.error output ---');
  P(errors.length ? errors.join('\n') : '(none)');
  process.exit(0);
})().catch(e => { P('FATAL', e && e.stack || e); process.exit(1); });

