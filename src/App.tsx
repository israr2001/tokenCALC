import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ComparePage } from './pages/ComparePage'
import { EmbedPage } from './pages/EmbedPage'
import {
  ChangelogPage,
  GuidePage,
  GuidesIndexPage,
  NotFoundPage,
} from './pages/GuidesPages'
import { HomePage } from './pages/HomePage'
import { HtmlSitemapPage } from './pages/HtmlSitemapPage'
import { ModelPage } from './pages/ModelPage'
import { ProviderPage, ProvidersIndexPage } from './pages/ProviderPages'
import { CostCalculatorPage, TokenizerPage } from './pages/ToolAliasPages'
import {
  BatchPricingPage,
  CacheSavingsPage,
  TokensToWordsPage,
} from './pages/ToolPages'

function ProviderRoute() {
  const { providerId = '' } = useParams()
  return <ProviderPage providerId={providerId} />
}

function ModelRoute() {
  const { providerId = '', slug = '' } = useParams()
  return <ModelPage providerId={providerId} slug={slug} />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="embed" element={<EmbedPage />} />
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="tokenizer" element={<TokenizerPage />} />
          <Route path="cost-calculator" element={<CostCalculatorPage />} />
          <Route path="providers" element={<ProvidersIndexPage />} />
          <Route path="providers/:providerId" element={<ProviderRoute />} />
          <Route
            path="providers/:providerId/models/:slug"
            element={<ModelRoute />}
          />
          <Route path="compare/:pair" element={<ComparePage />} />
          <Route path="tools/tokens-to-words" element={<TokensToWordsPage />} />
          <Route path="tools/batch-pricing" element={<BatchPricingPage />} />
          <Route path="tools/cache-savings" element={<CacheSavingsPage />} />
          <Route path="guides" element={<GuidesIndexPage />} />
          <Route path="guides/:slug" element={<GuidePage />} />
          <Route path="changelog" element={<ChangelogPage />} />
          <Route path="sitemap" element={<HtmlSitemapPage />} />
          <Route path="grok" element={<Navigate to="/providers/xai" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
