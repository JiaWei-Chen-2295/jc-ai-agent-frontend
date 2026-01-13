import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import { AppProviders } from './providers/AppProviders'
import { router } from './routes/router'
import './styles/global.css'

const rootElement = document.getElementById('app')

if (!rootElement) {
  throw new Error('Root container #app not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>,
)
