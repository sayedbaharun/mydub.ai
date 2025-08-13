import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { getPWAManager } from '@/shared/lib/pwa/pwaManager';
import { getOfflineManager } from '@/shared/lib/offline/offlineManager';
import { usePWA } from '@/shared/hooks/usePWA';
import { useOffline } from '@/shared/hooks/useOffline';
import { InstallPrompt } from './InstallPrompt';
import { OfflineIndicator } from './OfflineIndicator';
import { NotificationPermissionPrompt } from './NotificationCenter';

interface PWAContextType {
  pwaManager: ReturnType<typeof getPWAManager>;
  offlineManager: ReturnType<typeof getOfflineManager>;
}

const PWAContext = createContext<PWAContextType | null>(null);

export function usePWAContext() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWAContext must be used within a PWAProvider');
  }
  return context;
}

interface PWAProviderProps {
  children: ReactNode;
  enableInstallPrompt?: boolean;
  enableNotificationPrompt?: boolean;
  enableOfflineIndicator?: boolean;
  installPromptVariant?: 'banner' | 'card' | 'modal';
  offlineIndicatorVariant?: 'badge' | 'banner' | 'card';
}

export function PWAProvider({
  children,
  enableInstallPrompt = true,
  enableNotificationPrompt = true,
  enableOfflineIndicator = true,
  installPromptVariant = 'banner',
  offlineIndicatorVariant = 'banner'
}: PWAProviderProps) {
  const pwaManager = getPWAManager();
  const offlineManager = getOfflineManager();
  
  // Initialize PWA functionality
  const pwaState = usePWA({
    enableInstallPrompt,
    enableNotifications: enableNotificationPrompt,
    enableBackgroundSync: true
  });

  // Initialize offline functionality
  const offlineState = useOffline({
    enableAutoSync: true,
    enablePeriodicCleanup: true,
    syncInterval: 30000 // 30 seconds
  });

  useEffect(() => {
    // Initialize PWA manager
          }, [pwaState.capabilities, offlineState.syncStats]);

  return (
    <PWAContext.Provider value={{ pwaManager, offlineManager }}>
      {children}
      
      {/* PWA UI Components */}
      {enableInstallPrompt && (
        <InstallPrompt variant={installPromptVariant} />
      )}
      
      {enableOfflineIndicator && (
        <OfflineIndicator variant={offlineIndicatorVariant} />
      )}
      
      {enableNotificationPrompt && (
        <NotificationPermissionPrompt />
      )}
    </PWAContext.Provider>
  );
}

export default PWAProvider;