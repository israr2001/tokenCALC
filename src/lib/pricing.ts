import {
  models,
  pricingChangelog,
  providers,
  type ModelRecord,
  type ProviderId,
} from '../data'

export interface CostEstimateInput {
  inputTokens: number
  outputTokens: number
  /** 0–1 fraction of input tokens expected to hit cache. */
  cacheHitRate?: number
  useBatch?: boolean
}

export interface CostEstimate {
  inputCost: number
  outputCost: number
  cachedInputCost: number
  totalCost: number
  usedLongContextRates: boolean
  usedBatchRates: boolean
}

export function getModelById(id: string): ModelRecord | undefined {
  return models.find((m) => m.id === id)
}

export function getModelBySlug(slug: string): ModelRecord | undefined {
  return models.find((m) => m.slug === slug)
}

export function getModelsByProvider(providerId: ProviderId): ModelRecord[] {
  return models.filter((m) => m.providerId === providerId && !m.deprecated)
}

export function listActiveModels(): ModelRecord[] {
  return models.filter((m) => !m.deprecated)
}

export function catalogStats() {
  const active = listActiveModels()
  const byProvider = Object.fromEntries(
    (Object.keys(providers) as ProviderId[]).map((id) => [
      id,
      active.filter((m) => m.providerId === id).length,
    ]),
  ) as Record<ProviderId, number>

  const verifiedDates = active.map((m) => m.lastVerified).sort()
  const oldestVerified = verifiedDates[0] ?? null
  const newestVerified = verifiedDates[verifiedDates.length - 1] ?? null

  return {
    modelCount: active.length,
    providerCount: Object.values(byProvider).filter((n) => n > 0).length,
    byProvider,
    oldestVerified,
    newestVerified,
    latestChangelog: pricingChangelog[0] ?? null,
  }
}

/** Unique official source URLs across the active catalog. */
export function listPricingSources(): { name: string; url: string }[] {
  const seen = new Set<string>()
  const out: { name: string; url: string }[] = []
  for (const model of listActiveModels()) {
    if (seen.has(model.sourceUrl)) continue
    seen.add(model.sourceUrl)
    out.push({ name: providers[model.providerId].name, url: model.sourceUrl })
  }
  return out
}

function pickRates(model: ModelRecord, inputTokens: number, useBatch: boolean) {
  const { pricing } = model
  const long = pricing.longContext
  const useLong = Boolean(long && inputTokens > long.thresholdTokens)

  if (useBatch) {
    const batchIn =
      useLong && long
        ? (long.inputPerMillion / 2)
        : (pricing.batchInputPerMillion ?? pricing.inputPerMillion / 2)
    const batchOut =
      useLong && long
        ? (long.outputPerMillion / 2)
        : (pricing.batchOutputPerMillion ?? pricing.outputPerMillion / 2)
    const cached =
      useLong && long?.cachedInputPerMillion != null
        ? long.cachedInputPerMillion
        : pricing.cachedInputPerMillion
    return {
      inputPerMillion: batchIn,
      outputPerMillion: batchOut,
      cachedInputPerMillion: cached,
      usedLongContextRates: useLong,
      usedBatchRates: true,
    }
  }

  if (useLong && long) {
    return {
      inputPerMillion: long.inputPerMillion,
      outputPerMillion: long.outputPerMillion,
      cachedInputPerMillion: long.cachedInputPerMillion ?? pricing.cachedInputPerMillion,
      usedLongContextRates: true,
      usedBatchRates: false,
    }
  }

  return {
    inputPerMillion: pricing.inputPerMillion,
    outputPerMillion: pricing.outputPerMillion,
    cachedInputPerMillion: pricing.cachedInputPerMillion,
    usedLongContextRates: false,
    usedBatchRates: false,
  }
}

export function estimateCost(
  model: ModelRecord,
  {
    inputTokens,
    outputTokens,
    cacheHitRate = 0,
    useBatch = false,
  }: CostEstimateInput,
): CostEstimate {
  const hit = Math.min(1, Math.max(0, cacheHitRate))
  const rates = pickRates(model, inputTokens, useBatch)
  const cachedTokens = rates.cachedInputPerMillion != null ? inputTokens * hit : 0
  const uncachedTokens = inputTokens - cachedTokens

  const inputCost = (uncachedTokens / 1_000_000) * rates.inputPerMillion
  const cachedInputCost =
    rates.cachedInputPerMillion != null
      ? (cachedTokens / 1_000_000) * rates.cachedInputPerMillion
      : 0
  const outputCost = (outputTokens / 1_000_000) * rates.outputPerMillion

  return {
    inputCost,
    outputCost,
    cachedInputCost,
    totalCost: inputCost + cachedInputCost + outputCost,
    usedLongContextRates: rates.usedLongContextRates,
    usedBatchRates: rates.usedBatchRates,
  }
}

export interface MonthlyProjectionInput {
  users: number
  messagesPerUserPerDay: number
  /** Cost of a single request (already includes cache/batch). */
  requestCost: number
}

export interface MonthlyProjection {
  requestsPerDay: number
  requestsPerMonth: number
  dailyCost: number
  monthlyCost: number
  yearlyCost: number
}

export function projectUsage({
  users,
  messagesPerUserPerDay,
  requestCost,
}: MonthlyProjectionInput): MonthlyProjection {
  const safeUsers = Math.max(0, users)
  const safeMsgs = Math.max(0, messagesPerUserPerDay)
  const requestsPerDay = safeUsers * safeMsgs
  const requestsPerMonth = requestsPerDay * 30
  return {
    requestsPerDay,
    requestsPerMonth,
    dailyCost: requestsPerDay * requestCost,
    monthlyCost: requestsPerMonth * requestCost,
    yearlyCost: requestsPerDay * 365 * requestCost,
  }
}

export type ContextWarningLevel = 'ok' | 'tight' | 'overflow'

export interface ContextWarning {
  level: ContextWarningLevel
  totalTokens: number
  contextWindow: number
  remaining: number
  message: string | null
}

export function getContextWarning(
  model: ModelRecord,
  inputTokens: number,
  outputTokens: number,
): ContextWarning {
  const totalTokens = Math.max(0, inputTokens) + Math.max(0, outputTokens)
  const contextWindow = model.contextWindow
  const remaining = contextWindow - totalTokens
  const ratio = contextWindow > 0 ? totalTokens / contextWindow : 0

  if (totalTokens > contextWindow) {
    return {
      level: 'overflow',
      totalTokens,
      contextWindow,
      remaining,
      message: `This request (~${totalTokens.toLocaleString()} tokens) exceeds the ${contextWindow.toLocaleString()}-token context window by ${Math.abs(remaining).toLocaleString()} tokens.`,
    }
  }

  if (ratio >= 0.85) {
    return {
      level: 'tight',
      totalTokens,
      contextWindow,
      remaining,
      message: `Using ${Math.round(ratio * 100)}% of the ${contextWindow.toLocaleString()}-token context window (${remaining.toLocaleString()} left).`,
    }
  }

  return {
    level: 'ok',
    totalTokens,
    contextWindow,
    remaining,
    message: null,
  }
}

export function modelSupportsCachePricing(model: ModelRecord): boolean {
  return model.pricing.cachedInputPerMillion != null
}

export function modelSupportsBatchPricing(model: ModelRecord): boolean {
  return (
    model.pricing.batchInputPerMillion != null ||
    model.pricing.batchOutputPerMillion != null
  )
}

export function formatUsd(amount: number, digits = 4): string {
  if (amount === 0) return '$0'
  if (amount > 0 && amount < 0.000001) return '<$0.000001'
  const fixed = amount.toFixed(digits)
  const trimmed = fixed.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '')
  if (!trimmed.includes('.')) return `$${trimmed}.00`
  return `$${trimmed}`
}

export function formatPerMillion(amount: number): string {
  return `$${amount.toFixed(amount < 1 ? 3 : 2)}/1M`
}
