import React from 'react'
import { renderToString } from 'react-dom/server'
import { ContactPage } from '../../src/marketing/Pages.jsx'
import MarketingLayout from '../../src/marketing/MarketingLayout.jsx'
const html = (el) => renderToString(el).replace(/<!-- -->/g, '')
let fail = 0
const ok = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) fail++ }
const c = html(<ContactPage />)
ok('contact: Email Support heading, mailto link and address', c.includes('Email Support') && c.includes('href="mailto:support@shopscale.com.ng"'))
ok('contact: WhatsApp Support heading and wa.me link', c.includes('WhatsApp Support') && c.includes('href="https://wa.me/2349122609070"'))
ok('contact: email section comes before WhatsApp', c.indexOf('Email Support') < c.indexOf('WhatsApp Support'))
ok('contact: no tel links, no call wording, no backup labels', !/tel:|Call us|Call:|backup|secondary support/i.test(c))
const l = html(<MarketingLayout><i /></MarketingLayout>)
ok('footer: shows support email', l.includes('mailto:support@shopscale.com.ng'))
ok('footer: no tel links', !l.includes('tel:'))
process.exit(fail ? 1 : 0)
