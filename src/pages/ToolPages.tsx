import { Link } from 'react-router-dom'
import { useDeferredValue, useId, useState } from 'react'
import { PageMeta } from '../components/PageMeta'
import { approximateTokenCount, countCharacters, countWords } from '../lib/tokenize'

export function TokensToWordsPage() {
  const [text, setText] = useState(
    'Convert between rough word counts and approximate tokens for budgeting.',
  )
  const deferred = useDeferredValue(text)
  const id = useId()
  const words = countWords(deferred)
  const chars = countCharacters(deferred)
  const tokens = approximateTokenCount(deferred)

  return (
    <>
      <PageMeta
        title="Tokens to Words Converter"
        description="Rough converter between words, characters, and approximate tokens for LLM budgeting. Pair with Exact counts on OpenAI models in the calculator."
        path="/tools/tokens-to-words"
      />
      <header className="page-hero">
        <p className="eyebrow">
          <Link to="/">Home</Link> / Tools / Tokens ↔ words
        </p>
        <h1>Tokens to words</h1>
        <p>
          Quick Approx heuristic (~4 chars/token). For Exact OpenAI counts, use
          the <Link to="/tokenizer">tokenizer</Link>.
        </p>
      </header>
      <section className="page-panel">
        <label className="field-label" htmlFor={id}>
          Text
        </label>
        <textarea
          id={id}
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <dl className="detail-grid">
          <div>
            <dt>Words</dt>
            <dd>{words.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Characters</dt>
            <dd>{chars.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Approx tokens</dt>
            <dd>{tokens.toLocaleString()}</dd>
          </div>
        </dl>
      </section>
    </>
  )
}

export function BatchPricingPage() {
  return (
    <>
      <PageMeta
        title="LLM Batch Pricing Explained"
        description="How Batch API discounts affect LLM cost. Use TokenCALC’s batch toggle when a model publishes batch rates."
        path="/tools/batch-pricing"
      />
      <header className="page-hero">
        <p className="eyebrow">
          <Link to="/">Home</Link> / Tools / Batch pricing
        </p>
        <h1>Batch pricing</h1>
        <p>
          Many providers offer Batch APIs at roughly half standard rates with
          higher latency. TokenCALC enables the Batch toggle only when the
          catalog has published batch prices for that model.
        </p>
      </header>
      <section className="page-panel">
        <h2>When to use batch</h2>
        <p>
          Good for offline evaluation, report generation, and non-interactive
          jobs. Skip it for chat UIs that need low latency.
        </p>
        <p>
          <Link to="/cost-calculator">Try batch on the calculator</Link>
          {' · '}
          <Link to="/guides/prompt-cost">Prompt cost guide</Link>
        </p>
      </section>
    </>
  )
}

export function CacheSavingsPage() {
  return (
    <>
      <PageMeta
        title="Prompt Cache Savings Calculator"
        description="Understand prompt cache hit rates and how they reduce LLM input cost. Model the cache % slider on TokenCALC."
        path="/tools/cache-savings"
      />
      <header className="page-hero">
        <p className="eyebrow">
          <Link to="/">Home</Link> / Tools / Cache savings
        </p>
        <h1>Cache savings</h1>
        <p>
          Prompt caching discounts repeated prefixes. Move the cache hit slider
          on the calculator when a model publishes cached-input rates.
        </p>
      </header>
      <section className="page-panel">
        <h2>How TokenCALC models it</h2>
        <p>
          A portion of input tokens is billed at the cached rate; the rest at
          standard input. We show savings versus a no-cache baseline.
        </p>
        <p>
          <Link to="/cost-calculator">Open calculator</Link>
          {' · '}
          <Link to="/guides/prompt-cost">Prompt cost guide</Link>
        </p>
      </section>
    </>
  )
}
