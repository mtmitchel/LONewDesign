import type { ProviderId } from '../../../modules/settings/state/providerSettings';

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  hint: string;
  base: string;
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    hint: 'GPT-4o, o-series, and TTS models. Base URL is optional for proxies.',
    base: 'https://api.openai.com/v1',
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    hint: 'Claude 3 models with long context windows for reasoning and writing.',
    base: 'https://api.anthropic.com/v1',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    hint: 'Unified marketplace routing across 80+ providers with fallback logic.',
    base: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    hint: 'High-context reasoning models built for code and analysis workloads.',
    base: 'https://api.deepseek.com/v1',
  },
  {
    id: 'mistral',
    label: 'Mistral AI',
    hint: 'Fast, lightweight instruction-tuned models ideal for realtime UX.',
    base: 'https://api.mistral.ai/v1',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    hint: 'Google’s Gemini models via the Generative Language API.',
    base: 'https://generativelanguage.googleapis.com/v1beta',
  },
  {
    id: 'deepl',
    label: 'DeepL',
    hint: 'Professional translation API with native formality support. Use https://api-free.deepl.com for Free plan.',
    base: 'https://api-free.deepl.com',
  },
  {
    id: 'glm',
    label: 'GLM (ZhipuAI)',
    hint: 'GLM-4.6 model with 200K context window. OpenAI-compatible API for chat, coding, and reasoning tasks.',
    base: 'https://api.z.ai/api/paas/v4',
  },
];

export const API_KEY_PATTERNS: Partial<Record<Exclude<ProviderId, 'local'>, RegExp>> = {
  openai: /^sk-[a-z0-9]{8,}/i,
  openrouter: /^sk-or-[a-z0-9-]{8,}/i,
  mistral: /^mistral-[a-z0-9-]{8,}/i,
  anthropic: /^(sk-ant-|api_)/i,
  deepseek: /^sk-[a-z0-9-]{8,}/i,
  deepl: /^(auth-|deepl-)/i,
  glm: /^[a-z0-9-]{16,}$/i,
};
