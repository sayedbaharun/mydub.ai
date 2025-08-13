import React, { createContext, useContext, useEffect, useState } from 'react';
import { monitoring } from '@/shared/lib/monitoring';
import { analytics } from '@/shared/services/analytics.service';
import { healthCheck } from '@/shared/services/health-check.service';

// Monitoring context interface
interface MonitoringContextType {
  isMonitoringInitialized: boolean;
  isAnalyticsInitialized: boolean;
  consentGiven: boolean;
  setConsent: (consent: boolean) => void;
  trackEvent: typeof analytics.trackEvent;
  trackPageView: typeof analytics.trackPageView;
}

const MonitoringContext = createContext<MonitoringContextType | null>(null);

interface MonitoringProviderProps {
  children: React.ReactNode;
}

export function MonitoringProvider({ children }: MonitoringProviderProps) {
  const [isMonitoringInitialized, setMonitoringInitialized] = useState(false);
  const [isAnalyticsInitialized, setAnalyticsInitialized] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    // Initialize monitoring services
    initializeMonitoring();
  }, []);

  const initializeMonitoring = async () => {
    try {
      // Initialize Sentry monitoring
      const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
      if (sentryDsn) {
        const environment = import.meta.env.VITE_NODE_ENV || 'development';
        monitoring.initSentry(sentryDsn, environment);
        setMonitoringInitialized(true);
        } else {
              }

      // Initialize Google Analytics
      const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
      if (gaMeasurementId) {
        analytics.init(gaMeasurementId);
        setAnalyticsInitialized(true);
        } else {
              }

      // Configure health monitoring alerts
      const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
      if (webhookUrl) {
        healthCheck.configureAlerting({
          enabled: true,
          channels: {
            console: true,
            webhook: webhookUrl,
          },
        });
      }

      // Set up performance monitoring
      monitoring.measurePageLoad();

      // Check for stored consent
      const storedConsent = localStorage.getItem('monitoring-consent');
      if (storedConsent === 'true') {
        handleSetConsent(true);
      }

    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
    }
  };

  const handleSetConsent = (consent: boolean) => {
    setConsentGiven(consent);
    localStorage.setItem('monitoring-consent', consent.toString());
    
    // Update analytics consent
    if (isAnalyticsInitialized) {
      analytics.setConsent(consent);
    }

    // Track consent decision
    if (consent) {
      analytics.trackEvent({
        action: 'consent_granted',
        category: 'privacy',
        label: 'monitoring_analytics',
      });
    }

    };

  // Enhanced tracking functions that respect consent
  const trackEvent: typeof analytics.trackEvent = (event) => {
    if (!consentGiven) return;
    analytics.trackEvent(event);
  };

  const trackPageView: typeof analytics.trackPageView = (pageView) => {
    if (!consentGiven) return;
    analytics.trackPageView(pageView);
  };

  const contextValue: MonitoringContextType = {
    isMonitoringInitialized,
    isAnalyticsInitialized,
    consentGiven,
    setConsent: handleSetConsent,
    trackEvent,
    trackPageView,
  };

  return (
    <MonitoringContext.Provider value={contextValue}>
      {children}
    </MonitoringContext.Provider>
  );
}

// Hook to use monitoring context
export function useMonitoring() {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
}

// HOC for automatic page view tracking
export function withPageTracking<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  pageTitle?: string
) {
  return function TrackedComponent(props: T) {
    const { trackPageView, consentGiven } = useMonitoring();

    useEffect(() => {
      if (consentGiven) {
        trackPageView({
          page_title: pageTitle || document.title,
          page_location: window.location.href,
          page_path: window.location.pathname,
          content_group1: getFeatureCategory(),
          content_group2: 'page',
        });
      }
    }, [trackPageView, consentGiven]);

    return <Component {...props} />;
  };
}

// Helper function to determine feature category from path
function getFeatureCategory(): string {
  const path = window.location.pathname;
  if (path.startsWith('/news')) return 'news';
  if (path.startsWith('/government')) return 'government';
  if (path.startsWith('/tourism')) return 'tourism';
  if (path.startsWith('/practical')) return 'practical';
  if (path.startsWith('/chatbot')) return 'chatbot';
  if (path.startsWith('/dashboard')) return 'dashboard';
  if (path.startsWith('/auth')) return 'auth';
  return 'general';
}

// React Router integration for automatic page tracking
export function usePageTracking() {
  const { trackPageView, consentGiven } = useMonitoring();

  useEffect(() => {
    if (!consentGiven) return;

    const handleRouteChange = () => {
      // Small delay to ensure document.title is updated
      setTimeout(() => {
        trackPageView({
          page_title: document.title,
          page_location: window.location.href,
          page_path: window.location.pathname,
          content_group1: getFeatureCategory(),
          content_group2: 'page',
        });
      }, 100);
    };

    // Track initial page load
    handleRouteChange();

    // Listen for browser navigation (back/forward buttons)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [trackPageView, consentGiven]);
}

// Performance monitoring hook
export function usePerformanceTracking() {
  const { consentGiven } = useMonitoring();

  const trackPerformance = (metric: string, value: number, category?: string) => {
    if (!consentGiven) return;
    analytics.trackPerformance(metric, value, category);
  };

  const measureApiCall = <T,>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    if (!consentGiven) return apiCall();
    return monitoring.measureApiCall(apiCall, endpoint);
  };

  return {
    trackPerformance,
    measureApiCall,
  };
}