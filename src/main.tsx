import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Hide the loading splash screen immediately after React renders
const hideLoading = () => {
  const el = document.getElementById('app-loading')
  if (el) {
    el.classList.add('hidden')
    setTimeout(() => {
      try { el.remove() } catch (_) {}
    }, 350)
  }
  if (typeof window !== 'undefined' && typeof window.__hideAppLoading === 'function') {
    window.__hideAppLoading()
  }
}

hideLoading()
if (typeof requestAnimationFrame !== 'undefined') {
  requestAnimationFrame(hideLoading)
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    __hideAppLoading?: () => void
  }
}
