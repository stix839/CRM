/* M2 CRM — front-end (no build step) */
(() => {
  'use strict';

  /* ================================================================ utilities */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } })();

  const ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    pipeline: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7v7"/><path d="M12 7v4"/><path d="M16 7v9"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    settings: '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    note: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    undo: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/>',
    trend: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    spark: '<path d="M12 3l1.9 5.8L20 10.7l-5.1 3.7L16.8 21 12 17.3 7.2 21l1.9-6.6L4 10.7l6.1-1.9z"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    upright: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    move: '<path d="M5 9l-3 3 3 3"/><path d="M19 9l3 3-3 3"/><path d="M2 12h20"/>',
  };
  const icon = (name, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  const OUTCOMES = {
    connected: 'Connected',
    no_answer: 'No answer',
    voicemail: 'Left voicemail',
    busy: 'Busy',
    wrong_number: 'Wrong number',
    callback: 'Call back later',
  };
  const DQ_REASONS = ['Not interested', 'Not a fit', 'Wrong number', 'Do not call', 'Unreachable', 'Duplicate', 'Bad timing', 'Other'];

  function digits(p) { return String(p || '').replace(/\D/g, ''); }
  // Pull the first phone-looking number out of text like "254-965-3000 (Stephenville)".
  function firstPhone(p) {
    const m = String(p || '').match(/\+?\d[\d\s().-]{5,}\d/);
    return m ? m[0].trim() : String(p || '').trim();
  }
  function phoneNote(p) {
    const raw = String(p || '').trim();
    const rest = raw.replace(firstPhone(raw), '').replace(/^[\s,;/–-]+|[\s,;/–-]+$/g, '').replace(/^\((.*)\)$/, '$1');
    return rest;
  }
  function fmtPhone(p) {
    if (!p) return '';
    p = firstPhone(p);
    let d = digits(p);
    if (d.length === 11 && d[0] === '1') d = d.slice(1);
    const raw = String(p).trim();
    const intl = raw.startsWith('+') && !raw.startsWith('+1');
    if (d.length === 10 && !intl) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    return String(p).trim();
  }
  function telHref(p) {
    if (/^\s*fax\b/i.test(String(p || ''))) return null;
    const raw = firstPhone(p);
    const d = digits(raw);
    if (!d) return null;
    if (raw.startsWith('+')) return `tel:+${d}`;
    if (d.length === 10) return `tel:+1${d}`;
    if (d.length === 11 && d[0] === '1') return `tel:+${d}`;
    return `tel:${d}`;
  }
  function leadName(l) {
    const n = [l.first_name, l.last_name].filter(Boolean).join(' ');
    return n || l.company || fmtPhone(l.phone) || l.email || 'Unnamed lead';
  }
  function leadSub(l) {
    const hasName = l.first_name || l.last_name;
    return [hasName ? l.company : null, l.title].filter(Boolean).join(' · ');
  }
  function initials(l) {
    const parts = leadName(l).replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean);
    return ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }
  function money(v, compact) {
    const n = Number(v);
    if (!Number.isFinite(n) || !v) return '';
    if (compact && n >= 1000) {
      return '$' + new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
    }
    return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  function relTime(ts) {
    if (!ts) return '';
    const s = (Date.now() - new Date(ts).getTime()) / 1000;
    if (s < 45) return 'just now';
    if (s < 3600) return `${Math.round(s / 60)}m ago`;
    if (s < 86400) return `${Math.round(s / 3600)}h ago`;
    if (s < 86400 * 7) return `${Math.round(s / 86400)}d ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: new Date(ts).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  }
  function fmtDateTime(ts) {
    return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function addDays(n) {
    const d = new Date(); d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function fmtDay(s) {
    if (!s) return '';
    const [y, m, d] = s.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const t = todayStr();
    if (s === t) return 'Today';
    if (s === addDays(1)) return 'Tomorrow';
    if (s === addDays(-1)) return 'Yesterday';
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function followUpChip(l) {
    if (!l.next_follow_up) return '';
    const due = l.next_follow_up <= todayStr();
    return `<span class="chip ${due ? 'dark' : 'outline'}">${icon('calendar')}${due && l.next_follow_up < todayStr() ? 'Overdue · ' : ''}${esc(fmtDay(l.next_follow_up))}</span>`;
  }

  async function api(path, opts = {}) {
    const init = { method: opts.method || 'GET', headers: {}, credentials: 'same-origin' };
    if (opts.body !== undefined) {
      if (opts.raw) {
        init.body = opts.body;
        init.headers['Content-Type'] = 'application/octet-stream';
      } else {
        init.body = JSON.stringify(opts.body);
        init.headers['Content-Type'] = 'application/json';
      }
    }
    const res = await fetch(path, init);
    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) data = await res.json();
    if (res.status === 401 && !path.startsWith('/api/login') && !path.startsWith('/api/me')) {
      state.user = null;
      renderAuth();
      throw new Error('Your session expired. Please sign in again.');
    }
    if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
    return data;
  }

  function toast(msg, opts = {}) {
    const el = document.createElement('div');
    el.className = 'toast' + (opts.error ? ' err' : '');
    el.innerHTML = `<span>${esc(msg)}</span>${opts.action ? `<button>${esc(opts.action)}</button>` : ''}`;
    if (opts.action) el.querySelector('button').onclick = () => { opts.onAction(); el.remove(); };
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), opts.duration || 3800);
  }
  const fail = (e) => toast(e.message || String(e), { error: true });

  const tip = {
    show(html, x, y) {
      const t = $('#tooltip');
      t.innerHTML = html;
      t.classList.add('show');
      const r = t.getBoundingClientRect();
      t.style.left = Math.min(window.innerWidth - r.width - 8, Math.max(8, x - r.width / 2)) + 'px';
      t.style.top = Math.max(8, y - r.height - 10) + 'px';
    },
    hide() { $('#tooltip').classList.remove('show'); },
  };

  /* ================================================================ state */

  const state = {
    user: null,
    stages: [],
    leads: [],          // active leads
    leadsLoaded: false,
    openLeadId: null,
    pipelineFilter: '',
    pipelineFollowOnly: false,
    colLimit: {},
    leadsView: { status: 'active', stage: '', q: '', sort: 'created_at', dir: 'desc', page: 0 },
    otherLeads: { disqualified: null, all: null },
  };

  async function loadLeads() {
    state.leads = await api('/api/leads?status=active');
    state.leadsLoaded = true;
    state.otherLeads = { disqualified: null, all: null };
    updateNavCounts();
  }

  function upsertLocal(lead) {
    const i = state.leads.findIndex((l) => l.id === lead.id);
    if (lead.status !== 'active') {
      if (i > -1) state.leads.splice(i, 1);
    } else if (i > -1) state.leads[i] = { ...state.leads[i], ...lead };
    else state.leads.push(lead);
    state.otherLeads = { disqualified: null, all: null };
    updateNavCounts();
  }

  function updateNavCounts() {
    const c = $('#nav-count-pipeline');
    if (c) c.textContent = state.leadsLoaded ? state.leads.length.toLocaleString() : '';
  }

  /* ================================================================ auth */

  function renderAuth(needsSetup) {
    closeDrawer(true);
    const app = $('#app');
    app.innerHTML = `
      <div class="auth">
        <div class="auth-side">
          <div style="display:flex;align-items:center;gap:12px"><div class="logo">M2</div><div style="font-weight:700;font-size:17px">M2 CRM</div></div>
          <div>
            <h2>Every lead.<br>Every call.<br>One pipeline.</h2>
            <p>Import your lists, work the phones, and move deals forward — with a clear view of what's happening at every stage.</p>
            <div class="mini-board"><div class="on"></div><div class="on"></div><div class="on"></div><div></div><div></div></div>
          </div>
          <div style="color:#52525b;font-size:12px">© ${new Date().getFullYear()} M2</div>
        </div>
        <div class="auth-main">
          <form class="auth-card" id="auth-form" autocomplete="on">
            <div class="logo" style="background:var(--black);color:#fff;width:44px;height:44px;border-radius:11px;font-size:16px;margin-bottom:6px">M2</div>
            <h1>${needsSetup ? 'Create your account' : 'Welcome back'}</h1>
            <p class="sub">${needsSetup ? 'Set up the owner login for your M2 workspace.' : 'Sign in to your M2 workspace.'}</p>
            <div id="auth-error"></div>
            ${needsSetup ? `<label class="field"><span>Your name</span><input class="input" name="name" required autocomplete="name"></label>` : ''}
            <label class="field"><span>Email</span><input class="input" name="email" type="email" required autocomplete="email"></label>
            <label class="field"><span>Password</span><input class="input" name="password" type="password" required minlength="${needsSetup ? 8 : 1}" autocomplete="${needsSetup ? 'new-password' : 'current-password'}">${needsSetup ? '<small class="muted">At least 8 characters.</small>' : ''}</label>
            <button class="btn primary" type="submit">${needsSetup ? 'Create account' : 'Sign in'} ${icon('arrow')}</button>
          </form>
        </div>
      </div>`;
    const form = $('#auth-form');
    form.querySelector('input').focus();
    form.onsubmit = async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      btn.disabled = true;
      const body = Object.fromEntries(new FormData(form));
      try {
        const res = await api(needsSetup ? '/api/setup' : '/api/login', { method: 'POST', body });
        state.user = res.user;
        await boot();
      } catch (err) {
        $('#auth-error').innerHTML = `<div class="form-error">${esc(err.message)}</div>`;
        btn.disabled = false;
      }
    };
  }

  /* ================================================================ shell + router */

  const ROUTES = {
    dashboard: { title: 'Dashboard', icon: 'dashboard', render: renderDashboard },
    pipeline: { title: 'Pipeline', icon: 'pipeline', render: renderPipeline },
    leads: { title: 'Leads', icon: 'users', render: renderLeads },
    import: { title: 'Import', icon: 'upload', render: renderImport },
    settings: { title: 'Settings', icon: 'settings', render: renderSettings },
  };

  function currentRoute() {
    const r = location.hash.replace(/^#\/?/, '').split('?')[0];
    return ROUTES[r] ? r : 'dashboard';
  }

  function renderShell() {
    const u = state.user;
    $('#app').innerHTML = `
      <div class="shell">
        <aside class="sidebar" id="sidebar">
          <a class="brand" href="#/dashboard"><div class="logo">M2</div><div><div class="brand-name">M2 CRM</div><div class="brand-sub">Call pipeline</div></div></a>
          <nav class="nav">
            ${Object.entries(ROUTES).map(([k, r]) => `<a href="#/${k}" data-route="${k}">${icon(r.icon)}<span>${r.title}</span>${k === 'pipeline' ? '<span class="count" id="nav-count-pipeline"></span>' : ''}</a>`).join('')}
          </nav>
          <div class="sidebar-foot">
            <div class="me">
              <div class="avatar">${esc(initials({ first_name: u.name }))}</div>
              <div style="min-width:0"><div class="me-name">${esc(u.name)}</div><div class="me-email">${esc(u.email)}</div></div>
              <button class="signout" id="signout" title="Sign out">${icon('logout')}</button>
            </div>
          </div>
        </aside>
        <div class="sidebar-scrim" id="sidebar-scrim"></div>
        <div class="main">
          <header class="topbar">
            <button class="btn ghost icon menu-btn" id="menu-btn" aria-label="Menu">${icon('menu')}</button>
            <h1 id="page-title"></h1>
            <div class="search">
              ${icon('search')}
              <input id="global-search" placeholder="Search leads…" autocomplete="off">
              <kbd>/</kbd>
              <div class="search-results hidden" id="search-results"></div>
            </div>
            <button class="btn primary add-btn" id="add-lead-btn">${icon('plus')}<span class="add-label">Add lead</span></button>
          </header>
          <main class="view" id="view"></main>
        </div>
      </div>
      <div class="dq-zone" id="dq-zone">${icon('ban')} Drop here to disqualify</div>`;

    $('#signout').onclick = async () => {
      await api('/api/logout', { method: 'POST' }).catch(() => {});
      state.user = null;
      location.hash = '';
      renderAuth(false);
    };
    $('#add-lead-btn').onclick = () => openAddLead();
    const sb = $('#sidebar');
    $('#menu-btn').onclick = () => { sb.classList.add('open'); $('#sidebar-scrim').classList.add('show'); };
    $('#sidebar-scrim').onclick = () => { sb.classList.remove('open'); $('#sidebar-scrim').classList.remove('show'); };
    $$('.nav a').forEach((a) => a.addEventListener('click', () => { sb.classList.remove('open'); $('#sidebar-scrim').classList.remove('show'); }));
    setupGlobalSearch();
    updateNavCounts();
  }

  let routeToken = 0;
  async function route() {
    if (!state.user) return;
    const r = currentRoute();
    const token = ++routeToken;
    $$('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === r));
    $('#page-title').textContent = ROUTES[r].title;
    document.title = `${ROUTES[r].title} · M2 CRM`;
    const view = $('#view');
    view.className = 'view' + (r === 'pipeline' ? ' board-view' : '');
    view.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    try {
      await ROUTES[r].render(view, () => token === routeToken);
    } catch (e) {
      if (token === routeToken) view.innerHTML = `<div class="empty"><h3>Couldn't load this page</h3><p>${esc(e.message)}</p></div>`;
    }
  }

  function rerenderIfOn(...routes) {
    const r = currentRoute();
    if (routes.includes(r)) {
      const view = $('#view');
      const scroll = view.scrollTop;
      const boardScroll = $('.board') ? $('.board').scrollLeft : 0;
      const colScrolls = $$('.col-body').map((c) => c.scrollTop);
      ROUTES[r].render(view, () => true, true);
      view.scrollTop = scroll;
      if ($('.board')) $('.board').scrollLeft = boardScroll;
      $$('.col-body').forEach((c, i) => { c.scrollTop = colScrolls[i] || 0; });
    }
  }

  /* ================================================================ global search */

  function setupGlobalSearch() {
    const input = $('#global-search');
    const box = $('#search-results');
    let sel = 0;
    let results = [];
    const render = () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { box.classList.add('hidden'); return; }
      const qd = digits(q);
      results = state.leads.filter((l) => matches(l, q, qd)).slice(0, 8);
      sel = Math.min(sel, Math.max(0, results.length - 1));
      box.innerHTML = results.length ? results.map((l, i) => `
        <div class="sr ${i === sel ? 'sel' : ''}" data-id="${l.id}">
          <div class="avatar" style="width:28px;height:28px;font-size:11px">${esc(initials(l))}</div>
          <div class="li-main"><div class="li-title">${esc(leadName(l))}</div><div class="li-sub">${esc([leadSub(l), fmtPhone(l.phone)].filter(Boolean).join(' · '))}</div></div>
          <span class="chip">${esc(state.stages[l.stage - 1])}</span>
        </div>`).join('') : '<div class="sr-empty">No active leads match.</div>';
      box.classList.remove('hidden');
    };
    input.addEventListener('input', () => { sel = 0; render(); });
    input.addEventListener('focus', render);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { sel = Math.min(results.length - 1, sel + 1); render(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); render(); e.preventDefault(); }
      if (e.key === 'Enter' && results[sel]) { openLead(results[sel].id); input.value = ''; box.classList.add('hidden'); input.blur(); }
      if (e.key === 'Escape') { input.value = ''; box.classList.add('hidden'); input.blur(); }
    });
    box.addEventListener('mousedown', (e) => {
      const r = e.target.closest('.sr[data-id]');
      if (!r) return;
      e.preventDefault();
      openLead(Number(r.dataset.id));
      input.value = '';
      box.classList.add('hidden');
      input.blur();
    });
    input.addEventListener('blur', () => setTimeout(() => box.classList.add('hidden'), 120));
  }

  function matches(l, q, qd) {
    if (!q) return true;
    const hay = [l.first_name, l.last_name, l.company, l.email, l.city, l.state, l.title, l.source].filter(Boolean).join(' ').toLowerCase();
    if (q.split(/\s+/).every((w) => hay.includes(w))) return true;
    return qd && qd.length >= 3 && digits(l.phone).includes(qd);
  }

  document.addEventListener('keydown', (e) => {
    if (!state.user) return;
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if (e.key === '/' && !typing) { e.preventDefault(); $('#global-search')?.focus(); }
    if (e.key === 'Escape') {
      if ($('.modal-wrap')) closeModal();
      else if (state.openLeadId) closeDrawer();
    }
  });

  /* ================================================================ dashboard */

  async function renderDashboard(view, alive) {
    const [a] = await Promise.all([api(`/api/analytics?tz=${encodeURIComponent(TZ)}`), state.leadsLoaded ? null : loadLeads()]);
    if (!alive()) return;
    const t = a.totals;
    const stageCount = (s) => (a.byStage.find((x) => x.stage === s) || { n: 0 }).n;
    const won = stageCount(5);
    const appts = stageCount(4);
    const connectRate = a.calls.logged_month ? Math.round((a.calls.connected_month / a.calls.logged_month) * 100) : null;
    const decided = won + t.disqualified;
    const winRate = decided ? Math.round((won / decided) * 100) : null;

    if (!t.total) {
      view.innerHTML = `
        <div class="dash">
          <div class="card"><div class="empty">
            <div class="ic">${icon('upload')}</div>
            <h3>Welcome to M2</h3>
            <p>Your pipeline is empty. Import a spreadsheet of leads or add your first one by hand.</p>
            <div style="display:flex;gap:8px;justify-content:center;margin-top:18px">
              <a class="btn primary" href="#/import">${icon('upload')} Import from Excel</a>
              <button class="btn" id="dash-add">${icon('plus')} Add a lead</button>
            </div>
          </div></div>
        </div>`;
      $('#dash-add').onclick = () => openAddLead();
      return;
    }

    const maxStage = Math.max(1, ...a.byStage.map((x) => x.n));
    const outcomeTotal = a.outcomes.reduce((s, o) => s + o.n, 0);
    const maxOutcome = Math.max(1, ...a.outcomes.map((o) => o.n));
    const maxDq = Math.max(1, ...a.dqReasons.map((o) => o.n));

    view.innerHTML = `
      <div class="dash">
        <div class="kpis">
          <div class="card kpi inverse">
            <div class="label">${icon('users')} Active leads</div>
            <div class="value tnum">${t.active.toLocaleString()}</div>
            <div class="foot"><b>+${t.new_7d.toLocaleString()}</b> added this week · <b>${t.never_called.toLocaleString()}</b> never called</div>
          </div>
          <div class="card kpi">
            <div class="label">${icon('phone')} Calls today</div>
            <div class="value tnum">${a.calls.today.toLocaleString()}</div>
            <div class="foot"><b>${a.calls.week.toLocaleString()}</b> in the last 7 days</div>
          </div>
          <div class="card kpi">
            <div class="label">${icon('target')} Connect rate</div>
            <div class="value tnum">${connectRate === null ? '—' : connectRate + '%'}</div>
            <div class="foot"><b>${a.calls.connected_month.toLocaleString()}</b> of ${a.calls.logged_month.toLocaleString()} logged calls · 30d</div>
          </div>
          <div class="card kpi">
            <div class="label">${icon('award')} ${esc(a.stages[4])}</div>
            <div class="value tnum">${won.toLocaleString()}</div>
            <div class="foot">${winRate === null ? 'No closed leads yet' : `<b>${winRate}%</b> win rate`} · <b>${appts.toLocaleString()}</b> ${esc(a.stages[3].toLowerCase())}</div>
          </div>
        </div>

        <div class="dash-row r2">
          <div class="card">
            <div class="card-h"><h3>Pipeline</h3><span class="sub">Active leads by stage</span><a class="btn sm right" href="#/pipeline">Open board ${icon('arrow')}</a></div>
            <div class="card-b">
              <div class="funnel">
                ${a.stages.map((name, i) => {
                  const n = stageCount(i + 1);
                  const pct = t.active ? Math.round((n / t.active) * 100) : 0;
                  const v = (a.byStage.find((x) => x.stage === i + 1) || {}).value;
                  return `<div class="funnel-row" data-stage="${i + 1}" data-tip="<b>${esc(name)}</b><br>${n.toLocaleString()} leads${v ? ' · ' + esc(money(v)) : ''}">
                    <div class="funnel-name"><span class="n">${i + 1}</span>${esc(name)}</div>
                    <div class="bar-track"><div class="bar-fill" style="width:${(n / maxStage) * 100}%"></div></div>
                    <div class="funnel-val tnum"><b>${n.toLocaleString()}</b><span>${pct}%</span></div>
                  </div>`;
                }).join('')}
              </div>
              <div style="display:flex;gap:24px;margin-top:18px;padding-top:14px;border-top:1px solid var(--line-2);font-size:13px;flex-wrap:wrap" class="muted">
                <span>Open pipeline value <b style="color:var(--ink)">${money(t.open_value) || '$0'}</b></span>
                <span>Won value <b style="color:var(--ink)">${money(t.won_value) || '$0'}</b></span>
                <span>Disqualified <b style="color:var(--ink)">${t.disqualified.toLocaleString()}</b></span>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-h"><h3>Call outcomes</h3><span class="sub">Last 30 days · ${outcomeTotal.toLocaleString()} calls</span></div>
            <div class="card-b">
              ${a.outcomes.length ? `<div class="hbars">${a.outcomes.map((o) => `
                <div class="hbar" data-tip="<b>${esc(OUTCOMES[o.outcome] || 'Outcome not logged')}</b><br>${o.n.toLocaleString()} calls · ${Math.round((o.n / outcomeTotal) * 100)}%">
                  <span>${esc(OUTCOMES[o.outcome] || 'Not logged')}</span>
                  <div class="bar-track"><div class="bar-fill" style="width:${(o.n / maxOutcome) * 100}%"></div></div>
                  <span class="v tnum">${o.n.toLocaleString()}</span>
                </div>`).join('')}</div>` : `<div class="empty" style="padding:28px 10px">No calls logged yet.<br>Click a phone number to start dialing.</div>`}
            </div>
          </div>
        </div>

        <div class="dash-row r2b">
          <div class="card">
            <div class="card-h"><h3>Calls per day</h3><span class="sub">Last 14 days</span></div>
            <div class="card-b">${colChart(a.callsDaily, 'calls')}</div>
          </div>
          <div class="card">
            <div class="card-h"><h3>New leads</h3><span class="sub">Last 30 days</span></div>
            <div class="card-b">${colChart(a.leadsDaily, 'leads')}</div>
          </div>
        </div>

        <div class="dash-row r3">
          <div class="card">
            <div class="card-h"><h3>Follow-ups</h3><span class="sub">Due within 7 days</span></div>
            <div class="card-b"><div class="list">
              ${a.followUps.length ? a.followUps.map((l) => `
                <div class="list-item" data-lead="${l.id}">
                  <div class="avatar light" style="width:30px;height:30px;font-size:11px">${esc(initials(l))}</div>
                  <div class="li-main"><div class="li-title">${esc(leadName(l))}</div><div class="li-sub">${esc(a.stages[l.stage - 1])}${l.phone ? ' · ' + esc(fmtPhone(l.phone)) : ''}</div></div>
                  ${followUpChip(l)}
                </div>`).join('') : '<div class="muted" style="padding:8px 0">Nothing scheduled. Set a follow-up date on any lead.</div>'}
            </div></div>
          </div>
          <div class="card">
            <div class="card-h"><h3>Recent activity</h3></div>
            <div class="card-b"><div class="list">
              ${a.recent.length ? a.recent.slice(0, 8).map((r) => `
                <div class="list-item" data-lead="${r.lead_id}">
                  <div class="dot-ic">${icon(activityIcon(r.type))}</div>
                  <div class="li-main"><div class="li-title">${esc(leadName(r))}</div><div class="li-sub">${esc(activityLabel(r))}</div></div>
                  <span class="li-time">${esc(relTime(r.created_at))}</span>
                </div>`).join('') : '<div class="muted" style="padding:8px 0">No activity yet.</div>'}
            </div></div>
          </div>
          <div class="card">
            <div class="card-h"><h3>Disqualified</h3><span class="sub">By reason</span>${t.disqualified ? '<a class="btn sm right" href="#/leads" id="see-dq">View</a>' : ''}</div>
            <div class="card-b">
              ${a.dqReasons.length ? `<div class="hbars">${a.dqReasons.map((o) => `
                <div class="hbar" data-tip="<b>${esc(o.reason)}</b><br>${o.n.toLocaleString()} leads">
                  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(o.reason)}</span>
                  <div class="bar-track"><div class="bar-fill" style="width:${(o.n / maxDq) * 100}%"></div></div>
                  <span class="v tnum">${o.n.toLocaleString()}</span>
                </div>`).join('')}</div>` : '<div class="muted" style="padding:8px 0">No disqualified leads.</div>'}
            </div>
          </div>
        </div>
      </div>`;

    view.querySelectorAll('[data-lead]').forEach((el) => el.addEventListener('click', () => openLead(Number(el.dataset.lead))));
    view.querySelectorAll('.funnel-row').forEach((el) => el.addEventListener('click', () => {
      state.leadsView = { ...state.leadsView, status: 'active', stage: el.dataset.stage, page: 0 };
      location.hash = '#/leads';
    }));
    const dq = $('#see-dq');
    if (dq) dq.addEventListener('click', () => { state.leadsView = { ...state.leadsView, status: 'disqualified', stage: '', page: 0 }; });
    bindTips(view);
  }

  function bindTips(root) {
    root.querySelectorAll('[data-tip]').forEach((el) => {
      el.addEventListener('mousemove', (e) => tip.show(el.dataset.tip, e.clientX, e.clientY));
      el.addEventListener('mouseleave', () => tip.hide());
    });
  }

  function colChart(series, unit) {
    const W = 600; const H = 180; const padL = 28; const padB = 22; const padT = 8;
    const max = Math.max(1, ...series.map((s) => s.n));
    const nice = max <= 4 ? 4 : Math.ceil(max / 4) * 4;
    const n = series.length;
    const step = (W - padL) / n;
    const bw = Math.max(4, Math.min(28, step * 0.62));
    const y = (v) => padT + (H - padT - padB) * (1 - v / nice);
    const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => {
      const v = Math.round(nice * f);
      return `<line class="gridline" x1="${padL}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text class="axis-label" x="${padL - 6}" y="${y(v) + 3.5}" text-anchor="end">${v}</text>`;
    }).join('');
    const labelEvery = n > 20 ? 5 : n > 10 ? 2 : 1;
    const bars = series.map((s, i) => {
      const x = padL + step * i + (step - bw) / 2;
      const h = Math.max(0, H - padB - y(s.n));
      const [yy, mm, dd] = s.day.split('-').map(Number);
      const label = new Date(yy, mm - 1, dd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const r = Math.min(4, bw / 2, h);
      const path = h > 0
        ? `M${x},${H - padB} V${H - padB - h + r} Q${x},${H - padB - h} ${x + r},${H - padB - h} H${x + bw - r} Q${x + bw},${H - padB - h} ${x + bw},${H - padB - h + r} V${H - padB} Z`
        : '';
      const show = (n - 1 - i) % labelEvery === 0;
      return `<g data-tip="<b>${esc(label)}</b><br>${s.n.toLocaleString()} ${unit}">
        <rect class="hit" x="${padL + step * i}" y="${padT}" width="${step}" height="${H - padT}"/>
        ${path ? `<path class="col" d="${path}"/>` : ''}
        ${show ? `<text class="axis-label" x="${x + bw / 2}" y="${H - 6}" text-anchor="middle">${esc(label)}</text>` : ''}
      </g>`;
    }).join('');
    const total = series.reduce((a, s) => a + s.n, 0);
    return `<div class="colchart"><div style="font-size:12.5px;margin:-6px 0 8px" class="muted"><b style="color:var(--ink);font-size:20px;letter-spacing:-.02em">${total.toLocaleString()}</b> total</div>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(unit)} per day">${grid}${bars}</svg></div>`;
  }

  function activityIcon(type) {
    return { call: 'phone', note: 'note', stage: 'move', disqualified: 'ban', requalified: 'undo', created: 'spark' }[type] || 'spark';
  }
  function activityLabel(a) {
    if (a.type === 'call') return a.outcome ? `Call · ${OUTCOMES[a.outcome]}` : 'Called';
    if (a.type === 'note') return 'Note: ' + (a.body || '').slice(0, 80);
    if (a.type === 'stage') return a.body || 'Stage changed';
    if (a.type === 'disqualified') return `Disqualified · ${(a.meta && a.meta.reason) || ''}`.replace(/ · $/, '');
    if (a.type === 'requalified') return 'Restored to pipeline';
    return a.body || 'Created';
  }

  /* ================================================================ pipeline board */

  const COL_PAGE = 60;

  async function renderPipeline(view, alive, fromCache) {
    if (!fromCache || !state.leadsLoaded) await loadLeads();
    if (!alive()) return;
    const q = state.pipelineFilter.trim().toLowerCase();
    const qd = digits(q);
    const today = todayStr();
    const visible = state.leads.filter((l) => matches(l, q, qd) && (!state.pipelineFollowOnly || (l.next_follow_up && l.next_follow_up <= today)));
    const byStage = [1, 2, 3, 4, 5].map((s) => visible.filter((l) => l.stage === s));
    const total = state.leads.length;

    view.innerHTML = `
      <div class="board-toolbar">
        <div class="filter-input">${icon('search')}<input class="input" id="board-filter" placeholder="Filter cards…" value="${esc(state.pipelineFilter)}"></div>
        <label class="check" style="font-size:13px;font-weight:500"><input type="checkbox" id="follow-only" ${state.pipelineFollowOnly ? 'checked' : ''}> Follow-ups due</label>
        <span class="stat" style="margin-left:auto"><b>${visible.length.toLocaleString()}</b>${visible.length !== total ? ` of ${total.toLocaleString()}` : ''} active leads · drag cards between stages</span>
      </div>
      <div class="board" id="board">
        ${byStage.map((list, i) => {
          const s = i + 1;
          const limit = state.colLimit[s] || COL_PAGE;
          const val = list.reduce((a, l) => a + (Number(l.value) || 0), 0);
          return `<section class="column" data-stage="${s}">
            <div class="col-head"><span class="col-num">${s}</span><span class="col-title">${esc(state.stages[i])}</span><span class="col-count tnum">${list.length.toLocaleString()}</span></div>
            <div class="col-meta">${val ? esc(money(val)) + ' in pipeline' : ''}</div>
            <div class="col-body" data-stage="${s}">
              ${list.length ? list.slice(0, limit).map(cardHtml).join('') : `<div class="col-empty">${q || state.pipelineFollowOnly ? 'No matches' : 'Drop leads here'}</div>`}
              ${list.length > limit ? `<button class="btn sm block col-more" data-more="${s}">Show ${Math.min(COL_PAGE, list.length - limit).toLocaleString()} more</button>` : ''}
            </div>
          </section>`;
        }).join('')}
      </div>`;

    const filter = $('#board-filter');
    let ft;
    filter.addEventListener('input', () => {
      clearTimeout(ft);
      ft = setTimeout(() => {
        state.pipelineFilter = filter.value;
        rerenderIfOn('pipeline');
        const f = $('#board-filter'); f.focus(); f.setSelectionRange(f.value.length, f.value.length);
      }, 150);
    });
    $('#follow-only').onchange = (e) => { state.pipelineFollowOnly = e.target.checked; rerenderIfOn('pipeline'); };
    $$('[data-more]', view).forEach((b) => b.addEventListener('click', () => {
      const s = Number(b.dataset.more);
      state.colLimit[s] = (state.colLimit[s] || COL_PAGE) + COL_PAGE;
      rerenderIfOn('pipeline');
    }));
    enableDrag($('#board'));
  }

  function cardHtml(l) {
    const tel = telHref(l.phone);
    const sub = leadSub(l);
    return `<article class="lead-card" data-id="${l.id}">
      <div class="lc-top">
        <div class="lc-main"><div class="lc-name">${esc(leadName(l))}</div>${sub ? `<div class="lc-co">${esc(sub)}</div>` : ''}</div>
        ${l.value && Number(l.value) ? `<span class="lc-value tnum">${esc(money(l.value, true))}</span>` : ''}
      </div>
      ${tel ? `<a class="lc-phone tnum" href="${esc(tel)}" data-call="${l.id}">${icon('phone')}${esc(fmtPhone(l.phone))}</a>` : ''}
      <div class="lc-meta">
        ${l.call_count ? `<span class="chip">${icon('phone')}${l.call_count}</span>` : '<span class="chip outline">New</span>'}
        ${l.last_contacted_at ? `<span class="chip">${icon('clock')}${esc(relTime(l.last_contacted_at))}</span>` : ''}
        ${followUpChip(l)}
      </div>
    </article>`;
  }

  /* Pointer-based drag & drop that works with mouse and touch (long-press on touch). */
  function enableDrag(board) {
    let drag = null;

    board.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const card = e.target.closest('.lead-card');
      if (!card || e.target.closest('a,button')) return;
      const start = { x: e.clientX, y: e.clientY };
      const isTouch = e.pointerType !== 'mouse';
      drag = { card, start, isTouch, active: false, pointerId: e.pointerId, timer: null };
      if (isTouch) {
        drag.timer = setTimeout(() => { if (drag && !drag.active) beginDrag(e.clientX, e.clientY); }, 260);
      }
    });

    const onMove = (e) => {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const dx = e.clientX - drag.start.x;
      const dy = e.clientY - drag.start.y;
      if (!drag.active) {
        if (drag.isTouch) {
          if (Math.hypot(dx, dy) > 8) { clearTimeout(drag.timer); drag = null; }
          return;
        }
        if (Math.hypot(dx, dy) < 5) return;
        beginDrag(e.clientX, e.clientY);
      }
      e.preventDefault();
      moveDrag(e.clientX, e.clientY);
    };

    const onUp = (e) => {
      if (!drag || e.pointerId !== drag.pointerId) return;
      clearTimeout(drag.timer);
      if (!drag.active) {
        const id = Number(drag.card.dataset.id);
        drag = null;
        if (e.type === 'pointerup') openLead(id);
        return;
      }
      endDrag(e.type === 'pointercancel');
    };

    function beginDrag(x, y) {
      const card = drag.card;
      const rect = card.getBoundingClientRect();
      drag.active = true;
      drag.offset = { x: x - rect.left, y: y - rect.top };
      drag.fromStage = Number(card.closest('.col-body').dataset.stage);
      const ghost = card.cloneNode(true);
      ghost.classList.add('ghost');
      ghost.style.width = rect.width + 'px';
      document.body.appendChild(ghost);
      drag.ghost = ghost;
      const ph = document.createElement('div');
      ph.className = 'placeholder';
      ph.style.height = rect.height + 'px';
      card.after(ph);
      drag.placeholder = ph;
      card.classList.add('dragging-src');
      document.body.classList.add('is-dragging');
      $('#dq-zone').classList.add('show');
      if (navigator.vibrate && drag.isTouch) navigator.vibrate(15);
      moveDrag(x, y);
    }

    function moveDrag(x, y) {
      drag.ghost.style.left = x - drag.offset.x + 'px';
      drag.ghost.style.top = y - drag.offset.y + 'px';
      drag.last = { x, y };
      const zone = $('#dq-zone');
      const zr = zone.getBoundingClientRect();
      const overDq = x >= zr.left && x <= zr.right && y >= zr.top && y <= zr.bottom;
      zone.classList.toggle('over', overDq);
      drag.overDq = overDq;
      $$('.column', board).forEach((c) => c.classList.remove('drop-target'));
      if (overDq) { drag.placeholder.style.display = 'none'; return; }
      drag.placeholder.style.display = '';
      const col = columnAt(x);
      if (!col) return;
      col.classList.add('drop-target');
      const body = col.querySelector('.col-body');
      const cards = $$('.lead-card:not(.dragging-src)', body);
      let before = null;
      for (const c of cards) {
        const r = c.getBoundingClientRect();
        if (y < r.top + r.height / 2) { before = c; break; }
      }
      const empty = body.querySelector('.col-empty');
      if (empty) empty.style.display = 'none';
      if (before) body.insertBefore(drag.placeholder, before);
      else {
        const more = body.querySelector('.col-more');
        if (more) body.insertBefore(drag.placeholder, more); else body.appendChild(drag.placeholder);
      }
      autoScroll(x, y, body);
    }

    function columnAt(x) {
      return $$('.column', board).find((c) => {
        const r = c.getBoundingClientRect();
        return x >= r.left - 7 && x <= r.right + 7;
      });
    }

    let scrollRaf = null;
    function autoScroll(x, y, body) {
      cancelAnimationFrame(scrollRaf);
      const br = board.getBoundingClientRect();
      const cr = body.getBoundingClientRect();
      let sx = 0; let sy = 0;
      if (x < br.left + 60) sx = -14; else if (x > br.right - 60) sx = 14;
      if (y < cr.top + 50) sy = -12; else if (y > cr.bottom - 50) sy = 12;
      if (!sx && !sy) return;
      const tick = () => {
        if (!drag || !drag.active) return;
        board.scrollLeft += sx;
        body.scrollTop += sy;
        scrollRaf = requestAnimationFrame(tick);
      };
      scrollRaf = requestAnimationFrame(tick);
    }

    async function endDrag(cancelled) {
      cancelAnimationFrame(scrollRaf);
      const d = drag;
      drag = null;
      d.ghost.remove();
      document.body.classList.remove('is-dragging');
      $('#dq-zone').classList.remove('show', 'over');
      $$('.column', board).forEach((c) => c.classList.remove('drop-target'));
      const id = Number(d.card.dataset.id);
      const lead = state.leads.find((l) => l.id === id);

      if (cancelled || !lead) { d.placeholder.remove(); d.card.classList.remove('dragging-src'); return; }

      if (d.overDq) {
        d.placeholder.remove();
        d.card.classList.remove('dragging-src');
        openDisqualify(lead);
        return;
      }
      const body = d.placeholder.parentElement;
      if (!body || !body.classList.contains('col-body')) { d.placeholder.remove(); d.card.classList.remove('dragging-src'); return; }
      const toStage = Number(body.dataset.stage);
      let next = d.placeholder.nextElementSibling;
      while (next && !next.classList.contains('lead-card')) next = next.nextElementSibling;
      const beforeId = next ? Number(next.dataset.id) : null;
      d.placeholder.replaceWith(d.card);
      d.card.classList.remove('dragging-src');

      // optimistic local update
      const prevStage = lead.stage;
      lead.stage = toStage;
      reorderLocal(lead, beforeId);
      rerenderIfOn('pipeline');
      try {
        const updated = await api(`/api/leads/${id}/move`, { method: 'POST', body: { stage: toStage, beforeId } });
        Object.assign(lead, updated);
        if (prevStage !== toStage) {
          toast(`Moved to ${state.stages[toStage - 1]}`, {
            action: 'Undo',
            onAction: async () => {
              const u = await api(`/api/leads/${id}/move`, { method: 'POST', body: { stage: prevStage } }).catch(fail);
              if (u) { Object.assign(lead, u); sortLocal(); rerenderIfOn('pipeline'); refreshDrawerIf(id); }
            },
          });
        }
        refreshDrawerIf(id);
      } catch (err) {
        fail(err);
        await loadLeads();
        rerenderIfOn('pipeline');
      }
    }

    window.addEventListener('pointermove', onMoveWindow, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    board.addEventListener('touchmove', (e) => { if (drag && drag.active) e.preventDefault(); }, { passive: false });
    board.addEventListener('contextmenu', (e) => { if (drag) e.preventDefault(); });
    board.addEventListener('click', (e) => {
      const call = e.target.closest('[data-call]');
      if (call) recordDial(Number(call.dataset.call));
    });

    function onMoveWindow(e) {
      if (!board.isConnected) {
        window.removeEventListener('pointermove', onMoveWindow);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        return;
      }
      onMove(e);
    }
  }

  function reorderLocal(lead, beforeId) {
    const same = state.leads.filter((l) => l.stage === lead.stage && l.id !== lead.id).sort((a, b) => a.position - b.position);
    const idx = beforeId ? same.findIndex((l) => l.id === beforeId) : -1;
    if (idx === -1) lead.position = (same.length ? same[same.length - 1].position : 0) + 1;
    else {
      const prev = same[idx - 1];
      lead.position = ((prev ? prev.position : same[idx].position - 1) + same[idx].position) / 2;
    }
    sortLocal();
  }
  function sortLocal() { state.leads.sort((a, b) => a.stage - b.stage || a.position - b.position || a.id - b.id); }

  /* ================================================================ calls */

  async function recordDial(id) {
    try {
      const act = await api(`/api/leads/${id}/activities`, { method: 'POST', body: { type: 'call' } });
      const lead = state.leads.find((l) => l.id === id);
      if (lead) { lead.call_count = (lead.call_count || 0) + 1; lead.last_contacted_at = act.created_at; }
      if (state.openLeadId === id) refreshDrawerIf(id);
      else openLead(id);
      rerenderIfOn('pipeline', 'leads');
    } catch (e) { fail(e); }
  }

  /* ================================================================ leads table */

  async function renderLeads(view, alive, fromCache) {
    const v = state.leadsView;
    let rows;
    if (v.status === 'active') {
      if (!fromCache || !state.leadsLoaded) await loadLeads();
      rows = state.leads;
    } else {
      if (!state.otherLeads[v.status] || !fromCache) state.otherLeads[v.status] = await api(`/api/leads?status=${v.status}`);
      rows = state.otherLeads[v.status];
    }
    if (!alive()) return;
    const q = v.q.trim().toLowerCase();
    const qd = digits(q);
    let list = rows.filter((l) => matches(l, q, qd) && (!v.stage || String(l.stage) === String(v.stage)));
    const key = v.sort;
    const dir = v.dir === 'asc' ? 1 : -1;
    const val = (l) => {
      if (key === 'name') return leadName(l).toLowerCase();
      if (key === 'company') return (l.company || '').toLowerCase();
      if (key === 'stage') return l.stage;
      if (key === 'call_count') return l.call_count || 0;
      if (key === 'value') return Number(l.value) || 0;
      if (key === 'next_follow_up') return l.next_follow_up || '9999';
      return l[key] ? new Date(l[key]).getTime() : 0;
    };
    list = list.slice().sort((a, b) => {
      const x = val(a); const y = val(b);
      return (x < y ? -1 : x > y ? 1 : 0) * dir || b.id - a.id;
    });
    const PER = 50;
    const pages = Math.max(1, Math.ceil(list.length / PER));
    v.page = Math.min(v.page, pages - 1);
    const pageRows = list.slice(v.page * PER, v.page * PER + PER);
    const th = (k, label, nosort) => `<th ${nosort ? 'class="nosort"' : `data-sort="${k}"`}>${label}${v.sort === k ? `<span class="arrow">${v.dir === 'asc' ? '▲' : '▼'}</span>` : ''}</th>`;

    view.innerHTML = `
      <div style="max-width:1400px;margin:0 auto">
        <div class="toolbar">
          <div class="seg" id="status-seg">
            ${['active', 'disqualified', 'all'].map((s) => `<button data-s="${s}" class="${v.status === s ? 'on' : ''}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}
          </div>
          <div class="filter-input">${icon('search')}<input class="input" id="leads-q" placeholder="Search leads…" value="${esc(v.q)}"></div>
          <select class="select" id="leads-stage" style="width:auto;height:34px">
            <option value="">All stages</option>
            ${state.stages.map((s, i) => `<option value="${i + 1}" ${String(v.stage) === String(i + 1) ? 'selected' : ''}>${esc(s)}</option>`).join('')}
          </select>
          <span class="spacer"></span>
          <a class="btn sm" href="/api/export.csv">${icon('download')} Export CSV</a>
        </div>
        <div class="card">
          ${list.length ? `
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr>
                ${th('name', 'Name')}${th('company', 'Company')}${th('phone', 'Phone', true)}${th('stage', 'Stage')}
                ${v.status !== 'active' ? th('dq', 'Status', true) : ''}
                ${th('call_count', 'Calls')}${th('last_contacted_at', 'Last contacted')}${th('next_follow_up', 'Follow-up')}${th('created_at', 'Added')}
              </tr></thead>
              <tbody>
                ${pageRows.map((l) => {
                  const tel = telHref(l.phone);
                  return `<tr data-id="${l.id}">
                    <td><div class="name-cell"><div class="avatar ${l.status === 'disqualified' ? 'light' : ''}">${esc(initials(l))}</div><span style="overflow:hidden;text-overflow:ellipsis">${esc(leadName(l))}</span></div></td>
                    <td>${esc(l.first_name || l.last_name ? l.company || '' : '')}</td>
                    <td>${tel ? `<a class="tel tnum" href="${esc(tel)}" data-call="${l.id}">${icon('phone')}${esc(fmtPhone(l.phone))}</a>` : '<span class="muted">—</span>'}</td>
                    <td><span class="chip">${l.stage}. ${esc(state.stages[l.stage - 1])}</span></td>
                    ${v.status !== 'active' ? `<td>${l.status === 'disqualified' ? `<span class="chip dark">${icon('ban')}${esc(l.dq_reason || 'Disqualified')}</span>` : '<span class="chip outline">Active</span>'}</td>` : ''}
                    <td class="tnum">${l.call_count || 0}</td>
                    <td class="muted">${esc(relTime(l.last_contacted_at)) || '—'}</td>
                    <td>${followUpChip(l) || '<span class="muted">—</span>'}</td>
                    <td class="muted">${esc(relTime(l.created_at))}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div class="pager">
            <span>${(v.page * PER + 1).toLocaleString()}–${Math.min(list.length, v.page * PER + PER).toLocaleString()} of ${list.length.toLocaleString()}</span>
            <div style="display:flex;gap:6px">
              <button class="btn sm icon" id="pg-prev" ${v.page === 0 ? 'disabled' : ''} aria-label="Previous page">${icon('left')}</button>
              <button class="btn sm icon" id="pg-next" ${v.page >= pages - 1 ? 'disabled' : ''} aria-label="Next page">${icon('right')}</button>
            </div>
          </div>` : `
          <div class="empty">
            <div class="ic">${icon(v.status === 'disqualified' ? 'ban' : 'users')}</div>
            <h3>${rows.length ? 'No leads match your filters' : v.status === 'disqualified' ? 'No disqualified leads' : 'No leads yet'}</h3>
            <p>${rows.length ? 'Try a different search or stage.' : v.status === 'disqualified' ? 'Leads you disqualify will show up here, and can be restored any time.' : 'Import a spreadsheet to get started.'}</p>
            ${!rows.length && v.status !== 'disqualified' ? `<a class="btn primary" href="#/import" style="margin-top:14px">${icon('upload')} Import leads</a>` : ''}
          </div>`}
        </div>
      </div>`;

    $$('#status-seg button').forEach((b) => b.onclick = () => { v.status = b.dataset.s; v.page = 0; route(); });
    const qi = $('#leads-q');
    let t;
    qi.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        v.q = qi.value; v.page = 0;
        rerenderIfOn('leads');
        const f = $('#leads-q'); f.focus(); f.setSelectionRange(f.value.length, f.value.length);
      }, 150);
    });
    $('#leads-stage').onchange = (e) => { v.stage = e.target.value; v.page = 0; rerenderIfOn('leads'); };
    $$('th[data-sort]', view).forEach((h) => h.onclick = () => {
      const k = h.dataset.sort;
      if (v.sort === k) v.dir = v.dir === 'asc' ? 'desc' : 'asc';
      else { v.sort = k; v.dir = ['name', 'company', 'stage', 'next_follow_up'].includes(k) ? 'asc' : 'desc'; }
      rerenderIfOn('leads');
    });
    if ($('#pg-prev')) {
      $('#pg-prev').onclick = () => { v.page--; rerenderIfOn('leads'); $('#view').scrollTop = 0; };
      $('#pg-next').onclick = () => { v.page++; rerenderIfOn('leads'); $('#view').scrollTop = 0; };
    }
    $$('tbody tr', view).forEach((tr) => tr.addEventListener('click', (e) => {
      const call = e.target.closest('[data-call]');
      if (call) { recordDial(Number(call.dataset.call)); return; }
      openLead(Number(tr.dataset.id));
    }));
  }

  /* ================================================================ lead drawer */

  let drawerSeq = 0;

  async function openLead(id) {
    state.openLeadId = id;
    let scrim = $('.scrim');
    let drawer = $('.drawer');
    if (!drawer) {
      scrim = document.createElement('div'); scrim.className = 'scrim';
      drawer = document.createElement('aside'); drawer.className = 'drawer';
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-modal', 'true');
      document.body.append(scrim, drawer);
      scrim.onclick = () => closeDrawer();
      requestAnimationFrame(() => { scrim.classList.add('show'); drawer.classList.add('show'); });
      drawer.innerHTML = '<div class="loading" style="flex:1"><div class="spinner"></div></div>';
    }
    await loadDrawer(id);
  }

  function closeDrawer(instant) {
    state.openLeadId = null;
    state.drawerEdit = false;
    const scrim = $('.scrim'); const drawer = $('.drawer');
    if (!drawer) return;
    if (instant) { scrim.remove(); drawer.remove(); return; }
    scrim.classList.remove('show'); drawer.classList.remove('show');
    setTimeout(() => { scrim.remove(); drawer.remove(); }, 220);
  }

  function refreshDrawerIf(id) { if (state.openLeadId === id) loadDrawer(id); }

  async function loadDrawer(id) {
    const seq = ++drawerSeq;
    let data;
    try { data = await api(`/api/leads/${id}`); } catch (e) { fail(e); closeDrawer(); return; }
    if (seq !== drawerSeq || state.openLeadId !== id) return;
    renderDrawer(data.lead, data.activities);
  }

  function renderDrawer(lead, activities) {
    const drawer = $('.drawer');
    if (!drawer) return;
    const scroll = $('.drawer-body') && drawer.dataset.lead === String(lead.id) ? $('.drawer-body').scrollTop : 0;
    drawer.dataset.lead = lead.id;
    const tel = telHref(lead.phone);
    const tel2 = telHref(lead.phone_alt);
    const isDq = lead.status === 'disqualified';
    const recentCall = activities.find((a) => a.type === 'call');
    const pending = recentCall && !recentCall.outcome && (Date.now() - new Date(recentCall.created_at).getTime() < 6 * 3600 * 1000) ? recentCall : null;
    const extra = Object.entries(lead.extra || {});
    const edit = state.drawerEdit;
    const sub = leadSub(lead);

    const infoCell = (k, v, opts = {}) => `<div class="info ${opts.span ? 'span-2' : ''}"><div class="k">${esc(k)}</div><div class="v ${v ? '' : 'empty-v'}">${v || '—'}</div></div>`;
    const field = (name, label, type = 'text', span) => `<label class="field ${span ? 'span-2' : ''}"><span>${label}</span><input class="input" name="${name}" type="${type}" value="${esc(lead[name] ?? '')}"></label>`;
    const website = lead.website ? (/^https?:\/\//i.test(lead.website) ? lead.website : 'https://' + lead.website) : null;

    drawer.innerHTML = `
      <div class="drawer-head">
        <div class="drawer-title">
          <div class="avatar lg ${isDq ? 'light' : ''}">${esc(initials(lead))}</div>
          <div style="min-width:0">
            <h2>${esc(leadName(lead))}</h2>
            <div class="sub">${esc(sub || (lead.city || lead.state ? [lead.city, lead.state].filter(Boolean).join(', ') : 'Lead #' + lead.id))}</div>
          </div>
          <button class="btn ghost icon close" id="drawer-close" aria-label="Close">${icon('x')}</button>
        </div>
        ${isDq ? `
          <div class="dq-banner">${icon('ban')}<div><div class="t">Disqualified · ${esc(lead.dq_reason || 'Other')}</div><div class="s">${esc(relTime(lead.dq_at))} · was in ${esc(state.stages[lead.stage - 1])}</div></div>
            <button class="btn sm" id="requalify">${icon('undo')} Restore</button></div>` : `
          <div class="stepper">
            ${state.stages.map((s, i) => `<button class="step ${lead.stage === i + 1 ? 'current' : lead.stage > i + 1 ? 'done' : ''}" data-stage="${i + 1}" title="${esc(s)}">${esc(s)}</button>`).join('')}
          </div>`}
      </div>
      <div class="drawer-body">
        <div class="call-panel">
          <a class="call-btn ${tel ? '' : 'disabled'}" ${tel ? `href="${esc(tel)}"` : ''} id="call-main">
            <span class="ring">${icon('phone')}</span>
            <span><small>${tel ? 'Tap to call' : 'No phone number'}</small><span class="tnum">${tel ? esc(fmtPhone(lead.phone)) : 'Add a number to call'}</span>${tel && phoneNote(lead.phone) ? `<small>${esc(phoneNote(lead.phone))}</small>` : ''}</span>
            ${tel ? `<span class="arrow">${icon('upright')}</span>` : ''}
          </a>
          ${tel2 ? `<a class="btn sm" style="align-self:flex-start" href="${esc(tel2)}" id="call-alt">${icon('phone')} Alt: ${esc(fmtPhone(lead.phone_alt))}${phoneNote(lead.phone_alt) ? ` <span class="muted" style="font-weight:500">· ${esc(phoneNote(lead.phone_alt))}</span>` : ''}</a>` : lead.phone_alt ? `<div class="muted" style="font-size:12.5px">Other: ${esc(lead.phone_alt)}</div>` : ''}
          <div>
            <div class="outcome-q">${pending ? 'How did the call go?' : 'Log a call outcome'}</div>
            <div class="outcomes" style="margin-top:8px">
              ${Object.entries(OUTCOMES).map(([k, v]) => `<button data-outcome="${k}">${esc(v)}</button>`).join('')}
            </div>
          </div>
          <div class="call-stats">
            <span><b>${lead.call_count || 0}</b> call${lead.call_count === 1 ? '' : 's'}</span>
            <span>Last contact <b>${esc(relTime(lead.last_contacted_at) || 'never')}</b></span>
            <span style="display:flex;align-items:center;gap:6px">Follow-up
              <input type="date" class="input" id="followup" value="${esc(lead.next_follow_up || '')}" style="height:28px;width:auto;padding:0 6px;font-size:12.5px">
            </span>
          </div>
        </div>

        <div>
          <div class="section-h"><h4>Details</h4>
            <div class="right">${edit ? '' : `<button class="btn sm ghost" id="edit-lead">${icon('edit')} Edit</button>`}</div>
          </div>
          ${edit ? `
            <form id="edit-form" class="grid-2">
              ${field('first_name', 'First name')}${field('last_name', 'Last name')}
              ${field('company', 'Company')}${field('title', 'Job title')}
              ${field('phone', 'Phone', 'tel')}${field('phone_alt', 'Alt. phone', 'tel')}
              ${field('email', 'Email', 'email')}${field('website', 'Website')}
              ${field('address', 'Address', 'text', true)}
              ${field('city', 'City')}${field('state', 'State')}
              ${field('zip', 'Zip')}${field('source', 'Source')}
              ${field('value', 'Deal value ($)', 'number')}
              <label class="field span-2"><span>Background notes</span><textarea class="textarea" name="notes">${esc(lead.notes || '')}</textarea></label>
              <div class="span-2" style="display:flex;gap:8px;justify-content:flex-end">
                <button type="button" class="btn" id="cancel-edit">Cancel</button>
                <button type="submit" class="btn primary">${icon('check')} Save changes</button>
              </div>
            </form>` : `
            <div class="info-grid">
              ${infoCell('Company', esc(lead.company))}
              ${infoCell('Job title', esc(lead.title))}
              ${infoCell('Phone', tel ? `<a href="${esc(tel)}" data-dial>${esc(fmtPhone(lead.phone))}</a>` : '')}
              ${infoCell('Email', lead.email ? lead.email.split(/[;,\s]+/).filter(Boolean).map((e) => `<a href="mailto:${esc(e)}">${esc(e)}</a>`).join('<br>') : '')}
              ${infoCell('Location', esc([lead.address, lead.city, [lead.state, lead.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')), { span: true })}
              ${infoCell('Website', website ? `<a href="${esc(website)}" target="_blank" rel="noopener">${esc(lead.website)}</a>` : '')}
              ${infoCell('Source', esc(lead.source))}
              ${infoCell('Deal value', esc(money(lead.value)))}
              ${infoCell('Added', esc(new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })))}
              ${lead.notes ? infoCell('Background notes', esc(lead.notes), { span: true }) : ''}
            </div>`}
        </div>

        ${extra.length ? `
        <div>
          <div class="section-h"><h4>More info</h4><span class="muted" style="font-size:12px">from your spreadsheet</span></div>
          <div class="info-grid">${extra.map(([k, v]) => infoCell(k, linkify(v))).join('')}${extra.length % 2 ? '<div class="info"></div>' : ''}</div>
        </div>` : ''}

        <div>
          <div class="section-h"><h4>Activity</h4></div>
          <div class="composer">
            <textarea id="note-input" placeholder="Add a note about this lead…" rows="2"></textarea>
            <div class="composer-foot"><span class="hint">Ctrl + Enter to save</span><button class="btn sm primary" id="add-note" style="margin-left:auto">Add note</button></div>
          </div>
          <div class="timeline" style="margin-top:18px">
            ${activities.map((a) => `
              <div class="tl-item">
                <div class="tl-ic ${a.type === 'call' || a.type === 'disqualified' ? 'dark' : ''}">${icon(activityIcon(a.type))}</div>
                <div class="tl-main">
                  <div class="tl-head"><b>${esc(activityTitle(a))}</b><span class="tl-time" title="${esc(fmtDateTime(a.created_at))}">${esc(relTime(a.created_at))}${a.user_name ? ' · ' + esc(a.user_name) : ''}</span>
                    ${a.type === 'note' || a.type === 'call' ? `<button class="tl-del" data-del="${a.id}" title="Delete">${icon('trash')}</button>` : ''}
                  </div>
                  ${a.type === 'note' && a.body ? `<div class="tl-body">${esc(a.body)}</div>` : ''}
                  ${a.type === 'disqualified' && a.body ? `<div class="tl-body">${esc(a.body)}</div>` : ''}
                  ${a.type === 'stage' || a.type === 'created' ? `<div class="tl-time" style="margin-top:2px">${esc(a.body || '')}</div>` : ''}
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>
      <div class="drawer-foot">
        ${isDq ? '' : `<button class="btn" id="dq-btn">${icon('ban')} Disqualify</button>`}
        <button class="btn ghost danger" id="del-btn" style="margin-left:auto">${icon('trash')} Delete</button>
      </div>`;

    $('.drawer-body').scrollTop = scroll;
    $('#drawer-close').onclick = () => closeDrawer();

    $$('.step', drawer).forEach((b) => b.onclick = async () => {
      const s = Number(b.dataset.stage);
      if (s === lead.stage) return;
      try {
        const u = await api(`/api/leads/${lead.id}/move`, { method: 'POST', body: { stage: s } });
        upsertLocal(u); sortLocal();
        toast(`Moved to ${state.stages[s - 1]}`);
        rerenderIfOn('pipeline', 'leads');
        loadDrawer(lead.id);
      } catch (e) { fail(e); }
    });

    const onDial = () => recordDialFromDrawer(lead.id);
    if (tel) $('#call-main').addEventListener('click', onDial);
    if ($('#call-alt')) $('#call-alt').addEventListener('click', onDial);
    $$('[data-dial]', drawer).forEach((a) => a.addEventListener('click', onDial));

    $$('[data-outcome]', drawer).forEach((b) => b.onclick = async () => {
      try {
        if (pending) await api(`/api/activities/${pending.id}`, { method: 'PATCH', body: { outcome: b.dataset.outcome } });
        else {
          const act = await api(`/api/leads/${lead.id}/activities`, { method: 'POST', body: { type: 'call', outcome: b.dataset.outcome } });
          const l = state.leads.find((x) => x.id === lead.id);
          if (l) { l.call_count = (l.call_count || 0) + 1; l.last_contacted_at = act.created_at; }
        }
        toast(`Call logged · ${OUTCOMES[b.dataset.outcome]}`);
        if (b.dataset.outcome === 'wrong_number') {
          toast('Wrong number — disqualify this lead?', { action: 'Disqualify', duration: 7000, onAction: () => openDisqualify(lead, 'Wrong number') });
        }
        rerenderIfOn('pipeline', 'leads');
        loadDrawer(lead.id);
      } catch (e) { fail(e); }
    });

    $('#followup').onchange = async (e) => {
      try {
        const u = await api(`/api/leads/${lead.id}`, { method: 'PATCH', body: { next_follow_up: e.target.value || null } });
        upsertLocal(u);
        toast(e.target.value ? `Follow-up set for ${fmtDay(e.target.value)}` : 'Follow-up cleared');
        rerenderIfOn('pipeline', 'leads');
      } catch (err) { fail(err); }
    };

    if ($('#edit-lead')) $('#edit-lead').onclick = () => { state.drawerEdit = true; renderDrawer(lead, activities); };
    if ($('#cancel-edit')) $('#cancel-edit').onclick = () => { state.drawerEdit = false; renderDrawer(lead, activities); };
    if ($('#edit-form')) {
      $('#edit-form').querySelector('input').focus();
      $('#edit-form').onsubmit = async (e) => {
        e.preventDefault();
        const body = Object.fromEntries(new FormData(e.target));
        try {
          const u = await api(`/api/leads/${lead.id}`, { method: 'PATCH', body });
          upsertLocal(u);
          state.drawerEdit = false;
          toast('Lead updated');
          rerenderIfOn('pipeline', 'leads');
          loadDrawer(lead.id);
        } catch (err) { fail(err); }
      };
    }

    const note = $('#note-input');
    const saveNote = async () => {
      const body = note.value.trim();
      if (!body) { note.focus(); return; }
      try {
        await api(`/api/leads/${lead.id}/activities`, { method: 'POST', body: { type: 'note', body } });
        loadDrawer(lead.id);
      } catch (e) { fail(e); }
    };
    $('#add-note').onclick = saveNote;
    note.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveNote(); });

    $$('[data-del]', drawer).forEach((b) => b.onclick = async () => {
      if (!(await confirmDialog('Delete this activity?', 'This entry will be removed from the timeline.', 'Delete'))) return;
      try {
        await api(`/api/activities/${b.dataset.del}`, { method: 'DELETE' });
        const l = state.leads.find((x) => x.id === lead.id);
        const act = activities.find((x) => String(x.id) === b.dataset.del);
        if (l && act && act.type === 'call') l.call_count = Math.max(0, (l.call_count || 0) - 1);
        rerenderIfOn('pipeline', 'leads');
        loadDrawer(lead.id);
      } catch (e) { fail(e); }
    });

    if ($('#dq-btn')) $('#dq-btn').onclick = () => openDisqualify(lead);
    if ($('#requalify')) $('#requalify').onclick = async () => {
      try {
        const u = await api(`/api/leads/${lead.id}/requalify`, { method: 'POST' });
        upsertLocal(u); sortLocal();
        toast(`Restored to ${state.stages[u.stage - 1]}`);
        rerenderIfOn('pipeline', 'leads', 'dashboard');
        loadDrawer(lead.id);
      } catch (e) { fail(e); }
    };
    $('#del-btn').onclick = async () => {
      if (!(await confirmDialog(`Delete ${leadName(lead)}?`, 'This permanently removes the lead and its full activity history. To keep a record, disqualify it instead.', 'Delete lead'))) return;
      try {
        await api(`/api/leads/${lead.id}`, { method: 'DELETE' });
        state.leads = state.leads.filter((l) => l.id !== lead.id);
        state.otherLeads = { disqualified: null, all: null };
        updateNavCounts();
        closeDrawer();
        toast('Lead deleted');
        rerenderIfOn('pipeline', 'leads');
      } catch (e) { fail(e); }
    };
  }

  async function recordDialFromDrawer(id) {
    try {
      const act = await api(`/api/leads/${id}/activities`, { method: 'POST', body: { type: 'call' } });
      const l = state.leads.find((x) => x.id === id);
      if (l) { l.call_count = (l.call_count || 0) + 1; l.last_contacted_at = act.created_at; }
      rerenderIfOn('pipeline', 'leads');
      loadDrawer(id);
    } catch (e) { fail(e); }
  }

  function activityTitle(a) {
    if (a.type === 'call') return a.outcome ? `Call · ${OUTCOMES[a.outcome]}` : 'Call placed';
    if (a.type === 'note') return 'Note';
    if (a.type === 'stage') return 'Stage changed';
    if (a.type === 'disqualified') return `Disqualified · ${(a.meta && a.meta.reason) || 'Other'}`;
    if (a.type === 'requalified') return 'Restored to pipeline';
    if (a.type === 'created') return 'Lead added';
    return a.type;
  }

  function linkify(v) {
    const s = String(v);
    if (/^https?:\/\/\S+$/i.test(s)) return `<a href="${esc(s)}" target="_blank" rel="noopener">${esc(s)}</a>`;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return `<a href="mailto:${esc(s)}">${esc(s)}</a>`;
    return esc(s);
  }

  /* ================================================================ modals */

  function openModal(html, opts = {}) {
    closeModal();
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) closeModal(); });
    document.body.appendChild(wrap);
    $$('.close, [data-close]', wrap).forEach((b) => b.onclick = () => closeModal());
    return wrap;
  }
  function closeModal() {
    const m = $('.modal-wrap');
    if (m) { if (m._onClose) m._onClose(); m.remove(); }
  }

  function confirmDialog(title, body, okLabel) {
    return new Promise((resolve) => {
      const m = openModal(`
        <div class="modal-h"><div><h3>${esc(title)}</h3><p>${esc(body)}</p></div></div>
        <div class="modal-f"><button class="btn" data-close>Cancel</button><button class="btn primary" id="confirm-ok">${esc(okLabel)}</button></div>`);
      m._onClose = () => resolve(false);
      $('#confirm-ok').onclick = () => { m._onClose = null; closeModal(); resolve(true); };
      $('#confirm-ok').focus();
    });
  }

  function openDisqualify(lead, preset) {
    let reason = preset || null;
    const m = openModal(`
      <div class="modal-h"><div><h3>Disqualify ${esc(leadName(lead))}</h3><p>They'll leave the pipeline. You can restore them any time from Leads → Disqualified.</p></div>
        <button class="btn ghost icon close" aria-label="Close">${icon('x')}</button></div>
      <div class="modal-b">
        <div class="reasons">${DQ_REASONS.map((r) => `<button class="reason ${r === reason ? 'on' : ''}" data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div>
        <label class="field"><span>Note (optional)</span><textarea class="textarea" id="dq-note" placeholder="Any context for the team…" style="min-height:70px"></textarea></label>
      </div>
      <div class="modal-f"><button class="btn" data-close>Cancel</button><button class="btn primary" id="dq-ok" ${reason ? '' : 'disabled'}>${icon('ban')} Disqualify lead</button></div>`);
    $$('.reason', m).forEach((b) => b.onclick = () => {
      reason = b.dataset.r;
      $$('.reason', m).forEach((x) => x.classList.toggle('on', x === b));
      $('#dq-ok').disabled = false;
    });
    $('#dq-ok').onclick = async () => {
      $('#dq-ok').disabled = true;
      try {
        const u = await api(`/api/leads/${lead.id}/disqualify`, { method: 'POST', body: { reason, note: $('#dq-note').value } });
        upsertLocal(u);
        closeModal();
        toast(`${leadName(lead)} disqualified`, {
          action: 'Undo',
          onAction: async () => {
            const r = await api(`/api/leads/${lead.id}/requalify`, { method: 'POST' }).catch(fail);
            if (r) { upsertLocal(r); sortLocal(); rerenderIfOn('pipeline', 'leads'); refreshDrawerIf(lead.id); }
          },
        });
        rerenderIfOn('pipeline', 'leads');
        refreshDrawerIf(lead.id);
      } catch (e) { fail(e); $('#dq-ok').disabled = false; }
    };
  }

  function openAddLead() {
    const m = openModal(`
      <div class="modal-h"><div><h3>Add a lead</h3><p>Only one of name, company or phone is required.</p></div>
        <button class="btn ghost icon close" aria-label="Close">${icon('x')}</button></div>
      <form id="add-form">
        <div class="modal-b">
          <div class="grid-2">
            <label class="field"><span>First name</span><input class="input" name="first_name" autofocus></label>
            <label class="field"><span>Last name</span><input class="input" name="last_name"></label>
            <label class="field"><span>Company</span><input class="input" name="company"></label>
            <label class="field"><span>Job title</span><input class="input" name="title"></label>
            <label class="field"><span>Phone</span><input class="input" name="phone" type="tel"></label>
            <label class="field"><span>Email</span><input class="input" name="email" type="email"></label>
            <label class="field"><span>City</span><input class="input" name="city"></label>
            <label class="field"><span>State</span><input class="input" name="state"></label>
            <label class="field"><span>Deal value ($)</span><input class="input" name="value" type="number" min="0" step="any"></label>
            <label class="field"><span>Stage</span><select class="select" name="stage">${state.stages.map((s, i) => `<option value="${i + 1}">${esc(s)}</option>`).join('')}</select></label>
            <label class="field span-2"><span>Notes</span><textarea class="textarea" name="notes" style="min-height:64px"></textarea></label>
          </div>
        </div>
        <div class="modal-f"><button type="button" class="btn" data-close>Cancel</button><button type="submit" class="btn primary">${icon('plus')} Add lead</button></div>
      </form>`);
    $('input[name=first_name]', m).focus();
    $('#add-form').onsubmit = async (e) => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(e.target));
      try {
        const lead = await api('/api/leads', { method: 'POST', body });
        upsertLocal(lead); sortLocal();
        closeModal();
        toast('Lead added');
        rerenderIfOn('pipeline', 'leads', 'dashboard');
        openLead(lead.id);
      } catch (err) { fail(err); }
    };
  }

  /* ================================================================ import */

  const IMPORT_FIELDS = [
    ['full_name', 'Full name', ['name', 'fullname', 'contactname', 'owner', 'ownerkeycontact', 'keycontact', 'primarycontact', 'contactperson', 'decisionmaker', 'ownername2', 'contact', 'leadname', 'ownername', 'customername', 'clientname', 'prospectname']],
    ['first_name', 'First name', ['firstname', 'first', 'fname', 'givenname', 'contactfirstname']],
    ['last_name', 'Last name', ['lastname', 'last', 'lname', 'surname', 'familyname', 'contactlastname']],
    ['company', 'Company', ['company', 'companyname', 'business', 'businessname', 'organization', 'organisation', 'account', 'accountname', 'firm', 'employer']],
    ['title', 'Job title', ['title', 'jobtitle', 'position', 'role', 'designation']],
    ['phone', 'Phone', ['phone', 'phonenumber', 'mobile', 'cell', 'cellphone', 'mobilephone', 'tel', 'telephone', 'number', 'primaryphone', 'contactnumber', 'workphone', 'directphone', 'mobilenumber', 'cellnumber', 'phone1', 'businessphone', 'officephone', 'directdial']],
    ['phone_alt', 'Alt. phone', ['phone2', 'altphone', 'secondaryphone', 'otherphone', 'homephone', 'alternatephone', 'mobile2', 'alternativephone']],
    ['email', 'Email', ['email', 'emailaddress', 'mail', 'email1', 'workemail', 'primaryemail', 'businessemail']],
    ['website', 'Website', ['website', 'url', 'site', 'web', 'domain', 'websiteurl', 'companywebsite']],
    ['address', 'Address', ['address', 'street', 'streetaddress', 'address1', 'mailingaddress', 'propertyaddress']],
    ['city', 'City', ['city', 'town']],
    ['state', 'State', ['state', 'province', 'region', 'st', 'stateprovince']],
    ['zip', 'Zip', ['zip', 'zipcode', 'postalcode', 'postcode', 'postal']],
    ['source', 'Source', ['source', 'leadsource', 'list', 'campaign', 'channel']],
    ['value', 'Deal value', ['value', 'dealvalue', 'amount', 'revenue', 'price', 'dealsize', 'budget']],
    ['notes', 'Notes', ['notes', 'note', 'comments', 'comment', 'description', 'remarks']],
  ];

  const importState = { step: 1 };

  async function renderImport(view, alive) {
    let recent = [];
    if (importState.step === 1) recent = await api('/api/imports').catch(() => []);
    if (!alive()) return;
    const s = importState;
    const steps = `<div class="steps">
      <div class="s ${s.step >= 1 ? 'on' : ''}"><span class="n">1</span>Upload</div><span class="sep"></span>
      <div class="s ${s.step >= 2 ? 'on' : ''}"><span class="n">2</span>Match columns</div><span class="sep"></span>
      <div class="s ${s.step >= 3 ? 'on' : ''}"><span class="n">3</span>Done</div></div>`;

    if (s.step === 1) {
      view.innerHTML = `
        <div class="import-wrap">
          ${steps}
          <label class="dropzone" id="dropzone">
            <input type="file" id="file-input" accept=".xlsx,.xlsm,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" hidden>
            <div class="ic">${icon('file')}</div>
            <h3>Drop your Excel file here</h3>
            <p>or <u>browse your computer</u> · .xlsx or .csv · first row should be column headers</p>
          </label>
          <div class="card"><div class="card-b" style="display:flex;gap:14px;align-items:flex-start">
            <div class="dot-ic" style="width:34px;height:34px">${icon('spark')}</div>
            <div style="flex:1"><b>Any column layout works.</b><div class="muted" style="font-size:13px;margin-top:2px">M2 auto-matches common headers like Name, Company, Phone, Email, City and State. Anything it doesn't recognize is kept on the lead under “More info”, so no data is lost.</div></div>
            <button class="btn sm" id="tmpl">${icon('download')} Template</button>
          </div></div>
          ${recent.length ? `<div class="card"><div class="card-h"><h3>Recent imports</h3></div><div class="card-b"><div class="list">
            ${recent.map((r) => `<div class="list-item" style="cursor:default"><div class="dot-ic">${icon('file')}</div><div class="li-main"><div class="li-title">${esc(r.filename)}</div><div class="li-sub">${r.lead_count.toLocaleString()} leads${r.user_name ? ' · by ' + esc(r.user_name) : ''}</div></div><span class="li-time">${esc(relTime(r.created_at))}</span></div>`).join('')}
          </div></div></div>` : ''}
        </div>`;
      const dz = $('#dropzone');
      const input = $('#file-input');
      input.onchange = () => input.files[0] && handleFile(input.files[0]);
      ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('over'); }));
      ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('over'); }));
      dz.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f) handleFile(f); });
      $('#tmpl').onclick = (e) => {
        e.preventDefault();
        const csv = 'First Name,Last Name,Company,Title,Phone,Email,City,State,Source,Notes\r\nJane,Smith,Acme Inc,Owner,(555) 123-4567,jane@acme.com,Austin,TX,Referral,Interested in Q3\r\n';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'm2-import-template.csv';
        a.click();
      };
      return;
    }

    if (s.step === 2) {
      const sheet = s.sheets[s.sheetIdx];
      const preview = buildImportRows(sheet, s.mapping, s.keepExtra);
      const mappedSomething = Object.values(s.mapping).some((v) => v && v !== '__skip');
      view.innerHTML = `
        <div class="import-wrap">
          ${steps}
          <div class="card">
            <div class="card-h"><h3>${icon('file')} ${esc(s.filename)}</h3><span class="sub">${sheet.rows.length.toLocaleString()} rows · ${sheet.headers.length} columns</span>
              <div class="right" style="display:flex;gap:8px;align-items:center">
                ${s.sheets.length > 1 ? `<select class="select" id="sheet-sel" style="height:32px;width:auto">${s.sheets.map((sh, i) => `<option value="${i}" ${i === s.sheetIdx ? 'selected' : ''}>${esc(sh.name)} (${sh.rows.length})</option>`).join('')}</select>` : ''}
                <button class="btn sm" id="restart">Choose another file</button>
              </div>
            </div>
            <div class="card-b">
              <p class="muted" style="margin:0 0 12px">Match each column in your sheet to a field in M2. We've pre-filled our best guesses.</p>
              <div class="table-wrap" style="border:1px solid var(--line);border-radius:10px">
                <table class="tbl map-table">
                  <thead><tr><th class="nosort">Your column</th><th class="nosort">Example values</th><th class="nosort">Import as</th></tr></thead>
                  <tbody>
                    ${sheet.headers.map((h, ci) => {
                      const samples = sheet.rows.map((r) => r[ci]).filter(Boolean).slice(0, 3);
                      const cur = s.mapping[ci] || '';
                      return `<tr>
                        <td style="font-weight:600">${esc(h)}</td>
                        <td class="sample">${samples.length ? esc(samples.join(' · ')) : '<span style="color:var(--faint)">empty</span>'}</td>
                        <td><select class="select" data-col="${ci}">
                          <option value="" ${cur === '' ? 'selected' : ''}>${s.keepExtra ? 'Keep as extra info' : 'Don’t import'}</option>
                          <option value="__skip" ${cur === '__skip' ? 'selected' : ''}>Don’t import</option>
                          <optgroup label="Lead fields">
                          ${IMPORT_FIELDS.map(([k, label]) => `<option value="${k}" ${cur === k ? 'selected' : ''}>${esc(label)}</option>`).join('')}
                          </optgroup>
                        </select></td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="card"><div class="card-b">
            <div class="import-opts">
              <label class="field"><span>Add leads to stage</span><select class="select" id="imp-stage">${state.stages.map((st, i) => `<option value="${i + 1}" ${s.stage === i + 1 ? 'selected' : ''}>${i + 1}. ${esc(st)}</option>`).join('')}</select></label>
              <label class="check" style="height:38px"><input type="checkbox" id="imp-dupes" ${s.skipDuplicates ? 'checked' : ''}> Skip duplicates (same phone or email)</label>
              <label class="check" style="height:38px"><input type="checkbox" id="imp-extra" ${s.keepExtra ? 'checked' : ''}> Keep unmatched columns as extra info</label>
            </div>
          </div></div>

          <div class="card">
            <div class="card-h"><h3>Preview</h3><span class="sub">First ${Math.min(5, preview.length)} of ${preview.length.toLocaleString()} leads</span></div>
            <div class="card-b">
              ${preview.length ? `<div class="table-wrap" style="border:1px solid var(--line);border-radius:10px"><table class="tbl"><thead><tr><th class="nosort">Name</th><th class="nosort">Company</th><th class="nosort">Phone</th><th class="nosort">Email</th><th class="nosort">Location</th></tr></thead><tbody>
                ${preview.slice(0, 5).map((l) => `<tr style="cursor:default"><td style="font-weight:600">${esc(leadName(l))}</td><td>${esc(l.company || '')}</td><td class="tnum">${esc(fmtPhone(l.phone))}</td><td>${esc(l.email || '')}</td><td>${esc([l.city, l.state].filter(Boolean).join(', '))}</td></tr>`).join('')}
              </tbody></table></div>` : '<div class="muted">No rows have a name, company, phone or email yet — map at least one of those columns.</div>'}
              <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
                <button class="btn primary" id="do-import" ${preview.length && mappedSomething ? '' : 'disabled'}>${icon('upload')} Import ${preview.length.toLocaleString()} lead${preview.length === 1 ? '' : 's'}</button>
              </div>
            </div>
          </div>
        </div>`;
      $$('select[data-col]', view).forEach((sel) => sel.onchange = () => {
        const col = Number(sel.dataset.col);
        const v = sel.value;
        if (v && v !== '__skip') {
          Object.keys(s.mapping).forEach((k) => { if (s.mapping[k] === v && Number(k) !== col) s.mapping[k] = ''; });
        }
        s.mapping[col] = v;
        rerenderImport();
      });
      if ($('#sheet-sel')) $('#sheet-sel').onchange = (e) => { s.sheetIdx = Number(e.target.value); s.mapping = autoMap(s.sheets[s.sheetIdx].headers); rerenderImport(); };
      $('#restart').onclick = () => { importState.step = 1; rerenderImport(); };
      $('#imp-stage').onchange = (e) => { s.stage = Number(e.target.value); };
      $('#imp-dupes').onchange = (e) => { s.skipDuplicates = e.target.checked; };
      $('#imp-extra').onchange = (e) => { s.keepExtra = e.target.checked; rerenderImport(); };
      $('#do-import').onclick = () => runImport(preview);
      return;
    }

    if (s.step === 3) {
      const r = s.result;
      view.innerHTML = `
        <div class="import-wrap">
          ${steps}
          <div class="card"><div class="empty">
            <div class="ic" style="background:var(--black);color:#fff">${icon('check')}</div>
            <div class="result-big tnum" style="margin-top:14px">${r.inserted.toLocaleString()}</div>
            <h3 style="margin-top:0">leads imported into ${esc(state.stages[s.stage - 1])}</h3>
            <p>${r.skipped ? `${r.skipped.toLocaleString()} duplicate${r.skipped === 1 ? '' : 's'} skipped. ` : ''}${r.empty ? `${r.empty.toLocaleString()} empty row${r.empty === 1 ? '' : 's'} ignored.` : ''}</p>
            <div style="display:flex;gap:8px;justify-content:center;margin-top:18px">
              <a class="btn primary" href="#/pipeline">${icon('pipeline')} Open pipeline</a>
              <button class="btn" id="again">${icon('upload')} Import another file</button>
            </div>
          </div></div>
        </div>`;
      $('#again').onclick = () => { importState.step = 1; rerenderImport(); };
    }
  }

  function rerenderImport() {
    if (currentRoute() === 'import') {
      const v = $('#view'); const sc = v.scrollTop;
      renderImport(v, () => true).then(() => { v.scrollTop = sc; });
    }
  }

  function normHeader(h) { return String(h).toLowerCase().replace(/[^a-z0-9]/g, ''); }

  function autoMap(headers) {
    const mapping = {};
    const used = new Set();
    headers.forEach((h, i) => {
      const n = normHeader(h);
      for (const [key, , syn] of IMPORT_FIELDS) {
        if (syn.includes(n)) {
          let k = key;
          if (used.has(k) && k === 'phone' && !used.has('phone_alt')) k = 'phone_alt';
          if (!used.has(k)) { mapping[i] = k; used.add(k); }
          break;
        }
      }
      if (mapping[i] === undefined) {
        // fuzzy contains-match
        const fuzzy = [['phone', /phone|mobile|cell/], ['phone_alt', /phone|mobile|cell/], ['email', /email/], ['title', /title/],
          ['full_name', /contact|owner/], ['company', /company|business/], ['first_name', /first/], ['last_name', /last/]];
        for (const [k, re] of fuzzy) {
          if (re.test(n) && !used.has(k)) { mapping[i] = k; used.add(k); break; }
          if (re.test(n) && (k === 'phone' || k === 'phone_alt')) continue;
          if (re.test(n)) break;
        }
      }
      if (mapping[i] === undefined) mapping[i] = '';
    });
    if (used.has('full_name') && (used.has('first_name') || used.has('last_name'))) {
      Object.keys(mapping).forEach((k) => { if (mapping[k] === 'full_name') mapping[k] = ''; });
    }
    return mapping;
  }

  function buildImportRows(sheet, mapping, keepExtra) {
    const out = [];
    for (const row of sheet.rows) {
      const lead = { extra: {} };
      sheet.headers.forEach((h, i) => {
        const val = (row[i] || '').trim();
        if (!val) return;
        const m = mapping[i];
        if (m === '__skip') return;
        if (!m) { if (keepExtra) lead.extra[h] = val; return; }
        if (m === 'full_name') {
          const parts = val.split(/\s+/);
          const afterComma = val.split(',').slice(1).join(',').trim();
          if (val.includes(',') && parts.length >= 2 && !/^(jr|sr|ii|iii|iv|phd|pe)\.?$/i.test(afterComma)) {
            const [last, first] = val.split(',').map((x) => x.trim());
            lead.first_name = first; lead.last_name = last;
          } else {
            lead.first_name = parts[0]; lead.last_name = parts.slice(1).join(' ');
          }
          return;
        }
        lead[m] = lead[m] ? `${lead[m]} ${val}` : val;
      });
      if (lead.first_name || lead.last_name || lead.company || lead.phone || lead.email) out.push(lead);
    }
    return out;
  }

  async function handleFile(file) {
    const dz = $('#dropzone');
    if (file.size > 30 * 1024 * 1024) { toast('That file is over 30 MB. Split it into smaller files.', { error: true }); return; }
    if (/\.xls$/i.test(file.name)) { toast('Old .xls files aren’t supported — in Excel use File → Save As → .xlsx', { error: true, duration: 6000 }); return; }
    if (dz) dz.innerHTML = `<div class="spinner" style="margin:0 auto"></div><h3>Reading ${esc(file.name)}…</h3>`;
    try {
      const buf = await file.arrayBuffer();
      const res = await api(`/api/import/parse?filename=${encodeURIComponent(file.name)}`, { method: 'POST', body: buf, raw: true });
      const sheetIdx = res.sheets.reduce((best, sh, i) => (sh.rows.length > res.sheets[best].rows.length ? i : best), 0);
      Object.assign(importState, {
        step: 2, filename: file.name, sheets: res.sheets, sheetIdx,
        mapping: autoMap(res.sheets[sheetIdx].headers), stage: 1, skipDuplicates: true, keepExtra: true,
      });
    } catch (e) {
      fail(e);
      importState.step = 1;
    }
    rerenderImport();
  }

  async function runImport(rows) {
    const btn = $('#do-import');
    btn.disabled = true;
    const total = rows.length;
    const result = { inserted: 0, skipped: 0, empty: 0 };
    try {
      for (let i = 0; i < rows.length; i += 2000) {
        btn.innerHTML = `<div class="spinner" style="border-color:#52525b;border-top-color:#fff"></div> Importing ${Math.min(total, i + 2000).toLocaleString()} / ${total.toLocaleString()}…`;
        const r = await api('/api/import', {
          method: 'POST',
          body: { leads: rows.slice(i, i + 2000), stage: importState.stage, skipDuplicates: importState.skipDuplicates, filename: importState.filename },
        });
        result.inserted += r.inserted; result.skipped += r.skipped; result.empty += r.empty;
      }
      importState.result = result;
      importState.step = 3;
      await loadLeads();
      rerenderImport();
      toast(`${result.inserted.toLocaleString()} leads imported`);
    } catch (e) {
      fail(e);
      btn.disabled = false;
      btn.innerHTML = `${icon('upload')} Try again`;
      if (result.inserted) { toast(`${result.inserted} leads were imported before the error.`); loadLeads(); }
    }
  }

  /* ================================================================ settings */

  async function renderSettings(view, alive) {
    const users = await api('/api/users');
    if (!alive()) return;
    view.innerHTML = `
      <div class="settings">
        <div class="card">
          <div class="card-h"><h3>Pipeline stages</h3><span class="sub">Rename the five stages to match your process</span></div>
          <form class="card-b" id="stages-form">
            <div class="stage-inputs">
              ${state.stages.map((s, i) => `<label><span class="col-num">${i + 1}</span><input class="input" name="s${i}" value="${esc(s)}" maxlength="40" required></label>`).join('')}
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn primary" type="submit">Save stages</button></div>
          </form>
        </div>

        <div class="card">
          <div class="card-h"><h3>Team</h3><span class="sub">People who can sign in to this CRM</span></div>
          <div class="card-b">
            ${users.map((u) => `<div class="user-row"><div class="avatar">${esc(initials({ first_name: u.name }))}</div><div class="li-main"><div class="li-title">${esc(u.name)}${u.id === state.user.id ? ' <span class="chip" style="margin-left:6px">You</span>' : ''}</div><div class="li-sub">${esc(u.email)}</div></div>
              ${u.id === state.user.id ? '' : `<button class="btn sm ghost danger" data-rm="${u.id}" data-name="${esc(u.name)}">Remove</button>`}</div>`).join('')}
            <form id="user-form" class="grid-2" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line-2)">
              <label class="field"><span>Name</span><input class="input" name="name" required></label>
              <label class="field"><span>Email</span><input class="input" name="email" type="email" required></label>
              <label class="field"><span>Temporary password</span><input class="input" name="password" type="password" minlength="8" required autocomplete="new-password"></label>
              <div style="display:flex;align-items:flex-end"><button class="btn block" type="submit">${icon('plus')} Add teammate</button></div>
            </form>
          </div>
        </div>

        <div class="card">
          <div class="card-h"><h3>Change password</h3></div>
          <form class="card-b grid-2" id="pw-form">
            <label class="field"><span>Current password</span><input class="input" name="current" type="password" required autocomplete="current-password"></label>
            <label class="field"><span>New password</span><input class="input" name="next" type="password" minlength="8" required autocomplete="new-password"></label>
            <div class="span-2" style="display:flex;justify-content:flex-end"><button class="btn" type="submit">Update password</button></div>
          </form>
        </div>

        <div class="card">
          <div class="card-h"><h3>Data</h3></div>
          <div class="card-b" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <div style="flex:1;min-width:200px" class="muted">Download every lead — including disqualified — as a CSV you can open in Excel.</div>
            <a class="btn" href="/api/export.csv">${icon('download')} Export all leads</a>
          </div>
        </div>
      </div>`;

    $('#stages-form').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const stages = [0, 1, 2, 3, 4].map((i) => fd.get('s' + i));
      try { state.stages = await api('/api/stages', { method: 'PUT', body: { stages } }); toast('Stages saved'); } catch (err) { fail(err); }
    };
    $('#user-form').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await api('/api/users', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) });
        toast('Teammate added — share their email and temporary password with them');
        route();
      } catch (err) { fail(err); }
    };
    $$('[data-rm]', view).forEach((b) => b.onclick = async () => {
      if (!(await confirmDialog(`Remove ${b.dataset.name}?`, 'They will no longer be able to sign in. Their notes and call history stay on the leads.', 'Remove'))) return;
      try { await api(`/api/users/${b.dataset.rm}`, { method: 'DELETE' }); route(); } catch (err) { fail(err); }
    });
    $('#pw-form').onsubmit = async (e) => {
      e.preventDefault();
      try { await api('/api/password', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) }); e.target.reset(); toast('Password updated'); } catch (err) { fail(err); }
    };
  }

  /* ================================================================ boot */

  async function boot() {
    const me = await api('/api/me');
    if (!me.user) { renderAuth(me.needsSetup); return; }
    state.user = me.user;
    state.stages = await api('/api/stages');
    renderShell();
    await loadLeads().catch(() => {});
    if (!location.hash) location.hash = '#/dashboard';
    route();
  }

  window.addEventListener('hashchange', () => { if (state.user) route(); });
  boot().catch((e) => {
    $('#app').innerHTML = `<div class="empty"><h3>Couldn't reach the server</h3><p>${esc(e.message)}</p><button class="btn" onclick="location.reload()">Retry</button></div>`;
  });
})();
