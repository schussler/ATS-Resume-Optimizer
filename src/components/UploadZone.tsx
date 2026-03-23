import React, { useCallback, useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadZoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ file, onFileChange }) => {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (f: File) => {
    setError('');
    if (f.type !== 'application/pdf') {
      setError('Por favor, envie apenas arquivos PDF.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo: 10MB.');
      return;
    }
    onFileChange(f);
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div>
      <label className="field-label">Currículo (PDF)</label>
      <label
        id="pdf-upload-zone"
        htmlFor="pdf-file-input"
        className={`upload-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{ display: 'block', cursor: 'pointer' }}
      >
        <input
          id="pdf-file-input"
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={onInputChange}
        />

        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={22} style={{ color: 'var(--success)' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.95rem' }}>
                {file.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {formatSize(file.size)} • PDF
              </div>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); onFileChange(null); }}
              style={{
                marginLeft: 'auto',
                background: 'var(--error-bg)',
                border: '1px solid var(--error)',
                borderRadius: '8px',
                color: 'var(--error)',
                padding: '4px 10px',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              Remover
            </button>
          </div>
        ) : (
          <div>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'var(--accent-glow)', border: '1px solid var(--border-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              {dragging ? <FileText size={24} style={{ color: 'var(--accent)' }} /> : <Upload size={24} style={{ color: 'var(--accent)' }} />}
            </div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {dragging ? 'Solte aqui!' : 'Arraste seu PDF ou clique para selecionar'}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Apenas arquivos PDF • Máximo 10MB
            </p>
          </div>
        )}
      </label>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: 'var(--error)', fontSize: '0.83rem' }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
};
