import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X, Eye, EyeOff, Info } from 'lucide-react';
import type { APIConfig, AIProvider } from '../types';
import { saveConfig, getDefaultModel, getProviderLabel } from '../utils/storage';

interface SettingsPanelProps {
  config: APIConfig;
  onConfigChange: (c: APIConfig) => void;
}

const PROVIDERS: AIProvider[] = ['openai', 'gemini', 'openrouter'];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onConfigChange }) => {
  const [open, setOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [local, setLocal] = useState<APIConfig>(config);

  const update = (patch: Partial<APIConfig>) => {
    const next = { ...local, ...patch };
    // Reset model when provider changes
    if (patch.provider && patch.provider !== local.provider) {
      next.model = getDefaultModel(patch.provider);
    }
    setLocal(next);
  };

  const handleSave = () => {
    saveConfig(local);
    onConfigChange(local);
    setOpen(false);
  };

  const handleOpen = () => {
    setLocal(config);
    setShowKey(false);
    setOpen(true);
  };

  const isConfigured = config.apiKey.trim().length > 0;

  return (
    <>
      {/* Trigger button */}
      <button
        id="settings-btn"
        onClick={handleOpen}
        className="btn-secondary flex items-center gap-2"
        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
      >
        <Settings size={15} />
        Configurações
        {isConfigured && (
          <span className="badge badge-success" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
            ✓ {getProviderLabel(config.provider)}
          </span>
        )}
        {!isConfigured && (
          <span className="badge badge-warning" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
            ! Sem API Key
          </span>
        )}
      </button>

      {/* Modal overlay */}
      {open && typeof document !== 'undefined' && document.body && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            className="glass-card fade-in"
            style={{ width: '100%', maxWidth: '500px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Configurações de API
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Suas chaves ficam apenas no seu navegador (localStorage)
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Provider selector */}
            <div style={{ marginBottom: '20px' }}>
              <label className="field-label">Provedor de IA</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {PROVIDERS.map((p) => (
                  <button
                    key={p}
                    onClick={() => update({ provider: p })}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: '10px',
                      border: `1px solid ${local.provider === p ? 'var(--accent)' : 'var(--border)'}`,
                      background: local.provider === p ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                      color: local.provider === p ? 'var(--accent-light)' : 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {getProviderLabel(p)}
                  </button>
                ))}
              </div>
            </div>

            {/* API Key */}
            <div style={{ marginBottom: '20px' }}>
              <label className="field-label">
                API Key
                {local.provider === 'openai' && ' (OpenAI)'}
                {local.provider === 'gemini' && ' (Google AI Studio)'}
                {local.provider === 'openrouter' && ' (OpenRouter)'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="api-key-input"
                  type={showKey ? 'text' : 'password'}
                  className="input-field"
                  placeholder="sk-..."
                  value={local.apiKey}
                  onChange={(e) => update({ apiKey: e.target.value })}
                  style={{ padding: '10px 40px 10px 12px' }}
                />
                <button
                  onClick={() => setShowKey((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Model field (OpenRouter only) */}
            {local.provider === 'openrouter' && (
              <div style={{ marginBottom: '20px' }}>
                <label className="field-label">Nome do Modelo</label>
                <input
                  id="model-input"
                  type="text"
                  className="input-field"
                  placeholder="ex: openai/gpt-4o, anthropic/claude-3.5-sonnet"
                  value={local.model}
                  onChange={(e) => update({ model: e.target.value })}
                  style={{ padding: '10px 12px' }}
                />
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Consulte os modelos disponíveis em openrouter.ai/models
                </p>
              </div>
            )}

            {/* Gemini model */}
            {local.provider === 'gemini' && (
              <div style={{ marginBottom: '20px' }}>
                <label className="field-label">Modelo Gemini</label>
                <select
                  className="input-field"
                  value={local.model}
                  onChange={(e) => update({ model: e.target.value })}
                  style={{ padding: '10px 12px' }}
                >
                  <option value="gemini-2.0-flash">gemini-2.0-flash (recomendado)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                </select>
              </div>
            )}

            {/* OpenAI model */}
            {local.provider === 'openai' && (
              <div style={{ marginBottom: '20px' }}>
                <label className="field-label">Modelo OpenAI</label>
                <select
                  className="input-field"
                  value={local.model}
                  onChange={(e) => update({ model: e.target.value })}
                  style={{ padding: '10px 12px' }}
                >
                  <option value="gpt-4o">GPT-4o (recomendado)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>
            )}

            {/* Info notice */}
            <div
              style={{
                background: 'rgba(79,142,247,0.08)',
                border: '1px solid rgba(79,142,247,0.2)',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '24px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}
            >
              <Info size={14} style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }} />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Sua API Key é enviada <strong>diretamente</strong> ao provedor escolhido e nunca passa por nenhum servidor nosso. Você é responsável pela segurança e pelos custos de uso.
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setOpen(false)}
                className="btn-secondary"
                style={{ padding: '10px 20px', fontSize: '0.9rem' }}
              >
                Cancelar
              </button>
              <button
                id="save-settings-btn"
                onClick={handleSave}
                className="btn-primary"
                style={{ padding: '10px 24px', fontSize: '0.9rem' }}
              >
                Salvar configurações
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
