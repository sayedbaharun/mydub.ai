import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TestComponent } from '@/shared/components/TestComponent'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TestComponent />
  </StrictMode>,
)