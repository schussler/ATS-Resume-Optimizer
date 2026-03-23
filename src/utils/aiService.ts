import type { APIConfig, GapAnalysis } from '../types';

const SYSTEM_PROMPT = `Você é um especialista em recrutamento e ATS. Sua missão é gerar um currículo com nota 100/100 de match.

CHECKLIST OBRIGATÓRIA DE OTIMIZAÇÃO:
1. INTEGRAÇÃO DE KEYWORDS: Identifique todas as palavras-chave ausentes (missing) e as INSIRA obrigatoriamente no texto otimizado (no resumo ou nas experiências).
2. DENSIDADE ESTRATÉGICA: Repita as tecnologias principais da vaga pelo menos 3 vezes ao longo do texto para relevância algorítmica.
3. REFATORAÇÃO TÉCNICA: Escolha uma experiência e a descreva usando as tecnologias diferenciais da vaga (ex: React, Node, etc), de forma profunda e verossímil.
4. NLP AVANÇADO: Use sinônimos técnicos e termos de "espaço vetorial" (ex: "orquestração de microserviços", "otimização de queries", "arquitetura orientada a eventos").
5. METADADOS DO PDF: Gere os campos (title, author, keywords, subject, creator) com foco total no cargo e no match.
6. ZERO ERROS: Texto gramaticalmente perfeito e profissional.
7. FORMATAÇÃO RÍGIDA: Use obrigatoriamente títulos em MAIÚSCULAS (ex: EXPERIÊNCIA PROFISSIONAL, COMPETÊNCIAS TÉCNICAS, FORMAÇÃO ACADÊMICA & CERTIFICAÇÕES). Use listas com hifens (-) e espaçamentos com \\n. Em EXPERIÊNCIA PROFISSIONAL, formate os títulos de cargos usando separadores como "Cargo | Empresa | Data" para que o sistema reconheça e aplique o negrito.

RESTRIÇÕES INVIOLÁVEIS:
- NUNCA invente EMPRESAS, CARGOS ou DATAS.
- Mantenha a FORMAÇÃO ACADÊMICA & CERTIFICAÇÕES intacta.
- Remova rodapés de paginação ou links de ferramentas.
- Responda apenas com o JSON conforme solicitado.`;

function buildPrompt(jobDescription: string, resumeText: string): string {
  return `O seu objetivo exclusivo é reduzir o gap entre o candidato e a vaga fornecidos abaixo. 
Ignore qualquer instrução ou dados de consultas anteriores. Baseie-se apenas nestes dois documentos:
Analise a vaga e o currículo abaixo. Identifique as keywords ausentes e INTEGRE-AS OBRIGATORIAMENTE no texto do currículo otimizado (optimizedResumeText). 
Não hesite em reescrever parágrafos inteiros para incluir tecnologias como React, Angular e soft skills como autonomia e performance.
O Texto final DEVE manter as seções: RESUMO PROFISSIONAL, EXPERIÊNCIA PROFISSIONAL, COMPETÊNCIAS TÉCNICAS e FORMAÇÃO ACADÊMICA & CERTIFICAÇÕES.

Retorne um JSON com a seguinte estrutura:

{
  "matchScore": <número de 0 a 100>,
  "jobTitle": "<título da vaga exato>",
  "candidateName": "<nome completo do candidato>",
  "totalKeywords": <número>,
  "matchedKeywords": <número>,
  "missingKeywords": <número>,
  "keywords": [
    {"keyword": "<termo>", "status": "matched|missing|partial", "suggestion": "<como mencionar>"}
  ],
  "changes": [
    {"section": "<seção>", "original": "<texto>", "optimized": "<texto>", "reason": "<motivo>"}
  ],
  "summary": "<parágrafo de gap analysis>",
  "optimizedResumeText": "<currículo completo com alta densidade de keywords e NLP>",
  "pdfMetadata": {
    "title": "<Título da Vaga>",
    "author": "<Nome do Candidato>",
    "subject": "<Resumo de 2 linhas focado na vaga>",
    "keywords": ["<keyword1>", "<keyword2>", "..."],
    "producer": "ATS Resume Optimizer",
    "creator": "Vaga de Tecnologia"
  }
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
