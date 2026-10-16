'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const ExcelJS = require('exceljs');
const db = require('./db');
const DEFAULT_TALK_TRACK = require('./talktrack');
const outlook = require('./outlook');

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
  'address', 'city', 'state', 'zip', 'source', 'value', 'next_follow_up', 'notes', 'social_note',
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
app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });

app.use(wrap(async (req, _res, next) => {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (token) {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id
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

function requireOwner(req, res, next) {
  if (!req.user || req.user.role !== 'owner') return bad(res, 'Only the account owner can do that', 403);
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
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, lower($2), $3, 'owner') RETURNING id, name, email, role`,
      [name, email, hashPassword(password)],
    );
    // A fresh install starts with one unassigned pipeline; it becomes the owner's.
    await client.query(
      `UPDATE pipelines SET user_id = $1, name = $2 WHERE user_id IS NULL AND (SELECT count(*) FROM pipelines) = 1`,
      [rows[0].id, `${name.split(' ')[0]}'s pipeline`],
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
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
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
  const { rows } = await db.query(`SELECT id, name, email, role, created_at FROM users ORDER BY role = 'owner' DESC, id`);
  res.json(rows);
}));

app.post('/api/users', requireOwner, wrap(async (req, res) => {
  const name = cleanText(req.body.name, 100);
  const email = cleanText(req.body.email, 200);
  const password = String(req.body.password || '');
  if (!name || !email) return bad(res, 'Name and email are required');
  if (password.length < 8) return bad(res, 'Password must be at least 8 characters');
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, lower($2), $3) RETURNING id, name, email, role, created_at',
      [name, email, hashPassword(password)],
    );
    if (req.body.createPipeline !== false) {
      await db.createPipeline(client, `${name.split(' ')[0]}'s pipeline`, rows[0].id);
    }
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    if (e.code === '23505') return bad(res, 'A user with that email already exists');
    throw e;
  } finally {
    client.release();
  }
}));

app.delete('/api/users/:id', requireOwner, wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return bad(res, 'You cannot remove yourself');
  await db.query(`DELETE FROM users WHERE id = $1 AND role <> 'owner'`, [id]);
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

/* ---------------------------------------------------------------- pipelines */

const isOwner = (req) => req.user && req.user.role === 'owner';
const STAGE_KINDS = ['open', 'appointment', 'won'];

// Pipeline ids this user may see: the owner sees all, teammates see the ones assigned to them.
async function accessiblePipelineIds(req, client = db) {
  const { rows } = isOwner(req)
    ? await client.query('SELECT id FROM pipelines ORDER BY position, id')
    : await client.query('SELECT id FROM pipelines WHERE user_id = $1 ORDER BY position, id', [req.user.id]);
  return rows.map((r) => r.id);
}

// Returns the lead if this user may work it, else null.
async function leadForUser(req, id, client = db, forUpdate = false) {
  const { rows } = await client.query(
    `SELECT l.* FROM leads l JOIN pipelines p ON p.id = l.pipeline_id
     WHERE l.id = $1 AND ($2::boolean OR p.user_id = $3) ${forUpdate ? 'FOR UPDATE OF l' : ''}`,
    [id, isOwner(req), req.user.id],
  );
  return rows[0] || null;
}

// Works out which pipeline/stage a new or moved lead lands in, checking access. Throws {status, message}.
async function resolveStage(req, client, { pipeline_id: pipelineId, stage_id: stageId }) {
  const allowed = await accessiblePipelineIds(req, client);
  let row;
  if (stageId) {
    ({ rows: [row] } = await client.query(
      `SELECT s.id AS stage_id, s.name AS stage_name, s.kind, s.position, s.pipeline_id, p.name AS pipeline_name
       FROM pipeline_stages s JOIN pipelines p ON p.id = s.pipeline_id WHERE s.id = $1`, [Number(stageId)]));
  } else {
    const pid = pipelineId ? Number(pipelineId) : allowed[0];
    ({ rows: [row] } = await client.query(
      `SELECT s.id AS stage_id, s.name AS stage_name, s.kind, s.position, s.pipeline_id, p.name AS pipeline_name
       FROM pipeline_stages s JOIN pipelines p ON p.id = s.pipeline_id WHERE s.pipeline_id = $1
       ORDER BY s.position LIMIT 1`, [pid || 0]));
  }
  if (!row) throw { status: 400, message: allowed.length ? 'That pipeline or stage no longer exists' : 'You have no pipeline yet. Ask the owner to set one up for you.' };
  if (!allowed.includes(row.pipeline_id)) throw { status: 403, message: "You don't have access to that pipeline" };
  return row;
}

const PIPELINE_SELECT = `
  SELECT p.id, p.name, p.user_id, p.position, u.name AS user_name,
    (SELECT count(*)::int FROM leads l WHERE l.pipeline_id = p.id AND l.status = 'active') AS active_count,
    (SELECT count(*)::int FROM leads l WHERE l.pipeline_id = p.id) AS lead_count,
    COALESCE((SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'kind', s.kind, 'position', s.position,
        'lead_count', (SELECT count(*) FROM leads l WHERE l.stage_id = s.id)) ORDER BY s.position)
      FROM pipeline_stages s WHERE s.pipeline_id = p.id), '[]'::json) AS stages
  FROM pipelines p LEFT JOIN users u ON u.id = p.user_id`;

async function listPipelines(req) {
  const { rows } = await db.query(
    `${PIPELINE_SELECT} WHERE $1::boolean OR p.user_id = $2 ORDER BY p.position, p.id`, [isOwner(req), req.user.id],
  );
  return rows;
}

app.get('/api/pipelines', wrap(async (req, res) => {
  res.json(await listPipelines(req));
}));

app.post('/api/pipelines', requireOwner, wrap(async (req, res) => {
  const name = cleanText(req.body.name, 60);
  if (!name) return bad(res, 'Give the pipeline a name');
  const userId = req.body.user_id ? Number(req.body.user_id) : null;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    if (userId) {
      const { rows } = await client.query('SELECT 1 FROM users WHERE id = $1', [userId]);
      if (!rows[0]) { await client.query('ROLLBACK'); return bad(res, 'That teammate no longer exists'); }
    }
    const id = await db.createPipeline(client, name, userId);
    await client.query('COMMIT');
    res.json({ id, pipelines: await listPipelines(req) });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}));

app.patch('/api/pipelines/:id', requireOwner, wrap(async (req, res) => {
  const sets = [];
  const vals = [req.params.id];
  if ('name' in req.body) {
    const name = cleanText(req.body.name, 60);
    if (!name) return bad(res, 'Give the pipeline a name');
    vals.push(name); sets.push(`name = $${vals.length}`);
  }
  if ('user_id' in req.body) {
    vals.push(req.body.user_id ? Number(req.body.user_id) : null); sets.push(`user_id = $${vals.length}`);
  }
  if (!sets.length) return bad(res, 'Nothing to update');
  const { rowCount } = await db.query(`UPDATE pipelines SET ${sets.join(', ')} WHERE id = $1`, vals);
  if (!rowCount) return bad(res, 'Pipeline not found', 404);
  res.json(await listPipelines(req));
}));

// Replace a pipeline's stages in order. Stages left out are deleted; their leads move to the
// closest earlier stage that remains (or the first stage).
app.put('/api/pipelines/:id/stages', requireOwner, wrap(async (req, res) => {
  const input = Array.isArray(req.body.stages) ? req.body.stages : [];
  const stages = input.map((st) => ({
    id: st && st.id ? Number(st.id) : null,
    name: cleanText(st && st.name, 40),
    kind: STAGE_KINDS.includes(st && st.kind) ? st.kind : 'open',
  }));
  if (!stages.length) return bad(res, 'A pipeline needs at least one stage');
  if (stages.length > 15) return bad(res, 'A pipeline can have up to 15 stages');
  if (stages.some((st) => !st.name)) return bad(res, 'Every stage needs a name');
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: pipe } = await client.query('SELECT id FROM pipelines WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!pipe[0]) { await client.query('ROLLBACK'); return bad(res, 'Pipeline not found', 404); }
    const { rows: existing } = await client.query('SELECT id, position FROM pipeline_stages WHERE pipeline_id = $1', [req.params.id]);
    const existingIds = new Set(existing.map((r) => r.id));
    if (stages.some((st) => st.id && !existingIds.has(st.id))) { await client.query('ROLLBACK'); return bad(res, 'A stage in that list belongs to another pipeline'); }
    // Park current positions out of the way, then write the new order.
    await client.query('UPDATE pipeline_stages SET position = position + 1000 WHERE pipeline_id = $1', [req.params.id]);
    const kept = [];
    for (let i = 0; i < stages.length; i++) {
      const st = stages[i];
      if (st.id) {
        await client.query('UPDATE pipeline_stages SET name = $2, kind = $3, position = $4 WHERE id = $1', [st.id, st.name, st.kind, i + 1]);
        kept.push({ id: st.id, oldPos: existing.find((r) => r.id === st.id).position });
      } else {
        const { rows } = await client.query(
          'INSERT INTO pipeline_stages (pipeline_id, name, kind, position) VALUES ($1,$2,$3,$4) RETURNING id',
          [req.params.id, st.name, st.kind, i + 1],
        );
        st.id = rows[0].id;
      }
    }
    const firstId = stages[0].id;
    for (const old of existing.filter((r) => !stages.some((st) => st.id === r.id))) {
      const target = kept.filter((k) => k.oldPos < old.position).sort((a, b) => b.oldPos - a.oldPos)[0];
      await client.query('UPDATE leads SET stage_id = $2 WHERE stage_id = $1', [old.id, target ? target.id : firstId]);
      await client.query('DELETE FROM pipeline_stages WHERE id = $1', [old.id]);
    }
    await client.query('COMMIT');
    res.json(await listPipelines(req));
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}));

app.delete('/api/pipelines/:id', requireOwner, wrap(async (req, res) => {
  const moveTo = req.query.move_to ? Number(req.query.move_to) : null;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: all } = await client.query('SELECT id FROM pipelines FOR UPDATE');
    if (!all.some((r) => r.id === Number(req.params.id))) { await client.query('ROLLBACK'); return bad(res, 'Pipeline not found', 404); }
    if (all.length === 1) { await client.query('ROLLBACK'); return bad(res, "You can't delete the only pipeline"); }
    const { rows: [{ n }] } = await client.query('SELECT count(*)::int AS n FROM leads WHERE pipeline_id = $1', [req.params.id]);
    if (n) {
      if (!moveTo || moveTo === Number(req.params.id)) { await client.query('ROLLBACK'); return bad(res, `This pipeline has ${n} leads. Choose where to move them first.`); }
      const { rows: first } = await client.query('SELECT id FROM pipeline_stages WHERE pipeline_id = $1 ORDER BY position LIMIT 1', [moveTo]);
      if (!first[0]) { await client.query('ROLLBACK'); return bad(res, 'Choose a pipeline to move the leads to'); }
      await client.query('UPDATE leads SET pipeline_id = $2, stage_id = $3 WHERE pipeline_id = $1', [req.params.id, moveTo, first[0].id]);
    }
    await client.query('DELETE FROM pipelines WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');
    res.json(await listPipelines(req));
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}));

/* ---------------------------------------------------------------- talk track */

app.get('/api/talk-track', wrap(async (_req, res) => {
  const { rows } = await db.query(`SELECT value FROM settings WHERE key = 'talk_track'`);
  const custom = rows[0] && typeof rows[0].value === 'string' ? rows[0].value : null;
  res.json({ text: custom || DEFAULT_TALK_TRACK, isDefault: !custom, defaultText: DEFAULT_TALK_TRACK });
}));

app.put('/api/talk-track', requireOwner, wrap(async (req, res) => {
  const text = typeof req.body.text === 'string' ? req.body.text.slice(0, 50000) : '';
  if (!text.trim() || req.body.reset) {
    await db.query(`DELETE FROM settings WHERE key = 'talk_track'`);
    return res.json({ text: DEFAULT_TALK_TRACK, isDefault: true, defaultText: DEFAULT_TALK_TRACK });
  }
  await db.query(
    `INSERT INTO settings (key, value) VALUES ('talk_track', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [JSON.stringify(text)],
  );
  res.json({ text, isDefault: false, defaultText: DEFAULT_TALK_TRACK });
}));

/* ---------------------------------------------------------------- leads */

const LIST_COLUMNS = `id, first_name, last_name, company, title, phone, email, city, state, source, value,
  pipeline_id, stage_id, position, status, dq_reason, call_count, last_contacted_at, next_follow_up, created_at, updated_at`;

app.get('/api/leads', wrap(async (req, res) => {
  const status = ['active', 'disqualified', 'all'].includes(req.query.status) ? req.query.status : 'active';
  let ids = await accessiblePipelineIds(req);
  if (req.query.pipeline && req.query.pipeline !== 'all') ids = ids.filter((id) => id === Number(req.query.pipeline));
  const params = [ids];
  const where = ['pipeline_id = ANY($1)'];
  if (status !== 'all') { params.push(status); where.push(`status = $${params.length}`); }
  const { rows } = await db.query(
    `SELECT ${LIST_COLUMNS} FROM leads WHERE ${where.join(' AND ')} ORDER BY position, id`,
    params,
  );
  res.json(rows);
}));

app.get('/api/leads/:id', wrap(async (req, res) => {
  const lead = await leadForUser(req, req.params.id);
  if (!lead) return bad(res, 'Lead not found', 404);
  const rows = [lead];
  const { rows: activities } = await db.query(
    `SELECT a.*, u.name AS user_name FROM activities a LEFT JOIN users u ON u.id = a.user_id
     WHERE a.lead_id = $1 ORDER BY a.created_at DESC, a.id DESC LIMIT 300`,
    [req.params.id],
  );
  res.json({ lead: rows[0], activities });
}));

async function nextPosition(client, stageId) {
  const { rows } = await client.query('SELECT COALESCE(MAX(position), 0) + 1 AS p FROM leads WHERE stage_id = $1', [stageId]);
  return Number(rows[0].p);
}

// Sends a {status, message} thrown by resolveStage as an API error; rethrows anything else.
function sendResolveError(res, e) {
  if (e && e.status && e.message) return bad(res, e.message, e.status);
  throw e;
}

app.post('/api/leads', wrap(async (req, res) => {
  const data = cleanLeadInput(req.body);
  if (!data.first_name && !data.last_name && !data.company && !data.phone) {
    return bad(res, 'Add at least a name, company or phone number');
  }
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    let target;
    try { target = await resolveStage(req, client, req.body); } catch (e) { await client.query('ROLLBACK'); return sendResolveError(res, e); }
    const cols = Object.keys(data);
    const vals = Object.values(data);
    cols.push('pipeline_id', 'stage_id', 'position', 'phone_digits');
    vals.push(target.pipeline_id, target.stage_id, await nextPosition(client, target.stage_id), phoneDigits(data.phone));
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
  if (!(await leadForUser(req, req.params.id))) return bad(res, 'Lead not found', 404);
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
  if (!(await leadForUser(req, req.params.id))) return bad(res, 'Lead not found', 404);
  await db.query('DELETE FROM leads WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

app.post('/api/leads/:id/move', wrap(async (req, res) => {
  const beforeId = req.body.beforeId ? Number(req.body.beforeId) : null;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const lead = await leadForUser(req, req.params.id, client, true);
    if (!lead) { await client.query('ROLLBACK'); return bad(res, 'Lead not found', 404); }
    let target;
    try {
      target = await resolveStage(req, client, { stage_id: req.body.stage_id, pipeline_id: req.body.pipeline_id });
    } catch (e) { await client.query('ROLLBACK'); return sendResolveError(res, e); }

    let position;
    if (beforeId) {
      const { rows: b } = await client.query('SELECT position FROM leads WHERE id = $1 AND stage_id = $2', [beforeId, target.stage_id]);
      if (b[0]) {
        const { rows: prev } = await client.query(
          `SELECT position FROM leads WHERE stage_id = $1 AND position < $2 AND id <> $3 AND status = 'active'
           ORDER BY position DESC LIMIT 1`,
          [target.stage_id, b[0].position, lead.id],
        );
        const lo = prev[0] ? Number(prev[0].position) : Number(b[0].position) - 1;
        position = (lo + Number(b[0].position)) / 2;
      }
    }
    if (position === undefined) position = await nextPosition(client, target.stage_id);

    const { rows } = await client.query(
      'UPDATE leads SET pipeline_id = $2, stage_id = $3, position = $4, updated_at = now() WHERE id = $1 RETURNING *',
      [lead.id, target.pipeline_id, target.stage_id, position],
    );
    if (lead.stage_id !== target.stage_id) {
      const { rows: [from] } = await client.query('SELECT name, position FROM pipeline_stages WHERE id = $1', [lead.stage_id]);
      const samePipeline = lead.pipeline_id === target.pipeline_id;
      await logActivity(client, lead.id, req.user.id, 'stage',
        samePipeline
          ? `Moved from ${from ? from.name : 'a removed stage'} to ${target.stage_name}`
          : `Moved to ${target.pipeline_name} · ${target.stage_name}`,
        {
          from_stage: lead.stage_id, to_stage: target.stage_id, from_pipeline: lead.pipeline_id, to_pipeline: target.pipeline_id,
          from_pos: samePipeline && from ? from.position : null, to_pos: target.position, to_kind: target.kind,
        });
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

// Owner only: permanently delete many leads (their notes and call history go with them).
app.post('/api/leads/bulk-delete', requireOwner, wrap(async (req, res) => {
  const ids = Array.isArray(req.body.lead_ids)
    ? [...new Set(req.body.lead_ids.map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 20000)
    : [];
  if (!ids.length) return bad(res, 'Choose at least one lead to delete');
  const { rowCount } = await db.query('DELETE FROM leads WHERE id = ANY($1)', [ids]);
  res.json({ deleted: rowCount });
}));

// Owner only: move many leads into another pipeline at once (they land in the chosen or first stage).
app.post('/api/leads/bulk-move', requireOwner, wrap(async (req, res) => {
  const ids = Array.isArray(req.body.lead_ids)
    ? [...new Set(req.body.lead_ids.map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 10000)
    : [];
  if (!ids.length) return bad(res, 'Choose at least one lead to move');
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    let target;
    try {
      target = await resolveStage(req, client, { pipeline_id: req.body.pipeline_id, stage_id: req.body.stage_id });
    } catch (e) { await client.query('ROLLBACK'); return sendResolveError(res, e); }
    const { rows: from } = await client.query(
      `SELECT id, pipeline_id, stage_id FROM leads WHERE id = ANY($1) AND stage_id IS DISTINCT FROM $2
       ORDER BY position, id FOR UPDATE`,
      [ids, target.stage_id],
    );
    if (from.length) {
      const start = await nextPosition(client, target.stage_id);
      const movedIds = from.map((r) => r.id);
      await client.query(
        `UPDATE leads l SET pipeline_id = $2, stage_id = $3, position = $4 + x.ord, updated_at = now()
         FROM unnest($1::int[]) WITH ORDINALITY AS x(id, ord) WHERE l.id = x.id`,
        [movedIds, target.pipeline_id, target.stage_id, start],
      );
      await client.query(
        `INSERT INTO activities (lead_id, user_id, type, body, meta)
         SELECT x.id, $4, 'stage', $5,
           jsonb_build_object('from_stage', x.stage_id, 'from_pipeline', x.pipeline_id, 'to_stage', $6::int,
             'to_pipeline', $7::int, 'from_pos', NULL, 'to_pos', $8::int, 'to_kind', $9::text, 'bulk', true)
         FROM unnest($1::int[], $2::int[], $3::int[]) AS x(id, pipeline_id, stage_id)`,
        [movedIds, from.map((r) => r.pipeline_id), from.map((r) => r.stage_id), req.user.id,
          `Moved to ${target.pipeline_name} · ${target.stage_name}`, target.stage_id, target.pipeline_id, target.position, target.kind],
      );
    }
    await client.query('COMMIT');
    res.json({ moved: from.length, skipped: ids.length - from.length, pipeline_id: target.pipeline_id, stage_id: target.stage_id });
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
  if (!(await leadForUser(req, req.params.id))) return bad(res, 'Lead not found', 404);
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
    const cur = [await leadForUser(req, req.params.id, client, true)];
    if (!cur[0]) { await client.query('ROLLBACK'); return bad(res, 'Lead not found', 404); }
    const { rows } = await client.query(
      `UPDATE leads SET status = 'active', dq_reason = NULL, dq_at = NULL, position = $2, updated_at = now()
       WHERE id = $1 RETURNING *`,
      [req.params.id, await nextPosition(client, cur[0].stage_id)],
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
    const rows = [await leadForUser(req, req.params.id, client)];
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

// Activities are reachable only through a lead the user can work.
async function activityAccessible(req, id) {
  const { rows } = await db.query(
    `SELECT 1 FROM activities a JOIN leads l ON l.id = a.lead_id JOIN pipelines p ON p.id = l.pipeline_id
     WHERE a.id = $1 AND ($2::boolean OR p.user_id = $3)`, [id, isOwner(req), req.user.id],
  );
  return !!rows[0];
}

app.patch('/api/activities/:id', wrap(async (req, res) => {
  if (!(await activityAccessible(req, req.params.id))) return bad(res, 'Activity not found', 404);
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
  if (!(await activityAccessible(req, req.params.id))) return bad(res, 'Activity not found', 404);
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
  const skipDuplicates = req.body.skipDuplicates !== false;
  const filename = cleanText(req.body.filename, 200) || 'Spreadsheet';

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    let target;
    try { target = await resolveStage(req, client, req.body); } catch (e) { await client.query('ROLLBACK'); return sendResolveError(res, e); }
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
    let position = await nextPosition(client, target.stage_id);
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
      toInsert.push({
        ...d, phone_digits: pd, pipeline_id: target.pipeline_id, stage_id: target.stage_id,
        position: position++, import_id: imp[0].id, extra: d.extra || {},
      });
    }
    const cols = [...LEAD_FIELDS, 'extra', 'phone_digits', 'pipeline_id', 'stage_id', 'position', 'import_id'];
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
    res.json({ inserted, skipped, empty, pipeline_id: target.pipeline_id, stage_id: target.stage_id });
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

app.get('/api/export.csv', wrap(async (req, res) => {
  const { rows } = await db.query(
    `SELECT l.*, p.name AS pipeline_name, s.name AS stage_name FROM leads l
     JOIN pipelines p ON p.id = l.pipeline_id LEFT JOIN pipeline_stages s ON s.id = l.stage_id
     WHERE l.pipeline_id = ANY($1) ORDER BY p.position, p.id, s.position, l.position, l.id`,
    [await accessiblePipelineIds(req)],
  );
  const head = ['First name', 'Last name', 'Company', 'Title', 'Phone', 'Alt phone', 'Email', 'Website', 'Address',
    'City', 'State', 'Zip', 'Source', 'Value', 'Pipeline', 'Stage', 'Status', 'Disqualify reason', 'Calls', 'Last contacted',
    'Next follow-up', 'Notes', 'Created'];
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : (v instanceof Date ? v.toISOString() : String(v));
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [head.map(esc).join(',')];
  for (const l of rows) {
    lines.push([l.first_name, l.last_name, l.company, l.title, l.phone, l.phone_alt, l.email, l.website, l.address,
      l.city, l.state, l.zip, l.source, l.value, l.pipeline_name, l.stage_name, l.status, l.dq_reason, l.call_count,
      l.last_contacted_at, l.next_follow_up, l.notes, l.created_at].map(esc).join(','));
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="m2-leads-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send('﻿' + lines.join('\r\n'));
}));

/* ---------------------------------------------------------------- outlook */

function appBase(req) {
  return (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}
const outlookRedirect = (req) => `${appBase(req)}/api/outlook/callback`;

// Turns an Outlook/Graph failure into a readable API error.
function sendOutlookError(res, e) {
  if (e && e.status) return bad(res, e.message, e.status === 401 ? 502 : e.status);
  throw e;
}

function htmlEscape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const textToHtml = (text) => `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.5">${htmlEscape(text).replace(/\r?\n/g, '<br>')}</div>`;
const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
const splitEmails = (v) => String(v || '').split(/[;,\s]+/).map((x) => x.trim()).filter(Boolean);

app.get('/api/outlook/status', wrap(async (req, res) => {
  res.json(await outlook.status(req.user.id));
}));

app.get('/api/outlook/connect', (req, res) => {
  if (!outlook.configured()) return res.redirect('/#/settings?outlook=not_configured');
  res.redirect(outlook.authorizeUrl(outlookRedirect(req), req.user.id));
});

app.get('/api/outlook/callback', wrap(async (req, res) => {
  if (req.query.error) return res.redirect(`/#/settings?outlook=denied`);
  if (!outlook.verifyState(req.query.state, req.user.id)) return res.redirect('/#/settings?outlook=error');
  try {
    await outlook.completeSignIn(req.user.id, String(req.query.code || ''), outlookRedirect(req));
  } catch (e) {
    console.error('Outlook sign-in failed:', e.message);
    return res.redirect(`/#/settings?outlook=error&msg=${encodeURIComponent(e.message)}`);
  }
  res.redirect('/#/calendar?outlook=connected');
}));

app.post('/api/outlook/disconnect', wrap(async (req, res) => {
  await outlook.disconnect(req.user.id);
  res.json(await outlook.status(req.user.id));
}));

app.post('/api/leads/:id/email', wrap(async (req, res) => {
  const lead = await leadForUser(req, req.params.id);
  if (!lead) return bad(res, 'Lead not found', 404);
  const to = splitEmails(req.body.to || lead.email);
  const cc = splitEmails(req.body.cc);
  const subject = cleanText(req.body.subject, 300);
  const body = cleanText(req.body.body, 50000);
  if (!to.length) return bad(res, 'Add an email address to send to');
  if ([...to, ...cc].some((e) => !EMAIL_RE.test(e))) return bad(res, 'One of the email addresses looks wrong');
  if (!subject) return bad(res, 'Add a subject');
  if (!body) return bad(res, 'Write a message');
  try {
    await outlook.graph(req.user.id, 'POST', '/me/sendMail', {
      message: {
        subject,
        body: { contentType: 'HTML', content: textToHtml(body) },
        toRecipients: to.map((address) => ({ emailAddress: { address } })),
        ccRecipients: cc.map((address) => ({ emailAddress: { address } })),
      },
      saveToSentItems: true,
    });
  } catch (e) { return sendOutlookError(res, e); }
  const act = await logActivity(db, lead.id, req.user.id, 'email', `${subject}\n\n${body}`, { to, cc, subject });
  await db.query('UPDATE leads SET last_contacted_at = now(), updated_at = now() WHERE id = $1', [lead.id]);
  res.json(act);
}));

/* ---------------------------------------------------------------- appointments */

const APPT_STATUSES = ['scheduled', 'completed', 'no_show', 'canceled'];
const APPT_SELECT = `
  SELECT a.*, u.name AS user_name, l.first_name, l.last_name, l.company, l.email AS lead_email, l.phone AS lead_phone,
    l.pipeline_id, l.stage_id
  FROM appointments a LEFT JOIN users u ON u.id = a.user_id LEFT JOIN leads l ON l.id = a.lead_id
  LEFT JOIN pipelines p ON p.id = l.pipeline_id`;
// Owner sees everything; a teammate sees their own appointments and ones on leads in their pipelines.
const APPT_ACCESS = '($1::boolean OR a.user_id = $2 OR p.user_id = $2)';

async function appointmentForUser(req, id) {
  const { rows } = await db.query(`${APPT_SELECT} WHERE a.id = $3 AND ${APPT_ACCESS}`, [isOwner(req), req.user.id, id]);
  return rows[0] || null;
}

function parseTime(v) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

const graphTime = (d) => ({ dateTime: d.toISOString().replace('Z', ''), timeZone: 'UTC' });

function eventBody(notes, lead) {
  const lines = [];
  if (notes) lines.push(notes);
  if (lead) lines.push(`${[lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.company || 'Lead'}${lead.company && (lead.first_name || lead.last_name) ? ` · ${lead.company}` : ''}${lead.phone ? ` · ${lead.phone}` : ''}`);
  return { contentType: 'HTML', content: textToHtml(lines.join('\n\n')) };
}

app.get('/api/appointments', wrap(async (req, res) => {
  const params = [isOwner(req), req.user.id];
  const where = [APPT_ACCESS];
  const from = parseTime(req.query.from);
  const to = parseTime(req.query.to);
  if (from) { params.push(from); where.push(`a.ends_at > $${params.length}`); }
  if (to) { params.push(to); where.push(`a.starts_at < $${params.length}`); }
  if (req.query.lead_id) { params.push(Number(req.query.lead_id)); where.push(`a.lead_id = $${params.length}`); }
  if (req.query.user && req.query.user !== 'all') {
    params.push(req.query.user === 'me' ? req.user.id : Number(req.query.user)); where.push(`a.user_id = $${params.length}`);
  }
  if (req.query.upcoming) where.push(`a.ends_at > now() AND a.status = 'scheduled'`);
  const { rows } = await db.query(`${APPT_SELECT} WHERE ${where.join(' AND ')} ORDER BY a.starts_at LIMIT 1000`, params);

  let outlookEvents = [];
  let outlookError = null;
  if (req.query.outlook === '1' && from && to) {
    const st = await outlook.status(req.user.id);
    if (st.connected) {
      try {
        const q = new URLSearchParams({
          startDateTime: from.toISOString(), endDateTime: to.toISOString(), $top: '250',
          $select: 'subject,start,end,location,webLink,isAllDay,showAs,isCancelled', $orderby: 'start/dateTime',
        });
        const data = await outlook.graph(req.user.id, 'GET', `/me/calendarView?${q}`, null, { Prefer: 'outlook.timezone="UTC"' });
        const linked = new Set(rows.map((r) => r.outlook_event_id).filter(Boolean));
        outlookEvents = (data.value || [])
          .filter((e) => !e.isCancelled && !linked.has(e.id))
          .map((e) => ({
            id: e.id, title: e.subject || '(No title)', all_day: !!e.isAllDay, link: e.webLink,
            location: e.location && e.location.displayName, show_as: e.showAs,
            starts_at: `${String(e.start.dateTime).replace(/\.\d+$/, '')}Z`, ends_at: `${String(e.end.dateTime).replace(/\.\d+$/, '')}Z`,
          }));
      } catch (e) { outlookError = e.message; }
    }
  }
  res.json({ appointments: rows, outlookEvents, outlookError });
}));

app.post('/api/appointments', wrap(async (req, res) => {
  const title = cleanText(req.body.title, 200);
  const start = parseTime(req.body.starts_at);
  const end = parseTime(req.body.ends_at);
  const location = cleanText(req.body.location, 300);
  const notes = cleanText(req.body.notes, 5000);
  if (!title) return bad(res, 'Give the appointment a title');
  if (!start || !end || end <= start) return bad(res, 'Pick a start and end time');
  let lead = null;
  if (req.body.lead_id) {
    lead = await leadForUser(req, req.body.lead_id);
    if (!lead) return bad(res, 'Lead not found', 404);
  }

  // Outlook first: if it fails, nothing is saved and the user can retry or untick it.
  let eventId = null;
  let eventLink = null;
  let invited = false;
  if (req.body.add_to_outlook) {
    const attendees = [];
    if (req.body.invite_lead && lead) {
      const email = splitEmails(lead.email).find((e) => EMAIL_RE.test(e));
      if (!email) return bad(res, "This lead has no email address to send the invite to");
      attendees.push({ emailAddress: { address: email, name: [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.company || email }, type: 'required' });
    }
    try {
      const ev = await outlook.graph(req.user.id, 'POST', '/me/events', {
        subject: title, body: eventBody(notes, lead), start: graphTime(start), end: graphTime(end),
        location: location ? { displayName: location } : undefined, attendees,
      });
      eventId = ev.id || null;
      eventLink = ev.webLink || null;
      invited = attendees.length > 0;
    } catch (e) { return sendOutlookError(res, e); }
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO appointments (lead_id, user_id, title, starts_at, ends_at, location, notes, outlook_event_id, outlook_link, invite_sent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [lead ? lead.id : null, req.user.id, title, start, end, location, notes, eventId, eventLink, invited],
    );
    let movedTo = null;
    if (lead) {
      await logActivity(client, lead.id, req.user.id, 'appointment', title,
        { appointment_id: rows[0].id, starts_at: start.toISOString(), event: 'booked', invited });
      if (req.body.move_stage) {
        const { rows: target } = await client.query(
          `SELECT s.id, s.name, s.position, s.kind FROM pipeline_stages s WHERE s.pipeline_id = $1 AND s.kind = 'appointment'
           ORDER BY s.position LIMIT 1`, [lead.pipeline_id],
        );
        const { rows: cur } = await client.query('SELECT name, position, kind FROM pipeline_stages WHERE id = $1', [lead.stage_id]);
        if (target[0] && target[0].id !== lead.stage_id && (!cur[0] || (cur[0].kind !== 'won' && cur[0].position < target[0].position))) {
          await client.query('UPDATE leads SET stage_id = $2, position = $3, updated_at = now() WHERE id = $1',
            [lead.id, target[0].id, await nextPosition(client, target[0].id)]);
          await logActivity(client, lead.id, req.user.id, 'stage', `Moved from ${cur[0] ? cur[0].name : 'a removed stage'} to ${target[0].name}`, {
            from_stage: lead.stage_id, to_stage: target[0].id, from_pipeline: lead.pipeline_id, to_pipeline: lead.pipeline_id,
            from_pos: cur[0] ? cur[0].position : null, to_pos: target[0].position, to_kind: target[0].kind,
          });
          movedTo = target[0].name;
        }
      }
    }
    await client.query('COMMIT');
    res.json({ appointment: await appointmentForUser(req, rows[0].id), movedTo });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}));

app.patch('/api/appointments/:id', wrap(async (req, res) => {
  const appt = await appointmentForUser(req, req.params.id);
  if (!appt) return bad(res, 'Appointment not found', 404);
  const next = {
    title: 'title' in req.body ? cleanText(req.body.title, 200) : appt.title,
    starts_at: 'starts_at' in req.body ? parseTime(req.body.starts_at) : new Date(appt.starts_at),
    ends_at: 'ends_at' in req.body ? parseTime(req.body.ends_at) : new Date(appt.ends_at),
    location: 'location' in req.body ? cleanText(req.body.location, 300) : appt.location,
    notes: 'notes' in req.body ? cleanText(req.body.notes, 5000) : appt.notes,
    status: APPT_STATUSES.includes(req.body.status) ? req.body.status : appt.status,
  };
  if (!next.title) return bad(res, 'Give the appointment a title');
  if (!next.starts_at || !next.ends_at || next.ends_at <= next.starts_at) return bad(res, 'Pick a start and end time');

  // Keep the Outlook event in step when the person who booked it makes the change.
  let warning = null;
  if (appt.outlook_event_id) {
    if (appt.user_id !== req.user.id) {
      warning = `Only ${appt.user_name || 'the person who booked it'} can update the Outlook event.`;
    } else {
      try {
        if (next.status === 'canceled' && appt.status !== 'canceled') {
          await outlook.graph(req.user.id, 'POST', `/me/events/${encodeURIComponent(appt.outlook_event_id)}/cancel`, { comment: 'This meeting has been canceled.' })
            .catch(() => outlook.graph(req.user.id, 'DELETE', `/me/events/${encodeURIComponent(appt.outlook_event_id)}`));
        } else if (next.status !== 'canceled') {
          await outlook.graph(req.user.id, 'PATCH', `/me/events/${encodeURIComponent(appt.outlook_event_id)}`, {
            subject: next.title, start: graphTime(next.starts_at), end: graphTime(next.ends_at),
            location: { displayName: next.location || '' }, body: eventBody(next.notes, appt.lead_id ? { ...appt, phone: appt.lead_phone } : null),
          });
        }
      } catch (e) {
        if (e.graphStatus !== 404) return sendOutlookError(res, e);
        warning = 'The Outlook event no longer exists, so only the CRM was updated.';
      }
    }
  }
  await db.query(
    `UPDATE appointments SET title = $2, starts_at = $3, ends_at = $4, location = $5, notes = $6, status = $7 WHERE id = $1`,
    [appt.id, next.title, next.starts_at, next.ends_at, next.location, next.notes, next.status],
  );
  if (appt.lead_id && next.status !== appt.status) {
    const label = { completed: 'Appointment completed', no_show: 'No-show', canceled: 'Appointment canceled', scheduled: 'Appointment rescheduled' }[next.status];
    await logActivity(db, appt.lead_id, req.user.id, 'appointment', `${label} · ${next.title}`, { appointment_id: appt.id, event: next.status });
  } else if (appt.lead_id && next.starts_at.getTime() !== new Date(appt.starts_at).getTime()) {
    await logActivity(db, appt.lead_id, req.user.id, 'appointment', `Rescheduled · ${next.title}`,
      { appointment_id: appt.id, event: 'rescheduled', starts_at: next.starts_at.toISOString() });
  }
  res.json({ appointment: await appointmentForUser(req, appt.id), warning });
}));

app.delete('/api/appointments/:id', wrap(async (req, res) => {
  const appt = await appointmentForUser(req, req.params.id);
  if (!appt) return bad(res, 'Appointment not found', 404);
  if (appt.outlook_event_id && appt.user_id === req.user.id) {
    try {
      await outlook.graph(req.user.id, 'DELETE', `/me/events/${encodeURIComponent(appt.outlook_event_id)}`);
    } catch (e) {
      if (e.graphStatus !== 404) return sendOutlookError(res, e);
    }
  }
  await db.query('DELETE FROM appointments WHERE id = $1', [appt.id]);
  res.json({ ok: true });
}));

/* ---------------------------------------------------------------- analytics */

app.get('/api/analytics', wrap(async (req, res) => {
  const tz = /^[A-Za-z_]+\/[A-Za-z_\/-]+$|^UTC$/.test(String(req.query.tz || '')) ? req.query.tz : 'UTC';
  let ids = await accessiblePipelineIds(req);
  if (req.query.pipeline && req.query.pipeline !== 'all') ids = ids.filter((id) => id === Number(req.query.pipeline));
  const q = (sql, p = []) => db.query(sql, p).then((r) => r.rows);
  // $1 is always the pipeline id list; activities are scoped through their lead's pipeline.
  const LEADS = 'leads l WHERE l.pipeline_id = ANY($1)';
  const ACTS = 'activities a JOIN leads l ON l.id = a.lead_id WHERE l.pipeline_id = ANY($1)';
  const [
    totals, byStage, byPipeline, calls, outcomes, callsDaily, leadsDaily, dqReasons, recent, followUps,
  ] = await Promise.all([
    q(`SELECT
         count(*) FILTER (WHERE l.status = 'active')::int AS active,
         count(*) FILTER (WHERE l.status = 'disqualified')::int AS disqualified,
         count(*)::int AS total,
         count(*) FILTER (WHERE l.created_at >= now() - interval '7 days')::int AS new_7d,
         count(*) FILTER (WHERE l.status = 'active' AND s.kind = 'appointment')::int AS appointments,
         count(*) FILTER (WHERE l.status = 'active' AND s.kind = 'won')::int AS won,
         COALESCE(sum(l.value) FILTER (WHERE l.status = 'active' AND s.kind <> 'won'), 0)::float AS open_value,
         COALESCE(sum(l.value) FILTER (WHERE l.status = 'active' AND s.kind = 'won'), 0)::float AS won_value,
         count(*) FILTER (WHERE l.status = 'active' AND l.call_count = 0)::int AS never_called,
         count(*) FILTER (WHERE l.status = 'active' AND l.value > 0)::int AS valued,
         count(*) FILTER (WHERE l.status = 'active' AND l.value > 0 AND s.kind <> 'won')::int AS open_valued
       FROM leads l LEFT JOIN pipeline_stages s ON s.id = l.stage_id WHERE l.pipeline_id = ANY($1)`, [ids]),
    q(`SELECT l.stage_id, count(*)::int AS n, COALESCE(sum(l.value),0)::float AS value
       FROM ${LEADS} AND l.status = 'active' GROUP BY l.stage_id`, [ids]),
    q(`SELECT p.id, p.name, u.name AS user_name,
         count(l.id) FILTER (WHERE l.status = 'active')::int AS active,
         count(l.id) FILTER (WHERE l.status = 'active' AND s.kind = 'appointment')::int AS appointments,
         count(l.id) FILTER (WHERE l.status = 'active' AND s.kind = 'won')::int AS won,
         COALESCE(sum(l.value) FILTER (WHERE l.status = 'active' AND s.kind <> 'won'), 0)::float AS open_value,
         COALESCE(sum(l.value) FILTER (WHERE l.status = 'active' AND s.kind = 'won'), 0)::float AS won_value
       FROM pipelines p LEFT JOIN users u ON u.id = p.user_id
       LEFT JOIN leads l ON l.pipeline_id = p.id LEFT JOIN pipeline_stages s ON s.id = l.stage_id
       WHERE p.id = ANY($1) GROUP BY p.id, u.name ORDER BY p.position, p.id`, [ids]),
    q(`SELECT
         count(*) FILTER (WHERE (a.created_at AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date)::int AS today,
         count(*) FILTER (WHERE a.created_at >= now() - interval '7 days')::int AS week,
         count(*) FILTER (WHERE a.created_at >= now() - interval '30 days')::int AS month,
         count(*) FILTER (WHERE a.created_at >= now() - interval '30 days' AND a.outcome = 'connected')::int AS connected_month,
         count(*) FILTER (WHERE a.created_at >= now() - interval '30 days' AND a.outcome IS NOT NULL)::int AS logged_month
       FROM ${ACTS} AND a.type = 'call'`, [ids, tz]),
    q(`SELECT COALESCE(a.outcome, 'not_logged') AS outcome, count(*)::int AS n FROM ${ACTS}
       AND a.type = 'call' AND a.created_at >= now() - interval '30 days' GROUP BY 1 ORDER BY n DESC`, [ids]),
    q(`SELECT d::date AS day, count(x.id)::int AS n
       FROM generate_series((now() AT TIME ZONE $2)::date - 13, (now() AT TIME ZONE $2)::date, interval '1 day') d
       LEFT JOIN (SELECT a.id, a.created_at FROM ${ACTS} AND a.type = 'call') x ON (x.created_at AT TIME ZONE $2)::date = d::date
       GROUP BY d ORDER BY d`, [ids, tz]),
    q(`SELECT d::date AS day, count(x.id)::int AS n
       FROM generate_series((now() AT TIME ZONE $2)::date - 29, (now() AT TIME ZONE $2)::date, interval '1 day') d
       LEFT JOIN (SELECT l.id, l.created_at FROM ${LEADS}) x ON (x.created_at AT TIME ZONE $2)::date = d::date
       GROUP BY d ORDER BY d`, [ids, tz]),
    q(`SELECT COALESCE(l.dq_reason, 'Other') AS reason, count(*)::int AS n FROM ${LEADS}
       AND l.status = 'disqualified' GROUP BY 1 ORDER BY n DESC`, [ids]),
    q(`SELECT a.id, a.type, a.outcome, a.body, a.meta, a.created_at, a.lead_id, u.name AS user_name,
         l.first_name, l.last_name, l.company
       FROM activities a JOIN leads l ON l.id = a.lead_id LEFT JOIN users u ON u.id = a.user_id
       WHERE l.pipeline_id = ANY($1) AND a.type <> 'created'
       ORDER BY a.created_at DESC, a.id DESC LIMIT 12`, [ids]),
    q(`SELECT l.id, l.first_name, l.last_name, l.company, l.phone, l.next_follow_up, l.stage_id, l.pipeline_id FROM ${LEADS}
       AND l.status = 'active' AND l.next_follow_up IS NOT NULL AND l.next_follow_up <= (now() AT TIME ZONE $2)::date + 7
       ORDER BY l.next_follow_up, l.id LIMIT 10`, [ids, tz]),
  ]);
  res.json({
    pipelineIds: ids, totals: totals[0], byStage, byPipeline, calls: calls[0], outcomes, callsDaily, leadsDaily,
    dqReasons, recent, followUps,
  });
}));

/* ---------------------------------------------------------------- team performance (owner only) */

app.get('/api/team-stats', requireOwner, wrap(async (req, res) => {
  const tz = /^[A-Za-z_]+\/[A-Za-z_\/-]+$|^UTC$/.test(String(req.query.tz || '')) ? req.query.tz : 'UTC';
  const period = ['today', '7d', '30d', 'all'].includes(req.query.period) ? req.query.period : '7d';
  const since = {
    today: `(date_trunc('day', now() AT TIME ZONE $1) AT TIME ZONE $1)`,
    '7d': `now() - interval '7 days'`,
    '30d': `now() - interval '30 days'`,
    all: `'-infinity'::timestamptz`,
  }[period];
  const [{ rows: people }, { rows: daily }] = await Promise.all([
    db.query(
      `SELECT u.id, u.name, u.email, u.role,
         count(a.id) FILTER (WHERE a.type = 'call')::int AS calls,
         count(a.id) FILTER (WHERE a.type = 'call' AND a.outcome = 'connected')::int AS connected,
         count(a.id) FILTER (WHERE a.type = 'call' AND a.outcome IS NOT NULL)::int AS logged,
         count(a.id) FILTER (WHERE a.type = 'call' AND a.outcome = 'voicemail')::int AS voicemails,
         count(a.id) FILTER (WHERE a.type = 'note')::int AS notes,
         count(DISTINCT a.lead_id) FILTER (WHERE a.type IN ('call','note','stage','disqualified'))::int AS leads_worked,
         count(a.id) FILTER (WHERE a.type = 'stage' AND (a.meta->>'to_pos')::int > (a.meta->>'from_pos')::int)::int AS advanced,
         count(a.id) FILTER (WHERE a.type = 'stage' AND a.meta->>'to_kind' = 'appointment')::int AS appointments,
         count(a.id) FILTER (WHERE a.type = 'stage' AND a.meta->>'to_kind' = 'won')::int AS won,
         count(a.id) FILTER (WHERE a.type = 'disqualified')::int AS disqualified,
         (SELECT max(created_at) FROM activities x WHERE x.user_id = u.id AND x.type <> 'created') AS last_active
       FROM users u
       LEFT JOIN activities a ON a.user_id = u.id AND a.created_at >= ${since}
       GROUP BY u.id ORDER BY calls DESC, u.name`,
      period === 'today' ? [tz] : [],
    ),
    db.query(
      `SELECT a.user_id, (a.created_at AT TIME ZONE $1)::date AS day, count(*)::int AS n
       FROM activities a
       WHERE a.type = 'call' AND a.user_id IS NOT NULL
         AND (a.created_at AT TIME ZONE $1)::date > (now() AT TIME ZONE $1)::date - 14
       GROUP BY 1, 2`,
      [tz],
    ),
  ]);
  const days = [];
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  const byUser = {};
  daily.forEach((r) => { (byUser[r.user_id] = byUser[r.user_id] || {})[r.day] = r.n; });
  people.forEach((p) => { p.daily = days.map((d) => ({ day: d, n: (byUser[p.id] || {})[d] || 0 })); });
  res.json({ period, people });
}));

/* ---------------------------------------------------------------- static + errors */

app.use('/api', (_req, res) => bad(res, 'Not found', 404));

// Fingerprint app.js / styles.css so every deploy gets new URLs and browsers never run stale code.
const PUBLIC_DIR = path.join(__dirname, 'public');
const ASSET_VERSION = crypto.createHash('sha256')
  .update(fs.readFileSync(path.join(PUBLIC_DIR, 'app.js')))
  .update(fs.readFileSync(path.join(PUBLIC_DIR, 'styles.css')))
  .digest('hex').slice(0, 12);
const INDEX_HTML = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8')
  .replace('/styles.css"', `/styles.css?v=${ASSET_VERSION}"`)
  .replace('/app.js"', `/app.js?v=${ASSET_VERSION}"`);

app.use(express.static(PUBLIC_DIR, {
  index: false,
  setHeaders(res, filePath) {
    // Versioned URLs can be cached for a long time; everything else revalidates on each load.
    const versioned = /\.(js|css)$/.test(filePath);
    res.setHeader('Cache-Control', versioned ? 'public, max-age=31536000, immutable' : 'no-cache');
  },
}));
app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.type('html').send(INDEX_HTML);
});

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
