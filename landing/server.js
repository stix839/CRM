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
