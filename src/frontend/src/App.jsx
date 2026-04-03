import { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import DashboardPage from './pages/DashboardPage';

const LAUNCHER_URL = 'http://127.0.0.1:3002/launch'; // must match launcher.js PORT

const ClaudeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.09 8.26L20.63 6.63L17.18 12L20.63 17.37L14.09 15.74L12 22L9.91 15.74L3.37 17.37L6.82 12L3.37 6.63L9.91 8.26L12 2Z" fill="currentColor"/>
  </svg>
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
