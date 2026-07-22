import { Link, useParams } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { providers } from '../data'
import { comparePath, modelPath } from '../content/routes'
import {
  estimateCost,
  formatPerMillion,
  formatUsd,
  getModelBySlug,
} from '../lib/pricing'
import { accuracyForFamily, countTokensForModel } from '../lib/tokenize'

const SAMPLE =
  'Estimate the monthly cost of a support chatbot that answers product questions with short replies.'

export function ComparePage() {
  const { pair } = useParams()
  const [slugA, slugB] = (pair ?? '').split('-vs-')
  const a = getModelBySlug(slugA)
  const b = getModelBySlug(slugB)

  if (!a || !b) {
    return (
      <header className="page-hero">
        <h1>Comparison not found</h1>
        <p>
          Use the format <code>/compare/model-a-vs-model-b</code>.{' '}
          <Link to="/providers">Browse models</Link>
        </p>
      </header>
    )
  }

  const out = 512
  const row = (slug: typeof a) => {
    const tokens = countTokensForModel(SAMPLE, slug)
    const cost = estimateCost(slug, {
      inputTokens: tokens.tokens,
      outputTokens: out,
    })
    return { tokens, cost }
  }
  const ra = row(a)
  const rb = row(b)

  return (
    <>
      <PageMeta
        title={`${a.name} vs ${b.name} — Token Cost Compare`}
        description={`Compare ${a.name} and ${b.name} API pricing and token counts. ${formatPerMillion(a.pricing.inputPerMillion)} vs ${formatPerMillion(b.pricing.inputPerMillion)} input.`}
        path={comparePath(a.slug, b.slug)}
      />
      <header className="page-hero">
        <p className="eyebrow">
          <Link to="/">Home</Link> / Compare
        </p>
        <h1>
          {a.name} vs {b.name}
        </h1>
        <p>
          Sample workload: short support reply (~{out} output tokens). Open the{' '}
          <Link to="/cost-calculator">calculator</Link> for your own prompt.
        </p>
      </header>

      <div className="compare-scroll">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">Field</th>
              <th scope="col">{a.name}</th>
              <th scope="col">{b.name}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Provider</td>
              <td>{providers[a.providerId].name}</td>
              <td>{providers[b.providerId].name}</td>
            </tr>
            <tr>
              <td>Accuracy</td>
              <td>{accuracyForFamily(a.tokenizer) === 'exact' ? 'Exact' : 'Approx'}</td>
              <td>{accuracyForFamily(b.tokenizer) === 'exact' ? 'Exact' : 'Approx'}</td>
            </tr>
            <tr>
              <td>Input / 1M</td>
              <td>{formatPerMillion(a.pricing.inputPerMillion)}</td>
              <td>{formatPerMillion(b.pricing.inputPerMillion)}</td>
            </tr>
            <tr>
              <td>Output / 1M</td>
              <td>{formatPerMillion(a.pricing.outputPerMillion)}</td>
              <td>{formatPerMillion(b.pricing.outputPerMillion)}</td>
            </tr>
            <tr>
              <td>Sample input tokens</td>
              <td>{ra.tokens.tokens.toLocaleString()}</td>
              <td>{rb.tokens.tokens.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Sample request cost</td>
              <td>{formatUsd(ra.cost.totalCost, 6)}</td>
              <td>{formatUsd(rb.cost.totalCost, 6)}</td>
            </tr>
            <tr>
              <td>Pages</td>
              <td>
                <Link to={modelPath(a.providerId, a.slug)}>Model page</Link>
              </td>
              <td>
                <Link to={modelPath(b.providerId, b.slug)}>Model page</Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
