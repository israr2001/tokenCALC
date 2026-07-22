/** USD price per 1 million tokens. */
export type UsdPerMillion = number

export type ProviderId =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'deepseek'
  | 'xai'
  | 'mistral'
  | 'groq'

/** Tokenizer family used later for Exact vs Approx labeling (Step 3). */
export type TokenizerFamily =
  | 'o200k_base'
  | 'cl100k_base'
  | 'anthropic'
  | 'gemini'
  | 'approx'

export interface Provider {
  id: ProviderId
  name: string
  /** Official pricing / docs hub for this provider. */
  sourceUrl: string
  websiteUrl: string
}

export interface LongContextPricing {
  /** Prompt size (tokens) at which long-context rates begin. */
  thresholdTokens: number
  inputPerMillion: UsdPerMillion
  outputPerMillion: UsdPerMillion
  cachedInputPerMillion?: UsdPerMillion
}

export interface ModelPricingRates {
  inputPerMillion: UsdPerMillion
  outputPerMillion: UsdPerMillion
  /** Prompt-cache hit / refresh rate when published. */
  cachedInputPerMillion?: UsdPerMillion
  /** Cache write (e.g. Anthropic 5m write) when published. */
  cacheWritePerMillion?: UsdPerMillion
  /** Batch API rates when published; often ~50% of standard. */
  batchInputPerMillion?: UsdPerMillion
  batchOutputPerMillion?: UsdPerMillion
  longContext?: LongContextPricing
}

export interface ModelRecord {
  id: string
  slug: string
  name: string
  providerId: ProviderId
  /** API model id when it differs from `id`. */
  apiModelId?: string
  contextWindow: number
  maxOutput?: number
  pricing: ModelPricingRates
  tokenizer: TokenizerFamily
  /** ISO date (YYYY-MM-DD) when rates were last checked against sourceUrl. */
  lastVerified: string
  /** Canonical outbound link for these rates. */
  sourceUrl: string
  notes?: string
  deprecated?: boolean
}

export interface PricingChangelogEntry {
  date: string
  summary: string
  modelIds?: string[]
}
