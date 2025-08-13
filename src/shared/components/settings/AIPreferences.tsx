import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { aiDisclosureService, type AIPreferences as AIPreferencesType, type AIUsageStats } from '@/shared/services/ai-disclosure.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Switch } from '@/shared/components/ui/switch'
import { Label } from '@/shared/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Progress } from '@/shared/components/ui/progress'
import { Badge } from '@/shared/components/ui/badge'
import { 
  Brain, 
  Shield, 
  Eye, 
  Download, 
  AlertCircle,
  ChevronRight,
  BarChart,
  MessageSquare,
  Search,
  Sparkles,
  FileText,
  Heart
} from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/shared/hooks/use-toast'

const featureIcons = {
  chatbot: MessageSquare,
  recommendations: Sparkles,
  search_enhancement: Search,
  content_generation: FileText,
  sentiment_analysis: Heart
}

const featureDescriptions = {
  chatbot: 'AI-powered assistant to answer your questions about Dubai',
  recommendations: 'Personalized content and service recommendations',
  search_enhancement: 'Improved search results using AI understanding',
  content_generation: 'AI-assisted content creation and summaries',
  sentiment_analysis: 'Understanding tone and emotion in content'
}

export function AIPreferences() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [preferences, setPreferences] = useState<AIPreferencesType | null>(null)
  const [stats, setStats] = useState<AIUsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('preferences')

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const [userPrefs, userStats] = await Promise.all([
        aiDisclosureService.getUserPreferences(user.id),
        aiDisclosureService.getUserStats(user.id, 'month')
      ])
      
      setPreferences(userPrefs)
      setStats(userStats)
    } catch (error) {
      console.error('Failed to load AI preferences:', error)
      toast({
        title: 'Error',
        description: 'Failed to load AI preferences',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGlobalToggle = async (enabled: boolean) => {
    if (!user || !preferences) return
    
    try {
      setSaving(true)
      await aiDisclosureService.setAIEnabled(user.id, enabled)
      setPreferences({ ...preferences, ai_enabled: enabled })
      
      toast({
        title: enabled ? 'AI Features Enabled' : 'AI Features Disabled',
        description: enabled 
          ? 'AI features are now active across MyDub.AI'
          : 'All AI features have been disabled. You can still use basic features.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update AI preferences',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleFeatureToggle = async (feature: keyof AIPreferencesType['features'], enabled: boolean) => {
    if (!user || !preferences) return
    
    try {
      setSaving(true)
      await aiDisclosureService.setFeatureEnabled(user.id, feature, enabled)
      setPreferences({
        ...preferences,
        features: {
          ...preferences.features,
          [feature]: enabled
        }
      })
      
      toast({
        title: 'Feature Updated',
        description: `${feature.replace(/_/g, ' ')} has been ${enabled ? 'enabled' : 'disabled'}`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update feature preference',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDataUsageToggle = async (key: keyof AIPreferencesType['data_usage'], enabled: boolean) => {
    if (!user || !preferences) return
    
    try {
      setSaving(true)
      const updatedDataUsage = {
        ...preferences.data_usage,
        [key]: enabled
      }
      
      await aiDisclosureService.updateUserPreferences(user.id, {
        data_usage: updatedDataUsage
      })
      
      setPreferences({
        ...preferences,
        data_usage: updatedDataUsage
      })
      
      toast({
        title: 'Data Usage Updated',
        description: `Data ${key.replace(/_/g, ' ')} preference updated`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update data usage preference',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTransparencyLevelChange = async (level: 'minimal' | 'standard' | 'detailed') => {
    if (!user || !preferences) return
    
    try {
      setSaving(true)
      await aiDisclosureService.updateUserPreferences(user.id, {
        transparency_level: level
      })
      
      setPreferences({
        ...preferences,
        transparency_level: level
      })
      
      toast({
        title: 'Transparency Level Updated',
        description: `AI transparency set to ${level} mode`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update transparency level',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    if (!user) return
    
    try {
      const data = await aiDisclosureService.exportUserAIData(user.id)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mydub-ai-data-${format(new Date(), 'yyyy-MM-dd')}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      toast({
        title: 'Data Exported',
        description: 'Your AI interaction data has been downloaded',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export AI data',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unable to Load Preferences</AlertTitle>
        <AlertDescription>
          Please try refreshing the page or contact support if the issue persists.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Preferences</h2>
          <p className="text-muted-foreground">
            Control how AI features work in MyDub.AI
          </p>
        </div>
        <Badge variant={preferences.ai_enabled ? "default" : "secondary"}>
          AI {preferences.ai_enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Your Privacy Matters</AlertTitle>
        <AlertDescription>
          We use AI to enhance your experience while respecting your privacy. 
          You have full control over AI features and can opt out at any time.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="usage">Usage Stats</TabsTrigger>
          <TabsTrigger value="transparency">Transparency</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-6">
          {/* Global AI Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Master AI Control
              </CardTitle>
              <CardDescription>
                Enable or disable all AI features across MyDub.AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="ai-master-switch" className="text-base">
                  Enable AI Features
                </Label>
                <Switch
                  id="ai-master-switch"
                  checked={preferences.ai_enabled}
                  onCheckedChange={handleGlobalToggle}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Individual Feature Controls */}
          <Card>
            <CardHeader>
              <CardTitle>AI Features</CardTitle>
              <CardDescription>
                Choose which AI features you want to use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(preferences.features).map(([feature, enabled]) => {
                const Icon = featureIcons[feature as keyof typeof featureIcons] || Brain
                const description = featureDescriptions[feature as keyof typeof featureDescriptions]
                
                return (
                  <div key={feature} className="flex items-start justify-between space-x-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="space-y-1">
                        <Label htmlFor={`feature-${feature}`} className="text-base">
                          {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={`feature-${feature}`}
                      checked={enabled && preferences.ai_enabled}
                      onCheckedChange={(checked) => handleFeatureToggle(feature as keyof AIPreferencesType['features'], checked)}
                      disabled={!preferences.ai_enabled || saving}
                    />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Data Usage Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Data Usage</CardTitle>
              <CardDescription>
                Control how your data is used to improve AI services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="allow-training" className="text-base">
                    Allow Training
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Use my interactions to improve AI models (anonymized)
                  </p>
                </div>
                <Switch
                  id="allow-training"
                  checked={preferences.data_usage.allow_training}
                  onCheckedChange={(checked) => handleDataUsageToggle('allow_training', checked)}
                  disabled={saving}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="allow-improvement" className="text-base">
                    Service Improvement
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Use my feedback to improve AI responses
                  </p>
                </div>
                <Switch
                  id="allow-improvement"
                  checked={preferences.data_usage.allow_improvement}
                  onCheckedChange={(checked) => handleDataUsageToggle('allow_improvement', checked)}
                  disabled={saving}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="allow-analytics" className="text-base">
                    Usage Analytics
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Track AI feature usage for product improvement
                  </p>
                </div>
                <Switch
                  id="allow-analytics"
                  checked={preferences.data_usage.allow_analytics}
                  onCheckedChange={(checked) => handleDataUsageToggle('allow_analytics', checked)}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {stats && (
            <>
              {/* Usage Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    AI Usage This Month
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Interactions</p>
                      <p className="text-2xl font-bold">{stats.total_interactions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tokens Used</p>
                      <p className="text-2xl font-bold">{stats.tokens_consumed.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* Feature Usage */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Feature Usage</p>
                    {Object.entries(stats.by_feature).map(([feature, count]) => (
                      <div key={feature} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{feature.replace(/_/g, ' ')}</span>
                          <span>{count} uses</span>
                        </div>
                        <Progress 
                          value={(count / stats.total_interactions) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Model Usage */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">AI Models Used</p>
                    {Object.entries(stats.by_model).map(([model, count]) => (
                      <div key={model} className="flex items-center justify-between text-sm">
                        <span>{model}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Data Export */}
              <Card>
                <CardHeader>
                  <CardTitle>Your AI Data</CardTitle>
                  <CardDescription>
                    Download all your AI interaction data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleExportData} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Export My AI Data
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="transparency" className="space-y-6">
          {/* Transparency Level */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Transparency Level
              </CardTitle>
              <CardDescription>
                Choose how much detail you want about AI decisions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {(['minimal', 'standard', 'detailed'] as const).map((level) => (
                  <div
                    key={level}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      preferences.transparency_level === level
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => handleTransparencyLevelChange(level)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">{level}</p>
                        <p className="text-sm text-muted-foreground">
                          {level === 'minimal' && 'Basic AI indicators only'}
                          {level === 'standard' && 'AI usage indicators and model info'}
                          {level === 'detailed' && 'Full AI reasoning and confidence scores'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Information */}
          <Card>
            <CardHeader>
              <CardTitle>How We Use AI</CardTitle>
              <CardDescription>
                Understanding our AI implementation
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                MyDub.AI uses advanced AI models from leading providers to enhance your experience:
              </p>
              <ul>
                <li><strong>OpenAI GPT-4</strong>: For natural language understanding and generation</li>
                <li><strong>Anthropic Claude</strong>: For nuanced, safety-focused responses</li>
                <li><strong>Google Gemini</strong>: For multimodal understanding and efficiency</li>
              </ul>
              <p>
                All AI interactions are logged for transparency and can be reviewed in your usage history. 
                We never use your personal data to train AI models without explicit consent.
              </p>
              <p>
                For more information, please review our <a href="/legal/ai-ethics" className="text-primary hover:underline">AI Ethics Policy</a>.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}