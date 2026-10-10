/* ==========================================================================
   DESIGNRUN — auth.js
   Login / signup / OTP against the DESIGNRUN backend (../backend, Express +
   SQLite). The server hashes passwords (bcrypt), stores accounts and issues
   a JWT; this file only handles the UI.
   ========================================================================== */
(function () {
  'use strict';
  var DR = window.DR;
  var pendingEmail = '';

  function $id(i) { return document.getElementById(i); }

  function setErr(f, g, m) {
    var e = $id(f), gr = g ? $id(g) : null;
    if (e) e.textContent = m || '';
    if (gr) gr.classList.toggle('has-error', !!m);
  }

  function emailOk(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  function busy(btn, on, label) {
    if (!btn) return;
    btn.disabled = !!on;
    if (on) { btn.setAttribute('data-label', btn.textContent); btn.textContent = label || 'Working…'; }
    else if (btn.getAttribute('data-label')) { btn.textContent = btn.getAttribute('data-label'); }
  }

  function showOtp(code) {
    var el = $id('demo-otp-code');
    if (el) el.textContent = String(code || '').split('').join(' ');
  }

  function otpVals() {
    var w = $id('otp-inputs');
    if (!w) return '';
    return Array.prototype.map.call(w.querySelectorAll('input'), function (x) { return x.value; }).join('');
  }

  function wireOtp() {
    var w = $id('otp-inputs');
    if (!w || w.getAttribute('data-w')) return;
    w.setAttribute('data-w', '1');
    var b = w.querySelectorAll('input');
    Array.prototype.forEach.call(b, function (inp, i) {
      inp.addEventListener('input', function () {
        inp.value = inp.value.replace(/\D/g, '').slice(0, 1);
        if (inp.value && i < b.length - 1) b[i + 1].focus();
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !inp.value && i > 0) b[i - 1].focus();
      });
    });
  }

  function fail(err) {
    DR.toast((err && err.message) || 'Something went wrong. Please try again.', 'error');
  }

  function finishSession(user) {
    DR.toast('Welcome back, ' + user.name + '!', 'success');
    setTimeout(function () { window.location.href = user.role === 'admin' ? 'admin.html' : 'index.html'; }, 500);
  }

  function doLogin() {
    var f = $id('login-form');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = $id('l-email').value.trim().toLowerCase();
      var pw = $id('l-pass').value;
      var ok = true;
      if (!emailOk(em)) { setErr('err-l-email', 'grp-l-email', 'Enter valid email.'); ok = false; }
      else setErr('err-l-email', 'grp-l-email', '');
      if (!pw) { setErr('err-l-pass', 'grp-l-pass', 'Enter password.'); ok = false; }
      else setErr('err-l-pass', 'grp-l-pass', '');
      if (!ok) return;

      var btn = f.querySelector('button[type="submit"]');
      busy(btn, true, 'Logging in…');
      DR.api.login(em, pw).then(function (res) {
        finishSession(res.user);
      }).catch(fail).finally(function () { busy(btn, false); });
    });
  }

  function doSignup() {
    var f = $id('signup-form');
    if (!f) return;
    wireOtp();

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var nm = $id('s-name').value.trim();
      var em = $id('s-email').value.trim().toLowerCase();
      var pw = $id('s-pass').value;
      var ok = true;
      if (nm.length < 2) { setErr('err-s-name', null, 'Enter your name.'); ok = false; } else setErr('err-s-name', null, '');
      if (!emailOk(em)) { setErr('err-s-email', null, 'Enter valid email.'); ok = false; } else setErr('err-s-email', null, '');
      if (pw.length < 6) { setErr('err-s-pass', null, 'Min 6 characters.'); ok = false; } else setErr('err-s-pass', null, '');
      if (!ok) return;

      var btn = f.querySelector('button[type="submit"]');
      busy(btn, true, 'Sending…');
      DR.api.signup(nm, em, pw).then(function (res) {
        pendingEmail = em;
        showOtp(res.otp);
        $id('signup-step-1').hidden = true;
        $id('signup-step-2').hidden = false;
        setErr('err-otp', null, '');
        DR.toast('OTP sent — enter it below to verify.', 'info');
      }).catch(fail).finally(function () { busy(btn, false); });
    });

    var rs = $id('resend-otp');
    if (rs) rs.addEventListener('click', function () {
      if (!pendingEmail) return;
      DR.api.resendOtp(pendingEmail).then(function (res) {
        setErr('err-otp', null, '');
        showOtp(res.otp);
        DR.toast('A new OTP has been generated.', 'info');
      }).catch(fail);
    });

    var bk = $id('back-step-1');
    if (bk) bk.addEventListener('click', function () {
      $id('signup-step-2').hidden = true;
      $id('signup-step-1').hidden = false;
    });

    var vb = $id('verify-otp-btn');
    if (vb) vb.addEventListener('click', function () {
      if (!pendingEmail) { DR.toast('Please fill details first.', 'error'); return; }
      var v = otpVals();
      if (v.length !== 6) { setErr('err-otp', null, 'Enter the 6-digit code.'); return; }
      busy(vb, true, 'Verifying…');
      DR.api.verifyOtp(pendingEmail, v).then(function (res) {
        setErr('err-otp', null, '');
        DR.toast(res.user.role === 'admin' ? 'Administrator account created!' : 'Account created!', 'success');
        setTimeout(function () { window.location.href = res.user.role === 'admin' ? 'admin.html' : 'index.html'; }, 600);
      }).catch(function (err) {
        setErr('err-otp', null, (err && err.message) || 'Verification failed.');
      }).finally(function () { busy(vb, false); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { doLogin(); doSignup(); });
  else { doLogin(); doSignup(); }
})();
