import { useDeferredValue, useEffect, useId, useState } from 'react'
import { providers, type ProviderId } from '../data'
import { CompareTable } from './CompareTable'
import { TokenViz } from './TokenViz'
import {
  estimateCost,
  formatPerMillion,
  formatUsd,
  getContextWarning,
  listActiveModels,
  modelSupportsBatchPricing,
  modelSupportsCachePricing,
  projectUsage,
} from '../lib/pricing'
import {
  buildShareUrl,
  readShareStateFromLocation,
  writeShareStateToLocation,
  type ShareState,
} from '../lib/shareState'
import {
  countCharacters,
  countTokensForModel,
  countWords,
} from '../lib/tokenize'

const DEFAULT_TEXT = `You are a helpful assistant.

Summarize the following notes in 5 bullet points, then suggest one follow-up question.

Notes:
- Q2 API spend rose 40% after launching the new chat feature
- Caching cut prompt costs on repeated system messages
- Team wants a monthly budget projector before next board meeting`

const OUTPUT_PRESETS = [
  { id: 'short', label: 'Short', tokens: 256 },
  { id: 'medium', label: 'Medium', tokens: 512 },
  { id: 'long', label: 'Long', tokens: 1024 },
] as const

const DEFAULT_COMPARE = [
  'openai/gpt-4.1',
  'anthropic/claude-sonnet-5',
  'google/gemini-2.5-flash',
  'deepseek/deepseek-v4-flash',
]

function initialState() {
  const shared = readShareStateFromLocation()
  const models = listActiveModels()
  const fallbackModel =
    models.find((m) => m.id === 'openai/gpt-4.1') ?? models[0]

  return {
    text: shared?.text || DEFAULT_TEXT,
    modelId:
      shared?.modelId && models.some((m) => m.id === shared.modelId)
        ? shared.modelId
        : (fallbackModel?.id ?? ''),
    outputTokens: shared?.outputTokens ?? 512,
    cacheHitPercent: shared?.cacheHitPercent ?? 0,
    useBatch: shared?.useBatch ?? false,
    users: shared?.users ?? 100,
    messagesPerDay: shared?.messagesPerDay ?? 5,
    compareIds:
      shared?.compareIds.filter((id) => models.some((m) => m.id === id))
        .length
        ? shared.compareIds.filter((id) => models.some((m) => m.id === id))
        : DEFAULT_COMPARE.filter((id) => models.some((m) => m.id === id)),
  }
}

export function CalculatorPanel() {
  const models = listActiveModels()
  const [boot] = useState(initialState)
  const [text, setText] = useState(boot.text)
  const [modelId, setModelId] = useState(boot.modelId)
  const [outputTokens, setOutputTokens] = useState(boot.outputTokens)
  const [cacheHitPercent, setCacheHitPercent] = useState(boot.cacheHitPercent)
  const [useBatch, setUseBatch] = useState(boot.useBatch)
  const [users, setUsers] = useState(boot.users)
  const [messagesPerDay, setMessagesPerDay] = useState(boot.messagesPerDay)
  const [compareIds, setCompareIds] = useState(boot.compareIds)
  const [shareNote, setShareNote] = useState<string | null>(null)
  const deferredText = useDeferredValue(text)

  const textId = useId()
  const modelFieldId = useId()
  const outputId = useId()
  const cacheId = useId()
  const batchId = useId()
  const usersId = useId()
  const msgsId = useId()

  const model = models.find((m) => m.id === modelId) ?? models[0]
  const supportsCache = model ? modelSupportsCachePricing(model) : false
  const supportsBatch = model ? modelSupportsBatchPricing(model) : false
  const effectiveCachePercent = supportsCache ? cacheHitPercent : 0
  const effectiveBatch = supportsBatch && useBatch

  const shareState: ShareState = {
    modelId: model?.id ?? '',
    outputTokens,
    cacheHitPercent: effectiveCachePercent,
    useBatch: effectiveBatch,
    users,
    messagesPerDay,
    text,
    compareIds,
  }

  const compareKey = compareIds.join(',')

  useEffect(() => {
    writeShareStateToLocation({
      modelId: shareState.modelId,
      outputTokens: shareState.outputTokens,
      cacheHitPercent: shareState.cacheHitPercent,
      useBatch: shareState.useBatch,
      users: shareState.users,
      messagesPerDay: shareState.messagesPerDay,
      text: shareState.text,
      compareIds: compareKey ? compareKey.split(',') : [],
    })
  }, [
    shareState.modelId,
    shareState.outputTokens,
    shareState.cacheHitPercent,
    shareState.useBatch,
    shareState.users,
    shareState.messagesPerDay,
    shareState.text,
    compareKey,
  ])

  const tokenResult = model
    ? countTokensForModel(deferredText, model)
    : null
  const inputTokens = tokenResult?.tokens ?? 0
  const chars = countCharacters(deferredText)
  const words = countWords(deferredText)

  const cost =
    model && tokenResult
      ? estimateCost(model, {
          inputTokens,
          outputTokens: Math.max(0, outputTokens),
          cacheHitRate: effectiveCachePercent / 100,
          useBatch: effectiveBatch,
        })
      : null

  const baselineCost =
    model && tokenResult
      ? estimateCost(model, {
          inputTokens,
          outputTokens: Math.max(0, outputTokens),
          cacheHitRate: 0,
          useBatch: false,
        })
      : null

  const savings =
    cost && baselineCost
      ? Math.max(0, baselineCost.totalCost - cost.totalCost)
      : 0

  const context =
    model != null
      ? getContextWarning(model, inputTokens, Math.max(0, outputTokens))
      : null

  const projection =
    cost != null
      ? projectUsage({
          users,
          messagesPerUserPerDay: messagesPerDay,
          requestCost: cost.totalCost,
        })
      : null

  const modelsByProvider = groupModelsByProvider(models)

  async function copyShareLink() {
    const url = buildShareUrl(shareState)
    try {
      await navigator.clipboard.writeText(url)
      setShareNote('Link copied')
    } catch {
      setShareNote('Could not copy — URL updated in address bar')
    }
    window.setTimeout(() => setShareNote(null), 2000)
  }

  return (
    <section className="calculator" aria-labelledby="calculator-heading">
      <div className="calculator-head">
        <div>
          <h2 id="calculator-heading">Cost calculator</h2>
          <p className="calculator-sub">
            Paste a prompt, tune cache and batch, compare models, and share the
            estimate URL. Token text never leaves this browser.
          </p>
        </div>
        <div className="share-actions">
          <button type="button" className="action-btn" onClick={copyShareLink}>
            Copy share link
          </button>
          {shareNote && <span className="share-note">{shareNote}</span>}
        </div>
      </div>

      <div className="calc-grid">
        <div className="calc-inputs">
          <div className="field">
            <label className="field-label" htmlFor={modelFieldId}>
              Model
            </label>
            <select
              id={modelFieldId}
              value={model?.id ?? ''}
              onChange={(e) => setModelId(e.target.value)}
            >
              {modelsByProvider.map(([providerId, group]) => (
                <optgroup
                  key={providerId}
                  label={providers[providerId].name}
                >
                  {group.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor={textId}>
              Input / prompt
            </label>
            <textarea
              id={textId}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={9}
              spellCheck={false}
              placeholder="Paste prompt, document, or chat message…"
            />
          </div>

          <div className="field">
            <div className="field-label-row">
              <label className="field-label" htmlFor={outputId}>
                Estimated output tokens
              </label>
              <div className="presets" role="group" aria-label="Output size presets">
                {OUTPUT_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={
                      outputTokens === p.tokens ? 'preset active' : 'preset'
                    }
                    onClick={() => setOutputTokens(p.tokens)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              id={outputId}
              type="number"
              min={0}
              step={1}
              value={outputTokens}
              onChange={(e) =>
                setOutputTokens(Math.max(0, Number(e.target.value) || 0))
              }
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label" htmlFor={cacheId}>
                Cache hit {supportsCache ? `${effectiveCachePercent}%` : '(n/a)'}
              </label>
              <input
                id={cacheId}
                type="range"
                min={0}
                max={100}
                step={5}
                value={effectiveCachePercent}
                disabled={!supportsCache}
                onChange={(e) => setCacheHitPercent(Number(e.target.value))}
              />
              {!supportsCache && (
                <p className="field-hint">No published cache rate for this model.</p>
              )}
            </div>

            <div className="field toggle-field">
              <label className="field-label" htmlFor={batchId}>
                Batch API
              </label>
              <label className="toggle">
                <input
                  id={batchId}
                  type="checkbox"
                  checked={effectiveBatch}
                  disabled={!supportsBatch}
                  onChange={(e) => setUseBatch(e.target.checked)}
                />
                <span>
                  {supportsBatch
                    ? effectiveBatch
                      ? 'On (~50% rates)'
                      : 'Off'
                    : 'Unavailable'}
                </span>
              </label>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label" htmlFor={usersId}>
                Active users
              </label>
              <input
                id={usersId}
                type="number"
                min={0}
                step={1}
                value={users}
                onChange={(e) => setUsers(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor={msgsId}>
                Messages / user / day
              </label>
              <input
                id={msgsId}
                type="number"
                min={0}
                step={1}
                value={messagesPerDay}
                onChange={(e) =>
                  setMessagesPerDay(Math.max(0, Number(e.target.value) || 0))
                }
              />
            </div>
          </div>
        </div>

        <div className="calc-results" aria-live="polite">
          {model && tokenResult && cost && projection && context && (
            <>
              {context.message && (
                <p
                  className={`context-warn context-${context.level}`}
                  role="status"
                >
                  {context.message}
                </p>
              )}

              <div className="result-hero">
                <span className="result-total">{formatUsd(cost.totalCost, 6)}</span>
                <span className="result-total-label">estimated request cost</span>
                <span
                  className={`accuracy-badge accuracy-${tokenResult.accuracy}`}
                  title={tokenResult.method}
                >
                  {tokenResult.accuracyLabel} tokens
                </span>
              </div>

              <dl className="result-breakdown">
                <div>
                  <dt>Input tokens</dt>
                  <dd>{inputTokens.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Output tokens</dt>
                  <dd>{outputTokens.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Input cost</dt>
                  <dd>{formatUsd(cost.inputCost + cost.cachedInputCost, 6)}</dd>
                </div>
                <div>
                  <dt>Output cost</dt>
                  <dd>{formatUsd(cost.outputCost, 6)}</dd>
                </div>
                {cost.cachedInputCost > 0 && (
                  <div>
                    <dt>Cached input</dt>
                    <dd>{formatUsd(cost.cachedInputCost, 6)}</dd>
                  </div>
                )}
                {savings > 0 && (
                  <div>
                    <dt>Saved vs base</dt>
                    <dd className="savings">{formatUsd(savings, 6)}</dd>
                  </div>
                )}
                <div>
                  <dt>Characters</dt>
                  <dd>{chars.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Words</dt>
                  <dd>{words.toLocaleString()}</dd>
                </div>
              </dl>

              <div className="projection">
                <h3>Monthly projector</h3>
                <p className="projection-meta">
                  {projection.requestsPerDay.toLocaleString()} requests/day ·{' '}
                  {projection.requestsPerMonth.toLocaleString()}/month
                </p>
                <dl className="result-breakdown projection-grid">
                  <div>
                    <dt>Daily</dt>
                    <dd>{formatUsd(projection.dailyCost, 4)}</dd>
                  </div>
                  <div>
                    <dt>Monthly</dt>
                    <dd>{formatUsd(projection.monthlyCost, 2)}</dd>
                  </div>
                  <div>
                    <dt>Yearly</dt>
                    <dd>{formatUsd(projection.yearlyCost, 2)}</dd>
                  </div>
                </dl>
              </div>

              <div className="result-rates">
                <p>
                  Rates{' '}
                  <strong>
                    in {formatPerMillion(model.pricing.inputPerMillion)}
                  </strong>
                  {' · '}
                  <strong>
                    out {formatPerMillion(model.pricing.outputPerMillion)}
                  </strong>
                  {cost.usedBatchRates ? ' · batch' : ''}
                  {cost.usedLongContextRates ? ' · long-context tier' : ''}
                </p>
                <p className="result-verified">
                  Context {context.totalTokens.toLocaleString()} /{' '}
                  {context.contextWindow.toLocaleString()}
                  {' · '}
                  Verified{' '}
                  <time dateTime={model.lastVerified}>{model.lastVerified}</time>
                  {' · '}
                  <a
                    href={model.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    official pricing
                  </a>
                </p>
                <p className="token-method">{tokenResult.method}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {model && (
        <TokenViz text={deferredText} family={model.tokenizer} />
      )}

      <CompareTable
        models={models}
        selectedIds={compareIds}
        onChangeSelected={setCompareIds}
        text={deferredText}
        outputTokens={Math.max(0, outputTokens)}
        cacheHitPercent={cacheHitPercent}
        useBatch={useBatch}
        users={users}
        messagesPerDay={messagesPerDay}
      />
    </section>
  )
}

function groupModelsByProvider(
  models: ReturnType<typeof listActiveModels>,
): [ProviderId, typeof models][] {
  const order: ProviderId[] = [
    'openai',
    'anthropic',
    'google',
    'deepseek',
    'xai',
    'mistral',
    'groq',
  ]
  return order
    .map((id) => [id, models.filter((m) => m.providerId === id)] as const)
    .filter((entry) => entry[1].length > 0) as [ProviderId, typeof models][]
}
