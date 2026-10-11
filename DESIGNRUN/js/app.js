/* ==========================================================================
   DESIGNRUN — app.js
   Shared UI: sidebar, topbar, footer, icons, dropdowns, search, modals,
   toasts and global image fallbacks.  Pure vanilla JS — no libraries.
   ========================================================================== */
(function () {
  'use strict';

  var DR = window.DR;

  /* ==========================================================================
     Inline SVG icon set (Lucide-style strokes — no CDN required)
     ========================================================================== */
  var ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    hardhat: '<path d="M2 18h20"/><path d="M4 18v-3a8 8 0 0 1 16 0v3"/><path d="M10 5.5 12 3l2 2.5"/><path d="M12 3v6"/>',
    chart: '<path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="8" rx="1"/><rect x="12" y="6" width="3" height="12" rx="1"/><rect x="17" y="13" width="3" height="5" rx="1"/>',
    'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-right': '<path d="m9 6 6 6-6 6"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pencil: '<path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    download: '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 21h16"/>',
    upload: '<path d="M12 21V9"/><path d="m7 13 5-5 5 5"/><path d="M4 3h16"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/>',
    pin: '<path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01"/><path d="M10 22v-4h4v4"/>',
    wind: '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h8"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    ruler: '<rect x="2" y="8" width="20" height="8" rx="2"/><path d="M6 8v3M10 8v4M14 8v3M18 8v4"/>',
    shield: '<path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    star: '<path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8L6.6 19.6l1-6L3.3 9.4l6-.9z"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
    printer: '<path d="M6 9V3h12v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M8 17h8v4H8z"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
    send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
    'file-down': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 12v5"/><path d="m9.5 14.5 2.5 2.5 2.5-2.5"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    'book-open': '<path d="M2 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2z"/><path d="M22 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    zap: '<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
    leaf: '<path d="M4 20c8 0 16-4 16-16-8 0-16 4-16 16z"/><path d="M4 20c2-6 6-10 12-12"/>',
    blueprint: '<path d="M3 3h18v18H3z"/><path d="M3 9h18M9 3v18"/><circle cx="15.5" cy="15.5" r="2.5"/>',
    quote: '<path d="M9 7H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v1a3 3 0 0 1-3 3"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 10-10"/><path d="m15 8 3 3"/>',
    crown: '<path d="m3 8 4 4 5-6 5 6 4-4v9H3z"/><path d="M5 21h14"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
    'user-plus': '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M19 8v6M22 11h-6"/>'
  };

  /* Return an <svg> string for an icon name. */
  DR.icon = function (name, size) {
    var inner = ICONS[name] || ICONS.info;
    var s = size || 20;
    return '<svg class="icon-svg" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      inner + '</svg>';
  };

  /* Replace every <i data-icon="name"></i> inside a container with real SVG. */
  DR.renderIcons = function (root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll('i[data-icon]');
    Array.prototype.forEach.call(nodes, function (node) {
      var holder = document.createElement('span');
      holder.innerHTML = DR.icon(node.getAttribute('data-icon'), parseInt(node.getAttribute('data-size'), 10) || 20);
      node.parentNode.replaceChild(holder.firstChild, node);
    });
  };

  /* ==========================================================================
     Toasts
     ========================================================================== */
  DR.toast = function (message, type) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var t = document.createElement('div');
    t.className = 'toast toast-' + (type || 'success');
    t.setAttribute('role', 'status');
    var ic = type === 'error' ? 'alert' : (type === 'info' ? 'info' : 'check-circle');
    t.innerHTML = DR.icon(ic, 18) + '<span>' + DR.esc(message) + '</span>';
    root.appendChild(t);
    setTimeout(function () { t.classList.add('toast-out'); }, 3200);
    setTimeout(function () { if (t.parentNode) { t.parentNode.removeChild(t); } }, 3700);
  };

  /* ==========================================================================
     Modal system (focus first control, ESC to close, overlay click to close)
     ========================================================================== */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  DR.openModal = function (opts) {
    var root = document.getElementById('modal-root');
    if (!root) return null;
    var o = opts || {};
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal ' + (o.size === 'lg' ? 'modal-lg' : '') + '" role="dialog" aria-modal="true" aria-label="' + DR.esc(o.title || 'Dialog') + '">' +
        '<div class="modal-head">' +
          '<h3>' + DR.esc(o.title || 'Dialog') + '</h3>' +
          '<button type="button" class="icon-btn modal-close" aria-label="Close dialog">' + DR.icon('x', 18) + '</button>' +
        '</div>' +
        '<div class="modal-body">' + (o.body || '') + '</div>' +
        (o.footer ? '<div class="modal-foot">' + o.footer + '</div>' : '') +
      '</div>';
    root.appendChild(overlay);
    document.body.classList.add('no-scroll');
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) { DR.closeModal(overlay); } });
    overlay.querySelector('.modal-close').addEventListener('click', function () { DR.closeModal(overlay); });
    DR.renderIcons(overlay);
    var first = overlay.querySelector(FOCUSABLE);
    if (first) { first.focus(); }
    return overlay;
  };

  DR.closeModal = function (overlay) {
    var target = overlay || document.querySelector('.modal-overlay:last-of-type');
    if (target && target.parentNode) { target.parentNode.removeChild(target); }
    if (!document.querySelector('.modal-overlay')) { document.body.classList.remove('no-scroll'); }
  };

  /* Confirmation dialog — runs callback(true) when the user confirms. */
  DR.confirmAction = function (opts, onConfirm) {
    var o = opts || {};
    var modal = DR.openModal({
      title: o.title || 'Please confirm',
      body: '<p class="modal-text">' + DR.esc(o.message || 'Are you sure?') + '</p>',
      footer:
        '<button type="button" class="btn btn-ghost" data-act="cancel">Cancel</button>' +
        '<button type="button" class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-act="ok">' + DR.esc(o.confirmText || 'Confirm') + '</button>'
    });
    if (!modal) { return; }
    modal.querySelector('[data-act="cancel"]').addEventListener('click', function () { DR.closeModal(modal); });
    modal.querySelector('[data-act="ok"]').addEventListener('click', function () {
      DR.closeModal(modal);
      if (typeof onConfirm === 'function') { onConfirm(true); }
    });
  };

  /* ==========================================================================
     Layout — navigation model, sidebar, topbar, footer
     ========================================================================== */
  var NAV = [
    { key: 'dashboard', href: 'index.html', label: 'Dashboard', icon: 'dashboard' },
    { key: 'projects', href: 'projects.html', label: 'Projects', icon: 'folder' },
    { key: 'services', href: 'services.html', label: 'Services', icon: 'hardhat' },
    { key: 'analysis', href: 'analysis.html', label: 'Design & Analysis', icon: 'chart' },
    { key: 'reports', href: 'reports.html', label: 'Reports', icon: 'file-text' },
    { key: 'team', href: 'team.html', label: 'Team', icon: 'users' },
    { key: 'resources', href: 'resources.html', label: 'Resources', icon: 'book' },
    { key: 'contact', href: 'contact.html', label: 'Contact Us', icon: 'mail' },
    { key: 'admin', href: 'admin.html', label: 'Admin Panel', icon: 'shield', adminOnly: true, hideWhenLoggedOut: false }
  ];
  DR.NAV = NAV;

  function logoMark(size) {
    var s = size || 38;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 64 64" aria-hidden="true">' +
      '<rect width="64" height="64" rx="14" fill="#1680F8"/>' +
      '<path d="M18 46V18h11c9.5 0 16 5.8 16 14s-6.5 14-16 14z" fill="none" stroke="#0B1B2E" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M18 32h21" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/></svg>';
  }

  function renderSidebar() {
    var root = document.getElementById('sidebar-root');
    if (!root) { return; }
    var page = document.body.getAttribute('data-page') || 'dashboard';
    var settings = DR.getSettings();
    var me = (typeof DR.currentDemoUser === 'function') ? DR.currentDemoUser() : null;
    var isAdmin = !!(me && me.role === 'admin');
    var links = NAV.filter(function (item) {
      if (item.adminOnly && !isAdmin) { return false; }
      return true;
    }).map(function (item) {
      var active = item.key === page;
      return '<li><a class="nav-link' + (active ? ' active' : '') + '" href="' + item.href + '"' +
        (active ? ' aria-current="page"' : '') + '>' +
        '<i data-icon="' + item.icon + '" data-size="20"></i><span>' + item.label + '</span></a></li>';
    }).join('');

    root.innerHTML =
      '<div class="sidebar-overlay" id="sidebar-overlay" hidden></div>' +
      '<aside class="sidebar" id="sidebar" aria-label="Main navigation">' +
        '<div class="sidebar-brand">' +
          '<a class="brand-link" href="index.html" aria-label="DESIGNRUN dashboard home">' +
            logoMark(40) +
            '<span class="brand-text"><strong>DESIGNRUN</strong><small>CIVIL &amp; STRUCTURE SOLUTION</small></span>' +
          '</a>' +
          '<button type="button" class="icon-btn sidebar-close" id="sidebar-close" aria-label="Close menu">' + DR.icon('x', 18) + '</button>' +
        '</div>' +
        '<nav class="sidebar-nav"><p class="nav-caption">Main menu</p><ul>' + links + '</ul></nav>' +
        '<div class="sidebar-foot">' +
          '<p class="sidebar-slogan">Better Designs. Stronger Structures.<br>A Safer Tomorrow.</p>' +
          (me
            ? '<button type="button" class="sidebar-profile" id="sidebar-profile" aria-haspopup="dialog" title="Signed in as ' + DR.esc(me.name) + '">' +
              '<img class="avatar avatar-sm" id="sidebar-avatar" alt="" src="' + DR.profileAvatar() + '">' +
              '<span class="sidebar-profile-text"><strong id="sidebar-profile-name">' + DR.esc(me.name) + '</strong>' +
              '<small id="sidebar-profile-title">' + DR.esc(me.role === 'admin' ? 'Administrator' : 'Member') + '</small></span>' +
              '</button>'
            : '<button type="button" class="sidebar-profile" id="sidebar-profile" aria-haspopup="dialog">' +
              '<img class="avatar avatar-sm" id="sidebar-avatar" alt="" src="' + DR.profileAvatar() + '">' +
              '<span class="sidebar-profile-text"><strong id="sidebar-profile-name">' + DR.esc(settings.founderName) + '</strong>' +
              '<small id="sidebar-profile-title">' + DR.esc(settings.founderTitle) + '</small></span>' +
              '</button>') +
        '</div>' +
      '</aside>';
    DR.renderIcons(root);
  }

  function renderTopbar() {
    var root = document.getElementById('topbar-root');
    if (!root) { return; }
    var currentKey = document.body.getAttribute('data-page') || 'dashboard';
    var customTitle = document.body.getAttribute('data-title') || '';
    var page = NAV.filter(function (n) { return n.key === currentKey; })[0] ||
      { key: currentKey, href: 'index.html', label: customTitle || 'Dashboard', icon: 'dashboard' };
    var settings = DR.getSettings();
    var unread = DR.unreadCount();
    var topMe = (typeof DR.currentDemoUser === 'function') ? DR.currentDemoUser() : null;
    var me = topMe;
    var isAdmin = !!(topMe && topMe.role === 'admin');
    var meName = topMe ? topMe.name : settings.founderName;
    var meSub = topMe ? (topMe.role === 'admin' ? 'Administrator' : 'Member') : settings.founderTitle;

    root.innerHTML =
      '<header class="topbar">' +
        '<div class="topbar-left">' +
          '<button type="button" class="icon-btn topbar-burger" id="sidebar-toggle" aria-label="Open menu" aria-controls="sidebar" aria-expanded="false">' + DR.icon('menu', 22) + '</button>' +
          '<div class="topbar-titles">' +
            '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a>' + DR.icon('chevron-right', 13) + '<span aria-current="page">' + DR.esc(page.label) + '</span></nav>' +
            '<h2 class="topbar-page-title">' + DR.esc(page.label) + '</h2>' +
          '</div>' +
        '</div>' +
        '<div class="topbar-right">' +
          '<div class="search-box" role="search">' +
            '<span class="search-icon">' + DR.icon('search', 17) + '</span>' +
            '<input type="search" id="global-search" placeholder="Search projects &amp; services…" aria-label="Search projects and services" autocomplete="off">' +
            '<div class="search-results" id="search-results" role="listbox" aria-label="Search results" hidden></div>' +
          '</div>' +
          '<div class="dropdown-wrap">' +
            '<button type="button" class="icon-btn" id="bell-btn" aria-label="Notifications, ' + unread + ' unread" aria-haspopup="true" aria-expanded="false">' +
              DR.icon('bell', 20) + (unread > 0 ? '<span class="badge-dot" id="bell-count">' + unread + '</span>' : '') +
            '</button>' +
            '<div class="dropdown dropdown-notif" id="bell-menu" role="menu" hidden>' +
              '<div class="dropdown-head"><strong>Notifications</strong>' +
              '<button type="button" class="link-btn" id="mark-read">Mark all read</button></div>' +
              '<ul class="notif-list" id="notif-list"></ul>' +
            '</div>' +
          '</div>' +
          '<div class="dropdown-wrap">' +
            '<button type="button" class="avatar-btn" id="profile-btn" aria-haspopup="true" aria-expanded="false" aria-label="Open profile menu">' +
              '<img class="avatar avatar-sm" id="topbar-avatar" alt="" src="' + DR.profileAvatar() + '">' +
              '<span class="avatar-btn-name" id="topbar-profile-name">' + DR.esc(meName) + '</span>' +
              DR.icon('chevron-down', 15) +
            '</button>' +
            '<div class="dropdown dropdown-menu" id="profile-menu" role="menu" hidden>' +
              '<div class="dropdown-head profile-head">' +
                '<img class="avatar" alt="" src="' + DR.profileAvatar() + '">' +
                '<div><strong id="menu-profile-name">' + DR.esc(meName) + '</strong><small id="menu-profile-title">' + DR.esc(meSub) + '</small></div>' +
              '</div>' +
              (me
                ? (isAdmin ? '<a class="menu-item" role="menuitem" href="admin.html">' + DR.icon('crown', 17) + ' Admin Panel</a>' : '') +
                  '<button type="button" class="menu-item" role="menuitem" data-action="edit-profile">' + DR.icon('user', 17) + ' Profile settings</button>' +
                  '<a class="menu-item" role="menuitem" href="team.html">' + DR.icon('users', 17) + ' Team page</a>' +
                  '<div class="menu-divider"></div>' +
                  '<button type="button" class="menu-item" role="menuitem" data-action="logout">' + DR.icon('logout', 17) + ' Log out</button>'
                : '<a class="menu-item" role="menuitem" href="login.html">' + DR.icon('login', 17) + ' Log in</a>' +
                  '<div class="menu-divider"></div>' +
                  '<button type="button" class="menu-item" role="menuitem" data-action="edit-profile">' + DR.icon('user', 17) + ' Profile settings</button>') +
              '<a class="menu-item" role="menuitem" href="contact.html">' + DR.icon('mail', 17) + ' Business contact info</a>' +
              '<div class="menu-divider"></div>' +
              '<button type="button" class="menu-item menu-item-danger" role="menuitem" data-action="reset-demo">' + DR.icon('refresh', 17) + ' Reset site data</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</header>';
    renderNotifList();
  }

  function renderNotifList() {
    var list = document.getElementById('notif-list');
    if (!list) { return; }
    var read = DR.getReadNotifications();
    var items = DR.getNotifications();
    if (!items.length) {
      list.innerHTML = '<li class="notif-empty">No notifications.</li>';
      return;
    }
    list.innerHTML = items.map(function (n) {
      var isRead = read.indexOf(n.id) !== -1;
      return '<li class="notif-item' + (isRead ? ' is-read' : '') + '">' +
        '<span class="notif-ic">' + DR.icon(n.icon || 'info', 16) + '</span>' +
        '<span class="notif-body"><strong>' + DR.esc(n.title) + '</strong><p>' + DR.esc(n.text) + '</p>' +
        '<time>' + DR.fmtDate(n.time) + '</time></span></li>';
    }).join('');
  }

  function renderFooter() {
    var root = document.getElementById('footer-root');
    if (!root) { return; }
    var info = DR.getContactInfo();
    var topMe = (typeof DR.currentDemoUser === 'function') ? DR.currentDemoUser() : null;
    var year = new Date().getFullYear();
    root.innerHTML =
      '<footer class="site-footer">' +
        '<div class="footer-grid">' +
          '<div class="footer-col footer-brand-col">' +
            '<div class="footer-brand">' + logoMark(34) + '<span><strong>DESIGNRUN</strong><small>CIVIL &amp; STRUCTURE SOLUTION</small></span></div>' +
            '<p>From Concept to Completion — We Build with Precision.</p>' +
            '<p class="footer-muted">Better Designs. Stronger Structures. A Safer Tomorrow.</p>' +
          '</div>' +
          '<div class="footer-col">' +
            '<h4>Pages</h4>' +
            '<a href="index.html">Dashboard</a><a href="projects.html">Projects</a>' +
            '<a href="services.html">Services</a><a href="analysis.html">Design &amp; Analysis</a>' +
            '<a href="reports.html">Reports</a><a href="team.html">Team</a>' +
            '<a href="resources.html">Resources</a><a href="contact.html">Contact Us</a>' +
            '<a href="login.html">Log in</a>' +
            (topMe && topMe.role === 'admin' ? '<a href="admin.html">Admin Panel</a>' : '') +
          '</div>' +
          '<div class="footer-col">' +
            '<h4>Services</h4>' +
            '<a href="services.html">Structural Design &amp; Detailing</a>' +
            '<a href="services.html">Wind Load Analysis (CFD)</a>' +
            '<a href="services.html">RCC &amp; Steel Design</a>' +
            '<a href="services.html">3D Modeling &amp; BIM</a>' +
            '<a href="services.html">Consultancy &amp; Support</a>' +
          '</div>' +
          '<div class="footer-col">' +
            '<h4>Contact</h4>' +
            '<a href="mailto:' + DR.esc(info.email) + '">' + DR.esc(info.email) + '</a>' +
            '<a href="tel:' + DR.esc(info.phone.replace(/\s/g, '')) + '">' + DR.esc(info.phone) + '</a>' +
            '<p class="footer-muted">' + DR.esc(info.address) + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="footer-bottom">' +
          '<p>© ' + year + ' DESIGNRUN — Civil &amp; Structure Solution. All rights reserved.</p>' +
          '<p class="footer-note">Structural design and analysis results are issued only by qualified professionals using validated engineering software and applicable codes.</p>' +
        '</div>' +
      '</footer>';
  }

  /* ==========================================================================
     Global search (pages, projects, services)
     ========================================================================== */
  function searchIndex() {
    var items = DR.NAV.map(function (n) {
      return { title: n.label, sub: 'Page', url: n.href, icon: n.icon };
    });
    DR.getProjects().forEach(function (p) {
      items.push({ title: p.name, sub: 'Project · ' + p.category, url: 'projects.html?q=' + encodeURIComponent(p.name), icon: 'folder' });
    });
    DR.getServices().forEach(function (s) {
      items.push({ title: s.title, sub: 'Service', url: 'services.html#' + s.id, icon: 'hardhat' });
    });
    return items;
  }

  function wireGlobalSearch() {
    var input = document.getElementById('global-search');
    var panel = document.getElementById('search-results');
    if (!input || !panel) { return; }
    var index = searchIndex();

    function close() { panel.hidden = true; panel.innerHTML = ''; }

    function run() {
      var q = input.value.trim().toLowerCase();
      if (q.length < 2) { close(); return; }
      var hits = index.filter(function (it) {
        return (it.title + ' ' + it.sub).toLowerCase().indexOf(q) !== -1;
      }).slice(0, 6);
      if (!hits.length) {
        panel.innerHTML = '<p class="search-empty">No matches for “' + DR.esc(input.value) + '”</p>';
      } else {
        panel.innerHTML = hits.map(function (h) {
          return '<a class="search-hit" role="option" href="' + DR.esc(h.url) + '">' +
            '<span class="search-hit-ic">' + DR.icon(h.icon, 16) + '</span>' +
            '<span><strong>' + DR.esc(h.title) + '</strong><small>' + DR.esc(h.sub) + '</small></span></a>';
        }).join('');
      }
      panel.hidden = false;
    }

    input.addEventListener('input', DR.debounce(run, 140));
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var first = panel.querySelector('.search-hit');
        if (first) { window.location.href = first.getAttribute('href'); }
        else if (input.value.trim()) { window.location.href = 'projects.html?q=' + encodeURIComponent(input.value.trim()); }
      }
      if (e.key === 'Escape') { close(); }
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.search-box')) { close(); }
    });
  }

  /* ==========================================================================
     Dropdowns, sidebar and profile interactions
     ========================================================================== */
  function wireDropdown(btnId, menuId) {
    var btn = document.getElementById(btnId);
    var menu = document.getElementById(menuId);
    if (!btn || !menu) { return; }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = menu.hidden;
      closeAllDropdowns();
      if (willOpen) {
        menu.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
      }
    });
    menu.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  function closeAllDropdowns() {
    ['bell-menu', 'profile-menu'].forEach(function (id) {
      var m = document.getElementById(id);
      if (m) { m.hidden = true; }
    });
    ['bell-btn', 'profile-btn'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) { b.setAttribute('aria-expanded', 'false'); }
    });
  }

  function openSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    var toggle = document.getElementById('sidebar-toggle');
    if (!sidebar) { return; }
    sidebar.classList.add('is-open');
    if (overlay) { overlay.hidden = false; }
    if (toggle) { toggle.setAttribute('aria-expanded', 'true'); }
    document.body.classList.add('no-scroll');
  }

  function closeSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    var toggle = document.getElementById('sidebar-toggle');
    if (!sidebar) { return; }
    sidebar.classList.remove('is-open');
    if (overlay) { overlay.hidden = true; }
    if (toggle) { toggle.setAttribute('aria-expanded', 'false'); }
    if (!document.querySelector('.modal-overlay')) { document.body.classList.remove('no-scroll'); }
  }
  DR.openSidebar = openSidebar;
  DR.closeSidebar = closeSidebar;

  /* Profile settings — premium tabbed editor (Profile · Personal · Appearance)
     with avatar upload, accent colour and UI theme. */
  function openProfileSettings() {
    var s = DR.getSettings();
    var me = (typeof DR.currentDemoUser === 'function') ? DR.currentDemoUser() : null;
    var activeTheme = DR.getTheme();

    function themeSwatches() {
      return DR.THEMES.map(function (t) {
        var on = t === activeTheme ? ' is-active' : '';
        return '<button type="button" class="theme-swatch' + on + '" data-theme="' + t + '" title="' + DR.esc(DR.THEME_LABELS[t]) + '">' +
          '<span class="theme-dot theme-dot-' + t + '"></span>' +
          '<span class="theme-swatch-label">' + DR.esc(DR.THEME_LABELS[t]) + '</span></button>';
      }).join('');
    }

    var body =
      '<div class="pf-tabs" role="tablist">' +
        '<button type="button" class="pf-tab is-active" data-pftab="profile" role="tab">Profile</button>' +
        '<button type="button" class="pf-tab" data-pftab="personal" role="tab">Personal</button>' +
        '<button type="button" class="pf-tab" data-pftab="appearance" role="tab">Appearance</button>' +
      '</div>' +

      '<div class="pf-pane" data-pfpane="profile">' +
        '<div class="pf-avatar-row">' +
          '<img class="pf-avatar-preview avatar" id="pf-avatar-preview" alt="Avatar preview" src="' + DR.profileAvatar() + '">' +
          '<div class="pf-avatar-actions">' +
            '<label class="btn btn-ghost btn-sm" for="pf-avatar-file"><i data-icon="upload" data-size="15"></i> Upload photo</label>' +
            '<input id="pf-avatar-file" type="file" accept="image/*" hidden>' +
            '<button type="button" class="btn btn-ghost btn-sm" id="pf-avatar-clear">Remove</button>' +
            '<p class="muted pf-hint">JPG/PNG, up to ~1 MB. Stored on this device.</p>' +
          '</div>' +
        '</div>' +
        '<div class="form-group"><label for="pf-name">Display name</label>' +
          '<input id="pf-name" type="text" maxlength="60" value="' + DR.esc(s.founderName) + '" required></div>' +
        '<div class="form-group"><label for="pf-title">Job title</label>' +
          '<input id="pf-title" type="text" maxlength="80" value="' + DR.esc(s.founderTitle) + '" required></div>' +
        '<div class="form-group"><label for="pf-bio">Short bio</label>' +
          '<textarea id="pf-bio" rows="3" maxlength="240" placeholder="A line about you…">' + DR.esc(s.founderBio) + '</textarea></div>' +
      '</div>' +

      '<div class="pf-pane" data-pfpane="personal" hidden>' +
        '<div class="form-group"><label for="pf-phone">Phone</label>' +
          '<input id="pf-phone" type="tel" maxlength="30" value="' + DR.esc(s.founderPhone) + '" placeholder="+91 …"></div>' +
        '<div class="form-group"><label for="pf-location">Location</label>' +
          '<input id="pf-location" type="text" maxlength="80" value="' + DR.esc(s.founderLocation) + '" placeholder="City, Country"></div>' +
        (me ? '<p class="muted">Signed in as <strong>' + DR.esc(me.email) + '</strong>.</p>' : '') +
      '</div>' +

      '<div class="pf-pane" data-pfpane="appearance" hidden>' +
        '<div class="form-group"><label>Interface theme</label>' +
          '<div class="theme-grid" id="pf-theme-grid">' + themeSwatches() + '</div></div>' +
        '<div class="form-group"><label for="pf-hue">Accent colour <span class="muted">(' + s.founderHue + '°)</span></label>' +
          '<input id="pf-hue" type="range" min="0" max="360" step="1" value="' + s.founderHue + '">' +
          '<div class="pf-hue-preview"><img class="avatar" id="pf-hue-avatar" alt="" src="' + DR.initialsAvatar(s.founderName, s.founderHue) + '"></div>' +
        '</div>' +
      '</div>';

    var modal = DR.openModal({
      title: 'Profile settings',
      size: 'lg',
      body: body,
      footer:
        (me
          ? '<button type="button" class="btn btn-ghost" data-act="logout" style="color:#DC2626;"><i data-icon="logout" data-size="15"></i> Log out</button>'
          : '<a class="btn btn-ghost" href="login.html"><i data-icon="login" data-size="15"></i> Log in</a>') +
        '<button type="button" class="btn btn-ghost" data-act="cancel">Cancel</button>' +
        '<button type="button" class="btn btn-primary" data-act="save">Save changes</button>'
    });
    if (!modal) { return; }
    DR.renderIcons(modal);

    /* --- tab switching --- */
    var tabs = modal.querySelectorAll('[data-pftab]');
    Array.prototype.forEach.call(tabs, function (tab) {
      tab.addEventListener('click', function () {
        var which = tab.getAttribute('data-pftab');
        Array.prototype.forEach.call(tabs, function (t) { t.classList.toggle('is-active', t === tab); });
        Array.prototype.forEach.call(modal.querySelectorAll('[data-pfpane]'), function (pane) {
          pane.hidden = pane.getAttribute('data-pfpane') !== which;
        });
      });
    });

    /* --- theme picker (live preview) --- */
    Array.prototype.forEach.call(modal.querySelectorAll('[data-theme]'), function (btn) {
      btn.addEventListener('click', function () {
        activeTheme = btn.getAttribute('data-theme');
        Array.prototype.forEach.call(modal.querySelectorAll('[data-theme]'), function (b) { b.classList.toggle('is-active', b === btn); });
        DR.applyTheme(activeTheme);
      });
    });

    /* --- avatar upload (preview + keep data URL) --- */
    var chosenAvatar = s.founderAvatar || '';
    var fileInput = modal.querySelector('#pf-avatar-file');
    var preview = modal.querySelector('#pf-avatar-preview');
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) { return; }
        if (file.size > 1024 * 1024) { DR.toast('Please choose an image under 1 MB.', 'error'); fileInput.value = ''; return; }
        var reader = new FileReader();
        reader.onload = function () { chosenAvatar = String(reader.result || ''); if (preview) { preview.src = chosenAvatar; } };
        reader.readAsDataURL(file);
      });
    }
    var clearBtn = modal.querySelector('#pf-avatar-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        chosenAvatar = '';
        if (fileInput) { fileInput.value = ''; }
        if (preview) { preview.src = DR.initialsAvatar(s.founderName, s.founderHue); }
      });
    }

    /* --- accent hue live preview --- */
    var hueInput = modal.querySelector('#pf-hue');
    var hueAvatar = modal.querySelector('#pf-hue-avatar');
    var hueLabel = hueInput ? hueInput.parentNode.querySelector('label span') : null;
    if (hueInput) {
      hueInput.addEventListener('input', function () {
        var h = parseInt(hueInput.value, 10);
        if (hueAvatar) { hueAvatar.src = DR.initialsAvatar(s.founderName, h); }
        if (hueLabel) { hueLabel.textContent = '(' + h + '°)'; }
      });
    }

    modal.querySelector('[data-act="cancel"]').addEventListener('click', function () {
      DR.applyTheme(DR.getTheme()); /* revert any live preview */
      DR.closeModal(modal);
    });
    var lo = modal.querySelector('[data-act="logout"]');
    if (lo) {
      lo.addEventListener('click', function () {
        DR.closeModal(modal);
        DR.setSession(null);
        DR.toast('You have been logged out.', 'info');
        setTimeout(function () { window.location.href = 'index.html'; }, 450);
      });
    }
    modal.querySelector('[data-act="save"]').addEventListener('click', function () {
      var name = modal.querySelector('#pf-name').value.trim();
      var title = modal.querySelector('#pf-title').value.trim();
      if (name.length < 2 || title.length < 2) { DR.toast('Please enter a valid name and job title.', 'error'); return; }
      s.founderName = name;
      s.founderTitle = title;
      s.founderBio = modal.querySelector('#pf-bio').value.trim();
      s.founderPhone = modal.querySelector('#pf-phone').value.trim();
      s.founderLocation = modal.querySelector('#pf-location').value.trim();
      s.founderAvatar = chosenAvatar;
      s.founderHue = hueInput ? parseInt(hueInput.value, 10) : s.founderHue;
      s.theme = activeTheme;
      DR.saveSettings(s);
      DR.applyTheme(s.theme);
      DR.closeModal(modal);
      refreshChrome();
      DR.toast('Profile & appearance saved.', 'success');
    });
  }

  /* Re-render sidebar + topbar after a settings change. */
  function refreshChrome() {
    renderSidebar();
    renderTopbar();
    wireChromeEvents();
  }
  DR.refreshChrome = refreshChrome;

  function wireChromeEvents() {
    var toggle = document.getElementById('sidebar-toggle');
    var closeBtn = document.getElementById('sidebar-close');
    var overlay = document.getElementById('sidebar-overlay');
    if (toggle) { toggle.addEventListener('click', openSidebar); }
    if (closeBtn) { closeBtn.addEventListener('click', closeSidebar); }
    if (overlay) { overlay.addEventListener('click', closeSidebar); }

    wireDropdown('bell-btn', 'bell-menu');
    wireDropdown('profile-btn', 'profile-menu');

    var markRead = document.getElementById('mark-read');
    if (markRead) {
      markRead.addEventListener('click', function () {
        DR.markAllNotificationsRead();
        renderTopbar();
        wireChromeEvents();
        DR.toast('All notifications marked as read.', 'info');
      });
    }

    var editBtn = document.querySelector('[data-action="edit-profile"]');
    if (editBtn) {
      editBtn.addEventListener('click', function () { closeAllDropdowns(); openProfileSettings(); });
    }
    var resetBtn = document.querySelector('[data-action="reset-demo"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        closeAllDropdowns();
        DR.confirmAction({
          title: 'Reset site data?',
          message: 'All projects, team members, enquiries and preferences saved in this browser will be deleted and the original site content restored.',
          confirmText: 'Reset data',
          danger: true
        }, function () {
          DR.resetDemoData();
          window.location.reload();
        });
      });
    }

    var sideProfile = document.getElementById('sidebar-profile');
    if (sideProfile) { sideProfile.addEventListener('click', openProfileSettings); }
    var logoutBtn = document.querySelector('[data-action="logout"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        closeAllDropdowns();
        DR.setSession(null);
        DR.toast('You have been logged out.', 'info');
        setTimeout(function () { window.location.href = 'index.html'; }, 450);
      });
    }
  }

  /* ==========================================================================
     Global image fallback (if an external photo fails, load a local SVG)
     ========================================================================== */
  function wireImageFallback() {
    window.addEventListener('error', function (e) {
      var el = e.target;
      if (!el || el.tagName !== 'IMG' || el.getAttribute('data-fallback-done')) { return; }
      var key = el.getAttribute('data-fallback') || 'generic';
      var file = key === 'hero' ? 'assets/images/hero-structure.svg' : 'assets/images/project-' + key + '.svg';
      el.setAttribute('data-fallback-done', '1');
      el.src = file;
    }, true);
  }

  /* ==========================================================================
     Boot
     ========================================================================== */
  function boot() {
    DR.applyTheme(DR.getTheme()); /* apply saved UI theme (anti-flash) */
    renderSidebar();
    renderTopbar();
    renderFooter();
    DR.renderIcons(document);
    wireChromeEvents();
    wireGlobalSearch();
    wireImageFallback();

    document.addEventListener('click', closeAllDropdowns);
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') { return; }
      if (document.querySelector('.modal-overlay')) { DR.closeModal(); return; }
      closeAllDropdowns();
      closeSidebar();
    });

    document.body.classList.add('js-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();








