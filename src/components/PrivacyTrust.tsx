const TRUST_POINTS = [
  {
    title: 'Text stays local',
    body: 'Prompts are tokenized in your browser. We do not upload your text to a server.',
  },
  {
    title: 'Honest Exact / Approx',
    body: 'OpenAI encodings are Exact via gpt-tokenizer. Other providers are labeled Approx — never silently faked.',
  },
  {
    title: 'Curated prices',
    body: 'Rates are manually verified against official pages with lastVerified dates and outbound source links. No scrape theater.',
  },
  {
    title: 'Share without a backend',
    body: 'Estimate state lives in the URL hash on your device. Nothing is stored in our database — there isn’t one for your prompts.',
  },
] as const

export function PrivacyTrust() {
  return (
    <section className="trust" aria-labelledby="trust-heading">
      <div className="trust-head">
        <h2 id="trust-heading">Privacy &amp; trust</h2>
        <p>
          Built as a privacy-first cost workstation — accuracy labels and local
          processing are product features, not footnotes.
        </p>
      </div>
      <ul className="trust-list">
        {TRUST_POINTS.map((item) => (
          <li key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
