// PV260 host-side launcher — runs on Windows outside Docker.
// Start with: node launcher.js
// The dashboard frontend calls POST http://127.0.0.1:3002/launch to open
// Windows Terminal and run claude "/pv260-update".

const http = require('http');
const { exec } = require('child_process');
const path = require('path');

const PORT = 3002; // must match LAUNCHER_URL in src/frontend/src/App.jsx
const ALLOWED_ORIGINS = ['http://localhost:3001', 'http://localhost:5173'];
const dir = path.resolve(__dirname);

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/launch') {
    // Fire-and-forget: respond immediately; terminal opens asynchronously.
    exec(`wt.exe -d "${dir}" cmd /k claude "/pv260-update"`, (err) => {
      if (err) console.error('Launch error:', err.message);
    });
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`PV260 launcher running on http://127.0.0.1:${PORT}`);
  console.log(`Repo root: ${dir}`);
});
