import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ServiceWorkerState {
  isInstalled: boolean;
  isUpdating: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isInstalled: false,
    isUpdating: false,
    registration: null,
  });

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Check if service worker is supported
  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;

  // Register service worker
  const register = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      setState(prev => ({ ...prev, registration }));

      // Check if there's an updated worker waiting
      if (registration.waiting) {
        setState(prev => ({ ...prev, isUpdating: true }));
        promptUpdate(registration.waiting);
      }

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setState(prev => ({ ...prev, isUpdating: true }));
            promptUpdate(newWorker);
          }
        });
      });

      // Check if already installed
      if (registration.active) {
        setState(prev => ({ ...prev, isInstalled: true }));
      }

          } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }, [isSupported]);

  // Prompt user to update
  const promptUpdate = (worker: ServiceWorker) => {
    toast('A new version is available!', {
      action: {
        label: 'Update',
        onClick: () => {
          worker.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        },
      },
      duration: Infinity,
    });
  };

  // Unregister service worker
  const unregister = useCallback(async () => {
    if (!isSupported || !state.registration) return;

    try {
      await state.registration.unregister();
      setState({
        isInstalled: false,
        isUpdating: false,
        registration: null,
      });
          } catch (error) {
      console.error('Service Worker unregistration failed:', error);
    }
  }, [isSupported, state.registration]);

  // Clear all caches
  const clearCache = useCallback(async () => {
    if (!isSupported) return;

    try {
      // Send message to service worker to clear caches
      if (state.registration?.active) {
        state.registration.active.postMessage({ type: 'CLEAR_CACHE' });
      }

      // Also clear from main thread
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      toast.success('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear cache');
    }
  }, [isSupported, state.registration]);

  // Handle online/offline events
  useEffect(() => {
    if (!isSupported) return;

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('You are back online!');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline', {
        description: 'Some features may be limited',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSupported]);

  // Auto-register on mount
  useEffect(() => {
    if (isSupported && process.env.NODE_ENV === 'production') {
      register();
    }
  }, [isSupported, register]);

  return {
    isSupported,
    isInstalled: state.isInstalled,
    isUpdating: state.isUpdating,
    isOnline,
    register,
    unregister,
    clearCache,
  };
}