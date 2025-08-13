import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Scale,
  FileText,
  Download,
  History,
  Shield,
  Lock,
  Globe,
  Clock,
  ChevronRight,
  Gavel,
  BookOpen,
  AlertTriangle
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

import { GDPRService } from '@/features/legal/services/gdpr.service';
import { LegalDocument, UserConsent } from '@/features/legal/types';
import { useSession } from '@/features/auth/hooks/useSession';

interface TermsSection {
  title: string;
  content: string;
  restrictions?: string[];
  requirements?: string[];
  prohibitions?: string[];
  disclaimers?: string[];
  important?: boolean;
}

export function EnhancedTermsOfServicePage() {
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [termsDocument, setTermsDocument] = useState<LegalDocument | null>(null);
  const [userConsent, setUserConsent] = useState<UserConsent | null>(null);
  const [acceptingTerms, setAcceptingTerms] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [agreeCheckbox, setAgreeCheckbox] = useState(false);
  const [readConfirmation, setReadConfirmation] = useState(false);

  useEffect(() => {
    loadTermsOfService();
  }, [i18n.language]);

  useEffect(() => {
    if (user && termsDocument) {
      checkUserConsent();
    }
  }, [user, termsDocument]);

  const loadTermsOfService = async () => {
    try {
      setLoading(true);
      const document = await GDPRService.getActiveLegalDocument('terms_of_service', i18n.language);
      setTermsDocument(document);
    } catch (error) {
      console.error('Failed to load terms of service:', error);
      toast({
        title: 'Error',
        description: 'Failed to load terms of service',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkUserConsent = async () => {
    if (!user || !termsDocument) return;

    try {
      const consents = await GDPRService.getUserConsents(user.id);
      const termsConsent = consents.find(
        c => c.consent_type === 'terms_of_service' && 
        c.document_version === termsDocument.version &&
        c.consent_given
      );
      setUserConsent(termsConsent || null);

      // If user hasn't accepted current version, show accept dialog
      if (!termsConsent && user) {
        setShowAcceptDialog(true);
      }
    } catch (error) {
      console.error('Failed to check user consent:', error);
    }
  };

  const acceptTerms = async () => {
    if (!user || !termsDocument || !agreeCheckbox || !readConfirmation) return;

    try {
      setAcceptingTerms(true);
      await GDPRService.recordConsent(
        user.id,
        'terms_of_service',
        true,
        termsDocument.version,
        '0.0.0.0', // This would come from the request
        navigator.userAgent
      );
      
      await checkUserConsent();
      setShowAcceptDialog(false);
      toast({
        title: 'Terms Accepted',
        description: 'Thank you for accepting our terms of service.'
      });
    } catch (error) {
      console.error('Failed to record consent:', error);
      toast({
        title: 'Error',
        description: 'Failed to record your acceptance',
        variant: 'destructive'
      });
    } finally {
      setAcceptingTerms(false);
    }
  };

  const downloadTerms = () => {
    if (!termsDocument) return;

    const blob = new Blob([termsDocument.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terms-of-service-v${termsDocument.version}-${i18n.language}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Terms of service has been downloaded.'
    });
  };

  const sections: TermsSection[] = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing and using MyDub.AI ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service. These terms apply to all users of the Service, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.`,
      important: true
    },
    {
      title: '2. Use License',
      content: `Permission is granted to temporarily access the materials (information or software) on MyDub.AI for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.`,
      restrictions: [
        'Modify or copy the materials without explicit permission',
        'Use the materials for any commercial purpose or public display',
        'Attempt to reverse engineer any software contained on MyDub.AI',
        'Remove any copyright or proprietary notations from the materials',
        'Transfer the materials to another person or "mirror" the materials on any other server'
      ]
    },
    {
      title: '3. User Accounts',
      content: `When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access or use of your account.`,
      requirements: [
        'Provide accurate, current, and complete information',
        'Maintain the security and confidentiality of your password',
        'Notify us immediately of any unauthorized access',
        'Accept responsibility for all activities under your account',
        'Update your information to keep it accurate',
        'Not share your account credentials with others'
      ]
    },
    {
      title: '4. Prohibited Uses',
      content: `You are prohibited from using the Service or its content:`,
      prohibitions: [
        'For any unlawful purpose or to solicit others to perform unlawful acts',
        'To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances',
        'To infringe upon or violate our intellectual property rights or the intellectual property rights of others',
        'To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate',
        'To submit false or misleading information',
        'To upload or transmit viruses or any other type of malicious code',
        'To collect or track personal information of others without consent',
        'To spam, phish, pharm, pretext, spider, crawl, or scrape',
        'For any obscene or immoral purpose',
        'To interfere with or circumvent security features of the Service'
      ]
    },
    {
      title: '5. Content and Intellectual Property',
      content: `Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness. By posting Content, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content.`
    },
    {
      title: '6. Privacy Policy',
      content: `Your use of MyDub.AI is also governed by our Privacy Policy. Please review our Privacy Policy, which also governs the Site and informs users of our data collection practices. By using the Service, you consent to our collection and use of personal data as outlined in the Privacy Policy.`
    },
    {
      title: '7. Disclaimers and Limitations',
      content: `The information on MyDub.AI is provided on an "as is" basis. To the fullest extent permitted by law, this platform:`,
      disclaimers: [
        'Makes no warranties, expressed or implied, regarding the Service',
        'Disclaims all warranties including merchantability and fitness for a particular purpose',
        'Does not warrant that the Service will be uninterrupted or error-free',
        'Does not warrant the accuracy or completeness of information',
        'Is not responsible for any errors or omissions in content',
        'Excludes all liability for damages arising from use of the Service'
      ]
    },
    {
      title: '8. Limitation of Liability',
      content: `In no event shall MyDub.AI, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.`,
      important: true
    },
    {
      title: '9. Indemnification',
      content: `You agree to defend, indemnify, and hold harmless MyDub.AI and its licensee and licensors, and their employees, contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees).`
    },
    {
      title: '10. Termination',
      content: `We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms. Upon termination, your right to use the Service will cease immediately.`
    },
    {
      title: '11. Governing Law',
      content: `These Terms shall be governed and construed in accordance with the laws of the United Arab Emirates, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.`
    },
    {
      title: '12. Changes to Terms',
      content: `We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms.`
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

  const lastUpdated = termsDocument?.effective_date 
    ? new Date(termsDocument.effective_date).toLocaleDateString(i18n.language)
    : new Date('2025-01-15').toLocaleDateString(i18n.language);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">{t('legal.termsOfService')}</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadTerms}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            {user && !userConsent && (
              <Button size="sm" onClick={() => setShowAcceptDialog(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Terms
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <p>
            {t('legal.lastUpdated')}: {lastUpdated}
          </p>
          {termsDocument && (
            <Badge variant="outline">
              Version {termsDocument.version}
            </Badge>
          )}
        </div>
      </div>

      {/* User Consent Status */}
      {user && (
        <Alert className={`mb-8 ${userConsent ? '' : 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950'}`}>
          {userConsent ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You accepted these terms of service on {new Date(userConsent.consent_date).toLocaleDateString()}.
              </AlertDescription>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle>Action Required</AlertTitle>
              <AlertDescription>
                You must accept our Terms of Service to continue using MyDub.AI.
                <Button 
                  variant="link" 
                  className="ml-2 p-0 h-auto text-orange-600 hover:text-orange-700"
                  onClick={() => setShowAcceptDialog(true)}
                >
                  Review and accept terms
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

      {/* Important Notice */}
      <Alert className="mb-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important Legal Agreement</AlertTitle>
        <AlertDescription>
          Please read these Terms of Service carefully before using MyDub.AI. Your access to and use 
          of the service is conditioned on your acceptance of and compliance with these terms. These terms 
          apply to all visitors, users, and others who access or use the service.
        </AlertDescription>
      </Alert>

      {/* Terms Sections */}
      <div className="space-y-8">
        {sections.map((section, index) => (
          <Card key={index} className={section.important ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                {section.important && <Gavel className="h-5 w-5 text-primary" />}
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="leading-relaxed">{section.content}</p>
              
              {section.restrictions && (
                <div className="space-y-2">
                  <p className="font-medium">Under this license you may not:</p>
                  <ul className="space-y-1">
                    {section.restrictions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {section.requirements && (
                <div className="space-y-2">
                  <p className="font-medium">You must:</p>
                  <ul className="space-y-1">
                    {section.requirements.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {section.prohibitions && (
                <ul className="space-y-1">
                  {section.prohibitions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.disclaimers && (
                <ul className="space-y-1">
                  {section.disclaimers.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-8" />

      {/* Additional Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Intellectual Property Rights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            MyDub.AI and its original content, features, and functionality are and will remain the 
            exclusive property of MyDub.AI and its licensors. The service is protected by copyright, 
            trademark, and other laws of both the United Arab Emirates and foreign countries. Our 
            trademarks and trade dress may not be used in connection with any product or service 
            without our prior written consent.
          </p>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              All content, logos, and data on MyDub.AI are protected by intellectual property laws. 
              Unauthorized use may result in legal action.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            International Use
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            The Service is controlled and operated from the United Arab Emirates. We make no 
            representations that the Service is appropriate or available for use in other locations. 
            Those who access or use the Service from other jurisdictions do so at their own volition 
            and are responsible for compliance with local law.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Dispute Resolution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Any dispute arising out of or relating to these Terms and Conditions will be resolved 
            through final and binding arbitration in accordance with the rules of the Dubai 
            International Arbitration Centre (DIAC). The arbitration will be conducted in Dubai, 
            United Arab Emirates, and the language of arbitration will be English.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            If you have any questions about these Terms, please contact us at:
          </p>
          <div className="space-y-1">
            <p>Email: legal@mydub.ai</p>
            <p>Phone: +971 4 123 4567</p>
            <p>Address: Dubai, United Arab Emirates</p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          By using MyDub.AI, you signify your acceptance of these Terms of Service. If you do not 
          agree to these terms, please do not use our service.
        </p>
      </div>

      {/* Accept Terms Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Terms of Service Agreement
            </DialogTitle>
            <DialogDescription>
              Please review and accept our Terms of Service to continue using MyDub.AI
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] my-4 pr-4">
            <div className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> By accepting these terms, you agree to be legally bound 
                  by this agreement. Please read carefully.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold">Key Points:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">
                      You must be at least 13 years old to use our service
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">
                      You are responsible for maintaining the security of your account
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">
                      You grant us license to use content you post on the platform
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">
                      The service is provided "as is" without warranties
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">
                      Disputes will be resolved through arbitration in Dubai
                    </span>
                  </li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="read-terms" 
                    checked={readConfirmation}
                    onCheckedChange={(checked) => setReadConfirmation(checked as boolean)}
                  />
                  <label 
                    htmlFor="read-terms" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I confirm that I have read and understood the Terms of Service
                  </label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="agree-terms" 
                    checked={agreeCheckbox}
                    onCheckedChange={(checked) => setAgreeCheckbox(checked as boolean)}
                  />
                  <label 
                    htmlFor="agree-terms" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to be bound by these Terms of Service
                  </label>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAcceptDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={acceptTerms}
              disabled={!agreeCheckbox || !readConfirmation || acceptingTerms}
            >
              {acceptingTerms ? 'Accepting...' : 'Accept Terms of Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EnhancedTermsOfServicePage;