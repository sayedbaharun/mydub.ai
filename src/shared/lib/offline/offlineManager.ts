/**
 * Offline Manager for MyDub.AI
 * Handles offline data storage, sync, and cache management
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface OfflineData {
  id: string;
  type: 'article' | 'weather' | 'traffic' | 'search' | 'user_data';
  data: any;
  timestamp: Date;
  lastUpdated: Date;
  synced: boolean;
  priority: 'low' | 'normal' | 'high';
  expiresAt?: Date;
  version: number;
}

export interface SyncQueue {
  id: string;
  action: 'create' | 'update' | 'delete';
  type: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high';
}

export interface OfflineSettings {
  maxCacheSize: number; // in MB
  maxAge: number; // in hours
  syncOnConnection: boolean;
  enableCompression: boolean;
  prioritySync: boolean;
}

interface OfflineDB extends DBSchema {
  data: {
    key: string;
    value: OfflineData;
    indexes: {
      'by-type': string;
      'by-timestamp': Date;
      'by-synced': boolean;
    };
  };
  syncQueue: {
    key: string;
    value: SyncQueue;
    indexes: {
      'by-priority': 'low' | 'normal' | 'high';
      'by-type': string;
      'by-timestamp': Date;
    };
  };
  settings: {
    key: string;
    value: any;
  };
  metadata: {
    key: string;
    value: {
      lastSync: Date;
      totalSize: number;
      version: string;
    };
  };
}

class OfflineManager {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private isInitialized = false;
  private eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  
  private defaultSettings: OfflineSettings = {
    maxCacheSize: 100, // 100MB
    maxAge: 24, // 24 hours
    syncOnConnection: true,
    enableCompression: true,
    prioritySync: true
  };

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.db = await openDB<OfflineDB>('mydub-offline', 1, {
        upgrade(db) {
          // Data store
          const dataStore = db.createObjectStore('data', { keyPath: 'id' });
          dataStore.createIndex('by-type', 'type');
          dataStore.createIndex('by-timestamp', 'timestamp');
          dataStore.createIndex('by-synced', 'synced');

          // Sync queue store
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('by-priority', 'priority');
          syncStore.createIndex('by-type', 'type');
          syncStore.createIndex('by-timestamp', 'timestamp');

          // Settings store
          db.createObjectStore('settings', { keyPath: 'key' });

          // Metadata store
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      });

      // Initialize default settings
      await this.initializeSettings();
      
      this.isInitialized = true;
      this.emit('initialized');

      // Set up periodic cleanup
      this.scheduleCleanup();

    } catch (error) {
      console.error('Failed to initialize offline database:', error);
      this.emit('initialization_failed', error);
    }
  }

  private async initializeSettings(): Promise<void> {
    if (!this.db) return;

    const existingSettings = await this.db.get('settings', 'offlineSettings');
    if (!existingSettings) {
      await this.db.put('settings', {
        key: 'offlineSettings',
        value: this.defaultSettings
      });
    }
  }

  /**
   * Store data offline
   */
  async storeData(
    id: string,
    type: OfflineData['type'],
    data: any,
    options: {
      priority?: 'low' | 'normal' | 'high';
      expiresIn?: number; // hours
      version?: number;
    } = {}
  ): Promise<void> {
    await this.ensureInitialized();

    const {
      priority = 'normal',
      expiresIn,
      version = 1
    } = options;

    const offlineData: OfflineData = {
      id,
      type,
      data: await this.compressData(data),
      timestamp: new Date(),
      lastUpdated: new Date(),
      synced: false,
      priority,
      version,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 60 * 60 * 1000) : undefined
    };

    await this.db!.put('data', offlineData);
    await this.updateMetadata();
    
    this.emit('data_stored', { id, type });
  }

  /**
   * Retrieve data from offline storage
   */
  async getData(id: string): Promise<OfflineData | null> {
    await this.ensureInitialized();

    const data = await this.db!.get('data', id);
    if (!data) return null;

    // Check if data is expired
    if (data.expiresAt && data.expiresAt < new Date()) {
      await this.deleteData(id);
      return null;
    }

    // Decompress data
    data.data = await this.decompressData(data.data);
    return data;
  }

  /**
   * Get data by type
   */
  async getDataByType(type: OfflineData['type']): Promise<OfflineData[]> {
    await this.ensureInitialized();

    const data = await this.db!.getAllFromIndex('data', 'by-type', type);
    const validData = [];

    for (const item of data) {
      // Check expiration
      if (item.expiresAt && item.expiresAt < new Date()) {
        await this.deleteData(item.id);
        continue;
      }

      // Decompress data
      item.data = await this.decompressData(item.data);
      validData.push(item);
    }

    return validData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Delete data
   */
  async deleteData(id: string): Promise<void> {
    await this.ensureInitialized();
    await this.db!.delete('data', id);
    await this.updateMetadata();
    this.emit('data_deleted', { id });
  }

  /**
   * Queue action for sync
   */
  async queueSync(
    action: SyncQueue['action'],
    type: string,
    data: any,
    options: {
      priority?: 'low' | 'normal' | 'high';
      maxRetries?: number;
    } = {}
  ): Promise<void> {
    await this.ensureInitialized();

    const {
      priority = 'normal',
      maxRetries = 3
    } = options;

    const syncItem: SyncQueue = {
      id: crypto.randomUUID(),
      action,
      type,
      data: await this.compressData(data),
      timestamp: new Date(),
      retryCount: 0,
      maxRetries,
      priority
    };

    await this.db!.put('syncQueue', syncItem);
    this.emit('sync_queued', syncItem);

    // Try immediate sync if online
    if (navigator.onLine) {
      this.processSyncQueue();
    }
  }

  /**
   * Process sync queue
   */
  async processSyncQueue(): Promise<void> {
    await this.ensureInitialized();
    
    if (!navigator.onLine) {
            return;
    }

    const settings = await this.getSettings();
    let items = await this.db!.getAll('syncQueue');

    // Sort by priority and timestamp
    if (settings.prioritySync) {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      items.sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp.getTime() - b.timestamp.getTime();
      });
    }

    for (const item of items) {
      try {
        await this.syncItem(item);
        await this.db!.delete('syncQueue', item.id);
        this.emit('sync_completed', item);
      } catch (error) {
        console.error('Sync failed for item:', item.id, error);
        
        item.retryCount++;
        if (item.retryCount >= item.maxRetries) {
          await this.db!.delete('syncQueue', item.id);
          this.emit('sync_failed_permanently', { item, error });
        } else {
          await this.db!.put('syncQueue', item);
          this.emit('sync_retry_scheduled', { item, error });
        }
      }
    }
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncQueue): Promise<void> {
    const data = await this.decompressData(item.data);
    
    const endpoint = this.getSyncEndpoint(item.type, item.action);
    const method = this.getSyncMethod(item.action);

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Sync': 'true'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    // Update local data if needed
    if (item.action === 'create' || item.action === 'update') {
      const responseData = await response.json();
      if (responseData.id) {
        await this.markAsSynced(responseData.id);
      }
    }
  }

  /**
   * Mark data as synced
   */
  async markAsSynced(id: string): Promise<void> {
    await this.ensureInitialized();
    
    const data = await this.db!.get('data', id);
    if (data) {
      data.synced = true;
      data.lastUpdated = new Date();
      await this.db!.put('data', data);
      this.emit('data_synced', { id });
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    totalItems: number;
    syncedItems: number;
    pendingSync: number;
    failedSync: number;
    queueSize: number;
  }> {
    await this.ensureInitialized();

    const allData = await this.db!.getAll('data');
    const syncQueue = await this.db!.getAll('syncQueue');

    const syncedItems = allData.filter(item => item.synced).length;
    const failedSync = syncQueue.filter(item => item.retryCount >= item.maxRetries).length;

    return {
      totalItems: allData.length,
      syncedItems,
      pendingSync: allData.length - syncedItems,
      failedSync,
      queueSize: syncQueue.length
    };
  }

  /**
   * Clean up expired and old data
   */
  async cleanup(): Promise<void> {
    await this.ensureInitialized();
    
    const settings = await this.getSettings();
    const now = new Date();
    const maxAge = new Date(now.getTime() - settings.maxAge * 60 * 60 * 1000);

    // Get all data
    const allData = await this.db!.getAll('data');
    let deletedCount = 0;

    for (const item of allData) {
      const shouldDelete = 
        (item.expiresAt && item.expiresAt < now) ||
        (item.timestamp < maxAge && item.synced) ||
        (item.timestamp < maxAge && item.priority === 'low');

      if (shouldDelete) {
        await this.db!.delete('data', item.id);
        deletedCount++;
      }
    }

    // Check cache size
    await this.enforceMaxCacheSize();
    await this.updateMetadata();

    this.emit('cleanup_completed', { deletedCount });
  }

  /**
   * Enforce maximum cache size
   */
  private async enforceMaxCacheSize(): Promise<void> {
    const settings = await this.getSettings();
    const metadata = await this.getMetadata();
    
    if (metadata.totalSize > settings.maxCacheSize * 1024 * 1024) {
      // Remove oldest, synced, low-priority items first
      const allData = await this.db!.getAll('data');
      
      allData.sort((a, b) => {
        // Priority: synced > unsynced, low priority > high priority, old > new
        if (a.synced !== b.synced) return a.synced ? -1 : 1;
        
        const priorityOrder = { low: 1, normal: 2, high: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return a.timestamp.getTime() - b.timestamp.getTime();
      });

      // Remove items until size is under limit
      for (const item of allData) {
        await this.db!.delete('data', item.id);
        
        const newMetadata = await this.calculateMetadata();
        if (newMetadata.totalSize <= settings.maxCacheSize * 1024 * 1024 * 0.8) {
          break;
        }
      }
    }
  }

  /**
   * Get offline settings
   */
  async getSettings(): Promise<OfflineSettings> {
    await this.ensureInitialized();
    
    const settings = await this.db!.get('settings', 'offlineSettings');
    return settings?.value || this.defaultSettings;
  }

  /**
   * Update offline settings
   */
  async updateSettings(newSettings: Partial<OfflineSettings>): Promise<void> {
    await this.ensureInitialized();
    
    const currentSettings = await this.getSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    
    await this.db!.put('settings', {
      key: 'offlineSettings',
      value: updatedSettings
    });

    this.emit('settings_updated', updatedSettings);
  }

  /**
   * Get metadata
   */
  private async getMetadata(): Promise<{
    lastSync: Date;
    totalSize: number;
    version: string;
  }> {
    await this.ensureInitialized();
    
    const metadata = await this.db!.get('metadata', 'info');
    return metadata?.value || {
      lastSync: new Date(0),
      totalSize: 0,
      version: '1.0.0'
    };
  }

  /**
   * Update metadata
   */
  private async updateMetadata(): Promise<void> {
    const metadata = await this.calculateMetadata();
    await this.db!.put('metadata', {
      key: 'info',
      value: metadata
    });
  }

  /**
   * Calculate current metadata
   */
  private async calculateMetadata(): Promise<{
    lastSync: Date;
    totalSize: number;
    version: string;
  }> {
    const allData = await this.db!.getAll('data');
    const totalSize = allData.reduce((size, item) => {
      return size + this.estimateObjectSize(item);
    }, 0);

    return {
      lastSync: new Date(),
      totalSize,
      version: '1.0.0'
    };
  }

  /**
   * Estimate object size in bytes
   */
  private estimateObjectSize(obj: any): number {
    return new Blob([JSON.stringify(obj)]).size;
  }

  /**
   * Compress data if compression is enabled
   */
  private async compressData(data: any): Promise<any> {
    const settings = await this.getSettings();
    
    if (!settings.enableCompression) {
      return data;
    }

    // Simple compression using JSON stringify
    // In a real implementation, you might use a compression library
    return JSON.stringify(data);
  }

  /**
   * Decompress data
   */
  private async decompressData(data: any): Promise<any> {
    const settings = await this.getSettings();
    
    if (!settings.enableCompression || typeof data !== 'string') {
      return data;
    }

    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  /**
   * Get sync endpoint for type and action
   */
  private getSyncEndpoint(type: string, action: SyncQueue['action']): string {
    const baseUrl = '/api/sync';
    
    switch (type) {
      case 'article':
        return `${baseUrl}/articles`;
      case 'search':
        return `${baseUrl}/searches`;
      case 'user_data':
        return `${baseUrl}/user-data`;
      default:
        return `${baseUrl}/${type}`;
    }
  }

  /**
   * Get HTTP method for sync action
   */
  private getSyncMethod(action: SyncQueue['action']): string {
    switch (action) {
      case 'create':
        return 'POST';
      case 'update':
        return 'PUT';
      case 'delete':
        return 'DELETE';
      default:
        return 'POST';
    }
  }

  /**
   * Schedule periodic cleanup
   */
  private scheduleCleanup(): void {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanup().catch(console.error);
    }, 60 * 60 * 1000);
  }

  /**
   * Ensure the manager is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Export all data for backup
   */
  async exportData(): Promise<{
    data: OfflineData[];
    syncQueue: SyncQueue[];
    settings: OfflineSettings;
    metadata: any;
  }> {
    await this.ensureInitialized();

    const data = await this.db!.getAll('data');
    const syncQueue = await this.db!.getAll('syncQueue');
    const settings = await this.getSettings();
    const metadata = await this.getMetadata();

    // Decompress data for export
    for (const item of data) {
      item.data = await this.decompressData(item.data);
    }

    return { data, syncQueue, settings, metadata };
  }

  /**
   * Import data from backup
   */
  async importData(backup: {
    data: OfflineData[];
    syncQueue: SyncQueue[];
    settings: OfflineSettings;
  }): Promise<void> {
    await this.ensureInitialized();

    // Clear existing data
    await this.db!.clear('data');
    await this.db!.clear('syncQueue');

    // Import data
    for (const item of backup.data) {
      item.data = await this.compressData(item.data);
      await this.db!.put('data', item);
    }

    for (const item of backup.syncQueue) {
      await this.db!.put('syncQueue', item);
    }

    // Update settings
    await this.updateSettings(backup.settings);
    await this.updateMetadata();

    this.emit('data_imported', backup);
  }

  /**
   * Clear all offline data
   */
  async clearAll(): Promise<void> {
    await this.ensureInitialized();

    await this.db!.clear('data');
    await this.db!.clear('syncQueue');
    await this.updateMetadata();

    this.emit('data_cleared');
  }

  // Event system
  on(event: string, listener: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: string, listener: (...args: any[]) => void): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  private emit(event: string, data?: any): void {
    this.eventListeners.get(event)?.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Offline manager event listener error:', error);
      }
    });
  }
}

// Export singleton instance
let offlineManager: OfflineManager | null = null;

export function getOfflineManager(): OfflineManager {
  if (!offlineManager) {
    offlineManager = new OfflineManager();
  }
  return offlineManager;
}

export default OfflineManager;