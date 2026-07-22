import { CalculatorPanel } from '../components/CalculatorPanel'
import { PageMeta } from '../components/PageMeta'
import { SITE_URL } from '../config/site'

/** Minimal chrome for WordPress iframe embeds. */
export function EmbedPage() {
  return (
    <div className="embed-shell">
      <PageMeta
        title="TokenCALC Embed"
        description="Embeddable TokenCALC calculator for WordPress and partner sites."
        path="/embed"
        noIndex
      />
      <p className="embed-bar">
        <a href={SITE_URL} target="_blank" rel="noopener noreferrer">
          Open full TokenCALC
        </a>
      </p>
      <CalculatorPanel />
    </div>
  )
}
