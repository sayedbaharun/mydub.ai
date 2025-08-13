// Offline Component Exports
export { default as OfflineDataManager } from './OfflineDataManager';

// Re-export hooks
export { 
  useOffline, 
  useOfflineArticles, 
  useOfflineSearch, 
  useOfflineUserData,
  useOfflineSettings,
  useOfflineBackup
} from '@/shared/hooks/useOffline';

// Re-export offline manager
export { getOfflineManager } from '@/shared/lib/offline/offlineManager';

// Re-export types
export type { 
  OfflineData, 
  OfflineSettings, 
  SyncQueue 
} from '@/shared/lib/offline/offlineManager';