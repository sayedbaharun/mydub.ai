/**
 * Settings Page for MyDub.ai
 * Comprehensive user settings including privacy, preferences, and account management
 */

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Switch } from '@/shared/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Badge } from '@/shared/components/ui/badge'
import { DashboardPageHeader } from '@/features/dashboard/components/DashboardPageHeader'
import { 
  Settings,
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  Smartphone,
  Volume2,
  Eye,
  Moon,
  Sun,
  Languages,
  Accessibility,
  Database,
  Lock,
  Key,
  LogOut,
  Trash2,
  Save,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useScreenReader } from '@/shared/components/accessibility/ScreenReaderAnnouncer'
import { useToast } from '@/shared/hooks/use-toast'
import { PrivacyControlCenter } from '@/shared/components/privacy/PrivacyControlCenter'
import { TTSSettings } from '@/shared/components/accessibility/TTSSettings'
import { cn } from '@/shared/lib/utils'
import { useUserPreferences } from '@/shared/hooks/useUserPreferences'

export function SettingsPage() {
  const { user, updateProfile, signOut } = useAuth()
  const { announce } = useScreenReader()
  const { toast } = useToast()
  const { preferences, isLoading: prefsLoading, error: prefsError, updatePreference } = useUserPreferences()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('account')

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || 'Dubai, UAE'
  })

  const handleSaveProfile = async () => {
    if (!user) return

    setLoading(true)
    announce('Saving profile changes', 'polite')

    try {
      await updateProfile({
        fullName: profileData.fullName,
        phone: profileData.phone,
        bio: profileData.bio,
        location: profileData.location
      })

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.'
      })
      
      announce('Profile updated successfully', 'polite')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePreferenceChange = async <K extends keyof any>(
    category: K,
    key: any,
    value: any
  ) => {
    // Use the hook's updatePreference method which handles DB sync
    await updatePreference(category, key, value)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: 'Signed Out',
        description: 'You have been signed out successfully.'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardPageHeader
        title="Settings"
        description="Manage your account and preferences"
        icon={Settings}
        showBackToDashboard={true}
        showBackToHome={true}
      />

      {/* Settings Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show loading or error state */}
        {prefsLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your preferences...</p>
            </div>
          </div>
        )}
        
        {prefsError && !prefsLoading && (
          <Alert className="mb-6">
            <AlertDescription>
              {prefsError}
            </AlertDescription>
          </Alert>
        )}

        {!prefsLoading && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="flex items-center gap-2">
              <Accessibility className="h-4 w-4" />
              <span className="hidden sm:inline">Accessibility</span>
            </TabsTrigger>
            <TabsTrigger value="tts" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">Text-to-Speech</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account details and personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+971 50 123 4567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Dubai, UAE"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setProfileData({
                    fullName: user?.fullName || '',
                    email: user?.email || '',
                    phone: user?.phone || '',
                    bio: user?.bio || '',
                    location: user?.location || 'Dubai, UAE'
                  })}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-red-600">Sign Out</h4>
                    <p className="text-sm text-gray-600">Sign out of your account</p>
                  </div>
                  <Button variant="outline" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-red-600">Delete Account</h4>
                    <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <PrivacyControlCenter />
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Email Notifications</h4>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={preferences?.notifications?.email ?? true}
                    onCheckedChange={(value) => updatePreference('notifications', 'email', value)}
                    disabled={prefsLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Push Notifications</h4>
                    <p className="text-sm text-gray-500">Receive push notifications in your browser</p>
                  </div>
                  <Switch
                    checked={preferences?.notifications?.push ?? false}
                    onCheckedChange={(value) => updatePreference('notifications', 'push', value)}
                    disabled={prefsLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">SMS Notifications</h4>
                    <p className="text-sm text-gray-500">Receive important updates via SMS</p>
                  </div>
                  <Switch
                    checked={preferences?.notifications?.sms ?? false}
                    onCheckedChange={(value) => updatePreference('notifications', 'sms', value)}
                    disabled={prefsLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Marketing Communications</h4>
                    <p className="text-sm text-gray-500">Receive updates about new features and events</p>
                  </div>
                  <Switch
                    checked={preferences?.notifications?.marketing ?? false}
                    onCheckedChange={(value) => updatePreference('notifications', 'marketing', value)}
                    disabled={prefsLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme & Language</CardTitle>
                <CardDescription>
                  Customize the look and language of the app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="flex gap-2">
                    {(['light', 'dark', 'system'] as const).map((theme) => (
                      <Button
                        key={theme}
                        variant={preferences?.theme === theme ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updatePreference('theme', 'theme' as any, theme)}
                        className="flex items-center gap-2"
                        disabled={prefsLoading}
                      >
                        {theme === 'light' && <Sun className="h-4 w-4" />}
                        {theme === 'dark' && <Moon className="h-4 w-4" />}
                        {theme === 'system' && <Smartphone className="h-4 w-4" />}
                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={preferences?.language || 'en'}
                    onValueChange={(value: any) => updatePreference('language', 'language' as any, value)}
                    disabled={prefsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="ar">🇦🇪 العربية</SelectItem>
                      <SelectItem value="hi">🇮🇳 हिन्दी</SelectItem>
                      <SelectItem value="ur">🇵🇰 اردو</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accessibility Settings */}
          <TabsContent value="accessibility" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Accessibility Options</CardTitle>
                <CardDescription>
                  Customize the app for better accessibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Reduce Motion</h4>
                    <p className="text-sm text-gray-500">Minimize animations and transitions</p>
                  </div>
                  <Switch
                    checked={preferences?.accessibility?.reduceMotion ?? false}
                    onCheckedChange={(value) => updatePreference('accessibility', 'reduceMotion', value)}
                    disabled={prefsLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">High Contrast</h4>
                    <p className="text-sm text-gray-500">Increase contrast for better visibility</p>
                  </div>
                  <Switch
                    checked={preferences?.accessibility?.highContrast ?? false}
                    onCheckedChange={(value) => updatePreference('accessibility', 'highContrast', value)}
                    disabled={prefsLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Large Fonts</h4>
                    <p className="text-sm text-gray-500">Increase font size throughout the app</p>
                  </div>
                  <Switch
                    checked={preferences?.accessibility?.largeFonts ?? false}
                    onCheckedChange={(value) => updatePreference('accessibility', 'largeFonts', value)}
                    disabled={prefsLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Screen Reader Support</h4>
                    <p className="text-sm text-gray-500">Enhanced screen reader compatibility</p>
                  </div>
                  <Switch
                    checked={preferences?.accessibility?.screenReader ?? false}
                    onCheckedChange={(value) => updatePreference('accessibility', 'screenReader', value)}
                    disabled={prefsLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Text-to-Speech Settings */}
          <TabsContent value="tts" className="space-y-6">
            <TTSSettings />
          </TabsContent>

          {/* AI Settings */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Assistant Preferences</CardTitle>
                <CardDescription>
                  Customize how the AI assistant behaves
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="responseStyle">Response Style</Label>
                  <Select
                    value={preferences?.ai_preferences?.responseStyle || 'conversational'}
                    onValueChange={(value: any) => updatePreference('ai_preferences', 'responseStyle', value)}
                    disabled={prefsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select response style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise">Concise - Short and direct answers</SelectItem>
                      <SelectItem value="detailed">Detailed - Comprehensive explanations</SelectItem>
                      <SelectItem value="conversational">Conversational - Friendly and engaging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confidenceThreshold">
                    Confidence Threshold: {preferences?.ai_preferences?.confidenceThreshold ?? 80}%
                  </Label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={preferences?.ai_preferences?.confidenceThreshold ?? 80}
                    onChange={(e) => updatePreference('ai_preferences', 'confidenceThreshold', parseInt(e.target.value))}
                    className="w-full"
                    disabled={prefsLoading}
                  />
                  <p className="text-xs text-gray-500">
                    Minimum confidence level for AI responses
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Bias Awareness</h4>
                    <p className="text-sm text-gray-500">Alert me to potential bias in responses</p>
                  </div>
                  <Switch
                    checked={preferences?.ai_preferences?.biasAwareness ?? true}
                    onCheckedChange={(value) => updatePreference('ai_preferences', 'biasAwareness', value)}
                    disabled={prefsLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Explain Decisions</h4>
                    <p className="text-sm text-gray-500">Show how AI arrived at its answers</p>
                  </div>
                  <Switch
                    checked={preferences?.ai_preferences?.explainDecisions ?? true}
                    onCheckedChange={(value) => updatePreference('ai_preferences', 'explainDecisions', value)}
                    disabled={prefsLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  )
}

export default SettingsPage