import {
  countTokens as countO200k,
  decode as decodeO200k,
  encode as encodeO200k,
} from 'gpt-tokenizer/encoding/o200k_base'
import type { ModelRecord, TokenizerFamily } from '../data'

export type AccuracyLabel = 'exact' | 'approx'

export interface TokenCountResult {
  tokens: number
  accuracy: AccuracyLabel
  /** Human label for UI badges. */
  accuracyLabel: 'Exact' | 'Approx'
  method: string
  family: TokenizerFamily
}

export interface TokenPiece {
  index: number
  tokenId: number
  text: string
}

export interface TokenPieceResult {
  pieces: TokenPiece[]
  truncated: boolean
  accuracy: AccuracyLabel
  accuracyLabel: 'Exact' | 'Approx'
  method: string
}

const VIZ_TOKEN_LIMIT = 240

let countCl100k: ((text: string) => number) | null = null

async function loadCl100k(): Promise<(text: string) => number> {
  if (!countCl100k) {
    const mod = await import('gpt-tokenizer/encoding/cl100k_base')
    countCl100k = mod.countTokens
  }
  return countCl100k
}

export function isExactFamily(family: TokenizerFamily): boolean {
  return family === 'o200k_base' || family === 'cl100k_base'
}

export function accuracyForFamily(family: TokenizerFamily): AccuracyLabel {
  return isExactFamily(family) ? 'exact' : 'approx'
}

/**
 * Heuristic approximation for providers without a public browser tokenizer.
 * Biases toward English (~4 chars/token) and treats CJK denser (~1 char/token).
 */
export function approximateTokenCount(text: string): number {
  if (!text) return 0

  let cjk = 0
  let other = 0
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0
    const isCjk =
      (code >= 0x3040 && code <= 0x30ff) ||
      (code >= 0x3400 && code <= 0x9fff) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xac00 && code <= 0xd7af)
    if (isCjk) cjk += 1
    else other += 1
  }

  return Math.max(0, Math.ceil(cjk + other / 4))
}

function methodForFamily(family: TokenizerFamily): string {
  switch (family) {
    case 'o200k_base':
      return 'gpt-tokenizer · o200k_base'
    case 'cl100k_base':
      return 'gpt-tokenizer · cl100k_base'
    case 'anthropic':
      return 'heuristic (Anthropic tokenizer not public in-browser)'
    case 'gemini':
      return 'heuristic (Gemini tokenizer not public in-browser)'
    case 'approx':
      return 'heuristic (~4 chars / token, denser for CJK)'
  }
}

/** Sync count. Prefer for o200k + heuristic families (current catalog). */
export function countTokensForFamily(
  text: string,
  family: TokenizerFamily,
): TokenCountResult {
  const accuracy = accuracyForFamily(family)
  let tokens: number

  if (family === 'o200k_base') {
    tokens = text ? countO200k(text) : 0
  } else if (family === 'cl100k_base') {
    if (countCl100k) {
      tokens = text ? countCl100k(text) : 0
    } else {
      void loadCl100k()
      return {
        tokens: text ? countO200k(text) : 0,
        accuracy: 'approx',
        accuracyLabel: 'Approx',
        method: 'loading cl100k_base — temporary o200k proxy',
        family,
      }
    }
  } else {
    tokens = approximateTokenCount(text)
  }

  return {
    tokens,
    accuracy,
    accuracyLabel: accuracy === 'exact' ? 'Exact' : 'Approx',
    method: methodForFamily(family),
    family,
  }
}

export async function countTokensForFamilyAsync(
  text: string,
  family: TokenizerFamily,
): Promise<TokenCountResult> {
  if (family === 'cl100k_base') {
    const count = await loadCl100k()
    return {
      tokens: text ? count(text) : 0,
      accuracy: 'exact',
      accuracyLabel: 'Exact',
      method: methodForFamily(family),
      family,
    }
  }
  return countTokensForFamily(text, family)
}

export function countTokensForModel(
  text: string,
  model: ModelRecord,
): TokenCountResult {
  return countTokensForFamily(text, model.tokenizer)
}

/** Exact piece breakdown for o200k; Approx models get no fake piece map. */
export function tokenizePieces(
  text: string,
  family: TokenizerFamily,
): TokenPieceResult {
  if (!text) {
    return {
      pieces: [],
      truncated: false,
      accuracy: accuracyForFamily(family),
      accuracyLabel: isExactFamily(family) ? 'Exact' : 'Approx',
      method: methodForFamily(family),
    }
  }

  if (family !== 'o200k_base') {
    return {
      pieces: [],
      truncated: false,
      accuracy: 'approx',
      accuracyLabel: 'Approx',
      method:
        family === 'cl100k_base'
          ? 'Piece viz uses o200k models only for now'
          : methodForFamily(family),
    }
  }

  const ids = encodeO200k(text)
  const truncated = ids.length > VIZ_TOKEN_LIMIT
  const slice = truncated ? ids.slice(0, VIZ_TOKEN_LIMIT) : ids
  const pieces = slice.map((tokenId, index) => ({
    index,
    tokenId,
    text: decodeO200k([tokenId]),
  }))

  return {
    pieces,
    truncated,
    accuracy: 'exact',
    accuracyLabel: 'Exact',
    method: methodForFamily(family),
  }
}

export function countCharacters(text: string): number {
  return [...text].length
}

export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}
