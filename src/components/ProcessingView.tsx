import React from 'react';
import type { ProcessingStatus } from '../types';
import { Brain, FileSearch, Sparkles, FileOutput } from 'lucide-react';

interface ProcessingViewProps {
  status: ProcessingStatus;
}

const STEPS = [
  { key: 'extracting', label: 'Extraindo texto', icon: FileSearch, color: '#4f8ef7' },
  { key: 'analyzing', label: 'Analisando gap', icon: Brain, color: '#8b5cf6' },
  { key: 'optimizing', label: 'Otimizando currículo', icon: Sparkles, color: '#f59e0b' },
  { key: 'generating', label: 'Gerando PDF', icon: FileOutput, color: '#22c55e' },
] as const;

export const ProcessingView: React.FC<ProcessingViewProps> = ({ status }) => {
  const currentIdx = STEPS.findIndex((s) => s.key === status.step);

  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '60px 32px',
        gap: '40px',
      }}
    >
      {/* Animated brain icon */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(79,142,247,0.15), rgba(139,92,246,0.15))',
            border: '2px solid rgba(79,142,247,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Brain size={44} style={{ color: 'var(--accent)', opacity: 0.9 }} />
          {/* Rotating ring */}
          <div
            style={{
              position: 'absolute',
              inset: '-6px',
              borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: 'var(--accent)',
              borderRightColor: 'rgba(79,142,247,0.3)',
              animation: 'spin 1.5s linear infinite',
            }}
          />
        </div>
        {/* Pulse rings */}
        <div
          style={{
            position: 'absolute',
            inset: '-16px',
            borderRadius: '50%',
            border: '1px solid rgba(79,142,247,0.15)',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }}
        />
      </div>

      {/* Status text */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
          Processando com IA...
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {status.message}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>Progresso</span>
          <span>{status.progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${status.progress}%` }} />
        </div>
      </div>

      {/* Steps */}
      <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isPending = idx > currentIdx;

          return (
            <div
              key={step.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: isCurrent ? 'rgba(79,142,247,0.06)' : 'transparent',
                border: `1px solid ${isCurrent ? 'rgba(79,142,247,0.2)' : 'transparent'}`,
                transition: 'all 0.3s',
                opacity: isPending ? 0.4 : 1,
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: isDone
                    ? 'var(--success-bg)'
                    : isCurrent
                    ? `rgba(${step.color}, 0.1)`
                    : 'var(--bg-secondary)',
                  border: `1px solid ${isDone ? 'var(--success)' : isCurrent ? step.color : 'var(--border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.3s',
                }}
              >
                {isDone ? (
                  <span style={{ color: 'var(--success)', fontSize: '16px' }}>✓</span>
                ) : (
                  <Icon
                    size={16}
                    style={{
                      color: isCurrent ? step.color : 'var(--text-muted)',
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: '0.88rem',
                  fontWeight: isCurrent ? 600 : 400,
                  color: isDone
                    ? 'var(--success)'
                    : isCurrent
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                }}
              >
                {step.label}
              </span>
              {isCurrent && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="pulse-dot"
                      style={{
                        animationDelay: `${i * 0.2}s`,
                        background: step.color,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Isso pode levar de 15 a 60 segundos dependendo do modelo e tamanho do currículo
      </p>
    </div>
  );
};
