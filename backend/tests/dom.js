/* Minimal headless DOM good enough to boot DESIGNRUN's app.js and fire clicks.
   Not a full DOM — just enough for render + addEventListener + querySelector. */
class Node {
  constructor(tag) {
    this.tagName = String(tag || 'div').toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.listeners = {};
    this.classList = {
      _s: new Set(),
      add: (c) => { c.split(/\s+/).forEach(x => x && this.classList._s.add(x)); },
      remove: (c) => { c.split(/\s+/).forEach(x => this.classList._s.delete(x)); },
      toggle: (c, f) => { if (f === undefined) f = !this.classList._s.has(c); f ? this.classList._s.add(c) : this.classList._s.delete(c); return f; },
      contains: (c) => this.classList._s.has(c)
    };
    this.dataset = new Proxy({}, { set: (o, k, v) => { o[k] = String(v); this.setAttribute('data-' + k.replace(/([A-Z])/g, '-$1').toLowerCase(), String(v)); return true; }, get: (o, k) => o[k] });
    this._html = '';
    this.value = '';
    this.id = '';
    this.textContent = '';
    this.hidden = false;
    this.disabled = false;
  }
  setAttribute(k, v) {
    this.attributes[k] = String(v);
    if (k === 'id') { this.id = String(v); }
    if (k === 'class') { String(v).split(/\s+/).forEach(c => c && this.classList._s.add(c)); }
    if (k === 'value') { this.value = String(v); }
    if (k === 'hidden') { this.hidden = v !== 'false'; }
  }
  getAttribute(k) { return k === 'id' ? this.id : (k in this.attributes ? this.attributes[k] : null); }
  removeAttribute(k) { delete this.attributes[k]; if (k === 'hidden') this.hidden = false; }
  appendChild(n) { if (n.parentNode) { n.parentNode.removeChild(n); } n.parentNode = this; this.children.push(n); return n; }
  removeChild(n) { const i = this.children.indexOf(n); if (i !== -1) this.children.splice(i, 1); n.parentNode = null; return n; }
  addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); }
  removeEventListener(t, fn) { if (this.listeners[t]) this.listeners[t] = this.listeners[t].filter(f => f !== fn); }
  dispatchEvent(e) { e.target = this; (this.listeners[e.type] || []).forEach(fn => fn.call(this, e)); return true; }
  click() {
    const e = { type: 'click', target: this, preventDefault() {}, stopPropagation() {}, key: '' };
    (this.listeners.click || []).forEach(fn => fn.call(this, e));
  }
  focus() {}
  set className(v) { this.classList._s = new Set(String(v).split(/\s+/).filter(Boolean)); this.attributes.class = v; }
  get className() { return this.attributes.class || ''; }
  get firstChild() { return this.children[0] || null; }
  set innerHTML(html) {
    this._html = String(html);
    this.children = [];
    // Pull out the most important structure: elements carrying an id and their
    // attributes, plus buttons/anchors with data-action/data-act. Good enough
    // to test wiring of bell/avatar/logout/profile without a real parser.
    const idRe = /<(button|a|div|img|input|select|textarea|span|ul|li|nav|aside|header)\b([^>]*\bid="([^"]+)"[^>]*)>/gi;
    let m;
    const seen = new Set();
    while ((m = idRe.exec(this._html)) !== null) {
      const id = m[3];
      if (seen.has(id)) continue;
      seen.add(id);
      const el = new Node(m[1]);
      el.setAttribute('id', id);
      const attrRe = /(data-action|data-act|href|type|class|role|aria-haspopup)="([^"]*)"/gi;
      let a;
      while ((a = attrRe.exec(m[2])) !== null) { el.setAttribute(a[1], a[2]); }
      this.appendChild(el);
    }
  }
  get innerHTML() { return this._html; }
  _all(out) {
    out = out || [];
    this.children.forEach(c => { out.push(c); c._all(out); });
    return out;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  querySelectorAll(sel) {
    const results = [];
    this._all().forEach(el => { if (matches(el, sel)) results.push(el); });
    return results;
  }
  closest(sel) { let n = this; while (n) { if (matches(n, sel)) return n; n = n.parentNode; } return null; }
}

function matches(el, sel) {
  if (!sel) return false;
  if (sel.startsWith('#')) return el.id === sel.slice(1);
  if (sel.startsWith('.')) return el.classList.contains(sel.slice(1));
  if (sel.includes('[') && sel.includes('=')) {
    const m = sel.match(/\[([a-zA-Z-]+)="([^"]*)"\]/);
    if (m) return el.getAttribute(m[1]) === m[2];
    const m2 = sel.match(/\[([a-zA-Z-]+)\]/);
    if (m2) return el.getAttribute(m2[1]) !== null;
  }
  return el.tagName === sel.toUpperCase();
}

function createDocument() {
  const doc = new Node('html');
  doc.body = new Node('body');
  doc.appendChild(doc.body);
  doc.readyState = 'loading';
  doc.createElement = (tag) => new Node(tag);
  doc.getElementById = (id) => { const all = doc.body._all().concat([doc.body]); for (const n of all) { if (n.id === id) return n; } return null; };
  doc.querySelector = (s) => doc.body.querySelector(s);
  doc.querySelectorAll = (s) => doc.body.querySelectorAll(s);
  const domHandlers = {};
  doc.addEventListener = (t, fn) => { (domHandlers[t] = domHandlers[t] || []).push(fn); };
  doc._fire = (t, ev) => { (domHandlers[t] || []).forEach(fn => fn.call(doc, ev || { type: t, key: '', target: doc.body })); };
  return doc;
}

module.exports = { Node, createDocument };
