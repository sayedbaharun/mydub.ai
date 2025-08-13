import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Upload, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { khaleejiTimesArticleExample, importNewsArticles } from '@/features/dashboard/utils/contentImport'
import { useNavigate } from 'react-router-dom'

export function TestImportPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  const handleImportArticle = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to import content',
        variant: 'destructive'
      })
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const results = await importNewsArticles([khaleejiTimesArticleExample], user.id)
      setImportResult(results[0])
      
      if (results[0].success) {
        toast({
          title: 'Article imported successfully!',
          description: 'The news article has been added to your dashboard',
        })
        
        // Optionally navigate to content management after 2 seconds
        setTimeout(() => {
          navigate('/dashboard?tab=content')
        }, 2000)
      } else {
        toast({
          title: 'Import failed',
          description: 'There was an error importing the article',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: 'Import error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Test News Import</CardTitle>
          <CardDescription>
            Import a sample news article from Khaleej Times into your MyDub.AI dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Article Preview */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Article to Import:</h3>
            <div className="space-y-2">
              <p className="font-medium">{khaleejiTimesArticleExample.title}</p>
              <p className="text-sm text-muted-foreground">
                Category: {khaleejiTimesArticleExample.metadata?.category} | 
                Tags: {khaleejiTimesArticleExample.metadata?.tags?.join(', ')}
              </p>
              <p className="text-sm line-clamp-3">
                {khaleejiTimesArticleExample.metadata?.summary}
              </p>
              <a 
                href={khaleejiTimesArticleExample.metadata?.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View original article →
              </a>
            </div>
          </div>

          {/* Import Button */}
          <div className="flex flex-col items-center space-y-4">
            <Button 
              onClick={handleImportArticle} 
              disabled={isImporting}
              size="lg"
              className="w-full sm:w-auto"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Article to Dashboard
                </>
              )}
            </Button>

            {/* Import Result */}
            {importResult && (
              <Alert className={importResult.success ? "border-green-500" : "border-red-500"}>
                {importResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertTitle>
                  {importResult.success ? 'Import Successful' : 'Import Failed'}
                </AlertTitle>
                <AlertDescription>
                  {importResult.success 
                    ? `Article "${importResult.content.title}" has been added to your content management system.`
                    : 'There was an error importing the article. Please try again.'
                  }
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Instructions */}
          <div className="border rounded-lg p-4 space-y-2">
            <h4 className="font-medium">How this works:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Click the import button to add this article to your dashboard</li>
              <li>The article will be created with both English and Arabic content</li>
              <li>It will be automatically published and categorized under "health"</li>
              <li>You can then manage it from your Content Management tab</li>
              <li>You can edit, unpublish, or delete it like any other content</li>
            </ol>
          </div>

          {/* Technical Details */}
          <details className="cursor-pointer">
            <summary className="text-sm font-medium text-muted-foreground hover:text-foreground">
              View Technical Details
            </summary>
            <div className="mt-4 bg-muted/30 p-4 rounded-lg">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(khaleejiTimesArticleExample, null, 2)}
              </pre>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}