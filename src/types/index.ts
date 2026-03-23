export type AIProvider = 'openai' | 'gemini' | 'openrouter';

export interface APIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string; // used in openrouter
}

export interface GapKeyword {
  keyword: string;
  status: 'matched' | 'missing' | 'partial';
  suggestion?: string;
}

export interface ChangeItem {
  section: string;
  original: string;
  optimized: string;
  reason: string;
}

export interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  producer: string;
  creator: string;
}

export interface GapAnalysis {
  matchScore: number;
  jobTitle: string;
  candidateName: string;
  totalKeywords: number;
  matchedKeywords: number;
  missingKeywords: number;
  keywords: GapKeyword[];
  changes: ChangeItem[];
  summary: string;
  optimizedResumeText: string;
  pdfMetadata: PDFMetadata;
}

export type AppStep = 'input' | 'processing' | 'result';

export interface ProcessingStatus {
  step: 'extracting' | 'analyzing' | 'optimizing' | 'generating';
  message: string;
  progress: number;
}
