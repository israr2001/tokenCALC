export interface ShareState {
  modelId: string
  outputTokens: number
  cacheHitPercent: number
  useBatch: boolean
  users: number
  messagesPerDay: number
  text: string
  compareIds: string[]
}

const KEYS = {
  model: 'm',
  output: 'o',
  cache: 'c',
  batch: 'b',
  users: 'u',
  msgs: 'd',
  text: 't',
  compare: 'cmp',
} as const

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeShareState(state: ShareState): string {
  const params = new URLSearchParams()
  params.set(KEYS.model, state.modelId)
  params.set(KEYS.output, String(Math.max(0, Math.round(state.outputTokens))))
  params.set(KEYS.cache, String(Math.max(0, Math.min(100, Math.round(state.cacheHitPercent)))))
  if (state.useBatch) params.set(KEYS.batch, '1')
  params.set(KEYS.users, String(Math.max(0, Math.round(state.users))))
  params.set(KEYS.msgs, String(Math.max(0, Math.round(state.messagesPerDay))))
  if (state.text) params.set(KEYS.text, toBase64Url(state.text))
  if (state.compareIds.length > 0) {
    params.set(KEYS.compare, state.compareIds.join(','))
  }
  return params.toString()
}

export function decodeShareState(searchOrHash: string): ShareState | null {
  const raw = searchOrHash.startsWith('?') || searchOrHash.startsWith('#')
    ? searchOrHash.slice(1)
    : searchOrHash
  if (!raw) return null

  const params = new URLSearchParams(raw)
  const modelId = params.get(KEYS.model)
  if (!modelId) return null

  let text = ''
  const encodedText = params.get(KEYS.text)
  if (encodedText) {
    try {
      text = fromBase64Url(encodedText)
    } catch {
      text = ''
    }
  }

  const compareRaw = params.get(KEYS.compare) ?? ''
  const compareIds = compareRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return {
    modelId,
    outputTokens: Number(params.get(KEYS.output) ?? 512) || 0,
    cacheHitPercent: Number(params.get(KEYS.cache) ?? 0) || 0,
    useBatch: params.get(KEYS.batch) === '1',
    users: Number(params.get(KEYS.users) ?? 100) || 0,
    messagesPerDay: Number(params.get(KEYS.msgs) ?? 5) || 0,
    text,
    compareIds,
  }
}

export function readShareStateFromLocation(): ShareState | null {
  if (typeof window === 'undefined') return null
  return (
    decodeShareState(window.location.hash) ??
    decodeShareState(window.location.search)
  )
}

export function writeShareStateToLocation(state: ShareState): string {
  const encoded = encodeShareState(state)
  const url = `${window.location.pathname}${window.location.search}#${encoded}`
  window.history.replaceState(null, '', url)
  return `${window.location.origin}${window.location.pathname}${window.location.search}#${encoded}`
}

export function buildShareUrl(state: ShareState): string {
  const encoded = encodeShareState(state)
  if (typeof window === 'undefined') return `#${encoded}`
  return `${window.location.origin}${window.location.pathname}${window.location.search}#${encoded}`
}
