/**
 * Metadata about Mistral AI models
 * Based on Mistral pricing as of October 2025
 * Source: Perplexity research (verified October 10, 2025)
 * Note: Pricing tiers may change - verify at https://mistral.ai/pricing
 */

export interface MistralModelMetadata {
  id: string;
  displayName: string;
  tier: 'free' | 'premier';
  description?: string;
  license?: 'Apache 2.0' | 'Mistral Research License' | 'Proprietary';
}

/**
 * Known Mistral models with their tiers
 * Based on Mistral's official categorization:
 * 
 * Open Models (Free):
 * - Apache 2.0 license, open-weight
 * - Completely free to use, self-host, and commercialize
 * 
 * Premier Models (Paid):
 * - Proprietary, API-only access
 * - Some use "Mistral Research License" (research/non-commercial use of weights)
 * - Pricing varies by model - see https://mistral.ai/pricing
 */
const KNOWN_MODEL_METADATA: Record<string, MistralModelMetadata> = {
  // ===== OPEN-WEIGHT/OPEN-SOURCE MODELS (Completely Free) =====
  'mistral-7b': {
    id: 'mistral-7b',
    displayName: 'Mistral 7B',
    tier: 'free',
    description: 'Open-weight foundational model, Apache 2.0',
  },
  'open-mistral-7b': {
    id: 'open-mistral-7b',
    displayName: 'Open Mistral 7B',
    tier: 'free',
    description: 'Open-weight model, free to use',
  },
  'mistral-7b-instruct': {
    id: 'mistral-7b-instruct',
    displayName: 'Mistral 7B Instruct',
    tier: 'free',
    description: 'Instruction-tuned, open-weight',
  },
  'mixtral-8x7b': {
    id: 'mixtral-8x7b',
    displayName: 'Mixtral 8x7B',
    tier: 'free',
    description: 'Sparse MoE, open-weight, Apache 2.0',
  },
  'open-mixtral-8x7b': {
    id: 'open-mixtral-8x7b',
    displayName: 'Open Mixtral 8x7B',
    tier: 'free',
    description: 'Mixture of experts, open-weight',
  },
  'open-mixtral-8x22b': {
    id: 'open-mixtral-8x22b',
    displayName: 'Open Mixtral 8x22B',
    tier: 'free',
    description: 'Large mixture of experts, open-weight',
  },
  'devstral': {
    id: 'devstral',
    displayName: 'Devstral',
    tier: 'free',
    description: 'Coding assistant, open-weight, Apache 2.0',
  },
  'codestral': {
    id: 'codestral',
    displayName: 'Codestral',
    tier: 'free',
    description: 'Code generation, open-weight, Apache 2.0',
  },
  'magistral-small-2509': {
    id: 'magistral-small-2509',
    displayName: 'Magistral Small 1.2',
    tier: 'free',
    description: 'Reasoning model with vision, Apache 2.0',
  },
  'voxtral-small-2507': {
    id: 'voxtral-small-2507',
    displayName: 'Voxtral Small',
    tier: 'free',
    description: 'Audio input capabilities, Apache 2.0',
  },
  'voxtral-mini-2507': {
    id: 'voxtral-mini-2507',
    displayName: 'Voxtral Mini',
    tier: 'free',
    description: 'Mini audio input model, Apache 2.0',
  },
  'mistral-small-2506': {
    id: 'mistral-small-2506',
    displayName: 'Mistral Small 3.2',
    tier: 'free',
    description: 'Open-weight small model, Apache 2.0',
  },
  'devstral-small-2507': {
    id: 'devstral-small-2507',
    displayName: 'Devstral Small 1.1',
    tier: 'free',
    description: 'Code tools & agents, Apache 2.0',
  },
  'mistral-small-2503': {
    id: 'mistral-small-2503',
    displayName: 'Mistral Small 3.1',
    tier: 'free',
    description: 'Image understanding, Apache 2.0',
  },
  'mistral-small-2501': {
    id: 'mistral-small-2501',
    displayName: 'Mistral Small 3',
    tier: 'free',
    description: 'Open-weight small model, Apache 2.0',
  },
  'pixtral-12b-2409': {
    id: 'pixtral-12b-2409',
    displayName: 'Pixtral 12B',
    tier: 'free',
    description: 'Vision + text, Apache 2.0',
  },
  'open-mistral-nemo': {
    id: 'open-mistral-nemo',
    displayName: 'Mistral Nemo 12B',
    tier: 'free',
    description: 'Multilingual, Apache 2.0',
  },
  'mistral-nemo-12b': {
    id: 'mistral-nemo-12b',
    displayName: 'Mistral Nemo 12B',
    tier: 'free',
    description: 'Multilingual, Apache 2.0',
  },
  
  // ===== PREMIER MODELS (Proprietary, Paid API) =====
  // Frontier & Flagship Models
  'mistral-medium-2508': {
    id: 'mistral-medium-2508',
    displayName: 'Mistral Medium 3.1',
    tier: 'premier',
    description: 'Frontier multimodal, improved tone',
    license: 'Proprietary',
  },
  'mistral-medium-2505': {
    id: 'mistral-medium-2505',
    displayName: 'Mistral Medium 3',
    tier: 'premier',
    description: 'Frontier multimodal model',
    license: 'Proprietary',
  },
  'mistral-medium-latest': {
    id: 'mistral-medium-latest',
    displayName: 'Mistral Medium (Latest)',
    tier: 'premier',
    description: 'Points to mistral-medium-2508',
    license: 'Proprietary',
  },
  'magistral-medium-2509': {
    id: 'magistral-medium-2509',
    displayName: 'Magistral Medium 1.2',
    tier: 'premier',
    description: 'Frontier reasoning with vision',
    license: 'Proprietary',
  },
  'magistral-medium-latest': {
    id: 'magistral-medium-latest',
    displayName: 'Magistral Medium (Latest)',
    tier: 'premier',
    description: 'Points to magistral-medium-2509',
    license: 'Proprietary',
  },
  'mistral-large-2411': {
    id: 'mistral-large-2411',
    displayName: 'Mistral Large 2.1',
    tier: 'premier',
    description: 'Top-tier for high-complexity tasks',
    license: 'Mistral Research License',
  },
  'mistral-large-latest': {
    id: 'mistral-large-latest',
    displayName: 'Mistral Large (Latest)',
    tier: 'premier',
    description: 'Now points to mistral-medium-2508',
    license: 'Proprietary',
  },
  'pixtral-large-2411': {
    id: 'pixtral-large-2411',
    displayName: 'Pixtral Large',
    tier: 'premier',
    description: 'Frontier multimodal (vision)',
    license: 'Mistral Research License',
  },
  'pixtral-large-latest': {
    id: 'pixtral-large-latest',
    displayName: 'Pixtral Large (Latest)',
    tier: 'premier',
    description: 'Points to pixtral-large-2411',
    license: 'Mistral Research License',
  },
  
  // Code-Specialized Premier Models
  'codestral-2508': {
    id: 'codestral-2508',
    displayName: 'Codestral 2508 (Premier)',
    tier: 'premier',
    description: 'FIM, code correction, test gen',
    license: 'Proprietary',
  },
  'codestral-2501': {
    id: 'codestral-2501',
    displayName: 'Codestral 2501',
    tier: 'premier',
    description: 'Code model (Jan 2025)',
    license: 'Proprietary',
  },
  'codestral-latest': {
    id: 'codestral-latest',
    displayName: 'Codestral (Latest)',
    tier: 'premier',
    description: 'Points to codestral-2508',
    license: 'Proprietary',
  },
  'devstral-medium-2507': {
    id: 'devstral-medium-2507',
    displayName: 'Devstral Medium',
    tier: 'premier',
    description: 'Enterprise code agent',
    license: 'Proprietary',
  },
  'devstral-medium-latest': {
    id: 'devstral-medium-latest',
    displayName: 'Devstral Medium (Latest)',
    tier: 'premier',
    description: 'Points to devstral-medium-2507',
    license: 'Proprietary',
  },
  
  // Small & Edge Premier Models
  'mistral-small-2407': {
    id: 'mistral-small-2407',
    displayName: 'Mistral Small 2',
    tier: 'premier',
    description: 'Updated small model',
    license: 'Mistral Research License',
  },
  'mistral-small-latest': {
    id: 'mistral-small-latest',
    displayName: 'Mistral Small (Latest)',
    tier: 'premier',
    description: 'Points to mistral-small-2506',
    license: 'Apache 2.0',
  },
  'ministral-3b-2410': {
    id: 'ministral-3b-2410',
    displayName: 'Ministral 3B',
    tier: 'premier',
    description: "World's best edge model",
    license: 'Proprietary',
  },
  'ministral-3b-latest': {
    id: 'ministral-3b-latest',
    displayName: 'Ministral 3B (Latest)',
    tier: 'premier',
    description: 'Points to ministral-3b-2410',
    license: 'Proprietary',
  },
  'ministral-8b-2410': {
    id: 'ministral-8b-2410',
    displayName: 'Ministral 8B',
    tier: 'premier',
    description: 'High performance/price edge model',
    license: 'Mistral Research License',
  },
  'ministral-8b-latest': {
    id: 'ministral-8b-latest',
    displayName: 'Ministral 8B (Latest)',
    tier: 'premier',
    description: 'Points to ministral-8b-2410',
    license: 'Mistral Research License',
  },
  
  // Specialized Premier Models
  'voxtral-mini-transcribe': {
    id: 'voxtral-mini-transcribe',
    displayName: 'Voxtral Mini Transcribe',
    tier: 'premier',
    description: 'Audio transcription only',
    license: 'Proprietary',
  },
  'mistral-ocr-2505': {
    id: 'mistral-ocr-2505',
    displayName: 'Mistral OCR',
    tier: 'premier',
    description: 'Document AI / OCR service',
    license: 'Proprietary',
  },
  'mistral-ocr-latest': {
    id: 'mistral-ocr-latest',
    displayName: 'Mistral OCR (Latest)',
    tier: 'premier',
    description: 'Points to mistral-ocr-2505',
    license: 'Proprietary',
  },
  'mistral-embed': {
    id: 'mistral-embed',
    displayName: 'Mistral Embed',
    tier: 'premier',
    description: 'Text embeddings',
    license: 'Proprietary',
  },
  'codestral-embed': {
    id: 'codestral-embed',
    displayName: 'Codestral Embed',
    tier: 'premier',
    description: 'Code embeddings',
    license: 'Proprietary',
  },
  'mistral-moderation-2411': {
    id: 'mistral-moderation-2411',
    displayName: 'Mistral Moderation',
    tier: 'premier',
    description: 'Harmful content detection',
    license: 'Proprietary',
  },
  'mistral-moderation-latest': {
    id: 'mistral-moderation-latest',
    displayName: 'Mistral Moderation (Latest)',
    tier: 'premier',
    description: 'Points to mistral-moderation-2411',
    license: 'Proprietary',
  },
};

/**
 * Get metadata for a model, with fallback to inferred tier
 */
export function getModelMetadata(modelId: string): MistralModelMetadata {
  // Return known metadata if available
  if (KNOWN_MODEL_METADATA[modelId]) {
    return KNOWN_MODEL_METADATA[modelId];
  }
  
  // Infer tier from model ID patterns
  // Open models: start with 'open-', end with date codes, or explicitly free versions
  const isOpenModel = 
    modelId.startsWith('open-') ||
    modelId.includes('-250') || // 2025 dated versions
    modelId.includes('-240') || // 2024 dated versions  
    modelId.match(/mistral-small-\d{4}/) ||
    modelId.match(/pixtral-12b/) ||
    modelId.includes('magistral-small') ||
    modelId.includes('devstral-small') ||
    modelId.includes('voxtral') && !modelId.includes('transcribe') ||
    modelId.includes('codestral-') && modelId.match(/\d{4}/);
  
  return {
    id: modelId,
    displayName: formatModelName(modelId),
    tier: isOpenModel ? 'free' : 'premier',
    description: undefined,
    license: isOpenModel ? 'Apache 2.0' : 'Proprietary',
  };
}

/**
 * Format model ID into a readable display name
 */
function formatModelName(modelId: string): string {
  return modelId
    .replace('mistral-', 'Mistral ')
    .replace('open-', 'Open ')
    .replace('mixtral-', 'Mixtral ')
    .replace('codestral-', 'Codestral ')
    .replace('pixtral-', 'Pixtral ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace('Latest', '(Latest)')
    .replace(/(\d{4})/, '($1)');
}

/**
 * Check if a model is in the free tier
 */
export function isModelFree(modelId: string): boolean {
  const metadata = getModelMetadata(modelId);
  return metadata.tier === 'free';
}

/**
 * Get a display label for the model tier
 */
export function getTierLabel(tier: 'free' | 'premier'): string {
  switch (tier) {
    case 'free':
      return 'Open (Free)';
    case 'premier':
      return 'Premier';
  }
}

/**
 * Get tier badge color  
 */
export function getTierBadgeClass(tier: 'free' | 'premier'): string {
  switch (tier) {
    case 'free':
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
    case 'premier':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
  }
}

/**
 * Sort models by tier (free first, then premier) and then by name
 */
export function sortModelsByTier(modelIds: string[]): string[] {
  return modelIds.slice().sort((a, b) => {
    const metaA = getModelMetadata(a);
    const metaB = getModelMetadata(b);
    
    // Free models first
    if (metaA.tier === 'free' && metaB.tier !== 'free') return -1;
    if (metaA.tier !== 'free' && metaB.tier === 'free') return 1;
    
    // Within same tier, sort by display name
    return metaA.displayName.localeCompare(metaB.displayName);
  });
}
