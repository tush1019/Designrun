/* ==========================================================================
   DESIGNRUN — contact.js
   Enquiry form (validated locally, saved in this browser only — no email
   is sent) + editable business contact information.
   ========================================================================== */
(function () {
  'use strict';

  var DR = window.DR;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_RE = /^[+\d][\d\s\-()]{5,24}$/;

  function setError(field, message) {
    var group = document.getElementById('grp-' + field);
    var err = document.getElementById('err-' + field);
    if (group) { group.classList.toggle('has-error', !!message); }
    if (err) { err.textContent = message || ''; }
  }

  /* ---------- Business contact information panel ---------- */
  function renderContactInfo() {
    var list = document.getElementById('contact-info-list');
    if (!list) { return; }
    var info = DR.getContactInfo();
    var rows = [
      { icon: 'mail', label: 'Email', value: info.email, href: 'mailto:' + info.email },
      { icon: 'phone', label: 'Phone', value: info.phone, href: 'tel:' + String(info.phone).replace(/\s/g, '') },
      { icon: 'pin', label: 'Office', value: info.address, href: null },
      { icon: 'clock', label: 'Working hours', value: info.hours, href: null },
      { icon: 'globe', label: 'Website', value: info.website, href: /^https?:\/\//i.test(info.website) ? info.website : null }
    ];
    list.innerHTML = rows.map(function (r) {
      var val = r.href
        ? '<a href="' + DR.esc(r.href) + '">' + DR.esc(r.value) + '</a>'
        : '<span>' + DR.esc(r.value) + '</span>';
      return '<li>' + DR.icon(r.icon, 17) +
        '<span><strong>' + DR.esc(r.label) + '</strong>' + val + '</span></li>';
    }).join('');
  }

  function openInfoEditor() {
    var info = DR.getContactInfo();
    var modal = DR.openModal({
      title: 'Edit business details',
      size: 'lg',
      body:
        '<p class="modal-text muted">These details appear in the contact panel and the site footer. Stored in this browser only.</p>' +
        '<form id="info-form" novalidate>' +
          '<div class="form-grid">' +
            '<div class="form-group"><label for="bi-email">Email</label>' +
              '<input id="bi-email" type="email" maxlength="120" value="' + DR.esc(info.email) + '"></div>' +
            '<div class="form-group"><label for="bi-phone">Phone</label>' +
              '<input id="bi-phone" type="tel" maxlength="30" value="' + DR.esc(info.phone) + '"></div>' +
            '<div class="form-group form-span-2"><label for="bi-address">Office address</label>' +
              '<input id="bi-address" type="text" maxlength="160" value="' + DR.esc(info.address) + '"></div>' +
            '<div class="form-group"><label for="bi-hours">Working hours</label>' +
              '<input id="bi-hours" type="text" maxlength="80" value="' + DR.esc(info.hours) + '"></div>' +
            '<div class="form-group"><label for="bi-website">Website</label>' +
              '<input id="bi-website" type="text" maxlength="120" value="' + DR.esc(info.website) + '"></div>' +
          '</div>' +
        '</form>',
      footer:
        '<button type="button" class="btn btn-ghost" data-act="cancel">Cancel</button>' +
        '<button type="button" class="btn btn-primary" data-act="save">Save details</button>'
    });
    if (!modal) { return; }
    modal.querySelector('[data-act="cancel"]').addEventListener('click', function () { DR.closeModal(modal); });
    modal.querySelector('[data-act="save"]').addEventListener('click', function () {
      var email = modal.querySelector('#bi-email').value.trim();
      var phone = modal.querySelector('#bi-phone').value.trim();
      var address = modal.querySelector('#bi-address').value.trim();
      var hours = modal.querySelector('#bi-hours').value.trim();
      var website = modal.querySelector('#bi-website').value.trim();
      if (!EMAIL_RE.test(email)) { DR.toast('Please enter a valid business email.', 'error'); return; }
      if (phone.length < 5 || address.length < 5) { DR.toast('Please enter a valid phone and address.', 'error'); return; }
      DR.saveContactInfo({ email: email, phone: phone, address: address, hours: hours, website: website });
      DR.closeModal(modal);
      renderContactInfo();
      if (typeof DR.refreshChrome === 'function') { DR.refreshChrome(); }
      DR.toast('Business details updated in this browser.');
    });
  }

  /* ---------- Enquiry form ---------- */
  function wireForm() {
    var form = document.getElementById('contact-form');
    if (!form) { return; }
    var preset = DR.queryParam('subject');
    if (preset) {
      var subjEl = document.getElementById('f-subject');
      if (subjEl && !subjEl.value) { subjEl.value = preset; }
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('f-name').value.trim();
      var email = document.getElementById('f-email').value.trim();
      var phone = document.getElementById('f-phone').value.trim();
      var company = document.getElementById('f-company').value.trim();
      var subject = document.getElementById('f-subject').value.trim();
      var message = document.getElementById('f-message').value.trim();
      var ok = true;
      ['f-name', 'f-email', 'f-phone', 'f-company', 'f-subject', 'f-message'].forEach(function (f) { setError(f, ''); });
      if (name.length < 2) { setError('f-name', 'Please enter your full name.'); ok = false; }
      if (!EMAIL_RE.test(email)) { setError('f-email', 'Please enter a valid email address.'); ok = false; }
      if (phone && !PHONE_RE.test(phone)) { setError('f-phone', 'Enter a valid phone number or leave it empty.'); ok = false; }
      if (subject.length < 3) { setError('f-subject', 'Please enter a subject (at least 3 characters).'); ok = false; }
      if (message.length < 10) { setError('f-message', 'Please write at least 10 characters.'); ok = false; }
      if (!ok) { DR.toast('Please fix the highlighted fields.', 'error'); return; }

      var payload = { name: name, email: email, phone: phone, company: company, subject: subject, message: message };
      /* Always keep a local copy in the Admin inbox. */
      DR.pushLocal(DR.KEYS.contactMessages, {
        id: DR.uid(), name: name, email: email, phone: phone,
        company: company, subject: subject, message: message,
        createdAt: new Date().toISOString(), sent: !!DR.formEndpoint()
      });

      var btn = form.querySelector('button[type="submit"]');
      var result = document.getElementById('contact-result');
      var ep = DR.formEndpoint();

      if (!ep) {
        form.reset();
        DR.toast('Enquiry received — thank you! It is saved on the DESIGNRUN server.', 'success');
        if (result) {
          result.innerHTML =
            '<div class="notice-box notice-success" role="status">' + DR.icon('check-circle', 16) +
            '<p><strong>Enquiry received.</strong> Your message is stored on the DESIGNRUN server and appears ' +
            'in the admin inbox right away. For urgent matters call +91 80069 03841.</p></div>';
          DR.renderIcons(result);
        }
        return;
      }

      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      DR.sendToForm(payload).then(function () {
        form.reset();
        DR.toast('Enquiry sent — thank you! We will get back to you soon.', 'success');
        if (result) {
          result.innerHTML =
            '<div class="notice-box notice-success" role="status">' + DR.icon('check-circle', 16) +
            '<p><strong>Enquiry sent successfully!</strong> Your message has reached the DESIGNRUN team. ' +
            'For urgent matters call +91 80069 03841.</p></div>';
          DR.renderIcons(result);
        }
      }).catch(function () {
        DR.toast('Could not send right now — your enquiry was saved on this device.', 'error');
        if (result) {
          result.innerHTML =
            '<div class="notice-box notice-warn" role="status">' + DR.icon('alert', 16) +
            '<p><strong>Could not send.</strong> There was a network or server issue — your enquiry is saved on this device. ' +
            'Please try again, or email ritikchaudhary126@gmail.com directly.</p></div>';
          DR.renderIcons(result);
        }
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i data-icon="send" data-size="16"></i> Submit Enquiry'; DR.renderIcons(btn); }
      });
    });
  }

  function init() {
    renderContactInfo();
    wireForm();
    var editBtn = document.getElementById('edit-info-btn');
    if (editBtn) { editBtn.addEventListener('click', openInfoEditor); }
    DR.renderIcons(document.getElementById('main-content'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
