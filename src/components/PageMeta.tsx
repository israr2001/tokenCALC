import { useEffect } from 'react'
import { OG_IMAGE_URL, SITE_NAME, SITE_URL } from '../config/site'

interface PageMetaProps {
  title: string
  description: string
  path: string
  noIndex?: boolean
}

export function PageMeta({
  title,
  description,
  path,
  noIndex = false,
}: PageMetaProps) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
    document.title = fullTitle

    const canonicalHref =
      path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`

    setMeta('name', 'description', description)
    setMeta('name', 'robots', noIndex ? 'noindex,follow' : 'index, follow')
    setLink('canonical', canonicalHref)

    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonicalHref)
    setMeta('property', 'og:image', OG_IMAGE_URL)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', SITE_NAME)

    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', OG_IMAGE_URL)
  }, [title, description, path, noIndex])

  return null
}

function setMeta(
  attr: 'name' | 'property',
  key: string,
  content: string,
): void {
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string): void {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}
