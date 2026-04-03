import { useState, useEffect } from 'react';
import { getCourses, renameCourse, deleteCourse } from '../api';

export default function CoursesManager() {
  const [courses, setCourses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  function load() {
    getCourses().then(setCourses);
  }

  function startEdit(course) {
    setEditingId(course.id);
    setEditName(course.name);
    setError('');
    setConfirmDeleteId(null);
  }

  async function saveEdit(id) {
    if (!editName.trim()) return;
    try {
      const updated = await renameCourse(id, editName.trim());
      setCourses(prev =>
        prev.map(c => c.id === id ? { ...c, name: updated.name } : c)
            .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      setError('');
    } catch {
      setError('Could not rename — name may already be taken.');
    }
  }

  async function confirmDelete(id) {
    try {
      await deleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      setConfirmDeleteId(null);
    } catch {
      setError('Could not delete course.');
    }
  }

  if (courses.length === 0) return null;

  return (
    <div style={{ marginTop: '2rem' }}>
      <p className="section-title" style={{ marginTop: 0 }}>Manage courses</p>
      <div className="card" style={{ padding: '0.5rem 0' }}>
        {error && <div className="alert-error" style={{ margin: '0.5rem 1rem' }}>{error}</div>}
        {courses.map(course => (
          <div key={course.id} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.5rem 1rem', borderBottom: '1px solid #252836'
          }}>
            {editingId === course.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveEdit(course.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  autoFocus
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={() => saveEdit(course.id)} disabled={!editName.trim()}>
                  Save
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </>
            ) : confirmDeleteId === course.id ? (
              <>
                <span style={{ flex: 1, color: '#f87171', fontSize: '0.875rem' }}>
                  Delete <b>{course.name}</b> and all its data?
                </span>
                <button type="button" onClick={() => confirmDelete(course.id)}
                  style={{ background: '#e05c5c' }}>
                  Delete
                </button>
                <button type="button" className="btn-secondary" onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: '0.9rem' }}>{course.name}</span>
                <button type="button" className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}
                  onClick={() => startEdit(course)}>
                  Rename
                </button>
                <button type="button"
                  style={{ background: '#2d0a0a', color: '#f87171', border: '1px solid #7f1d1d', fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}
                  onClick={() => { setConfirmDeleteId(course.id); setEditingId(null); setError(''); }}>
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
