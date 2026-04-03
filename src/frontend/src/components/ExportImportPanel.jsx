import { useState } from 'react';
import { exportData, importData } from '../api';

export default function ExportImportPanel({ onImported }) {
  const [importStatus, setImportStatus] = useState('');
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);

  async function handleExport() {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pv260-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  }

  async function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImportStatus('');
    setImportError('');
    setImporting(true);

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const result = await importData(payload);
      setImportStatus(`Imported ${result.coursesImported} course(s) and ${result.scoresImported} score(s).`);
      onImported?.();
    } catch (err) {
      setImportError('Import failed: ' + err.message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <p className="section-title" style={{ marginTop: 0 }}>Export / Import</p>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <button type="button" onClick={handleExport}>
          Download export
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Restore from file:</span>
          <input
            type="file"
            accept=".json"
            disabled={importing}
            onChange={handleImportFile}
          />
        </div>

        {importStatus && <div className="alert-success">{importStatus}</div>}
        {importError && <div className="alert-error">{importError}</div>}
      </div>
    </div>
  );
}
