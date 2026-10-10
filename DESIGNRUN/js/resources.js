/* ==========================================================================
   DESIGNRUN — resources.js — articles, real files, reference links
   ========================================================================== */
(function () {
  'use strict';

  var DR = window.DR;
  var resources = DR.getResources();
  var grid, countEl, searchEl, kindEl, catEl;

  function knownFiles() {
    var docs = DR.getDocuments();
    return [docs.brochure && docs.brochure.path, docs.reportTemplate && docs.reportTemplate.path].filter(Boolean);
  }

  function kindClass(kind) {
    return kind === 'Article' ? 'kind-article' : (kind === 'Document' ? 'kind-document' : 'kind-link');
  }
  function kindIcon(kind) {
    return kind === 'Article' ? 'book-open' : (kind === 'Document' ? 'file-text' : 'link');
  }

  function getFiltered() {
    var q = (searchEl.value || '').trim().toLowerCase();
    var kind = kindEl.value;
    var cat = catEl.value;
    return resources.filter(function (r) {
      var hay = (r.title + ' ' + r.summary + ' ' + r.category).toLowerCase();
      return (!q || hay.indexOf(q) !== -1) && (!kind || r.kind === kind) && (!cat || r.category === cat);
    });
  }

  function render() {
    var list = getFiltered();
    countEl.textContent = 'Showing ' + list.length + ' resource' + (list.length === 1 ? '' : 's') + '.';

    if (!list.length) {
      grid.innerHTML = '<div class="card empty-state" style="grid-column:1/-1;">' +
        '<span class="icon-chip icon-chip-lg">' + DR.icon('book', 24) + '</span>' +
        '<h3>No resources found</h3>' +
        '<p>Nothing matches the current search and filters. Clear the filters to see the full library.</p>' +
        '<button type="button" class="btn btn-primary" id="res-empty-clear">Clear filters</button></div>';
      var clearBtn = document.getElementById('res-empty-clear');
      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          searchEl.value = ''; kindEl.value = ''; catEl.value = '';
          render();
        });
      }
      return;
    }

    grid.innerHTML = list.map(function (r) {
      var action = '';
      if (r.kind === 'Document') {
        var ok = r.available && knownFiles().indexOf(r.file) !== -1;
        action = ok
          ? '<a class="btn btn-primary btn-sm" href="' + DR.esc(r.file) + '" target="_blank" rel="noopener">' + DR.icon('download', 14) + ' Download</a>'
          : '<button type="button" class="btn btn-ghost btn-sm" data-action="nofile">' + DR.icon('download', 14) + ' File unavailable</button>';
      } else if (r.kind === 'Link') {
        action = '<a class="btn btn-outline btn-sm" href="' + DR.esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + DR.icon('external', 14) + ' Visit site</a>';
      } else {
        action = '<button type="button" class="btn btn-outline btn-sm" data-action="read" data-id="' + DR.esc(r.id) + '">' + DR.icon('book-open', 14) + ' Read article</button>';
      }

      return '<article class="card card-hover resource-card">' +
        '<span class="resource-kind ' + kindClass(r.kind) + '">' + DR.icon(kindIcon(r.kind), 13) + DR.esc(r.kind) + '</span>' +
        '<h3>' + DR.esc(r.title) + '</h3>' +
        '<p>' + DR.esc(r.summary) + '</p>' +
        '<span class="chip chip-neutral" style="align-self:flex-start;">' + DR.esc(r.category) + '</span>' +
        '<div class="resource-foot">' + action + '</div>' +
      '</article>';
    }).join('');
  }

  function openArticle(r) {
    var paragraphs = String(r.body || '').split('\n\n').map(function (p) {
      return '<p class="modal-text">' + DR.esc(p).replace(/\n/g, '<br>') + '</p>';
    }).join('');
    var modal = DR.openModal({
      title: r.title,
      size: 'lg',
      body:
        '<span class="resource-kind ' + kindClass(r.kind) + '" style="margin-bottom:10px;">' + DR.icon(kindIcon(r.kind), 13) + DR.esc(r.kind) + ' · ' + DR.esc(r.category) + '</span>' +
        paragraphs +
        '<div class="notice-box notice-info" style="margin-top:16px;">' + DR.icon('info', 16) +
        '<p>General educational content from the DESIGNRUN resource library — not project-specific engineering advice.</p></div>',
      footer: '<button type="button" class="btn btn-primary btn-sm" data-act="close">Close</button>'
    });
    if (modal) { modal.querySelector('[data-act="close"]').addEventListener('click', function () { DR.closeModal(modal); }); }
  }

  function init() {
    grid = document.getElementById('resource-grid');
    countEl = document.getElementById('res-count');
    searchEl = document.getElementById('res-search');
    kindEl = document.getElementById('res-kind');
    catEl = document.getElementById('res-category');
    if (!grid) { return; }

    var cats = [];
    resources.forEach(function (r) { if (cats.indexOf(r.category) === -1) { cats.push(r.category); } });
    cats.sort().forEach(function (c) {
      var o = document.createElement('option'); o.value = c; o.textContent = c; catEl.appendChild(o);
    });

    searchEl.addEventListener('input', render);
    kindEl.addEventListener('change', render);
    catEl.addEventListener('change', render);
    document.getElementById('res-clear').addEventListener('click', function () {
      searchEl.value = ''; kindEl.value = ''; catEl.value = '';
      render();
    });

    grid.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-action]') : null;
      if (!btn) { return; }
      var action = btn.getAttribute('data-action');
      if (action === 'nofile') {
        DR.toast('No downloadable file is available for this entry.', 'info');
        return;
      }
      if (action === 'read') {
        var r = resources.filter(function (x) { return x.id === btn.getAttribute('data-id'); })[0];
        if (r) { openArticle(r); }
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

