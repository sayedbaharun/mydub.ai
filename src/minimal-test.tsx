import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'blue' }}>MyDub.AI Test - Port 4000</h1>
      <p>If you see this, React is working!</p>
      <div style={{ background: '#f0f0f0', padding: '10px', marginTop: '10px' }}>
        <p>Environment check:</p>
        <ul>
          <li>Node env: {import.meta.env.MODE}</li>
          <li>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'}</li>
          <li>Port: 4000</li>
        </ul>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)