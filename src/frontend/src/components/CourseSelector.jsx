import { useState, useEffect } from 'react';
import { getCourses, createCourse } from '../api';

export default function CourseSelector({ value, onChange }) {
  const [courses, setCourses] = useState([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getCourses().then(setCourses);
  }, []);

  async function handleCreate(e) {
    e?.preventDefault();
    setError('');
    try {
      const course = await createCourse(newName.trim());
      const updated = [...courses, course].sort((a, b) => a.name.localeCompare(b.name));
      setCourses(updated);
      onChange(course.id);
      setNewName('');
    } catch {
      setError('Could not create course (may already exist)');
    }
  }

  return (
    <div className="course-selector">
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#cbd5e1' }}>
        Course
        <select value={value || ''} onChange={e => onChange(Number(e.target.value))}>
          <option value="">— select —</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <span style={{ color: '#2e3346' }}>|</span>
      <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="New course name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate(e)}
          style={{ width: 180 }}
        />
        <button type="button" onClick={handleCreate} disabled={!newName.trim()}>Add course</button>
      </div>
      {error && <span className="alert-error" style={{ padding: '0.25rem 0.6rem' }}>{error}</span>}
    </div>
  );
}
