/**
 * Live Update Indicator Component
 * Shows real-time connection status and new update notifications
 */

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, Bell, BellRing } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'
import { cn } from '@/shared/lib/utils'

interface LiveUpdateIndicatorProps {
  categories?: string[]
  className?: string
  showUpdatesPopover?: boolean
}

export function LiveUpdateIndicator({
  categories,
  className,
  showUpdatesPopover = true,
}: LiveUpdateIndicatorProps) {
  const { updates, connectionStatus, isConnected, clearUpdates } = useRealtimeUpdates({ categories })
  const [hasNewUpdates, setHasNewUpdates] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  // Track new updates
  useEffect(() => {
    if (updates.length > 0 && !isPopoverOpen) {
      setHasNewUpdates(true)
    }
  }, [updates.length, isPopoverOpen])

  // Clear "new" indicator when popover is opened
  useEffect(() => {
    if (isPopoverOpen) {
      setHasNewUpdates(false)
    }
  }, [isPopoverOpen])

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-3 w-3" />
      case 'reconnecting':
        return <RefreshCw className="h-3 w-3 animate-spin" />
      case 'disconnected':
        return <WifiOff className="h-3 w-3" />
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500'
      case 'reconnecting':
        return 'bg-yellow-500'
      case 'disconnected':
        return 'bg-red-500'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live'
      case 'reconnecting':
        return 'Reconnecting'
      case 'disconnected':
        return 'Offline'
    }
  }

  if (!showUpdatesPopover) {
    // Simple indicator without popover
    return (
      <Badge variant="outline" className={cn('flex items-center gap-1.5', className)}>
        <span className={cn('h-2 w-2 rounded-full', getStatusColor())} />
        {getStatusIcon()}
        <span className="text-xs font-medium">{getStatusText()}</span>
      </Badge>
    )
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('relative flex items-center gap-2', className)}
        >
          <span className={cn('h-2 w-2 rounded-full', getStatusColor())} />
          {getStatusIcon()}
          <span className="text-xs font-medium">{getStatusText()}</span>
          {updates.length > 0 && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-semibold">{updates.length}</span>
            </>
          )}
          {hasNewUpdates && (
            <BellRing className="absolute -right-1 -top-1 h-3 w-3 text-primary animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <h4 className="text-sm font-semibold">Recent Updates</h4>
          </div>
          {updates.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                clearUpdates()
                setHasNewUpdates(false)
              }}
            >
              Clear All
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {updates.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No recent updates</p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll see new article notifications here
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {updates.map((update) => (
                <UpdateItem key={update.id} update={update} />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-3 text-xs text-muted-foreground text-center">
          {isConnected ? '🟢 Connected to live updates' : '🔴 Not connected'}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Individual Update Item
 */
function UpdateItem({ update }: { update: any }) {
  const getUpdateTypeLabel = () => {
    switch (update.type) {
      case 'INSERT':
        return 'New Article'
      case 'UPDATE':
        return 'Updated'
      case 'DELETE':
        return 'Removed'
      default:
        return 'Update'
    }
  }

  const getUpdateTypeColor = () => {
    switch (update.type) {
      case 'INSERT':
        return 'bg-green-500/10 text-green-700 dark:text-green-400'
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
      case 'DELETE':
        return 'bg-red-500/10 text-red-700 dark:text-red-400'
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
    }
  }

  const getTimeAgo = () => {
    const seconds = Math.floor((Date.now() - update.timestamp.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1">
        <Badge className={cn('text-xs', getUpdateTypeColor())}>{getUpdateTypeLabel()}</Badge>
        <span className="text-xs text-muted-foreground">{getTimeAgo()}</span>
      </div>
      <p className="text-sm font-medium line-clamp-2">{update.payload?.title || 'Untitled'}</p>
      {update.category && (
        <span className="text-xs text-muted-foreground mt-1 inline-block">
          {update.category}
        </span>
      )}
    </div>
  )
}
