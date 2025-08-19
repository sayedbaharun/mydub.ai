import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  FileText,
  AlertTriangle,
  CheckCircle,
  Info,
  Ban,
  CreditCard,
  Globe,
  Mail,
  Phone,
  Scale,
  Download,
  History,
  ChevronRight,
  Gavel,
  UserCheck,
  ScrollText,
  AlertCircle,
  Clock,
  RefreshCw,
  Lock
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

interface TermsSection {
  id: string;
  icon: any;
  title: string;
  content: string[];
  important?: boolean;
  details?: string;
}

export function TermsOfServicePage() {
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [termsDocument, setTermsDocument] = useState<LegalDocument | null>(null);
  const [userConsent, setUserConsent] = useState<UserConsent | null>(null);
  const [acceptingTerms, setAcceptingTerms] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const effectiveDate = "January 19, 2025";
  const version = "1.0.0";

  const sections: TermsSection[] = [
    {
      id: 'acceptance',
      icon: UserCheck,
      title: '1. Acceptance of Terms',
      content: [
        'By accessing or using MyDub.AI, you agree to be bound by these Terms of Service.',
        'If you disagree with any part of these terms, you may not access our service.',
        'We may update these terms at any time, and your continued use constitutes acceptance.',
        'You must be at least 13 years old to use our services.',
        'If using on behalf of an organization, you warrant you have authority to bind them.'
      ],
      important: true
    },
    {
      id: 'services',
      icon: Globe,
      title: '2. Description of Services',
      content: [
        'MyDub.AI provides AI-powered information services about Dubai and the UAE.',
        'Services include news aggregation, government service information, and AI assistance.',
        'We offer both free and premium subscription tiers with different features.',
        'Service availability may vary based on your location and local regulations.',
        'We reserve the right to modify, suspend, or discontinue services at any time.'
      ],
      details: 'Our services are provided "as is" and we make no warranties about completeness, accuracy, or reliability of the information provided.'
    },
    {
      id: 'account',
      icon: Lock,
      title: '3. User Accounts',
      content: [
        'You are responsible for maintaining the confidentiality of your account credentials.',
        'You must provide accurate and complete information during registration.',
        'You are responsible for all activities that occur under your account.',
        'You must notify us immediately of any unauthorized use of your account.',
        'We reserve the right to suspend or terminate accounts that violate these terms.',
        'One person or entity may not maintain multiple free accounts.'
      ]
    },
    {
      id: 'conduct',
      icon: Ban,
      title: '4. Prohibited Conduct',
      content: [
        'You may not use our services for any illegal or unauthorized purpose.',
        'You may not violate any laws in your jurisdiction while using our services.',
        'You may not transmit malware, viruses, or any destructive code.',
        'You may not attempt to gain unauthorized access to our systems.',
        'You may not harass, abuse, or harm other users.',
        'You may not scrape or copy content without explicit permission.',
        'You may not use our services to spread misinformation or harmful content.',
        'You may not interfere with or disrupt the service or servers.',
        'You may not impersonate others or provide false information.',
        'You may not use the service for spam or unsolicited communications.'
      ],
      important: true
    },
    {
      id: 'content',
      icon: FileText,
      title: '5. Content and Intellectual Property',
      content: [
        'All content on MyDub.AI is protected by intellectual property laws.',
        'You retain ownership of content you submit, but grant us a license to use it.',
        'The license is worldwide, non-exclusive, royalty-free, and transferable.',
        'You may not reproduce, distribute, or create derivative works without permission.',
        'We may remove content that violates these terms or applicable laws.',
        'You are responsible for ensuring you have rights to any content you submit.',
        'Our AI-generated content is provided for informational purposes only.'
      ]
    },
    {
      id: 'privacy',
      icon: Shield,
      title: '6. Privacy and Data Protection',
      content: [
        'Your use of our services is subject to our Privacy Policy.',
        'We collect and process data in accordance with applicable privacy laws.',
        'You consent to the collection and use of data as described in our Privacy Policy.',
        'We implement reasonable security measures to protect your information.',
        'You are responsible for maintaining the security of your own devices.'
      ]
    },
    {
      id: 'payment',
      icon: CreditCard,
      title: '7. Payment Terms',
      content: [
        'Premium subscriptions are billed in advance on a recurring basis.',
        'Prices are subject to change with 30 days notice to existing subscribers.',
        'Refunds are provided only as required by law or at our discretion.',
        'You are responsible for all taxes related to your purchase.',
        'Failed payments may result in suspension of premium features.',
        'We use third-party payment processors and are not liable for their services.',
        'Subscription cancellations take effect at the end of the current billing period.'
      ]
    },
    {
      id: 'disclaimer',
      icon: AlertTriangle,
      title: '8. Disclaimers and Limitations',
      content: [
        'OUR SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.',
        'WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY.',
        'WE DO NOT GUARANTEE THE ACCURACY OR COMPLETENESS OF ANY INFORMATION.',
        'WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.',
        'OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU IN THE PAST 12 MONTHS.',
        'AI-GENERATED CONTENT MAY CONTAIN ERRORS AND SHOULD BE INDEPENDENTLY VERIFIED.',
        'WE ARE NOT RESPONSIBLE FOR THIRD-PARTY CONTENT OR SERVICES.'
      ],
      important: true,
      details: 'Some jurisdictions do not allow limitation of warranties or liability, so some of these limitations may not apply to you.'
    },
    {
      id: 'indemnification',
      icon: Scale,
      title: '9. Indemnification',
      content: [
        'You agree to indemnify and hold MyDub.AI harmless from any claims arising from:',
        'Your use of the services or violation of these terms',
        'Your violation of any third-party rights',
        'Any content you submit to our platform',
        'Your violation of any applicable laws or regulations',
        'This includes reasonable attorneys fees and costs'
      ]
    },
    {
      id: 'termination',
      icon: AlertCircle,
      title: '10. Termination',
      content: [
        'We may terminate or suspend your account at any time for violation of these terms.',
        'You may terminate your account at any time through your account settings.',
        'Upon termination, your right to use the services will immediately cease.',
        'All provisions that should survive termination will remain in effect.',
        'We may retain certain data as required by law or for legitimate business purposes.'
      ]
    },
    {
      id: 'governing',
      icon: Gavel,
      title: '11. Governing Law and Disputes',
      content: [
        'These Terms are governed by the laws of the United Arab Emirates.',
        'Any disputes shall be resolved through binding arbitration in Dubai.',
        'You waive any right to jury trial or class action lawsuits.',
        'Claims must be brought within one year of the cause of action.',
        'Small claims court actions are exempt from arbitration requirements.'
      ]
    },
    {
      id: 'changes',
      icon: RefreshCw,
      title: '12. Changes to Terms',
      content: [
        'We reserve the right to modify these terms at any time.',
        'Material changes will be notified via email or prominent notice on our platform.',
        'Changes take effect 30 days after posting unless otherwise specified.',
        'Your continued use after changes constitutes acceptance of new terms.',
        'You should review these terms periodically for updates.'
      ]
    },
    {
      id: 'general',
      icon: ScrollText,
      title: '13. General Provisions',
      content: [
        'These Terms constitute the entire agreement between you and MyDub.AI.',
        'If any provision is found unenforceable, the remainder shall continue in effect.',
        'Our failure to enforce any right is not a waiver of that right.',
        'You may not assign these terms without our written consent.',
        'We may assign our rights to any successor or affiliate.',
        'Headings are for convenience only and do not affect interpretation.'
      ]
    }
  ];

  const downloadTerms = () => {
    const content = sections.map(section => 
      `${section.title}\n\n${section.content.join('\n')}\n\n`
    ).join('');
    
    const blob = new Blob([`MyDub.AI Terms of Service\nVersion ${version}\nEffective Date: ${effectiveDate}\n\n${content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terms-of-service-v${version}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Terms of Service has been downloaded.'
    });
  };

  const acceptTerms = async () => {
    if (!user) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to accept the terms of service.',
        variant: 'destructive'
      });
      return;
    }

    setAcceptingTerms(true);
    // Simulate API call
    setTimeout(() => {
      setAcceptingTerms(false);
      toast({
        title: 'Terms Accepted',
        description: 'Thank you for accepting our terms of service.'
      });
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadTerms}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <p>Effective Date: {effectiveDate}</p>
          <Badge variant="outline">Version {version}</Badge>
        </div>
      </div>

      {/* User Consent Status */}
      {user && (
        <Alert className="mb-8">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Please review and accept our Terms of Service to continue using MyDub.AI.</span>
            <Button 
              size="sm" 
              onClick={acceptTerms}
              disabled={acceptingTerms}
            >
              {acceptingTerms ? 'Accepting...' : 'Accept Terms'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Introduction */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <p className="text-lg leading-relaxed mb-4">
            Welcome to MyDub.AI. These Terms of Service ("Terms") govern your use of our website, 
            applications, and services (collectively, the "Services"). By using MyDub.AI, you agree 
            to be bound by these Terms and our Privacy Policy.
          </p>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> By using our Services, you acknowledge that you have read, 
              understood, and agree to be bound by these Terms. If you do not agree, please do not 
              use our Services.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="space-y-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.id} className={section.important ? 'border-destructive' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${section.important ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
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
                      <span className={section.important ? 'text-destructive mt-1' : 'text-primary mt-1'}>•</span>
                      <span className={section.id === 'disclaimer' && index < 7 ? 'font-medium' : ''}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Contact Information */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Legal Team</p>
                <a href="mailto:legal@mydub.ai" className="text-primary hover:underline">
                  legal@mydub.ai
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">General Support</p>
                <a href="mailto:support@mydub.ai" className="text-primary hover:underline">
                  support@mydub.ai
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Website</p>
                <a href="https://mydub.ai" className="text-primary hover:underline">
                  https://mydub.ai
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Mailing Address</p>
                <span>Dubai, United Arab Emirates</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agreement Statement */}
      <div className="mt-8 p-6 bg-muted/50 rounded-lg text-center">
        <p className="text-sm text-muted-foreground mb-4">
          By using MyDub.AI, you acknowledge that you have read, understood, and agree to be 
          bound by these Terms of Service and our Privacy Policy.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => window.location.href = '/privacy'}>
            View Privacy Policy
          </Button>
          {user && (
            <Button onClick={acceptTerms} disabled={acceptingTerms}>
              {acceptingTerms ? 'Accepting...' : 'I Accept the Terms'}
            </Button>
          )}
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          These Terms of Service were last updated on {effectiveDate} (Version {version}).
        </p>
        <p className="mt-2">
          © {new Date().getFullYear()} MyDub.AI. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default TermsOfServicePage;