import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Cookie as CookieIcon, 
  Shield, 
  BarChart3, 
  Target, 
  Settings, 
  Eye, 
  Info,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Globe,
  Clock,
  Server,
  Lock
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';
import { CookieSettingsButton } from '@/shared/components/CookieConsent';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';

import { GDPRService } from '../services/gdpr.service';
import { LegalDocument } from '../types';

interface CookieCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  required: boolean;
  cookies: CookieInfo[];
}

interface CookieInfo {
  name: string;
  provider: string;
  purpose: string;
  expiry: string;
  type: 'First-party' | 'Third-party';
  category: string;
}

const cookieCategories: CookieCategory[] = [
  {
    id: 'necessary',
    name: 'Necessary Cookies',
    description: 'These cookies are essential for the website to function properly. They cannot be disabled.',
    icon: Lock,
    color: 'text-blue-600',
    required: true,
    cookies: [
      {
        name: 'cookie_consent',
        provider: 'MyDub.AI',
        purpose: 'Stores user cookie consent preferences',
        expiry: '1 year',
        type: 'First-party',
        category: 'necessary'
      },
      {
        name: 'auth_token',
        provider: 'MyDub.AI',
        purpose: 'Authentication and session management',
        expiry: 'Session',
        type: 'First-party',
        category: 'necessary'
      },
      {
        name: 'csrf_token',
        provider: 'MyDub.AI',
        purpose: 'Security token to prevent cross-site request forgery',
        expiry: 'Session',
        type: 'First-party',
        category: 'necessary'
      },
      {
        name: 'locale',
        provider: 'MyDub.AI',
        purpose: 'Stores user language preference',
        expiry: '1 year',
        type: 'First-party',
        category: 'necessary'
      }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics Cookies',
    description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
    icon: BarChart3,
    color: 'text-purple-600',
    required: false,
    cookies: [
      {
        name: '_ga',
        provider: 'Google Analytics',
        purpose: 'Distinguishes unique users by assigning a randomly generated number',
        expiry: '2 years',
        type: 'Third-party',
        category: 'analytics'
      },
      {
        name: '_gid',
        provider: 'Google Analytics',
        purpose: 'Distinguishes users for 24 hours',
        expiry: '24 hours',
        type: 'Third-party',
        category: 'analytics'
      },
      {
        name: '_gat',
        provider: 'Google Analytics',
        purpose: 'Used to throttle request rate',
        expiry: '1 minute',
        type: 'Third-party',
        category: 'analytics'
      },
      {
        name: '_ga_*',
        provider: 'Google Analytics 4',
        purpose: 'Used to persist session state',
        expiry: '2 years',
        type: 'Third-party',
        category: 'analytics'
      }
    ]
  },
  {
    id: 'performance',
    name: 'Performance Cookies',
    description: 'These cookies help us monitor and improve the performance of our website.',
    icon: Clock,
    color: 'text-orange-600',
    required: false,
    cookies: [
      {
        name: 'perf_metrics',
        provider: 'MyDub.AI',
        purpose: 'Stores performance metrics for optimization',
        expiry: '7 days',
        type: 'First-party',
        category: 'performance'
      },
      {
        name: '_sentry_*',
        provider: 'Sentry',
        purpose: 'Error tracking and performance monitoring',
        expiry: '2 weeks',
        type: 'Third-party',
        category: 'performance'
      }
    ]
  },
  {
    id: 'functional',
    name: 'Functional Cookies',
    description: 'These cookies enable enhanced functionality and personalization.',
    icon: Settings,
    color: 'text-green-600',
    required: false,
    cookies: [
      {
        name: 'theme',
        provider: 'MyDub.AI',
        purpose: 'Stores user theme preference (light/dark)',
        expiry: '1 year',
        type: 'First-party',
        category: 'functional'
      },
      {
        name: 'sidebar_state',
        provider: 'MyDub.AI',
        purpose: 'Remembers sidebar open/closed state',
        expiry: '1 year',
        type: 'First-party',
        category: 'functional'
      },
      {
        name: 'recent_searches',
        provider: 'MyDub.AI',
        purpose: 'Stores recent search history for quick access',
        expiry: '30 days',
        type: 'First-party',
        category: 'functional'
      }
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing Cookies',
    description: 'These cookies are used to track visitors across websites for marketing purposes.',
    icon: Target,
    color: 'text-red-600',
    required: false,
    cookies: [
      {
        name: '_fbp',
        provider: 'Facebook',
        purpose: 'Used by Facebook to deliver advertising',
        expiry: '3 months',
        type: 'Third-party',
        category: 'marketing'
      },
      {
        name: '_gcl_au',
        provider: 'Google AdSense',
        purpose: 'Used by Google AdSense for experimenting with advertisement efficiency',
        expiry: '3 months',
        type: 'Third-party',
        category: 'marketing'
      }
    ]
  }
];

export function CookiePolicyPage() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [policyDocument, setPolicyDocument] = useState<LegalDocument | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['necessary']);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    loadPolicyDocument();
  }, [i18n.language]);

  const loadPolicyDocument = async () => {
    try {
      setLoading(true);
      const document = await GDPRService.getActiveLegalDocument('cookie_policy', i18n.language);
      setPolicyDocument(document);
    } catch (error) {
      console.error('Failed to load cookie policy:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const lastUpdated = policyDocument?.effective_date 
    ? new Date(policyDocument.effective_date).toLocaleDateString(i18n.language)
    : new Date('2025-01-15').toLocaleDateString(i18n.language);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Cookie Policy</h1>
          <CookieSettingsButton />
        </div>
        <p className="text-muted-foreground">
          Last updated: {lastUpdated} 
          {policyDocument && (
            <Badge variant="outline" className="ml-2">
              Version {policyDocument.version}
            </Badge>
          )}
        </p>
      </div>

      {/* Introduction */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CookieIcon className="h-5 w-5" />
            What Are Cookies?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Cookies are small text files that are placed on your device when you visit our website. 
            They help us provide you with a better experience by remembering your preferences, 
            analyzing how you use our site, and enabling certain features.
          </p>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              We use cookies in accordance with the EU General Data Protection Regulation (GDPR) 
              and other applicable privacy laws. You have full control over which cookies we use.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Cookie Categories */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Cookie Categories</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
          </Button>
        </div>

        {cookieCategories.map((category) => {
          const Icon = category.icon;
          const isExpanded = expandedCategories.includes(category.id);

          return (
            <Card key={category.id}>
              <CardHeader>
                <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 bg-background rounded-lg ${category.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            {category.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {category.required ? (
                          <Badge variant="secondary">Required</Badge>
                        ) : (
                          <Badge variant="outline">Optional</Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-6">
                      {showTechnicalDetails ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Cookie Name</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>Purpose</TableHead>
                                <TableHead>Expiry</TableHead>
                                <TableHead>Type</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {category.cookies.map((cookie, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-mono text-sm">
                                    {cookie.name}
                                  </TableCell>
                                  <TableCell>{cookie.provider}</TableCell>
                                  <TableCell className="text-sm">
                                    {cookie.purpose}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {cookie.expiry}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={cookie.type === 'First-party' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {cookie.type}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {category.cookies.map((cookie, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                              <div className="mt-0.5">
                                {cookie.type === 'First-party' ? (
                                  <Server className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Globe className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="font-medium text-sm">{cookie.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {cookie.purpose}
                                </p>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {cookie.expiry}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {cookie.provider}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Cookie Management */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Managing Your Cookie Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            You can manage your cookie preferences at any time by clicking the cookie settings 
            button in the footer of our website or using the button at the top of this page.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Accept or Reject</p>
                <p className="text-sm text-muted-foreground">
                  Choose which categories of cookies you want to accept
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">Granular Control</p>
                <p className="text-sm text-muted-foreground">
                  Fine-tune your preferences for each cookie category
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium">Transparency</p>
                <p className="text-sm text-muted-foreground">
                  See exactly what each cookie does and why we use it
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium">Privacy First</p>
                <p className="text-sm text-muted-foreground">
                  Your privacy choices are always respected
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Browser Cookie Settings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Browser Cookie Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Most web browsers allow you to control cookies through their settings. Here's how to 
            manage cookies in popular browsers:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a 
                href="https://support.google.com/chrome/answer/95647" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Chrome
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a 
                href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Mozilla Firefox
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a 
                href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Safari
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a 
                href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Microsoft Edge
              </a>
            </div>
          </div>
          <Alert>
            <AlertDescription>
              Please note that disabling cookies may affect the functionality of our website 
              and prevent you from using certain features.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Updates to This Policy */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Updates to This Cookie Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            We may update this Cookie Policy from time to time to reflect changes in our practices 
            or for legal, operational, or regulatory reasons. When we make changes:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <span>We'll update the "Last updated" date at the top of this policy</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <span>For significant changes, we'll notify you via email or through the app</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <span>We'll ask for your consent again if required by law</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Questions About Cookies?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            If you have any questions about our use of cookies or this Cookie Policy, please contact us:
          </p>
          <div className="space-y-2">
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:privacy@mydub.ai" className="text-primary hover:underline">
                privacy@mydub.ai
              </a>
            </p>
            <p>
              <strong>Data Protection Officer:</strong>{' '}
              <a href="mailto:dpo@mydub.ai" className="text-primary hover:underline">
                dpo@mydub.ai
              </a>
            </p>
            <p>
              <strong>Address:</strong> Dubai, United Arab Emirates
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CookiePolicyPage;