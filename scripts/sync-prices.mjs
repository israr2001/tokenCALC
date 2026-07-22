/**
 * Fetch official provider pricing pages, diff against src/data/models.ts,
 * optionally write updates + changelog.
 *
 * Usage:
 *   node scripts/sync-prices.mjs              # dry-run (official only)
 *   node scripts/sync-prices.mjs --fallback   # dry-run + LiteLLM gaps
 *   node scripts/sync-prices.mjs --write --fallback
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const modelsPath = resolve(root, 'src/data/models.ts')
const changelogPath = resolve(root, 'src/data/changelog.ts')
const reportDir = resolve(root, 'scripts/sync-prices-out')

const WRITE = process.argv.includes('--write')
const USE_FALLBACK = process.argv.includes('--fallback')
const TODAY = new Date().toISOString().slice(0, 10)
const UA = 'TokenCALC-price-sync/1.0 (+catalog maintenance)'

const OFFICIAL = {
  openai: 'https://platform.openai.com/docs/pricing',
  anthropic: 'https://platform.claude.com/docs/en/about-claude/pricing',
  google: 'https://ai.google.dev/gemini-api/docs/pricing?hl=en',
  deepseek: 'https://api-docs.deepseek.com/quick_start/pricing',
  xai: 'https://docs.x.ai/docs/models',
  mistral: 'https://docs.mistral.ai/getting-started/models/models_overview/',
  groq: 'https://console.groq.com/docs/models',
}

const LITELLM_URL =
  'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'

/** Prefer direct provider keys over azure/bedrock regional variants. */
const LITELLM_ALIASES = {
  'openai/gpt-5': ['gpt-5', 'openai/gpt-5'],
  'openai/gpt-5-mini': ['gpt-5-mini', 'openai/gpt-5-mini'],
  'openai/gpt-4.1': ['gpt-4.1', 'openai/gpt-4.1'],
  'openai/gpt-4.1-mini': ['gpt-4.1-mini', 'openai/gpt-4.1-mini'],
  'openai/gpt-4.1-nano': ['gpt-4.1-nano', 'openai/gpt-4.1-nano'],
  'openai/gpt-4o': ['gpt-4o', 'openai/gpt-4o'],
  'openai/gpt-4o-mini': ['gpt-4o-mini', 'openai/gpt-4o-mini'],
  'openai/o3': ['o3', 'openai/o3'],
  'openai/o4-mini': ['o4-mini', 'openai/o4-mini'],
  'openai/o3-mini': ['o3-mini', 'openai/o3-mini'],
  'anthropic/claude-opus-4-8': ['claude-opus-4-8', 'anthropic/claude-opus-4-8'],
  'anthropic/claude-sonnet-5': ['claude-sonnet-5', 'anthropic/claude-sonnet-5'],
  'anthropic/claude-sonnet-4-6': ['claude-sonnet-4-6', 'anthropic/claude-sonnet-4-6'],
  'anthropic/claude-haiku-4-5': ['claude-haiku-4-5', 'anthropic/claude-haiku-4-5'],
  'anthropic/claude-opus-4-6': ['claude-opus-4-6', 'anthropic/claude-opus-4-6'],
  'google/gemini-2.5-pro': ['gemini/gemini-2.5-pro', 'gemini-2.5-pro'],
  'google/gemini-2.5-flash': ['gemini/gemini-2.5-flash', 'gemini-2.5-flash'],
  'google/gemini-2.5-flash-lite': [
    'gemini/gemini-2.5-flash-lite',
    'gemini-2.5-flash-lite',
  ],
  'google/gemini-3.1-pro': [
    'gemini/gemini-3.1-pro-preview',
    'gemini-3.1-pro-preview',
  ],
  'google/gemini-3-flash': [
    'gemini/gemini-3-flash-preview',
    'gemini-3-flash-preview',
  ],
  'google/gemini-3.1-flash-lite': [
    'gemini/gemini-3.1-flash-lite',
    'gemini-3.1-flash-lite',
  ],
  'deepseek/deepseek-v4-flash': ['deepseek/deepseek-v4-flash', 'deepseek-v4-flash'],
  'deepseek/deepseek-v4-pro': ['deepseek/deepseek-v4-pro', 'deepseek-v4-pro'],
  'xai/grok-4': ['xai/grok-4', 'grok-4'],
  'xai/grok-3': ['xai/grok-3', 'grok-3'],
  'xai/grok-3-mini': ['xai/grok-3-mini', 'grok-3-mini'],
  'mistral/mistral-large-3': [
    'mistral/mistral-large-latest',
    'mistral-large-latest',
    'mistral/mistral-large-2411',
  ],
  'mistral/mistral-small': ['mistral/mistral-small-latest', 'mistral-small-latest'],
  'mistral/codestral': ['mistral/codestral-latest', 'codestral-latest'],
  'mistral/ministral-8b': ['mistral/ministral-8b-latest', 'ministral-8b-latest'],
  'groq/llama-3.3-70b': [
    'groq/llama-3.3-70b-versatile',
    'llama-3.3-70b-versatile',
  ],
  'groq/llama-3.1-8b': ['groq/llama-3.1-8b-instant', 'llama-3.1-8b-instant'],
  'groq/llama-4-scout': [
    'groq/meta-llama/llama-4-scout-17b-16e-instruct',
    'meta-llama/llama-4-scout-17b-16e-instruct',
  ],
  'groq/qwen3-32b': ['groq/qwen/qwen3-32b', 'qwen/qwen3-32b'],
}

function num(v) {
  if (v == null || v === 'null' || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function approxEq(a, b) {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return Math.abs(a - b) < 1e-9
}

function isValidPricing(p) {
  if (!p) return false
  if (!(p.inputPerMillion > 0) || !(p.outputPerMillion > 0)) return false
  if (p.inputPerMillion > 1000 || p.outputPerMillion > 2000) return false
  return true
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'user-agent': UA,
      accept: 'text/html,application/json',
      'accept-language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, url: res.url, text }
}

function parseCatalog(src) {
  const models = []
  const blockRe = /\{\s*id: '([^']+)'[\s\S]*?\n  \},?/g
  let m
  while ((m = blockRe.exec(src))) {
    const block = m[0]
    const id = m[1]
    const get = (key) => {
      const mm = block.match(new RegExp(`${key}:\\s*'([^']*)'`))
      return mm?.[1]
    }
    const getNum = (key) => {
      const mm = block.match(new RegExp(`${key}:\\s*([0-9_.]+)`))
      if (!mm) return undefined
      return Number(mm[1].replace(/_/g, ''))
    }
    models.push({
      id,
      slug: get('slug'),
      name: get('name'),
      providerId: get('providerId'),
      apiModelId: get('apiModelId') || id.split('/')[1],
      pricing: {
        inputPerMillion: getNum('inputPerMillion'),
        outputPerMillion: getNum('outputPerMillion'),
        cachedInputPerMillion: getNum('cachedInputPerMillion'),
        cacheWritePerMillion: getNum('cacheWritePerMillion'),
        batchInputPerMillion: getNum('batchInputPerMillion'),
        batchOutputPerMillion: getNum('batchOutputPerMillion'),
      },
      lastVerified: get('lastVerified'),
      sourceUrl: get('sourceUrl'),
      _blockStart: m.index,
      _blockEnd: m.index + block.length,
      _raw: block,
    })
  }
  return models
}

/** OpenAI docs embed: [1,[[0,"model"],[0,input],[0,cached],[0,output]]] — first hit = standard. */
function parseOpenAI(html) {
  const byModel = new Map()
  const re =
    /\[1,\[\[0,(?:&quot;|")([^"&]+)(?:&quot;|")\],\[0,([0-9.]+|null)\],\[0,([0-9.]+|null)\],\[0,([0-9.]+|null)\]\]\]/g
  let m
  while ((m = re.exec(html))) {
    const model = m[1]
    if (byModel.has(model)) continue
    const input = num(m[2])
    const cached = num(m[3])
    const output = num(m[4])
    const pricing = {
      inputPerMillion: input,
      outputPerMillion: output,
      ...(cached != null ? { cachedInputPerMillion: cached } : {}),
    }
    if (isValidPricing(pricing)) byModel.set(model, pricing)
  }
  return byModel
}

function parseDeepSeek(html) {
  const text = stripHtml(html)
  const byModel = new Map()
  const hit = text.match(
    /1M INPUT TOKENS \(CACHE HIT\)\s*\$([0-9.]+)\s*\$([0-9.]+)/i,
  )
  const miss = text.match(
    /1M INPUT TOKENS \(CACHE MISS\)\s*\$([0-9.]+)\s*\$([0-9.]+)/i,
  )
  const out = text.match(/1M OUTPUT TOKENS\s*\$([0-9.]+)\s*\$([0-9.]+)/i)
  if (miss && out) {
    const flash = {
      inputPerMillion: Number(miss[1]),
      outputPerMillion: Number(out[1]),
      ...(hit ? { cachedInputPerMillion: Number(hit[1]) } : {}),
    }
    const pro = {
      inputPerMillion: Number(miss[2]),
      outputPerMillion: Number(out[2]),
      ...(hit ? { cachedInputPerMillion: Number(hit[2]) } : {}),
    }
    if (isValidPricing(flash)) byModel.set('deepseek-v4-flash', flash)
    if (isValidPricing(pro)) byModel.set('deepseek-v4-pro', pro)
  }
  return byModel
}

/** Google paid-tier: first $ after "Input price" / "Output price" in each model section. */
function parseGoogle(html) {
  const text = stripHtml(html)
  const byModel = new Map()
  const sections = [
    { key: 'gemini-2.5-pro', needle: 'Gemini 2.5 Pro' },
    { key: 'gemini-2.5-flash-lite', needle: 'Gemini 2.5 Flash-Lite' },
    { key: 'gemini-2.5-flash', needle: 'Gemini 2.5 Flash' },
    { key: 'gemini-3.1-pro-preview', needle: 'Gemini 3.1 Pro' },
    { key: 'gemini-3-flash-preview', needle: 'Gemini 3 Flash' },
    { key: 'gemini-3.1-flash-lite', needle: 'Gemini 3.1 Flash-Lite' },
  ]

  for (const { key, needle } of sections) {
    const idx = text.indexOf(needle)
    if (idx < 0) continue
    const slice = text.slice(idx, idx + 1500)
    const inputM = slice.match(/Input price[\s\S]*?\$([0-9]+(?:\.[0-9]+)?)/i)
    const outputM = slice.match(/Output price[\s\S]*?\$([0-9]+(?:\.[0-9]+)?)/i)
    const cacheM = slice.match(
      /Context caching price[\s\S]*?\$([0-9]+(?:\.[0-9]+)?)/i,
    )
    if (!inputM || !outputM) continue
    const pricing = {
      inputPerMillion: Number(inputM[1]),
      outputPerMillion: Number(outputM[1]),
      ...(cacheM ? { cachedInputPerMillion: Number(cacheM[1]) } : {}),
    }
    if (isValidPricing(pricing)) {
      byModel.set(key, pricing)
      // also under short ids used by catalog apiModelId variants
      byModel.set(key.replace('-preview', ''), pricing)
    }
  }
  return byModel
}

function litellmToPricing(entry) {
  if (!entry) return null
  const input = entry.input_cost_per_token
  const output = entry.output_cost_per_token
  if (input == null || output == null) return null
  const pricing = {
    inputPerMillion: +(input * 1_000_000).toPrecision(8),
    outputPerMillion: +(output * 1_000_000).toPrecision(8),
  }
  if (entry.cache_read_input_token_cost != null) {
    pricing.cachedInputPerMillion = +(
      entry.cache_read_input_token_cost * 1_000_000
    ).toPrecision(8)
  }
  if (entry.cache_creation_input_token_cost != null) {
    pricing.cacheWritePerMillion = +(
      entry.cache_creation_input_token_cost * 1_000_000
    ).toPrecision(8)
  }
  return isValidPricing(pricing) ? pricing : null
}

function lookupFetched(map, model) {
  const keys = [
    model.apiModelId,
    model.id.split('/')[1],
    model.slug?.replace(/-/g, '.'),
  ].filter(Boolean)
  for (const k of keys) {
    if (map.has(k)) return map.get(k)
  }
  return null
}

function formatPriceNum(n) {
  if (Number.isInteger(n)) return String(n)
  const fixed = Number(n.toPrecision(8))
  return String(fixed)
}

function applyPricingToBlock(block, pricing, lastVerified) {
  let next = block
  for (const [key, value] of Object.entries(pricing)) {
    if (value == null) continue
    const re = new RegExp(`(${key}:\\s*)([0-9_.]+)`)
    if (re.test(next)) {
      next = next.replace(re, `$1${formatPriceNum(value)}`)
    } else if (
      key === 'cachedInputPerMillion' ||
      key === 'cacheWritePerMillion'
    ) {
      // Insert optional cache fields after outputPerMillion when newly discovered
      next = next.replace(
        /(outputPerMillion:\s*[0-9_.]+,?)/,
        `$1\n      ${key}: ${formatPriceNum(value)},`,
      )
    }
  }
  next = next.replace(/(lastVerified:\s*')([^']+)(')/, `$1${lastVerified}$3`)
  return next
}

function appendChangelog(src, summary, modelIds) {
  const entry = `  {
    date: '${TODAY}',
    summary:
      '${summary.replace(/'/g, "\\'")}',
    modelIds: [${modelIds.map((id) => `'${id}'`).join(', ')}],
  },
`
  return src.replace(
    /export const pricingChangelog: PricingChangelogEntry\[\] = \[/,
    `export const pricingChangelog: PricingChangelogEntry[] = [\n${entry}`,
  )
}

function diffPricing(current, fetched) {
  const changes = []
  for (const key of [
    'inputPerMillion',
    'outputPerMillion',
    'cachedInputPerMillion',
    'cacheWritePerMillion',
  ]) {
    if (fetched[key] == null) continue
    if (!approxEq(current[key], fetched[key])) {
      changes.push({
        field: key,
        from: current[key] ?? null,
        to: fetched[key],
      })
    }
  }
  return changes
}

function groupByProvider(models) {
  const acc = new Map()
  for (const m of models) {
    if (!acc.has(m.providerId)) acc.set(m.providerId, [])
    acc.get(m.providerId).push(m)
  }
  return acc
}

async function main() {
  const catalogSrc = readFileSync(modelsPath, 'utf8')
  const models = parseCatalog(catalogSrc)
  if (!models.length) {
    console.error('No models parsed from', modelsPath)
    process.exit(1)
  }

  const byProvider = groupByProvider(models)
  const providerMaps = new Map()
  const fetchNotes = []

  for (const providerId of byProvider.keys()) {
    const url = OFFICIAL[providerId]
    if (!url) {
      fetchNotes.push({ providerId, status: 'skip', detail: 'no official URL' })
      providerMaps.set(providerId, new Map())
      continue
    }
    try {
      const page = await fetchText(url)
      let map = new Map()
      if (providerId === 'openai') map = parseOpenAI(page.text)
      else if (providerId === 'google') map = parseGoogle(page.text)
      else if (providerId === 'deepseek') map = parseDeepSeek(page.text)
      // anthropic / xai / mistral / groq pages are mostly client-rendered — leave map empty
      providerMaps.set(providerId, map)
      fetchNotes.push({
        providerId,
        status: page.ok ? 'ok' : `http-${page.status}`,
        url: page.url,
        parsedModels: map.size,
        note:
          map.size === 0
            ? 'no structured prices in static HTML (use --fallback)'
            : undefined,
      })
    } catch (err) {
      fetchNotes.push({
        providerId,
        status: 'error',
        detail: String(err?.message || err),
      })
      providerMaps.set(providerId, new Map())
    }
  }

  let litellm = null
  if (USE_FALLBACK) {
    try {
      const page = await fetchText(LITELLM_URL)
      litellm = JSON.parse(page.text)
      fetchNotes.push({
        providerId: 'litellm-fallback',
        status: page.ok ? 'ok' : `http-${page.status}`,
        url: LITELLM_URL,
        parsedModels: Object.keys(litellm).length,
      })
    } catch (err) {
      fetchNotes.push({
        providerId: 'litellm-fallback',
        status: 'error',
        detail: String(err?.message || err),
      })
    }
  }

  const report = {
    date: TODAY,
    write: WRITE,
    fallback: USE_FALLBACK,
    fetchNotes,
    updated: [],
    unchanged: [],
    skipped: [],
  }

  let nextSrc = catalogSrc
  const updates = []

  for (const model of models) {
    const map = providerMaps.get(model.providerId) || new Map()
    let fetched = lookupFetched(map, model)
    let source = 'official'

    if (!fetched && litellm) {
      const aliases = LITELLM_ALIASES[model.id] || [
        model.id,
        model.apiModelId,
        `${model.providerId}/${model.apiModelId}`,
      ]
      for (const key of aliases) {
        const pricing = litellmToPricing(litellm[key])
        if (pricing) {
          fetched = pricing
          source = 'litellm-fallback'
          break
        }
      }
    }

    if (!fetched || !isValidPricing(fetched)) {
      report.skipped.push({
        id: model.id,
        reason: fetched
          ? 'parsed prices failed validation'
          : 'not found on official page (and no fallback match)',
      })
      continue
    }

    const changes = diffPricing(model.pricing, fetched)
    if (!changes.length) {
      report.unchanged.push({ id: model.id, source })
      continue
    }

    updates.push({ model, pricing: fetched, changes, source })
    report.updated.push({
      id: model.id,
      source,
      sourceUrl: OFFICIAL[model.providerId],
      changes,
    })
  }

  if (WRITE && updates.length) {
    const sorted = [...updates].sort(
      (a, b) => b.model._blockStart - a.model._blockStart,
    )
    for (const u of sorted) {
      const newBlock = applyPricingToBlock(u.model._raw, u.pricing, TODAY)
      nextSrc =
        nextSrc.slice(0, u.model._blockStart) +
        newBlock +
        nextSrc.slice(u.model._blockEnd)
    }

    nextSrc = nextSrc.replace(
      / \* lastVerified: \d{4}-\d{2}-\d{2}/,
      ` * lastVerified: ${TODAY}`,
    )

    writeFileSync(modelsPath, nextSrc)

    const changedIds = report.updated.map((u) => u.id)
    const summary = `Price sync: ${changedIds.length} model(s) updated (${changedIds.join(', ')}). Official docs first; LiteLLM only for SPA gaps.`
    const changelogSrc = readFileSync(changelogPath, 'utf8')
    writeFileSync(
      changelogPath,
      appendChangelog(changelogSrc, summary, changedIds),
    )
  }

  mkdirSync(reportDir, { recursive: true })
  const reportPath = resolve(reportDir, `report-${TODAY}.json`)
  writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log(`Price sync ${WRITE ? 'WRITE' : 'DRY-RUN'} (${TODAY})`)
  console.log(
    `Fetched: ${fetchNotes.map((n) => `${n.providerId}=${n.status}/${n.parsedModels ?? '-'}`).join(', ')}`,
  )
  console.log(`Updated: ${report.updated.length}`)
  for (const u of report.updated) {
    const bits = u.changes
      .map((c) => `${c.field}: ${c.from} → ${c.to}`)
      .join('; ')
    console.log(`  - ${u.id} [${u.source}] ${bits}`)
  }
  console.log(`Unchanged: ${report.unchanged.length}`)
  console.log(`Skipped: ${report.skipped.length}`)
  for (const s of report.skipped) console.log(`  - ${s.id}: ${s.reason}`)
  console.log(`Report: ${reportPath}`)
  if (WRITE) {
    console.log(
      report.updated.length
        ? `Wrote ${report.updated.length} pricing change(s) to models.ts + changelog`
        : 'No pricing field changes to write.',
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
