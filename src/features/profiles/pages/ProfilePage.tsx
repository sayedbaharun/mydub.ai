/**
 * User Profile Page
 * Phase 3.1.1: Display and edit user profile
 */

import { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/services/toast.service'
import { Loader2, User, Settings, BookMarked, BarChart3 } from 'lucide-react'

export function ProfilePage() {
  const { profile, loading, updateProfile, uploadAvatar } = useProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return <div>Profile not found</div>
  }

  const handleSave = async () => {
    try {
      await updateProfile({
        displayName,
        bio,
        location,
      })
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await uploadAvatar(file)
      toast.success('Avatar updated successfully')
    } catch (error) {
      toast.error('Failed to upload avatar')
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatarUrl || ''} />
                <AvatarFallback>
                  <User className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 cursor-pointer">
                <div className="bg-primary text-primary-foreground rounded-full p-2">
                  <Settings className="w-4 h-4" />
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile.displayName || 'Anonymous'}</h1>
              {profile.location && (
                <p className="text-muted-foreground">{profile.location}</p>
              )}
              {profile.bio && (
                <p className="mt-2 text-sm">{profile.bio}</p>
              )}
            </div>

            <Button
              onClick={() => {
                if (isEditing) {
                  handleSave()
                } else {
                  setDisplayName(profile.displayName || '')
                  setBio(profile.bio || '')
                  setLocation(profile.location || '')
                  setIsEditing(true)
                }
              }}
            >
              {isEditing ? 'Save' : 'Edit Profile'}
            </Button>
          </div>
        </CardHeader>

        {isEditing && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Dubai Marina, Downtown Dubai, etc."
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </CardContent>
        )}
      </Card>

      <Tabs defaultValue="bookmarks">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bookmarks">
            <BookMarked className="w-4 h-4 mr-2" />
            Bookmarks
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="w-4 h-4 mr-2" />
            Reading Stats
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookmarks">
          <Card>
            <CardHeader>
              <CardTitle>Saved Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your bookmarked articles will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Reading Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your reading stats will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notification and preference settings</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
