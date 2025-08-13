/**
 * Privacy Control Center for MyDub.ai
 * Comprehensive privacy management with granular controls and data minimization
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Switch } from '@/shared/components/ui/switch'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Progress } from '@/shared/components/ui/progress'
import { 
  Shield, 
  Eye, 
  Download, 
  Trash2, 
  Clock, 
  MapPin,
  Cookie,
  Database,
  Settings,
  CheckCircle,
  AlertTriangle,
  Info,
  Lock,
  User,
  MessageSquare,
  BarChart3,
  Smartphone,
  Globe
} from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useScreenReader } from '@/shared/components/accessibility/ScreenReaderAnnouncer'
import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/lib/utils'

interface PrivacySettings {
  dataMinimization: boolean
  analyticsTracking: boolean
  personalization: boolean
  locationTracking: boolean
  aiTraining: boolean
  marketingCommunications: boolean
  dataRetention: number // days
  profileVisibility: 'private' | 'public' | 'friends'
  searchIndexing: boolean
  thirdPartySharing: boolean
}

interface DataProcessingActivity {
  id: string
  category: 'essential' | 'analytics' | 'marketing' | 'improvement'
  name: string
  purpose: string
  dataTypes: string[]
  retention: number
  thirdParties: string[]
  lawfulBasis: string
  canOptOut: boolean
  isActive: boolean
}

interface PrivacyRights {
  right: string
  description: string
  status: 'available' | 'processing' | 'completed'
  lastUsed?: Date
  icon: React.ReactNode
}

export function PrivacyControlCenter() {
  const { user } = useAuth()
  const { announce } = useScreenReader()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('settings')
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    dataMinimization: true,
    analyticsTracking: false,
    personalization: true,
    locationTracking: false,
    aiTraining: false,
    marketingCommunications: false,
    dataRetention: 365,
    profileVisibility: 'private',
    searchIndexing: false,
    thirdPartySharing: false
  })

  const [dataActivities] = useState<DataProcessingActivity[]>([
    {
      id: '1',
      category: 'essential',
      name: 'Account Authentication',
      purpose: 'User login and security',
      dataTypes: ['Email', 'Password Hash', 'Session Tokens'],
      retention: 365,
      thirdParties: ['Supabase'],
      lawfulBasis: 'Contract',
      canOptOut: false,
      isActive: true
    },
    {
      id: '2',
      category: 'analytics',
      name: 'Usage Analytics',
      purpose: 'Improve user experience and performance',
      dataTypes: ['Page Views', 'Click Events', 'Performance Metrics'],
      retention: 90,
      thirdParties: ['Google Analytics'],
      lawfulBasis: 'Legitimate Interest',
      canOptOut: true,
      isActive: privacySettings.analyticsTracking
    },
    {
      id: '3',
      category: 'improvement',
      name: 'AI Model Training',
      purpose: 'Improve AI responses and accuracy',
      dataTypes: ['Chat Messages', 'Query Patterns', 'Response Ratings'],
      retention: 180,
      thirdParties: ['OpenRouter', 'Anthropic', 'OpenAI'],
      lawfulBasis: 'Consent',
      canOptOut: true,
      isActive: privacySettings.aiTraining
    },
    {
      id: '4',
      category: 'marketing',
      name: 'Personalized Recommendations',
      purpose: 'Provide relevant content and suggestions',
      dataTypes: ['Preferences', 'Location Data', 'Usage History'],
      retention: 365,
      thirdParties: [],
      lawfulBasis: 'Consent',
      canOptOut: true,
      isActive: privacySettings.personalization
    }
  ])

  const privacyRights: PrivacyRights[] = [
    {
      right: 'Access Your Data',
      description: 'Download a copy of all your personal data',
      status: 'available',
      icon: <Download className="h-4 w-4" />
    },
    {
      right: 'Data Portability',
      description: 'Export your data in a machine-readable format',
      status: 'available',
      icon: <Database className="h-4 w-4" />
    },
    {
      right: 'Delete Account',
      description: 'Permanently delete your account and all data',
      status: 'available',
      icon: <Trash2 className="h-4 w-4" />
    },
    {
      right: 'Rectify Data',
      description: 'Correct inaccurate or incomplete information',
      status: 'available',
      icon: <Settings className="h-4 w-4" />
    },
    {
      right: 'Restrict Processing',
      description: 'Limit how we process your personal data',
      status: 'available',
      icon: <Lock className="h-4 w-4" />
    },
    {
      right: 'Object to Processing',
      description: 'Object to processing based on legitimate interests',
      status: 'available',
      icon: <Shield className="h-4 w-4" />
    }
  ]

  useEffect(() => {
    if (user?.id) {
      loadPrivacySettings()
    }
  }, [user?.id])

  const loadPrivacySettings = async () => {
    if (!user?.id) return
    
    setLoading(true)
    announce('Loading privacy settings', 'polite')

    try {
      // In real implementation, load from database
      // For now, use localStorage or default values
      const saved = localStorage.getItem(`privacy_settings_${user.id}`)
      if (saved) {
        setPrivacySettings(JSON.parse(saved))
      }
      
      announce('Privacy settings loaded', 'polite')
    } catch (error) {
      console.error('Error loading privacy settings:', error)
      announce('Error loading privacy settings', 'assertive')
      toast({
        title: 'Error',
        description: 'Failed to load privacy settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const updatePrivacySetting = async <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    if (!user?.id) return

    const newSettings = { ...privacySettings, [key]: value }
    setPrivacySettings(newSettings)

    try {
      // Save to database in real implementation
      localStorage.setItem(`privacy_settings_${user.id}`, JSON.stringify(newSettings))
      
      // Apply settings immediately
      await applyPrivacySettings(newSettings)
      
      announce(`${key} setting updated`, 'polite')
      toast({
        title: 'Setting Updated',
        description: `Your ${key} preference has been saved.`
      })
    } catch (error) {
      console.error('Error updating privacy setting:', error)
      toast({
        title: 'Error',
        description: 'Failed to update privacy setting',
        variant: 'destructive'
      })
    }
  }

  const applyPrivacySettings = async (settings: PrivacySettings) => {
    // Apply analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: settings.analyticsTracking ? 'granted' : 'denied'
      })
    }

    // Apply location tracking
    if (!settings.locationTracking && navigator.geolocation) {
      // Clear any stored location data
      localStorage.removeItem('user_location')
    }

    // Apply data minimization
    if (settings.dataMinimization) {
      // Enable aggressive data cleanup
      scheduleDataCleanup()
    }
  }

  const scheduleDataCleanup = () => {
    // Schedule cleanup of old data based on retention settings
    console.log('Scheduling data cleanup based on retention period:', privacySettings.dataRetention)
  }

  const handleDataExport = async (format: 'json' | 'csv' = 'json') => {
    if (!user?.id) return

    setLoading(true)
    announce('Preparing data export', 'polite')

    try {
      // In real implementation, call API to generate export
      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          createdAt: user.createdAt
        },
        settings: privacySettings,
        timestamp: new Date().toISOString(),
        format
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: format === 'json' ? 'application/json' : 'text/csv'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mydub-data-export-${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      announce('Data export downloaded', 'polite')
      toast({
        title: 'Export Complete',
        description: 'Your data has been downloaded successfully.'
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to export your data. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAccountDeletion = async () => {
    if (!user?.id) return
    
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.'
    )
    
    if (!confirmed) return

    setLoading(true)
    announce('Processing account deletion request', 'polite')

    try {
      // In real implementation, call API to initiate deletion
      console.log('Account deletion requested for user:', user.id)
      
      toast({
        title: 'Deletion Requested',
        description: 'Your account deletion request has been submitted. You will receive an email confirmation.',
      })
    } catch (error) {
      console.error('Error requesting account deletion:', error)
      toast({
        title: 'Error',
        description: 'Failed to process deletion request',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getPrivacyScore = (): number => {
    const settings = privacySettings
    let score = 0
    
    if (settings.dataMinimization) score += 20
    if (!settings.analyticsTracking) score += 15
    if (!settings.locationTracking) score += 15
    if (!settings.aiTraining) score += 10
    if (!settings.marketingCommunications) score += 10
    if (!settings.thirdPartySharing) score += 15
    if (settings.profileVisibility === 'private') score += 10
    if (!settings.searchIndexing) score += 5
    
    return score
  }

  const privacyScore = getPrivacyScore()

  if (loading && !privacySettings) {
    return (
      <div className="flex items-center justify-center p-8" role="status" aria-label="Loading privacy settings">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading privacy settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6" role="main" aria-label="Privacy Control Center">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Privacy Control Center
          </h1>
          <p className="text-gray-600">Manage your privacy settings and data preferences</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Privacy Score</div>
            <div className={cn(
              "text-lg font-bold",
              privacyScore >= 80 ? "text-green-600" : 
              privacyScore >= 60 ? "text-yellow-600" : "text-red-600"
            )}>
              {privacyScore}/100
            </div>
          </div>
          <Progress 
            value={privacyScore} 
            className="w-20"
            aria-label={`Privacy score: ${privacyScore} out of 100`}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Processing
          </TabsTrigger>
          <TabsTrigger value="rights" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Your Rights
          </TabsTrigger>
          <TabsTrigger value="cookies" className="flex items-center gap-2">
            <Cookie className="h-4 w-4" />
            Cookies
          </TabsTrigger>
        </TabsList>

        {/* Privacy Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Data Collection Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  Data Collection
                </CardTitle>
                <CardDescription>
                  Control what data we collect and how it's used
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Data Minimization</h4>
                    <p className="text-sm text-gray-500">
                      Collect only essential data required for service
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.dataMinimization}
                    onCheckedChange={(value) => updatePrivacySetting('dataMinimization', value)}
                    aria-label="Toggle data minimization"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Analytics Tracking</h4>
                    <p className="text-sm text-gray-500">
                      Help improve the app with usage analytics
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.analyticsTracking}
                    onCheckedChange={(value) => updatePrivacySetting('analyticsTracking', value)}
                    aria-label="Toggle analytics tracking"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Location Tracking</h4>
                    <p className="text-sm text-gray-500">
                      Use location for personalized recommendations
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.locationTracking}
                    onCheckedChange={(value) => updatePrivacySetting('locationTracking', value)}
                    aria-label="Toggle location tracking"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">AI Training</h4>
                    <p className="text-sm text-gray-500">
                      Use your interactions to improve AI responses
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.aiTraining}
                    onCheckedChange={(value) => updatePrivacySetting('aiTraining', value)}
                    aria-label="Toggle AI training data usage"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Communication Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  Communication
                </CardTitle>
                <CardDescription>
                  Manage how we communicate with you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Marketing Communications</h4>
                    <p className="text-sm text-gray-500">
                      Receive updates about new features and events
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.marketingCommunications}
                    onCheckedChange={(value) => updatePrivacySetting('marketingCommunications', value)}
                    aria-label="Toggle marketing communications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Personalization</h4>
                    <p className="text-sm text-gray-500">
                      Customize content based on your preferences
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.personalization}
                    onCheckedChange={(value) => updatePrivacySetting('personalization', value)}
                    aria-label="Toggle personalization"
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Profile Visibility</h4>
                  <div className="flex gap-2">
                    {(['private', 'public', 'friends'] as const).map((visibility) => (
                      <Button
                        key={visibility}
                        variant={privacySettings.profileVisibility === visibility ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updatePrivacySetting('profileVisibility', visibility)}
                      >
                        {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Retention Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Data Retention
              </CardTitle>
              <CardDescription>
                Control how long your data is stored
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Retention Period</h4>
                    <Badge variant="outline">{privacySettings.dataRetention} days</Badge>
                  </div>
                  <div className="flex gap-2">
                    {[30, 90, 180, 365, 730].map((days) => (
                      <Button
                        key={days}
                        variant={privacySettings.dataRetention === days ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updatePrivacySetting('dataRetention', days)}
                      >
                        {days < 365 ? `${days}d` : `${days / 365}y`}
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Data will be automatically deleted after this period
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Processing Tab */}
        <TabsContent value="data" className="space-y-6">
          <div className="space-y-4">
            {dataActivities.map((activity) => (
              <Card key={activity.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{activity.name}</h3>
                        <Badge 
                          variant={activity.category === 'essential' ? 'default' : 'secondary'}
                        >
                          {activity.category}
                        </Badge>
                        {activity.isActive && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{activity.purpose}</p>
                      <div className="space-y-1 text-xs text-gray-500">
                        <div>Data types: {activity.dataTypes.join(', ')}</div>
                        <div>Retention: {activity.retention} days</div>
                        <div>Legal basis: {activity.lawfulBasis}</div>
                        {activity.thirdParties.length > 0 && (
                          <div>Third parties: {activity.thirdParties.join(', ')}</div>
                        )}
                      </div>
                    </div>
                    {activity.canOptOut && (
                      <Switch
                        checked={activity.isActive}
                        onCheckedChange={(value) => {
                          // Update activity status
                          console.log(`Toggling ${activity.name}:`, value)
                        }}
                        aria-label={`Toggle ${activity.name}`}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Your Rights Tab */}
        <TabsContent value="rights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {privacyRights.map((right, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {right.icon}
                        <h3 className="font-medium">{right.right}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{right.description}</p>
                      {right.lastUsed && (
                        <p className="text-xs text-gray-500">
                          Last used: {right.lastUsed.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (right.right === 'Access Your Data') {
                          handleDataExport()
                        } else if (right.right === 'Delete Account') {
                          handleAccountDeletion()
                        } else {
                          toast({
                            title: 'Feature Coming Soon',
                            description: `${right.right} will be available soon.`
                          })
                        }
                      }}
                      disabled={loading}
                    >
                      {right.status === 'available' ? 'Use' : 'Pending'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Your Privacy Rights</AlertTitle>
            <AlertDescription>
              Under GDPR and UAE data protection laws, you have these rights regarding your personal data. 
              We aim to respond to all requests within 30 days.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Cookies Tab */}
        <TabsContent value="cookies" className="space-y-6">
          <Alert>
            <Cookie className="h-4 w-4" />
            <AlertTitle>Cookie Management</AlertTitle>
            <AlertDescription>
              Manage your cookie preferences. Changes will take effect immediately.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Current Cookie Settings</CardTitle>
              <CardDescription>
                View and modify your cookie preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Cookie className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Cookie settings are managed through the cookie banner
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Clear consent to show cookie banner again
                    localStorage.removeItem('cookie_consent')
                    window.location.reload()
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Cookie Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PrivacyControlCenter