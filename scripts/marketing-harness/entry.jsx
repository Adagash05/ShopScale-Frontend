import React from 'react'
import fs from 'node:fs'
import path from 'node:path'
import { renderToString } from 'react-dom/server'
import MarketingLayout from '../../src/marketing/MarketingLayout.jsx'
import * as P from '../../src/marketing/Pages.jsx'
import Pricing from '../../src/pages/Pricing.jsx'

const pages = { '/': P.HomePage, '/features': P.FeaturesPage, '/pricing': Pricing, '/industries': P.IndustriesPage, '/retail': P.RetailPage, '/wholesale': P.WholesalePage, '/online-selling': P.OnlineSellingPage, '/faq': P.FaqPage }
const out = process.argv[2] || '/tmp/mk-pages'
fs.mkdirSync(out, { recursive: true })
const index = {}
for (const [p, C] of Object.entries(pages)) {
  globalThis.__PATH = p
  globalThis.__PAGE = React.createElement(C)
  const body = renderToString(React.createElement(MarketingLayout))
  const name = p === '/' ? 'home' : p.slice(1)
  fs.writeFileSync(path.join(out, name + '.body.html'), body)
  index[p] = name
}
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(index))
console.log('rendered', Object.keys(index).length, 'pages to', out)
