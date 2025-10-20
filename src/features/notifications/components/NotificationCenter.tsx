/**
 * Notification Center Component
 * Phase 3.4.1: Real-time notification bell with dropdown
 */

import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Bell, Check, X } from 'lucide-react'
import { NotificationsService, Notification } from '../services/notifications.service'
import { supabase } from '@/shared/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        loadNotifications(user.id)
      } else {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  useEffect(() => {
    if (!userId) return

    // Subscribe to real-time notifications
    const unsubscribe = NotificationsService.subscribeToNotifications(
      userId,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev])
        setUnreadCount(prev => prev + 1)

        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/mydub-logo.png',
            tag: newNotification.id,
          })
        }
      }
    )

    return () => {
      unsubscribe()
    }
  }, [userId])

  const loadNotifications = async (uid: string) => {
    try {
      setLoading(true)
      const data = await NotificationsService.getNotifications(uid)
      setNotifications(data)

      const count = await NotificationsService.getUnreadCount(uid)
      setUnreadCount(count)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await NotificationsService.markAsRead(notification.id)
      setUnreadCount(prev => Math.max(0, prev - 1))
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
      )
    }

    // Navigate to link if provided
    if (notification.linkUrl) {
      navigate(notification.linkUrl)
    }
  }

  const handleMarkAllRead = async () => {
    if (!userId) return

    await NotificationsService.markAllAsRead(userId)
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  if (!userId) {
    return null // Don't show notification bell if not logged in
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-8 text-xs"
            >
              <Check className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="mx-auto mb-2 h-12 w-12 text-gray-300" />
              <p className="text-sm text-gray-500">No notifications yet</p>
              <Button
                variant="link"
                size="sm"
                onClick={requestNotificationPermission}
                className="mt-2 text-xs"
              >
                Enable browser notifications
              </Button>
            </div>
          ) : (
            notifications.map(notification => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`cursor-pointer px-4 py-3 ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${
                        !notification.read ? 'font-medium' : 'font-normal'
                      }`}
                    >
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate('/notifications')}
              className="cursor-pointer justify-center text-center text-sm text-ai-blue"
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
