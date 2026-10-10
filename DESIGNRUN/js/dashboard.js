/* ==========================================================================
   DESIGNRUN — dashboard.js
   Statistics cards, recent projects, service cards, quick-link actions.
   ========================================================================== */
(function () {
  'use strict';

  var DR = window.DR;

  function statusBadge(status) {
    var map = { 'Completed': 'badge-success', 'In Progress': 'badge-progress', 'Planning': 'badge-planning', 'On Hold': 'badge-hold' };
    return '<span class="badge ' + (map[status] || 'badge-hold') + '">' + DR.esc(status) + '</span>';
  }

  /* ---------- Statistics (configurable business values) ---------- */
  function renderStats() {
    var root = document.getElementById('stats-grid');
    if (!root) { return; }
    var s = DR.getSettings().demoStats;
    var cards = [
      { icon: 'check-circle', value: s.completedProjects, label: 'Completed Projects' },
      { icon: 'chart', value: s.analysisServices, label: 'Design & Analysis Services' },
      { icon: 'users', value: s.happyClients, label: 'Happy Clients' },
      { icon: 'shield', value: s.qualityYears + (typeof s.qualityYears === 'number' ? '+' : ''), label: 'Commitment to Quality (years)' }
    ];
    root.innerHTML = cards.map(function (c) {
      return '<article class="card card-hover stat-card">' +
        '<span class="icon-chip icon-chip-lg">' + DR.icon(c.icon, 24) + '</span>' +
        '<div class="stat-body">' +
          '<div class="stat-value">' + DR.esc(String(c.value)) + '</div>' +
          '<div class="stat-label">' + DR.esc(c.label) + '</div>' +
          '<div class="stat-foot"><span class="badge badge-success">DESIGNRUN record</span></div>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  /* ---------- Recent projects ---------- */
  function renderRecentProjects() {
    var root = document.getElementById('recent-projects');
    if (!root) { return; }
    var list = DR.getProjects().slice(0, 4);
    if (!list.length) {
      root.innerHTML = '<div class="card empty-state" style="grid-column:1/-1;">' +
        '<span class="icon-chip icon-chip-lg">' + DR.icon('folder', 24) + '</span>' +
        '<h3>No projects yet</h3><p>Add your first project from the Projects page — it will be stored in this browser.</p>' +
        '<a class="btn btn-primary" href="projects.html">Go to Projects</a></div>';
      return;
    }
    root.innerHTML = list.map(function (p) {
      return '<article class="card card-hover project-card">' +
        '<div class="project-thumb">' +
          '<img src="' + DR.esc(p.image || 'assets/images/project-generic.svg') + '" data-fallback="' + DR.esc(p.fallback || 'generic') + '" alt="' + DR.esc(p.name) + ' illustration" loading="lazy">' +
          statusBadge(p.status) +
          (p.demo ? '<span class="badge badge-demo thumb-demo">Demo</span>' : '') +
        '</div>' +
        '<div class="project-body">' +
          '<span class="project-cat">' + DR.icon('blueprint', 14) + DR.esc(p.category) + '</span>' +
          '<h3 class="project-name">' + DR.esc(p.name) + '</h3>' +
          '<span class="project-meta">' + DR.icon('calendar', 14) + DR.fmtDate(p.date) + '</span>' +
          '<a class="btn btn-outline btn-sm btn-block" href="projects.html?q=' + encodeURIComponent(p.name) + '">View Details</a>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  /* ---------- Service cards ---------- */
  function renderServices() {
    var root = document.getElementById('services-grid');
    if (!root) { return; }
    root.innerHTML = DR.getServices().map(function (s) {
      return '<article class="card card-hover service-card">' +
        '<span class="icon-chip">' + DR.icon(s.icon, 22) + '</span>' +
        '<h3>' + DR.esc(s.title) + '</h3>' +
        '<p>' + DR.esc(s.description) + '</p>' +
        '<div class="service-actions">' +
          '<a class="btn btn-outline btn-sm" href="services.html#' + DR.esc(s.id) + '">Learn More</a>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  /* ---------- Quick links: brochure + file picker ---------- */
  function renderBrochureLink() {
    var item = document.getElementById('brochure-link-item');
    if (!item) { return; }
    var doc = DR.getDocuments().brochure;
    if (doc && doc.available) {
      item.innerHTML = '<a class="quick-link" href="' + DR.esc(doc.path) + '" target="_blank" rel="noopener">' +
        '<i data-icon="download" data-size="18"></i><span>Download Brochure<small>' + DR.esc(doc.label) + '</small></span></a>';
    } else {
      item.innerHTML = '<span class="quick-link" style="cursor:default;opacity:.75;">' +
        '<i data-icon="download" data-size="18"></i><span>Download Brochure<small>No brochure file is available yet.</small></span></span>';
    }
    DR.renderIcons(item);
  }

  function wireFilePicker() {
    var btn = document.getElementById('upload-files-btn');
    var input = document.getElementById('upload-files-input');
    var list = document.getElementById('selected-files');
    if (!btn || !input || !list) { return; }

    btn.addEventListener('click', function () { input.click(); });

    input.addEventListener('change', function () {
      var files = Array.prototype.slice.call(input.files || []);
      if (!files.length) { return; }
      list.innerHTML = files.slice(0, 6).map(function (f) {
        return '<li>' + DR.icon('file-text', 15) + '<span>' + DR.esc(f.name) + ' · ' + DR.fmtBytes(f.size) + '</span></li>';
      }).join('');
      if (files.length > 6) {
        list.innerHTML += '<li>' + DR.icon('info', 15) + '<span>…and ' + (files.length - 6) + ' more file(s)</span></li>';
      }
      DR.toast(files.length + ' file(s) selected locally (nothing was uploaded).', 'info');
    });
  }

  /* ---------- Premium count-up animation for stat values ---------- */
  function animateCounts() {
    var vals = document.querySelectorAll('#stats-grid .stat-value');
    if (!('IntersectionObserver' in window)) { return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) { return; }
        var el = en.target;
        io.unobserve(el);
        var raw = String(el.textContent || '').trim();
        var m = raw.match(/^(\d+)(.*)$/);
        if (!m) { return; }
        var target = parseInt(m[1], 10), suffix = m[2] || '';
        if (!target || target <= 0) { return; }
        var start = null, dur = 1100;
        function step(ts) {
          if (!start) { start = ts; }
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) { requestAnimationFrame(step); }
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(vals, function (v) { io.observe(v); });
  }

  /* ---------- Reveal-on-scroll for premium entrance ---------- */
  function wireReveal() {
    var els = document.querySelectorAll('.hero, .stats-grid .card, .project-card, .service-card, .quote-panel');
    if (!('IntersectionObserver' in window)) { return; }
    els.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  function init() {
    renderStats();
    renderRecentProjects();
    renderServices();
    renderBrochureLink();
    wireFilePicker();
    animateCounts();
    wireReveal();
    DR.renderIcons(document.getElementById('main-content'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
