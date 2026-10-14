'use strict';

// Tiny static server for the M2 landing page. No dependencies.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const ROOT = path.join(__dirname, 'public');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.vcf': 'text/vcard; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { urlPath = '/'; }
  if (urlPath === '/health') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) {
      // Unknown paths fall back to the page itself.
      return fs.readFile(path.join(ROOT, 'index.html'), (e2, html) => {
        res.writeHead(e2 ? 500 : 200, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-cache' });
        res.end(html);
      });
    }
    const ext = path.extname(file).toLowerCase();
    const headers = {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    };
    if (ext === '.vcf') headers['Content-Disposition'] = `attachment; filename="${path.basename(file)}"`;
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}).listen(PORT, () => console.log(`M2 landing page on :${PORT}`));
