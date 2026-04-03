const BASE = '/api';

export async function getCourses() {
  const res = await fetch(`${BASE}/courses`);
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

export async function createCourse(name) {
  const res = await fetch(`${BASE}/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to create course');
  return res.json();
}

export async function uploadResults(courseId, records) {
  const res = await fetch(`${BASE}/courses/${courseId}/upload-results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(records),
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function uploadIncrement(courseId, increment, teams, maxPoints) {
  const body = { increment, teams };
  if (maxPoints != null) body.maxPoints = maxPoints;
  const res = await fetch(`${BASE}/courses/${courseId}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function renameCourse(id, name) {
  const res = await fetch(`${BASE}/courses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to rename course');
  return res.json();
}

export async function deleteCourse(id) {
  const res = await fetch(`${BASE}/courses/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete course');
}

export async function getIncrements(courseId) {
  const res = await fetch(`${BASE}/courses/${courseId}/increments`);
  if (!res.ok) throw new Error('Failed to fetch increments');
  return res.json();
}

export async function setIncrementMaxPoints(courseId, incrementId, maxPoints) {
  const res = await fetch(`${BASE}/courses/${courseId}/increments/${incrementId}/max-points`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ maxPoints }),
  });
  if (!res.ok) throw new Error('Failed to update max points');
  return res.json();
}

export async function getStats(courseId) {
  const res = await fetch(`${BASE}/courses/${courseId}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function exportData() {
  const res = await fetch(`${BASE}/export`);
  if (!res.ok) throw new Error('Export failed');
  return res.json();
}

export async function importData(payload) {
  const res = await fetch(`${BASE}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Import failed');
  return res.json();
}
