import type { Provider, ProviderId } from './types'

export const providers: Record<ProviderId, Provider> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    sourceUrl: 'https://platform.openai.com/docs/pricing',
    websiteUrl: 'https://openai.com/',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
    websiteUrl: 'https://www.anthropic.com/',
  },
  google: {
    id: 'google',
    name: 'Google',
    sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    websiteUrl: 'https://ai.google.dev/',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
    websiteUrl: 'https://www.deepseek.com/',
  },
  xai: {
    id: 'xai',
    name: 'xAI',
    sourceUrl: 'https://docs.x.ai/docs/models',
    websiteUrl: 'https://x.ai/',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral',
    sourceUrl: 'https://mistral.ai/products/la-plateforme#pricing',
    websiteUrl: 'https://mistral.ai/',
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    sourceUrl: 'https://groq.com/pricing/',
    websiteUrl: 'https://groq.com/',
  },
}

export const providerList: Provider[] = Object.values(providers)
