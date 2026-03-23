import React, { useState } from 'react';
import type { GapAnalysis } from '../types';
import {
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Target,
  Zap,
  Eye,
} from 'lucide-react';
import { generateOptimizedPDF, downloadPDF } from '../utils/pdfGenerate';

interface ResultsViewProps {
  analysis: GapAnalysis;
  onReset: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ analysis, onReset }) => {
  const [showChanges, setShowChanges] = useState(true);
  const [showKeywords, setShowKeywords] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);

  const scoreColor =
    analysis.matchScore >= 75
      ? 'var(--success)'
      : analysis.matchScore >= 50
      ? 'var(--warning)'
      : 'var(--error)';

  const scoreLabel =
    analysis.matchScore >= 75 ? 'Excelente' : analysis.matchScore >= 50 ? 'Bom' : 'Precisa melhorar';

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const bytes = await generateOptimizedPDF(analysis);
      const filename = analysis.pdfMetadata.title
        ? `curriculo-${analysis.pdfMetadata.title.toLowerCase().replace(/\s+/g, '-')}.pdf`
        : 'curriculo-otimizado.pdf';
      downloadPDF(bytes, filename);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  const matched = analysis.keywords.filter((k) => k.status === 'matched');
  const missing = analysis.keywords.filter((k) => k.status === 'missing');
  const partial = analysis.keywords.filter((k) => k.status === 'partial');

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Score hero */}
      <div
        className="glass-card"
        style={{
          padding: '32px',
          background: 'linear-gradient(135deg, rgba(79,142,247,0.06) 0%, rgba(139,92,246,0.04) 100%)',
          border: '1px solid rgba(79,142,247,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
          {/* Score circle */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeDasharray={`${(analysis.matchScore / 100) * 327} 327`}
                strokeDashoffset="81.75"
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1.5s ease-out', filter: `drop-shadow(0 0 6px ${scoreColor})` }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: scoreColor }}>
                {analysis.matchScore}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                MATCH
              </span>
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div className={`badge badge-${analysis.matchScore >= 75 ? 'success' : analysis.matchScore >= 50 ? 'warning' : 'error'}`} style={{ marginBottom: '10px' }}>
              {analysis.matchScore >= 75 ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
              {scoreLabel}
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '6px' }}>
              {analysis.jobTitle || 'Gap Analysis Concluído'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {analysis.summary}
            </p>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
            {[
              { label: 'Keywords encontradas', value: analysis.matchedKeywords, icon: CheckCircle, color: 'var(--success)' },
              { label: 'Keywords ausentes', value: analysis.missingKeywords, icon: XCircle, color: 'var(--error)' },
              { label: 'Ajustes feitos', value: analysis.changes.length, icon: Zap, color: 'var(--accent)' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'var(--bg-secondary)',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                }}
              >
                <stat.icon size={14} style={{ color: stat.color }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{stat.label}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 700, color: stat.color, fontSize: '1rem' }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Keywords section */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <button
          onClick={() => setShowKeywords((v) => !v)}
          style={{
            width: '100%',
            padding: '20px 24px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Target size={18} style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
            Mapa de Keywords ({analysis.totalKeywords} identificadas)
          </span>
          <div style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
            {showKeywords ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {showKeywords && (
          <div style={{ padding: '0 24px 24px' }}>
            {matched.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  ✓ Presentes no currículo ({matched.length})
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {matched.map((k) => (
                    <span key={k.keyword} className="tag tag-matched">{k.keyword}</span>
                  ))}
                </div>
              </div>
            )}

            {partial.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  ≈ Parcialmente presentes ({partial.length})
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {partial.map((k) => (
                    <span key={k.keyword} className="tag tag-partial" title={k.suggestion}>
                      {k.keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {missing.length > 0 && (
              <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  ✗ Ausentes no currículo ({missing.length})
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {missing.map((k) => (
                    <span key={k.keyword} className="tag tag-missing">{k.keyword}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Changes section */}
      {analysis.changes.length > 0 && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <button
            onClick={() => setShowChanges((v) => !v)}
            style={{
              width: '100%',
              padding: '20px 24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <TrendingUp size={18} style={{ color: '#8b5cf6' }} />
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
              Alterações Realizadas ({analysis.changes.length})
            </span>
            <div style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
              {showChanges ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>

          {showChanges && (
            <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {analysis.changes.map((change, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderLeft: '3px solid #8b5cf6',
                    borderRadius: '10px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span
                      style={{
                        background: 'rgba(139,92,246,0.1)',
                        color: '#a78bfa',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {change.section}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Antes
                      </p>
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--error)',
                          background: 'var(--error-bg)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          lineHeight: 1.5,
                        }}
                      >
                        {change.original}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Depois
                      </p>
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--success)',
                          background: 'var(--success-bg)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          lineHeight: 1.5,
                        }}
                      >
                        {change.optimized}
                      </p>
                    </div>
                  </div>

                  {change.reason && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.5 }}>
                      💡 {change.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Text preview */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <button
          onClick={() => setShowPreview((v) => !v)}
          style={{
            width: '100%',
            padding: '20px 24px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Eye size={18} style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
            Preview do Currículo Otimizado
          </span>
          <div style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
            {showPreview ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {showPreview && (
          <div style={{ padding: '0 24px 24px' }}>
            <pre
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '20px',
                fontSize: '0.82rem',
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '400px',
                overflowY: 'auto',
              }}
            >
              {analysis.optimizedResumeText}
            </pre>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          id="reset-btn"
          onClick={onReset}
          className="btn-secondary"
          style={{ padding: '12px 24px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RotateCcw size={16} />
          Nova análise
        </button>
        <button
          id="download-pdf-btn"
          onClick={handleDownload}
          disabled={generating}
          className="btn-primary"
          style={{ padding: '12px 32px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px', minWidth: '260px', justifyContent: 'center' }}
        >
          {generating ? (
            <>
              <div className="spinner" />
              Gerando PDF...
            </>
          ) : (
            <>
              <Download size={18} />
              Baixar Currículo Otimizado (PDF)
            </>
          )}
        </button>
      </div>
    </div>
  );
};
