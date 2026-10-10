/* ==========================================================================
   DESIGNRUN — services.js
   Service catalogue, detail modals and the consultation request form.
   ========================================================================== */
(function () {
  'use strict';

  var DR = window.DR;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ---------------- Service cards ---------------- */
  function renderServices() {
    var root = document.getElementById('services-grid');
    if (!root) { return; }
    var services = DR.getServices();

    root.innerHTML = services.map(function (s) {
      return '<article class="card card-hover service-card" id="' + DR.esc(s.id) + '">' +
        '<span class="icon-chip icon-chip-lg">' + DR.icon(s.icon, 24) + '</span>' +
        '<h3>' + DR.esc(s.title) + '</h3>' +
        '<p>' + DR.esc(s.description) + '</p>' +
        '<ul class="service-list">' + s.deliverables.map(function (d) {
          return '<li>' + DR.icon('check', 14) + '<span>' + DR.esc(d) + '</span></li>';
        }).join('') + '</ul>' +
        '<div class="tag-row">' + s.suitable.map(function (t) {
          return '<span class="chip chip-neutral">' + DR.esc(t) + '</span>';
        }).join('') + '</div>' +
        '<div class="service-actions">' +
          '<button type="button" class="btn btn-outline btn-sm" data-action="learn" data-id="' + DR.esc(s.id) + '">Learn More</button>' +
          '<button type="button" class="btn btn-primary btn-sm" data-action="consult" data-id="' + DR.esc(s.id) + '">Request Consultation</button>' +
        '</div>' +
      '</article>';
    }).join('');

    root.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-action]') : null;
      if (!btn) { return; }
      var svc = services.filter(function (x) { return x.id === btn.getAttribute('data-id'); })[0];
      if (!svc) { return; }
      if (btn.getAttribute('data-action') === 'learn') { openDetail(svc); }
      if (btn.getAttribute('data-action') === 'consult') { preselectService(svc); }
    });

    /* Deep link: services.html#svc-2 highlights that card */
    var hash = window.location.hash.replace('#', '');
    if (hash) {
      var target = document.getElementById(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.style.outline = '3px solid rgba(22,128,248,.45)';
        target.style.outlineOffset = '3px';
        setTimeout(function () { target.style.outline = ''; }, 2600);
      }
    }
  }

  function openDetail(s) {
    var modal = DR.openModal({
      title: s.title,
      size: 'lg',
      body:
        '<div style="display:flex;gap:14px;align-items:flex-start;">' +
          '<span class="icon-chip icon-chip-lg">' + DR.icon(s.icon, 24) + '</span>' +
          '<p class="modal-text">' + DR.esc(s.description) + '</p>' +
        '</div>' +
        '<h4 style="margin:18px 0 8px;font-size:14px;">Key deliverables</h4>' +
        '<ul class="service-list">' + s.deliverables.map(function (d) {
          return '<li>' + DR.icon('check', 15) + '<span>' + DR.esc(d) + '</span></li>';
        }).join('') + '</ul>' +
        '<h4 style="margin:18px 0 8px;font-size:14px;">Suitable project types</h4>' +
        '<div class="tag-row">' + s.suitable.map(function (t) {
          return '<span class="chip chip-neutral">' + DR.esc(t) + '</span>';
        }).join('') + '</div>' +
        '<div class="notice-box notice-warn" style="margin-top:18px;">' + DR.icon('alert', 16) +
        '<p>Deliverables shown are a typical scope. Final outputs depend on your project brief, applicable codes and qualified professional review.</p></div>',
      footer:
        '<button type="button" class="btn btn-ghost" data-act="close">Close</button>' +
        '<button type="button" class="btn btn-primary" data-act="consult">Request Consultation</button>'
    });
    if (!modal) { return; }
    modal.querySelector('[data-act="close"]').addEventListener('click', function () { DR.closeModal(modal); });
    modal.querySelector('[data-act="consult"]').addEventListener('click', function () {
      DR.closeModal(modal);
      preselectService(s);
    });
  }

  function preselectService(s) {
    var select = document.getElementById('c-service');
    if (select) {
      select.value = s.title;
      select.classList.add('checked');
    }
    var section = document.getElementById('consultation');
    if (section) { section.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    DR.toast('Service “' + s.title + '” selected in the consultation form.', 'info');
  }

  /* ---------------- Consultation form ---------------- */
  function setError(field, message) {
    var group = document.getElementById('grp-' + field);
    var err = document.getElementById('err-' + field);
    if (group) { group.classList.toggle('has-error', !!message); }
    if (err) { err.textContent = message || ''; }
  }

  function wireForm() {
    var form = document.getElementById('consultation-form');
    if (!form) { return; }
    var serviceSelect = document.getElementById('c-service');
    DR.getServices().forEach(function (s) {
      var opt = document.createElement('option');
      opt.value = s.title;
      opt.textContent = s.title;
      serviceSelect.appendChild(opt);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('c-name').value.trim();
      var email = document.getElementById('c-email').value.trim();
      var service = serviceSelect.value;
      var phone = document.getElementById('c-phone').value.trim();
      var message = document.getElementById('c-message').value.trim();
      var ok = true;

      ['c-name', 'c-email', 'c-service', 'c-phone', 'c-message'].forEach(function (f) { setError(f, ''); });

      if (name.length < 2) { setError('c-name', 'Please enter your full name.'); ok = false; }
      if (!EMAIL_RE.test(email)) { setError('c-email', 'Please enter a valid email address.'); ok = false; }
      if (!service) { setError('c-service', 'Please choose a service.'); ok = false; }
      if (phone && !/^[+\d][\d\s\-()]{5,24}$/.test(phone)) { setError('c-phone', 'Enter a valid phone number or leave it empty.'); ok = false; }
      if (message.length < 15) { setError('c-message', 'Please add at least 15 characters about your project.'); ok = false; }
      if (!ok) { DR.toast('Please fix the highlighted fields.', 'error'); return; }

      var payload = { name: name, email: email, service: service, phone: phone, message: message, type: 'consultation' };
      DR.pushLocal(DR.KEYS.consultations, {
        id: DR.uid(), type: 'consultation', name: name, email: email,
        service: service, phone: phone, message: message,
        createdAt: new Date().toISOString(), sent: !!DR.formEndpoint()
      });

      var btn = form.querySelector('button[type="submit"]');
      var note = document.getElementById('consult-result');
      if (!note) {
        note = document.createElement('div');
        note.id = 'consult-result';
        note.className = 'notice-box notice-info';
        note.style.marginTop = '14px';
        note.setAttribute('role', 'status');
        form.appendChild(note);
      }
      var ep = DR.formEndpoint();

      if (!ep) {
        form.reset();
        DR.toast('Request received — the DESIGNRUN team will get back to you shortly.', 'success');
        note.className = 'notice-box notice-success';
        note.innerHTML = DR.icon('check-circle', 16) +
          '<p><strong>Request received.</strong> Your consultation request is saved on the DESIGNRUN server ' +
          'and appears in the admin inbox right away.</p>';
        DR.renderIcons(note);
        return;
      }

      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      DR.sendToForm(payload).then(function () {
        form.reset();
        DR.toast('Consultation request sent successfully!', 'success');
        note.className = 'notice-box notice-success';
        note.innerHTML = DR.icon('check-circle', 16) +
          '<p><strong>Request sent!</strong> The DESIGNRUN team will get back to you shortly. ' +
          'For urgent matters call +91 80069 03841.</p>';
        DR.renderIcons(note);
      }).catch(function () {
        DR.toast('Could not send right now — your request was saved on this device.', 'error');
        note.className = 'notice-box notice-warn';
        note.innerHTML = DR.icon('alert', 16) +
          '<p><strong>Could not send.</strong> Your request is saved on this device. Please try again, ' +
          'or contact us directly from the Contact page.</p>';
        DR.renderIcons(note);
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i data-icon="send" data-size="16"></i> Submit Request'; DR.renderIcons(btn); }
      });
    });
  }

  function init() {
    renderServices();
    wireForm();
    DR.renderIcons(document.getElementById('main-content'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

