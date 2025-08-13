/**
 * Push Notification Service for MyDub.AI
 * Handles push notification subscription and management
 */

import { supabase } from '@/shared/lib/supabase/supabaseClient'
import { toast } from '@/shared/services/toast.service'

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

interface NotificationPreferences {
  news: boolean
  events: boolean
  weather: boolean
  traffic: boolean
  government: boolean
  emergencies: boolean
}

class PushNotificationService {
  private static instance: PushNotificationService
  private swRegistration: ServiceWorkerRegistration | null = null
  private isSupported: boolean = false

  private constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService()
    }
    return PushNotificationService.instance
  }

  /**
   * Initialize push notification service
   */
  async initialize(swRegistration: ServiceWorkerRegistration) {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported')
      return
    }

    this.swRegistration = swRegistration
  }

  /**
   * Check if push notifications are supported
   */
  isNotificationSupported(): boolean {
    return this.isSupported
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported) return 'denied'
    return Notification.permission
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      toast.error('Push notifications are not supported in your browser')
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        toast.success('Push notifications enabled successfully!')
      } else if (permission === 'denied') {
        toast.error('Push notifications have been blocked. Please enable them in your browser settings.')
      }
      
      return permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      toast.error('Failed to request notification permission')
      return 'denied'
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId?: string): Promise<boolean> {
    if (!this.isSupported || !this.swRegistration) {
      return false
    }

    if (Notification.permission !== 'granted') {
      const permission = await this.requestPermission()
      if (permission !== 'granted') return false
    }

    try {
      // Get the public key from environment or server
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY'
      const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey)

      // Subscribe to push notifications
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      })

      // Save subscription to server
      await this.saveSubscription(subscription, userId)
      
      toast.success('Successfully subscribed to push notifications!')
      return true
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      toast.error('Failed to subscribe to push notifications')
      return false
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId?: string): Promise<boolean> {
    if (!this.isSupported || !this.swRegistration) {
      return false
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription()
      if (!subscription) {
        return true
      }

      // Unsubscribe from push manager
      const success = await subscription.unsubscribe()
      
      if (success) {
        // Remove subscription from server
        await this.removeSubscription(subscription, userId)
        toast.success('Successfully unsubscribed from push notifications')
      }
      
      return success
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      toast.error('Failed to unsubscribe from push notifications')
      return false
    }
  }

  /**
   * Check if user is subscribed
   */
  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported || !this.swRegistration) {
      return false
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription()
      return !!subscription
    } catch (error) {
      console.error('Failed to check subscription status:', error)
      return false
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: NotificationPreferences, userId?: string): Promise<boolean> {
    try {
      if (userId) {
        // Save to Supabase for authenticated users
        const { error } = await supabase
          .from('notification_preferences')
          .upsert({
            user_id: userId,
            ...preferences,
            updated_at: new Date().toISOString()
          })

        if (error) throw error
      } else {
        // Save to local storage for anonymous users
        localStorage.setItem('notificationPreferences', JSON.stringify(preferences))
      }

      toast.success('Notification preferences updated')
      return true
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      toast.error('Failed to update notification preferences')
      return false
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId?: string): Promise<NotificationPreferences> {
    const defaultPreferences: NotificationPreferences = {
      news: true,
      events: true,
      weather: true,
      traffic: false,
      government: true,
      emergencies: true
    }

    try {
      if (userId) {
        // Get from Supabase for authenticated users
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error || !data) return defaultPreferences

        return {
          news: data.news,
          events: data.events,
          weather: data.weather,
          traffic: data.traffic,
          government: data.government,
          emergencies: data.emergencies
        }
      } else {
        // Get from local storage for anonymous users
        const stored = localStorage.getItem('notificationPreferences')
        return stored ? JSON.parse(stored) : defaultPreferences
      }
    } catch (error) {
      console.error('Failed to get notification preferences:', error)
      return defaultPreferences
    }
  }

  /**
   * Show a test notification
   */
  async showTestNotification(): Promise<void> {
    if (!this.isSupported) {
      toast.error('Notifications are not supported in your browser')
      return
    }

    if (Notification.permission !== 'granted') {
      await this.requestPermission()
      if (Notification.permission !== 'granted') return
    }

    try {
      const notification = new Notification('MyDub.AI Test Notification', {
        body: 'Push notifications are working correctly!',
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        vibrate: [200, 100, 200],
        tag: 'test-notification',
        data: {
          url: '/'
        }
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      toast.success('Test notification sent!')
    } catch (error) {
      console.error('Failed to show test notification:', error)
      toast.error('Failed to show test notification')
    }
  }

  /**
   * Private helper methods
   */
  private async saveSubscription(subscription: PushSubscription, userId?: string): Promise<void> {
    const subscriptionData = {
      endpoint: subscription.endpoint,
      p256dh: subscription.toJSON().keys?.p256dh || '',
      auth: subscription.toJSON().keys?.auth || '',
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString()
    }

    if (userId) {
      // Save to Supabase for authenticated users
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          ...subscriptionData
        })

      if (error) throw error
    } else {
      // Save to local storage for anonymous users
      localStorage.setItem('pushSubscription', JSON.stringify(subscriptionData))
    }
  }

  private async removeSubscription(subscription: PushSubscription, userId?: string): Promise<void> {
    if (userId) {
      // Remove from Supabase for authenticated users
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', subscription.endpoint)

      if (error) throw error
    } else {
      // Remove from local storage for anonymous users
      localStorage.removeItem('pushSubscription')
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}

export const pushNotificationService = PushNotificationService.getInstance()
export type { NotificationPreferences }