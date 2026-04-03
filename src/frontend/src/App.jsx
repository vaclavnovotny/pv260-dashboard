import { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import DashboardPage from './pages/DashboardPage';

const LAUNCHER_URL = 'http://127.0.0.1:3002/launch'; // must match launcher.js PORT

const ClaudeIcon = () => (
  <img src="/claude-ai-icon.svg" width="16" height="16" alt="Claude" />
);

function ClaudeUpdateButton() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'error'
  const resetTimer = useRef(null);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function handleClick() {
    setStatus('loading');
    try {
      const res = await fetch(LAUNCHER_URL, { method: 'POST' });
      if (!res.ok) throw new Error('Launcher returned error');
      setStatus('idle');
    } catch {
      setStatus('error');
      resetTimer.current = setTimeout(() => setStatus('idle'), 4000);
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
      {status === 'loading' && 'Starting\u2026'}
      {status === 'error' && 'Start node launcher.js first'}
      {status === 'idle' && 'Update via Claude'}
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
