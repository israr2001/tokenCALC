import { Link } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { providers } from '../data'
import {
  comparePath,
  featuredCompares,
  modelPath,
  providerPath,
} from '../content/routes'
import {
  formatPerMillion,
  getModelBySlug,
  listActiveModels,
} from '../lib/pricing'
import { accuracyForFamily } from '../lib/tokenize'

export function ModelPage({
  providerId,
  slug,
}: {
  providerId: string
  slug: string
}) {
  const model = getModelBySlug(slug)
  if (!model || model.providerId !== providerId) {
    return (
      <header className="page-hero">
        <h1>Model not found</h1>
        <p>
          <Link to="/providers">Browse providers</Link>
        </p>
      </header>
    )
  }

  const provider = providers[model.providerId]
  const accuracy = accuracyForFamily(model.tokenizer)
  const peers = listActiveModels()
    .filter((m) => m.providerId !== model.providerId)
    .slice(0, 4)

  return (
    <>
      <PageMeta
        title={`${model.name} Token Calculator & Pricing`}
        description={`${model.name} API pricing: ${formatPerMillion(model.pricing.inputPerMillion)} input, ${formatPerMillion(model.pricing.outputPerMillion)} output. Context ${model.contextWindow.toLocaleString()} tokens. Verified ${model.lastVerified}.`}
        path={modelPath(model.providerId, model.slug)}
      />
      <header className="page-hero">
        <p className="eyebrow">
          <Link to="/">Home</Link> /{' '}
          <Link to="/providers">Providers</Link> /{' '}
          <Link to={providerPath(model.providerId)}>{provider.name}</Link> /{' '}
          {model.name}
        </p>
        <h1>{model.name}</h1>
        <p>
          {provider.name} · context {model.contextWindow.toLocaleString()}{' '}
          tokens · tokenizer{' '}
          <span className={`accuracy-badge accuracy-${accuracy}`}>
            {accuracy === 'exact' ? 'Exact' : 'Approx'}
          </span>
        </p>
      </header>

      <section className="page-panel">
        <h2>Pricing</h2>
        <dl className="detail-grid">
          <div>
            <dt>Input</dt>
            <dd>{formatPerMillion(model.pricing.inputPerMillion)}</dd>
          </div>
          <div>
            <dt>Output</dt>
            <dd>{formatPerMillion(model.pricing.outputPerMillion)}</dd>
          </div>
          {model.pricing.cachedInputPerMillion != null && (
            <div>
              <dt>Cached input</dt>
              <dd>{formatPerMillion(model.pricing.cachedInputPerMillion)}</dd>
            </div>
          )}
          <div>
            <dt>Verified</dt>
            <dd>
              <time dateTime={model.lastVerified}>{model.lastVerified}</time>
            </dd>
          </div>
        </dl>
        <p>
          <a href={model.sourceUrl} target="_blank" rel="noopener noreferrer">
            Official pricing source
          </a>
          {' · '}
          <Link to="/cost-calculator">Open calculator</Link>
        </p>
        {model.notes && <p className="muted">{model.notes}</p>}
      </section>

      <section className="page-panel">
        <h2>Compare</h2>
        <ul className="plain-links">
          {peers.map((p) => (
            <li key={p.id}>
              <Link to={comparePath(model.slug, p.slug)}>
                {model.name} vs {p.name}
              </Link>
            </li>
          ))}
          {featuredCompares
            .filter(([a, b]) => a === model.slug || b === model.slug)
            .map(([a, b]) => (
              <li key={`${a}-${b}`}>
                <Link to={comparePath(a, b)}>
                  Featured: {a} vs {b}
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </>
  )
}
