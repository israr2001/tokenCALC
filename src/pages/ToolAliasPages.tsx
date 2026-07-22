import { Link } from 'react-router-dom'
import { CalculatorPanel } from '../components/CalculatorPanel'
import { PageMeta } from '../components/PageMeta'

export function TokenizerPage() {
  return (
    <>
      <PageMeta
        title="AI Tokenizer — Exact & Approx Token Counter"
        description="Count LLM tokens in your browser. Exact OpenAI encodings with honest Approx labels for other providers. Text stays local."
        path="/tokenizer"
      />
      <header className="page-hero">
        <p className="eyebrow">
          <Link to="/">Home</Link> / Tokenizer
        </p>
        <h1>AI tokenizer</h1>
        <p>
          Paste text and pick a model. Exact counts use OpenAI encodings
          in-browser; other providers are clearly labeled Approx.
        </p>
      </header>
      <CalculatorPanel />
    </>
  )
}

export function CostCalculatorPage() {
  return (
    <>
      <PageMeta
        title="LLM Cost Calculator — API Pricing Estimator"
        description="Estimate LLM API cost with cache, batch, and monthly projections. Curated prices with verification dates. Privacy-first."
        path="/cost-calculator"
      />
      <header className="page-hero">
        <p className="eyebrow">
          <Link to="/">Home</Link> / Cost calculator
        </p>
        <h1>LLM cost calculator</h1>
        <p>
          Project request and monthly spend across providers. Tune cache hit %,
          Batch API, and users × messages per day.
        </p>
      </header>
      <CalculatorPanel />
    </>
  )
}
