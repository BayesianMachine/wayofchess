import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './app/App'
import './index.css'

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
const cleanPath = window.location.pathname
if (
  !window.location.hash &&
  cleanPath !== `${basePath}/` &&
  cleanPath.startsWith(`${basePath}/`)
) {
  const route = cleanPath.slice(basePath.length)
  window.location.replace(`${basePath}/#${route}${window.location.search}`)
} else {
  document.documentElement.dataset.appVersion =
    import.meta.env.VITE_APP_VERSION ?? 'development'
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  )
}
