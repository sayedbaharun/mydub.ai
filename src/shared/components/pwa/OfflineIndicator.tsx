import React from 'react';
import { WifiOff, Wifi, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { useOfflineDetection, useBackgroundSync } from '@/shared/hooks/usePWA';
import { motion, AnimatePresence } from 'framer-motion';

interface OfflineIndicatorProps {
  variant?: 'badge' | 'banner' | 'card';
  className?: string;
  showSyncStatus?: boolean;
}

export function OfflineIndicator({ 
  variant = 'badge', 
  className = '',
  showSyncStatus = true 
}: OfflineIndicatorProps) {
  const { isOnline, isOffline, wasOffline, connectionStatus } = useOfflineDetection();
  const { pendingTasks, hasPendingTasks, failedTasksCount, clearFailedTasks } = useBackgroundSync();

  if (variant === 'badge') {
    return (
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={className}
          >
            <Badge 
              variant="destructive" 
              className="flex items-center gap-1"
            >
              <WifiOff className="h-3 w-3" />
              Offline
            </Badge>
          </motion.div>
        )}
        
        {isOnline && wasOffline && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={className}
          >
            <Badge 
              variant="default" 
              className="flex items-center gap-1 bg-green-500"
            >
              <Wifi className="h-3 w-3" />
              Back online
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (variant === 'banner') {
    return (
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className={`fixed top-0 left-0 right-0 z-40 bg-orange-500 text-white p-3 shadow-lg ${className}`}
          >
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <WifiOff className="h-5 w-5" />
                <div>
                  <div className="font-medium">You're offline</div>
                  <div className="text-sm opacity-90">
                    Some features may be limited. Data will sync when you're back online.
                  </div>
                </div>
              </div>
              
              {showSyncStatus && hasPendingTasks && (
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {pendingTasks.length} pending sync{pendingTasks.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={className}
        >
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <WifiOff className="h-5 w-5" />
                Offline Mode
              </CardTitle>
              <CardDescription className="text-orange-700">
                You're currently offline. Your changes will be saved and synced when you reconnect.
              </CardDescription>
            </CardHeader>
            
            {showSyncStatus && (
              <CardContent>
                <SyncStatus />
              </CardContent>
            )}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SyncStatus() {
  const { 
    pendingTasks, 
    hasPendingTasks, 
    failedTasksCount, 
    clearFailedTasks,
    isOnline 
  } = useBackgroundSync();

  if (!hasPendingTasks && failedTasksCount === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700">
        <CheckCircle className="h-4 w-4" />
        <span>All data synced</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Sync Status</span>
        {isOnline && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            Syncing...
          </div>
        )}
      </div>

      {pendingTasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Pending tasks</span>
            <span>{pendingTasks.length}</span>
          </div>
          
          <div className="space-y-1">
            {pendingTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${
                  task.retryCount >= task.maxRetries ? 'bg-red-500' : 
                  isOnline ? 'bg-blue-500 animate-pulse' : 'bg-orange-500'
                }`} />
                <span className="flex-1 truncate">{task.name}</span>
                <Badge variant="outline" className="text-xs">
                  {task.priority}
                </Badge>
              </div>
            ))}
            
            {pendingTasks.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{pendingTasks.length - 3} more tasks
              </div>
            )}
          </div>
        </div>
      )}

      {failedTasksCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{failedTasksCount} failed tasks</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFailedTasks}
            className="w-full"
          >
            Clear failed tasks
          </Button>
        </div>
      )}
    </div>
  );
}

export function ConnectionStatus({ className = '' }: { className?: string }) {
  const { isOnline, connectionStatus } = useOfflineDetection();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-green-500' : 'bg-red-500'
      }`} />
      <span className="text-sm text-muted-foreground capitalize">
        {connectionStatus}
      </span>
    </div>
  );
}

export function SyncIndicator({ className = '' }: { className?: string }) {
  const { hasPendingTasks, isOnline } = useBackgroundSync();

  if (!hasPendingTasks) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isOnline ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm text-muted-foreground">Syncing...</span>
        </>
      ) : (
        <>
          <div className="w-4 h-4 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">Waiting to sync</span>
        </>
      )}
    </div>
  );
}

export default OfflineIndicator;