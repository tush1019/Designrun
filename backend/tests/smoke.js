/* DESIGNRUN backend — end-to-end smoke test.
   Starts a temporary server on its own port with a throw-away database,
   exercises every API group, then shuts down.
   Run: npm run smoke                                                */
'use strict';

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PORT = Number(process.env.SMOKE_PORT) || 3100;
const BASE = 'http://localhost:' + PORT;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dr-smoke-'));

let passed = 0;
let failed = 0;

function check(name, cond, extra) {
  if (cond) { passed += 1; console.log('  PASS  ' + name); }
  else { failed += 1; console.log('  FAIL  ' + name + (extra !== undefined ? ' -> ' + JSON.stringify(extra) : '')); }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function req(method, p, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch(BASE + '/api' + p, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let data = {};
  try { data = await res.json(); } catch (err) { /* empty body */ }
  return { status: res.status, data };
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(BASE + '/api/health');
      if (res.ok) return true;
    } catch (err) { /* not up yet */ }
    await sleep(150);
  }
  return false;
}

async function main() {
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DB_PATH: path.join(TMP, 'smoke.db') }),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stdout.on('data', () => {});
  child.stderr.on('data', (d) => process.stderr.write(d));

  try {
    const up = await waitForServer();
    if (!up) { console.error('server did not start'); process.exit(1); }

    console.log('\n- health & sync -');
    let r = await req('GET', '/health');
    check('health', r.status === 200 && r.data.ok === true, r);

    r = await req('GET', '/sync');
    check('sync reports empty database', r.status === 200 && r.data.empty === true, r.data);

    r = await req('POST', '/bootstrap', { docs: { dr_projects: [{ id: 'p1', name: 'Smoke project' }], dr_settings: { founderName: 'Smoke' } } });
    check('bootstrap seeds the server', r.status === 200 && Array.isArray(r.data.docs.dr_projects), r.data);

    r = await req('GET', '/sync');
    check('sync no longer empty', r.data.empty === false, r.data.empty);
    check('sync returns seeded projects', r.data.docs.dr_projects && r.data.docs.dr_projects.length === 1, r.data.docs);
    check('sync hides submissions from anonymous users', r.data.submissions === undefined, Object.keys(r.data));

    console.log('\n- auth -');
    r = await req('POST', '/auth/signup', { name: 'Admin One', email: 'admin@demo.test', password: 'secret12' });
    check('signup returns a 6-digit OTP', r.status === 200 && /^\d{6}$/.test(r.data.otp), r.data);
    const otp = r.data.otp;

    r = await req('POST', '/auth/verify', { email: 'admin@demo.test', otp: '000000' });
    check('wrong OTP rejected', r.status === 400, r);

    r = await req('POST', '/auth/verify', { email: 'admin@demo.test', otp });
    check('correct OTP creates the first (admin) account', r.status === 200 && r.data.user.role === 'admin', r.data);
    const adminToken = r.data.token;

    r = await req('POST', '/auth/login', { email: 'admin@demo.test', password: 'wrong' });
    check('wrong password rejected', r.status === 401, r.status);

    r = await req('POST', '/auth/login', { email: 'admin@demo.test', password: 'secret12' });
    check('login returns a token', r.status === 200 && !!r.data.token, r.status);
    const loginToken = r.data.token;

    r = await req('GET', '/auth/me', undefined, loginToken);
    check('GET /auth/me identifies the user', r.status === 200 && r.data.user.email === 'admin@demo.test', r.data);

    r = await req('POST', '/auth/signup', { name: 'Member Two', email: 'user@demo.test', password: 'secret12' });
    check('public signup is closed after the first admin', r.status === 403, r);

    r = await req('POST', '/admin/users', { name: 'Member Two', email: 'user@demo.test', password: 'secret12', role: 'user' }, adminToken);
    check('admin can create a regular user', r.status === 200 && r.data.users.some((u) => u.email === 'user@demo.test' && u.role === 'user'), r.data);
    const created = r.data.users.find((u) => u.email === 'user@demo.test');

    r = await req('POST', '/auth/login', { email: 'user@demo.test', password: 'secret12' });
    check('created user can log in', r.status === 200 && !!r.data.token, r.status);
    const userToken = r.data.token;
    check('created user is a regular user', created && created.role === 'user', created);


    console.log('\n- content -');
    r = await req('PUT', '/settings', { founderName: 'Updated Name', demoStats: { completedProjects: 42 } }, adminToken);
    check('PUT /settings accepted', r.status === 200 && r.data.value.founderName === 'Updated Name', r.data);

    r = await req('GET', '/sync');
    check('settings visible in sync', r.data.docs.dr_settings && r.data.docs.dr_settings.founderName === 'Updated Name', r.data.docs.dr_settings);

    console.log('\n- submissions -');
    r = await req('POST', '/contact-messages', { id: 'm1', name: 'Asha', email: 'asha@example.com', message: 'Need RCC design for a villa.' });
    check('contact message stored', r.status === 200 && r.data.entry.id === 'm1', r.data);

    r = await req('POST', '/analysis-requests', { id: 'a1', name: 'Tower A', type: 'High Rise' });
    check('analysis request stored', r.status === 200, r.data);

    r = await req('GET', '/sync', undefined, adminToken);
    check('admin sync includes enquiries', r.data.submissions && r.data.submissions.dr_contact_messages.length === 1 && r.data.submissions.dr_analysis_requests.length === 1, r.data.submissions);

    console.log('\n- admin guard -');
    r = await req('PUT', '/admin/users', { users: [] });
    check('anonymous cannot manage users', r.status === 401, r.status);
    r = await req('PUT', '/admin/users', { users: [] }, userToken);
    check('regular user cannot manage users', r.status === 403, r.status);
    r = await req('PUT', '/admin/users', { users: [{ name: 'Admin One', email: 'admin@demo.test', role: 'admin' }, { name: 'Member Two', email: 'user@demo.test', role: 'admin' }] }, adminToken);
    check('admin can promote users', r.status === 200 && r.data.users.find((u) => u.email === 'user@demo.test').role === 'admin', r.data.users);
    r = await req('POST', '/admin/reset');
    check('anonymous cannot reset', r.status === 401, r.status);
    r = await req('POST', '/admin/reset', {}, adminToken);
    check('admin can reset the site', r.status === 200, r.data);
    r = await req('GET', '/sync', undefined, adminToken);
    check('reset keeps the acting admin but clears content', r.data.empty === false && r.data.users.length === 1 && r.data.users[0].email === 'admin@demo.test', r.data);
    r = await req('POST', '/auth/signup', { name: 'Sneaky', email: 'sneaky@demo.test', password: 'secret12' });
    check('signup stays closed after a reset (no admin hijack)', r.status === 403, r);

    console.log('\n- static frontend -');
    const page = await fetch(BASE + '/index.html');
    const html = await page.text();
    check('index.html served', page.status === 200 && html.includes('DESIGNRUN'), page.status);
    const apiJs = await fetch(BASE + '/js/api.js');
    check('js/api.js served', apiJs.status === 200, apiJs.status);
    const missing = await fetch(BASE + '/api/definitely-not-here');
    check('unknown API route is 404 JSON', missing.status === 404, missing.status);
  } finally {
    await new Promise((resolve) => {
      if (child.exitCode !== null) return resolve();
      const timer = setTimeout(resolve, 2500);
      child.once('close', () => { clearTimeout(timer); resolve(); });
      child.kill();
    });
    try {
      fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
    } catch (err) {
      console.warn('  (temp cleanup skipped: ' + err.message + ')');
    }
  }

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
