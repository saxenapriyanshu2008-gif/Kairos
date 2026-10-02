import React from 'react'
import ReactDOM from 'react-dom/client'
// Self-hosted variable fonts (no external requests, no layout shift from late font swaps)
import '@fontsource-variable/bodoni-moda/wght.css'
import '@fontsource-variable/bodoni-moda/wght-italic.css'
import '@fontsource-variable/manrope/wght.css'
import './styles.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
