import { useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { AlertCircle, Home } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Link } from 'react-router-dom'
import { monitoring } from '@/shared/lib/monitoring'
import { useEffect } from 'react'

export function RouteErrorBoundary() {
  const error = useRouteError()
  
  useEffect(() => {
    // Log error to monitoring
    if (error) {
      monitoring.captureError(error as Error, {
        type: 'route-error',
        isRouteError: true,
      })
    }
  }, [error])

  let errorMessage: string
  let errorStatus: number | undefined
  
  if (isRouteErrorResponse(error)) {
    errorStatus = error.status
    switch (error.status) {
      case 404:
        errorMessage = 'Page not found'
        break
      case 401:
        errorMessage = 'You need to be authenticated to view this page'
        break
      case 403:
        errorMessage = "You don't have permission to access this page"
        break
      case 500:
        errorMessage = 'Server error - Please try again later'
        break
      default:
        errorMessage = error.statusText || 'An error occurred'
    }
  } else if (error instanceof Error) {
    errorMessage = error.message
  } else {
    errorMessage = 'An unexpected error occurred'
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>
              {errorStatus === 404 ? 'Page Not Found' : 'Oops! Something went wrong'}
            </CardTitle>
          </div>
          <CardDescription>
            {errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {process.env.NODE_ENV === 'development' && error instanceof Error && (
            <pre className="text-xs bg-muted p-2 rounded mb-4 overflow-auto max-h-32">
              {error.stack}
            </pre>
          )}
          <div className="space-y-2">
            <Link to="/" className="block">
              <Button className="w-full" variant="default">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Button>
            </Link>
            {errorStatus === 401 && (
              <Link to="/signin" className="block">
                <Button className="w-full" variant="outline">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}