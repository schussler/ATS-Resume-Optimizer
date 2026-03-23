import type { APIConfig, GapAnalysis } from '../types';

const SYSTEM_PROMPT = `Você é um especialista em recrutamento e ATS (Applicant Tracking Systems). 
Sua tarefa é analisar o Gap entre uma vaga de emprego e um currículo, e gerar uma versão otimizada do currículo.

Regras cruciais:
- NUNCA invente experiências, empresas, cargos ou datas que não existem no currículo original.
- Apenas ajuste a LINGUAGEM e ÊNFASE para alinhar com os termos e palavras-chave da vaga.
- Substitua termos genéricos por termos específicos QUANDO o candidato realmente possui aquela habilidade.
- Mantenha o tom profissional e conciso.
- Remova qualquer referência a "Currículo Otimizado", "Otimizado por ATS Resume Optimizer" ou paginação (como "Página 1 de 2"). O currículo deve parecer o mais limpo e profissional possível para recrutadores.
- Formate o texto final com espaçamento adequado usando \\n, títulos em MAIÚSCULAS e listas com hifens (-).
- Toda a resposta deve ser em JSON válido, sem markdown blocks.`;

function buildPrompt(jobDescription: string, resumeText: string): string {
  return `Analise a vaga e o currículo abaixo, e retorne um JSON com a seguinte estrutura:

{
  "matchScore": <número de 0 a 100>,
  "jobTitle": "<título da vaga identificado>",
  "totalKeywords": <número total de palavras-chave identificadas na vaga>,
  "matchedKeywords": <número de keywords presentes no currículo>,
  "missingKeywords": <número de keywords ausentes>,
  "keywords": [
    {"keyword": "<termo>", "status": "matched|missing|partial", "suggestion": "<como mencionar, se aplicável>"}
  ],
  "changes": [
    {"section": "<seção do currículo>", "original": "<texto original>", "optimized": "<texto otimizado>", "reason": "<motivo>"}
  ],
  "summary": "<parágrafo resumindo o gap analysis e as principais otimizações>",
  "optimizedResumeText": "<texto completo do currículo otimizado. OBRIGATÓRIO: Use quebras de linha (\\\\n) para separar parágrafos e seções. Use letras MAIÚSCULAS para títulos de seções (ex: EXPERIÊNCIA PROFISSIONAL). Use marcadores (-) para listas.>"
}

=== DESCRIÇÃO DA VAGA ===
${jobDescription}

=== CURRÍCULO ATUAL ===
${resumeText}

Responda APENAS com o JSON, sem markdown, sem comentários.`;
}

async function callOpenAI(config: APIConfig, prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI error ${response.status}: ${(err as { error?: { message?: string } }).error?.message || response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0].message.content;
}

async function callGemini(config: APIConfig, prompt: string): Promise<string> {
  const model = config.model || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        response_mime_type: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Gemini error ${response.status}: ${JSON.stringify(err)}`,
    );
  }

  const data = (await response.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return data.candidates[0].content.parts[0].text;
}

async function callOpenRouter(config: APIConfig, prompt: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'ATS Resume Optimizer',
    },
    body: JSON.stringify({
      model: config.model || 'openai/gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `OpenRouter error ${response.status}: ${JSON.stringify(err)}`,
    );
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0].message.content;
}

export async function analyzeAndOptimize(
  config: APIConfig,
  jobDescription: string,
  resumeText: string,
  onProgress?: (step: string, progress: number) => void,
): Promise<GapAnalysis> {
  onProgress?.('Preparando análise...', 10);

  const prompt = buildPrompt(jobDescription, resumeText);

  onProgress?.('Enviando para a IA...', 30);

  let rawText: string;

  switch (config.provider) {
    case 'openai':
      rawText = await callOpenAI(config, prompt);
      break;
    case 'gemini':
      rawText = await callGemini(config, prompt);
      break;
    case 'openrouter':
      rawText = await callOpenRouter(config, prompt);
      break;
    default:
      throw new Error('Provedor de IA não suportado');
  }

  onProgress?.('Processando resultado...', 80);

  // Parse JSON (strip markdown code blocks if present)
  const cleaned = rawText
    .replace(/^```(?:json)?/m, '')
    .replace(/```$/m, '')
    .trim();

  const result = JSON.parse(cleaned) as GapAnalysis;

  onProgress?.('Concluído!', 100);

  return result;
}
