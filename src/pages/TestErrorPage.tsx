import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { useState } from 'react'

export default function TestErrorPage() {
  const [shouldThrow, setShouldThrow] = useState(false)

  if (shouldThrow) {
    throw new Error('This is a test error from TestErrorPage!')
  }

  const throwAsyncError = () => {
    setTimeout(() => {
      throw new Error('This is an async error!')
    }, 100)
  }

  const throwPromiseError = async () => {
    await Promise.reject(new Error('This is a promise rejection!'))
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Error Boundary Test Page</CardTitle>
          <CardDescription>
            Test different types of errors to verify error boundaries are working correctly.
            This page should only be accessible in development mode.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Synchronous Error</h3>
            <p className="text-sm text-muted-foreground">
              This will throw an error immediately and be caught by the error boundary.
            </p>
            <Button 
              variant="destructive" 
              onClick={() => setShouldThrow(true)}
            >
              Throw Sync Error
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Asynchronous Error</h3>
            <p className="text-sm text-muted-foreground">
              This will throw an error after a timeout. Should be caught by global error handler.
            </p>
            <Button 
              variant="destructive" 
              onClick={throwAsyncError}
            >
              Throw Async Error
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Promise Rejection</h3>
            <p className="text-sm text-muted-foreground">
              This will reject a promise. Should be caught by unhandledrejection handler.
            </p>
            <Button 
              variant="destructive" 
              onClick={throwPromiseError}
            >
              Throw Promise Error
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">404 Error</h3>
            <p className="text-sm text-muted-foreground">
              Navigate to a non-existent route to test 404 handling.
            </p>
            <a href="/this-page-does-not-exist">
              <Button variant="outline">
                Go to 404 Page
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}