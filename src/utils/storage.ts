import type { APIConfig, AIProvider } from '../types';

const STORAGE_KEY = 'ats_optimizer_config';

const DEFAULT_CONFIG: APIConfig = {
  provider: 'openai',
  apiKey: '',
  model: 'openai/gpt-4o',
};

export function loadConfig(): APIConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_CONFIG };
}

export function saveConfig(config: APIConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function getProviderLabel(provider: AIProvider): string {
  const labels: Record<AIProvider, string> = {
    openai: 'OpenAI',
    gemini: 'Google Gemini',
    openrouter: 'OpenRouter',
  };
  return labels[provider];
}

export function getDefaultModel(provider: AIProvider): string {
  const models: Record<AIProvider, string> = {
    openai: 'gpt-4o',
    gemini: 'gemini-2.0-flash',
    openrouter: 'openai/gpt-4o',
  };
  return models[provider];
}
