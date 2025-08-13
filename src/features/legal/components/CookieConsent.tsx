import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Switch } from '@/shared/components/ui/switch';
import { X, Cookie, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface ConsentRecord {
  preferences: CookiePreferences;
  timestamp: string;
  version: string;
  language: string;
}

const CONSENT_VERSION = '1.0';
const CONSENT_STORAGE_KEY = 'mydub_cookie_consent';

export function CookieConsent() {
  const { t, i18n } = useTranslation();
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always required
    analytics: false,
    marketing: false,
    preferences: false
  });

  useEffect(() => {
    const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
    
    if (!storedConsent) {
      // No consent recorded - show banner
      setShow(true);
    } else {
      try {
        const consent: ConsentRecord = JSON.parse(storedConsent);
        
        // Check if consent needs to be renewed (version change or > 1 year old)
        const consentAge = Date.now() - new Date(consent.timestamp).getTime();
        const oneYear = 365 * 24 * 60 * 60 * 1000;
        
        if (consent.version !== CONSENT_VERSION || consentAge > oneYear) {
          setShow(true);
        } else {
          // Apply saved preferences
          applyConsentPreferences(consent.preferences);
        }
      } catch {
        setShow(true);
      }
    }
  }, []);

  const applyConsentPreferences = (prefs: CookiePreferences) => {
    // Update Google Analytics consent
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': prefs.analytics ? 'granted' : 'denied',
        'ad_storage': prefs.marketing ? 'granted' : 'denied',
        'ad_user_data': prefs.marketing ? 'granted' : 'denied',
        'ad_personalization': prefs.marketing ? 'granted' : 'denied'
      });
    }

    // Apply other consent-based features
    if (!prefs.analytics) {
      // Disable analytics
      if (window.Sentry) {
        window.Sentry.close();
      }
    }
  };

  const saveConsent = (prefs: CookiePreferences) => {
    const consent: ConsentRecord = {
      preferences: prefs,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
      language: i18n.language
    };

    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
    applyConsentPreferences(prefs);
    
    // Log consent for compliance
        // Send to backend for audit trail (if required)
    fetch('/api/legal/cookie-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consent)
    }).catch(console.error);

    setShow(false);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    setPreferences(allAccepted);
    saveConsent(allAccepted);
  };

  const handleAcceptSelected = () => {
    saveConsent(preferences);
  };

  const handleRejectAll = () => {
    const minimalConsent = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    setPreferences(minimalConsent);
    saveConsent(minimalConsent);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/20 backdrop-blur-sm">
      <Card className="max-w-4xl mx-auto p-6 shadow-xl">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Cookie className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold">
                {t('cookieConsent.title', 'Cookie Consent')}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShow(false)}
              className="hover:bg-transparent"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Main message */}
          <p className="text-sm text-muted-foreground">
            {t('cookieConsent.message', 
              'We use cookies to enhance your experience on MyDub.AI. By continuing to use our site, you agree to our use of cookies in accordance with our'
            )}{' '}
            <a 
              href="/legal/privacy-policy" 
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('cookieConsent.privacyPolicy', 'Privacy Policy')}
            </a>{' '}
            {t('cookieConsent.and', 'and')}{' '}
            <a 
              href="/legal/cookie-policy" 
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('cookieConsent.cookiePolicy', 'Cookie Policy')}
            </a>.
          </p>

          {/* Detailed settings */}
          {showDetails && (
            <div className="space-y-4 border-t pt-4">
              {/* Essential cookies */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">
                    {t('cookieConsent.essential', 'Essential Cookies')}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {t('cookieConsent.essentialDesc', 
                      'Required for the website to function properly. Cannot be disabled.'
                    )}
                  </p>
                </div>
                <Switch checked={true} disabled className="data-[state=checked]:bg-primary" />
              </div>

              {/* Analytics cookies */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">
                    {t('cookieConsent.analytics', 'Analytics Cookies')}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {t('cookieConsent.analyticsDesc', 
                      'Help us understand how visitors use our website and improve our services.'
                    )}
                  </p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, analytics: checked })
                  }
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              {/* Marketing cookies */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">
                    {t('cookieConsent.marketing', 'Marketing Cookies')}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {t('cookieConsent.marketingDesc', 
                      'Used to deliver personalized advertisements relevant to your interests.'
                    )}
                  </p>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, marketing: checked })
                  }
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              {/* Preference cookies */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">
                    {t('cookieConsent.preferences', 'Preference Cookies')}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {t('cookieConsent.preferencesDesc', 
                      'Remember your settings and preferences for a better experience.'
                    )}
                  </p>
                </div>
                <Switch
                  checked={preferences.preferences}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, preferences: checked })
                  }
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 justify-end pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              {showDetails 
                ? t('cookieConsent.hideSettings', 'Hide Settings')
                : t('cookieConsent.customizeSettings', 'Customize Settings')
              }
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRejectAll}
            >
              {t('cookieConsent.rejectAll', 'Reject All')}
            </Button>
            
            {showDetails ? (
              <Button
                variant="default"
                size="sm"
                onClick={handleAcceptSelected}
                className="bg-primary hover:bg-primary/90"
              >
                {t('cookieConsent.acceptSelected', 'Accept Selected')}
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleAcceptAll}
                className="bg-primary hover:bg-primary/90"
              >
                {t('cookieConsent.acceptAll', 'Accept All')}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Cookie management utilities
export const cookieManager = {
  /**
   * Get current consent status
   */
  getConsent(): ConsentRecord | null {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  /**
   * Check if a specific cookie type is allowed
   */
  isAllowed(type: keyof CookiePreferences): boolean {
    const consent = this.getConsent();
    return consent ? consent.preferences[type] : false;
  },

  /**
   * Update consent preferences
   */
  updateConsent(preferences: Partial<CookiePreferences>): void {
    const current = this.getConsent();
    if (current) {
      const updated = {
        ...current,
        preferences: { ...current.preferences, ...preferences },
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(updated));
    }
  },

  /**
   * Revoke consent and clear cookies
   */
  revokeConsent(): void {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    // Clear non-essential cookies
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Don't delete essential cookies
      const essentialCookies = ['auth-token', 'session-id', 'csrf-token'];
      if (!essentialCookies.includes(name)) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
    
    // Reload to show consent banner again
    window.location.reload();
  }
};