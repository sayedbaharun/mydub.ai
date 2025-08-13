import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Cookie, Check, Settings, Shield, BarChart3, Target } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Switch } from '@/shared/components/ui/switch';
import { cn } from '@/shared/lib/utils';
import { SecureStorage } from '@/shared/lib/security';
import { useMonitoring } from '@/app/providers/MonitoringProvider';
import { useSession } from '@/features/auth/hooks/useSession';
import { GDPRService } from '@/features/legal/services/gdpr.service';
import { useToast } from '@/shared/hooks/use-toast';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  monitoring: boolean;
  preferences: boolean;
  performance: boolean;
  functional: boolean;
}

const COOKIE_CONSENT_KEY = 'cookie_consent';
const COOKIE_PREFERENCES_KEY = 'cookie_preferences';

export function CookieConsent() {
  const { t } = useTranslation();
  const { setConsent } = useMonitoring();
  const { user } = useSession();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    monitoring: false,
    preferences: false,
    performance: false,
    functional: false,
  });
  const [syncingWithGDPR, setSyncingWithGDPR] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = SecureStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasConsented) {
      // Show banner after a short delay
      setTimeout(() => setIsVisible(true), 1000);
    } else {
      // Load saved preferences
      const savedPreferences = SecureStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPreferences) {
        setPreferences(savedPreferences);
        applyCookiePreferences(savedPreferences);
      }
    }
  }, []);

  // Load user's GDPR privacy settings if logged in
  useEffect(() => {
    if (user && !syncingWithGDPR) {
      loadUserPrivacySettings();
    }
  }, [user]);

  const loadUserPrivacySettings = async () => {
    if (!user) return;

    try {
      setSyncingWithGDPR(true);
      const privacySettings = await GDPRService.getPrivacySettings(user.id);
      
      if (privacySettings?.cookie_consent) {
        // Update local preferences with GDPR settings
        const gdprPreferences: CookiePreferences = {
          necessary: true, // Always true
          analytics: privacySettings.cookie_consent.analytics || false,
          marketing: privacySettings.cookie_consent.marketing || false,
          monitoring: privacySettings.analytics_tracking_enabled || false,
          preferences: privacySettings.cookie_consent.preferences || false,
          performance: privacySettings.cookie_consent.performance || false,
          functional: privacySettings.cookie_consent.functional || false,
        };
        
        setPreferences(gdprPreferences);
        SecureStorage.setItem(COOKIE_PREFERENCES_KEY, gdprPreferences);
        await applyCookiePreferences(gdprPreferences);
      }
    } catch (error) {
      console.error('Failed to load user privacy settings:', error);
    } finally {
      setSyncingWithGDPR(false);
    }
  };

  const applyCookiePreferences = async (prefs: CookiePreferences) => {
    // Apply preferences to monitoring services
    const monitoringConsent = prefs.analytics || prefs.monitoring;
    setConsent(monitoringConsent);

    // Apply preferences to third-party services
    if (typeof window !== 'undefined') {
      // Google Analytics
      if (prefs.analytics && window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
        });
      } else if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'denied',
        });
      }

      // We don't use marketing/ads, so we keep them denied
      if (window.gtag) {
        window.gtag('consent', 'update', {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        });
      }
    }

    // Sync with GDPR service if user is logged in
    if (user && !syncingWithGDPR) {
      try {
        setSyncingWithGDPR(true);
        await GDPRService.recordConsent(
          user.id,
          'cookie_policy',
          true,
          '1.0', // This should come from the cookie policy document
          '0.0.0.0', // This would come from the request
          navigator.userAgent
        );
        
        // Update privacy settings with cookie preferences
        await GDPRService.updatePrivacySettings(user.id, {
          analytics_tracking_enabled: prefs.analytics,
          cookie_consent: {
            necessary: prefs.necessary,
            analytics: prefs.analytics,
            marketing: prefs.marketing,
            preferences: prefs.preferences,
            performance: prefs.performance,
            functional: prefs.functional
          }
        });
      } catch (error) {
        console.error('Failed to sync cookie preferences with GDPR service:', error);
      } finally {
        setSyncingWithGDPR(false);
      }
    }
  };

  const handleAcceptAll = async () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      monitoring: true,
      preferences: true,
      performance: true,
      functional: true,
    };
    
    setPreferences(allAccepted);
    SecureStorage.setItem(COOKIE_CONSENT_KEY, true);
    SecureStorage.setItem(COOKIE_PREFERENCES_KEY, allAccepted);
    await applyCookiePreferences(allAccepted);
    setIsVisible(false);
    
    toast({
      title: 'Cookies Accepted',
      description: 'All cookie categories have been accepted.'
    });
  };

  const handleAcceptSelected = async () => {
    SecureStorage.setItem(COOKIE_CONSENT_KEY, true);
    SecureStorage.setItem(COOKIE_PREFERENCES_KEY, preferences);
    await applyCookiePreferences(preferences);
    setIsVisible(false);
    
    toast({
      title: 'Cookie Preferences Saved',
      description: 'Your cookie preferences have been updated.'
    });
  };

  const handleRejectAll = async () => {
    const minimalPreferences: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      monitoring: false,
      preferences: false,
      performance: false,
      functional: false,
    };
    
    setPreferences(minimalPreferences);
    SecureStorage.setItem(COOKIE_CONSENT_KEY, true);
    SecureStorage.setItem(COOKIE_PREFERENCES_KEY, minimalPreferences);
    await applyCookiePreferences(minimalPreferences);
    setIsVisible(false);
    
    toast({
      title: 'Cookies Rejected',
      description: 'Only necessary cookies will be used.'
    });
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Necessary cookies cannot be disabled
    
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {}} // Prevent closing on backdrop click
      />
      
      {/* Cookie Banner */}
      <Card className={cn(
        "relative w-full max-w-2xl p-6 shadow-xl",
        "animate-in slide-in-from-bottom-5 duration-300"
      )}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Cookie className="h-8 w-8 text-primary" />
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{t('cookies.title')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('cookies.description')}
              </p>
            </div>

            {/* Cookie Categories */}
            {showDetails && (
              <div className="space-y-3 border-t pt-4">
                <div className="space-y-3">
                  {/* Necessary Cookies */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{t('cookies.necessary')}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('cookies.necessaryDescription')}
                      </p>
                    </div>
                    <Switch
                      checked={preferences.necessary}
                      disabled
                      className="opacity-50"
                    />
                  </div>

                  {/* Analytics Cookies */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 flex items-start gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">Analytics</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Google Analytics to understand user behavior and improve the app
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.analytics}
                      onCheckedChange={() => togglePreference('analytics')}
                    />
                  </div>

                  {/* Monitoring Cookies */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 flex items-start gap-2">
                      <Target className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">Error Monitoring</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Sentry error tracking to identify and fix bugs quickly
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.monitoring}
                      onCheckedChange={() => togglePreference('monitoring')}
                    />
                  </div>

                  {/* Marketing Cookies */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 flex items-start gap-2">
                      <Target className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">Marketing</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Advertising and marketing cookies for personalized content
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.marketing}
                      onCheckedChange={() => togglePreference('marketing')}
                    />
                  </div>

                  {/* Performance Cookies */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 flex items-start gap-2">
                      <BarChart3 className="h-4 w-4 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">Performance</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Performance monitoring and optimization cookies
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.performance}
                      onCheckedChange={() => togglePreference('performance')}
                    />
                  </div>

                  {/* Functional Cookies */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 flex items-start gap-2">
                      <Settings className="h-4 w-4 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">Functional</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enhanced functionality and feature cookies
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.functional}
                      onCheckedChange={() => togglePreference('functional')}
                    />
                  </div>

                  {/* Preference Cookies */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{t('cookies.preferences')}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('cookies.preferencesDescription')}
                      </p>
                    </div>
                    <Switch
                      checked={preferences.preferences}
                      onCheckedChange={() => togglePreference('preferences')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              {!showDetails ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    {t('cookies.customize')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRejectAll}
                    disabled={syncingWithGDPR}
                  >
                    {t('cookies.rejectAll')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAcceptAll}
                    className="flex items-center gap-2"
                    disabled={syncingWithGDPR}
                  >
                    <Check className="h-4 w-4" />
                    {t('cookies.acceptAll')}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(false)}
                  >
                    {t('common.back')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAcceptSelected}
                    className="flex items-center gap-2"
                    disabled={syncingWithGDPR}
                  >
                    <Check className="h-4 w-4" />
                    {t('cookies.acceptSelected')}
                  </Button>
                </>
              )}
            </div>

            {/* Privacy Policy Link */}
            <p className="text-xs text-muted-foreground">
              {t('cookies.learnMore')}{' '}
              <a href="/privacy" className="underline hover:text-primary">
                {t('footer.privacy')}
              </a>
              {' '}{t('cookies.and')}{' '}
              <a href="/terms" className="underline hover:text-primary">
                {t('footer.terms')}
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Cookie settings button for footer/settings page
export function CookieSettingsButton() {
  const { t } = useTranslation();
  
  const handleClick = () => {
    // Clear consent to show banner again
    SecureStorage.removeItem(COOKIE_CONSENT_KEY);
    window.location.reload();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="flex items-center gap-2"
    >
      <Cookie className="h-4 w-4" />
      {t('cookies.settings')}
    </Button>
  );
}

// Hook to check cookie consent status
export function useCookieConsent() {
  const [hasConsented, setHasConsented] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    monitoring: false,
    preferences: false,
    performance: false,
    functional: false,
  });

  useEffect(() => {
    const consent = SecureStorage.getItem(COOKIE_CONSENT_KEY);
    const prefs = SecureStorage.getItem(COOKIE_PREFERENCES_KEY);
    
    setHasConsented(!!consent);
    if (prefs) {
      setPreferences(prefs);
    }
  }, []);

  return { hasConsented, preferences };
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}