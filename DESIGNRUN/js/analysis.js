/* ==========================================================================
   DESIGNRUN — analysis.js
   Project intake + engineering requirements summary.
   This is a REQUIREMENTS MANAGEMENT tool — it performs no analysis.
   ========================================================================== */
(function () {
  'use strict';

  var DR = window.DR;

  function setError(field, message) {
    var group = document.getElementById('grp-' + field);
    var err = document.getElementById('err-' + field);
    if (group) { group.classList.toggle('has-error', !!message); }
    if (err) { err.textContent = message || ''; }
  }

  /* Highlight selected requirement chips */
  function wireCheckboxes() {
    var grid = document.getElementById('req-grid');
    if (!grid) { return; }
    grid.addEventListener('change', function (e) {
      var label = e.target.closest ? e.target.closest('.check-item') : null;
      if (label) { label.classList.toggle('checked', e.target.checked); }
    });
  }

  /* Recent requests list (this browser only) */
  function renderSaved() {
    var list = document.getElementById('saved-requests');
    if (!list) { return; }
    var items = DR.store.get(DR.KEYS.analysisRequests, []).slice(0, 6);
    if (!items.length) {
      list.innerHTML = '<li><span>No requirements submitted yet.</span></li>';
      return;
    }
    list.innerHTML = items.map(function (r) {
      return '<li>' + DR.icon('check-circle', 16) +
        '<span><strong>' + DR.esc(r.name) + '</strong><br>' +
        '<small>' + DR.esc(r.type) + ' · ' + DR.esc(String(r.floors)) + ' floor(s) · ' + DR.fmtDate(r.createdAt) + '</small></span></li>';
    }).join('');
  }

  /* Project requirement summary card */
  function renderSummary(r) {
    var area = document.getElementById('summary-area');
    if (!area) { return; }
    area.innerHTML =
      '<div class="card card-pad" style="margin-top:22px;border-color:#C9E0FB;background:#FBFDFF;">' +
        '<div class="section-head" style="margin-top:0;">' +
          '<div><h2>Project Requirement Summary</h2><p>Generated ' + DR.fmtDate(r.createdAt) + ' · saved in this browser only</p></div>' +
          '<button type="button" class="btn btn-outline btn-sm no-print" id="print-summary">' + DR.icon('printer', 15) + ' Print</button>' +
        '</div>' +
        '<dl class="detail-grid">' +
          '<dt>Project name</dt><dd>' + DR.esc(r.name) + '</dd>' +
          '<dt>Structure type</dt><dd>' + DR.esc(r.type) + '</dd>' +
          '<dt>Number of floors</dt><dd>' + DR.esc(String(r.floors)) + '</dd>' +
          '<dt>Location</dt><dd>' + DR.esc(r.location) + '</dd>' +
          '<dt>Dimensions</dt><dd>' + DR.esc(r.dimensions || 'Not specified') + '</dd>' +
          '<dt>Material</dt><dd>' + DR.esc(r.material) + '</dd>' +
          '<dt>Requirements</dt><dd>' + r.requirements.map(function (x) { return '<span class="chip" style="margin:2px 4px 2px 0;">' + DR.esc(x) + '</span>'; }).join('') + '</dd>' +
          (r.notes ? '<dt>Notes</dt><dd>' + DR.esc(r.notes) + '</dd>' : '') +
        '</dl>' +
        '<div class="notice-box notice-warn">' + DR.icon('alert', 16) +
          '<p><strong>This is a requirements summary, not analysis results.</strong> No calculations, load values, safety factors or approvals are implied. Actual analysis requires validated software, applicable codes and qualified professional review.</p>' +
        '</div>' +
      '</div>';

    var printBtn = document.getElementById('print-summary');
    if (printBtn) { printBtn.addEventListener('click', function () { window.print(); }); }
  }

  /* ---------------- Form wiring & validation ---------------- */
  function wireForm() {
    var form = document.getElementById('analysis-form');
    if (!form) { return; }

    document.getElementById('analysis-reset').addEventListener('click', function () {
      setTimeout(function () {
        ['a-name', 'a-type', 'a-floors', 'a-location', 'a-dims', 'a-material', 'a-notes', 'a-req'].forEach(function (f) { setError(f, ''); });
        Array.prototype.forEach.call(document.querySelectorAll('#req-grid .check-item'), function (l) { l.classList.remove('checked'); });
      }, 0);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('a-name').value.trim();
      var type = document.getElementById('a-type').value;
      var floorsRaw = document.getElementById('a-floors').value;
      var floors = parseInt(floorsRaw, 10);
      var location = document.getElementById('a-location').value.trim();
      var dimensions = document.getElementById('a-dims').value.trim();
      var material = document.getElementById('a-material').value;
      var notes = document.getElementById('a-notes').value.trim();
      var requirements = Array.prototype.slice.call(document.querySelectorAll('#req-grid input:checked')).map(function (i) { return i.value; });
      var ok = true;

      ['a-name', 'a-type', 'a-floors', 'a-location', 'a-dims', 'a-material', 'a-notes', 'a-req'].forEach(function (f) { setError(f, ''); });

      if (name.length < 3) { setError('a-name', 'Please enter a project name of at least 3 characters.'); ok = false; }
      if (!type) { setError('a-type', 'Please select a structure type.'); ok = false; }
      if (floorsRaw === '' || isNaN(floors) || floors < 0 || floors > 200) { setError('a-floors', 'Enter a floor count between 0 and 200.'); ok = false; }
      if (location.length < 2) { setError('a-location', 'Please enter the project location.'); ok = false; }
      if (!material) { setError('a-material', 'Please select a material system.'); ok = false; }
      if (!requirements.length) { setError('a-req', 'Select at least one analysis or design requirement.'); ok = false; }
      if (!ok) { DR.toast('Please fix the highlighted fields.', 'error'); return; }

      var record = {
        id: DR.uid(), name: name, type: type, floors: floors, location: location,
        dimensions: dimensions, material: material, requirements: requirements,
        notes: notes, createdAt: new Date().toISOString()
      };
      DR.pushLocal(DR.KEYS.analysisRequests, record);
      renderSummary(record);
      renderSaved();
      DR.toast('Requirements summary created and saved to the DESIGNRUN server.');
    });
  }

  function init() {
    wireCheckboxes();
    wireForm();
    renderSaved();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


