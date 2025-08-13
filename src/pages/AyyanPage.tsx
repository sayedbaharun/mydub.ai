import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

export default function AyyanPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to chat with Ayyan AI persona selected
    navigate('/chat?ai=ayyan', { replace: true })
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Redirecting to Ayyan AI Assistant...</p>
      </div>
    </div>
  )
}