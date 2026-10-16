'use strict';

const { Pool, types } = require('pg');

// Return DATE columns as plain 'YYYY-MM-DD' strings instead of timezone-shifted JS Dates.
types.setTypeParser(1082, (v) => v);

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/m2';
const needsSsl = /sslmode=require/.test(connectionString) || process.env.PGSSL === 'true';

const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

const DEFAULT_STAGES = ['New Lead', 'Contacted', 'Interested', 'Appointment Set', 'Closed Won'];

async function query(sql, params) {
  return pool.query(sql, params);
}

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS imports (
      id SERIAL PRIMARY KEY,
      filename TEXT,
      lead_count INT NOT NULL DEFAULT 0,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      company TEXT,
      title TEXT,
      phone TEXT,
      phone_digits TEXT,
      phone_alt TEXT,
      email TEXT,
      website TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      source TEXT,
      value NUMERIC(14,2),
      notes TEXT,
      extra JSONB NOT NULL DEFAULT '{}'::jsonb,
      stage SMALLINT NOT NULL DEFAULT 1 CHECK (stage BETWEEN 1 AND 5),
      position DOUBLE PRECISION NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disqualified')),
      dq_reason TEXT,
      dq_at TIMESTAMPTZ,
      call_count INT NOT NULL DEFAULT 0,
      last_contacted_at TIMESTAMPTZ,
      next_follow_up DATE,
      import_id INT REFERENCES imports(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS leads_stage_pos ON leads (status, stage, position);
    CREATE INDEX IF NOT EXISTS leads_phone_digits ON leads (phone_digits);

    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      lead_id INT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      type TEXT NOT NULL,
      outcome TEXT,
      body TEXT,
      meta JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS activities_lead ON activities (lead_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS activities_type_time ON activities (type, created_at);
    CREATE INDEX IF NOT EXISTS activities_user_time ON activities (user_id, created_at);

    ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS social_note TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
  `);
  // The first account created is the owner.
  await pool.query(`
    UPDATE users SET role = 'owner'
    WHERE id = (SELECT min(id) FROM users) AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'owner')
  `);

  // Pipelines: each teammate can have their own pipeline with its own stages.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pipelines (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      position INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS pipeline_stages (
      id SERIAL PRIMARY KEY,
      pipeline_id INT NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'open' CHECK (kind IN ('open','appointment','won')),
      position INT NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS pipeline_stages_pipeline ON pipeline_stages (pipeline_id, position);
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_id INT REFERENCES pipelines(id);
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage_id INT REFERENCES pipeline_stages(id);
    ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_stage_check;
    ALTER TABLE leads ALTER COLUMN stage DROP NOT NULL;
    CREATE INDEX IF NOT EXISTS leads_pipeline_stage_pos ON leads (pipeline_id, stage_id, position);

    CREATE TABLE IF NOT EXISTS oauth_accounts (
      user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL DEFAULT 'microsoft',
      email TEXT,
      name TEXT,
      access_token TEXT,
      refresh_token TEXT,
      expires_at TIMESTAMPTZ,
      connected_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      lead_id INT REFERENCES leads(id) ON DELETE SET NULL,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      starts_at TIMESTAMPTZ NOT NULL,
      ends_at TIMESTAMPTZ NOT NULL,
      location TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','no_show','canceled')),
      outlook_event_id TEXT,
      outlook_link TEXT,
      invite_sent BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS appointments_time ON appointments (starts_at);
    CREATE INDEX IF NOT EXISTS appointments_lead ON appointments (lead_id);
  `);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE pipelines IN EXCLUSIVE MODE');
    const { rows: existing } = await client.query('SELECT id FROM pipelines LIMIT 1');
    if (!existing.length) {
      // First run with pipelines: turn the old single pipeline into the owner's pipeline.
      const { rows: owner } = await client.query(`SELECT id, name FROM users WHERE role = 'owner' ORDER BY id LIMIT 1`);
      const { rows: saved } = await client.query(`SELECT value FROM settings WHERE key = 'stages'`);
      const names = saved[0] && Array.isArray(saved[0].value) && saved[0].value.length === 5 ? saved[0].value : DEFAULT_STAGES;
      const pipeName = owner[0] ? `${owner[0].name.split(' ')[0]}'s pipeline` : 'Main pipeline';
      const pipelineId = await createPipeline(client, pipeName, owner[0] ? owner[0].id : null, names);
      const { rows: stages } = await client.query('SELECT id, position FROM pipeline_stages WHERE pipeline_id = $1 ORDER BY position', [pipelineId]);
      for (const st of stages) {
        await client.query('UPDATE leads SET pipeline_id = $1, stage_id = $2 WHERE stage_id IS NULL AND stage = $3', [pipelineId, st.id, st.position]);
      }
      await client.query('UPDATE leads SET pipeline_id = $1, stage_id = $2 WHERE stage_id IS NULL', [pipelineId, stages[0].id]);
      // Old stage-change history used stage numbers 1-5; record positions and kinds the new way.
      await client.query(`
        UPDATE activities SET meta = meta
          || jsonb_build_object('from_pos', (meta->>'from')::int, 'to_pos', (meta->>'to')::int,
               'to_kind', CASE (meta->>'to')::int WHEN 4 THEN 'appointment' WHEN 5 THEN 'won' ELSE 'open' END)
        WHERE type = 'stage' AND meta ? 'to' AND NOT meta ? 'to_kind'
      `);
      // Every existing teammate gets their own pipeline too.
      const { rows: members } = await client.query(`SELECT id, name FROM users WHERE role <> 'owner' ORDER BY id`);
      for (const m of members) await createPipeline(client, `${m.name.split(' ')[0]}'s pipeline`, m.id, DEFAULT_STAGES);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

const DEFAULT_KINDS = ['open', 'open', 'open', 'appointment', 'won'];

// Creates a pipeline with the given stage names (default kinds for the standard 5) and returns its id.
async function createPipeline(client, name, userId, stageNames = DEFAULT_STAGES) {
  const { rows: pos } = await client.query('SELECT COALESCE(MAX(position), 0) + 1 AS p FROM pipelines');
  const { rows } = await client.query(
    'INSERT INTO pipelines (name, user_id, position) VALUES ($1, $2, $3) RETURNING id', [name, userId, pos[0].p],
  );
  const id = rows[0].id;
  for (let i = 0; i < stageNames.length; i++) {
    await client.query(
      'INSERT INTO pipeline_stages (pipeline_id, name, kind, position) VALUES ($1, $2, $3, $4)',
      [id, stageNames[i], stageNames.length === 5 ? DEFAULT_KINDS[i] : 'open', i + 1],
    );
  }
  return id;
}

module.exports = { pool, query, migrate, createPipeline, DEFAULT_STAGES };
