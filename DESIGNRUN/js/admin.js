/* DESIGNRUN admin.js - control centre, browser-local data. */
(function () {
  'use strict';
  var DR = window.DR;
  var tab = 'overview';
  var TABS = [
    { k: 'overview', t: 'Overview', i: 'dashboard' },
    { k: 'projects', t: 'Projects', i: 'folder' },
    { k: 'enquiries', t: 'Enquiries', i: 'mail' },
    { k: 'stats', t: 'Stats Control', i: 'chart' },
    { k: 'users', t: 'Users', i: 'users' }
  ];
  function counts() {
    return {
      projects: DR.getProjects().length,
      enquiries: (DR.store.get('dr_contact_messages', []) || []).length + (DR.store.get('dr_consultation_requests', []) || []).length + (DR.store.get('dr_analysis_requests', []) || []).length,
      users: DR.getDemoUsers().length,
      team: DR.getTeam().length
    };
  }
  function renderTabs() {
    var w = document.getElementById('admin-tabs'); if (!w) return;
    w.innerHTML = TABS.map(function (t) {
      return '<button type="button" class="admin-tab' + (t.k === tab ? ' active' : '') + '" data-tab="' + t.k + '"><i data-icon="' + t.i + '" data-size="17"></i> ' + t.t + '</button>';
    }).join('');
    DR.renderIcons(w);
    Array.prototype.forEach.call(w.querySelectorAll('[data-tab]'), function (b) {
      b.addEventListener('click', function () { tab = b.getAttribute('data-tab'); renderTabs(); DR.renderAdminPane(tab); });
    });
  }
  DR.renderAdminTabs = renderTabs;
  DR.adminCounts = counts;
  DR.adminGetTab = function () { return tab; };
  DR.adminSetTab = function (t) { tab = t; };
  DR.renderAdminPane = function (t) {
    var p = document.getElementById('admin-pane'); if (!p) return;
    if (t === 'projects') return paneProjects(p);
    if (t === 'enquiries') return paneEnq(p);
    if (t === 'stats') return paneStats(p);
    if (t === 'users') return paneUsers(p);
    return paneOverview(p);
  };
  function paneOverview(p) {
    var c = DR.adminCounts(); var me = DR.currentDemoUser();
    p.innerHTML = '<h2>Welcome, ' + DR.esc(me ? me.name : 'Admin') + '</h2>' +
      '<p class="muted">Control room: projects, enquiries, stats, users — sab kuch server par live.</p>' +
      '<div class="check-grid" style="margin-top:12px;">' +
      '<div class="notice-box notice-info"><i data-icon="folder" data-size="16"></i><p><strong>' + c.projects + ' projects.</strong></p></div>' +
      '<div class="notice-box notice-info"><i data-icon="mail" data-size="16"></i><p><strong>' + c.enquiries + ' enquiries.</strong></p></div>' +
      '<div class="notice-box notice-warn"><i data-icon="alert" data-size="16"></i><p><strong>Stored on the server.</strong> Projects, enquiries and accounts are shared across devices via the DESIGNRUN backend.</p></div></div>' +
      '<div class="form-actions" style="margin-top:14px;"><a class="btn btn-primary" href="projects.html">Manage Projects</a>' +
      '<button type="button" class="btn btn-ghost" id="adm-reset">Reset all site data</button></div>';
    DR.renderIcons(p);
    var r = document.getElementById('adm-reset');
    if (r) r.addEventListener('click', function () {
      DR.confirmAction({ title: 'Reset site data?', message: 'All projects, users and enquiries stored on the server will be deleted and the original site content restored. This cannot be undone.', confirmText: 'Reset', danger: true }, function () { DR.resetDemoData(); location.reload(); });
    });
  }
  function paneProjects(p) {
    var list = DR.getProjects();
    p.innerHTML = '<h2>Projects (' + list.length + ')</h2>' +
      (list.length ? list.map(function (x) {
        return '<div class="user-row"><span class="icon-chip">' + DR.icon('folder', 17) + '</span>' +
          '<span style="flex:1;min-width:0;"><strong>' + DR.esc(x.name) + '</strong><br><small class="muted">' + DR.esc(x.status) + '</small></span>' +
          '<button class="btn btn-ghost btn-sm" data-cyc="' + DR.esc(x.id) + '">Status</button>' +
          '<button class="btn btn-ghost btn-sm" data-del="' + DR.esc(x.id) + '">Delete</button></div>';
      }).join('') : '<div class="empty-state">No projects.</div>');
    DR.renderIcons(p);
    Array.prototype.forEach.call(p.querySelectorAll('[data-del]'), function (b) {
      b.addEventListener('click', function () {
        DR.confirmAction({ title: 'Delete?', message: 'Project server se permanently delete ho jayega.', confirmText: 'Delete', danger: true }, function () {
          DR.saveProjects(DR.getProjects().filter(function (x) { return x.id !== b.getAttribute('data-del'); }));
          DR.adminKpi(); DR.renderAdminPane('projects'); DR.refreshChrome(); DR.toast('Deleted.', 'success');
        });
      });
    });
    Array.prototype.forEach.call(p.querySelectorAll('[data-cyc]'), function (b) {
      b.addEventListener('click', function () {
        var all = DR.getProjects(); var id = b.getAttribute('data-cyc');
        var order = ['Planning', 'In Progress', 'Completed', 'On Hold'];
        for (var i = 0; i < all.length; i++) if (all[i].id === id) { all[i].status = order[(order.indexOf(all[i].status) + 1) % order.length]; }
        DR.saveProjects(all); DR.renderAdminPane('projects'); DR.refreshChrome(); DR.toast('Status updated.', 'success');
      });
    });
  }
  function paneEnq(p) {
    var msgs = DR.store.get('dr_contact_messages', []) || [];
    var cons = DR.store.get('dr_consultation_requests', []) || [];
    var anls = DR.store.get('dr_analysis_requests', []) || [];
    var all = msgs.map(function (m) { m._kind = 'Contact'; return m; })
      .concat(cons.map(function (m) { m._kind = 'Consult'; return m; }))
      .concat(anls.map(function (m) { m._kind = 'Analysis'; return m; }));
    p.innerHTML = '<h2>Enquiries (' + all.length + ')</h2>' +
      '<p class="muted">Received on the DESIGNRUN server — visible from any device.</p>' +
      (all.length ? all.slice(0, 20).map(function (m) {
        return '<div class="user-row"><span class="icon-chip">' + DR.icon('mail', 16) + '</span>' +
          '<span style="flex:1;min-width:0;"><strong>' + DR.esc(m.name || m.email || 'Enquiry') + '</strong><br>' +
          '<small class="muted">' + DR.esc(m._kind) + ' · ' + DR.esc(m.email || '') + '</small></span></div>';
      }).join('') : '<div class="empty-state">No enquiries yet.</div>');
    DR.renderIcons(p);
  }
  function paneStats(p) {
    var s = DR.getSettings();
    var d = s.demoStats;
    function num(id, label, val) {
      return '<div class="form-group"><label for="' + id + '">' + label + '</label>' +
        '<input id="' + id + '" type="number" min="0" max="100000" value="' + DR.esc(String(val)) + '"></div>';
    }
    p.innerHTML = '<h2>Stats Control</h2>' +
      '<p class="muted">Dashboard numbers can be edited below and are shown on the Dashboard page.</p>' +
      '<div class="form-grid">' +
      num('st-proj', 'Completed Projects', d.completedProjects) +
      num('st-serv', 'Analysis Services', d.analysisServices) +
      num('st-clients', 'Happy Clients', d.happyClients) +
      num('st-years', 'Quality Years', d.qualityYears) + '</div>' +
      '<div class="form-actions"><button type="button" class="btn btn-gold" id="st-save">Save Stats</button></div>';
    var btn = document.getElementById('st-save');
    if (btn) btn.addEventListener('click', function () {
      function v(id) { var n = parseInt(document.getElementById(id).value, 10); return isNaN(n) || n < 0 ? 0 : n; }
      s.demoStats = { completedProjects: v('st-proj'), analysisServices: v('st-serv'), happyClients: v('st-clients'), qualityYears: v('st-years') };
      DR.saveSettings(s);
      DR.toast('Dashboard stats updated.', 'success');
    });
  }
  function paneUsers(p) {
    var list = DR.getDemoUsers();
    var me = DR.currentDemoUser();
    p.innerHTML = '<h2>Users (' + list.length + ')</h2>' +
      '<p class="muted">Public sign-up is closed. Create accounts here — the first account is the administrator.</p>' +
      '<form id="admin-add-user" class="admin-adduser" novalidate>' +
        '<div class="form-group"><label for="au-name">Full name *</label><input id="au-name" type="text" maxlength="60" autocomplete="off"><span class="field-error" id="err-au-name"></span></div>' +
        '<div class="form-group"><label for="au-email">Email *</label><input id="au-email" type="email" maxlength="120" autocomplete="off"><span class="field-error" id="err-au-email"></span></div>' +
        '<div class="form-group"><label for="au-pass">Password (min 6) *</label><input id="au-pass" type="text" maxlength="100" autocomplete="off"><span class="field-error" id="err-au-pass"></span></div>' +
        '<div class="form-group"><label for="au-role">Role</label><select id="au-role"><option value="user">User</option><option value="admin">Administrator</option></select></div>' +
        '<div class="form-actions"><button type="submit" class="btn btn-gold"><i data-icon="user-plus" data-size="16"></i> Add user</button></div>' +
      '</form>' +
      '<div class="admin-userlist">' +
      (list.length ? list.map(function (u) {
        var isMe = me && me.email === u.email;
        return '<div class="user-row"><img class="avatar avatar-sm" alt="" src="' + DR.initialsAvatar(u.name, 212) + '">' +
          '<span style="flex:1;min-width:0;"><strong>' + DR.esc(u.name) + (isMe ? ' (you)' : '') + '</strong><br>' +
          '<small class="muted">' + DR.esc(u.email) + '</small></span>' +
          '<span class="role-badge ' + (u.role === 'admin' ? 'role-admin' : 'role-user') + '">' + DR.esc(u.role.toUpperCase()) + '</span>' +
          ((u.role !== 'admin' && !isMe)
            ? '<button class="btn btn-ghost btn-sm" data-mk="' + DR.esc(u.email) + '">Make admin</button>' +
              '<button class="btn btn-ghost btn-sm" data-rm="' + DR.esc(u.email) + '">Remove</button>'
            : '') + '</div>';
      }).join('') : '<div class="empty-state">No users yet. Add the first account above.</div>') +
      '</div>';
    DR.renderIcons(p);
    Array.prototype.forEach.call(p.querySelectorAll('[data-mk]'), function (b) {
      b.addEventListener('click', function () {
        var all = DR.getDemoUsers();
        for (var i = 0; i < all.length; i++) { if (all[i].email === b.getAttribute('data-mk')) all[i].role = 'admin'; }
        DR.saveDemoUsers(all);
        DR.renderAdminPane('users'); DR.refreshChrome(); DR.toast('Promoted to administrator.', 'success');
      });
    });
    Array.prototype.forEach.call(p.querySelectorAll('[data-rm]'), function (b) {
      b.addEventListener('click', function () {
        DR.confirmAction({ title: 'Remove user?', message: 'This account will be removed from the server.', confirmText: 'Remove', danger: true }, function () {
          DR.saveDemoUsers(DR.getDemoUsers().filter(function (u) { return u.email !== b.getAttribute('data-rm'); }));
          DR.adminKpi(); DR.renderAdminPane('users'); DR.toast('User removed.', 'success');
        });
      });
    });
    wireAddUser();
  }
  function wireAddUser() {
    var f = document.getElementById('admin-add-user');
    if (!f) return;
    function err(id, msg) { var e = document.getElementById(id); if (e) e.textContent = msg || ''; }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var nm = document.getElementById('au-name').value.trim();
      var em = document.getElementById('au-email').value.trim().toLowerCase();
      var pw = document.getElementById('au-pass').value;
      var role = document.getElementById('au-role').value;
      var ok = true;
      if (nm.length < 2) { err('err-au-name', 'Enter a name.'); ok = false; } else err('err-au-name', '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { err('err-au-email', 'Enter a valid email.'); ok = false; } else err('err-au-email', '');
      if (pw.length < 6) { err('err-au-pass', 'Min 6 characters.'); ok = false; } else err('err-au-pass', '');
      if (!ok) return;
      var btn = f.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      DR.api.createUser(nm, em, pw, role).then(function () {
        DR.toast('Account created for ' + nm + '.', 'success');
        DR.adminKpi(); DR.renderAdminPane('users');
      }).catch(function (e2) {
        DR.toast((e2 && e2.message) || 'Could not create the account.', 'error');
        if (btn) btn.disabled = false;
      });
    });
  }
  DR.adminKpi = function () {
    var w = document.getElementById('admin-kpi'); if (!w) return;
    var c = DR.adminCounts();
    var cards = [
      { n: c.projects, l: 'Projects', i: 'folder', a: 'blue' },
      { n: c.enquiries, l: 'Enquiries', i: 'mail', a: 'gold' },
      { n: c.team, l: 'Team members', i: 'users', a: 'violet' },
      { n: c.users, l: 'Accounts', i: 'shield', a: 'green' }
    ];
    w.innerHTML = cards.map(function (k) {
      return '<div class="card card-pad kpi kpi-' + k.a + '">' +
        '<span class="kpi-ico">' + DR.icon(k.i, 20) + '</span>' +
        '<div class="kpi-num">' + k.n + '</div><div class="kpi-label">' + k.l + '</div></div>';
    }).join('');
  };
  function guard() {
    var locked = document.getElementById('admin-locked');
    var body = document.getElementById('admin-body');
    var badge = document.getElementById('admin-badge');
    if (!locked || !body) return;
    if (!DR.isDemoAdmin()) {
      body.hidden = true; locked.hidden = false;
      var me = DR.currentDemoUser();
      locked.innerHTML = '<div class="card card-pad empty-state admin-locked">' +
        '<span class="icon-chip icon-chip-lg admin-lock-ico">' + DR.icon('lock', 26) + '</span>' +
        '<h2>Restricted area</h2>' +
        '<p>' + (me ? 'Your account does not have administrator access. This control centre is private to administrators only.' : 'This control centre is private. Please sign in with an administrator account to continue.') + '</p>' +
        '<div class="form-actions" style="justify-content:center;">' +
        (me ? '' : '<a class="btn btn-primary" href="login.html">Log In</a>') +
        '<a class="btn btn-ghost" href="index.html">Back to Dashboard</a></div></div>';
      DR.renderIcons(locked);
      if (badge) badge.innerHTML = 'Locked';
      return;
    }
    locked.hidden = true; body.hidden = false;
    DR.adminKpi(); renderTabs(); DR.renderAdminPane(tab);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', guard);
  else guard();
})();

