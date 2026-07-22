import { Link, useParams } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { getGuide, guides } from '../content/guides'
import { guidePath } from '../content/routes'
import { pricingChangelog } from '../data'

export function GuidesIndexPage() {
  return (
    <>
      <PageMeta
        title="Guides — Tokenization, Context & Prompt Cost"
        description="Learn tokenization, context windows, and prompt cost math. Each guide links back to the TokenCALC calculator."
        path="/guides"
      />
      <header className="page-hero">
        <p className="eyebrow">
          <Link to="/">Home</Link> / Guides
        </p>
        <h1>Guides</h1>
        <p>Practical explainers that feed the same calculator you use above.</p>
      </header>
      <ul className="hub-list">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link to={guidePath(g.slug)}>
              <strong>{g.title}</strong>
              <span>{g.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

export function GuidePage() {
  const { slug } = useParams()
  const guide = getGuide(slug ?? '')

  if (!guide) {
    return (
      <header className="page-hero">
        <h1>Guide not found</h1>
        <p>
          <Link to="/guides">All guides</Link>
        </p>
      </header>
    )
  }

  return (
    <>
      <PageMeta
        title={guide.title}
        description={guide.description}
        path={guidePath(guide.slug)}
      />
      <header className="page-hero">
        <p className="eyebrow">
          <Link to="/">Home</Link> / <Link to="/guides">Guides</Link> /{' '}
          {guide.title}
        </p>
        <h1>{guide.title}</h1>
        <p>{guide.description}</p>
      </header>
      {guide.sections.map((s) => (
        <section key={s.heading} className="page-panel">
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
        </section>
      ))}
      <section className="page-panel">
        <h2>Try it</h2>
        <p>{guide.calcHint}</p>
        <p>
          <Link to="/cost-calculator">Open cost calculator</Link>
          {' · '}
          <Link to="/tokenizer">Open tokenizer</Link>
        </p>
      </section>
    </>
  )
}

export function ChangelogPage() {
  return (
    <>
      <PageMeta
        title="Pricing Changelog"
        description="Manual pricing catalog updates for TokenCALC — verification dates and curated rate changes, not scraped live sync."
        path="/changelog"
      />
      <header className="page-hero">
        <p className="eyebrow">
          <Link to="/">Home</Link> / Changelog
        </p>
        <h1>Pricing changelog</h1>
        <p>
          We sync from official provider docs via a weekly script, then review
          rates in a PR before merge. Each model keeps a lastVerified stamp —
          not a fake live streaming API.
        </p>
      </header>
      <ol className="changelog-list">
        {pricingChangelog.map((entry) => (
          <li key={`${entry.date}-${entry.summary.slice(0, 24)}`}>
            <time dateTime={entry.date}>{entry.date}</time>
            <p>{entry.summary}</p>
          </li>
        ))}
      </ol>
    </>
  )
}

export function NotFoundPage() {
  return (
    <>
      <PageMeta
        title="Page not found"
        description="That TokenCALC page does not exist."
        path="/404"
      />
      <header className="page-hero">
        <h1>Page not found</h1>
        <p>
          <Link to="/">Back to calculator</Link>
        </p>
      </header>
    </>
  )
}
