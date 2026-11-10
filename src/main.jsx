import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/inter'
import './styles.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import { ToastProvider } from './components.jsx'
import { initPwa } from './pwa/pwa.js'

initPwa()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
