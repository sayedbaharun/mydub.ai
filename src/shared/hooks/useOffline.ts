import { useState, useEffect, useCallback } from 'react';
import { getOfflineManager, OfflineData, OfflineSettings } from '@/shared/lib/offline/offlineManager';
import { useToast } from '@/shared/hooks/use-toast';

interface UseOfflineOptions {
  enableAutoSync?: boolean;
  enablePeriodicCleanup?: boolean;
  syncInterval?: number; // in milliseconds
}

/**
 * Main hook for offline functionality
 */
export function useOffline(options: UseOfflineOptions = {}) {
  const {
    enableAutoSync = true,
    enablePeriodicCleanup = true,
    syncInterval = 30000 // 30 seconds
  } = options;

  const offlineManager = getOfflineManager();
  const { toast } = useToast();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStats, setSyncStats] = useState<{
    totalItems: number;
    syncedItems: number;
    pendingSync: number;
    failedSync: number;
    queueSize: number;
  }>({
    totalItems: 0,
    syncedItems: 0,
    pendingSync: 0,
    failedSync: 0,
    queueSize: 0
  });

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Back online',
        description: 'Syncing your data...',
        variant: 'success'
      });
      
      if (enableAutoSync) {
        offlineManager.processSyncQueue();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'You\'re offline',
        description: 'Your data will be saved and synced when you\'re back online.',
        variant: 'warning'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableAutoSync, offlineManager, toast]);

  // Set up periodic sync
  useEffect(() => {
    if (!enableAutoSync || !isOnline) return;

    const interval = setInterval(() => {
      offlineManager.processSyncQueue();
    }, syncInterval);

    return () => clearInterval(interval);
  }, [enableAutoSync, isOnline, syncInterval, offlineManager]);

  // Set up periodic cleanup
  useEffect(() => {
    if (!enablePeriodicCleanup) return;

    const interval = setInterval(() => {
      offlineManager.cleanup();
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, [enablePeriodicCleanup, offlineManager]);

  // Update sync stats
  const updateSyncStats = useCallback(async () => {
    try {
      const stats = await offlineManager.getSyncStats();
      setSyncStats(stats);
    } catch (error) {
      console.error('Failed to get sync stats:', error);
    }
  }, [offlineManager]);

  // Set up event listeners
  useEffect(() => {
    const handleDataStored = () => updateSyncStats();
    const handleDataSynced = () => updateSyncStats();
    const handleSyncCompleted = () => updateSyncStats();

    offlineManager.on('data_stored', handleDataStored);
    offlineManager.on('data_synced', handleDataSynced);
    offlineManager.on('sync_completed', handleSyncCompleted);

    // Initial stats load
    updateSyncStats();

    return () => {
      offlineManager.off('data_stored', handleDataStored);
      offlineManager.off('data_synced', handleDataSynced);
      offlineManager.off('sync_completed', handleSyncCompleted);
    };
  }, [offlineManager, updateSyncStats]);

  const storeData = useCallback(async (
    id: string,
    type: OfflineData['type'],
    data: any,
    options?: {
      priority?: 'low' | 'normal' | 'high';
      expiresIn?: number;
    }
  ) => {
    await offlineManager.storeData(id, type, data, options);
  }, [offlineManager]);

  const getData = useCallback(async (id: string) => {
    return offlineManager.getData(id);
  }, [offlineManager]);

  const getDataByType = useCallback(async (type: OfflineData['type']) => {
    return offlineManager.getDataByType(type);
  }, [offlineManager]);

  const deleteData = useCallback(async (id: string) => {
    await offlineManager.deleteData(id);
  }, [offlineManager]);

  const queueSync = useCallback(async (
    action: 'create' | 'update' | 'delete',
    type: string,
    data: any,
    options?: {
      priority?: 'low' | 'normal' | 'high';
      maxRetries?: number;
    }
  ) => {
    await offlineManager.queueSync(action, type, data, options);
  }, [offlineManager]);

  const forceSync = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: 'Cannot sync',
        description: 'You need to be online to sync data.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await offlineManager.processSyncQueue();
      toast({
        title: 'Sync completed',
        description: 'Your data has been synchronized.',
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: 'Could not sync your data. Please try again.',
        variant: 'destructive'
      });
    }
  }, [isOnline, offlineManager, toast]);

  const clearAllData = useCallback(async () => {
    await offlineManager.clearAll();
    toast({
      title: 'Data cleared',
      description: 'All offline data has been removed.',
      variant: 'success'
    });
  }, [offlineManager, toast]);

  return {
    isOnline,
    isOffline: !isOnline,
    syncStats,
    storeData,
    getData,
    getDataByType,
    deleteData,
    queueSync,
    forceSync,
    clearAllData,
    hasPendingSync: syncStats.pendingSync > 0,
    hasFailedSync: syncStats.failedSync > 0
  };
}

/**
 * Hook for offline article management
 */
export function useOfflineArticles() {
  const { storeData, getData, getDataByType, deleteData, queueSync } = useOffline();

  const saveArticle = useCallback(async (article: any) => {
    await storeData(
      `article_${article.id}`,
      'article',
      article,
      { priority: 'normal', expiresIn: 48 } // 48 hours
    );
  }, [storeData]);

  const getArticle = useCallback(async (articleId: string) => {
    const data = await getData(`article_${articleId}`);
    return data?.data;
  }, [getData]);

  const getAllArticles = useCallback(async () => {
    const data = await getDataByType('article');
    return data.map(item => item.data);
  }, [getDataByType]);

  const removeArticle = useCallback(async (articleId: string) => {
    await deleteData(`article_${articleId}`);
  }, [deleteData]);

  const syncArticle = useCallback(async (
    action: 'create' | 'update' | 'delete',
    article: any
  ) => {
    await queueSync(action, 'article', article, { priority: 'normal' });
  }, [queueSync]);

  return {
    saveArticle,
    getArticle,
    getAllArticles,
    removeArticle,
    syncArticle
  };
}

/**
 * Hook for offline search management
 */
export function useOfflineSearch() {
  const { storeData, getData, getDataByType, queueSync } = useOffline();

  const saveSearch = useCallback(async (query: string, results: any[]) => {
    const searchData = {
      query,
      results,
      timestamp: new Date()
    };

    await storeData(
      `search_${btoa(query)}`,
      'search',
      searchData,
      { priority: 'low', expiresIn: 6 } // 6 hours
    );
  }, [storeData]);

  const getSearchResults = useCallback(async (query: string) => {
    const data = await getData(`search_${btoa(query)}`);
    return data?.data;
  }, [getData]);

  const getAllSearches = useCallback(async () => {
    const data = await getDataByType('search');
    return data.map(item => item.data);
  }, [getDataByType]);

  const syncSearch = useCallback(async (searchData: any) => {
    await queueSync('create', 'search', searchData, { priority: 'low' });
  }, [queueSync]);

  return {
    saveSearch,
    getSearchResults,
    getAllSearches,
    syncSearch
  };
}

/**
 * Hook for offline user data management
 */
export function useOfflineUserData() {
  const { storeData, getData, queueSync } = useOffline();

  const saveUserData = useCallback(async (data: any) => {
    await storeData(
      'user_data',
      'user_data',
      data,
      { priority: 'high' }
    );
  }, [storeData]);

  const getUserData = useCallback(async () => {
    const data = await getData('user_data');
    return data?.data;
  }, [getData]);

  const syncUserData = useCallback(async (userData: any) => {
    await queueSync('update', 'user_data', userData, { priority: 'high' });
  }, [queueSync]);

  return {
    saveUserData,
    getUserData,
    syncUserData
  };
}

/**
 * Hook for offline settings management
 */
export function useOfflineSettings() {
  const offlineManager = getOfflineManager();
  const [settings, setSettings] = useState<OfflineSettings | null>(null);

  useEffect(() => {
    offlineManager.getSettings().then(setSettings);
  }, [offlineManager]);

  const updateSettings = useCallback(async (newSettings: Partial<OfflineSettings>) => {
    await offlineManager.updateSettings(newSettings);
    const updatedSettings = await offlineManager.getSettings();
    setSettings(updatedSettings);
  }, [offlineManager]);

  return {
    settings,
    updateSettings
  };
}

/**
 * Hook for offline data export/import
 */
export function useOfflineBackup() {
  const offlineManager = getOfflineManager();
  const { toast } = useToast();

  const exportData = useCallback(async () => {
    try {
      const data = await offlineManager.exportData();
      
      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mydub-offline-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export completed',
        description: 'Your offline data has been exported.',
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Could not export your data.',
        variant: 'destructive'
      });
    }
  }, [offlineManager, toast]);

  const importData = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      await offlineManager.importData(data);
      
      toast({
        title: 'Import completed',
        description: 'Your offline data has been imported.',
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'Could not import the data file.',
        variant: 'destructive'
      });
    }
  }, [offlineManager, toast]);

  return {
    exportData,
    importData
  };
}