import { Link, NavLink, Outlet } from 'react-router-dom'
import { BLOG_URL } from '../config/site'
import { catalogStats } from '../lib/pricing'

export function Layout() {
  const stats = catalogStats()

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-nav" role="banner">
        <Link to="/" className="nav-brand">
          TokenCALC
        </Link>
        <nav aria-label="Primary">
          <NavLink to="/" end>
            Calculator
          </NavLink>
          <NavLink to="/providers">Providers</NavLink>
          <NavLink to="/guides">Guides</NavLink>
          <NavLink to="/tools/tokens-to-words">Tools</NavLink>
          <NavLink to="/changelog">Changelog</NavLink>
          <a href={BLOG_URL} rel="noopener noreferrer">
            Blog
          </a>
        </nav>
      </header>

      <main id="main" className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>
          TokenCALC · {stats.modelCount} models · last verified{' '}
          <time dateTime={stats.newestVerified ?? undefined}>
            {stats.newestVerified}
          </time>
          {' · '}
          <a href={BLOG_URL} rel="noopener noreferrer">
            WordPress blog
          </a>
          {' · '}
          <Link to="/changelog">changelog</Link>
          {' · '}
          <Link to="/sitemap">sitemap</Link>
          {' · '}
          <a href="/sitemap.xml">sitemap.xml</a>
        </p>
      </footer>
    </div>
  )
}
