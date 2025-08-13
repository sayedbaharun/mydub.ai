/**
 * Push Notification Settings Component
 * Allows users to manage their push notification preferences
 */

import { useState, useEffect } from 'react'
import { Bell, BellOff, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Switch } from '@/shared/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { pushNotificationService, NotificationPreferences } from '@/shared/services/push-notification.service'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useScreenReader } from '@/shared/components/accessibility/ScreenReaderAnnouncer'
import { cn } from '@/shared/lib/utils'

interface NotificationCategory {
  key: keyof NotificationPreferences
  label: string
  description: string
  icon: React.ReactNode
}

const notificationCategories: NotificationCategory[] = [
  {
    key: 'news',
    label: 'News Updates',
    description: 'Breaking news and important updates about Dubai',
    icon: '📰'
  },
  {
    key: 'events',
    label: 'Events',
    description: 'Upcoming events and activities in Dubai',
    icon: '🎉'
  },
  {
    key: 'weather',
    label: 'Weather Alerts',
    description: 'Severe weather warnings and daily forecasts',
    icon: '🌤️'
  },
  {
    key: 'traffic',
    label: 'Traffic Updates',
    description: 'Real-time traffic alerts and road closures',
    icon: '🚗'
  },
  {
    key: 'government',
    label: 'Government Announcements',
    description: 'Official government updates and service changes',
    icon: '🏛️'
  },
  {
    key: 'emergencies',
    label: 'Emergency Alerts',
    description: 'Critical safety and emergency notifications',
    icon: '🚨'
  }
]

export function PushNotificationSettings() {
  const { user } = useAuth()
  const { announce } = useScreenReader()
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    news: true,
    events: true,
    weather: true,
    traffic: false,
    government: true,
    emergencies: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkNotificationStatus()
  }, [])

  const checkNotificationStatus = async () => {
    const supported = pushNotificationService.isNotificationSupported()
    setIsSupported(supported)
    
    if (supported) {
      setPermission(pushNotificationService.getPermissionStatus())
      const subscribed = await pushNotificationService.isSubscribed()
      setIsSubscribed(subscribed)
      
      if (subscribed) {
        const prefs = await pushNotificationService.getPreferences(user?.id)
        setPreferences(prefs)
      }
    }
  }

  const handleEnableNotifications = async () => {
    setLoading(true)
    try {
      const success = await pushNotificationService.subscribe(user?.id)
      if (success) {
        setIsSubscribed(true)
        setPermission('granted')
        announce('Push notifications enabled successfully')
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDisableNotifications = async () => {
    setLoading(true)
    try {
      const success = await pushNotificationService.unsubscribe(user?.id)
      if (success) {
        setIsSubscribed(false)
        announce('Push notifications disabled')
      }
    } catch (error) {
      console.error('Failed to disable notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    
    await pushNotificationService.updatePreferences(newPreferences, user?.id)
    announce(`${key} notifications ${value ? 'enabled' : 'disabled'}`)
  }

  const handleTestNotification = async () => {
    await pushNotificationService.showTestNotification()
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications Not Supported
          </CardTitle>
          <CardDescription>
            Your browser doesn't support push notifications. Try using a modern browser like Chrome, Firefox, or Safari.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Get real-time updates about Dubai directly to your device
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {permission === 'granted' && (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Allowed
              </Badge>
            )}
            {permission === 'denied' && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Blocked
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="notifications-toggle" className="text-base font-medium">
              {isSubscribed ? 'Notifications Enabled' : 'Enable Notifications'}
            </Label>
            <p className="text-sm text-muted-foreground">
              {isSubscribed 
                ? 'You\'re receiving push notifications' 
                : 'Turn on to receive push notifications'}
            </p>
          </div>
          <Switch
            id="notifications-toggle"
            checked={isSubscribed}
            onCheckedChange={(checked) => {
              if (checked) {
                handleEnableNotifications()
              } else {
                handleDisableNotifications()
              }
            }}
            disabled={loading || permission === 'denied'}
            aria-label={isSubscribed ? 'Disable notifications' : 'Enable notifications'}
          />
        </div>

        {permission === 'denied' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              Push notifications are blocked in your browser. To enable them:
            </p>
            <ol className="mt-2 text-sm text-red-700 list-decimal list-inside space-y-1">
              <li>Click the lock icon in your browser's address bar</li>
              <li>Find "Notifications" in the permissions</li>
              <li>Change it from "Block" to "Allow"</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}

        {/* Notification Categories */}
        {isSubscribed && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium mb-3">Notification Categories</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose which types of notifications you want to receive
              </p>
            </div>
            
            <div className="space-y-3">
              {notificationCategories.map((category) => (
                <div
                  key={category.key}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    category.key === 'emergencies' && "border-red-200 bg-red-50"
                  )}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl" role="img" aria-hidden="true">
                      {category.icon}
                    </span>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`category-${category.key}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {category.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={`category-${category.key}`}
                    checked={preferences[category.key]}
                    onCheckedChange={(checked) => handlePreferenceChange(category.key, checked)}
                    disabled={category.key === 'emergencies'} // Always keep emergencies enabled
                    aria-label={`${preferences[category.key] ? 'Disable' : 'Enable'} ${category.label}`}
                  />
                </div>
              ))}
            </div>
            
            {/* Test Notification Button */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleTestNotification}
                className="w-full"
              >
                Send Test Notification
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}