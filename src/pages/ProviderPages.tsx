import { Link } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { providerList, providers } from '../data'
import { getModelsByProvider } from '../lib/pricing'
import { modelPath, providerPath } from '../content/routes'

export function ProvidersIndexPage() {
  return (
    <>
      <PageMeta
        title="LLM Providers — Pricing & Models"
        description="Browse OpenAI, Anthropic, Google, DeepSeek, xAI, Mistral, and Groq models with curated API prices and official source links."
        path="/providers"
      />
      <header className="page-hero">
        <p className="eyebrow">
          <Link to="/">Home</Link> / Providers
        </p>
        <h1>Providers</h1>
        <p>
          Each provider page lists curated models, Exact/Approx tokenizer
          labels, and links to official pricing.
        </p>
      </header>
      <ul className="hub-list">
        {providerList.map((p) => {
          const count = getModelsByProvider(p.id).length
          return (
            <li key={p.id}>
              <Link to={providerPath(p.id)}>
                <strong>{p.name}</strong>
                <span>{count} models</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}

export function ProviderPage({ providerId }: { providerId: string }) {
  const provider = providers[providerId as keyof typeof providers]
  if (!provider) {
    return <NotFoundInline />
  }

  const models = getModelsByProvider(provider.id)

  return (
    <>
      <PageMeta
        title={`${provider.name} Token Calculator & API Pricing`}
        description={`Estimate ${provider.name} token counts and API costs. Curated model prices with lastVerified dates and official sources.`}
        path={providerPath(provider.id)}
      />
      <header className="page-hero">
        <p className="eyebrow">
          <Link to="/">Home</Link> / <Link to="/providers">Providers</Link> /{' '}
          {provider.name}
        </p>
        <h1>{provider.name} models</h1>
        <p>
          Curated catalog for {provider.name}. Open the{' '}
          <Link to="/cost-calculator">cost calculator</Link> to estimate spend,
          or read official rates on their{' '}
          <a href={provider.sourceUrl} target="_blank" rel="noopener noreferrer">
            pricing page
          </a>
          .
        </p>
      </header>
      <ul className="hub-list">
        {models.map((m) => (
          <li key={m.id}>
            <Link to={modelPath(m.providerId, m.slug)}>
              <strong>{m.name}</strong>
              <span>
                ${m.pricing.inputPerMillion}/1M in · $
                {m.pricing.outputPerMillion}/1M out
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

function NotFoundInline() {
  return (
    <header className="page-hero">
      <h1>Provider not found</h1>
      <p>
        <Link to="/providers">Back to providers</Link>
      </p>
    </header>
  )
}
