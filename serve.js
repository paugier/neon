// serve.js — a tiny static file server, ZERO dependencies (Node built-ins only).
//
// The game uses ES modules (`import`), which browsers refuse to load over
// `file://`. This serves the `game/` folder over HTTP so the modules load.
//
// Usage:
//   npm run serve            # serves ./game on http://localhost:8000/
//   node serve.js 3000       # custom port
//   PORT=3000 node serve.js  # custom port via env

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), 'game');
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 8000);

// Minimal MIME map. `.js` MUST be a JavaScript type or the browser refuses to
// execute it as an ES module.
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  // Strip the query string and default `/` to `/index.html`.
  let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (pathname === '/') pathname = '/index.html';

  // Resolve inside ROOT and block path traversal (e.g. `/../.env`).
  const filePath = normalize(join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const body = await readFile(filePath);
    res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`NÉON served on http://localhost:${PORT}/  (serving ${ROOT})`);
  console.log('Press Ctrl+C to stop.');
});
