import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { providerList, providers, type ProviderId } from '../data'
import { modelPath } from '../content/routes'
import {
  formatPerMillion,
  listActiveModels,
  listPricingSources,
} from '../lib/pricing'
import { accuracyForFamily } from '../lib/tokenize'

export function CatalogPanel() {
  const models = listActiveModels()
  const sources = listPricingSources()
  const [providerFilter, setProviderFilter] = useState<ProviderId | 'all'>('all')
  const [query, setQuery] = useState('')
  const filterId = useId()
  const searchId = useId()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return models.filter((m) => {
      if (providerFilter !== 'all' && m.providerId !== providerFilter) return false
      if (!q) return true
      return (
        m.name.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q) ||
        providers[m.providerId].name.toLowerCase().includes(q)
      )
    })
  }, [models, providerFilter, query])

  return (
    <section className="catalog" aria-labelledby="catalog-heading">
      <div className="catalog-head">
        <h2 id="catalog-heading">Pricing catalog</h2>
        <p className="verified">
          {models.length} curated models · {providerList.length} providers ·
          prices checked against official pages (not scraped)
        </p>
      </div>

      <div className="catalog-filters">
        <div className="field">
          <label className="field-label" htmlFor={searchId}>
            Search
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Model or provider…"
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={filterId}>
            Provider
          </label>
          <select
            id={filterId}
            value={providerFilter}
            onChange={(e) =>
              setProviderFilter(e.target.value as ProviderId | 'all')
            }
          >
            <option value="all">All providers</option>
            {providerList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="model-list">
        {filtered.map((model) => {
          const provider = providers[model.providerId]
          const accuracy = accuracyForFamily(model.tokenizer)
          return (
            <li key={model.id}>
              <div className="model-meta">
                <Link
                  className="model-name"
                  to={modelPath(model.providerId, model.slug)}
                >
                  {model.name}
                </Link>
                <span className="model-provider">
                  <Link to={`/providers/${provider.id}`}>{provider.name}</Link>
                  {' · '}
                  <span className={`accuracy-badge accuracy-${accuracy}`}>
                    {accuracy === 'exact' ? 'Exact' : 'Approx'}
                  </span>
                </span>
              </div>
              <div className="model-price">
                <span>in {formatPerMillion(model.pricing.inputPerMillion)}</span>
                <span>
                  out {formatPerMillion(model.pricing.outputPerMillion)}
                </span>
                <a
                  href={model.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  source
                </a>
              </div>
            </li>
          )
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="catalog-empty">No models match that filter.</p>
      )}

      <p className="sources-label">Official pricing sources</p>
      <ul className="sources">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.name}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
