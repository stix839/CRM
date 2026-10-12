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

let stageCache = null;

async function query(sql, params) {
  const res = await pool.query(sql, params);
  if (/settings/i.test(sql) && /insert|update/i.test(sql)) stageCache = null;
  return res;
}

async function getStages() {
  if (stageCache) return stageCache;
  const { rows } = await pool.query(`SELECT value FROM settings WHERE key = 'stages'`);
  const stages = rows[0] && Array.isArray(rows[0].value) && rows[0].value.length === 5 ? rows[0].value : DEFAULT_STAGES;
  stageCache = stages;
  return stages;
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
  `);
}

module.exports = { pool, query, getStages, migrate, DEFAULT_STAGES };
