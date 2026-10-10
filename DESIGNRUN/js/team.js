/* ==========================================================================
   DESIGNRUN — team.js
   Team member cards with locally stored add / edit / delete.
   All seeded profiles are PLACEHOLDERS — no real identities.
   ========================================================================== */
(function () {
  'use strict';

  var DR = window.DR;
  var grid;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function render() {
    var list = DR.getTeam();
    if (!list.length) {
      grid.innerHTML = '<div class="card empty-state" style="grid-column:1/-1;">' +
        '<span class="icon-chip icon-chip-lg">' + DR.icon('users', 24) + '</span>' +
        '<h3>No team members yet</h3>' +
        '<p>Add a team member — the profile will be stored in this browser only.</p>' +
        '<button type="button" class="btn btn-primary" data-action="add-empty">Add Team Member</button></div>';
      var addBtn = grid.querySelector('[data-action="add-empty"]');
      if (addBtn) { addBtn.addEventListener('click', function () { openForm(null); }); }
      return;
    }

    grid.innerHTML = list.map(function (m) {
      return '<article class="card card-hover team-card">' +
        '<img class="avatar" src="' + DR.esc(m.avatar || DR.initialsAvatar(m.name, m.hue || 210)) + '" alt="Avatar for ' + DR.esc(m.name) + '">' +
        '<h3>' + DR.esc(m.name) + '</h3>' +
        '<p class="team-role">' + DR.esc(m.title) + '</p>' +
        (m.placeholder ? '<span class="badge badge-demo" style="align-self:center;">Placeholder</span>' : '') +
        '<p class="team-bio">' + DR.esc(m.bio || '') + '</p>' +
        '<div class="tag-row">' + (m.expertise || []).map(function (x) {
          return '<span class="chip chip-neutral">' + DR.esc(x) + '</span>';
        }).join('') + '</div>' +
        '<div class="service-actions" style="justify-content:center;">' +
          (m.email ? '<a class="btn btn-outline btn-sm" href="mailto:' + DR.esc(m.email) + '">' + DR.icon('mail', 14) + ' Contact</a>' : '') +
          '<button type="button" class="btn btn-outline btn-sm" data-action="edit" data-id="' + DR.esc(m.id) + '">' + DR.icon('pencil', 14) + ' Edit</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-action="delete" data-id="' + DR.esc(m.id) + '">' + DR.icon('trash', 14) + ' Remove</button>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function confirmDelete(m) {
    DR.confirmAction({
      title: 'Remove team member?',
      message: '“' + m.name + '” will be removed from this browser’s local storage.',
      confirmText: 'Remove',
      danger: true
    }, function () {
      DR.saveTeam(DR.getTeam().filter(function (x) { return x.id !== m.id; }));
      render();
      DR.toast('Team member removed.');
    });
  }

  function setError(modal, field, message) {
    var group = modal.querySelector('#grp-' + field);
    var err = modal.querySelector('#err-' + field);
    if (group) { group.classList.toggle('has-error', !!message); }
    if (err) { err.textContent = message || ''; }
  }

  function openForm(member) {
    var isNew = !member;
    var m = member || { name: '', title: '', bio: '', expertise: [], email: '', hue: 210 };

    var modal = DR.openModal({
      title: isNew ? 'Add team member' : 'Edit team member',
      size: 'lg',
      body:
        '<form id="member-form" novalidate>' +
          '<div class="form-grid">' +
            '<div class="form-group" id="grp-m-name"><label for="m-name">Full name <span class="req">*</span></label>' +
              '<input id="m-name" type="text" maxlength="70" value="' + DR.esc(m.name) + '"><span class="field-error" id="err-m-name"></span></div>' +
            '<div class="form-group" id="grp-m-title"><label for="m-title">Job title <span class="req">*</span></label>' +
              '<input id="m-title" type="text" maxlength="80" value="' + DR.esc(m.title) + '"><span class="field-error" id="err-m-title"></span></div>' +
            '<div class="form-group" id="grp-m-email"><label for="m-email">Contact email (optional)</label>' +
              '<input id="m-email" type="email" maxlength="120" value="' + DR.esc(m.email || '') + '"><span class="field-error" id="err-m-email"></span></div>' +
            '<div class="form-group" id="grp-m-expertise"><label for="m-expertise">Expertise (comma separated)</label>' +
              '<input id="m-expertise" type="text" maxlength="200" value="' + DR.esc((m.expertise || []).join(', ')) + '" placeholder="RCC Design, Detailing, BIM"></div>' +
            '<div class="form-group form-span-2" id="grp-m-bio"><label for="m-bio">Short biography <span class="req">*</span></label>' +
              '<textarea id="m-bio" maxlength="400">' + DR.esc(m.bio || '') + '</textarea>' +
              '<span class="field-error" id="err-m-bio"></span></div>' +
          '</div>' +
          '<div class="notice-box notice-info">' + DR.icon('info', 16) +
            '<p>Only add personal details with the person’s permission. Do not record credentials you cannot verify.</p></div>' +
        '</form>',
      footer:
        '<button type="button" class="btn btn-ghost" data-act="cancel">Cancel</button>' +
        '<button type="button" class="btn btn-primary" data-act="save">' + (isNew ? 'Add member' : 'Save changes') + '</button>'
    });
    if (!modal) { return; }

    modal.querySelector('[data-act="cancel"]').addEventListener('click', function () { DR.closeModal(modal); });
    modal.querySelector('[data-act="save"]').addEventListener('click', function () {
      var name = modal.querySelector('#m-name').value.trim();
      var title = modal.querySelector('#m-title').value.trim();
      var email = modal.querySelector('#m-email').value.trim();
      var expertise = modal.querySelector('#m-expertise').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 6);
      var bio = modal.querySelector('#m-bio').value.trim();
      var ok = true;

      ['m-name', 'm-title', 'm-email', 'm-bio'].forEach(function (f) { setError(modal, f, ''); });
      if (name.length < 2) { setError(modal, 'm-name', 'Please enter a name.'); ok = false; }
      if (title.length < 2) { setError(modal, 'm-title', 'Please enter a job title.'); ok = false; }
      if (email && !EMAIL_RE.test(email)) { setError(modal, 'm-email', 'Please enter a valid email address.'); ok = false; }
      if (bio.length < 10) { setError(modal, 'm-bio', 'Please write at least 10 characters.'); ok = false; }
      if (!ok) { DR.toast('Please fix the highlighted fields.', 'error'); return; }

      var team = DR.getTeam();
      if (isNew) {
        team.unshift({
          id: DR.uid(), name: name, title: title, bio: bio, expertise: expertise,
          email: email, hue: Math.floor(Math.random() * 360), placeholder: false
        });
      } else {
        team.forEach(function (x) {
          if (x.id === member.id) {
            x.name = name; x.title = title; x.bio = bio; x.expertise = expertise; x.email = email; x.placeholder = false;
          }
        });
      }
      DR.saveTeam(team);
      DR.closeModal(modal);
      render();
      DR.toast(isNew ? 'Team member added (saved in this browser).' : 'Team member updated.');
    });
  }

  function init() {
    grid = document.getElementById('team-grid');
    if (!grid) { return; }
    document.getElementById('add-member-btn').addEventListener('click', function () { openForm(null); });
    grid.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-action][data-id]') : null;
      if (!btn) { return; }
      var m = DR.getTeam().filter(function (x) { return x.id === btn.getAttribute('data-id'); })[0];
      if (!m) { return; }
      if (btn.getAttribute('data-action') === 'edit') { openForm(m); }
      if (btn.getAttribute('data-action') === 'delete') { confirmDelete(m); }
    });
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


