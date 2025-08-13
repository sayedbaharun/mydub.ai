import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User,
  Mail,
  Calendar,
  Bell,
  Heart,
  Edit,
  Camera,
  Check,
  X,
  MapPin,
  Languages,
  Settings,
  Bookmark,
  Upload,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { Switch } from '@/shared/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useAuth } from '@/features/auth/context/AuthContext'
import { userAvatars } from '@/shared/lib/storage'
import { supabase } from '@/shared/lib/supabase'

interface UserStats {
  saved: number
  areas: number
  visits: number
}

export function ProfilePage() {
  const { t } = useTranslation()
  const { user, updateProfile } = useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [userStats, setUserStats] = useState<UserStats>({ saved: 0, areas: 0, visits: 0 })
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
  })

  // Settings state - simplified for Phase 1
  const [settings, setSettings] = useState({
    notifications: true,
    language: 'en',
  })

  const userInitials =
    user?.fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U'

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })

  // Load real user statistics
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user?.id) return

      try {
        // Get user favorites count
        const { count: favoritesCount } = await supabase
          .from('user_favorites')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Get user preferences to count selected areas
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('metadata')
          .eq('user_id', user.id)
          .single()

        // Get page views count for visits (approximation)
        const { count: visitsCount } = await supabase
          .from('page_views')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        const areas = preferences?.metadata?.favoriteAreas?.length || 0 // Real count, no hardcoded default

        setUserStats({
          saved: favoritesCount || 0,
          areas: areas,
          visits: visitsCount || 0,
        })
      } catch (error) {
        console.error('Error loading user stats:', error)
        // Keep default values on error
      }
    }

    loadUserStats()
  }, [user?.id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      // 2MB limit
      setPhotoError('Image must be less than 2MB')
      return
    }

    setIsUploadingPhoto(true)
    setPhotoError(null)

    try {
      const avatarUrl = await userAvatars.upload(user.id, file)

      // Update user profile with new avatar URL
      const { error } = await updateProfile({ avatar: avatarUrl })

      if (error) {
        setPhotoError(error)
      }
    } catch (error: any) {
      setPhotoError(error.message || 'Failed to upload photo')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const { error } = await updateProfile({
        fullName: formData.fullName,
      })

      if (error) {
        setSaveError(error)
      } else {
        setIsEditing(false)
      }
    } catch (error: any) {
      setSaveError(error.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
    })
    setSaveError(null)
    setIsEditing(false)
  }

  const handleSettingToggle = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const stats = [
    { label: 'Saved', value: userStats.saved.toString(), icon: Bookmark },
    { label: 'Areas', value: userStats.areas.toString(), icon: MapPin },
    { label: 'Visits', value: userStats.visits.toString(), icon: Heart },
  ]

  // Real saved articles will be loaded from user_favorites
  const [savedArticles, setSavedArticles] = useState<any[]>([])

  // Load real saved articles
  useEffect(() => {
    const loadSavedArticles = async () => {
      if (!user?.id) return

      try {
        const { data } = await supabase
          .from('user_favorites')
          .select('*')
          .eq('user_id', user.id)
          .limit(5)

        setSavedArticles(data || [])
      } catch (error) {
        console.error('Error loading saved articles:', error)
        setSavedArticles([])
      }
    }

    loadSavedArticles()
  }, [user?.id])

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-16">
          <h1 className="mb-3 text-4xl font-light text-midnight-black">Profile</h1>
          <p className="font-light text-gray-600">Manage your account and preferences</p>
        </div>

        <div className="grid gap-12 lg:grid-cols-3">
          {/* Profile Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 transition-shadow duration-300 hover:shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <Avatar className="h-28 w-28 border-2 border-gray-50">
                    <AvatarImage src={user?.avatar} alt={user?.fullName} />
                    <AvatarFallback className="bg-gray-50 text-2xl font-light text-midnight-black">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                      disabled={isUploadingPhoto}
                    />
                    <label htmlFor="photo-upload">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 cursor-pointer rounded-xl border border-gray-100 bg-white transition-all duration-200 hover:bg-gray-50"
                        asChild
                      >
                        <div>
                          {isUploadingPhoto ? (
                            <Upload className="h-4 w-4 animate-pulse text-gray-600" />
                          ) : (
                            <Camera className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                      </Button>
                    </label>
                  </div>
                </div>

                {photoError && (
                  <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-2 text-xs text-red-600">
                    {photoError}
                  </div>
                )}

                <h2 className="mb-2 text-2xl font-light text-midnight-black">{user?.fullName}</h2>
                <p className="mb-6 font-light text-gray-600">{user?.email}</p>

                <Badge
                  variant="outline"
                  className="mb-8 rounded-xl border-gray-200 bg-gray-50 px-4 py-1 font-light text-gray-600"
                >
                  {user?.role || 'user'}
                </Badge>

                <div className="mb-6 w-full border-t border-gray-100 pt-6">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-light text-gray-600">Member since</span>
                    </div>
                    <span className="font-light text-midnight-black">{memberSince}</span>
                  </div>
                </div>

                <div className="grid w-full grid-cols-3 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <stat.icon className="mx-auto mb-2 h-5 w-5 text-gray-400" />
                      <p className="text-2xl font-light text-midnight-black">{stat.value}</p>
                      <p className="text-xs font-light text-gray-600">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-xl border border-gray-100 bg-gray-50 p-1">
                <TabsTrigger
                  value="personal"
                  className="rounded-lg font-light transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-midnight-black data-[state=active]:shadow-sm"
                >
                  Personal
                </TabsTrigger>
                <TabsTrigger
                  value="preferences"
                  className="rounded-lg font-light transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-midnight-black data-[state=active]:shadow-sm"
                >
                  Preferences
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="rounded-lg font-light transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-midnight-black data-[state=active]:shadow-sm"
                >
                  Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-8 space-y-8">
                <div className="rounded-2xl border border-gray-100 bg-white p-8 transition-shadow duration-300 hover:shadow-sm">
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h3 className="mb-2 text-xl font-light text-midnight-black">
                        Personal Information
                      </h3>
                      <p className="text-sm font-light text-gray-600">
                        Update your personal details
                      </p>
                    </div>
                    {!isEditing ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="rounded-xl font-light transition-colors duration-200 hover:bg-gray-50"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancel}
                          className="rounded-xl font-light transition-colors duration-200 hover:bg-gray-50"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={isSaving}
                          className="rounded-xl bg-midnight-black font-light transition-colors duration-200 hover:bg-gray-800"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {saveError && (
                    <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-light text-red-600">
                      {saveError}
                    </div>
                  )}

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <Label
                        htmlFor="fullName"
                        className="flex items-center gap-2 font-light text-gray-600"
                      >
                        <User className="h-4 w-4" />
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="rounded-xl border-gray-200 font-light transition-colors duration-200 hover:border-gray-300 focus:border-midnight-black"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="email"
                        className="flex items-center gap-2 font-light text-gray-600"
                      >
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="rounded-xl border-gray-200 bg-gray-50 font-light"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-8 transition-shadow duration-300 hover:shadow-sm">
                  <div className="mb-6">
                    <h3 className="mb-2 text-xl font-light text-midnight-black">
                      Account Security
                    </h3>
                    <p className="text-sm font-light text-gray-600">
                      Manage your password settings
                    </p>
                  </div>
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-gray-200 font-light transition-colors duration-200 hover:bg-gray-50"
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preferences" className="mt-8 space-y-8">
                <div className="rounded-2xl border border-gray-100 bg-white p-8 transition-shadow duration-300 hover:shadow-sm">
                  <div className="mb-8">
                    <h3 className="mb-2 text-xl font-light text-midnight-black">App Settings</h3>
                    <p className="text-sm font-light text-gray-600">
                      Customize your app experience
                    </p>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-light text-midnight-black">Push Notifications</p>
                          <p className="text-sm font-light text-gray-600">
                            Receive updates and alerts
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.notifications}
                        onCheckedChange={(checked) => handleSettingToggle('notifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Languages className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-light text-midnight-black">Language</p>
                          <p className="text-sm font-light text-gray-600">
                            Choose your preferred language
                          </p>
                        </div>
                      </div>
                      <Select
                        value={settings.language}
                        onValueChange={(value) =>
                          setSettings((prev) => ({ ...prev, language: value }))
                        }
                      >
                        <SelectTrigger className="w-32 rounded-xl border-gray-200 font-light">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="en" className="font-light">
                            English
                          </SelectItem>
                          <SelectItem value="ar" className="font-light">
                            العربية
                          </SelectItem>
                          <SelectItem value="hi" className="font-light">
                            हिन्दी
                          </SelectItem>
                          <SelectItem value="ur" className="font-light">
                            اردو
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-8 space-y-8">
                <div className="rounded-2xl border border-gray-100 bg-white p-8 transition-shadow duration-300 hover:shadow-sm">
                  <div className="mb-8">
                    <h3 className="mb-2 text-xl font-light text-midnight-black">Saved Content</h3>
                    <p className="text-sm font-light text-gray-600">
                      Your bookmarked articles and guides
                    </p>
                  </div>

                  <div className="space-y-4">
                    {savedArticles.length === 0 ? (
                      <div className="py-12 text-center">
                        <Bookmark className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                        <p className="mb-2 font-light text-gray-600">No saved content yet</p>
                        <p className="text-sm font-light text-gray-500">
                          Start exploring Dubai and save your favorite articles
                        </p>
                      </div>
                    ) : (
                      savedArticles.map((article, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between rounded-xl border border-gray-100 p-4 transition-colors duration-200 hover:bg-gray-50"
                        >
                          <div className="flex items-start gap-4">
                            <Bookmark className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400" />
                            <div>
                              <h4 className="mb-1 font-light text-midnight-black">
                                {article.content_type || 'Saved Item'}
                              </h4>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span className="font-light">ID: {article.content_id}</span>
                                <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                <span className="font-light">
                                  {new Date(article.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg font-light transition-colors duration-200 hover:bg-gray-100"
                          >
                            View
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-8 transition-shadow duration-300 hover:shadow-sm">
                  <div className="mb-8">
                    <h3 className="mb-2 text-xl font-light text-midnight-black">Recent Activity</h3>
                    <p className="text-sm font-light text-gray-600">
                      Your recent interactions and searches
                    </p>
                  </div>

                  <div className="py-12 text-center">
                    <Settings className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <p className="mb-2 font-light text-gray-600">Activity tracking coming soon</p>
                    <p className="text-sm font-light text-gray-500">
                      We're working on bringing you detailed activity insights
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
