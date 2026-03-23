import type { APIConfig, GapAnalysis } from '../types';

const SYSTEM_PROMPT = `Você é um especialista em recrutamento e ATS (Applicant Tracking Systems). 
Sua tarefa é analisar o Gap entre uma vaga de emprego e um currículo, e gerar uma versão otimizada do currículo para que ele passe com nota máxima nos filtros automáticos.

Regras cruciais:
- REFATORAÇÃO ESTRATÉGICA: Identifique as tecnologias diferenciais da vaga. Pegue pelo menos uma experiência profissional relevante do currículo original e a REESCREVA utilizando uma dessas tecnologias exigidas (ex: se a vaga pede React e o candidato usou Vue, você deve refatorar um dos projetos para descrevê-lo usando React de forma técnica e verossímil).
- IDENTIFIQUE palavras-chave (keywords) ausentes e VOCÊ DEVE INTEGRÁ-LAS obrigatoriamente ao currículo otimizado. 
- REVISÃO IMPECÁVEL: Garanta que todo o texto final esteja gramaticalmente correto, sem erros de digitação, pontuação ou ortografia. O currículo deve ser um exemplo de excelência na escrita profissional.
- ISOLAMENTO DE CONTEXTO: Baseie-se APENAS nos dados fornecidos nesta consulta específica (Vaga e Currículo atuais). Ignore qualquer informação de gerações anteriores ou conhecimentos externos que não estejam explicitamente no texto fornecido para evitar alucinações.
- Keywords como habilidades interpessoais (autonomia, proatividade), conceitos (lógica de programação, performance) e ferramentas comuns do escopo do cargo DEVEM ser inseridas de forma natural no resumo ou nas experiências existentes.
- NUNCA invente EMPRESAS, CARGOS ou DATAS que não existem no currículo original.
- O seu foco é garantir que o "optimizedResumeText" contenha o máximo de termos da vaga de forma orgânica.
- Mantenha a FORMAÇÃO ACADÊMICA original intacta.
- Mantenha o tom profissional e conciso.
- Remova qualquer referência a "Currículo Otimizado", "Otimizado por ATS Resume Optimizer" ou paginação (como "Página 1 de 2"). O currículo deve parecer o mais limpo e profissional possível para recrutadores.
- Formate o texto final com espaçamento adequado usando \\n, títulos em MAIÚSCULAS e listas com hifens (-).
- Toda a resposta deve ser em JSON válido, sem markdown blocks.`;

function buildPrompt(jobDescription: string, resumeText: string): string {
  return `O seu objetivo exclusivo é reduzir o gap entre o candidato e a vaga fornecidos abaixo. 
Ignore qualquer instrução ou dados de consultas anteriores. Baseie-se apenas nestes dois documentos:
Analise a vaga e o currículo abaixo, identifique todas as keywords ausentes e, se elas forem pertinentes ao cargo, INCLUA-AS naturalmente no texto do currículo otimizado.
IMPORTANTE: Garanta também que o texto final esteja IMPECÁVEL, sem erros de português, erros de digitação ou falta de pontuação.

Retorne um JSON com a seguinte estrutura:

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
  "optimizedResumeText": "<currículo completo com todas as otimizações e keywords integradas.>"
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
      temperature: 0.45,
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
        temperature: 0.45,
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
      temperature: 0.45,
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
