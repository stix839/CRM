'use strict';

// Outlook (Microsoft Graph) connection: OAuth sign-in per user, token storage and Graph calls.
// Configure with MS_CLIENT_ID and MS_CLIENT_SECRET (an app registration in Microsoft Entra).

const crypto = require('crypto');
const db = require('./db');

const CLIENT_ID = process.env.MS_CLIENT_ID || '';
const CLIENT_SECRET = process.env.MS_CLIENT_SECRET || '';
const TENANT = process.env.MS_TENANT || 'common';
const LOGIN_BASE = (process.env.MS_LOGIN_BASE || 'https://login.microsoftonline.com').replace(/\/$/, '');
const GRAPH_BASE = (process.env.MS_GRAPH_BASE || 'https://graph.microsoft.com/v1.0').replace(/\/$/, '');
const SCOPES = 'offline_access User.Read Mail.Send Calendars.ReadWrite';

const configured = () => Boolean(CLIENT_ID && CLIENT_SECRET);

// Key for encrypting stored tokens and signing the OAuth state.
const KEY = crypto.createHash('sha256').update(process.env.TOKEN_SECRET || CLIENT_SECRET || 'm2-dev-key').digest();

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}

function decrypt(blob) {
  const [iv, tag, enc] = String(blob).split('.').map((s) => Buffer.from(s, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

function signState(userId) {
  const payload = Buffer.from(JSON.stringify({ u: userId, n: crypto.randomBytes(8).toString('hex'), t: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', KEY).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyState(state, userId) {
  const [payload, sig] = String(state || '').split('.');
  if (!payload || !sig) return false;
  const expected = crypto.createHmac('sha256', KEY).update(payload).digest('base64url');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.u === userId && Date.now() - data.t < 15 * 60 * 1000;
  } catch { return false; }
}

function authorizeUrl(redirectUri, userId) {
  const q = new URLSearchParams({
    client_id: CLIENT_ID, response_type: 'code', redirect_uri: redirectUri, response_mode: 'query',
    scope: SCOPES, state: signState(userId), prompt: 'select_account',
  });
  return `${LOGIN_BASE}/${TENANT}/oauth2/v2.0/authorize?${q}`;
}

async function tokenRequest(params) {
  const res = await fetch(`${LOGIN_BASE}/${TENANT}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, scope: SCOPES, ...params }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error_description ? String(data.error_description).split('\n')[0] : 'Microsoft sign-in failed');
    err.code = data.error;
    throw err;
  }
  return data;
}

async function saveTokens(userId, tokens, profile) {
  const expires = new Date(Date.now() + (Number(tokens.expires_in) || 3600) * 1000);
  await db.query(
    `INSERT INTO oauth_accounts (user_id, provider, email, name, access_token, refresh_token, expires_at)
     VALUES ($1, 'microsoft', $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET
       email = COALESCE(EXCLUDED.email, oauth_accounts.email), name = COALESCE(EXCLUDED.name, oauth_accounts.name),
       access_token = EXCLUDED.access_token,
       refresh_token = COALESCE(EXCLUDED.refresh_token, oauth_accounts.refresh_token),
       expires_at = EXCLUDED.expires_at`,
    [userId, profile ? profile.email : null, profile ? profile.name : null,
      encrypt(tokens.access_token), tokens.refresh_token ? encrypt(tokens.refresh_token) : null, expires],
  );
}

// Finish sign-in: swap the code for tokens and remember which mailbox was connected.
async function completeSignIn(userId, code, redirectUri) {
  const tokens = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri });
  const me = await rawGraph(tokens.access_token, 'GET', '/me?$select=displayName,mail,userPrincipalName');
  await saveTokens(userId, tokens, { email: me.mail || me.userPrincipalName || null, name: me.displayName || null });
  return me;
}

async function account(userId) {
  const { rows } = await db.query('SELECT * FROM oauth_accounts WHERE user_id = $1', [userId]);
  return rows[0] || null;
}

async function status(userId) {
  const acc = await account(userId);
  return { configured: configured(), connected: Boolean(acc && acc.refresh_token), email: acc ? acc.email : null };
}

async function disconnect(userId) {
  await db.query('DELETE FROM oauth_accounts WHERE user_id = $1', [userId]);
}

async function accessToken(userId, force) {
  const acc = await account(userId);
  if (!acc || !acc.refresh_token) {
    const err = new Error('Connect your Outlook account in Settings first');
    err.status = 400;
    throw err;
  }
  if (!force && new Date(acc.expires_at).getTime() - Date.now() > 120000) return decrypt(acc.access_token);
  let tokens;
  try {
    tokens = await tokenRequest({ grant_type: 'refresh_token', refresh_token: decrypt(acc.refresh_token) });
  } catch (e) {
    if (e.code === 'invalid_grant') {
      await disconnect(userId);
      const err = new Error('Your Outlook connection expired. Reconnect it in Settings.');
      err.status = 400;
      throw err;
    }
    throw e;
  }
  await saveTokens(userId, tokens, null);
  return tokens.access_token;
}

async function rawGraph(token, method, path, body, headers = {}) {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 202 || res.status === 204) return {};
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data.error && data.error.message) || `Outlook request failed (${res.status})`);
    err.status = res.status === 401 ? 401 : 502;
    err.graphStatus = res.status;
    throw err;
  }
  return data;
}

// Graph call as a user; refreshes the token once if Microsoft rejects it.
async function graph(userId, method, path, body, headers) {
  try {
    return await rawGraph(await accessToken(userId), method, path, body, headers);
  } catch (e) {
    if (e.graphStatus !== 401) throw e;
    return rawGraph(await accessToken(userId, true), method, path, body, headers);
  }
}

module.exports = { configured, authorizeUrl, verifyState, completeSignIn, status, disconnect, graph };
