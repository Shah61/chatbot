import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
/* Both of the shell's stylesheets load here, before any component pulls in its
   own. Left at the bottom of App.tsx's import list, app.css was emitted as the
   last 2.5 kB of a 67 kB production bundle — the demo chrome was then the first
   thing to lose its styling if anything ever clipped the tail of that file. */
import './index.css'
import './app.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
