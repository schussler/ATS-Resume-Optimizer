import React, { useState } from 'react';
import type { APIConfig, GapAnalysis, ProcessingStatus } from './types';
import { loadConfig } from './utils/storage';
import { extractTextFromPDF } from './utils/pdfExtract';
import { analyzeAndOptimize } from './utils/aiService';
import { SettingsPanel } from './components/SettingsPanel';
import { UploadZone } from './components/UploadZone';
import { ProcessingView } from './components/ProcessingView';
import { ResultsView } from './components/ResultsView';
import { Sparkles, FileText, BriefcaseBusiness, ArrowRight, AlertTriangle } from 'lucide-react';

type Step = 'input' | 'processing' | 'result';

const STEP_LABELS = [
  { id: 'input', label: '1. Inputs' },
  { id: 'processing', label: '2. Processando' },
  { id: 'result', label: '3. Resultado' },
];

function App() {
  const [config, setConfig] = useState<APIConfig>(loadConfig);
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>('input');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    step: 'extracting',
    message: 'Iniciando...',
    progress: 0,
  });
  const [analysis, setAnalysis] = useState<GapAnalysis | null>(null);
  const [error, setError] = useState('');

  const canAnalyze = jobDescription.trim().length > 50 && resumeFile !== null && config.apiKey.trim().length > 0;

  const handleAnalyze = async () => {
    setError('');
    setStep('processing');

    try {
      // Step 1: Extract text from PDF
      setProcessingStatus({ step: 'extracting', message: 'Extraindo texto do PDF...', progress: 10 });
      const resumeText = await extractTextFromPDF(resumeFile!);

      if (!resumeText.trim()) {
        throw new Error('Não foi possível extrair texto do PDF. O arquivo pode ser uma imagem escaneada.');
      }

      // Step 2: AI analysis
      setProcessingStatus({ step: 'analyzing', message: 'Enviando para análise da IA...', progress: 30 });

      const result = await analyzeAndOptimize(
        config,
        jobDescription,
        resumeText,
        (message, progress) => {
          const stepKey =
            progress <= 30 ? 'analyzing' : progress <= 70 ? 'optimizing' : 'generating';
          setProcessingStatus({ step: stepKey as ProcessingStatus['step'], message, progress });
        },
      );

      setProcessingStatus({ step: 'generating', message: 'Finalizando...', progress: 95 });

      await new Promise((r) => setTimeout(r, 500));

      setAnalysis(result);
      setStep('result');
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      setStep('input');
    }
  };

  const handleReset = () => {
    setStep('input');
    setAnalysis(null);
    setError('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'rgba(10,13,20,0.8)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f8ef7 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(79,142,247,0.4)',
              }}
            >
              <Sparkles size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1 }}>
                ATS Resume Optimizer
              </h1>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Powered by AI
              </p>
            </div>
          </div>

          {/* Step indicator (desktop) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {STEP_LABELS.map((s, idx) => {
              const current = step === s.id;
              const done =
                (s.id === 'input' && (step === 'processing' || step === 'result')) ||
                (s.id === 'processing' && step === 'result');
              return (
                <React.Fragment key={s.id}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: current
                        ? 'var(--accent-glow)'
                        : done
                        ? 'var(--success-bg)'
                        : 'transparent',
                      border: `1px solid ${current ? 'var(--accent)' : done ? 'var(--success)' : 'var(--border)'}`,
                      fontSize: '0.75rem',
                      fontWeight: current ? 700 : 500,
                      color: current ? 'var(--accent-light)' : done ? 'var(--success)' : 'var(--text-muted)',
                      transition: 'all 0.3s',
                    }}
                  >
                    {done ? '✓ ' : ''}{s.label}
                  </div>
                  {idx < STEP_LABELS.length - 1 && (
                    <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <SettingsPanel config={config} onConfigChange={setConfig} />
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, maxWidth: '900px', margin: '0 auto', width: '100%', padding: '32px 24px' }}>
        {step === 'input' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Error */}
            {error && (
              <div
                style={{
                  background: 'var(--error-bg)',
                  border: '1px solid var(--error)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                <AlertTriangle size={18} style={{ color: 'var(--error)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--error)', marginBottom: '4px' }}>Erro ao processar</p>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{error}</p>
                </div>
              </div>
            )}

            {/* No API key warning */}


            {!config.apiKey && (
              <div
                style={{
                  background: 'var(--warning-bg)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  fontSize: '0.88rem',
                  color: 'var(--warning)',
                }}
              >
                <AlertTriangle size={16} />
                Configure sua API Key em <strong>Configurações</strong> antes de continuar.
              </div>
            )}

            {/* Job description */}
            <div className="glass-card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'var(--accent-glow)', border: '1px solid var(--border-strong)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <BriefcaseBusiness size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Descrição da Vaga</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Cole o texto completo da vaga de emprego
                  </p>
                </div>
              </div>

              <label className="field-label" htmlFor="job-description">
                Texto da vaga
              </label>
              <textarea
                id="job-description"
                className="input-field"
                placeholder="Cole aqui a descrição completa da vaga de emprego — quanto mais detalhada, melhor será a análise..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                style={{ padding: '14px', minHeight: '220px' }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>{jobDescription.length} caracteres</span>
                {jobDescription.length < 50 && jobDescription.length > 0 && (
                  <span style={{ color: 'var(--warning)' }}>Adicione mais detalhes da vaga</span>
                )}
              </div>
            </div>

            {/* PDF Upload */}
            <div className="glass-card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <FileText size={18} style={{ color: '#8b5cf6' }} />
                </div>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Seu Currículo</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Faça upload em formato PDF com texto selecionável
                  </p>
                </div>
              </div>

              <UploadZone file={resumeFile} onFileChange={setResumeFile} />
            </div>

            {/* Analyze button */}
            <button
              id="analyze-btn"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1.05rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <Sparkles size={20} />
              Analisar e Otimizar Currículo
            </button>

            {!canAnalyze && (
              <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {!config.apiKey
                  ? '⚙️ Configure a API Key primeiro'
                  : !resumeFile
                  ? '📎 Faça upload do seu currículo em PDF'
                  : jobDescription.trim().length < 50
                  ? '📋 Cole a descrição completa da vaga'
                  : ''}
              </p>
            )}
          </div>
        )}

        {step === 'processing' && <ProcessingView status={processingStatus} />}

        {step === 'result' && analysis && (
          <ResultsView analysis={analysis} onReset={handleReset} />
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '28px 24px',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <p style={{ maxWidth: '600px', lineHeight: 1.5 }}>
          ATS Resume Optimizer — Todo o processamento de IA ocorre diretamente no seu navegador. 
          Suas chaves de API e arquivos nunca saem da sua máquina.
        </p>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginTop: '4px',
          background: 'rgba(255,255,255,0.03)',
          padding: '8px 16px',
          borderRadius: '100px',
          border: '1px solid var(--border)',
        }}>
          <span>Contribua com o projeto:</span>
          <a
            href="https://github.com/schussler/ATS-Resume-Optimizer"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--accent-light)',
              textDecoration: 'none',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            github.com/schussler/ATS-Resume-Optimizer
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
