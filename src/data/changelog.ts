import type { PricingChangelogEntry } from './types'

/** Manual changelog for curated price updates (no live sync). */
export const pricingChangelog: PricingChangelogEntry[] = [
  {
    date: '2026-07-22',
    summary:
      'Price sync: 7 model(s) updated (deepseek/deepseek-v4-pro, xai/grok-4, xai/grok-3, xai/grok-3-mini, mistral/mistral-small, mistral/codestral, mistral/ministral-8b). Official docs first; LiteLLM only for SPA gaps.',
    modelIds: ['deepseek/deepseek-v4-pro', 'xai/grok-4', 'xai/grok-3', 'xai/grok-3-mini', 'mistral/mistral-small', 'mistral/codestral', 'mistral/ministral-8b'],
  },

  {
    date: '2026-07-22',
    summary:
      'Expanded catalog: o3-mini, Claude Opus 4.6, Gemini 3 Flash / Flash-Lite, Grok 3 family, Codestral, Ministral, Llama 4 Scout, Qwen3 on Groq.',
  },
  {
    date: '2026-07-22',
    summary:
      'Initial curated catalog: OpenAI, Anthropic, Google, DeepSeek, xAI, Mistral, Groq with lastVerified + sourceUrl.',
  },
]
