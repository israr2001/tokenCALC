import { SITE_URL } from '../config/site'
import { models } from '../data/models'
import { providerList } from '../data/providers'
import type { ProviderId } from '../data/types'
import { guides } from './guides'

export function providerPath(providerId: ProviderId): string {
  return `/providers/${providerId}`
}

export function modelPath(providerId: ProviderId, slug: string): string {
  return `/providers/${providerId}/models/${slug}`
}

export function comparePath(slugA: string, slugB: string): string {
  return `/compare/${slugA}-vs-${slugB}`
}

export function guidePath(slug: string): string {
  return `/guides/${slug}`
}

export const staticSiloPaths = [
  '/',
  '/tokenizer',
  '/cost-calculator',
  '/providers',
  '/tools/tokens-to-words',
  '/tools/batch-pricing',
  '/tools/cache-savings',
  '/changelog',
  '/guides',
  '/sitemap',
] as const

/** Featured compare pairs for sitemap + hub links. */
export const featuredCompares: Array<[string, string]> = [
  ['gpt-4-1', 'claude-sonnet-5'],
  ['gpt-5', 'claude-opus-4-8'],
  ['gemini-2-5-flash', 'gpt-4o-mini'],
  ['deepseek-v4-flash', 'gpt-4-1-nano'],
  ['claude-haiku-4-5', 'gemini-2-5-flash-lite'],
]

export function listSitemapPaths(): string[] {
  const paths = new Set<string>([...staticSiloPaths])

  for (const p of providerList) {
    paths.add(providerPath(p.id))
  }

  for (const m of models) {
    if (m.deprecated) continue
    paths.add(modelPath(m.providerId, m.slug))
  }

  for (const [a, b] of featuredCompares) {
    paths.add(comparePath(a, b))
  }

  for (const g of guides) {
    paths.add(guidePath(g.slug))
  }

  return [...paths].sort()
}

export function absoluteUrl(path: string): string {
  if (path === '/') return `${SITE_URL}/`
  return `${SITE_URL}${path}`
}
