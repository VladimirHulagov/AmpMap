import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './shared/styles/colors.css'
import './shared/styles/variables.css'
import './shared/styles/variables-dark.css'
import './shared/styles/global.css'
import './shared/styles/antd-override.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)