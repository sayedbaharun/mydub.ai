import { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react'
import { AlertCircle, RefreshCw, Home, MessageSquare } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { monitoring } from '@/shared/lib/monitoring'
import { analytics } from '@/shared/services/analytics.service'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorId?: string
  retryCount: number
  retryCountdown: number
}

export class ErrorBoundary extends Component<Props, State> {
  private countdownInterval?: NodeJS.Timeout

  public state: State = {
    hasError: false,
    error: null,
    errorId: undefined,
    retryCount: 0,
    retryCountdown: 0,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    
    // Detect React Error #61 (Objects are not valid as a React child)
    const isObjectRenderError = this.detectObjectRenderError(error)
    if (isObjectRenderError) {
      console.group('🚨 React Error #61 Detected')
      console.error('Attempted to render an object as a React child')
      console.log('Common causes:')
      console.log('- Rendering an Error object directly: {error}')
      console.log('- Rendering a Date object: {new Date()}')
      console.log('- Rendering a Promise or async function result')
      console.log('- Missing .map() return or incorrect JSX in arrays')
      console.log('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }
    
    // Generate error ID for tracking
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Send error to monitoring services
    monitoring.captureError(error, {
      errorBoundary: true,
      componentStack: errorInfo.componentStack,
      errorId,
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount,
      isObjectRenderError,
    })

    // Track error in analytics
    analytics.trackError(error, true, {
      errorBoundary: true,
      errorId,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
      isObjectRenderError,
    })

    // Update state with error ID and increment retry count
    this.setState({ 
      errorId, 
      retryCount: this.state.retryCount + 1,
      retryCountdown: 0 
    })
  }

  public componentWillUnmount() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
    }
  }

  private startRetryCountdown = () => {
    this.setState({ retryCountdown: 5 })
    
    this.countdownInterval = setInterval(() => {
      this.setState(prevState => {
        if (prevState.retryCountdown <= 1) {
          this.handleRetry()
          return { retryCountdown: 0 }
        }
        return { retryCountdown: prevState.retryCountdown - 1 }
      })
    }, 1000)
  }

  private handleRetry = () => {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
    }
    this.setState({ 
      hasError: false, 
      error: null,
      retryCountdown: 0 
    })
  }

  private handleReset = () => {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
    }
    this.setState({ 
      hasError: false, 
      error: null,
      retryCount: 0,
      retryCountdown: 0 
    })
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private handleContactSupport = () => {
    window.location.href = '/support'
  }

  private detectObjectRenderError = (error: Error): boolean => {
    if (!error) return false
    
    const errorMessage = error.message || ''
    const errorString = error.toString()
    
    // Check for React Error #61 patterns
    return (
      errorMessage.includes('Objects are not valid as a React child') ||
      errorMessage.includes('Error #61') ||
      errorMessage.includes('Minified React error #61') ||
      errorString.includes('Objects are not valid') ||
      // Check for common object rendering patterns in stack
      (error.stack && error.stack.includes('expected a string (for built-in components)'))
    )
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Check if this is React Error #61
      const isObjectRenderError = this.state.error ? this.detectObjectRenderError(this.state.error) : false

      // Error messages based on error type
      const errorMessages = {
        ChunkLoadError: {
          title: 'Loading Error',
          description: 'We had trouble loading some resources. This usually happens due to network issues.',
          suggestion: 'Please check your internet connection and try again.'
        },
        NetworkError: {
          title: 'Connection Problem',
          description: 'We couldn\'t connect to our servers.',
          suggestion: 'Please check your internet connection.'
        },
        ObjectRenderError: {
          title: 'Display Error',
          description: 'The page tried to display data in an invalid format.',
          suggestion: 'This is a technical issue that we need to fix. Please try refreshing the page.'
        },
        default: {
          title: 'Something went wrong',
          description: 'We encountered an unexpected error.',
          suggestion: 'Please try refreshing the page or contact support if the problem persists.'
        }
      }

      const errorType = isObjectRenderError ? 'ObjectRenderError' : (this.state.error?.name || 'default')
      const errorInfo = errorMessages[errorType as keyof typeof errorMessages] || errorMessages.default

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-lg w-full shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-semibold">{errorInfo.title}</CardTitle>
              <CardDescription className="text-base mt-2">
                {errorInfo.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">{errorInfo.suggestion}</p>
              </div>
              
              {this.state.retryCount > 2 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    We've noticed multiple errors. If this continues, please contact our support team.
                  </p>
                </div>
              )}

              {this.state.errorId && (
                <div className="text-xs text-muted-foreground mb-6 text-center">
                  Error ID: <code className="bg-gray-100 px-2 py-1 rounded">{this.state.errorId}</code>
                </div>
              )}

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <>
                  {isObjectRenderError && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-orange-800 mb-2">
                        ⚠️ React Error #61 Detected
                      </p>
                      <p className="text-xs text-orange-700 mb-2">
                        You're trying to render an object as a React child. Check for:
                      </p>
                      <ul className="text-xs text-orange-600 list-disc list-inside space-y-1">
                        <li>{'Rendering {error} instead of {error.message}'}</li>
                        <li>{'Rendering {new Date()} instead of {new Date().toString()}'}</li>
                        <li>{'Missing return in .map() functions'}</li>
                        <li>{'Async function results not properly awaited'}</li>
                      </ul>
                    </div>
                  )}
                  <details className="mb-6">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      Technical Details
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                      {this.state.error.stack || this.state.error.toString()}
                    </pre>
                  </details>
                </>
              )}

              <div className="space-y-3">
                {this.state.retryCountdown > 0 ? (
                  <Button 
                    onClick={this.handleRetry} 
                    className="w-full relative"
                    variant="default"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retrying in {this.state.retryCountdown}s...
                    <span className="absolute inset-0 bg-primary/20 animate-pulse rounded-md" />
                  </Button>
                ) : (
                  <Button 
                    onClick={this.startRetryCountdown} 
                    className="w-full"
                    variant="default"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={this.handleGoHome} 
                    variant="outline"
                    className="w-full"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Button>
                  
                  <Button 
                    onClick={this.handleContactSupport} 
                    variant="outline"
                    className="w-full"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Get Help
                  </Button>
                </div>

                {this.state.retryCount > 0 && (
                  <Button 
                    onClick={this.handleReset} 
                    variant="ghost"
                    className="w-full text-sm"
                  >
                    Force Refresh Page
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center mt-6">
                This error has been automatically reported to help us improve.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}