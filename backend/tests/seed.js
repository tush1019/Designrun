const mem = new Map();
global.window = {
  localStorage: {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); },
    removeItem: (k) => { mem.delete(k); }
  }
};
global.DR = {};
global.window.DR = global.DR;
require('c:/Users/tusha/OneDrive/Desktop/STURCTURE/DESIGNRUN/js/storage.js');
const DR = global.window.DR;
if (!DR.DEFAULTS) { console.error('DR.DEFAULTS missing'); process.exit(1); }
const docs = {
  dr_settings: DR.DEFAULTS.settings,
  dr_contact_info: DR.DEFAULTS.contactInfo,
  dr_projects: DR.DEFAULTS.projects,
  dr_team: DR.DEFAULTS.team,
  dr_notifications: DR.DEFAULTS.notifications
};
fetch('http://localhost:3000/api/sync').then(r => r.json()).then(s => {
  console.log('sync empty:', s.empty);
  if (!s.empty) { console.log('already seeded, skipping'); return; }
  return fetch('http://localhost:3000/api/bootstrap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ docs })
  }).then(r => r.json()).then(b => {
    console.log('bootstrap ok:', b.ok, '| projects:', b.docs.dr_projects && b.docs.dr_projects.length, '| team:', b.docs.dr_team && b.docs.dr_team.length, '| notifications:', b.docs.dr_notifications && b.docs.dr_notifications.length);
  });
}).catch(e => { console.error('ERR', e.message); process.exit(1); });
