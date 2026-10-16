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
    up: '<path d="m18 15-6-6-6 6"/>',
    split: '<path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    script: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
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
    pipelines: [],      // pipelines this user can see, each with its stages
    pipelineId: null,   // pipeline shown on the board
    dashScope: 'all',   // 'all' or a pipeline id
    leads: [],          // active leads across visible pipelines
    leadsLoaded: false,
    openLeadId: null,
    pipelineFilter: '',
    pipelineFollowOnly: false,
    colLimit: {},
    leadsView: { status: 'active', pipeline: 'all', stage: '', q: '', sort: 'created_at', dir: 'desc', page: 0 },
    otherLeads: { disqualified: null, all: null },
  };

  /* pipelines & stages */
  const STAGE_KIND_LABEL = { open: 'Stage', appointment: 'Appointment', won: 'Won' };
  function pipelineById(id) { return state.pipelines.find((p) => p.id === Number(id)) || null; }
  function currentPipeline() { return pipelineById(state.pipelineId) || state.pipelines[0] || null; }
  function stageInfo(stageId) {
    for (const p of state.pipelines) {
      const index = p.stages.findIndex((s) => s.id === Number(stageId));
      if (index > -1) return { pipeline: p, stage: p.stages[index], index };
    }
    return null;
  }
  function stageName(stageId) { const i = stageInfo(stageId); return i ? i.stage.name : '—'; }
  function multiPipeline() { return state.pipelines.length > 1; }
  function stageSortKey(l) {
    const i = stageInfo(l.stage_id);
    return i ? state.pipelines.indexOf(i.pipeline) * 100 + i.index : 9999;
  }
  function setPipeline(id) {
    state.pipelineId = Number(id);
    try { localStorage.setItem('m2.pipeline', String(state.pipelineId)); } catch { /* ignore */ }
  }
  async function loadPipelines() {
    state.pipelines = await api('/api/pipelines');
    if (!pipelineById(state.pipelineId)) {
      let saved = null;
      try { saved = Number(localStorage.getItem('m2.pipeline')); } catch { /* ignore */ }
      const mine = state.pipelines.find((p) => p.user_id === (state.user && state.user.id));
      state.pipelineId = (pipelineById(saved) || mine || state.pipelines[0] || {}).id || null;
    }
    if (state.dashScope !== 'all' && !pipelineById(state.dashScope)) state.dashScope = 'all';
    if (state.leadsView.pipeline !== 'all' && !pipelineById(state.leadsView.pipeline)) state.leadsView.pipeline = 'all';
  }
  function pipelineLabel(p) {
    return p.name + (isOwner() && p.user_name && !p.name.toLowerCase().startsWith(p.user_name.split(' ')[0].toLowerCase()) ? ` · ${p.user_name}` : '');
  }
  function pipelineOptions(selected, withAll) {
    return (withAll ? `<option value="all" ${selected === 'all' ? 'selected' : ''}>All pipelines</option>` : '')
      + state.pipelines.map((p) => `<option value="${p.id}" ${String(selected) === String(p.id) ? 'selected' : ''}>${esc(pipelineLabel(p))}</option>`).join('');
  }
  function stageOptions(pipeline, selected) {
    return (pipeline ? pipeline.stages : []).map((s, i) => `<option value="${s.id}" ${String(selected) === String(s.id) ? 'selected' : ''}>${i + 1}. ${esc(s.name)}</option>`).join('');
  }

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
    calendar: { title: 'Calendar', icon: 'calendar', render: renderCalendar },
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
          <span class="chip">${esc(stageName(l.stage_id))}</span>
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
    const scope = state.dashScope;
    const [a] = await Promise.all([
      api(`/api/analytics?tz=${encodeURIComponent(TZ)}&pipeline=${scope}`),
      state.leadsLoaded ? null : loadLeads(),
      loadPipelines(),
    ]);
    if (!alive()) return;
    const t = a.totals;
    const scopePipeline = scope !== 'all' ? pipelineById(scope) : (state.pipelines.length === 1 ? state.pipelines[0] : null);
    const stageCount = (id) => (a.byStage.find((x) => x.stage_id === id) || { n: 0 }).n;
    const won = t.won;
    const appts = t.appointments;
    const kindName = (kind, fallback) => {
      const st = scopePipeline && scopePipeline.stages.find((x) => x.kind === kind);
      return st ? st.name : fallback;
    };
    const scopeBar = multiPipeline() ? `
      <div class="scope-bar">
        <span class="muted">Showing</span>
        <select class="select" id="dash-scope">${pipelineOptions(scope, true)}</select>
      </div>` : '';
    const connectRate = a.calls.logged_month ? Math.round((a.calls.connected_month / a.calls.logged_month) * 100) : null;
    const decided = won + t.disqualified;
    const winRate = decided ? Math.round((won / decided) * 100) : null;

    if (!t.total) {
      view.innerHTML = `
        <div class="dash">
          ${scopeBar}
          <div class="card"><div class="empty">
            <div class="ic">${icon('upload')}</div>
            <h3>Welcome to M2</h3>
            <p>${state.pipelines.length ? 'This pipeline is empty. Import a spreadsheet of leads or add your first one by hand.' : "You don't have a pipeline yet. Ask the account owner to set one up for you."}</p>
            <div style="display:flex;gap:8px;justify-content:center;margin-top:18px">
              <a class="btn primary" href="#/import">${icon('upload')} Import from Excel</a>
              <button class="btn" id="dash-add">${icon('plus')} Add a lead</button>
            </div>
          </div></div>
        </div>`;
      $('#dash-add').onclick = () => openAddLead();
      if ($('#dash-scope')) $('#dash-scope').onchange = (e) => { state.dashScope = e.target.value === 'all' ? 'all' : Number(e.target.value); route(); };
      return;
    }

    const maxStage = Math.max(1, ...a.byStage.map((x) => x.n));
    const maxPipe = Math.max(1, ...a.byPipeline.map((x) => x.active));
    const outcomeTotal = a.outcomes.reduce((s, o) => s + o.n, 0);
    const maxOutcome = Math.max(1, ...a.outcomes.map((o) => o.n));
    const maxDq = Math.max(1, ...a.dqReasons.map((o) => o.n));

    view.innerHTML = `
      <div class="dash">
        ${scopeBar}
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
            <div class="label">${icon('award')} ${esc(kindName('won', 'Won'))}</div>
            <div class="value tnum">${won.toLocaleString()}</div>
            <div class="foot">${winRate === null ? 'No closed leads yet' : `<b>${winRate}%</b> win rate`} · <b>${appts.toLocaleString()}</b> ${esc(kindName('appointment', 'Appointments').toLowerCase())}</div>
          </div>
        </div>

        <div class="dash-row r2">
          <div class="card">
            <div class="card-h"><h3>${scopePipeline ? esc(scopePipeline.name) : 'Pipelines'}</h3><span class="sub">${scopePipeline ? 'Active leads by stage' : 'Active leads by pipeline'}</span><a class="btn sm right" href="#/pipeline" id="open-board">Open board ${icon('arrow')}</a></div>
            <div class="card-b">
              <div class="funnel">
                ${scopePipeline ? scopePipeline.stages.map((st, i) => {
                  const n = stageCount(st.id);
                  const pct = t.active ? Math.round((n / t.active) * 100) : 0;
                  const v = (a.byStage.find((x) => x.stage_id === st.id) || {}).value;
                  return `<div class="funnel-row" data-stage="${st.id}" data-pipe="${scopePipeline.id}" data-tip="<b>${esc(st.name)}</b><br>${n.toLocaleString()} leads${v ? ' · ' + esc(money(v)) : ''}">
                    <div class="funnel-name"><span class="n">${i + 1}</span>${esc(st.name)}</div>
                    <div class="bar-track"><div class="bar-fill" style="width:${(n / maxStage) * 100}%"></div></div>
                    <div class="funnel-val tnum"><b>${n.toLocaleString()}</b><span>${pct}%</span></div>
                  </div>`;
                }).join('') : a.byPipeline.map((pp) => `
                  <div class="funnel-row" data-pipe="${pp.id}" data-tip="<b>${esc(pp.name)}</b><br>${pp.active.toLocaleString()} active · ${pp.appointments.toLocaleString()} appointments · ${pp.won.toLocaleString()} won">
                    <div class="funnel-name" title="${esc(pp.name)}">${esc(pp.name)}</div>
                    <div class="bar-track"><div class="bar-fill" style="width:${(pp.active / maxPipe) * 100}%"></div></div>
                    <div class="funnel-val tnum"><b>${pp.active.toLocaleString()}</b><span>${pp.won} won</span></div>
                  </div>`).join('')}
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
            <div class="card-h"><h3>Pipeline value</h3><span class="sub">Deal value in active leads</span></div>
            <div class="card-b">${pipelineValueHtml(a, t, scopePipeline)}</div>
          </div>
        </div>

        <div class="dash-row r3">
          <div class="card">
            <div class="card-h"><h3>Follow-ups</h3><span class="sub">Due within 7 days</span></div>
            <div class="card-b"><div class="list">
              ${a.followUps.length ? a.followUps.map((l) => `
                <div class="list-item" data-lead="${l.id}">
                  <div class="avatar light" style="width:30px;height:30px;font-size:11px">${esc(initials(l))}</div>
                  <div class="li-main"><div class="li-title">${esc(leadName(l))}</div><div class="li-sub">${esc(stageName(l.stage_id))}${!scopePipeline && pipelineById(l.pipeline_id) ? ' · ' + esc(pipelineById(l.pipeline_id).name) : ''}${l.phone ? ' · ' + esc(fmtPhone(l.phone)) : ''}</div></div>
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
        ${isOwner() ? '<div class="card" id="team-card"></div>' : ''}
      </div>`;

    view.querySelectorAll('[data-lead]').forEach((el) => el.addEventListener('click', () => openLead(Number(el.dataset.lead))));
    view.querySelectorAll('.funnel-row').forEach((el) => el.addEventListener('click', () => {
      if (el.dataset.stage) {
        state.leadsView = { ...state.leadsView, status: 'active', pipeline: Number(el.dataset.pipe), stage: el.dataset.stage, page: 0 };
        location.hash = '#/leads';
      } else {
        setPipeline(el.dataset.pipe);
        location.hash = '#/pipeline';
      }
    }));
    if ($('#open-board') && scopePipeline) $('#open-board').addEventListener('click', () => setPipeline(scopePipeline.id));
    if ($('#dash-scope')) $('#dash-scope').onchange = (e) => { state.dashScope = e.target.value === 'all' ? 'all' : Number(e.target.value); route(); };
    const dq = $('#see-dq');
    if (dq) dq.addEventListener('click', () => { state.leadsView = { ...state.leadsView, status: 'disqualified', pipeline: scope, stage: '', page: 0 }; });
    bindTips(view);
    if (isOwner()) renderTeamCard();
  }

  /* ---------------------------------------------------------------- team performance (owner only) */

  const isOwner = () => state.user && state.user.role === 'owner';
  const TEAM_PERIODS = [['today', 'Today'], ['7d', '7 days'], ['30d', '30 days'], ['all', 'All time']];

  async function renderTeamCard() {
    const card = $('#team-card');
    if (!card) return;
    const period = state.teamPeriod || '7d';
    if (!card.innerHTML) card.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    let data;
    try { data = await api(`/api/team-stats?period=${period}&tz=${encodeURIComponent(TZ)}`); } catch (e) {
      card.innerHTML = `<div class="card-b muted">${esc(e.message)}</div>`;
      return;
    }
    if (!$('#team-card')) return;
    const people = data.people;
    const sortKey = state.teamSort || 'calls';
    people.sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0) || a.name.localeCompare(b.name));
    const totals = people.reduce((t, p) => {
      ['calls', 'connected', 'logged', 'notes', 'leads_worked', 'appointments', 'won', 'disqualified'].forEach((k) => { t[k] = (t[k] || 0) + p[k]; });
      return t;
    }, {});
    const maxCalls = Math.max(1, ...people.map((p) => p.calls));
    const rate = (p) => (p.logged ? Math.round((p.connected / p.logged) * 100) + '%' : '—');
    const label = TEAM_PERIODS.find(([k]) => k === period)[1].toLowerCase();
    const th = (k, t) => `<th data-tsort="${k}" class="${sortKey === k ? 'sorted' : ''}">${t}${sortKey === k ? '<span class="arrow">▼</span>' : ''}</th>`;

    card.innerHTML = `
      <div class="card-h">
        <h3>Team performance</h3><span class="chip outline">${icon('award')}Owner only</span>
        <div class="right seg" id="team-period">${TEAM_PERIODS.map(([k, t]) => `<button data-p="${k}" class="${k === period ? 'on' : ''}">${t}</button>`).join('')}</div>
      </div>
      <div class="card-b">
        <div class="team-kpis">
          <div><span>Calls</span><b class="tnum">${(totals.calls || 0).toLocaleString()}</b></div>
          <div><span>Connected</span><b class="tnum">${(totals.connected || 0).toLocaleString()}</b></div>
          <div><span>Notes</span><b class="tnum">${(totals.notes || 0).toLocaleString()}</b></div>
          <div><span>Leads worked</span><b class="tnum">${(totals.leads_worked || 0).toLocaleString()}</b></div>
          <div><span>Appointments</span><b class="tnum">${(totals.appointments || 0).toLocaleString()}</b></div>
          <div><span>Won</span><b class="tnum">${(totals.won || 0).toLocaleString()}</b></div>
        </div>
        <div class="table-wrap" style="border:1px solid var(--line);border-radius:10px;margin-top:14px">
          <table class="tbl team-tbl">
            <thead><tr>
              <th class="nosort">Teammate</th>
              ${th('calls', 'Calls')}${th('connected', 'Connected')}<th class="nosort">Connect rate</th>
              ${th('notes', 'Notes')}${th('leads_worked', 'Leads worked')}${th('advanced', 'Moved forward')}
              ${th('appointments', 'Appointments')}${th('won', 'Won')}${th('disqualified', 'Disqualified')}
              <th class="nosort">Calls · last 14 days</th><th class="nosort">Last active</th>
            </tr></thead>
            <tbody>
              ${people.map((p) => `<tr style="cursor:default">
                <td><div class="name-cell"><div class="avatar">${esc(initials({ first_name: p.name }))}</div><div style="min-width:0"><div>${esc(p.name)}${p.role === 'owner' ? ' <span class="chip" style="margin-left:4px">Owner</span>' : ''}</div><div class="muted" style="font-weight:400;font-size:12px">${esc(p.email)}</div></div></div></td>
                <td><div class="calls-cell"><b class="tnum">${p.calls.toLocaleString()}</b><div class="bar-track"><div class="bar-fill" style="width:${(p.calls / maxCalls) * 100}%"></div></div></div></td>
                <td class="tnum">${p.connected.toLocaleString()}</td>
                <td class="tnum">${rate(p)}</td>
                <td class="tnum">${p.notes.toLocaleString()}</td>
                <td class="tnum">${p.leads_worked.toLocaleString()}</td>
                <td class="tnum">${p.advanced.toLocaleString()}</td>
                <td class="tnum">${p.appointments.toLocaleString()}</td>
                <td class="tnum">${p.won.toLocaleString()}</td>
                <td class="tnum">${p.disqualified.toLocaleString()}</td>
                <td>${sparkline(p.daily)}</td>
                <td class="muted">${p.last_active ? esc(relTime(p.last_active)) : 'Never'}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
        ${people.length < 2 ? `<p class="muted" style="margin:12px 0 0;font-size:13px">Add teammates in <a href="#/settings">Settings</a>. Every call, note, stage move and disqualification they make is tracked here, ${esc(label)}.</p>` : ''}
      </div>`;
    $$('#team-period button', card).forEach((b) => b.onclick = () => { state.teamPeriod = b.dataset.p; renderTeamCard(); });
    $$('th[data-tsort]', card).forEach((h) => h.onclick = () => { state.teamSort = h.dataset.tsort; renderTeamCard(); });
    bindTips(card);
  }

  function sparkline(daily) {
    const W = 112; const H = 26; const max = Math.max(1, ...daily.map((d) => d.n));
    const step = W / daily.length; const bw = Math.max(2, step - 2);
    const total = daily.reduce((a, d) => a + d.n, 0);
    return `<svg class="spark" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" data-tip="<b>${total.toLocaleString()}</b> calls in the last 14 days">${daily.map((d, i) => {
      const h = d.n ? Math.max(2, (d.n / max) * (H - 2)) : 1;
      return `<rect x="${i * step + 1}" y="${H - h}" width="${bw}" height="${h}" rx="1" class="${d.n ? '' : 'zero'}"/>`;
    }).join('')}</svg>`;
  }

  // Money sitting in the pipeline: open deal value, split by stage (one pipeline) or by pipeline (all).
  function pipelineValueHtml(a, t, scopePipeline) {
    const rows = scopePipeline
      ? scopePipeline.stages.map((st) => ({
        label: st.name, won: st.kind === 'won', id: st.id,
        value: (a.byStage.find((x) => x.stage_id === st.id) || {}).value || 0,
        n: (a.byStage.find((x) => x.stage_id === st.id) || {}).n || 0,
      }))
      : a.byPipeline.map((pp) => ({ label: pp.name, value: pp.open_value, won: false, n: pp.active, extra: pp.won_value }));
    const max = Math.max(1, ...rows.map((r) => r.value));
    const hasValues = t.valued > 0;
    return `
      <div class="pv-head">
        <div>
          <div class="pv-big tnum">${money(t.open_value) || '$0'}</div>
          <div class="muted pv-sub">open in the pipeline · <b>${money(t.won_value) || '$0'}</b> won</div>
        </div>
      </div>
      ${hasValues ? `
      <div class="hbars pv-bars">
        ${rows.map((r) => `
          <div class="hbar ${r.won ? 'pv-won' : ''}" data-tip="<b>${esc(r.label)}</b><br>${esc(money(r.value) || '$0')}${r.won ? ' won' : ''} · ${r.n.toLocaleString()} active lead${r.n === 1 ? '' : 's'}${r.extra ? ' · ' + esc(money(r.extra)) + ' won' : ''}">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.label)}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${(r.value / max) * 100}%"></div></div>
            <span class="v tnum">${esc(money(r.value, true) || '$0')}</span>
          </div>`).join('')}
      </div>
      <div class="muted pv-note">${t.valued.toLocaleString()} of ${t.active.toLocaleString()} active leads have a deal value</div>` : `
      <div class="pv-empty">No deal values yet. Open a lead, click <b>Edit</b> and fill in <b>Deal value</b>, or map a value column when you import, and it will add up here.</div>`}`;
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
    return { call: 'phone', note: 'note', stage: 'move', disqualified: 'ban', requalified: 'undo', created: 'spark', email: 'mail', appointment: 'calendar' }[type] || 'spark';
  }
  function activityLabel(a) {
    if (a.type === 'call') return a.outcome ? `Call · ${OUTCOMES[a.outcome]}` : 'Called';
    if (a.type === 'note') return 'Note: ' + (a.body || '').slice(0, 80);
    if (a.type === 'stage') return a.body || 'Stage changed';
    if (a.type === 'disqualified') return `Disqualified · ${(a.meta && a.meta.reason) || ''}`.replace(/ · $/, '');
    if (a.type === 'requalified') return 'Restored to pipeline';
    if (a.type === 'email') return `Email · ${(a.meta && a.meta.subject) || ''}`;
    if (a.type === 'appointment') return a.meta && a.meta.event === 'booked' ? `Booked · ${a.body}` : a.body;
    return a.body || 'Created';
  }

  /* ================================================================ pipeline board */

  const COL_PAGE = 60;

  async function renderPipeline(view, alive, fromCache) {
    if (!fromCache || !state.leadsLoaded) await Promise.all([loadLeads(), loadPipelines()]);
    if (!alive()) return;
    const q = state.pipelineFilter.trim().toLowerCase();
    const qd = digits(q);
    const today = todayStr();
    const pipe = currentPipeline();
    if (!pipe) {
      view.innerHTML = `<div class="card" style="margin:24px"><div class="empty"><div class="ic">${icon('pipeline')}</div><h3>No pipeline yet</h3><p>${isOwner() ? 'Create a pipeline in Settings to get started.' : 'Ask the account owner to set up a pipeline for you.'}</p>${isOwner() ? `<a class="btn primary" href="#/settings" style="margin-top:14px">${icon('settings')} Open settings</a>` : ''}</div></div>`;
      return;
    }
    const inPipe = state.leads.filter((l) => l.pipeline_id === pipe.id);
    const visible = inPipe.filter((l) => matches(l, q, qd) && (!state.pipelineFollowOnly || (l.next_follow_up && l.next_follow_up <= today)));
    const byStage = pipe.stages.map((st) => visible.filter((l) => l.stage_id === st.id));
    const total = inPipe.length;

    view.innerHTML = `
      <div class="board-toolbar">
        ${multiPipeline() ? `<select class="select pipe-switch" id="pipe-switch" aria-label="Pipeline">${pipelineOptions(pipe.id, false)}</select>` : `<b class="pipe-name">${esc(pipe.name)}</b>`}
        <div class="filter-input">${icon('search')}<input class="input" id="board-filter" placeholder="Filter cards…" value="${esc(state.pipelineFilter)}"></div>
        <label class="check" style="font-size:13px;font-weight:500"><input type="checkbox" id="follow-only" ${state.pipelineFollowOnly ? 'checked' : ''}> Follow-ups due</label>
        ${isOwner() && multiPipeline() ? `<button class="btn sm" id="board-split">${icon('split')} Split leads</button>` : ''}
        <span class="stat" style="margin-left:auto"><b>${visible.length.toLocaleString()}</b>${visible.length !== total ? ` of ${total.toLocaleString()}` : ''} active leads · drag cards between stages</span>
      </div>
      <div class="board" id="board">
        ${byStage.map((list, i) => {
          const st = pipe.stages[i];
          const s = st.id;
          const limit = state.colLimit[s] || COL_PAGE;
          const val = list.reduce((a, l) => a + (Number(l.value) || 0), 0);
          return `<section class="column" data-stage="${s}">
            <div class="col-head"><span class="col-num">${i + 1}</span><span class="col-title">${esc(st.name)}</span>${st.kind !== 'open' ? `<span class="kind-dot" title="${esc(STAGE_KIND_LABEL[st.kind])} stage">${icon(st.kind === 'won' ? 'award' : 'calendar')}</span>` : ''}<span class="col-count tnum">${list.length.toLocaleString()}</span></div>
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
    if ($('#pipe-switch')) $('#pipe-switch').onchange = (e) => { setPipeline(e.target.value); rerenderIfOn('pipeline'); };
    if ($('#board-split')) $('#board-split').onclick = () => openSplit();
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
      const prevStage = lead.stage_id;
      lead.stage_id = toStage;
      reorderLocal(lead, beforeId);
      rerenderIfOn('pipeline');
      try {
        const updated = await api(`/api/leads/${id}/move`, { method: 'POST', body: { stage_id: toStage, beforeId } });
        Object.assign(lead, updated);
        if (prevStage !== toStage) {
          toast(`Moved to ${stageName(toStage)}`, {
            action: 'Undo',
            onAction: async () => {
              const u = await api(`/api/leads/${id}/move`, { method: 'POST', body: { stage_id: prevStage } }).catch(fail);
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
    const same = state.leads.filter((l) => l.stage_id === lead.stage_id && l.id !== lead.id).sort((a, b) => a.position - b.position);
    const idx = beforeId ? same.findIndex((l) => l.id === beforeId) : -1;
    if (idx === -1) lead.position = (same.length ? same[same.length - 1].position : 0) + 1;
    else {
      const prev = same[idx - 1];
      lead.position = ((prev ? prev.position : same[idx].position - 1) + same[idx].position) / 2;
    }
    sortLocal();
  }
  function sortLocal() { state.leads.sort((a, b) => a.position - b.position || a.id - b.id); }

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
    const scopePipe = v.pipeline !== 'all' ? pipelineById(v.pipeline) : (state.pipelines.length === 1 ? state.pipelines[0] : null);
    if (v.stage && !(scopePipe && scopePipe.stages.some((st) => String(st.id) === String(v.stage)))) v.stage = '';
    const showPipeCol = multiPipeline() && v.pipeline === 'all';
    let list = rows.filter((l) => matches(l, q, qd)
      && (v.pipeline === 'all' || l.pipeline_id === Number(v.pipeline))
      && (!v.stage || String(l.stage_id) === String(v.stage)));
    const key = v.sort;
    const dir = v.dir === 'asc' ? 1 : -1;
    const val = (l) => {
      if (key === 'name') return leadName(l).toLowerCase();
      if (key === 'company') return (l.company || '').toLowerCase();
      if (key === 'stage') return stageSortKey(l);
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
    const canBulk = isOwner();                       // select leads for bulk delete
    const canMove = isOwner() && multiPipeline();    // and move them between pipelines
    const sel = state.selected = state.selected || new Set();
    const listIds = new Set(list.map((l) => l.id));
    [...sel].forEach((id) => { if (!listIds.has(id)) sel.delete(id); });
    const pageAll = pageRows.length > 0 && pageRows.every((l) => sel.has(l.id));

    view.innerHTML = `
      <div style="max-width:1400px;margin:0 auto">
        <div class="toolbar">
          <div class="seg" id="status-seg">
            ${['active', 'disqualified', 'all'].map((s) => `<button data-s="${s}" class="${v.status === s ? 'on' : ''}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}
          </div>
          <div class="filter-input">${icon('search')}<input class="input" id="leads-q" placeholder="Search leads…" value="${esc(v.q)}"></div>
          ${multiPipeline() ? `<select class="select" id="leads-pipe" style="width:auto;height:34px">${pipelineOptions(v.pipeline, true)}</select>` : ''}
          ${scopePipe ? `<select class="select" id="leads-stage" style="width:auto;height:34px">
            <option value="">All stages</option>
            ${stageOptions(scopePipe, v.stage)}
          </select>` : ''}
          <span class="spacer"></span>
          ${canMove ? `<button class="btn sm" id="split-btn">${icon('split')} Split leads</button>` : ''}
          <a class="btn sm" href="/api/export.csv">${icon('download')} Export CSV</a>
        </div>
        ${canBulk && sel.size ? `
        <div class="bulk-bar">
          <b>${sel.size.toLocaleString()} selected</b>
          ${pageAll && list.length > sel.size ? `<button class="btn sm ghost" id="sel-all">Select all ${list.length.toLocaleString()} matching</button>` : ''}
          <span class="spacer"></span>
          ${canMove ? `<span class="muted">Move to</span>
          <select class="select" id="bulk-pipe">${pipelineOptions(v.pipeline !== 'all' ? (state.pipelines.find((p) => p.id !== Number(v.pipeline)) || {}).id : '', false)}</select>
          <button class="btn sm primary" id="bulk-move">${icon('arrow')} Move</button>
          <span class="bulk-sep"></span>` : ''}
          <button class="btn sm bulk-del" id="bulk-delete">${icon('trash')} Delete</button>
          <button class="btn sm ghost" id="sel-clear">Clear</button>
        </div>` : ''}
        <div class="card">
          ${list.length ? `
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr>
                ${canBulk ? `<th class="nosort cb-col"><input type="checkbox" id="sel-page" ${pageAll ? 'checked' : ''} aria-label="Select all on this page"></th>` : ''}
                ${th('name', 'Name')}${th('company', 'Company')}${th('phone', 'Phone', true)}${showPipeCol ? th('stage', 'Pipeline · Stage') : th('stage', 'Stage')}
                ${v.status !== 'active' ? th('dq', 'Status', true) : ''}
                ${th('call_count', 'Calls')}${th('last_contacted_at', 'Last contacted')}${th('next_follow_up', 'Follow-up')}${th('created_at', 'Added')}
              </tr></thead>
              <tbody>
                ${pageRows.map((l) => {
                  const tel = telHref(l.phone);
                  return `<tr data-id="${l.id}" class="${sel.has(l.id) ? 'selected' : ''}">
                    ${canBulk ? `<td class="cb-col"><input type="checkbox" data-sel="${l.id}" ${sel.has(l.id) ? 'checked' : ''} aria-label="Select lead"></td>` : ''}
                    <td><div class="name-cell"><div class="avatar ${l.status === 'disqualified' ? 'light' : ''}">${esc(initials(l))}</div><span style="overflow:hidden;text-overflow:ellipsis">${esc(leadName(l))}</span></div></td>
                    <td>${esc(l.first_name || l.last_name ? l.company || '' : '')}</td>
                    <td>${tel ? `<a class="tel tnum" href="${esc(tel)}" data-call="${l.id}">${icon('phone')}${esc(fmtPhone(l.phone))}</a>` : '<span class="muted">—</span>'}</td>
                    <td>${showPipeCol && pipelineById(l.pipeline_id) ? `<span class="muted" style="font-size:12px">${esc(pipelineById(l.pipeline_id).name)} · </span>` : ''}<span class="chip">${esc(stageName(l.stage_id))}</span></td>
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
    if ($('#leads-stage')) $('#leads-stage').onchange = (e) => { v.stage = e.target.value; v.page = 0; rerenderIfOn('leads'); };
    if ($('#leads-pipe')) $('#leads-pipe').onchange = (e) => { v.pipeline = e.target.value === 'all' ? 'all' : Number(e.target.value); v.stage = ''; v.page = 0; rerenderIfOn('leads'); };
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
    if (canBulk) {
      $$('[data-sel]', view).forEach((c) => c.addEventListener('change', () => {
        const id = Number(c.dataset.sel);
        if (c.checked) sel.add(id); else sel.delete(id);
        rerenderIfOn('leads');
      }));
      if ($('#sel-page')) $('#sel-page').onchange = (e) => {
        pageRows.forEach((l) => { if (e.target.checked) sel.add(l.id); else sel.delete(l.id); });
        rerenderIfOn('leads');
      };
      if ($('#sel-all')) $('#sel-all').onclick = () => { list.forEach((l) => sel.add(l.id)); rerenderIfOn('leads'); };
      if ($('#sel-clear')) $('#sel-clear').onclick = () => { sel.clear(); rerenderIfOn('leads'); };
      if ($('#bulk-move')) $('#bulk-move').onclick = async () => {
        const target = pipelineById($('#bulk-pipe').value);
        if (!target) return;
        await bulkMove([...sel], target);
        sel.clear();
        rerenderIfOn('leads');
      };
      if ($('#bulk-delete')) $('#bulk-delete').onclick = async () => {
        if (await bulkDelete([...sel])) { sel.clear(); rerenderIfOn('leads'); }
      };
      if ($('#split-btn')) $('#split-btn').onclick = () => openSplit();
    }
    $$('tbody tr', view).forEach((tr) => tr.addEventListener('click', (e) => {
      if (e.target.closest('.cb-col')) return;
      const call = e.target.closest('[data-call]');
      if (call) { recordDial(Number(call.dataset.call)); return; }
      openLead(Number(tr.dataset.id));
    }));
  }

  /* ---------------------------------------------------------------- moving leads between pipelines (owner) */

  async function bulkMove(ids, target, stageId) {
    if (!ids.length) return null;
    try {
      const r = await api('/api/leads/bulk-move', { method: 'POST', body: { lead_ids: ids, pipeline_id: target.id, stage_id: stageId || undefined } });
      await Promise.all([loadLeads(), loadPipelines()]);
      toast(`${r.moved.toLocaleString()} lead${r.moved === 1 ? '' : 's'} moved to ${target.name}${r.skipped ? ` (${r.skipped} already there)` : ''}`);
      return r;
    } catch (e) { fail(e); return null; }
  }

  // Permanently deletes leads after a confirmation; larger batches need the count typed in.
  async function bulkDelete(ids) {
    const n = ids.length;
    if (!n) return false;
    const typed = n >= 10;
    const ok = await new Promise((resolve) => {
      const m = openModal(`
        <div class="modal-h"><div><h3>Delete ${n.toLocaleString()} lead${n === 1 ? '' : 's'}?</h3>
          <p>This permanently removes ${n === 1 ? 'the lead' : 'these leads'} and all of their notes and call history. It can't be undone. To keep a record instead, disqualify them, or export a CSV first.</p></div></div>
        ${typed ? `<div class="modal-b"><label class="field"><span>Type <b>${n}</b> to confirm</span><input class="input" id="del-confirm" inputmode="numeric" autocomplete="off"></label></div>` : ''}
        <div class="modal-f"><button class="btn" data-close>Cancel</button><button class="btn danger-solid" id="del-go" ${typed ? 'disabled' : ''}>${icon('trash')} Delete ${n.toLocaleString()} lead${n === 1 ? '' : 's'}</button></div>`);
      m._onClose = () => resolve(false);
      if (typed) {
        const inp = $('#del-confirm');
        inp.focus();
        inp.oninput = () => { $('#del-go').disabled = inp.value.trim() !== String(n); };
      } else $('#del-go').focus();
      $('#del-go').onclick = () => { m._onClose = null; closeModal(); resolve(true); };
    });
    if (!ok) return false;
    try {
      const r = await api('/api/leads/bulk-delete', { method: 'POST', body: { lead_ids: ids } });
      if (ids.includes(state.openLeadId)) closeDrawer();
      await Promise.all([loadLeads(), loadPipelines()]);
      state.otherLeads = { disqualified: null, all: null };
      toast(`${r.deleted.toLocaleString()} lead${r.deleted === 1 ? '' : 's'} deleted`);
      return true;
    } catch (e) { fail(e); return false; }
  }

  function openSplit() {
    const from0 = currentPipeline() || state.pipelines[0];
    const to0 = state.pipelines.find((p) => p.id !== from0.id) || from0;
    const m = openModal(`
      <div class="modal-h"><div><h3>Split leads between pipelines</h3><p>Move a share of one pipeline's leads into another, for example half of yours into Zakry's.</p></div>
        <button class="btn ghost icon close" aria-label="Close">${icon('x')}</button></div>
      <div class="modal-b">
        <div class="grid-2">
          <label class="field"><span>Take leads from</span><select class="select" id="sp-from">${pipelineOptions(from0.id, false)}</select></label>
          <label class="field"><span>Only this stage</span><select class="select" id="sp-stage"></select></label>
          <label class="field"><span>Move them to</span><select class="select" id="sp-to">${pipelineOptions(to0.id, false)}</select></label>
          <label class="field"><span>Into stage</span><select class="select" id="sp-tostage"></select></label>
        </div>
        <div class="field"><span>How many</span>
          <div class="seg" id="sp-amount"><button type="button" data-a="half" class="on">Half</button><button type="button" data-a="custom">Set a number</button><button type="button" data-a="all">All</button></div>
          <input class="input hidden" id="sp-count" type="number" min="1" placeholder="Number of leads" style="margin-top:8px">
        </div>
        <div class="field"><span>Which leads</span>
          <div class="seg" id="sp-mode"><button type="button" data-m="alternate" class="on">Every other one</button><button type="button" data-m="random">Random</button><button type="button" data-m="first">Top of the list</button></div>
          <small class="muted" id="sp-mode-help"></small>
        </div>
        <label class="check"><input type="checkbox" id="sp-new" checked> Only leads nobody has called yet</label>
        <div class="split-preview" id="sp-preview"></div>
      </div>
      <div class="modal-f"><button class="btn" data-close>Cancel</button><button class="btn primary" id="sp-go">${icon('arrow')} Move leads</button></div>`, { wide: true });
    let amount = 'half';
    let mode = 'alternate';
    const help = {
      alternate: 'Takes every second lead in board order, so both pipelines get a fair mix of the list.',
      random: 'Picks leads at random.',
      first: 'Takes leads from the top of the board, in order.',
    };
    const fillStages = () => {
      const from = pipelineById($('#sp-from').value);
      $('#sp-stage').innerHTML = `<option value="">All stages</option>${stageOptions(from, '')}`;
      $('#sp-tostage').innerHTML = stageOptions(pipelineById($('#sp-to').value), '');
    };
    const pick = () => {
      const fromId = Number($('#sp-from').value);
      const stageId = Number($('#sp-stage').value) || null;
      const pool = state.leads
        .filter((l) => l.pipeline_id === fromId && (!stageId || l.stage_id === stageId) && (!$('#sp-new').checked || !l.call_count))
        .sort((a, b) => stageSortKey(a) - stageSortKey(b) || a.position - b.position || a.id - b.id);
      let n = amount === 'all' ? pool.length : amount === 'half' ? Math.floor(pool.length / 2) : Math.min(pool.length, Math.max(0, Number($('#sp-count').value) || 0));
      let chosen;
      if (mode === 'first') chosen = pool.slice(0, n);
      else if (mode === 'random') chosen = pool.slice().sort(() => Math.random() - 0.5).slice(0, n);
      else {
        chosen = pool.filter((_, i) => i % 2 === 1).slice(0, n);
        if (chosen.length < n) chosen = chosen.concat(pool.filter((_, i) => i % 2 === 0).slice(0, n - chosen.length));
      }
      return { pool, chosen };
    };
    const preview = () => {
      const { pool, chosen } = pick();
      const same = $('#sp-from').value === $('#sp-to').value;
      $('#sp-mode-help').textContent = help[mode];
      $('#sp-preview').innerHTML = same
        ? 'Choose two different pipelines.'
        : `<b>${chosen.length.toLocaleString()}</b> of ${pool.length.toLocaleString()} matching lead${pool.length === 1 ? '' : 's'} will move from <b>${esc(pipelineById($('#sp-from').value).name)}</b> to <b>${esc(pipelineById($('#sp-to').value).name)}</b>.`;
      $('#sp-go').disabled = same || !chosen.length;
    };
    fillStages(); preview();
    $('#sp-from').onchange = () => { fillStages(); preview(); };
    $('#sp-to').onchange = () => { fillStages(); preview(); };
    $('#sp-stage').onchange = preview;
    $('#sp-new').onchange = preview;
    $('#sp-count').oninput = preview;
    $$('#sp-amount button', m).forEach((b) => b.onclick = () => {
      amount = b.dataset.a;
      $$('#sp-amount button', m).forEach((x) => x.classList.toggle('on', x === b));
      $('#sp-count').classList.toggle('hidden', amount !== 'custom');
      if (amount === 'custom') $('#sp-count').focus();
      preview();
    });
    $$('#sp-mode button', m).forEach((b) => b.onclick = () => {
      mode = b.dataset.m;
      $$('#sp-mode button', m).forEach((x) => x.classList.toggle('on', x === b));
      preview();
    });
    $('#sp-go').onclick = async () => {
      const { chosen } = pick();
      $('#sp-go').disabled = true;
      const r = await bulkMove(chosen.map((l) => l.id), pipelineById($('#sp-to').value), Number($('#sp-tostage').value));
      if (r) { closeModal(); rerenderIfOn('pipeline', 'leads', 'dashboard'); } else $('#sp-go').disabled = false;
    };
  }

  /* ================================================================ outlook, calendar, appointments, email */

  state.outlook = { configured: false, connected: false, email: null };
  async function loadOutlook() {
    state.outlook = await api('/api/outlook/status').catch(() => ({ configured: false, connected: false, email: null }));
  }

  const APPT_STATUS = {
    scheduled: { label: 'Scheduled', icon: 'calendar' },
    completed: { label: 'Completed', icon: 'check' },
    no_show: { label: 'No-show', icon: 'ban' },
    canceled: { label: 'Canceled', icon: 'x' },
  };
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function dayStart(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function plusDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function ymd(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function hm(d) { return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
  function fmtTime(d) { return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(':00', '').replace(' ', '').toLowerCase(); }
  function fmtRange(a, b) {
    const s = new Date(a); const e = new Date(b);
    const day = s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return `${day} · ${fmtTime(s)} – ${fmtTime(e)}`;
  }
  function apptLeadName(ap) { return ap.lead_id ? leadName(ap) : null; }

  function apptRowHtml(ap) {
    const st = APPT_STATUS[ap.status] || APPT_STATUS.scheduled;
    const past = new Date(ap.ends_at) < new Date();
    return `<button class="appt-row ${ap.status}" data-appt="${ap.id}">
      <span class="appt-date"><b>${new Date(ap.starts_at).getDate()}</b>${new Date(ap.starts_at).toLocaleDateString('en-US', { month: 'short' })}</span>
      <span class="li-main"><span class="li-title">${esc(ap.title)}</span><span class="li-sub">${esc(fmtRange(ap.starts_at, ap.ends_at))}${ap.location ? ' · ' + esc(ap.location) : ''}</span></span>
      <span class="chip ${ap.status === 'scheduled' && !past ? 'dark' : 'outline'}">${icon(st.icon)}${ap.status === 'scheduled' && past ? 'Needs update' : st.label}</span>
    </button>`;
  }

  state.cal = { view: 'month', anchor: dayStart(new Date()), selected: dayStart(new Date()), user: 'all' };

  function calRange() {
    const c = state.cal;
    if (c.view === 'week') {
      const start = plusDays(dayStart(c.anchor), -c.anchor.getDay());
      return { start, end: plusDays(start, 7) };
    }
    const first = new Date(c.anchor.getFullYear(), c.anchor.getMonth(), 1);
    const start = plusDays(first, -first.getDay());
    return { start, end: plusDays(start, 42) };
  }

  async function renderCalendar(view, alive) {
    const c = state.cal;
    const { start, end } = calRange();
    const q = new URLSearchParams({ from: start.toISOString(), to: end.toISOString(), outlook: '1', user: c.user });
    const [data, users] = await Promise.all([
      api(`/api/appointments?${q}`),
      isOwner() ? api('/api/users').catch(() => []) : Promise.resolve([]),
      state.leadsLoaded ? null : loadLeads(),
    ]);
    if (!alive()) return;
    const appts = data.appointments.map((a) => ({ ...a, kind: 'crm', s: new Date(a.starts_at), e: new Date(a.ends_at) }));
    const outs = data.outlookEvents.map((o) => ({ ...o, kind: 'outlook', s: new Date(o.starts_at), e: new Date(o.ends_at) }));
    const all = appts.concat(outs).sort((a, b) => a.s - b.s);
    const onDay = (d) => all.filter((ev) => (ev.all_day ? ev.s <= plusDays(dayStart(d), 1) && ev.e > dayStart(d) && !(ev.e.getTime() === dayStart(d).getTime()) : sameDay(ev.s, d)));
    const title = c.view === 'week'
      ? `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${plusDays(start, 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : c.anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const today = dayStart(new Date());
    const upcoming = appts.filter((a) => a.status === 'scheduled' && a.e >= new Date()).length;

    const outlookBar = state.outlook.connected
      ? `<span class="chip outline" title="Your Outlook events show as outlined blocks">${icon('check')}Outlook · ${esc(state.outlook.email || 'connected')}</span>`
      : state.outlook.configured
        ? `<a class="btn sm" href="/api/outlook/connect">${icon('mail')} Connect Outlook</a>`
        : `<span class="chip outline" title="Outlook isn't set up yet">${icon('mail')}Outlook not set up</span>`;

    const chip = (ev) => ev.kind === 'crm'
      ? `<button class="cal-ev crm ${ev.status}" data-appt="${ev.id}" title="${esc(ev.title)}"><b>${esc(fmtTime(ev.s))}</b> ${esc(apptLeadName(ev) || ev.title)}</button>`
      : `<a class="cal-ev out" href="${esc(ev.link || '#')}" target="_blank" rel="noopener" title="Outlook: ${esc(ev.title)}">${ev.all_day ? '' : `<b>${esc(fmtTime(ev.s))}</b> `}${esc(ev.title)}</a>`;

    let body;
    if (c.view === 'month') {
      const cells = [];
      for (let i = 0; i < 42; i++) {
        const d = plusDays(start, i);
        const evs = onDay(d);
        const other = d.getMonth() !== c.anchor.getMonth();
        cells.push(`<div class="cal-cell ${other ? 'other' : ''} ${sameDay(d, c.selected) ? 'sel' : ''}" data-day="${ymd(d)}">
          <div class="cal-num ${sameDay(d, today) ? 'today' : ''}">${d.getDate()}</div>
          <div class="cal-evs">${evs.slice(0, 3).map(chip).join('')}${evs.length > 3 ? `<span class="cal-more">+${evs.length - 3} more</span>` : ''}</div>
          ${evs.length ? `<span class="cal-dots">${evs.slice(0, 4).map((ev) => `<i class="${ev.kind}"></i>`).join('')}</span>` : ''}
        </div>`);
      }
      const selEvs = onDay(c.selected);
      body = `
        <div class="cal-month-wrap">
          <div class="cal-month card">
            <div class="cal-head">${WEEKDAYS.map((w) => `<div>${w}</div>`).join('')}</div>
            <div class="cal-grid">${cells.join('')}</div>
          </div>
          <aside class="cal-side card">
            <div class="card-h"><h3>${esc(c.selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))}</h3></div>
            <div class="card-b">
              ${selEvs.length ? `<div class="day-list">${selEvs.map((ev) => ev.kind === 'crm' ? apptRowHtml(ev) : `
                <a class="appt-row out" href="${esc(ev.link || '#')}" target="_blank" rel="noopener">
                  <span class="appt-date out">${icon('mail')}</span>
                  <span class="li-main"><span class="li-title">${esc(ev.title)}</span><span class="li-sub">${ev.all_day ? 'All day' : esc(`${fmtTime(ev.s)} – ${fmtTime(ev.e)}`)} · Outlook</span></span>
                </a>`).join('')}</div>` : '<div class="muted" style="padding:6px 0 12px">Nothing booked this day.</div>'}
              <button class="btn block" id="cal-add-day" style="margin-top:12px">${icon('plus')} Book on this day</button>
            </div>
          </aside>
        </div>`;
    } else {
      const H0 = 7; const H1 = 21; const PX = 52;
      const days = [...Array(7)].map((_, i) => plusDays(start, i));
      const allDayRow = days.map((d) => onDay(d).filter((ev) => ev.all_day).map(chip).join('')).map((h) => `<div class="wk-allday">${h}</div>`).join('');
      const cols = days.map((d) => {
        const evs = onDay(d).filter((ev) => !ev.all_day);
        // Side-by-side lanes for overlapping events.
        const lanes = [];
        const placed = evs.map((ev) => {
          let lane = lanes.findIndex((endAt) => endAt <= ev.s);
          if (lane === -1) { lane = lanes.length; lanes.push(ev.e); } else lanes[lane] = ev.e;
          return { ev, lane };
        });
        const groupWidth = (ev) => Math.max(1, ...placed.filter((p) => p.ev.s < ev.e && p.ev.e > ev.s).map((p) => p.lane + 1));
        const blocks = placed.map(({ ev, lane }) => {
          const top = Math.max(0, ((ev.s.getHours() + ev.s.getMinutes() / 60) - H0) * PX);
          const h = Math.max(22, ((ev.e - ev.s) / 3600000) * PX);
          const n = groupWidth(ev);
          const pos = `top:${top}px;height:${h}px;left:calc(${(lane / n) * 100}% + 2px);width:calc(${100 / n}% - 4px)`;
          const inner = `<b>${esc(fmtTime(ev.s))}</b><span>${esc(ev.kind === 'crm' ? (apptLeadName(ev) || ev.title) : ev.title)}</span>`;
          const short = h < 38 ? 'short' : '';
          return ev.kind === 'crm'
            ? `<button class="wk-ev crm ${ev.status} ${short}" data-appt="${ev.id}" style="${pos}" title="${esc(ev.title)}">${inner}</button>`
            : `<a class="wk-ev out ${short}" href="${esc(ev.link || '#')}" target="_blank" rel="noopener" style="${pos}" title="${esc(ev.title)}">${inner}</a>`;
        }).join('');
        return `<div class="wk-col ${sameDay(d, today) ? 'today' : ''}" data-day="${ymd(d)}" style="height:${(H1 - H0) * PX}px">${blocks}</div>`;
      }).join('');
      body = `
        <div class="card wk">
          <div class="wk-scroll">
            <div class="wk-inner">
              <div class="wk-head"><div></div>${days.map((d) => `<div class="${sameDay(d, today) ? 'today' : ''}"><span>${WEEKDAYS[d.getDay()]}</span><b>${d.getDate()}</b></div>`).join('')}</div>
              ${outs.some((o) => o.all_day) ? `<div class="wk-allrow"><div class="wk-gutter muted">all day</div>${allDayRow}</div>` : ''}
              <div class="wk-body">
                <div class="wk-hours">${[...Array(H1 - H0)].map((_, i) => `<div style="height:${PX}px">${fmtTime(new Date(2000, 0, 1, H0 + i))}</div>`).join('')}</div>
                <div class="wk-cols" style="--px:${PX}px">${cols}</div>
              </div>
            </div>
          </div>
        </div>`;
    }

    view.innerHTML = `
      <div class="cal-wrap">
        <div class="cal-toolbar">
          <div class="cal-nav">
            <button class="btn sm icon" id="cal-prev" aria-label="Previous">${icon('left')}</button>
            <button class="btn sm" id="cal-today">Today</button>
            <button class="btn sm icon" id="cal-next" aria-label="Next">${icon('right')}</button>
            <h2 class="cal-title">${esc(title)}</h2>
          </div>
          <span class="muted cal-count">${upcoming ? `${upcoming} upcoming` : ''}</span>
          <span class="spacer"></span>
          ${isOwner() && users.length > 1 ? `<select class="select" id="cal-user" style="width:auto;height:34px">
            <option value="all" ${c.user === 'all' ? 'selected' : ''}>Everyone</option>
            ${users.map((u) => `<option value="${u.id === state.user.id ? 'me' : u.id}" ${String(c.user) === String(u.id === state.user.id ? 'me' : u.id) ? 'selected' : ''}>${esc(u.id === state.user.id ? 'Just me' : u.name)}</option>`).join('')}
          </select>` : ''}
          <div class="seg" id="cal-view">
            <button data-v="month" class="${c.view === 'month' ? 'on' : ''}">Month</button>
            <button data-v="week" class="${c.view === 'week' ? 'on' : ''}">Week</button>
          </div>
          ${outlookBar}
          <button class="btn sm primary" id="cal-new">${icon('plus')} New appointment</button>
        </div>
        ${data.outlookError ? `<div class="cal-warn">${icon('ban')} Couldn't load your Outlook calendar: ${esc(data.outlookError)}</div>` : ''}
        ${body}
        <div class="cal-legend muted"><span><i class="crm"></i>Booked in M2</span>${state.outlook.connected ? '<span><i class="outlook"></i>Your other Outlook events</span>' : ''}</div>
      </div>`;

    const shift = (dir) => {
      if (c.view === 'week') c.anchor = plusDays(c.anchor, 7 * dir);
      else c.anchor = new Date(c.anchor.getFullYear(), c.anchor.getMonth() + dir, 1);
      route();
    };
    $('#cal-prev').onclick = () => shift(-1);
    $('#cal-next').onclick = () => shift(1);
    $('#cal-today').onclick = () => { c.anchor = dayStart(new Date()); c.selected = dayStart(new Date()); route(); };
    $$('#cal-view button').forEach((b) => b.onclick = () => { c.view = b.dataset.v; c.anchor = new Date(c.selected); route(); });
    if ($('#cal-user')) $('#cal-user').onchange = (e) => { c.user = e.target.value; route(); };
    $('#cal-new').onclick = () => openAppointmentForm({ date: c.selected });
    if ($('#cal-add-day')) $('#cal-add-day').onclick = () => openAppointmentForm({ date: c.selected });
    view.querySelectorAll('[data-appt]').forEach((el) => el.addEventListener('click', (e) => {
      e.stopPropagation();
      const ap = appts.find((x) => String(x.id) === el.dataset.appt);
      if (ap) openAppointmentDetail(ap);
    }));
    view.querySelectorAll('.cal-ev.out, .wk-ev.out').forEach((el) => el.addEventListener('click', (e) => e.stopPropagation()));
    view.querySelectorAll('.cal-cell').forEach((cell) => cell.addEventListener('click', () => {
      const [y, m, d] = cell.dataset.day.split('-').map(Number);
      c.selected = new Date(y, m - 1, d);
      if (c.selected.getMonth() !== c.anchor.getMonth()) c.anchor = new Date(y, m - 1, 1);
      rerenderIfOn('calendar');
    }));
    view.querySelectorAll('.wk-col').forEach((col) => col.addEventListener('click', (e) => {
      if (e.target !== col) return;
      const [y, m, d] = col.dataset.day.split('-').map(Number);
      const mins = Math.round(((e.offsetY / 52) * 60) / 30) * 30;
      openAppointmentForm({ date: new Date(y, m - 1, d, 7, mins) });
    }));
  }

  // Lead picker used in the appointment form.
  function leadPickerHtml(lead) {
    return lead
      ? `<div class="lead-pick-chosen"><div class="avatar" style="width:30px;height:30px;font-size:11px">${esc(initials(lead))}</div>
          <div class="li-main"><div class="li-title">${esc(leadName(lead))}</div><div class="li-sub">${esc([leadSub(lead), lead.email].filter(Boolean).join(' · ') || 'No email on file')}</div></div>
          <button type="button" class="btn sm ghost" id="lp-change">Change</button></div>`
      : `<div class="lead-pick"><input class="input" id="lp-q" placeholder="Search for a lead (optional)…" autocomplete="off"><div class="search-results hidden" id="lp-results"></div></div>`;
  }

  function openAppointmentForm({ lead = null, date = null, appt = null } = {}) {
    const editing = !!appt;
    let chosen = lead || (appt && appt.lead_id ? { ...appt, id: appt.lead_id, email: appt.lead_email } : null);
    if (chosen && !editing) {
      const full = state.leads.find((l) => l.id === chosen.id);
      if (full) chosen = { ...full, ...chosen };
    }
    const start = appt ? new Date(appt.starts_at) : (() => {
      const d = date ? new Date(date) : new Date();
      if (!date || (date.getHours() === 0 && date.getMinutes() === 0)) {
        const now = new Date();
        if (sameDay(d, now)) { d.setHours(now.getHours() + 1, 0, 0, 0); } else d.setHours(10, 0, 0, 0);
      }
      return d;
    })();
    const dur = appt ? Math.round((new Date(appt.ends_at) - new Date(appt.starts_at)) / 60000) : 20;
    const durations = [15, 20, 30, 45, 60, 90, 120];
    if (!durations.includes(dur)) durations.push(dur);
    const m = openModal(`
      <div class="modal-h"><div><h3>${editing ? 'Edit appointment' : 'Book an appointment'}</h3><p>${editing ? (appt.outlook_event_id ? 'Changes also update the Outlook event.' : 'Changes are saved in the CRM.') : 'Saved to the CRM calendar, and to Outlook if you choose.'}</p></div>
        <button class="btn ghost icon close" aria-label="Close">${icon('x')}</button></div>
      <form id="appt-form">
        <div class="modal-b">
          <div class="field"><span>Lead</span><div id="lp-wrap">${leadPickerHtml(chosen)}</div></div>
          <label class="field"><span>Title</span><input class="input" name="title" maxlength="200" required value="${esc(appt ? appt.title : chosen ? `M2 · ${spokenCompany(chosen.company) || leadName(chosen)}` : '')}"></label>
          <div class="appt-when">
            <label class="field"><span>Date</span><input class="input" type="date" name="date" required value="${ymd(start)}"></label>
            <label class="field"><span>Start time</span><input class="input" type="time" name="time" step="300" required value="${hm(start)}"></label>
            <label class="field"><span>Length</span><select class="select" name="duration">${durations.sort((a, b) => a - b).map((n) => `<option value="${n}" ${n === dur ? 'selected' : ''}>${n < 60 ? `${n} min` : `${n / 60} hr`.replace('.5 hr', '½ hr')}</option>`).join('')}</select></label>
          </div>
          <label class="field"><span>Location</span><input class="input" name="location" maxlength="300" placeholder="Their shop, a Zoom link, a phone call…" value="${esc(appt ? appt.location || '' : chosen ? [chosen.address, chosen.city].filter(Boolean).join(', ') : '')}"></label>
          <label class="field"><span>Notes</span><textarea class="textarea" name="notes" style="min-height:70px" placeholder="What to prepare, who'll be there…">${esc(appt ? appt.notes || '' : '')}</textarea></label>
          ${editing ? '' : `<div class="appt-opts" id="appt-opts"></div>`}
        </div>
        <div class="modal-f"><button type="button" class="btn" data-close>Cancel</button><button type="submit" class="btn primary" id="appt-save">${icon('check')} ${editing ? 'Save changes' : 'Book appointment'}</button></div>
      </form>`, { wide: true });

    const renderOpts = () => {
      if (editing) return;
      const ol = state.outlook;
      const email = chosen && splitFirstEmail(chosen.email);
      const pipe = chosen && pipelineById(chosen.pipeline_id);
      const apptStage = pipe && pipe.stages.find((st) => st.kind === 'appointment');
      const cur = chosen && stageInfo(chosen.stage_id);
      const canMove = apptStage && cur && cur.stage.kind !== 'won' && cur.stage.position < apptStage.position;
      $('#appt-opts').innerHTML = `
        <label class="check ${ol.connected ? '' : 'disabled'}"><input type="checkbox" name="add_to_outlook" ${ol.connected ? 'checked' : 'disabled'}> Add to my Outlook calendar
          ${ol.connected ? `<span class="muted">· ${esc(ol.email || '')}</span>` : ol.configured ? '<a href="/api/outlook/connect" class="muted">· connect Outlook</a>' : '<span class="muted">· Outlook not set up</span>'}</label>
        ${chosen ? `<label class="check ${ol.connected && email ? '' : 'disabled'}"><input type="checkbox" name="invite_lead" ${ol.connected && email ? 'checked' : 'disabled'}> Email an Outlook invite to ${email ? `<b>${esc(email)}</b>` : 'the lead <span class="muted">· no email on file</span>'}</label>` : ''}
        ${canMove ? `<label class="check"><input type="checkbox" name="move_stage" checked> Move lead to <b>${esc(apptStage.name)}</b></label>` : ''}`;
      const add = $('#appt-form').add_to_outlook;
      const inv = $('#appt-form').invite_lead;
      if (add && inv) add.onchange = () => { inv.disabled = !add.checked || !(ol.connected && email); if (!add.checked) inv.checked = false; };
    };

    const bindPicker = () => {
      if ($('#lp-change')) $('#lp-change').onclick = () => { chosen = null; $('#lp-wrap').innerHTML = leadPickerHtml(null); bindPicker(); renderOpts(); $('#lp-q').focus(); };
      const inp = $('#lp-q');
      if (!inp) return;
      const box = $('#lp-results');
      inp.oninput = () => {
        const q = inp.value.trim().toLowerCase();
        if (!q) { box.classList.add('hidden'); return; }
        const res = state.leads.filter((l) => matches(l, q, digits(q))).slice(0, 8);
        box.innerHTML = res.length ? res.map((l) => `<div class="sr" data-id="${l.id}"><div class="li-main"><div class="li-title">${esc(leadName(l))}</div><div class="li-sub">${esc([leadSub(l), l.email].filter(Boolean).join(' · '))}</div></div></div>`).join('') : '<div class="sr-empty">No matching leads</div>';
        box.classList.remove('hidden');
      };
      box.onmousedown = async (e) => {
        const r = e.target.closest('[data-id]');
        if (!r) return;
        e.preventDefault();
        const l = state.leads.find((x) => x.id === Number(r.dataset.id));
        try { chosen = (await api(`/api/leads/${l.id}`)).lead; } catch { chosen = l; }
        $('#lp-wrap').innerHTML = leadPickerHtml(chosen);
        const f = $('#appt-form');
        if (!f.title.value) f.title.value = `M2 · ${spokenCompany(chosen.company) || leadName(chosen)}`;
        if (!f.location.value) f.location.value = [chosen.address, chosen.city].filter(Boolean).join(', ');
        bindPicker(); renderOpts();
      };
    };
    bindPicker(); renderOpts();
    // The quick lead list lacks emails/addresses; fetch the full lead when booking from the calendar search.
    if (chosen && !editing && chosen.email === undefined) {
      api(`/api/leads/${chosen.id}`).then((r) => { chosen = { ...chosen, ...r.lead }; renderOpts(); }).catch(() => {});
    }

    $('#appt-form').onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target;
      const [y, mo, d] = f.date.value.split('-').map(Number);
      const [hh, mi] = f.time.value.split(':').map(Number);
      const s = new Date(y, mo - 1, d, hh, mi);
      const en = new Date(s.getTime() + Number(f.duration.value) * 60000);
      const body = { title: f.title.value, starts_at: s.toISOString(), ends_at: en.toISOString(), location: f.location.value, notes: f.notes.value };
      const btn = $('#appt-save');
      btn.disabled = true;
      try {
        if (editing) {
          const r = await api(`/api/appointments/${appt.id}`, { method: 'PATCH', body });
          toast(r.warning || 'Appointment updated', { duration: r.warning ? 6000 : 3800 });
        } else {
          Object.assign(body, {
            lead_id: chosen ? chosen.id : null,
            add_to_outlook: !!(f.add_to_outlook && f.add_to_outlook.checked),
            invite_lead: !!(f.invite_lead && f.invite_lead.checked),
            move_stage: !!(f.move_stage && f.move_stage.checked),
          });
          const r = await api('/api/appointments', { method: 'POST', body });
          toast(`Booked ${fmtRange(r.appointment.starts_at, r.appointment.ends_at)}${body.invite_lead ? ' · invite sent' : body.add_to_outlook ? ' · added to Outlook' : ''}${r.movedTo ? ` · moved to ${r.movedTo}` : ''}`, { duration: 6000 });
          if (r.movedTo) await loadLeads();
        }
        closeModal();
        state.cal.selected = dayStart(s);
        rerenderAfterAppt(chosen && chosen.id);
      } catch (err) { fail(err); btn.disabled = false; }
    };
  }

  function splitFirstEmail(v) {
    return String(v || '').split(/[;,\s]+/).find((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)) || null;
  }

  function rerenderAfterAppt(leadId) {
    if (currentRoute() === 'calendar') route();
    else rerenderIfOn('pipeline', 'leads', 'dashboard');
    if (leadId) refreshDrawerIf(leadId);
  }

  function openAppointmentDetail(ap) {
    const st = APPT_STATUS[ap.status] || APPT_STATUS.scheduled;
    const mine = ap.user_id === state.user.id;
    const m = openModal(`
      <div class="modal-h"><div><h3>${esc(ap.title)}</h3><p>${esc(fmtRange(ap.starts_at, ap.ends_at))}</p></div>
        <button class="btn ghost icon close" aria-label="Close">${icon('x')}</button></div>
      <div class="modal-b">
        <div class="appt-meta">
          <span class="chip ${ap.status === 'scheduled' ? 'dark' : 'outline'}">${icon(st.icon)}${st.label}</span>
          ${ap.outlook_event_id ? `<span class="chip outline">${icon('mail')}${ap.invite_sent ? 'Outlook invite sent' : 'On Outlook calendar'}</span>` : ''}
          ${ap.user_name ? `<span class="muted">Booked by ${esc(mine ? 'you' : ap.user_name)}</span>` : ''}
        </div>
        ${ap.lead_id ? `<button class="lead-pick-chosen as-link" id="ad-lead"><div class="avatar" style="width:30px;height:30px;font-size:11px">${esc(initials(ap))}</div>
          <div class="li-main"><div class="li-title">${esc(leadName(ap))}</div><div class="li-sub">${esc([ap.company && (ap.first_name || ap.last_name) ? ap.company : '', ap.lead_phone ? fmtPhone(ap.lead_phone) : '', ap.lead_email].filter(Boolean).join(' · '))}</div></div>${icon('right')}</button>` : ''}
        ${ap.location ? `<div class="info"><div class="k">Location</div><div class="v">${linkify(ap.location)}</div></div>` : ''}
        ${ap.notes ? `<div class="info"><div class="k">Notes</div><div class="v">${esc(ap.notes)}</div></div>` : ''}
        ${ap.outlook_link ? `<a class="btn sm" style="align-self:flex-start" href="${esc(ap.outlook_link)}" target="_blank" rel="noopener">${icon('external')} Open in Outlook</a>` : ''}
        <div class="appt-status-row">
          <span class="muted">Mark as</span>
          ${['completed', 'no_show', 'scheduled'].filter((k) => k !== ap.status).map((k) => `<button class="btn sm" data-status="${k}">${icon(APPT_STATUS[k].icon)} ${k === 'scheduled' ? 'Scheduled' : APPT_STATUS[k].label}</button>`).join('')}
        </div>
      </div>
      <div class="modal-f">
        <button class="btn ghost danger" id="ad-delete" style="margin-right:auto">${icon('trash')} Delete</button>
        ${ap.status !== 'canceled' ? `<button class="btn" id="ad-cancel">${icon('x')} Cancel appointment</button>` : ''}
        <button class="btn primary" id="ad-edit">${icon('edit')} Edit</button>
      </div>`, { wide: true });
    const update = async (body, msg) => {
      try {
        const r = await api(`/api/appointments/${ap.id}`, { method: 'PATCH', body });
        closeModal();
        toast(r.warning || msg, { duration: r.warning ? 6000 : 3800 });
        rerenderAfterAppt(ap.lead_id);
      } catch (e) { fail(e); }
    };
    if ($('#ad-lead')) $('#ad-lead').onclick = () => { closeModal(); openLead(ap.lead_id); };
    $$('[data-status]', m).forEach((b) => b.onclick = () => update({ status: b.dataset.status }, `Marked ${APPT_STATUS[b.dataset.status].label.toLowerCase()}`));
    if ($('#ad-cancel')) $('#ad-cancel').onclick = async () => {
      closeModal();
      if (!(await confirmDialog('Cancel this appointment?', ap.outlook_event_id && mine ? 'It will be canceled in Outlook too, and anyone invited will get a cancellation email.' : 'It stays on the calendar marked as canceled.', 'Cancel appointment'))) return;
      update({ status: 'canceled' }, 'Appointment canceled');
    };
    $('#ad-edit').onclick = () => { closeModal(); openAppointmentForm({ appt: ap }); };
    $('#ad-delete').onclick = async () => {
      closeModal();
      if (!(await confirmDialog('Delete this appointment?', ap.outlook_event_id && mine ? 'It will also be removed from your Outlook calendar.' : 'It will be removed from the CRM calendar.', 'Delete'))) return;
      try { await api(`/api/appointments/${ap.id}`, { method: 'DELETE' }); toast('Appointment deleted'); rerenderAfterAppt(ap.lead_id); } catch (e) { fail(e); }
    };
  }

  /* email */

  function emailTemplates(lead) {
    const first = lead.first_name || 'there';
    const co = spokenCompany(lead.company) || 'your business';
    const me = (state.user.name || '').split(' ')[0];
    const next = (lead.appointments || []).filter((a) => a.status === 'scheduled' && new Date(a.starts_at) > new Date()).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))[0];
    const when = next ? new Date(next.starts_at).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '[day and time]';
    return {
      blank: { label: 'Blank', subject: '', body: '' },
      followup: {
        label: 'Follow-up after a call',
        subject: `Great talking with you, ${first}`,
        body: `Hi ${first},\n\nThanks for taking the time to talk today. Like I mentioned, we help businesses like ${co} turn their Facebook and Instagram into something that brings in work, without ads or paying for leads.\n\nI'd love to grab 20 minutes to show you what we'd post for ${co} and what it would cost. What day works best for you this week?\n\nThanks,\n${me}\nM2`,
      },
      confirm: {
        label: 'Appointment confirmation',
        subject: `Confirmed: M2 meeting${next ? ' on ' + new Date(next.starts_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : ''}`,
        body: `Hi ${first},\n\nLooking forward to meeting on ${when}${next && next.location ? ` at ${next.location}` : ''}. I'll walk you through what we'd post for ${co} and what it would cost.\n\nIf you get a chance beforehand, feel free to text me a few pictures from recent jobs.\n\nSee you then,\n${me}\nM2`,
      },
      missed: {
        label: "Couldn't reach you",
        subject: `Quick question for ${co}`,
        body: `Hi ${first},\n\nI tried giving you a call but couldn't catch you. I'm with M2. We help businesses like ${co} get more customers from their own Facebook and Instagram, without ads.\n\nWould you be open to a quick 20-minute chat this week?\n\nThanks,\n${me}\nM2`,
      },
    };
  }

  function openEmail(lead) {
    const ol = state.outlook;
    const tpls = emailTemplates(lead);
    const to = (lead.email || '').split(/[;,\s]+/).filter(Boolean).join(', ');
    const m = openModal(`
      <div class="modal-h"><div><h3>Email ${esc(leadName(lead))}</h3><p>${ol.connected ? `Sends from your Outlook (${esc(ol.email || '')}) and is saved to your Sent folder.` : 'Connect Outlook in Settings to send from the CRM. Until then this opens your email app.'}</p></div>
        <button class="btn ghost icon close" aria-label="Close">${icon('x')}</button></div>
      <form id="email-form">
        <div class="modal-b">
          <div class="email-tpls">${Object.entries(tpls).map(([k, t]) => `<button type="button" class="btn sm ${k === 'blank' ? '' : ''}" data-tpl="${k}">${esc(t.label)}</button>`).join('')}</div>
          <label class="field"><span>To</span><input class="input" name="to" value="${esc(to)}" placeholder="name@example.com" required></label>
          <label class="field"><span>Subject</span><input class="input" name="subject" maxlength="300" required></label>
          <label class="field"><span>Message</span><textarea class="textarea email-body" name="body" required></textarea></label>
        </div>
        <div class="modal-f">
          <button type="button" class="btn" data-close>Cancel</button>
          ${ol.connected ? `<button type="submit" class="btn primary" id="email-send">${icon('mail')} Send email</button>` : `<button type="submit" class="btn primary">${icon('external')} Open in email app</button>`}
        </div>
      </form>`, { wide: true });
    const f = $('#email-form');
    $$('[data-tpl]', m).forEach((b) => b.onclick = () => {
      const t = tpls[b.dataset.tpl];
      f.subject.value = t.subject; f.body.value = t.body;
      $$('[data-tpl]', m).forEach((x) => x.classList.toggle('primary', x === b));
    });
    (to ? f.subject : f.to).focus();
    f.onsubmit = async (e) => {
      e.preventDefault();
      if (!ol.connected) {
        location.href = `mailto:${encodeURIComponent(f.to.value)}?subject=${encodeURIComponent(f.subject.value)}&body=${encodeURIComponent(f.body.value)}`;
        closeModal();
        return;
      }
      const btn = $('#email-send');
      btn.disabled = true;
      try {
        await api(`/api/leads/${lead.id}/email`, { method: 'POST', body: { to: f.to.value, subject: f.subject.value, body: f.body.value } });
        closeModal();
        toast(`Email sent to ${f.to.value}`);
        refreshDrawerIf(lead.id);
      } catch (err) { fail(err); btn.disabled = false; }
    };
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
      const panel = document.createElement('aside'); panel.className = 'talk-panel';
      panel.setAttribute('aria-label', 'Talk track');
      document.body.append(scrim, panel, drawer);
      scrim.onclick = () => closeDrawer();
      requestAnimationFrame(() => { scrim.classList.add('show'); drawer.classList.add('show'); panel.classList.add('show'); });
      drawer.innerHTML = '<div class="loading" style="flex:1"><div class="spinner"></div></div>';
    }
    await loadDrawer(id);
  }

  function closeDrawer(instant) {
    state.openLeadId = null;
    state.drawerEdit = false;
    const scrim = $('.scrim'); const drawer = $('.drawer'); const panel = $('.talk-panel');
    if (!drawer) return;
    if (instant) { scrim.remove(); drawer.remove(); if (panel) panel.remove(); return; }
    scrim.classList.remove('show'); drawer.classList.remove('show'); if (panel) panel.classList.remove('show');
    setTimeout(() => { scrim.remove(); drawer.remove(); if (panel) panel.remove(); }, 220);
  }

  function refreshDrawerIf(id) { if (state.openLeadId === id) loadDrawer(id); }

  async function loadDrawer(id) {
    const seq = ++drawerSeq;
    let data;
    let appts = [];
    try {
      [data, appts] = await Promise.all([
        api(`/api/leads/${id}`),
        api(`/api/appointments?lead_id=${id}`).then((r) => r.appointments).catch(() => []),
      ]);
    } catch (e) { fail(e); closeDrawer(); return; }
    if (seq !== drawerSeq || state.openLeadId !== id) return;
    data.lead.appointments = appts;
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
    const leadPipe = pipelineById(lead.pipeline_id);
    const leadStages = leadPipe ? leadPipe.stages : [];
    const curIdx = leadStages.findIndex((st) => st.id === lead.stage_id);

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
          <button class="btn sm show-talk" id="show-talk" title="Show talk track">${icon('script')} Talk track</button>
          <button class="btn ghost icon close" id="drawer-close" aria-label="Close">${icon('x')}</button>
        </div>
        <div class="drawer-tabs seg">
          <button data-tab="lead" class="${state.drawerTab !== 'script' ? 'on' : ''}">${icon('users')} Lead</button>
          <button data-tab="script" class="${state.drawerTab === 'script' ? 'on' : ''}">${icon('script')} Talk track</button>
        </div>
        ${isDq ? `
          <div class="dq-banner">${icon('ban')}<div><div class="t">Disqualified · ${esc(lead.dq_reason || 'Other')}</div><div class="s">${esc(relTime(lead.dq_at))} · was in ${esc(stageName(lead.stage_id))}</div></div>
            <button class="btn sm" id="requalify">${icon('undo')} Restore</button></div>` : `
          <div class="stepper" style="grid-template-columns:repeat(${leadStages.length}, minmax(0, 1fr))">
            ${leadStages.map((st, i) => `<button class="step ${i === curIdx ? 'current' : i < curIdx ? 'done' : ''}" data-stage="${st.id}" title="${esc(st.name)}">${esc(st.name)}</button>`).join('')}
          </div>`}
        ${isOwner() && multiPipeline() ? `
          <label class="pipe-move"><span>Pipeline</span>
            <select class="select" id="lead-pipe">${pipelineOptions(lead.pipeline_id, false)}</select>
          </label>` : ''}
      </div>
      <div class="drawer-script">${talkTrackHtml(lead, 'tab')}</div>
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
          <div class="lead-actions">
            <button class="btn sm" id="lead-email">${icon('mail')} Email</button>
            <button class="btn sm" id="lead-book">${icon('calendar')} Book appointment</button>
          </div>
        </div>

        ${(lead.appointments || []).length ? `
        <div>
          <div class="section-h"><h4>Appointments</h4></div>
          <div class="appt-list">
            ${lead.appointments.slice().sort((x, y) => new Date(y.starts_at) - new Date(x.starts_at)).map((ap) => apptRowHtml(ap)).join('')}
          </div>
        </div>` : ''}

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
                  ${a.type === 'email' && a.body ? `<div class="tl-body">${esc(a.body.split('\n').slice(2).join('\n').slice(0, 1200))}</div><div class="tl-time" style="margin-top:4px">To ${esc(((a.meta && a.meta.to) || []).join(', '))}</div>` : ''}
                  ${a.type === 'appointment' && a.meta && a.meta.event === 'booked' ? `<div class="tl-time" style="margin-top:2px">${esc(a.body || '')}${a.meta.invited ? ' · Outlook invite sent' : ''}</div>` : ''}
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
    drawer.classList.toggle('tab-script', state.drawerTab === 'script');
    $$('.drawer-tabs button', drawer).forEach((b) => b.onclick = () => {
      state.drawerTab = b.dataset.tab;
      drawer.classList.toggle('tab-script', state.drawerTab === 'script');
      $$('.drawer-tabs button', drawer).forEach((x) => x.classList.toggle('on', x === b));
    });
    $('#show-talk').onclick = () => setTalkPanelHidden(false);
    bindTalkTrack($('.drawer-script', drawer), lead);
    renderTalkPanel(lead);

    $$('.step', drawer).forEach((b) => b.onclick = async () => {
      const s = Number(b.dataset.stage);
      if (s === lead.stage_id) return;
      try {
        const u = await api(`/api/leads/${lead.id}/move`, { method: 'POST', body: { stage_id: s } });
        upsertLocal(u); sortLocal();
        toast(`Moved to ${stageName(s)}`);
        rerenderIfOn('pipeline', 'leads');
        loadDrawer(lead.id);
      } catch (e) { fail(e); }
    });

    $('#lead-email').onclick = () => openEmail(lead);
    $('#lead-book').onclick = () => openAppointmentForm({ lead });
    $$('[data-appt]', drawer).forEach((el) => el.addEventListener('click', () => {
      const ap = lead.appointments.find((x) => String(x.id) === el.dataset.appt);
      if (ap) openAppointmentDetail(ap);
    }));
    if ($('#lead-pipe')) $('#lead-pipe').onchange = async (e) => {
      const target = pipelineById(e.target.value);
      if (!target || target.id === lead.pipeline_id) return;
      try {
        const u = await api(`/api/leads/${lead.id}/move`, { method: 'POST', body: { pipeline_id: target.id } });
        upsertLocal(u); sortLocal();
        toast(`Moved to ${target.name} · ${stageName(u.stage_id)}`);
        rerenderIfOn('pipeline', 'leads');
        loadDrawer(lead.id);
      } catch (err) { fail(err); e.target.value = lead.pipeline_id; }
    };

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
        toast(`Restored to ${stageName(u.stage_id)}`);
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

  /* ---------------------------------------------------------------- talk track */

  function talkPanelHidden() { try { return localStorage.getItem('m2.talkPanel') === 'hidden'; } catch { return false; } }
  function setTalkPanelHidden(hidden) {
    try { localStorage.setItem('m2.talkPanel', hidden ? 'hidden' : 'shown'); } catch { /* ignore */ }
    document.body.classList.toggle('talk-hidden', hidden);
  }

  function renderTalkPanel(lead) {
    const panel = $('.talk-panel');
    if (!panel) return;
    document.body.classList.toggle('talk-hidden', talkPanelHidden());
    // Only rebuild when switching leads so checkboxes, scroll and typing survive drawer refreshes.
    if (panel.dataset.lead === String(lead.id) && panel.innerHTML) return;
    panel.dataset.lead = lead.id;
    panel.innerHTML = `
      <div class="talk-head">
        <div class="talk-title">${icon('script')}<div><b>Talk track</b><div class="muted">${esc(leadName(lead))}${lead.company && (lead.first_name || lead.last_name) ? ' · ' + esc(lead.company) : ''}</div></div></div>
        <button class="btn ghost icon sm" id="hide-talk" title="Hide talk track" aria-label="Hide talk track">${icon('x')}</button>
      </div>
      <div class="talk-scroll">${talkTrackHtml(lead, 'panel')}</div>`;
    $('#hide-talk').onclick = () => setTalkPanelHidden(true);
    bindTalkTrack($('.talk-scroll', panel), lead);
  }

  function talkTokens(lead) {
    const me = (state.user && state.user.name || '').trim().split(/\s+/)[0];
    return { owner: lead.first_name, name: me, company: spokenCompany(lead.company), town: lead.city, observation: lead.social_note };
  }

  // "Heart of Texas Mechanical Contracting, LLC" -> "Heart of Texas Mechanical Contracting" (how you'd say it on a call)
  function spokenCompany(name) {
    let n = String(name || '').replace(/\s*\([^)]*\)/g, '').trim();
    let prev;
    do {
      prev = n;
      n = n.replace(/[,\s]+(l\.?l\.?c\.?|inc\.?|incorporated|corp\.?|corporation|ltd\.?|llp|pllc|lp)$/i, '').trim();
    } while (n !== prev && n);
    return n || String(name || '').trim();
  }

  function fillTokens(escapedText, tokens) {
    return escapedText.replace(/\[([^\]\n]{1,60})\]/g, (m, label) => {
      const key = label.trim().toLowerCase();
      if (key in tokens) {
        const v = tokens[key];
        return v
          ? `<span class="tok filled" data-tok="${key}">${esc(v)}</span>`
          : `<span class="tok blank" data-tok="${key}">${label}</span>`;
      }
      return `<span class="tok blank">${label}</span>`;
    }).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  }

  function talkTrackHtml(lead, where) {
    const tokens = talkTokens(lead);
    const checked = (state.talkChecks && state.talkChecks[lead.id]) || {};
    const lines = String(state.talkTrack || '').replace(/\r/g, '').split('\n');
    let html = '';
    let list = null;
    let checkIdx = 0;
    const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
    const openList = (tag, cls) => { if (list !== tag) { closeList(); html += `<${tag} class="${cls}">`; list = tag; } };
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { closeList(); continue; }
      let m;
      if ((m = line.match(/^#{1,3}\s+(.*)/))) { closeList(); html += `<h4 class="tt-h">${fillTokens(esc(m[1]), tokens)}</h4>`; continue; }
      if ((m = line.match(/^>\s?(.*)/))) { closeList(); html += `<blockquote class="tt-say">${fillTokens(esc(m[1]), tokens)}</blockquote>`; continue; }
      if ((m = line.match(/^[-*]\s+\[( |x)\]\s+(.*)/i))) {
        openList('ul', 'tt-checks');
        const i = checkIdx++;
        html += `<li><label class="check"><input type="checkbox" data-check="${i}" ${checked[i] ? 'checked' : ''}><span>${fillTokens(esc(m[2]), tokens)}</span></label></li>`;
        continue;
      }
      if ((m = line.match(/^\d+[.)]\s+(.*)/))) { openList('ol', 'tt-ol'); html += `<li>${fillTokens(esc(m[1]), tokens)}</li>`; continue; }
      if ((m = line.match(/^[-*]\s+(.*)/))) { openList('ul', 'tt-ul'); html += `<li>${fillTokens(esc(m[1]), tokens)}</li>`; continue; }
      closeList();
      html += `<p class="tt-p">${fillTokens(esc(line), tokens)}</p>`;
    }
    closeList();

    const q = [lead.company || leadName(lead), lead.city].filter(Boolean).join(' ');
    const website = lead.website ? (/^https?:\/\//i.test(lead.website) ? lead.website : 'https://' + lead.website) : null;
    const prep = `
      <div class="tt-prep">
        <div class="tt-prep-h">${icon('eye')} Before you dial</div>
        <div class="tt-links">
          <a class="btn sm" target="_blank" rel="noopener" href="https://www.facebook.com/search/top?q=${encodeURIComponent(q)}">Facebook ${icon('external')}</a>
          <a class="btn sm" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(q + ' instagram')}">Instagram ${icon('external')}</a>
          ${website ? `<a class="btn sm" target="_blank" rel="noopener" href="${esc(website)}">Website ${icon('external')}</a>` : ''}
        </div>
        <label class="field"><span>What you noticed on their page <span class="muted" style="font-weight:500">· fills in [observation]</span></span>
          <input class="input tt-obs" data-where="${where}" placeholder="e.g. last post was in March" value="${esc(lead.social_note || '')}" maxlength="300">
        </label>
      </div>`;
    return `<div class="talk-track">${prep}${html}</div>`;
  }

  function bindTalkTrack(root, lead) {
    if (!root) return;
    const obs = root.querySelector('.tt-obs');
    if (obs) {
      const sync = () => {
        const v = obs.value.trim();
        $$('.tok[data-tok="observation"]').forEach((t) => {
          t.textContent = v || 'observation';
          t.classList.toggle('filled', !!v); t.classList.toggle('blank', !v);
        });
        $$('.tt-obs').forEach((o) => { if (o !== obs) o.value = obs.value; });
      };
      obs.addEventListener('input', sync);
      obs.addEventListener('change', async () => {
        const v = obs.value.trim();
        if (v === (lead.social_note || '')) return;
        try {
          const u = await api(`/api/leads/${lead.id}`, { method: 'PATCH', body: { social_note: v } });
          lead.social_note = u.social_note;
          toast('Observation saved');
        } catch (e) { fail(e); }
      });
    }
    root.querySelectorAll('[data-check]').forEach((c) => c.addEventListener('change', () => {
      state.talkChecks = state.talkChecks || {};
      const map = (state.talkChecks[lead.id] = state.talkChecks[lead.id] || {});
      map[c.dataset.check] = c.checked;
      $$(`[data-check="${c.dataset.check}"]`).forEach((x) => { x.checked = c.checked; });
    }));
  }

  function activityTitle(a) {
    if (a.type === 'call') return a.outcome ? `Call · ${OUTCOMES[a.outcome]}` : 'Call placed';
    if (a.type === 'note') return 'Note';
    if (a.type === 'stage') return 'Stage changed';
    if (a.type === 'disqualified') return `Disqualified · ${(a.meta && a.meta.reason) || 'Other'}`;
    if (a.type === 'requalified') return 'Restored to pipeline';
    if (a.type === 'created') return 'Lead added';
    if (a.type === 'email') return `Email sent · ${(a.meta && a.meta.subject) || ''}`;
    if (a.type === 'appointment') {
      if (a.meta && a.meta.event === 'booked') return `Appointment booked${a.meta.starts_at ? ' · ' + fmtDateTime(a.meta.starts_at) : ''}`;
      return a.body || 'Appointment updated';
    }
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
            ${multiPipeline() ? `<label class="field"><span>Pipeline</span><select class="select" name="pipeline_id" id="add-pipe">${pipelineOptions((currentPipeline() || {}).id, false)}</select></label>` : ''}
            <label class="field"><span>Stage</span><select class="select" name="stage_id" id="add-stage">${stageOptions(currentPipeline(), '')}</select></label>
            <label class="field span-2"><span>Notes</span><textarea class="textarea" name="notes" style="min-height:64px"></textarea></label>
          </div>
        </div>
        <div class="modal-f"><button type="button" class="btn" data-close>Cancel</button><button type="submit" class="btn primary">${icon('plus')} Add lead</button></div>
      </form>`);
    $('input[name=first_name]', m).focus();
    if ($('#add-pipe')) $('#add-pipe').onchange = (e) => { $('#add-stage').innerHTML = stageOptions(pipelineById(e.target.value), ''); };
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
              ${multiPipeline() ? `<label class="field"><span>Add leads to pipeline</span><select class="select" id="imp-pipe">${pipelineOptions(s.pipelineId, false)}</select></label>` : ''}
              <label class="field"><span>Starting stage</span><select class="select" id="imp-stage">${stageOptions(pipelineById(s.pipelineId), s.stageId)}</select></label>
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
      $('#imp-stage').onchange = (e) => { s.stageId = Number(e.target.value); };
      if ($('#imp-pipe')) $('#imp-pipe').onchange = (e) => {
        s.pipelineId = Number(e.target.value);
        s.stageId = (pipelineById(s.pipelineId).stages[0] || {}).id;
        $('#imp-stage').innerHTML = stageOptions(pipelineById(s.pipelineId), s.stageId);
      };
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
            <h3 style="margin-top:0">leads imported into ${multiPipeline() && pipelineById(s.pipelineId) ? esc(pipelineById(s.pipelineId).name) + ' · ' : ''}${esc(stageName(s.stageId))}</h3>
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
        mapping: autoMap(res.sheets[sheetIdx].headers), skipDuplicates: true, keepExtra: true,
        pipelineId: (currentPipeline() || {}).id, stageId: ((currentPipeline() || { stages: [] }).stages[0] || {}).id,
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
          body: {
            leads: rows.slice(i, i + 2000), pipeline_id: importState.pipelineId, stage_id: importState.stageId,
            skipDuplicates: importState.skipDuplicates, filename: importState.filename,
          },
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
    const [users] = await Promise.all([api('/api/users'), loadPipelines(), loadOutlook()]);
    if (!alive()) return;
    const ol = state.outlook;
    view.innerHTML = `
      <div class="settings">
        <div class="card" id="outlook-card">
          <div class="card-h"><h3>Outlook</h3><span class="sub">Send email and book appointments from the CRM</span></div>
          <div class="card-b">
            ${ol.connected ? `
              <div class="ol-row"><div class="dot-ic" style="background:var(--black);color:#fff">${icon('check')}</div>
                <div class="li-main"><div class="li-title">Connected as ${esc(ol.email || 'your Outlook account')}</div><div class="li-sub">Emails send from this address. Appointments go on this calendar and invites come from it.</div></div>
                <button class="btn sm" id="ol-disconnect">Disconnect</button></div>` : ol.configured ? `
              <div class="ol-row"><div class="dot-ic">${icon('mail')}</div>
                <div class="li-main"><div class="li-title">Connect your Outlook account</div><div class="li-sub">You'll sign in with Microsoft and approve access to send mail and manage your calendar. Each teammate connects their own account.</div></div>
                <a class="btn primary sm" href="/api/outlook/connect">${icon('mail')} Connect Outlook</a></div>` : isOwner() ? `
              <div class="ol-setup">
                <p><b>One-time setup.</b> Microsoft needs this CRM registered before anyone can connect Outlook. It's free and takes about 10 minutes:</p>
                <ol>
                  <li>Go to <a href="https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener">Microsoft Entra → App registrations</a> (sign in with your Outlook account) and click <b>New registration</b>.</li>
                  <li>Name it <b>M2 CRM</b>. Under <b>Supported account types</b> choose <b>Accounts in any organizational directory and personal Microsoft accounts</b>.</li>
                  <li>Under <b>Redirect URI</b> pick <b>Web</b> and paste: <code class="copy" id="ol-redirect">${esc(location.origin)}/api/outlook/callback</code></li>
                  <li>Click <b>Register</b>, then copy the <b>Application (client) ID</b>.</li>
                  <li>Open <b>Certificates &amp; secrets → New client secret</b>, create one, and copy its <b>Value</b>.</li>
                  <li>In Railway, open the <b>m2-crm</b> service → <b>Variables</b> and add <code>MS_CLIENT_ID</code> and <code>MS_CLIENT_SECRET</code> with those two values.</li>
                </ol>
                <p class="muted">Railway restarts the CRM on its own, and a <b>Connect Outlook</b> button appears here.</p>
              </div>` : `<div class="muted">Outlook isn't set up for this CRM yet. Ask the account owner to finish the setup in Settings.</div>`}
          </div>
        </div>

        ${isOwner() ? `
        <div class="card">
          <div class="card-h"><h3>Pipelines</h3><span class="sub">Give each teammate their own pipeline and stages</span><span class="chip outline right">${icon('award')}Owner only</span></div>
          <div class="card-b">
            <div id="pipe-list" class="pipe-list"></div>
            <form id="new-pipe" class="new-pipe">
              <label class="field"><span>New pipeline name</span><input class="input" name="name" placeholder="e.g. Zakry's pipeline" maxlength="60" required></label>
              <label class="field"><span>Assigned to</span><select class="select" name="user_id"><option value="">Unassigned (owner only)</option>${users.map((u) => `<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select></label>
              <button class="btn" type="submit">${icon('plus')} Add pipeline</button>
            </form>
          </div>
        </div>` : ''}

        ${isOwner() ? `
        <div class="card">
          <div class="card-h"><h3>Talk track</h3><span class="sub">Shown next to every lead you open</span><span class="chip outline right">${icon('award')}Owner only</span></div>
          <form class="card-b" id="tt-form">
            <textarea class="textarea tt-editor" name="text" spellcheck="true">${esc(state.talkTrack || '')}</textarea>
            <div class="tt-help muted">
              <b>## Heading</b> starts a section · <b>&gt; line</b> is something to say out loud · <b>1.</b> numbered question · <b>- [ ]</b> checkbox · <b>**bold**</b><br>
              <b>[Owner]</b>, <b>[Company]</b>, <b>[town]</b>, <b>[Name]</b> (you) and <b>[observation]</b> fill in automatically. Any other <b>[text]</b> shows as a blank to fill on the call.
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
              <button class="btn" type="button" id="tt-reset">Reset to original</button>
              <button class="btn primary" type="submit">Save talk track</button>
            </div>
          </form>
        </div>` : ''}

        <div class="card">
          <div class="card-h"><h3>Team</h3><span class="sub">People who can sign in to this CRM</span></div>
          <div class="card-b">
            ${users.map((u) => `<div class="user-row"><div class="avatar">${esc(initials({ first_name: u.name }))}</div><div class="li-main"><div class="li-title">${esc(u.name)}${u.id === state.user.id ? ' <span class="chip" style="margin-left:6px">You</span>' : ''}</div><div class="li-sub">${esc(u.email)}</div></div>
              ${u.role === 'owner' ? '<span class="chip dark">Owner</span>' : '<span class="chip outline">Teammate</span>'}
              ${u.id === state.user.id || !isOwner() || u.role === 'owner' ? '' : `<button class="btn sm ghost danger" data-rm="${u.id}" data-name="${esc(u.name)}">Remove</button>`}</div>`).join('')}
            ${!isOwner() ? '<p class="muted" style="margin:12px 0 0;font-size:13px">Only the account owner can add or remove teammates.</p>' : ''}
            <form id="user-form" ${isOwner() ? '' : 'hidden'} class="grid-2" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line-2)">
              <label class="field"><span>Name</span><input class="input" name="name" required></label>
              <label class="field"><span>Email</span><input class="input" name="email" type="email" required></label>
              <label class="field"><span>Temporary password</span><input class="input" name="password" type="password" minlength="8" required autocomplete="new-password"></label>
              <div style="display:flex;align-items:flex-end"><button class="btn block" type="submit">${icon('plus')} Add teammate</button></div>
              <label class="check span-2" style="font-size:13px"><input type="checkbox" name="createPipeline" checked> Create their own pipeline with the standard stages</label>
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

    if ($('#tt-form')) {
      $('#tt-form').onsubmit = async (e) => {
        e.preventDefault();
        try {
          const r = await api('/api/talk-track', { method: 'PUT', body: { text: e.target.text.value } });
          state.talkTrack = r.text;
          toast('Talk track saved');
        } catch (err) { fail(err); }
      };
      $('#tt-reset').onclick = async () => {
        if (!(await confirmDialog('Reset the talk track?', 'This replaces your edits with the original script.', 'Reset'))) return;
        try {
          const r = await api('/api/talk-track', { method: 'PUT', body: { reset: true } });
          state.talkTrack = r.text;
          $('#tt-form').text.value = r.text;
          toast('Talk track reset');
        } catch (err) { fail(err); }
      };
    }
    if ($('#pipe-list')) renderPipelineEditors(users);
    if ($('#ol-disconnect')) $('#ol-disconnect').onclick = async () => {
      if (!(await confirmDialog('Disconnect Outlook?', 'The CRM will stop sending email and adding events from your account. Existing Outlook events stay where they are.', 'Disconnect'))) return;
      try { state.outlook = await api('/api/outlook/disconnect', { method: 'POST' }); toast('Outlook disconnected'); route(); } catch (e) { fail(e); }
    };
    if ($('#ol-redirect')) $('#ol-redirect').onclick = () => { navigator.clipboard && navigator.clipboard.writeText($('#ol-redirect').textContent).then(() => toast('Copied')); };
    if ($('#new-pipe')) $('#new-pipe').onsubmit = async (e) => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(e.target));
      try {
        const r = await api('/api/pipelines', { method: 'POST', body });
        state.pipelines = r.pipelines;
        toast(`${body.name} created`);
        e.target.reset();
        renderPipelineEditors(users);
      } catch (err) { fail(err); }
    };
    if ($('#user-form')) $('#user-form').onsubmit = async (e) => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(e.target));
      body.createPipeline = !!e.target.createPipeline.checked;
      try {
        await api('/api/users', { method: 'POST', body });
        await loadPipelines();
        toast(body.createPipeline ? `Teammate added with their own pipeline. Share their email and temporary password with them.` : 'Teammate added. Share their email and temporary password with them.');
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

  /* ---------------------------------------------------------------- pipeline editors (owner) */

  const pipeDrafts = {};

  function draftFor(p) {
    if (!pipeDrafts[p.id]) {
      pipeDrafts[p.id] = {
        name: p.name, user_id: p.user_id || '',
        stages: p.stages.map((st) => ({ id: st.id, name: st.name, kind: st.kind, lead_count: Number(st.lead_count) || 0 })),
        dirty: false,
      };
    }
    return pipeDrafts[p.id];
  }

  function renderPipelineEditors(users) {
    const list = $('#pipe-list');
    if (!list) return;
    list.innerHTML = state.pipelines.map((p) => {
      const d = draftFor(p);
      return `
      <div class="pipe-edit" data-pid="${p.id}">
        <div class="pipe-edit-head">
          <label class="field" style="flex:1.4"><span>Pipeline name</span><input class="input" data-f="name" value="${esc(d.name)}" maxlength="60"></label>
          <label class="field" style="flex:1"><span>Assigned to</span><select class="select" data-f="user_id"><option value="">Unassigned (owner only)</option>${users.map((u) => `<option value="${u.id}" ${String(d.user_id) === String(u.id) ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></label>
          <div class="pipe-meta"><span class="chip">${p.active_count.toLocaleString()} active · ${p.lead_count.toLocaleString()} total</span></div>
        </div>
        <div class="stage-rows">
          ${d.stages.map((st, i) => `
            <div class="stage-row" data-i="${i}">
              <div class="stage-order">
                <button type="button" class="btn ghost icon sm" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="Move up">${icon('up')}</button>
                <button type="button" class="btn ghost icon sm" data-act="down" ${i === d.stages.length - 1 ? 'disabled' : ''} aria-label="Move down">${icon('down')}</button>
              </div>
              <span class="col-num">${i + 1}</span>
              <input class="input" data-sf="name" value="${esc(st.name)}" maxlength="40" placeholder="Stage name">
              <select class="select kind-select" data-sf="kind" title="Appointment and Won stages feed the dashboard and team stats">
                ${['open', 'appointment', 'won'].map((k) => `<option value="${k}" ${st.kind === k ? 'selected' : ''}>${STAGE_KIND_LABEL[k]}</option>`).join('')}
              </select>
              <span class="stage-count muted tnum" title="Leads in this stage">${st.id ? st.lead_count : 'new'}</span>
              <button type="button" class="btn ghost icon sm" data-act="remove" ${d.stages.length === 1 ? 'disabled' : ''} aria-label="Remove stage">${icon('x')}</button>
            </div>`).join('')}
        </div>
        <div class="pipe-edit-foot">
          <button type="button" class="btn sm" data-act="add">${icon('plus')} Add stage</button>
          <span class="muted pipe-hint">Mark one stage <b>Appointment</b> and one <b>Won</b> so the dashboard counts them.</span>
          <span style="flex:1"></span>
          ${state.pipelines.length > 1 ? `<button type="button" class="btn sm ghost danger" data-act="delete">${icon('trash')} Delete</button>` : ''}
          <button type="button" class="btn sm ${d.dirty ? 'primary' : ''}" data-act="save">${icon('check')} Save</button>
        </div>
      </div>`;
    }).join('');

    $$('.pipe-edit', list).forEach((box) => {
      const p = pipelineById(box.dataset.pid);
      const d = draftFor(p);
      const touch = () => { d.dirty = true; const b = box.querySelector('[data-act="save"]'); b.classList.add('primary'); };
      box.querySelectorAll('[data-f]').forEach((inp) => inp.addEventListener('input', () => { d[inp.dataset.f] = inp.value; touch(); }));
      box.querySelectorAll('.stage-row').forEach((row) => {
        const st = d.stages[Number(row.dataset.i)];
        row.querySelectorAll('[data-sf]').forEach((inp) => inp.addEventListener('input', () => { st[inp.dataset.sf] = inp.value; touch(); }));
      });
      box.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const act = btn.dataset.act;
        const row = btn.closest('.stage-row');
        const i = row ? Number(row.dataset.i) : -1;
        if (act === 'up' && i > 0) { [d.stages[i - 1], d.stages[i]] = [d.stages[i], d.stages[i - 1]]; d.dirty = true; renderPipelineEditors(users); }
        if (act === 'down' && i < d.stages.length - 1) { [d.stages[i + 1], d.stages[i]] = [d.stages[i], d.stages[i + 1]]; d.dirty = true; renderPipelineEditors(users); }
        if (act === 'remove') { d.stages.splice(i, 1); d.dirty = true; renderPipelineEditors(users); }
        if (act === 'add') {
          if (d.stages.length >= 15) { toast('A pipeline can have up to 15 stages', { error: true }); return; }
          d.stages.push({ id: null, name: '', kind: 'open', lead_count: 0 });
          d.dirty = true;
          renderPipelineEditors(users);
          const inputs = $$(`.pipe-edit[data-pid="${p.id}"] [data-sf="name"]`);
          inputs[inputs.length - 1].focus();
        }
        if (act === 'save') await savePipeline(p, d, users);
        if (act === 'delete') await deletePipeline(p, users);
      });
    });
  }

  async function savePipeline(p, d, users) {
    if (!d.name.trim()) { toast('Give the pipeline a name', { error: true }); return; }
    if (d.stages.some((st) => !st.name.trim())) { toast('Every stage needs a name', { error: true }); return; }
    const removed = p.stages.filter((st) => !d.stages.some((x) => x.id === st.id));
    const moving = removed.reduce((n, st) => n + (Number(st.lead_count) || 0), 0);
    if (moving && !(await confirmDialog(
      `Remove ${removed.length === 1 ? `"${removed[0].name}"` : `${removed.length} stages`}?`,
      `${moving} lead${moving === 1 ? '' : 's'} in ${removed.length === 1 ? 'that stage' : 'those stages'} will move to the stage before it.`,
      'Remove and save',
    ))) return;
    try {
      await api(`/api/pipelines/${p.id}`, { method: 'PATCH', body: { name: d.name, user_id: d.user_id || null } });
      state.pipelines = await api(`/api/pipelines/${p.id}/stages`, {
        method: 'PUT', body: { stages: d.stages.map((st) => ({ id: st.id, name: st.name, kind: st.kind })) },
      });
      delete pipeDrafts[p.id];
      await loadPipelines();
      await loadLeads();
      toast(`${d.name} saved`);
      renderPipelineEditors(users);
    } catch (err) { fail(err); }
  }

  async function deletePipeline(p, users) {
    const others = state.pipelines.filter((x) => x.id !== p.id);
    let moveTo = null;
    if (p.lead_count) {
      moveTo = await new Promise((resolve) => {
        const m = openModal(`
          <div class="modal-h"><div><h3>Delete ${esc(p.name)}?</h3><p>It has ${p.lead_count.toLocaleString()} lead${p.lead_count === 1 ? '' : 's'}. Choose where to move them. They'll land in that pipeline's first stage.</p></div></div>
          <div class="modal-b"><label class="field"><span>Move leads to</span><select class="select" id="del-target">${others.map((x) => `<option value="${x.id}">${esc(pipelineLabel(x))}</option>`).join('')}</select></label></div>
          <div class="modal-f"><button class="btn" data-close>Cancel</button><button class="btn primary" id="del-ok">${icon('trash')} Move leads and delete</button></div>`);
        m._onClose = () => resolve(false);
        $('#del-ok').onclick = () => { const v = $('#del-target').value; m._onClose = null; closeModal(); resolve(v); };
      });
      if (!moveTo) return;
    } else if (!(await confirmDialog(`Delete ${p.name}?`, 'This pipeline has no leads. Its stages will be removed.', 'Delete pipeline'))) return;
    try {
      state.pipelines = await api(`/api/pipelines/${p.id}${moveTo ? `?move_to=${moveTo}` : ''}`, { method: 'DELETE' });
      delete pipeDrafts[p.id];
      await loadPipelines();
      await loadLeads();
      toast(`${p.name} deleted`);
      renderPipelineEditors(users);
    } catch (err) { fail(err); }
  }

  /* ================================================================ boot */

  async function boot() {
    const me = await api('/api/me');
    if (!me.user) { renderAuth(me.needsSetup); return; }
    state.user = me.user;
    await loadPipelines();
    state.talkTrack = await api('/api/talk-track').then((r) => r.text).catch(() => '');
    await loadOutlook();
    const oq = new URLSearchParams((location.hash.split('?')[1] || ''));
    const notice = {
      connected: [`Outlook connected${state.outlook.email ? ` · ${state.outlook.email}` : ''}`],
      denied: ['Outlook connection was canceled', true],
      error: [`Couldn't connect Outlook${oq.get('msg') ? `: ${oq.get('msg')}` : ''}`, true],
      not_configured: ['Outlook isn\'t set up for this CRM yet', true],
    }[oq.get('outlook')];
    if (notice) {
      setTimeout(() => toast(notice[0], { error: !!notice[1], duration: 6000 }), 300);
      history.replaceState(null, '', location.hash.split('?')[0]);
    }
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
