import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth, useRole } from '@/features/auth/context/AuthContext'
import { LoadingSpinner } from './LoadingSpinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { ShieldAlert } from 'lucide-react'

interface ProtectedRouteProps {
  roles?: string[]
  redirectTo?: string
  children?: React.ReactNode
}

export function ProtectedRoute({
  roles = [],
  redirectTo = '/auth/signin',
  children
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()
  const hasRequiredRole = useRole(roles)
  const [sessionChecked, setSessionChecked] = React.useState(false)

  // Check if auth is disabled for testing (dev mode)
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true'

  // Add a small delay to ensure session recovery completes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSessionChecked(true)
    }, 100) // Small delay to ensure auth state is settled

    return () => clearTimeout(timer)
  }, [])

  // DEV MODE: Skip all auth checks
  if (skipAuth) {
    return children || <Outlet />
  }

  // Show loading spinner while checking auth status
  if (isLoading || !sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted location for redirecting after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Check role-based access
  if (roles.length > 0 && !hasRequiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-destructive" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This page requires one of the following roles: {roles.join(', ')}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Your current role: <span className="font-medium">{user?.role || 'None'}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render children or outlet for nested routes
  return children || <Outlet />
}

// Wrapper component for public routes that redirects authenticated users
export function PublicRoute({ 
  children,
  redirectTo = '/'
}: {
  children: React.ReactNode
  redirectTo?: string
}) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  // Redirect to home if already authenticated
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}