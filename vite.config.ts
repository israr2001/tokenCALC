import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function htmlSiteUrlPlugin(siteUrl: string): Plugin {
  const origin = siteUrl.replace(/\/$/, '')
  return {
    name: 'html-site-url',
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', origin)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_SITE_URL || 'https://tools.example.com').replace(
    /\/$/,
    '',
  )

  return {
    plugins: [react(), htmlSiteUrlPlugin(siteUrl)],
  }
})
