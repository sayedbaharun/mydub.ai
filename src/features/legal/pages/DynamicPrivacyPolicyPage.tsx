import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  Lock, 
  Eye, 
  Database, 
  Globe, 
  Mail, 
  Phone,
  FileText,
  Download,
  History,
  CheckCircle,
  Info,
  Users,
  Server,
  Key,
  Clock,
  AlertTriangle,
  ChevronRight,
  Trash2,
  Settings
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useToast } from '@/shared/hooks/use-toast';

import { GDPRService } from '../services/gdpr.service';
import { LegalDocument, UserConsent } from '../types';
import { useSession } from '@/features/auth/hooks/useSession';

interface PrivacySection {
  id: string;
  icon: any;
  title: string;
  content: string[];
  expandable?: boolean;
  details?: string;
}

export function DynamicPrivacyPolicyPage() {
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [policyDocument, setPolicyDocument] = useState<LegalDocument | null>(null);
  const [previousVersions, setPreviousVersions] = useState<LegalDocument[]>([]);
  const [userConsent, setUserConsent] = useState<UserConsent | null>(null);
  const [acceptingPolicy, setAcceptingPolicy] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  useEffect(() => {
    loadPrivacyPolicy();
  }, [i18n.language]);

  useEffect(() => {
    if (user && policyDocument) {
      checkUserConsent();
    }
  }, [user, policyDocument]);

  const loadPrivacyPolicy = async () => {
    try {
      setLoading(true);
      const document = await GDPRService.getActiveLegalDocument('privacy_policy', i18n.language);
      setPolicyDocument(document);
      
      // Load previous versions for history
      // This would need to be implemented in the GDPR service
      // const versions = await GDPRService.getLegalDocumentHistory('privacy_policy', i18n.language);
      // setPreviousVersions(versions);
    } catch (error) {
      console.error('Failed to load privacy policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to load privacy policy',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkUserConsent = async () => {
    if (!user || !policyDocument) return;

    try {
      const consents = await GDPRService.getUserConsents(user.id);
      const privacyConsent = consents.find(
        c => c.consent_type === 'privacy_policy' && 
        c.document_version === policyDocument.version &&
        c.consent_given
      );
      setUserConsent(privacyConsent || null);
    } catch (error) {
      console.error('Failed to check user consent:', error);
    }
  };

  const acceptPrivacyPolicy = async () => {
    if (!user || !policyDocument) return;

    try {
      setAcceptingPolicy(true);
      await GDPRService.recordConsent(
        user.id,
        'privacy_policy',
        true,
        policyDocument.version,
        '0.0.0.0', // This would come from the request
        navigator.userAgent
      );
      
      await checkUserConsent();
      toast({
        title: 'Privacy Policy Accepted',
        description: 'Thank you for accepting our privacy policy.'
      });
    } catch (error) {
      console.error('Failed to record consent:', error);
      toast({
        title: 'Error',
        description: 'Failed to record your consent',
        variant: 'destructive'
      });
    } finally {
      setAcceptingPolicy(false);
    }
  };

  const downloadPolicy = () => {
    if (!policyDocument) return;

    const blob = new Blob([policyDocument.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacy-policy-v${policyDocument.version}-${i18n.language}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Privacy policy has been downloaded.'
    });
  };

  const sections: PrivacySection[] = [
    {
      id: 'collection',
      icon: Database,
      title: 'Information We Collect',
      content: [
        'Personal identification information (Name, email address, phone number)',
        'Account credentials and authentication data',
        'Usage data and interaction patterns',
        'Device information (IP address, browser type, operating system)',
        'Location data (with your explicit consent)',
        'Communication preferences and history',
        'Payment information (processed securely through third-party providers)'
      ],
      expandable: true,
      details: 'We collect information to provide better services to all our users. The information we collect, and how that information is used, depends on how you use our services and how you manage your privacy controls.'
    },
    {
      id: 'usage',
      icon: Eye,
      title: 'How We Use Your Information',
      content: [
        'To provide, maintain, and improve our services',
        'To personalize your experience and deliver relevant content',
        'To communicate with you about updates, security alerts, and support',
        'To process transactions and send transaction notifications',
        'To detect, prevent, and address technical issues and security threats',
        'To comply with legal obligations and enforce our terms',
        'To develop new features and services'
      ],
      expandable: true,
      details: 'We use the information we collect from all our services for the following purposes: provide our services, maintain & improve our services, develop new services, provide personalized services, measure performance, communicate with you, and protect MyDub.AI, our users, and the public.'
    },
    {
      id: 'sharing',
      icon: Globe,
      title: 'Information Sharing',
      content: [
        'We do not sell, trade, or rent your personal information',
        'Sharing with service providers under strict confidentiality agreements',
        'Disclosure when required by law or legal process',
        'With your explicit consent for specific purposes',
        'In aggregated, anonymized form for analytics and research',
        'During business transfers or acquisitions (with notice)',
        'To protect rights, property, or safety of MyDub.AI and users'
      ]
    },
    {
      id: 'protection',
      icon: Shield,
      title: 'Data Protection & Security',
      content: [
        'Industry-standard encryption for data in transit and at rest',
        'Regular security audits and vulnerability assessments',
        'Access controls and authentication mechanisms',
        'Employee training on data protection and privacy',
        'Incident response procedures for data breaches',
        'Data minimization and purpose limitation principles',
        'Regular backups and disaster recovery procedures'
      ],
      expandable: true,
      details: 'We work hard to protect you and MyDub.AI from unauthorized access, alteration, disclosure, or destruction of information we hold. We use encryption to keep your data private while in transit. We review our information collection, storage, and processing practices.'
    },
    {
      id: 'rights',
      icon: Key,
      title: 'Your Privacy Rights',
      content: [
        'Right to access your personal data',
        'Right to rectify inaccurate information',
        'Right to erasure ("right to be forgotten")',
        'Right to restrict processing',
        'Right to data portability',
        'Right to object to processing',
        'Right to withdraw consent at any time',
        'Right to lodge a complaint with supervisory authorities'
      ],
      expandable: true,
      details: 'Under the GDPR and other privacy laws, you have certain rights regarding your personal data. You can exercise these rights at any time through your privacy center or by contacting our Data Protection Officer.'
    },
    {
      id: 'retention',
      icon: Clock,
      title: 'Data Retention',
      content: [
        'Active account data: Retained while account is active',
        'Deleted account data: Removed within 30 days',
        'Legal compliance data: As required by law',
        'Analytics data: Anonymized after 2 years',
        'Communication logs: 1 year',
        'Security logs: 6 months',
        'You can request deletion at any time'
      ]
    },
    {
      id: 'international',
      icon: Globe,
      title: 'International Data Transfers',
      content: [
        'Data may be processed in countries outside your residence',
        'We ensure appropriate safeguards for international transfers',
        'Standard contractual clauses for data protection',
        'Privacy Shield compliance where applicable',
        'Your data rights remain protected regardless of location'
      ]
    },
    {
      id: 'children',
      icon: Users,
      title: "Children's Privacy",
      content: [
        'Our services are not directed to children under 13',
        'We do not knowingly collect data from children under 13',
        'Parents can contact us to remove children\'s data',
        'Special protections for users aged 13-18'
      ]
    }
  ];

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
    : new Date().toLocaleDateString(i18n.language);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">{t('legal.privacyPolicy')}</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadPolicy}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  Version History
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Privacy Policy Version History</DialogTitle>
                  <DialogDescription>
                    View previous versions of our privacy policy
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] mt-4">
                  <div className="space-y-4">
                    {policyDocument && (
                      <div className="p-4 border rounded-lg bg-primary/5">
                        <div className="flex items-center justify-between mb-2">
                          <Badge>Current Version {policyDocument.version}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(policyDocument.effective_date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">Current privacy policy</p>
                      </div>
                    )}
                    {previousVersions.map((version) => (
                      <div key={version.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">Version {version.version}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(version.effective_date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Archived version
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <p>
            {t('legal.lastUpdated')}: {lastUpdated}
          </p>
          {policyDocument && (
            <Badge variant="outline">
              Version {policyDocument.version}
            </Badge>
          )}
        </div>
      </div>

      {/* User Consent Status */}
      {user && (
        <Alert className="mb-8">
          {userConsent ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You accepted this privacy policy on {new Date(userConsent.consent_date).toLocaleDateString()}.
                <Button 
                  variant="link" 
                  className="ml-2 p-0 h-auto"
                  onClick={() => window.location.href = '/user/privacy-center'}
                >
                  Manage your privacy settings
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </AlertDescription>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Please review and accept our updated privacy policy.</span>
                <Button 
                  size="sm" 
                  onClick={acceptPrivacyPolicy}
                  disabled={acceptingPolicy}
                >
                  {acceptingPolicy ? 'Accepting...' : 'Accept Privacy Policy'}
                </Button>
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

      {/* Introduction */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <p className="text-lg leading-relaxed mb-4">
            At MyDub.AI, we are committed to protecting your privacy and ensuring the security 
            of your personal information. This Privacy Policy explains how we collect, use, 
            disclose, and safeguard your data when you use our platform.
          </p>
          <p className="text-muted-foreground">
            This policy applies to all users of MyDub.AI services and is designed to comply 
            with the EU General Data Protection Regulation (GDPR), California Consumer Privacy 
            Act (CCPA), and other applicable privacy laws worldwide.
          </p>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Policy</TabsTrigger>
          <TabsTrigger value="rights">Your Rights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6">
            {sections.slice(0, 5).map((section) => {
              const Icon = section.icon;
              return (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.content.slice(0, 3).map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {section.content.length > 3 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        ...and {section.content.length - 3} more items
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Detailed Policy Tab */}
        <TabsContent value="detailed" className="space-y-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    {section.title}
                  </CardTitle>
                  {section.details && (
                    <CardDescription className="mt-2">
                      {section.details}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.content.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Your Rights Tab */}
        <TabsContent value="rights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Privacy Rights Under GDPR</CardTitle>
              <CardDescription>
                As a data subject, you have the following rights under the General Data Protection Regulation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex gap-4 p-4 border rounded-lg">
                  <Eye className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Right to Access</h4>
                    <p className="text-sm text-muted-foreground">
                      You have the right to request a copy of the personal data we hold about you.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Right to Rectification</h4>
                    <p className="text-sm text-muted-foreground">
                      You can request that we correct any inaccurate or incomplete personal data.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg">
                  <Trash2 className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Right to Erasure</h4>
                    <p className="text-sm text-muted-foreground">
                      Also known as the "right to be forgotten," you can request deletion of your personal data.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg">
                  <Lock className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Right to Restrict Processing</h4>
                    <p className="text-sm text-muted-foreground">
                      You can request that we limit how we use your personal data.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg">
                  <Download className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Right to Data Portability</h4>
                    <p className="text-sm text-muted-foreground">
                      You can request your data in a machine-readable format to transfer to another service.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border rounded-lg">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Right to Object</h4>
                    <p className="text-sm text-muted-foreground">
                      You can object to certain types of processing of your personal data.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                <p className="text-sm mb-3">
                  To exercise any of these rights, you can:
                </p>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.location.href = '/user/privacy-center'}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Visit your Privacy Center
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.location.href = 'mailto:privacy@mydub.ai'}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email privacy@mydub.ai
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.location.href = 'mailto:dpo@mydub.ai'}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Contact our Data Protection Officer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Third-Party Services */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Third-Party Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            We use trusted third-party services to help us provide and improve our services:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-1">Supabase</h4>
              <p className="text-sm text-muted-foreground">
                Database and authentication services
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-1">Google Analytics</h4>
              <p className="text-sm text-muted-foreground">
                Website analytics and performance monitoring
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-1">Sentry</h4>
              <p className="text-sm text-muted-foreground">
                Error tracking and performance monitoring
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-1">OpenAI / Anthropic</h4>
              <p className="text-sm text-muted-foreground">
                AI services for chatbot functionality
              </p>
            </div>
          </div>
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Each third-party service has its own privacy policy. We ensure all our partners 
              comply with GDPR and maintain high security standards.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Privacy Team</p>
                <a href="mailto:privacy@mydub.ai" className="text-primary hover:underline">
                  privacy@mydub.ai
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Data Protection Officer</p>
                <a href="mailto:dpo@mydub.ai" className="text-primary hover:underline">
                  dpo@mydub.ai
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Phone</p>
                <span>+971 4 123 4567</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Address</p>
                <span>Dubai, United Arab Emirates</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy Updates */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          This privacy policy is effective as of {lastUpdated} and will remain in effect except 
          with respect to any changes in its provisions in the future, which will be in effect 
          immediately after being posted on this page. We reserve the right to update or change 
          our Privacy Policy at any time and you should check this Privacy Policy periodically.
        </p>
      </div>
    </div>
  );
}

export default DynamicPrivacyPolicyPage;