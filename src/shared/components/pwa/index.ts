// PWA Component Exports
export { default as PWAProvider } from './PWAProvider';
export { InstallPrompt, InstallButton, PWAStatus } from './InstallPrompt';
export { OfflineIndicator, ConnectionStatus, SyncIndicator } from './OfflineIndicator';
export { 
  NotificationCenter, 
  NotificationPermissionPrompt, 
  NotificationBadge 
} from './NotificationCenter';

// Offline Components
export { OfflineDataManager } from '@/shared/components/offline';

// Re-export hooks
export { 
  usePWA, 
  useInstallPrompt, 
  useNotifications, 
  useBackgroundSync, 
  useOfflineDetection 
} from '@/shared/hooks/usePWA';

export {
  useOffline,
  useOfflineArticles,
  useOfflineSearch,
  useOfflineUserData,
  useOfflineSettings,
  useOfflineBackup
} from '@/shared/hooks/useOffline';

// Re-export managers
export { getPWAManager } from '@/shared/lib/pwa/pwaManager';
export { getOfflineManager } from '@/shared/lib/offline/offlineManager';

// Re-export types
export type { 
  PWACapabilities, 
  NotificationOptions, 
  BackgroundSyncTask,
  InstallPromptEvent 
} from '@/shared/lib/pwa/pwaManager';

export type {
  OfflineData,
  OfflineSettings,
  SyncQueue
} from '@/shared/lib/offline/offlineManager';