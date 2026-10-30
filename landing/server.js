'use strict';

// Tiny static server for the M2 landing page. No dependencies.
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 3001;
const ROOT = path.join(__dirname, 'public');
// Search engines should only ever see one address for the site.
const CANONICAL_HOST = (process.env.CANONICAL_HOST || 'm2-mediamanagement.com').toLowerCase();
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.vcf': 'text/vcard; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.webmanifest', '.xml', '.svg', '.txt', '.vcf', '.ico']);
// Pages live at clean addresses: /privacy, not /privacy.html.
const PAGES = { '/': 'index.html', '/privacy': 'privacy.html' };
const PAGE_FOR_FILE = Object.fromEntries(Object.entries(PAGES).map(([url, file]) => ['/' + file, url]));

const gzipCache = new Map();

// Inquiry form: the browser talks only to this server, which forwards to the CRM with
// the shared key. The CRM address and key never reach the browser.
const CRM_URL = (process.env.CRM_URL || '').replace(/\/$/, '');
const INQUIRY_KEY = process.env.INQUIRY_KEY || '';
const submissions = new Map();
function tooMany(ip) {
  const now = Date.now();
  const list = (submissions.get(ip) || []).filter((t) => now - t < 3600e3);
  list.push(now);
  submissions.set(ip, list);
  return list.length > 6;
}

function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': TYPES['.json'], 'Cache-Control': 'no-store', 'Content-Length': Buffer.byteLength(data) });
  res.end(data);
}

async function crm(method, pathName, body) {
  const r = await fetch(`${CRM_URL}${pathName}`, {
    method, headers: { 'Content-Type': 'application/json', 'X-Inquiry-Key': INQUIRY_KEY },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000),
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

async function handleInquiryApi(req, res, urlPath) {
  if (!CRM_URL || !INQUIRY_KEY) return json(res, 503, { error: 'The form is not available right now.' });
  try {
    if (urlPath === '/api/slots' && req.method === 'GET') {
      const r = await crm('GET', '/api/public/slots');
      return json(res, r.status, r.body);
    }
    if (urlPath === '/api/inquiry' && req.method === 'POST') {
      const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (raw.length > 20000) return json(res, 413, { error: 'Too much data' }); }
      let body;
      try { body = JSON.parse(raw); } catch { return json(res, 400, { error: 'Invalid form data' }); }
      // Bots fill the hidden "website" field or submit instantly; pretend it worked.
      if (body.website || !(Number(body.elapsed) > 2500)) return json(res, 200, { ok: true, booked: null });
      if (tooMany(ip)) return json(res, 429, { error: 'Too many requests. Please try again later.' });
      const { website: _w, elapsed: _e, ...clean } = body;
      const r = await crm('POST', '/api/public/inquiry', clean);
      return json(res, r.status, r.body);
    }
    return json(res, 404, { error: 'Not found' });
  } catch (e) {
    console.error('inquiry forward failed:', e.message);
    return json(res, 502, { error: 'Something went wrong sending your request. Please try again.' });
  }
}

function redirect(res, location) {
  res.writeHead(301, { Location: location, 'Cache-Control': 'public, max-age=3600' });
  res.end();
}

function send(req, res, status, file) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      if (status === 404) { res.writeHead(404, { 'Content-Type': TYPES['.txt'] }); return res.end('Not found'); }
      return send(req, res, 404, path.join(ROOT, '404.html'));
    }
    const ext = path.extname(file).toLowerCase();
    const headers = {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
      'Last-Modified': st.mtime.toUTCString(),
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000',
      Vary: 'Accept-Encoding',
    };
    if (ext === '.vcf') headers['Content-Disposition'] = `attachment; filename="${path.basename(file)}"`;
    const since = Date.parse(req.headers['if-modified-since'] || '');
    if (status === 200 && since && Math.floor(st.mtimeMs / 1000) * 1000 <= since) {
      res.writeHead(304, headers);
      return res.end();
    }
    fs.readFile(file, (e2, data) => {
      if (e2) { res.writeHead(500); return res.end(); }
      if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
        const key = `${file}:${st.mtimeMs}`;
        if (!gzipCache.has(key)) gzipCache.set(key, zlib.gzipSync(data, { level: 9 }));
        data = gzipCache.get(key);
        headers['Content-Encoding'] = 'gzip';
      }
      headers['Content-Length'] = data.length;
      res.writeHead(status, headers);
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  });
}

http.createServer((req, res) => {
  let urlPath;
  let search = '';
  try {
    const u = new URL(req.url, 'http://x');
    urlPath = decodeURIComponent(u.pathname);
    search = u.search;
  } catch { urlPath = '/'; }
  if (urlPath === '/health') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }
  if (urlPath === '/api/slots' || urlPath === '/api/inquiry') return handleInquiryApi(req, res, urlPath);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }

  // The railway.app address and www both forward to the main domain.
  const host = String(req.headers.host || '').split(':')[0].toLowerCase();
  if (host !== CANONICAL_HOST && (host.endsWith('.up.railway.app') || host === `www.${CANONICAL_HOST}`)) {
    return redirect(res, `https://${CANONICAL_HOST}${req.url}`);
  }

  // One address per page: /index.html → /, /privacy.html → /privacy, /privacy/ → /privacy.
  if (PAGE_FOR_FILE[urlPath]) return redirect(res, PAGE_FOR_FILE[urlPath] + search);
  if (urlPath.length > 1 && urlPath.endsWith('/') && PAGES[urlPath.slice(0, -1)]) return redirect(res, urlPath.slice(0, -1) + search);

  if (PAGES[urlPath]) return send(req, res, 200, path.join(ROOT, PAGES[urlPath]));
  const file = path.normalize(path.join(ROOT, urlPath));
  // Other .html files (like the 404 page) aren't served at their own address.
  if (!file.startsWith(ROOT + path.sep) || path.extname(file).toLowerCase() === '.html') {
    return send(req, res, 404, path.join(ROOT, '404.html'));
  }
  send(req, res, 200, file);
}).listen(PORT, () => console.log(`M2 landing page on :${PORT}`));
