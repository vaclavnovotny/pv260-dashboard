import { useState, useEffect } from 'react';
import CourseSelector from '../components/CourseSelector';
import CoursesManager from '../components/CoursesManager';
import ExportImportPanel from '../components/ExportImportPanel';
import { uploadResults, getIncrements, setIncrementMaxPoints } from '../api';

function detectNewFormat(text) {
  try {
    const p = JSON.parse(text);
    return Array.isArray(p) && p.length > 0 && p[0].studentName !== undefined;
  } catch {
    return false;
  }
}

export default function UploadPage() {
  const [courseId, setCourseId] = useState(null);
  const [fileText, setFileText] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  // Max points section
  const [increments, setIncrements] = useState([]);
  const [selectedIncId, setSelectedIncId] = useState('');
  const [maxPointsValue, setMaxPointsValue] = useState('');
  const [mpStatus, setMpStatus] = useState('');
  const [mpError, setMpError] = useState('');

  useEffect(() => {
    if (!courseId) { setIncrements([]); setSelectedIncId(''); return; }
    getIncrements(courseId)
      .then(rows => {
        setIncrements(rows);
        setSelectedIncId(rows.length > 0 ? String(rows[0].id) : '');
      })
      .catch(err => { console.error('Failed to load increments:', err); setIncrements([]); });
  }, [courseId, status]); // re-fetch after a successful upload

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setFileText(ev.target.result); setSource('file: ' + file.name); };
    reader.readAsText(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('');
    setError('');
    if (!courseId) return setError('Select a course');

    let parsed;
    try {
      parsed = JSON.parse(fileText);
    } catch {
      return setError('Invalid JSON');
    }

    if (!detectNewFormat(fileText)) {
      return setError('Unrecognised format. Expected an array of student records.');
    }

    try {
      const result = await uploadResults(courseId, parsed);
      setStatus(`Uploaded ${result.upserted} team-increment scores.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSetMaxPoints(e) {
    e.preventDefault();
    setMpStatus('');
    setMpError('');
    if (!courseId) return setMpError('Select a course');
    if (!selectedIncId) return setMpError('Select an increment');
    const mp = Number(maxPointsValue);
    if (!maxPointsValue || isNaN(mp) || mp <= 0) return setMpError('Enter a valid positive number');
    try {
      await setIncrementMaxPoints(courseId, selectedIncId, mp);
      setMpStatus('Max points updated.');
    } catch (err) {
      setMpError(err.message);
    }
  }

  const incLabel = inc => inc.label ?? `#${inc.number}`;

  return (
    <div>
      <h2>Upload Results</h2>

      <div className="card" style={{ maxWidth: 520 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <CourseSelector value={courseId} onChange={setCourseId} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#cbd5e1' }}>Results JSON</span>
            <input type="file" accept=".json" onChange={handleFileChange} />
            {source && <span style={{ fontSize: '0.75rem', color: '#475569' }}>{source}</span>}
          </div>

          <div>
            <button type="submit" disabled={!fileText || !courseId}>Upload</button>
          </div>

          {status && <div className="alert-success">{status}</div>}
          {error && <div className="alert-error">{error}</div>}
        </form>
      </div>

      <h3 style={{ marginTop: '2rem' }}>Set Max Points</h3>
      <div className="card" style={{ maxWidth: 520 }}>
        {increments.length === 0
          ? <p style={{ color: '#475569', fontSize: '0.875rem', margin: 0 }}>
              {courseId ? 'No increments found for this course.' : 'Select a course above.'}
            </p>
          : <form onSubmit={handleSetMaxPoints} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Increment
                  <select value={selectedIncId} onChange={e => setSelectedIncId(e.target.value)}
                    style={{ padding: '0.3rem 0.5rem', background: '#111420', color: '#e2e8f0', border: '1px solid #2e3346', borderRadius: 4 }}>
                    {increments.map(inc => (
                      <option key={inc.id} value={inc.id}>{incLabel(inc)}</option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Max points
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={maxPointsValue}
                    onChange={e => setMaxPointsValue(e.target.value)}
                    style={{ width: 90 }}
                  />
                </label>
              </div>
              <div>
                <button type="submit">Save</button>
              </div>
              {mpStatus && <div className="alert-success">{mpStatus}</div>}
              {mpError && <div className="alert-error">{mpError}</div>}
            </form>
        }
      </div>

      <CoursesManager />
      <ExportImportPanel />
    </div>
  );
}
