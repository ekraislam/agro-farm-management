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

// Hide the loading splash screen after React first renders
// Uses requestIdleCallback so it doesn't block the first meaningful paint
const hideLoading = () => {
  if (typeof window !== 'undefined' && typeof window.__hideAppLoading === 'function') {
    window.__hideAppLoading()
  }
}

if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(hideLoading, { timeout: 2000 })
} else {
  setTimeout(hideLoading, 100)
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    __hideAppLoading?: () => void
  }
}
