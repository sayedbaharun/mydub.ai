import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface UseAuthRedirectOptions {
  redirectTo?: string
  redirectIf?: 'authenticated' | 'unauthenticated'
  preserveQuery?: boolean
}

export function useAuthRedirect({
  redirectTo = '/',
  redirectIf = 'authenticated',
  preserveQuery = false,
}: UseAuthRedirectOptions = {}) {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isLoading) return

    const shouldRedirect = 
      (redirectIf === 'authenticated' && isAuthenticated) ||
      (redirectIf === 'unauthenticated' && !isAuthenticated)

    if (shouldRedirect) {
      const destination = preserveQuery 
        ? `${redirectTo}${location.search}`
        : redirectTo

      navigate(destination, { replace: true })
    }
  }, [isAuthenticated, isLoading, redirectIf, redirectTo, navigate, location, preserveQuery])

  return { isLoading, isAuthenticated }
}

// Hook to get the redirect URL from location state
export function useRedirectUrl(defaultUrl = '/') {
  const location = useLocation()
  const from = location.state?.from?.pathname || defaultUrl
  
  return from
}