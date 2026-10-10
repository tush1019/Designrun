/* ==========================================================================
   DESIGNRUN — projects.js
   Project gallery with search, filters, add / edit / delete (LocalStorage).
   ========================================================================== */
(function () {
  'use strict';

  var DR = window.DR;
  var grid, countEl, searchEl, catEl, statusEl, sortEl;

  function statusBadge(status) {
    var map = { 'Completed': 'badge-success', 'In Progress': 'badge-progress', 'Planning': 'badge-planning', 'On Hold': 'badge-hold' };
    return '<span class="badge ' + (map[status] || 'badge-hold') + '">' + DR.esc(status) + '</span>';
  }

  /* ---------------- Filtering & rendering ---------------- */
  function getFiltered() {
    var q = (searchEl.value || '').trim().toLowerCase();
    var cat = catEl.value;
    var st = statusEl.value;
    var sort = sortEl.value;

    var list = DR.getProjects().filter(function (p) {
      var matchesQ = !q || (p.name + ' ' + (p.location || '') + ' ' + p.category).toLowerCase().indexOf(q) !== -1;
      var matchesCat = !cat || p.category === cat;
      var matchesSt = !st || p.status === st;
      return matchesQ && matchesCat && matchesSt;
    });

    list.sort(function (a, b) {
      if (sort === 'name') { return String(a.name).localeCompare(String(b.name)); }
      var da = a.date || '', db = b.date || '';
      return sort === 'old' ? String(da).localeCompare(String(db)) : String(db).localeCompare(String(da));
    });
    return list;
  }

  function render() {
    var list = getFiltered();
    countEl.textContent = 'Showing ' + list.length + ' project' + (list.length === 1 ? '' : 's') + '.';

    if (!list.length) {
      grid.innerHTML = '<div class="card empty-state" style="grid-column:1/-1;">' +
        '<span class="icon-chip icon-chip-lg">' + DR.icon('search', 24) + '</span>' +
        '<h3>No projects found</h3>' +
        '<p>Try clearing the filters, or add a new project to this browser.</p>' +
        '<button type="button" class="btn btn-primary" data-action="add-empty">Add Project</button></div>';
      var addBtn = grid.querySelector('[data-action="add-empty"]');
      if (addBtn) { addBtn.addEventListener('click', function () { openForm(null); }); }
      return;
    }

    grid.innerHTML = list.map(function (p) {
      return '<article class="card card-hover project-card">' +
        '<div class="project-thumb">' +
          '<img src="' + DR.esc(p.image || 'assets/images/project-generic.svg') + '" data-fallback="' + DR.esc(p.fallback || 'generic') + '" alt="' + DR.esc(p.name) + '" loading="lazy">' +
          statusBadge(p.status) +
          (p.demo ? '<span class="badge badge-demo thumb-demo">Demo</span>' : '') +
        '</div>' +
        '<div class="project-body">' +
          '<span class="project-cat">' + DR.icon('blueprint', 14) + DR.esc(p.category) + '</span>' +
          '<h3 class="project-name">' + DR.esc(p.name) + '</h3>' +
          '<span class="project-meta">' + DR.icon('pin', 14) + DR.esc(p.location || 'Location not set') + '</span>' +
          '<span class="project-meta">' + DR.icon('calendar', 14) + DR.fmtDate(p.date) + '</span>' +
          '<div style="display:flex;gap:8px;margin-top:auto;padding-top:8px;">' +
            '<button type="button" class="btn btn-outline btn-sm" style="flex:1;" data-action="view" data-id="' + DR.esc(p.id) + '">' + DR.icon('eye', 15) + ' View Details</button>' +
            '<button type="button" class="icon-btn" data-action="edit" data-id="' + DR.esc(p.id) + '" aria-label="Edit ' + DR.esc(p.name) + '">' + DR.icon('pencil', 16) + '</button>' +
            '<button type="button" class="icon-btn" data-action="delete" data-id="' + DR.esc(p.id) + '" aria-label="Delete ' + DR.esc(p.name) + '">' + DR.icon('trash', 16) + '</button>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  /* ---------------- Detail modal ---------------- */
  function openDetail(id) {
    var p = DR.getProject(id);
    if (!p) { DR.toast('That project no longer exists.', 'error'); render(); return; }
    var modal = DR.openModal({
      title: p.name,
      size: 'lg',
      body:
        '<img class="modal-thumb" src="' + DR.esc(p.image || 'assets/images/project-generic.svg') + '" data-fallback="' + DR.esc(p.fallback || 'generic') + '" alt="' + DR.esc(p.name) + '">' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px;">' + statusBadge(p.status) +
        (p.demo ? '<span class="badge badge-demo">Demo entry</span>' : '<span class="badge badge-progress">Saved in this browser</span>') + '</div>' +
        '<dl class="detail-grid">' +
          '<dt>Category</dt><dd>' + DR.esc(p.category) + '</dd>' +
          '<dt>Location</dt><dd>' + DR.esc(p.location || '—') + '</dd>' +
          '<dt>Project date</dt><dd>' + DR.fmtDate(p.date) + '</dd>' +
        '</dl>' +
        '<p class="modal-text">' + DR.esc(p.description || 'No description provided.') + '</p>',
      footer:
        '<button type="button" class="btn btn-danger btn-sm" data-action="del">' + DR.icon('trash', 15) + ' Delete</button>' +
        '<button type="button" class="btn btn-outline btn-sm" data-action="edit">' + DR.icon('pencil', 15) + ' Edit</button>' +
        '<button type="button" class="btn btn-primary btn-sm" data-action="close">Close</button>'
    });
    if (!modal) { return; }
    modal.querySelector('[data-action="close"]').addEventListener('click', function () { DR.closeModal(modal); });
    modal.querySelector('[data-action="edit"]').addEventListener('click', function () { DR.closeModal(modal); openForm(p); });
    modal.querySelector('[data-action="del"]').addEventListener('click', function () { DR.closeModal(modal); confirmDelete(p); });
  }

  function confirmDelete(p) {
    DR.confirmAction({
      title: 'Delete project?',
      message: '“' + p.name + '” will be permanently removed from this browser’s local storage.',
      confirmText: 'Delete project',
      danger: true
    }, function () {
      var list = DR.getProjects().filter(function (x) { return x.id !== p.id; });
      DR.saveProjects(list);
      render();
      DR.toast('Project deleted.');
    });
  }

  /* ---------------- Add / edit form ---------------- */
  function setError(modal, field, message) {
    var group = modal.querySelector('#grp-' + field);
    var err = modal.querySelector('#err-' + field);
    if (group) { group.classList.toggle('has-error', !!message); }
    if (err) { err.textContent = message || ''; }
  }

  function openForm(project) {
    var isNew = !project;
    var p = project || { name: '', category: '', status: 'Planning', date: '', location: '', description: '', image: '', fallback: 'generic' };

    var modal = DR.openModal({
      title: isNew ? 'Add project' : 'Edit project',
      size: 'lg',
      body:
        '<form id="project-form" novalidate>' +
          '<div class="form-grid">' +
            '<div class="form-group form-span-2" id="grp-name"><label for="p-name">Project title <span class="req">*</span></label>' +
              '<input id="p-name" type="text" maxlength="90" value="' + DR.esc(p.name) + '" placeholder="e.g. G+5 Residential Building">' +
              '<span class="field-error" id="err-name"></span></div>' +
            '<div class="form-group" id="grp-category"><label for="p-category">Category <span class="req">*</span></label>' +
              '<select id="p-category"><option value="">Select a category</option>' + DR.categoryOptions(p.category) + '</select>' +
              '<span class="field-error" id="err-category"></span></div>' +
            '<div class="form-group" id="grp-status"><label for="p-status">Status <span class="req">*</span></label>' +
              '<select id="p-status">' + DR.statusOptions(p.status) + '</select>' +
              '<span class="field-error" id="err-status"></span></div>' +
            '<div class="form-group" id="grp-date"><label for="p-date">Project date</label>' +
              '<input id="p-date" type="date" value="' + DR.esc(p.date || '') + '"><span class="field-error" id="err-date"></span></div>' +
            '<div class="form-group" id="grp-location"><label for="p-location">Location</label>' +
              '<input id="p-location" type="text" maxlength="90" value="' + DR.esc(p.location || '') + '" placeholder="City, State"><span class="field-error" id="err-location"></span></div>' +
            '<div class="form-group form-span-2" id="grp-image"><label for="p-image">Image URL (optional)</label>' +
              '<input id="p-image" type="url" maxlength="400" value="' + DR.esc(p.image || '') + '" placeholder="https://… (a local fallback image is used if the link fails)">' +
              '<span class="field-hint">Leave empty to use the built-in blueprint illustration.</span>' +
              '<span class="field-error" id="err-image"></span></div>' +
            '<div class="form-group form-span-2" id="grp-description"><label for="p-description">Description <span class="req">*</span></label>' +
              '<textarea id="p-description" maxlength="600" placeholder="Short scope summary…">' + DR.esc(p.description || '') + '</textarea>' +
              '<span class="field-error" id="err-description"></span></div>' +
          '</div>' +
        '</form>',
      footer:
        '<button type="button" class="btn btn-ghost" data-act="cancel">Cancel</button>' +
        '<button type="button" class="btn btn-primary" data-act="save">' + (isNew ? 'Add project' : 'Save changes') + '</button>'
    });
    if (!modal) { return; }

    modal.querySelector('[data-act="cancel"]').addEventListener('click', function () { DR.closeModal(modal); });
    modal.querySelector('[data-act="save"]').addEventListener('click', function () { saveForm(modal, project, isNew); });
  }

  function saveForm(modal, project, isNew) {
    var name = modal.querySelector('#p-name').value.trim();
    var category = modal.querySelector('#p-category').value;
    var status = modal.querySelector('#p-status').value;
    var date = modal.querySelector('#p-date').value;
    var location = modal.querySelector('#p-location').value.trim();
    var image = modal.querySelector('#p-image').value.trim();
    var description = modal.querySelector('#p-description').value.trim();
    var ok = true;

    ['name', 'category', 'status', 'date', 'location', 'image', 'description'].forEach(function (f) { setError(modal, f, ''); });

    if (name.length < 3) { setError(modal, 'name', 'Please enter a project title of at least 3 characters.'); ok = false; }
    if (!category) { setError(modal, 'category', 'Please choose a category.'); ok = false; }
    if (!status) { setError(modal, 'status', 'Please choose a status.'); ok = false; }
    if (location.length > 90) { setError(modal, 'location', 'Location is too long.'); ok = false; }
    if (image && !/^https?:\/\//i.test(image) && image.indexOf('assets/') !== 0 && image.indexOf('data:') !== 0) {
      setError(modal, 'image', 'Use a full http(s) URL, a data URI, or an assets/… path.');
      ok = false;
    }
    if (description.length < 10) { setError(modal, 'description', 'Please write at least 10 characters of description.'); ok = false; }
    if (!ok) { DR.toast('Please fix the highlighted fields.', 'error'); return; }

    var list = DR.getProjects();
    if (isNew) {
      list.unshift({
        id: DR.uid(), name: name, category: category, status: status, date: date,
        location: location, description: description, image: image, fallback: 'generic', demo: false
      });
    } else {
      list.forEach(function (x) {
        if (x.id === project.id) {
          x.name = name; x.category = category; x.status = status; x.date = date;
          x.location = location; x.description = description;
          if (image) { x.image = image; x.fallback = 'generic'; }
          x.demo = false;
        }
      });
    }
    DR.saveProjects(list);
    DR.closeModal(modal);
    render();
    DR.toast(isNew ? 'Project added to this browser.' : 'Project updated.');
  }

  /* ---------------- Init ---------------- */
  function init() {
    grid = document.getElementById('projects-grid');
    countEl = document.getElementById('result-count');
    searchEl = document.getElementById('filter-search');
    catEl = document.getElementById('filter-category');
    statusEl = document.getElementById('filter-status');
    sortEl = document.getElementById('sort-date');
    if (!grid) { return; }

    catEl.innerHTML = '<option value="">All categories</option>' + DR.categoryOptions('');
    statusEl.innerHTML = '<option value="">All statuses</option>' + DR.statusOptions('');

    var initialQ = DR.queryParam('q');
    if (initialQ) { searchEl.value = initialQ; }

    searchEl.addEventListener('input', render);
    [catEl, statusEl, sortEl].forEach(function (el) { el.addEventListener('change', render); });

    document.getElementById('clear-filters').addEventListener('click', function () {
      searchEl.value = ''; catEl.value = ''; statusEl.value = ''; sortEl.value = 'new';
      render();
    });
    document.getElementById('add-project-btn').addEventListener('click', function () { openForm(null); });

    grid.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-action][data-id]') : null;
      if (!btn) { return; }
      var id = btn.getAttribute('data-id');
      var action = btn.getAttribute('data-action');
      if (action === 'view') { openDetail(id); }
      if (action === 'edit') { openForm(DR.getProject(id)); }
      if (action === 'delete') {
        var target = DR.getProject(id);
        if (target) { confirmDelete(target); }
      }
    });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();



