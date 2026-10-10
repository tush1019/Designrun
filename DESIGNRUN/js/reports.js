/* ==========================================================================
   DESIGNRUN — reports.js
   Report register: search, filters, detail modal, print and PDF export.
   Register records document deliverables — formal engineering approvals
   require qualified professional sign-off.
   ========================================================================== */
(function () {
  'use strict';

  var DR = window.DR;
  var reports = DR.getReports();
  var body, countEl, emptyEl, searchEl, projectEl, typeEl;

  /* A file is downloadable only when it really exists in the manifest. */
  function knownFiles() {
    var docs = DR.getDocuments();
    return [docs.brochure && docs.brochure.path, docs.reportTemplate && docs.reportTemplate.path].filter(Boolean);
  }

  function canDownload(r) {
    return !!r.file && knownFiles().indexOf(r.file) !== -1;
  }

  function getFiltered() {
    var q = (searchEl.value || '').trim().toLowerCase();
    var proj = projectEl.value;
    var type = typeEl.value;
    return reports.filter(function (r) {
      var matchesQ = !q || (r.title + ' ' + r.project + ' ' + (r.notes || '')).toLowerCase().indexOf(q) !== -1;
      return matchesQ && (!proj || r.project === proj) && (!type || r.type === type);
    });
  }

  function render() {
    var list = getFiltered();
    countEl.textContent = 'Showing ' + list.length + ' of ' + reports.length + ' reports.';

    if (!list.length) {
      body.innerHTML = '';
      emptyEl.innerHTML = '<div class="card empty-state">' +
        '<span class="icon-chip icon-chip-lg">' + DR.icon('file-text', 24) + '</span>' +
        '<h3>No reports match your filters</h3>' +
        '<p>Try a different search term, or clear the project and type filters.</p></div>';
      return;
    }
    emptyEl.innerHTML = '';

    body.innerHTML = list.map(function (r) {
      return '<tr>' +
        '<td><strong>' + DR.esc(r.title) + '</strong><br><small class="muted">' + DR.esc(r.author || 'DESIGNRUN') + '</small></td>' +
        '<td>' + DR.esc(r.project) + '</td>' +
        '<td>' + DR.esc(r.type) + '</td>' +
        '<td>' + DR.fmtDate(r.date) + '</td>' +
        '<td><span class="badge badge-neutral">' + DR.esc(r.status) + '</span></td>' +
        '<td><div class="table-actions no-print">' +
          '<button type="button" class="btn btn-outline btn-sm" data-action="view" data-id="' + DR.esc(r.id) + '">' + DR.icon('eye', 14) + ' View</button>' +
          (canDownload(r)
            ? '<a class="btn btn-outline btn-sm" href="' + DR.esc(r.file) + '" target="_blank" rel="noopener">' + DR.icon('download', 14) + ' Download</a>'
            : '<button type="button" class="btn btn-ghost btn-sm" data-action="nofile" title="No file is attached to this register entry">' + DR.icon('download', 14) + ' No file</button>') +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function openDetail(id) {
    var r = reports.filter(function (x) { return x.id === id; })[0];
    if (!r) { return; }
    var dl = canDownload(r);
    var modal = DR.openModal({
      title: r.title,
      size: 'lg',
      body:
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">' +
          '<span class="badge badge-neutral">Register entry</span>' +
          '<span class="chip chip-neutral">' + DR.esc(r.type) + '</span>' +
          '<span class="chip chip-neutral">' + DR.fmtDate(r.date) + '</span>' +
        '</div>' +
        '<dl class="detail-grid">' +
          '<dt>Project</dt><dd>' + DR.esc(r.project) + '</dd>' +
          '<dt>Prepared by</dt><dd>' + DR.esc(r.author || 'DESIGNRUN') + '</dd>' +
          '<dt>Attached file</dt><dd>' + (dl ? DR.esc(r.file) : 'None — register entry only') + '</dd>' +
        '</dl>' +
        '<p class="modal-text">' + DR.esc(r.notes || '') + '</p>' +
        '<div class="notice-box notice-danger" style="margin-top:14px;">' + DR.icon('alert', 16) +
        '<p>Register records document project deliverables. Formal engineering approvals, certificates and safety sign-offs are issued only by qualified professionals using validated engineering software and applicable codes.</p></div>',
      footer:
        (dl ? '<a class="btn btn-outline btn-sm" href="' + DR.esc(r.file) + '" target="_blank" rel="noopener">' + DR.icon('download', 14) + ' Open / Download file</a>' : '') +
        '<button type="button" class="btn btn-primary btn-sm" data-act="close">Close</button>'
    });
    if (modal) { modal.querySelector('[data-act="close"]').addEventListener('click', function () { DR.closeModal(modal); }); }
  }

  /* ---------------- PDF export (lazy-loads jsPDF from a CDN, falls back to print) ---------------- */
  var jsPdfPromise = null;
  function loadJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) { return Promise.resolve(); }
    if (!jsPdfPromise) {
      jsPdfPromise = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = resolve;
        s.onerror = function () { reject(new Error('Could not load jsPDF')); };
        document.head.appendChild(s);
      });
    }
    return jsPdfPromise;
  }

  function exportPdf() {
    var list = getFiltered();
    loadJsPdf().then(function () {
      var jsPDF = window.jspdf.jsPDF;
      var doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('DESIGNRUN — Reports Export', 14, 18);
      doc.setFontSize(10);
      doc.text('Report register export. Approvals require qualified professional sign-off.', 14, 26);
      doc.text('Generated: ' + new Date().toLocaleString(), 14, 32);
      var y = 42;
      list.forEach(function (r) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.text('- ' + r.title, 14, y);
        doc.setFontSize(9);
        doc.text('  Project: ' + r.project + ' | Type: ' + r.type + ' | Date: ' + r.date, 14, y + 5);
        y += 13;
      });
      doc.save('designrun-reports.pdf');
      DR.toast('PDF exported.');
    }).catch(function () {
      DR.toast('PDF library unavailable offline — opening the print dialog instead.', 'info');
      window.print();
    });
  }

  /* ---------------- Init ---------------- */
  function init() {
    body = document.getElementById('reports-body');
    countEl = document.getElementById('rep-count');
    emptyEl = document.getElementById('reports-empty');
    searchEl = document.getElementById('rep-search');
    projectEl = document.getElementById('rep-project');
    typeEl = document.getElementById('rep-type');
    if (!body) { return; }

    var projects = [], types = [];
    reports.forEach(function (r) {
      if (projects.indexOf(r.project) === -1) { projects.push(r.project); }
      if (types.indexOf(r.type) === -1) { types.push(r.type); }
    });
    projects.sort().forEach(function (p) {
      var o = document.createElement('option'); o.value = p; o.textContent = p; projectEl.appendChild(o);
    });
    types.sort().forEach(function (t) {
      var o = document.createElement('option'); o.value = t; o.textContent = t; typeEl.appendChild(o);
    });

    searchEl.addEventListener('input', render);
    projectEl.addEventListener('change', render);
    typeEl.addEventListener('change', render);
    document.getElementById('rep-clear').addEventListener('click', function () {
      searchEl.value = ''; projectEl.value = ''; typeEl.value = '';
      render();
    });
    document.getElementById('print-btn').addEventListener('click', function () { window.print(); });
    document.getElementById('pdf-btn').addEventListener('click', exportPdf);

    body.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-action]') : null;
      if (!btn) { return; }
      var action = btn.getAttribute('data-action');
      if (action === 'view') { openDetail(btn.getAttribute('data-id')); }
      if (action === 'nofile') {
        DR.toast('No file is attached to this register entry — nothing to download.', 'info');
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

