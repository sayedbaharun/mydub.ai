import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { useNavigate } from 'react-router-dom'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorType: 'auth' | 'network' | 'unknown'
}

// HOC to provide navigation to class component
function withNavigation<T extends Record<string, any>>(Component: React.ComponentType<T>) {
  return (props: T) => {
    const navigate = useNavigate()
    return <Component {...props} navigate={navigate} />
  }
}

interface AuthErrorBoundaryProps extends Props {
  navigate?: (path: string) => void
}

class AuthErrorBoundaryComponent extends Component<AuthErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorType: 'unknown'
  }

  public static getDerivedStateFromError(error: Error): State {
    // Categorize the error
    let errorType: State['errorType'] = 'unknown'
    
    if (error.message.includes('auth') || error.message.includes('session') || error.message.includes('login')) {
      errorType = 'auth'
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorType = 'network'
    }

    return { hasError: true, error, errorType }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Auth error boundary caught:', error, errorInfo)
    console.error('DETAILED ERROR INFO:', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorType: this.state.errorType,
      componentStack: errorInfo.componentStack
    })
    
    // Clear potentially corrupted auth state
    localStorage.removeItem('mydub_session_exists')
    localStorage.removeItem('mydub_session_timestamp')
    
    // Log to error reporting service in production
    if (import.meta.env.PROD) {
      // TODO: Send to error reporting service like Sentry
      console.error('Auth Error for reporting:', {
        error: error.message,
        stack: error.stack,
        errorInfo
      })
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorType: 'unknown' })
  }

  private handleSignOut = () => {
    // Clear all auth data
    localStorage.clear()
    sessionStorage.clear()
    
    // Navigate to sign in
    if (this.props.navigate) {
      this.props.navigate('/auth/signin')
    } else {
      window.location.href = '/auth/signin'
    }
  }

  private handleGoHome = () => {
    if (this.props.navigate) {
      this.props.navigate('/')
    } else {
      window.location.href = '/'
    }
  }

  private getErrorMessage() {
    switch (this.state.errorType) {
      case 'auth':
        return {
          title: 'Authentication Error',
          description: `There was a problem with your session. Please refresh to continue. Debug: ${this.state.error?.message || 'Unknown error'}`,
          showSignOut: true
        }
      case 'network':
        return {
          title: 'Connection Error',
          description: 'Unable to connect to our servers. Please check your internet connection.',
          showSignOut: false
        }
      default:
        return {
          title: 'Something went wrong',
          description: 'An unexpected error occurred. Please try again.',
          showSignOut: false
        }
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { title, description, showSignOut } = this.getErrorMessage()

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <CardTitle>{title}</CardTitle>
              </div>
              <CardDescription>
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {import.meta.env.DEV && this.state.error && (
                <details className="mb-4">
                  <summary className="text-sm font-medium cursor-pointer">Error Details</summary>
                  <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                    {this.state.error.toString()}
                    {this.state.error.stack && '\n\n' + this.state.error.stack}
                  </pre>
                </details>
              )}
              
              <div className="space-y-2">
                <Button onClick={this.handleRetry} className="w-full" variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                {showSignOut && (
                  <Button onClick={this.handleSignOut} className="w-full" variant="outline">
                    Sign In Again
                  </Button>
                )}
                
                <Button onClick={this.handleGoHome} className="w-full" variant="ghost">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Export the component with navigation HOC
export const AuthErrorBoundary = withNavigation(AuthErrorBoundaryComponent)

// Also export a simpler version for use without router
export class SimpleAuthErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorType: 'unknown'
  }

  public static getDerivedStateFromError(error: Error): State {
    let errorType: State['errorType'] = 'unknown'
    
    console.error('SimpleAuthErrorBoundary caught error:', error.message)
    console.error('Full error:', error)
    
    if (error.message.includes('auth') || error.message.includes('session')) {
      errorType = 'auth'
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorType = 'network'
    }

    return { hasError: true, error, errorType }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Simple auth error boundary caught:', error, errorInfo)
    localStorage.removeItem('mydub_session_exists')
    localStorage.removeItem('mydub_session_timestamp')
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorType: 'unknown' })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <CardTitle>Authentication Error</CardTitle>
              </div>
              <CardDescription>
                There was a problem with your session. Please refresh to continue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}