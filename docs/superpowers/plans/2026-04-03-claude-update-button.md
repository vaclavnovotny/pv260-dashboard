# Claude Update Button — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a button with a Claude icon in the nav bar that opens Windows Terminal in the repo root and runs `claude "/pv260-update"`.

**Architecture:** A tiny host-side Node.js HTTP launcher (`launcher.js`) runs on port 3002 directly on Windows, outside Docker. The frontend button calls it via `fetch`. The launcher spawns `wt.exe` with the claude command. React state handles loading/error feedback inline in the button label.

**Tech Stack:** Node.js built-in `http` + `child_process` (launcher), React 19 + inline SVG (frontend)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `launcher.js` | Create | Host-side HTTP server that spawns `wt.exe` |
| `src/frontend/src/App.jsx` | Modify | Add `ClaudeUpdateButton` component to nav |
| `src/frontend/src/index.css` | Modify | Add `.btn-claude` styles |

---

## Task 1: Create launcher.js

**Files:**
- Create: `launcher.js`

- [ ] **Step 1: Create `launcher.js` in repo root**

```js
const http = require('http');
const { exec } = require('child_process');
const path = require('path');

const PORT = 3002;
const dir = path.resolve(__dirname);

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/launch') {
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
```

- [ ] **Step 2: Verify launcher starts**

```bash
node launcher.js
```

Expected output:
```
PV260 launcher running on http://127.0.0.1:3002
Repo root: C:\...\pv260-dashboard
```

- [ ] **Step 3: Verify endpoint responds**

```bash
curl -s -X POST http://127.0.0.1:3002/launch
```

Expected: `{"ok":true}` and Windows Terminal opens running `claude "/pv260-update"`.

- [ ] **Step 4: Stop launcher (Ctrl+C) and commit**

```bash
git add launcher.js
git commit -m "feat: add host-side launcher for Claude update button"
```

---

## Task 2: Add button to frontend

**Files:**
- Modify: `src/frontend/src/index.css`
- Modify: `src/frontend/src/App.jsx`

- [ ] **Step 1: Add `.btn-claude` styles to `src/frontend/src/index.css`**

Add after the `.app-nav a.active` block (after line 74):

```css
.btn-claude {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #1e2535;
  border: 1px solid #2e3346;
  color: rgba(255,255,255,0.75);
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-claude:hover {
  background: #252836;
  border-color: #D4A574;
  color: #D4A574;
}

.btn-claude:disabled {
  opacity: 0.5;
  cursor: default;
}
```

- [ ] **Step 2: Replace `src/frontend/src/App.jsx` with the updated version**

```jsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import DashboardPage from './pages/DashboardPage';

const LAUNCHER_URL = 'http://127.0.0.1:3002/launch';

const ClaudeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.09 8.26L20.63 6.63L17.18 12L20.63 17.37L14.09 15.74L12 22L9.91 15.74L3.37 17.37L6.82 12L3.37 6.63L9.91 8.26L12 2Z" fill="currentColor"/>
  </svg>
);

function ClaudeUpdateButton() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'error'

  async function handleClick() {
    setStatus('loading');
    try {
      const res = await fetch(LAUNCHER_URL, { method: 'POST' });
      if (!res.ok) throw new Error('Launcher returned error');
      setStatus('idle');
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  }

  return (
    <button
      className="btn-claude"
      onClick={handleClick}
      disabled={status === 'loading'}
      title="Run /pv260-update in terminal"
    >
      <ClaudeIcon />
      {status === 'loading' && 'Starting…'}
      {status === 'error' && 'Start node launcher.js first'}
      {status === 'idle' && 'Update'}
    </button>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <nav className="app-nav">
        <span className="brand">PV260 Tracker</span>
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/upload">Upload</NavLink>
        <ClaudeUpdateButton />
      </nav>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: Build the frontend**

```bash
cd src/frontend && npm run build
```

Expected: Build completes with no errors. Output in `src/frontend/dist/`.

- [ ] **Step 4: Rebuild and restart Docker**

```bash
cd ../.. && docker compose up -d --build
```

Expected: Container restarts, app is accessible at `http://localhost:3001`.

- [ ] **Step 5: Verify in browser**

Start the launcher: `node launcher.js`

Open `http://localhost:3001` — "Update" button with Claude icon appears on the right side of the nav bar.

**Happy path:** Click the button → Windows Terminal opens and runs `claude "/pv260-update"`. Button briefly shows "Starting…" then resets.

**Error path:** Stop the launcher (`Ctrl+C`), click the button → button shows "Start node launcher.js first" for 4 seconds, then resets to "Update".

- [ ] **Step 6: Commit**

```bash
git add src/frontend/src/App.jsx src/frontend/src/index.css
git commit -m "feat: add Claude Update button to nav bar"
```
