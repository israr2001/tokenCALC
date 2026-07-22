import { Link } from 'react-router-dom'
import { CalculatorPanel } from '../components/CalculatorPanel'
import { CatalogPanel } from '../components/CatalogPanel'
import { PageMeta } from '../components/PageMeta'
import { PrivacyTrust } from '../components/PrivacyTrust'
import { SeoFaq } from '../components/SeoFaq'
import { SITE_DESCRIPTION, SITE_TITLE } from '../config/site'
import { catalogStats } from '../lib/pricing'

export function HomePage() {
  const stats = catalogStats()

  return (
    <>
      <PageMeta title={SITE_TITLE} description={SITE_DESCRIPTION} path="/" />
      <header className="hero">
        <p className="brand">TokenCALC</p>
        <h1>AI token &amp; cost calculator</h1>
        <p className="lede">{SITE_DESCRIPTION}</p>
        <p className="hero-meta">
          {stats.modelCount} models · {stats.providerCount} providers · text
          never leaves this browser
        </p>
        <p className="hero-links">
          <Link to="/tokenizer">Tokenizer</Link>
          {' · '}
          <Link to="/cost-calculator">Cost calculator</Link>
          {' · '}
          <Link to="/providers">Providers</Link>
          {' · '}
          <Link to="/guides">Guides</Link>
        </p>
      </header>

      <CalculatorPanel />
      <CatalogPanel />
      <PrivacyTrust />
      <SeoFaq />
    </>
  )
}
