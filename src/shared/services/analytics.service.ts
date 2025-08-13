// Remove gtag import - we'll use the global window.gtag instead

// Analytics event types
export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

// User properties for analytics
export interface UserProperties {
  user_id?: string;
  language?: string;
  user_role?: string;
  location?: string;
  device_type?: string;
}

// Conversion events
export interface ConversionEvent {
  event_name: string;
  currency?: string;
  value?: number;
  items?: Array<{
    item_id: string;
    item_name: string;
    category: string;
    price?: number;
    quantity?: number;
  }>;
}

// Page view tracking
export interface PageView {
  page_title: string;
  page_location: string;
  page_path: string;
  content_group1?: string; // Feature category
  content_group2?: string; // Content type
}

class AnalyticsService {
  private isInitialized = false;
  private measurementId: string | null = null;
  private consentGiven = false;
  private eventQueue: AnalyticsEvent[] = [];

  /**
   * Initialize Google Analytics GA4
   */
  init(measurementId: string) {
    if (this.isInitialized || !measurementId) return;

    this.measurementId = measurementId;

    // Load Google Analytics script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script1);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      // Default configuration
      page_title: document.title,
      page_location: window.location.href,
      // Privacy settings
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      // Wait for consent
      ad_storage: 'denied',
      analytics_storage: this.consentGiven ? 'granted' : 'denied',
    });

    this.isInitialized = true;
    // Process queued events if consent is given
    if (this.consentGiven) {
      this.processEventQueue();
    }
  }

  /**
   * Handle user consent for GDPR compliance
   */
  setConsent(granted: boolean) {
    this.consentGiven = granted;

    if (!this.isInitialized || !this.measurementId) return;

    window.gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
      ad_storage: 'denied', // We don't use ads
    });

    if (granted) {
      this.processEventQueue();
      } else {
      this.eventQueue = [];
      }
  }

  /**
   * Track page views with custom properties
   */
  trackPageView(pageView: PageView) {
    if (!this.canTrack()) {
      return;
    }

    window.gtag('config', this.measurementId!, {
      page_title: pageView.page_title,
      page_location: pageView.page_location,
      page_path: pageView.page_path,
      content_group1: pageView.content_group1,
      content_group2: pageView.content_group2,
    });

    }

  /**
   * Track custom events
   */
  trackEvent(event: AnalyticsEvent) {
    if (!this.canTrack()) {
      // Queue events if consent not given yet
      if (!this.consentGiven) {
        this.eventQueue.push(event);
      }
      return;
    }

    window.gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event.custom_parameters,
    });

    }

  /**
   * Track user interactions
   */
  trackUserInteraction(action: string, element: string, details?: Record<string, any>) {
    this.trackEvent({
      action,
      category: 'user_interaction',
      label: element,
      custom_parameters: {
        interaction_type: action,
        element_type: element,
        ...details,
      },
    });
  }

  /**
   * Track search queries
   */
  trackSearch(query: string, category?: string, resultsCount?: number) {
    this.trackEvent({
      action: 'search',
      category: 'search',
      label: category,
      value: resultsCount,
      custom_parameters: {
        search_term: query,
        search_category: category,
        results_count: resultsCount,
      },
    });
  }

  /**
   * Track content engagement
   */
  trackContentEngagement(contentType: string, contentId: string, action: string) {
    this.trackEvent({
      action,
      category: 'content_engagement',
      label: contentType,
      custom_parameters: {
        content_type: contentType,
        content_id: contentId,
        engagement_action: action,
      },
    });
  }

  /**
   * Track AI interactions
   */
  trackAIInteraction(
    aiType: string,
    action: string,
    details?: {
      query_length?: number;
      response_time?: number;
      satisfaction_rating?: number;
    }
  ) {
    this.trackEvent({
      action,
      category: 'ai_interaction',
      label: aiType,
      value: details?.response_time,
      custom_parameters: {
        ai_type: aiType,
        query_length: details?.query_length,
        response_time: details?.response_time,
        satisfaction_rating: details?.satisfaction_rating,
      },
    });
  }

  /**
   * Track conversion events
   */
  trackConversion(conversion: ConversionEvent) {
    if (!this.canTrack()) return;

    window.gtag('event', conversion.event_name, {
      currency: conversion.currency || 'USD',
      value: conversion.value || 0,
      items: conversion.items || [],
    });

    }

  /**
   * Track user signup/registration
   */
  trackSignUp(method: string, userId?: string) {
    this.trackConversion({
      event_name: 'sign_up',
      value: 1,
    });

    this.trackEvent({
      action: 'sign_up',
      category: 'user_lifecycle',
      label: method,
      custom_parameters: {
        signup_method: method,
        user_id: userId,
      },
    });
  }

  /**
   * Track user login
   */
  trackLogin(method: string, userId?: string) {
    this.trackEvent({
      action: 'login',
      category: 'user_lifecycle',
      label: method,
      custom_parameters: {
        login_method: method,
        user_id: userId,
      },
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: UserProperties) {
    if (!this.canTrack()) return;

    window.gtag('config', this.measurementId!, {
      user_id: properties.user_id,
      user_properties: {
        language: properties.language,
        user_role: properties.user_role,
        location: properties.location,
        device_type: properties.device_type,
      },
    });
  }

  /**
   * Track errors and exceptions
   */
  trackError(error: Error, fatal: boolean = false, context?: Record<string, any>) {
    this.trackEvent({
      action: 'exception',
      category: 'error',
      label: error.name,
      custom_parameters: {
        error_message: error.message,
        error_stack: error.stack,
        fatal,
        ...context,
      },
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, category: string = 'performance') {
    this.trackEvent({
      action: 'timing_complete',
      category,
      label: metric,
      value: Math.round(value),
      custom_parameters: {
        metric_name: metric,
        metric_value: value,
      },
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, action: string, details?: Record<string, any>) {
    this.trackEvent({
      action,
      category: 'feature_usage',
      label: feature,
      custom_parameters: {
        feature_name: feature,
        usage_action: action,
        ...details,
      },
    });
  }

  /**
   * Track language changes
   */
  trackLanguageChange(from: string, to: string) {
    this.trackEvent({
      action: 'language_change',
      category: 'localization',
      label: `${from}_to_${to}`,
      custom_parameters: {
        previous_language: from,
        new_language: to,
      },
    });
  }

  /**
   * Track content sharing
   */
  trackShare(contentType: string, contentId: string, platform: string) {
    this.trackEvent({
      action: 'share',
      category: 'content_sharing',
      label: platform,
      custom_parameters: {
        content_type: contentType,
        content_id: contentId,
        share_platform: platform,
      },
    });
  }

  /**
   * Check if tracking is allowed
   */
  private canTrack(): boolean {
    return this.isInitialized && this.consentGiven && !!this.measurementId;
  }

  /**
   * Process queued events after consent is given
   */
  private processEventQueue() {
    if (this.eventQueue.length === 0) return;

    this.eventQueue.forEach(event => {
      this.trackEvent(event);
    });

    this.eventQueue = [];
  }

  /**
   * Get current analytics status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      consentGiven: this.consentGiven,
      measurementId: this.measurementId,
      queuedEvents: this.eventQueue.length,
    };
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// React hook for analytics
export function useAnalytics() {
  return {
    trackPageView: analytics.trackPageView.bind(analytics),
    trackEvent: analytics.trackEvent.bind(analytics),
    trackUserInteraction: analytics.trackUserInteraction.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackContentEngagement: analytics.trackContentEngagement.bind(analytics),
    trackAIInteraction: analytics.trackAIInteraction.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackShare: analytics.trackShare.bind(analytics),
    setConsent: analytics.setConsent.bind(analytics),
  };
}

// Auto-detect device type
export function getDeviceType(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(userAgent)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) return 'mobile';
  return 'desktop';
}

// Declare global gtag function
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}