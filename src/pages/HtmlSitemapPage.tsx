import { Link } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { guides } from '../content/guides'
import {
  featuredCompares,
  guidePath,
  listSitemapPaths,
  modelPath,
  providerPath,
} from '../content/routes'
import { providerList } from '../data'
import { listActiveModels } from '../lib/pricing'

/** Crawlable HTML index of important URLs (complements sitemap.xml). */
export function HtmlSitemapPage() {
  const models = listActiveModels()
  const paths = listSitemapPaths()

  return (
    <>
      <PageMeta
        title="HTML Sitemap"
        description="Browse all TokenCALC calculator, provider, model, compare, tool, and guide pages."
        path="/sitemap"
      />
      <header className="page-hero">
        <p className="eyebrow">
          <Link to="/">Home</Link> / Sitemap
        </p>
        <h1>Sitemap</h1>
        <p>
          {paths.length} indexed routes. Also see{' '}
          <a href="/sitemap.xml">sitemap.xml</a> for crawlers.
        </p>
      </header>

      <section className="page-panel">
        <h2>Core</h2>
        <ul className="plain-links">
          <li>
            <Link to="/">Calculator</Link>
          </li>
          <li>
            <Link to="/tokenizer">Tokenizer</Link>
          </li>
          <li>
            <Link to="/cost-calculator">Cost calculator</Link>
          </li>
          <li>
            <Link to="/changelog">Changelog</Link>
          </li>
        </ul>
      </section>

      <section className="page-panel">
        <h2>Providers</h2>
        <ul className="plain-links">
          {providerList.map((p) => (
            <li key={p.id}>
              <Link to={providerPath(p.id)}>{p.name}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="page-panel">
        <h2>Models</h2>
        <ul className="plain-links">
          {models.map((m) => (
            <li key={m.id}>
              <Link to={modelPath(m.providerId, m.slug)}>{m.name}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="page-panel">
        <h2>Compare</h2>
        <ul className="plain-links">
          {featuredCompares.map(([a, b]) => (
            <li key={`${a}-${b}`}>
              <Link to={`/compare/${a}-vs-${b}`}>
                {a} vs {b}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="page-panel">
        <h2>Guides &amp; tools</h2>
        <ul className="plain-links">
          {guides.map((g) => (
            <li key={g.slug}>
              <Link to={guidePath(g.slug)}>{g.title}</Link>
            </li>
          ))}
          <li>
            <Link to="/tools/tokens-to-words">Tokens ↔ words</Link>
          </li>
          <li>
            <Link to="/tools/batch-pricing">Batch pricing</Link>
          </li>
          <li>
            <Link to="/tools/cache-savings">Cache savings</Link>
          </li>
        </ul>
      </section>
    </>
  )
}
