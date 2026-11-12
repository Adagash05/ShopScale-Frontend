import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/inter'
import './styles.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import { ToastProvider } from './components.jsx'
import { initPwa } from './pwa/pwa.js'
import { MODE } from './config/env.js'
import { initTheme } from './theme/theme.js'
import { initAnalytics } from './analytics/analytics.js'
import { AnalyticsRouter, ConsentBanner } from './analytics/AnalyticsRouter.jsx'

// The marketing site is a plain website; only the application (and single-origin installs) is a PWA.
if (MODE !== 'public') initPwa()
if (MODE !== 'public') initTheme()
if (MODE !== 'public') {
  const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow'; document.head.appendChild(m)
}
initAnalytics()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
          <AnalyticsRouter />
          <ConsentBanner />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
