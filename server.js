'use strict';

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const ExcelJS = require('exceljs');
const db = require('./db');

const PORT = process.env.PORT || 3000;
const SESSION_DAYS = 30;
const COOKIE = 'm2_session';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

/* ---------------------------------------------------------------- helpers */

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const known = Buffer.from(hash, 'hex');
  return known.length === test.length && crypto.timingSafeEqual(known, test);
}

function parseCookies(header) {
  const out = {};
  String(header || '').split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function setSessionCookie(req, res, token, maxAgeSec) {
  const secure = req.secure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`);
}

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function bad(res, msg, code = 400) {
  return res.status(code).json({ error: msg });
}

const LEAD_FIELDS = [
  'first_name', 'last_name', 'company', 'title', 'phone', 'phone_alt', 'email', 'website',
  'address', 'city', 'state', 'zip', 'source', 'value', 'next_follow_up', 'notes',
];

function cleanText(v, max = 500) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

function cleanLeadInput(body) {
  const out = {};
  for (const f of LEAD_FIELDS) {
    if (!(f in body)) continue;
    if (f === 'value') {
      const n = body.value === '' || body.value === null ? null : Number(String(body.value).replace(/[^0-9.-]/g, ''));
      out.value = Number.isFinite(n) && Math.abs(n) < 1e11 ? n : null;
    } else if (f === 'next_follow_up') {
      const d = cleanText(body.next_follow_up, 20);
      out.next_follow_up = d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
    } else if (f === 'notes') {
      out.notes = cleanText(body.notes, 20000);
    } else {
      out[f] = cleanText(body[f]);
    }
  }
  if (body.extra && typeof body.extra === 'object' && !Array.isArray(body.extra)) {
    const extra = {};
    for (const [k, v] of Object.entries(body.extra).slice(0, 100)) {
      const key = cleanText(k, 100);
      const val = cleanText(v, 2000);
      if (key && val) extra[key] = val;
    }
    out.extra = extra;
  }
  return out;
}

function phoneDigits(p) {
  const m = String(p || '').match(/\+?\d[\d\s().-]{5,}\d/);
  const d = (m ? m[0] : '').replace(/\D/g, '');
  return d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
}

async function logActivity(client, leadId, userId, type, body = null, meta = {}, outcome = null) {
  const { rows } = await client.query(
    `INSERT INTO activities (lead_id, user_id, type, outcome, body, meta)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [leadId, userId, type, outcome, body, meta],
  );
  return rows[0];
}

/* ---------------------------------------------------------------- middleware */

app.use(express.json({ limit: '25mb' }));

app.use(wrap(async (req, _res, next) => {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (token) {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.expires_at > now()`,
      [crypto.createHash('sha256').update(token).digest('hex')],
    );
    req.user = rows[0] || null;
  }
  next();
}));

app.param('id', (req, res, next, id) => {
  if (!/^\d{1,9}$/.test(id)) return bad(res, 'Not found', 404);
  next();
});

function requireAuth(req, res, next) {
  if (!req.user) return bad(res, 'Not signed in', 401);
  next();
}

/* ---------------------------------------------------------------- auth */

const loginAttempts = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const rec = loginAttempts.get(ip) || { count: 0, reset: now + 15 * 60 * 1000 };
  if (now > rec.reset) { rec.count = 0; rec.reset = now + 15 * 60 * 1000; }
  rec.count += 1;
  loginAttempts.set(ip, rec);
  return rec.count > 20;
}

async function startSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await db.query(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES ($1,$2, now() + interval '${SESSION_DAYS} days')`,
    [crypto.createHash('sha256').update(token).digest('hex'), userId],
  );
  setSessionCookie(req, res, token, SESSION_DAYS * 86400);
}

app.get('/api/me', wrap(async (req, res) => {
  const { rows } = await db.query('SELECT count(*)::int AS n FROM users');
  res.json({ user: req.user || null, needsSetup: rows[0].n === 0 });
}));

app.post('/api/setup', wrap(async (req, res) => {
  const name = cleanText(req.body.name, 100);
  const email = cleanText(req.body.email, 200);
  const password = String(req.body.password || '');
  if (!name || !email) return bad(res, 'Name and email are required');
  if (password.length < 8) return bad(res, 'Password must be at least 8 characters');
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE users IN EXCLUSIVE MODE');
    const { rows: existing } = await client.query('SELECT 1 FROM users LIMIT 1');
    if (existing.length) { await client.query('ROLLBACK'); return bad(res, 'Setup is already complete', 403); }
    const { rows } = await client.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, lower($2), $3) RETURNING id, name, email',
      [name, email, hashPassword(password)],
    );
    await client.query('COMMIT');
    await startSession(req, res, rows[0].id);
    res.json({ user: rows[0] });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}));

app.post('/api/login', wrap(async (req, res) => {
  if (rateLimited(req.ip)) return bad(res, 'Too many attempts. Try again in a few minutes.', 429);
  const email = String(req.body.email || '').trim().toLowerCase();
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user || !verifyPassword(String(req.body.password || ''), user.password_hash)) {
    return bad(res, 'Incorrect email or password', 401);
  }
  await startSession(req, res, user.id);
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
}));

app.post('/api/logout', wrap(async (req, res) => {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (token) await db.query('DELETE FROM sessions WHERE token = $1', [crypto.createHash('sha256').update(token).digest('hex')]);
  setSessionCookie(req, res, '', 0);
  res.json({ ok: true });
}));

app.use('/api', requireAuth);

/* ---------------------------------------------------------------- users */

app.get('/api/users', wrap(async (_req, res) => {
  const { rows } = await db.query('SELECT id, name, email, created_at FROM users ORDER BY id');
  res.json(rows);
}));

app.post('/api/users', wrap(async (req, res) => {
  const name = cleanText(req.body.name, 100);
  const email = cleanText(req.body.email, 200);
  const password = String(req.body.password || '');
  if (!name || !email) return bad(res, 'Name and email are required');
  if (password.length < 8) return bad(res, 'Password must be at least 8 characters');
  try {
    const { rows } = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, lower($2), $3) RETURNING id, name, email, created_at',
      [name, email, hashPassword(password)],
    );
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return bad(res, 'A user with that email already exists');
    throw e;
  }
}));

app.delete('/api/users/:id', wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return bad(res, 'You cannot remove yourself');
  await db.query('DELETE FROM users WHERE id = $1', [id]);
  res.json({ ok: true });
}));

app.post('/api/password', wrap(async (req, res) => {
  const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  if (!verifyPassword(String(req.body.current || ''), rows[0].password_hash)) return bad(res, 'Current password is incorrect');
  const next = String(req.body.next || '');
  if (next.length < 8) return bad(res, 'New password must be at least 8 characters');
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashPassword(next), req.user.id]);
  res.json({ ok: true });
}));

/* ---------------------------------------------------------------- stages */

app.get('/api/stages', wrap(async (_req, res) => {
  res.json(await db.getStages());
}));

app.put('/api/stages', wrap(async (req, res) => {
  const stages = Array.isArray(req.body.stages) ? req.body.stages.map((s) => cleanText(s, 40)) : [];
  if (stages.length !== 5 || stages.some((s) => !s)) return bad(res, 'Provide five stage names');
  await db.query(
    `INSERT INTO settings (key, value) VALUES ('stages', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [JSON.stringify(stages)],
  );
  res.json(stages);
}));

/* ---------------------------------------------------------------- leads */

const LIST_COLUMNS = `id, first_name, last_name, company, title, phone, email, city, state, source, value,
  stage, position, status, dq_reason, call_count, last_contacted_at, next_follow_up, created_at, updated_at`;

app.get('/api/leads', wrap(async (req, res) => {
  const status = ['active', 'disqualified', 'all'].includes(req.query.status) ? req.query.status : 'active';
  const where = [];
  const params = [];
  if (status !== 'all') { params.push(status); where.push(`status = $${params.length}`); }
  const { rows } = await db.query(
    `SELECT ${LIST_COLUMNS} FROM leads ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY stage, position, id`,
    params,
  );
  res.json(rows);
}));

app.get('/api/leads/:id', wrap(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
  if (!rows[0]) return bad(res, 'Lead not found', 404);
  const { rows: activities } = await db.query(
    `SELECT a.*, u.name AS user_name FROM activities a LEFT JOIN users u ON u.id = a.user_id
     WHERE a.lead_id = $1 ORDER BY a.created_at DESC, a.id DESC LIMIT 300`,
    [req.params.id],
  );
  res.json({ lead: rows[0], activities });
}));

async function nextPosition(client, stage) {
  const { rows } = await client.query('SELECT COALESCE(MAX(position), 0) + 1 AS p FROM leads WHERE stage = $1', [stage]);
  return Number(rows[0].p);
}

app.post('/api/leads', wrap(async (req, res) => {
  const data = cleanLeadInput(req.body);
  if (!data.first_name && !data.last_name && !data.company && !data.phone) {
    return bad(res, 'Add at least a name, company or phone number');
  }
  const stage = Math.min(5, Math.max(1, Number(req.body.stage) || 1));
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const cols = Object.keys(data);
    const vals = Object.values(data);
    cols.push('stage', 'position', 'phone_digits');
    vals.push(stage, await nextPosition(client, stage), phoneDigits(data.phone));
    const { rows } = await client.query(
      `INSERT INTO leads (${cols.join(',')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`,
      vals,
    );
    await logActivity(client, rows[0].id, req.user.id, 'created', 'Lead created manually');
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}));

app.patch('/api/leads/:id', wrap(async (req, res) => {
  const data = cleanLeadInput(req.body);
  const cols = Object.keys(data);
  if (!cols.length) return bad(res, 'Nothing to update');
  if ('phone' in data) { cols.push('phone_digits'); data.phone_digits = phoneDigits(data.phone); }
  const sets = cols.map((c, i) => `${c} = $${i + 2}`);
  const { rows } = await db.query(
    `UPDATE leads SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING *`,
    [req.params.id, ...cols.map((c) => data[c])],
  );
  if (!rows[0]) return bad(res, 'Lead not found', 404);
  res.json(rows[0]);
}));

app.delete('/api/leads/:id', wrap(async (req, res) => {
  await db.query('DELETE FROM leads WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

app.post('/api/leads/:id/move', wrap(async (req, res) => {
  const stage = Number(req.body.stage);
  if (!(stage >= 1 && stage <= 5)) return bad(res, 'Invalid stage');
  const beforeId = req.body.beforeId ? Number(req.body.beforeId) : null;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: cur } = await client.query('SELECT * FROM leads WHERE id = $1 FOR UPDATE', [req.params.id]);
    const lead = cur[0];
    if (!lead) { await client.query('ROLLBACK'); return bad(res, 'Lead not found', 404); }

    let position;
    if (beforeId) {
      const { rows: b } = await client.query('SELECT position FROM leads WHERE id = $1 AND stage = $2', [beforeId, stage]);
      if (b[0]) {
        const { rows: prev } = await client.query(
          `SELECT position FROM leads WHERE stage = $1 AND position < $2 AND id <> $3 AND status = 'active'
           ORDER BY position DESC LIMIT 1`,
          [stage, b[0].position, lead.id],
        );
        const lo = prev[0] ? Number(prev[0].position) : Number(b[0].position) - 1;
        position = (lo + Number(b[0].position)) / 2;
      }
    }
    if (position === undefined) position = await nextPosition(client, stage);

    const { rows } = await client.query(
      'UPDATE leads SET stage = $2, position = $3, updated_at = now() WHERE id = $1 RETURNING *',
      [lead.id, stage, position],
    );
    if (lead.stage !== stage) {
      const stages = await db.getStages();
      await logActivity(client, lead.id, req.user.id, 'stage',
        `Moved from ${stages[lead.stage - 1]} to ${stages[stage - 1]}`, { from: lead.stage, to: stage });
    }
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}));

app.post('/api/leads/:id/disqualify', wrap(async (req, res) => {
  const reason = cleanText(req.body.reason, 100) || 'Other';
  const note = cleanText(req.body.note, 2000);
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE leads SET status = 'disqualified', dq_reason = $2, dq_at = now(), updated_at = now()
       WHERE id = $1 RETURNING *`,
      [req.params.id, reason],
    );
    if (!rows[0]) { await client.query('ROLLBACK'); return bad(res, 'Lead not found', 404); }
    await logActivity(client, rows[0].id, req.user.id, 'disqualified', note, { reason });
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}));

app.post('/api/leads/:id/requalify', wrap(async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: cur } = await client.query('SELECT stage FROM leads WHERE id = $1', [req.params.id]);
    if (!cur[0]) { await client.query('ROLLBACK'); return bad(res, 'Lead not found', 404); }
    const { rows } = await client.query(
      `UPDATE leads SET status = 'active', dq_reason = NULL, dq_at = NULL, position = $2, updated_at = now()
       WHERE id = $1 RETURNING *`,
      [req.params.id, await nextPosition(client, cur[0].stage)],
    );
    await logActivity(client, rows[0].id, req.user.id, 'requalified', 'Lead restored to the pipeline');
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}));

/* ---------------------------------------------------------------- activities & calls */

const CALL_OUTCOMES = ['connected', 'no_answer', 'voicemail', 'busy', 'wrong_number', 'callback'];

app.post('/api/leads/:id/activities', wrap(async (req, res) => {
  const type = req.body.type === 'call' ? 'call' : 'note';
  const body = cleanText(req.body.body, 20000);
  const outcome = type === 'call' && CALL_OUTCOMES.includes(req.body.outcome) ? req.body.outcome : null;
  if (type === 'note' && !body) return bad(res, 'Note is empty');
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT id FROM leads WHERE id = $1', [req.params.id]);
    if (!rows[0]) { await client.query('ROLLBACK'); return bad(res, 'Lead not found', 404); }
    const act = await logActivity(client, rows[0].id, req.user.id, type, body, {}, outcome);
    if (type === 'call') {
      await client.query(
        'UPDATE leads SET call_count = call_count + 1, last_contacted_at = now(), updated_at = now() WHERE id = $1',
        [rows[0].id],
      );
    }
    await client.query('COMMIT');
    res.json(act);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}));

app.patch('/api/activities/:id', wrap(async (req, res) => {
  const outcome = CALL_OUTCOMES.includes(req.body.outcome) ? req.body.outcome : undefined;
  const body = req.body.body !== undefined ? cleanText(req.body.body, 20000) : undefined;
  const { rows } = await db.query(
    `UPDATE activities SET
       outcome = CASE WHEN type = 'call' AND $2::text IS NOT NULL THEN $2 ELSE outcome END,
       body = CASE WHEN $3::boolean THEN $4 ELSE body END
     WHERE id = $1 RETURNING *`,
    [req.params.id, outcome ?? null, body !== undefined, body ?? null],
  );
  if (!rows[0]) return bad(res, 'Activity not found', 404);
  res.json(rows[0]);
}));

app.delete('/api/activities/:id', wrap(async (req, res) => {
  const { rows } = await db.query(`DELETE FROM activities WHERE id = $1 AND type IN ('note','call') RETURNING *`, [req.params.id]);
  if (rows[0] && rows[0].type === 'call') {
    await db.query('UPDATE leads SET call_count = GREATEST(call_count - 1, 0) WHERE id = $1', [rows[0].lead_id]);
  }
  res.json({ ok: true });
}));

/* ---------------------------------------------------------------- import */

function cellToString(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    if (v.text !== undefined) return String(v.text);
    if (v.richText) return v.richText.map((r) => r.text).join('');
    if (v.result !== undefined) return cellToString(v.result);
    if (v.hyperlink) return String(v.hyperlink).replace(/^mailto:/, '');
    if (v.error) return '';
    return '';
  }
  return String(v);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const delim = (text.split('\n')[0].match(/\t/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? '\t' : ',';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function tableFromRows(rawRows) {
  const rows = rawRows.map((r) => r.map((c) => cellToString(c).trim()));
  const headerIdx = rows.findIndex((r) => r.filter(Boolean).length >= 1);
  if (headerIdx === -1) return { headers: [], rows: [] };
  const width = Math.max(...rows.map((r) => r.length));
  const seen = {};
  const headers = Array.from({ length: width }, (_, i) => {
    let h = rows[headerIdx][i] || `Column ${i + 1}`;
    if (seen[h]) h = `${h} (${++seen[h]})`; else seen[h] = 1;
    return h;
  });
  const body = rows.slice(headerIdx + 1)
    .filter((r) => r.some((c) => c))
    .map((r) => headers.map((_, i) => r[i] || ''));
  return { headers, rows: body };
}

app.post('/api/import/parse', express.raw({ type: '*/*', limit: '30mb' }), wrap(async (req, res) => {
  const name = String(req.query.filename || 'upload').toLowerCase();
  const buf = req.body;
  if (!buf || !buf.length) return bad(res, 'The file is empty');
  const sheets = [];
  if (name.endsWith('.csv') || name.endsWith('.tsv') || name.endsWith('.txt')) {
    sheets.push({ name: 'Sheet 1', ...tableFromRows(parseCsv(buf.toString('utf8').replace(/^﻿/, ''))) });
  } else if (name.endsWith('.xls')) {
    return bad(res, 'Old .xls files aren\'t supported. In Excel choose File → Save As → .xlsx (or .csv) and upload again.');
  } else {
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(buf);
    } catch {
      return bad(res, 'Could not read that file. Please upload an .xlsx or .csv file.');
    }
    wb.eachSheet((ws) => {
      const raw = [];
      ws.eachRow({ includeEmpty: true }, (row, n) => {
        const vals = row.values.slice(1);
        raw[n - 1] = vals;
      });
      for (let i = 0; i < raw.length; i++) if (!raw[i]) raw[i] = [];
      const t = tableFromRows(raw);
      if (t.headers.length) sheets.push({ name: ws.name, ...t });
    });
  }
  if (!sheets.length) return bad(res, 'No data found in that file');
  res.json({ sheets });
}));

app.post('/api/import', wrap(async (req, res) => {
  const leads = Array.isArray(req.body.leads) ? req.body.leads.slice(0, 20000) : [];
  if (!leads.length) return bad(res, 'No leads to import');
  const stage = Math.min(5, Math.max(1, Number(req.body.stage) || 1));
  const skipDuplicates = req.body.skipDuplicates !== false;
  const filename = cleanText(req.body.filename, 200) || 'Spreadsheet';

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const existing = new Set();
    if (skipDuplicates) {
      const { rows } = await client.query(`SELECT phone_digits, lower(email) AS email FROM leads`);
      rows.forEach((r) => {
        if (r.phone_digits) existing.add('p:' + r.phone_digits);
        if (r.email) existing.add('e:' + r.email);
      });
    }
    const { rows: imp } = await client.query(
      'INSERT INTO imports (filename, user_id) VALUES ($1,$2) RETURNING id', [filename, req.user.id],
    );
    let position = await nextPosition(client, stage);
    let inserted = 0;
    let skipped = 0;
    let empty = 0;
    const toInsert = [];
    for (const raw of leads) {
      const d = cleanLeadInput(raw || {});
      if (!d.first_name && !d.last_name && !d.company && !d.phone && !d.email) { empty++; continue; }
      const pd = phoneDigits(d.phone);
      const em = d.email ? d.email.toLowerCase() : null;
      if (skipDuplicates && ((pd && existing.has('p:' + pd)) || (em && existing.has('e:' + em)))) { skipped++; continue; }
      if (pd) existing.add('p:' + pd);
      if (em) existing.add('e:' + em);
      toInsert.push({ ...d, phone_digits: pd, stage, position: position++, import_id: imp[0].id, extra: d.extra || {} });
    }
    const cols = [...LEAD_FIELDS, 'extra', 'phone_digits', 'stage', 'position', 'import_id'];
    for (let i = 0; i < toInsert.length; i += 500) {
      const chunk = toInsert.slice(i, i + 500);
      const params = [];
      const tuples = chunk.map((l) => {
        const ph = cols.map((c) => { params.push(l[c] === undefined ? null : l[c]); return `$${params.length}`; });
        return `(${ph.join(',')})`;
      });
      const { rows } = await client.query(
        `INSERT INTO leads (${cols.join(',')}) VALUES ${tuples.join(',')} RETURNING id`, params,
      );
      const ids = rows.map((r) => r.id);
      await client.query(
        `INSERT INTO activities (lead_id, user_id, type, body)
         SELECT unnest($1::int[]), $2, 'created', $3`,
        [ids, req.user.id, `Imported from ${filename}`],
      );
      inserted += rows.length;
    }
    await client.query('UPDATE imports SET lead_count = $2 WHERE id = $1', [imp[0].id, inserted]);
    await client.query('COMMIT');
    res.json({ inserted, skipped, empty });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}));

app.get('/api/imports', wrap(async (_req, res) => {
  const { rows } = await db.query(
    `SELECT i.*, u.name AS user_name FROM imports i LEFT JOIN users u ON u.id = i.user_id
     ORDER BY i.created_at DESC LIMIT 20`,
  );
  res.json(rows);
}));

/* ---------------------------------------------------------------- export */

app.get('/api/export.csv', wrap(async (_req, res) => {
  const stages = await db.getStages();
  const { rows } = await db.query('SELECT * FROM leads ORDER BY stage, position, id');
  const head = ['First name', 'Last name', 'Company', 'Title', 'Phone', 'Alt phone', 'Email', 'Website', 'Address',
    'City', 'State', 'Zip', 'Source', 'Value', 'Stage', 'Status', 'Disqualify reason', 'Calls', 'Last contacted',
    'Next follow-up', 'Notes', 'Created'];
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : (v instanceof Date ? v.toISOString() : String(v));
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [head.map(esc).join(',')];
  for (const l of rows) {
    lines.push([l.first_name, l.last_name, l.company, l.title, l.phone, l.phone_alt, l.email, l.website, l.address,
      l.city, l.state, l.zip, l.source, l.value, stages[l.stage - 1], l.status, l.dq_reason, l.call_count,
      l.last_contacted_at, l.next_follow_up, l.notes, l.created_at].map(esc).join(','));
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="m2-leads-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send('﻿' + lines.join('\r\n'));
}));

/* ---------------------------------------------------------------- analytics */

app.get('/api/analytics', wrap(async (req, res) => {
  const tz = /^[A-Za-z_]+\/[A-Za-z_\/-]+$|^UTC$/.test(String(req.query.tz || '')) ? req.query.tz : 'UTC';
  const q = (sql, p = []) => db.query(sql, p).then((r) => r.rows);
  const [
    totals, byStage, calls, outcomes, callsDaily, leadsDaily, dqReasons, recent, followUps,
  ] = await Promise.all([
    q(`SELECT
         count(*) FILTER (WHERE status = 'active')::int AS active,
         count(*) FILTER (WHERE status = 'disqualified')::int AS disqualified,
         count(*)::int AS total,
         count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS new_7d,
         COALESCE(sum(value) FILTER (WHERE status = 'active' AND stage < 5), 0)::float AS open_value,
         COALESCE(sum(value) FILTER (WHERE status = 'active' AND stage = 5), 0)::float AS won_value,
         count(*) FILTER (WHERE status = 'active' AND call_count = 0)::int AS never_called
       FROM leads`),
    q(`SELECT stage, count(*)::int AS n, COALESCE(sum(value),0)::float AS value
       FROM leads WHERE status = 'active' GROUP BY stage ORDER BY stage`),
    q(`SELECT
         count(*) FILTER (WHERE (created_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date)::int AS today,
         count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS week,
         count(*) FILTER (WHERE created_at >= now() - interval '30 days')::int AS month,
         count(*) FILTER (WHERE created_at >= now() - interval '30 days' AND outcome = 'connected')::int AS connected_month,
         count(*) FILTER (WHERE created_at >= now() - interval '30 days' AND outcome IS NOT NULL)::int AS logged_month
       FROM activities WHERE type = 'call'`, [tz]),
    q(`SELECT COALESCE(outcome, 'not_logged') AS outcome, count(*)::int AS n FROM activities
       WHERE type = 'call' AND created_at >= now() - interval '30 days' GROUP BY 1 ORDER BY n DESC`),
    q(`SELECT d::date AS day, count(a.id)::int AS n
       FROM generate_series((now() AT TIME ZONE $1)::date - 13, (now() AT TIME ZONE $1)::date, interval '1 day') d
       LEFT JOIN activities a ON a.type = 'call' AND (a.created_at AT TIME ZONE $1)::date = d::date
       GROUP BY d ORDER BY d`, [tz]),
    q(`SELECT d::date AS day, count(l.id)::int AS n
       FROM generate_series((now() AT TIME ZONE $1)::date - 29, (now() AT TIME ZONE $1)::date, interval '1 day') d
       LEFT JOIN leads l ON (l.created_at AT TIME ZONE $1)::date = d::date
       GROUP BY d ORDER BY d`, [tz]),
    q(`SELECT COALESCE(dq_reason, 'Other') AS reason, count(*)::int AS n FROM leads
       WHERE status = 'disqualified' GROUP BY 1 ORDER BY n DESC`),
    q(`SELECT a.id, a.type, a.outcome, a.body, a.created_at, a.lead_id, u.name AS user_name,
         l.first_name, l.last_name, l.company
       FROM activities a JOIN leads l ON l.id = a.lead_id LEFT JOIN users u ON u.id = a.user_id
       WHERE a.type <> 'created'
       ORDER BY a.created_at DESC, a.id DESC LIMIT 12`),
    q(`SELECT id, first_name, last_name, company, phone, next_follow_up, stage FROM leads
       WHERE status = 'active' AND next_follow_up IS NOT NULL AND next_follow_up <= (now() AT TIME ZONE $1)::date + 7
       ORDER BY next_follow_up, id LIMIT 10`, [tz]),
  ]);
  res.json({
    stages: await db.getStages(),
    totals: totals[0], byStage, calls: calls[0], outcomes, callsDaily, leadsDaily, dqReasons, recent, followUps,
  });
}));

/* ---------------------------------------------------------------- static + errors */

app.use('/api', (_req, res) => bad(res, 'Not found', 404));

app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h', index: false }));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use((err, _req, res, _next) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

db.migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`M2 CRM listening on :${PORT}`));
    setInterval(() => db.query('DELETE FROM sessions WHERE expires_at < now()').catch(() => {}), 6 * 3600 * 1000).unref();
  })
  .catch((e) => {
    console.error('Failed to start:', e);
    process.exit(1);
  });
