/**
 * PWA Manager for MyDub.AI
 * Handles app installation, notifications, and background sync
 */

export interface PWACapabilities {
  installable: boolean;
  notificationsSupported: boolean;
  backgroundSyncSupported: boolean;
  offlineSupported: boolean;
  standaloneMode: boolean;
}

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  silent?: boolean;
  requireInteraction?: boolean;
  timestamp?: number;
}

export interface BackgroundSyncTask {
  id: string;
  name: string;
  data: any;
  priority: 'low' | 'normal' | 'high';
  created: Date;
  maxRetries: number;
  retryCount: number;
}

class PWAManager {
  private installPrompt: InstallPromptEvent | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private syncTasks: Map<string, BackgroundSyncTask> = new Map();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.isInitialized) return;

    // Register service worker
    await this.registerServiceWorker();

    // Set up event listeners
    this.setupEventListeners();

    // Check for pending sync tasks
    this.loadPendingSyncTasks();

    this.isInitialized = true;
    this.emit('pwa_initialized');
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
            return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

            // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.emit('sw_update_available');
            }
          });
        }
      });

      this.emit('sw_registered', this.registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      this.emit('sw_registration_failed', error);
    }
  }

  /**
   * Set up PWA event listeners
   */
  private setupEventListeners(): void {
    // Install prompt handling
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event as InstallPromptEvent;
      this.emit('install_prompt_available');
    });

    // App installed event
    window.addEventListener('appinstalled', () => {
      this.installPrompt = null;
      this.emit('app_installed');
    });

    // Standalone mode detection
    window.addEventListener('DOMContentLoaded', () => {
      if (this.isStandaloneMode()) {
        document.body.classList.add('standalone-mode');
        this.emit('standalone_mode_detected');
      }
    });

    // Online/offline events
    window.addEventListener('online', () => {
      this.emit('connection_restored');
      this.processPendingSyncTasks();
    });

    window.addEventListener('offline', () => {
      this.emit('connection_lost');
    });

    // Visibility change for background sync
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.processPendingSyncTasks();
      }
    });
  }

  /**
   * Get PWA capabilities
   */
  getCapabilities(): PWACapabilities {
    return {
      installable: !!this.installPrompt,
      notificationsSupported: 'Notification' in window && 'serviceWorker' in navigator,
      backgroundSyncSupported: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      offlineSupported: 'serviceWorker' in navigator && 'caches' in window,
      standaloneMode: this.isStandaloneMode()
    };
  }

  /**
   * Check if app is in standalone mode
   */
  isStandaloneMode(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://');
  }

  /**
   * Show app install prompt
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPrompt) {
      throw new Error('Install prompt not available');
    }

    try {
      await this.installPrompt.prompt();
      const choice = await this.installPrompt.userChoice;
      
      this.emit('install_prompt_shown', choice.outcome);
      
      if (choice.outcome === 'accepted') {
        this.installPrompt = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Install prompt failed:', error);
      this.emit('install_prompt_failed', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    this.emit('notification_permission_changed', permission);
    return permission;
  }

  /**
   * Show notification
   */
  async showNotification(options: NotificationOptions): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    const permission = await this.requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const defaultOptions: Partial<NotificationOptions> = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      timestamp: Date.now(),
      requireInteraction: false,
      silent: false
    };

    const notificationOptions = { ...defaultOptions, ...options };

    await this.registration.showNotification(notificationOptions.title, {
      body: notificationOptions.body,
      icon: notificationOptions.icon,
      image: notificationOptions.image,
      badge: notificationOptions.badge,
      tag: notificationOptions.tag,
      data: notificationOptions.data,
      actions: notificationOptions.actions,
      silent: notificationOptions.silent,
      requireInteraction: notificationOptions.requireInteraction,
      timestamp: notificationOptions.timestamp
    });

    this.emit('notification_shown', notificationOptions);
  }

  /**
   * Schedule background sync task
   */
  async scheduleBackgroundSync(task: Omit<BackgroundSyncTask, 'created' | 'retryCount'>): Promise<void> {
    const syncTask: BackgroundSyncTask = {
      ...task,
      created: new Date(),
      retryCount: 0
    };

    this.syncTasks.set(task.id, syncTask);
    this.saveSyncTasks();

    if (!this.registration) {
            return;
    }

    try {
      await this.registration.sync.register(task.name);
      this.emit('background_sync_scheduled', syncTask);
    } catch (error) {
      console.error('Background sync registration failed:', error);
      this.emit('background_sync_failed', { task: syncTask, error });
    }
  }

  /**
   * Process pending sync tasks
   */
  private async processPendingSyncTasks(): Promise<void> {
    if (!navigator.onLine) return;

    for (const [id, task] of this.syncTasks.entries()) {
      try {
        await this.executeSyncTask(task);
        this.syncTasks.delete(id);
        this.emit('background_sync_completed', task);
      } catch (error) {
        task.retryCount++;
        
        if (task.retryCount >= task.maxRetries) {
          this.syncTasks.delete(id);
          this.emit('background_sync_failed', { task, error });
        } else {
          this.emit('background_sync_retry', { task, error });
        }
      }
    }

    this.saveSyncTasks();
  }

  /**
   * Execute sync task
   */
  private async executeSyncTask(task: BackgroundSyncTask): Promise<void> {
    // Send message to service worker to execute the task
    if (this.registration && this.registration.active) {
      this.registration.active.postMessage({
        type: 'EXECUTE_SYNC_TASK',
        task
      });
    }

    // For now, simulate task execution
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Update service worker
   */
  async updateServiceWorker(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      await this.registration.update();
      this.emit('sw_update_initiated');
    } catch (error) {
      console.error('Service Worker update failed:', error);
      this.emit('sw_update_failed', error);
    }
  }

  /**
   * Skip waiting for new service worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      return;
    }

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Reload page to activate new service worker
    window.location.reload();
  }

  /**
   * Get sync task status
   */
  getSyncTaskStatus(): Array<BackgroundSyncTask & { status: 'pending' | 'failed' }> {
    return Array.from(this.syncTasks.values()).map(task => ({
      ...task,
      status: task.retryCount >= task.maxRetries ? 'failed' : 'pending'
    }));
  }

  /**
   * Clear failed sync tasks
   */
  clearFailedSyncTasks(): void {
    for (const [id, task] of this.syncTasks.entries()) {
      if (task.retryCount >= task.maxRetries) {
        this.syncTasks.delete(id);
      }
    }
    this.saveSyncTasks();
    this.emit('failed_sync_tasks_cleared');
  }

  /**
   * Load pending sync tasks from storage
   */
  private loadPendingSyncTasks(): void {
    try {
      const stored = localStorage.getItem('pwa_sync_tasks');
      if (stored) {
        const tasks = JSON.parse(stored);
        this.syncTasks = new Map(
          tasks.map((task: any) => [
            task.id,
            { ...task, created: new Date(task.created) }
          ])
        );
      }
    } catch (error) {
      console.error('Failed to load sync tasks:', error);
    }
  }

  /**
   * Save sync tasks to storage
   */
  private saveSyncTasks(): void {
    try {
      const tasks = Array.from(this.syncTasks.values());
      localStorage.setItem('pwa_sync_tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save sync tasks:', error);
    }
  }

  /**
   * Get app install stats
   */
  getInstallStats(): {
    isInstallable: boolean;
    isInstalled: boolean;
    isStandalone: boolean;
    lastPromptDate?: Date;
  } {
    const lastPromptDate = localStorage.getItem('last_install_prompt');
    
    return {
      isInstallable: !!this.installPrompt,
      isInstalled: this.isStandaloneMode(),
      isStandalone: this.isStandaloneMode(),
      lastPromptDate: lastPromptDate ? new Date(lastPromptDate) : undefined
    };
  }

  /**
   * Check if we should show install prompt
   */
  shouldShowInstallPrompt(): boolean {
    if (!this.installPrompt || this.isStandaloneMode()) {
      return false;
    }

    const lastPrompt = localStorage.getItem('last_install_prompt');
    const installDismissed = localStorage.getItem('install_dismissed');
    
    // Don't show if user dismissed recently (within 7 days)
    if (installDismissed) {
      const dismissedDate = new Date(installDismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return false;
      }
    }

    // Don't show if prompted recently (within 3 days)
    if (lastPrompt) {
      const lastPromptDate = new Date(lastPrompt);
      const daysSincePrompt = (Date.now() - lastPromptDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePrompt < 3) {
        return false;
      }
    }

    return true;
  }

  /**
   * Mark install prompt as dismissed
   */
  markInstallDismissed(): void {
    localStorage.setItem('install_dismissed', new Date().toISOString());
    localStorage.setItem('last_install_prompt', new Date().toISOString());
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
        console.error('PWA event listener error:', error);
      }
    });
  }
}

// Export singleton instance
let pwaManager: PWAManager | null = null;

export function getPWAManager(): PWAManager {
  if (!pwaManager) {
    pwaManager = new PWAManager();
  }
  return pwaManager;
}

export default PWAManager;