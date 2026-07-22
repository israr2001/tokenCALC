import { providers, type ModelRecord } from '../data'
import { downloadCsv, rowsToCsv } from '../lib/csv'
import {
  estimateCost,
  formatUsd,
  projectUsage,
  type CostEstimate,
} from '../lib/pricing'
import {
  countTokensForModel,
  type TokenCountResult,
} from '../lib/tokenize'

export interface CompareRow {
  model: ModelRecord
  tokens: TokenCountResult
  cost: CostEstimate
  monthlyCost: number
}

interface CompareTableProps {
  models: ModelRecord[]
  selectedIds: string[]
  onChangeSelected: (ids: string[]) => void
  text: string
  outputTokens: number
  cacheHitPercent: number
  useBatch: boolean
  users: number
  messagesPerDay: number
}

export function CompareTable({
  models,
  selectedIds,
  onChangeSelected,
  text,
  outputTokens,
  cacheHitPercent,
  useBatch,
  users,
  messagesPerDay,
}: CompareTableProps) {
  const selected = models.filter((m) => selectedIds.includes(m.id))

  const rows: CompareRow[] = selected
    .map((model) => {
      const tokens = countTokensForModel(text, model)
      const supportsCache = model.pricing.cachedInputPerMillion != null
      const supportsBatch =
        model.pricing.batchInputPerMillion != null ||
        model.pricing.batchOutputPerMillion != null
      const cost = estimateCost(model, {
        inputTokens: tokens.tokens,
        outputTokens,
        cacheHitRate: supportsCache ? cacheHitPercent / 100 : 0,
        useBatch: supportsBatch && useBatch,
      })
      const monthly = projectUsage({
        users,
        messagesPerUserPerDay: messagesPerDay,
        requestCost: cost.totalCost,
      }).monthlyCost
      return { model, tokens, cost, monthlyCost: monthly }
    })
    .sort((a, b) => a.monthlyCost - b.monthlyCost)

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChangeSelected(selectedIds.filter((x) => x !== id))
    } else {
      onChangeSelected([...selectedIds, id])
    }
  }

  function exportCsv() {
    const csv = rowsToCsv(
      [
        'Model',
        'Provider',
        'Accuracy',
        'Input tokens',
        'Request cost USD',
        'Monthly cost USD',
        'Verified',
        'Source',
      ],
      rows.map((r) => [
        r.model.name,
        providers[r.model.providerId].name,
        r.tokens.accuracyLabel,
        r.tokens.tokens,
        r.cost.totalCost.toFixed(8),
        r.monthlyCost.toFixed(6),
        r.model.lastVerified,
        r.model.sourceUrl,
      ]),
    )
    downloadCsv(`tokencalc-compare-${Date.now()}.csv`, csv)
  }

  return (
    <section className="compare" aria-labelledby="compare-heading">
      <div className="compare-head">
        <div>
          <h3 id="compare-heading">Compare models</h3>
          <p className="compare-sub">
            Same prompt, output size, cache, and batch settings across models.
          </p>
        </div>
        <button
          type="button"
          className="action-btn"
          onClick={exportCsv}
          disabled={rows.length === 0}
        >
          Export CSV
        </button>
      </div>

      <div className="compare-picks" role="group" aria-label="Models to compare">
        {models.map((m) => (
          <label key={m.id} className="compare-pick">
            <input
              type="checkbox"
              checked={selectedIds.includes(m.id)}
              onChange={() => toggle(m.id)}
            />
            <span>
              {providers[m.providerId].name} · {m.name}
            </span>
          </label>
        ))}
      </div>

      {rows.length > 0 ? (
        <div className="compare-scroll">
          <table className="compare-table">
            <thead>
              <tr>
                <th scope="col">Model</th>
                <th scope="col">Accuracy</th>
                <th scope="col">Input tok</th>
                <th scope="col">Request</th>
                <th scope="col">Monthly</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.model.id} className={i === 0 ? 'best' : undefined}>
                  <td>
                    <div className="compare-model">
                      <strong>{r.model.name}</strong>
                      <span>{providers[r.model.providerId].name}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`accuracy-badge accuracy-${r.tokens.accuracy}`}
                    >
                      {r.tokens.accuracyLabel}
                    </span>
                  </td>
                  <td>{r.tokens.tokens.toLocaleString()}</td>
                  <td>{formatUsd(r.cost.totalCost, 6)}</td>
                  <td>{formatUsd(r.monthlyCost, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="compare-empty">Select at least one model to compare.</p>
      )}
    </section>
  )
}
