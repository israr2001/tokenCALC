export interface GuideDoc {
  slug: string
  title: string
  description: string
  /** Optional calculator hash prefills (share-state style) are step-6 compatible later. */
  calcHint: string
  sections: Array<{ heading: string; body: string }>
}

export const guides: GuideDoc[] = [
  {
    slug: 'tokenization',
    title: 'What is tokenization?',
    description:
      'How LLMs split text into tokens, why counts differ by model family, and how TokenCALC labels Exact vs Approx.',
    calcHint: 'Paste a prompt on the calculator to see Exact or Approx counts for your model.',
    sections: [
      {
        heading: 'Tokens are not words',
        body: 'Models break text into tokens — pieces that may be whole words, subwords, punctuation, or spaces. English often averages ~4 characters per token, but code, URLs, and non-English text can differ a lot.',
      },
      {
        heading: 'Why providers disagree',
        body: 'OpenAI, Anthropic, Google, and others use different vocabularies. The same paragraph can produce different token counts across providers. That is why TokenCALC shows Exact only when we run a matching browser tokenizer.',
      },
      {
        heading: 'Exact vs Approx on TokenCALC',
        body: 'Exact means we use gpt-tokenizer with an OpenAI encoding such as o200k_base. Approx means the provider tokenizer is not available in-browser, so we use a labeled heuristic instead of pretending the number is exact.',
      },
    ],
  },
  {
    slug: 'context-windows',
    title: 'Context windows and overflow',
    description:
      'Understand context limits, why input plus output matter, and how TokenCALC warns when you approach the ceiling.',
    calcHint: 'Watch the context meter on the calculator — tight at 85% and overflow when you exceed the window.',
    sections: [
      {
        heading: 'What the window includes',
        body: 'A context window is the maximum tokens a model can consider in one request. System prompts, tools, chat history, your input, and the model’s output all compete for that budget.',
      },
      {
        heading: 'Overflow is a hard fail',
        body: 'If input and planned output exceed the window, the API may reject the request or truncate. TokenCALC warns early so you can shorten prompts or pick a larger-context model.',
      },
      {
        heading: 'Long-context pricing tiers',
        body: 'Some models (notably certain Gemini tiers) charge more once a prompt crosses a threshold such as 200K tokens. The calculator applies those published long-context rates when your input crosses the line.',
      },
    ],
  },
  {
    slug: 'prompt-cost',
    title: 'How prompt cost is calculated',
    description:
      'Break down input vs output pricing, cache hits, batch discounts, and monthly projections for LLM budgets.',
    calcHint: 'Set output size, cache hit %, and users × messages/day to project monthly spend.',
    sections: [
      {
        heading: 'Input and output are priced separately',
        body: 'Providers publish USD per million input tokens and per million output tokens. Output is usually more expensive. Your request cost is roughly (input_tokens × input_rate + output_tokens × output_rate) / 1,000,000.',
      },
      {
        heading: 'Cache and batch',
        body: 'Prompt caching discounts repeated prefixes. Batch APIs often price around half of standard rates with higher latency. TokenCALC only enables these controls when the catalog has published rates for that model.',
      },
      {
        heading: 'From one request to a monthly budget',
        body: 'Multiply per-request cost by users and messages per day to estimate daily, monthly, and yearly spend. Compare models on the same workload before you commit.',
      },
    ],
  },
]

export function getGuide(slug: string): GuideDoc | undefined {
  return guides.find((g) => g.slug === slug)
}
