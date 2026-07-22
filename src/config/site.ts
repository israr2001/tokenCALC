/**
 * Subdomain app + WordPress blog architecture:
 *   VITE_SITE_URL  = https://tools.yourdomain.com  (this React app)
 *   VITE_BLOG_URL  = https://yourdomain.com         (WordPress)
 *
 * Copy to `.env` and replace yourdomain.com before deploy.
 */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || 'https://tools.example.com'
).replace(/\/$/, '')

export const BLOG_URL = (
  import.meta.env.VITE_BLOG_URL || 'https://example.com'
).replace(/\/$/, '')

export const SITE_NAME = 'TokenCALC'

export const SITE_TITLE =
  'AI Token Calculator & LLM Cost Estimator | TokenCALC'

export const SITE_DESCRIPTION =
  'Free privacy-first AI token calculator. Count tokens Exactly or Approximatively, estimate API costs across OpenAI, Anthropic, Google, DeepSeek, and more — text stays in your browser.'

export const SITE_KEYWORDS = [
  'token calculator',
  'AI token counter',
  'LLM cost estimator',
  'OpenAI token calculator',
  'Claude token calculator',
  'Gemini token calculator',
  'API pricing calculator',
].join(', ')

export const OG_IMAGE_URL = `${SITE_URL}/og.svg`
