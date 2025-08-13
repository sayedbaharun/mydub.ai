import { useState, useEffect, useCallback } from 'react';
import { getPWAManager, PWACapabilities, NotificationOptions, BackgroundSyncTask } from '@/shared/lib/pwa/pwaManager';
import { useToast } from '@/shared/hooks/use-toast';

interface UsePWAOptions {
  enableInstallPrompt?: boolean;
  enableNotifications?: boolean;
  enableBackgroundSync?: boolean;
}

/**
 * Main hook for PWA functionality
 */
export function usePWA(options: UsePWAOptions = {}) {
  const {
    enableInstallPrompt = true,
    enableNotifications = true,
    enableBackgroundSync = true
  } = options;

  const pwaManager = getPWAManager();
  const { toast } = useToast();

  const [capabilities, setCapabilities] = useState<PWACapabilities>();
  const [isInstallPromptAvailable, setIsInstallPromptAvailable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncTasks, setPendingSyncTasks] = useState<BackgroundSyncTask[]>([]);

  // Initialize PWA capabilities
  useEffect(() => {
    const updateCapabilities = () => {
      setCapabilities(pwaManager.getCapabilities());
    };

    updateCapabilities();

    // Set up event listeners
    const handleInstallPromptAvailable = () => {
      setIsInstallPromptAvailable(true);
      if (enableInstallPrompt && pwaManager.shouldShowInstallPrompt()) {
        toast({
          title: 'Install MyDub.AI',
          description: 'Install our app for a better experience!',
          action: {
            label: 'Install',
            onClick: () => handleInstall()
          }
        });
      }
    };

    const handleAppInstalled = () => {
      setIsInstallPromptAvailable(false);
      toast({
        title: 'App Installed!',
        description: 'MyDub.AI has been installed successfully.',
        variant: 'success'
      });
    };

    const handleConnectionLost = () => {
      setIsOnline(false);
      toast({
        title: 'You\'re offline',
        description: 'Some features may be limited.',
        variant: 'warning'
      });
    };

    const handleConnectionRestored = () => {
      setIsOnline(true);
      toast({
        title: 'Back online',
        description: 'All features are now available.',
        variant: 'success'
      });
    };

    const handleSWUpdateAvailable = () => {
      toast({
        title: 'Update Available',
        description: 'A new version of the app is available.',
        action: {
          label: 'Update',
          onClick: () => pwaManager.skipWaiting()
        }
      });
    };

    pwaManager.on('install_prompt_available', handleInstallPromptAvailable);
    pwaManager.on('app_installed', handleAppInstalled);
    pwaManager.on('connection_lost', handleConnectionLost);
    pwaManager.on('connection_restored', handleConnectionRestored);
    pwaManager.on('sw_update_available', handleSWUpdateAvailable);

    return () => {
      pwaManager.off('install_prompt_available', handleInstallPromptAvailable);
      pwaManager.off('app_installed', handleAppInstalled);
      pwaManager.off('connection_lost', handleConnectionLost);
      pwaManager.off('connection_restored', handleConnectionRestored);
      pwaManager.off('sw_update_available', handleSWUpdateAvailable);
    };
  }, [pwaManager, toast, enableInstallPrompt]);

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Update sync tasks
  useEffect(() => {
    const updateSyncTasks = () => {
      setPendingSyncTasks(pwaManager.getSyncTaskStatus());
    };

    updateSyncTasks();
    
    const handleSyncScheduled = () => updateSyncTasks();
    const handleSyncCompleted = () => updateSyncTasks();
    const handleSyncFailed = () => updateSyncTasks();

    pwaManager.on('background_sync_scheduled', handleSyncScheduled);
    pwaManager.on('background_sync_completed', handleSyncCompleted);
    pwaManager.on('background_sync_failed', handleSyncFailed);

    return () => {
      pwaManager.off('background_sync_scheduled', handleSyncScheduled);
      pwaManager.off('background_sync_completed', handleSyncCompleted);
      pwaManager.off('background_sync_failed', handleSyncFailed);
    };
  }, [pwaManager]);

  const handleInstall = useCallback(async () => {
    if (!isInstallPromptAvailable) return false;

    setIsInstalling(true);
    try {
      const result = await pwaManager.showInstallPrompt();
      if (!result) {
        pwaManager.markInstallDismissed();
      }
      return result;
    } catch (error) {
      toast({
        title: 'Installation failed',
        description: 'Could not install the app. Please try again.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [isInstallPromptAvailable, pwaManager, toast]);

  const requestNotifications = useCallback(async () => {
    if (!enableNotifications) return 'denied';

    try {
      const permission = await pwaManager.requestNotificationPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: 'Notifications enabled',
          description: 'You\'ll receive updates and alerts.',
          variant: 'success'
        });
      }
      
      return permission;
    } catch (error) {
      toast({
        title: 'Notification setup failed',
        description: 'Could not enable notifications.',
        variant: 'destructive'
      });
      return 'denied';
    }
  }, [enableNotifications, pwaManager, toast]);

  const showNotification = useCallback(async (options: NotificationOptions) => {
    if (notificationPermission !== 'granted') {
      const permission = await requestNotifications();
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }
    }

    await pwaManager.showNotification(options);
  }, [notificationPermission, pwaManager, requestNotifications]);

  const scheduleBackgroundSync = useCallback(async (
    name: string,
    data: any,
    options: {
      priority?: 'low' | 'normal' | 'high';
      maxRetries?: number;
    } = {}
  ) => {
    if (!enableBackgroundSync) return;

    const task = {
      id: crypto.randomUUID(),
      name,
      data,
      priority: options.priority || 'normal',
      maxRetries: options.maxRetries || 3
    } as const;

    await pwaManager.scheduleBackgroundSync(task);
  }, [enableBackgroundSync, pwaManager]);

  return {
    capabilities,
    isInstallPromptAvailable,
    isInstalling,
    isOnline,
    notificationPermission,
    pendingSyncTasks,
    install: handleInstall,
    requestNotifications,
    showNotification,
    scheduleBackgroundSync,
    clearFailedSyncTasks: () => pwaManager.clearFailedSyncTasks(),
    updateApp: () => pwaManager.skipWaiting(),
    getInstallStats: () => pwaManager.getInstallStats()
  };
}

/**
 * Hook for install prompt management
 */
export function useInstallPrompt() {
  const {
    isInstallPromptAvailable,
    isInstalling,
    install,
    getInstallStats
  } = usePWA({ enableInstallPrompt: true });

  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const pwaManager = getPWAManager();

  useEffect(() => {
    const shouldShow = isInstallPromptAvailable && 
                     !isDismissed && 
                     pwaManager.shouldShowInstallPrompt();
    setIsVisible(shouldShow);
  }, [isInstallPromptAvailable, isDismissed, pwaManager]);

  const show = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    setIsVisible(false);
    pwaManager.markInstallDismissed();
  }, [pwaManager]);

  const handleInstall = useCallback(async () => {
    const success = await install();
    if (success) {
      setIsVisible(false);
    }
    return success;
  }, [install]);

  return {
    isVisible,
    isInstalling,
    show,
    hide,
    dismiss,
    install: handleInstall,
    installStats: getInstallStats()
  };
}

/**
 * Hook for notification management
 */
export function useNotifications() {
  const {
    notificationPermission,
    requestNotifications,
    showNotification
  } = usePWA({ enableNotifications: true });

  const [queue, setQueue] = useState<NotificationOptions[]>([]);

  const queueNotification = useCallback((options: NotificationOptions) => {
    if (notificationPermission === 'granted') {
      showNotification(options);
    } else {
      setQueue(prev => [...prev, options]);
    }
  }, [notificationPermission, showNotification]);

  const processQueue = useCallback(async () => {
    if (notificationPermission !== 'granted') {
      const permission = await requestNotifications();
      if (permission !== 'granted') return;
    }

    for (const notification of queue) {
      await showNotification(notification);
    }
    setQueue([]);
  }, [notificationPermission, requestNotifications, showNotification, queue]);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    notificationPermission,
    queuedCount: queue.length,
    requestPermission: requestNotifications,
    showNotification,
    queueNotification,
    processQueue,
    clearQueue
  };
}

/**
 * Hook for background sync
 */
export function useBackgroundSync() {
  const {
    pendingSyncTasks,
    scheduleBackgroundSync,
    clearFailedSyncTasks,
    isOnline
  } = usePWA({ enableBackgroundSync: true });

  const scheduleSync = useCallback((
    name: string,
    data: any,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ) => {
    return scheduleBackgroundSync(name, data, { priority });
  }, [scheduleBackgroundSync]);

  const scheduleContentSync = useCallback((contentId: string, action: 'save' | 'update' | 'delete') => {
    return scheduleSync('content-sync', { contentId, action }, 'normal');
  }, [scheduleSync]);

  const scheduleSearchSync = useCallback((query: string, results: any[]) => {
    return scheduleSync('search-sync', { query, results }, 'low');
  }, [scheduleSync]);

  const scheduleUserSync = useCallback((data: any) => {
    return scheduleSync('user-sync', data, 'high');
  }, [scheduleSync]);

  return {
    pendingTasks: pendingSyncTasks,
    isOnline,
    scheduleContentSync,
    scheduleSearchSync,
    scheduleUserSync,
    clearFailedTasks: clearFailedSyncTasks,
    hasPendingTasks: pendingSyncTasks.length > 0,
    failedTasksCount: pendingSyncTasks.filter(task => task.retryCount >= task.maxRetries).length
  };
}

/**
 * Hook for offline detection and handling
 */
export function useOfflineDetection() {
  const { isOnline } = usePWA();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setWasOffline(false);
    }
  }, [isOnline, wasOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    connectionStatus: isOnline ? 'online' : 'offline'
  };
}