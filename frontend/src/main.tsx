import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Theme bootstrap: apply saved theme globally before app renders
const applyTheme = (theme: string) => {
  const root = document.documentElement
  if (theme === 'light') {
    root.classList.remove('dark')
  } else if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (isDark) root.classList.add('dark')
    else root.classList.remove('dark')
  }
}

let cleanupSystemListener: (() => void) | null = null
const configureTheme = () => {
  const theme = localStorage.getItem('theme') || 'system'
  // Always apply immediately
  applyTheme(theme)
  // Manage system listener based on preference
  if (cleanupSystemListener) {
    cleanupSystemListener()
    cleanupSystemListener = null
  }
  if (theme === 'system') {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => {
      document.documentElement.classList.toggle('dark', mql.matches)
    }
    mql.addEventListener('change', update)
    cleanupSystemListener = () => mql.removeEventListener('change', update)
    update()
  }
}

// Initial apply before rendering
configureTheme()

// Respond to cross-tab changes
window.addEventListener('storage', (e) => {
  if (e.key === 'theme') configureTheme()
})

// Respond to in-tab saves (custom event dispatched by Settings page)
window.addEventListener('themechange', () => {
  configureTheme()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
