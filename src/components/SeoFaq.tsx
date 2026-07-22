/**
 * Visible FAQ block that mirrors FAQPage JSON-LD for users and crawlers
 * that prefer on-page content alongside structured data.
 */
const FAQS = [
  {
    q: 'Does TokenCALC send my text to a server?',
    a: 'No. Tokenization and cost estimates run in your browser. Your prompt text is not uploaded to TokenCALC servers.',
  },
  {
    q: 'What do Exact and Approx mean?',
    a: 'Exact uses a matching OpenAI tokenizer encoding in the browser. Approx means the provider tokenizer is not available in-browser, so we use a labeled heuristic instead of faking precision.',
  },
  {
    q: 'Are the API prices live?',
    a: 'Prices are curated from official provider docs (with a weekly sync script + PR review). Each model has a lastVerified date and link to the official page — we do not pretend rates are a live streaming API.',
  },
  {
    q: 'Can I project monthly LLM spend?',
    a: 'Yes. Set active users and messages per user per day to project daily, monthly, and yearly cost from your per-request estimate — including cache and batch when published.',
  },
] as const

export function SeoFaq() {
  return (
    <section className="seo-faq" aria-labelledby="faq-heading">
      <h2 id="faq-heading">FAQ</h2>
      <dl>
        {FAQS.map((item) => (
          <div key={item.q} className="faq-item">
            <dt>{item.q}</dt>
            <dd>{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
