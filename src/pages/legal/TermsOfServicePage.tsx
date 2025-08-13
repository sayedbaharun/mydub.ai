import { useTranslation } from 'react-i18next';
import {  AlertCircle, CheckCircle, XCircle, Info, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export function TermsOfServicePage() {
  const { t, i18n } = useTranslation();
  const lastUpdated = new Date('2025-01-15').toLocaleDateString(i18n.language);

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing and using MyDub.AI, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`
    },
    {
      title: '2. Use License',
      content: `Permission is granted to temporarily access the materials (information or software) on MyDub.AI for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.`,
      restrictions: [
        'Modify or copy the materials',
        'Use the materials for any commercial purpose or public display',
        'Attempt to reverse engineer any software contained on MyDub.AI',
        'Remove any copyright or proprietary notations from the materials'
      ]
    },
    {
      title: '3. User Accounts',
      content: `When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.`,
      requirements: [
        'Provide accurate and complete information',
        'Maintain the security of your password',
        'Notify us immediately of any unauthorized access',
        'Accept responsibility for all activities under your account'
      ]
    },
    {
      title: '4. Prohibited Uses',
      content: `You may not use our service:`,
      prohibitions: [
        'For any unlawful purpose or to solicit others to perform unlawful acts',
        'To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances',
        'To infringe upon or violate our intellectual property rights or the intellectual property rights of others',
        'To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate',
        'To submit false or misleading information',
        'To upload or transmit viruses or any other type of malicious code'
      ]
    },
    {
      title: '5. Content',
      content: `Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content that you post to the service, including its legality, reliability, and appropriateness.`
    },
    {
      title: '6. Privacy',
      content: `Your use of MyDub.AI is also governed by our Privacy Policy. Please review our Privacy Policy, which also governs the Site and informs users of our data collection practices.`
    },
    {
      title: '7. Disclaimers',
      content: `The information on MyDub.AI is provided on an "as is" basis. To the fullest extent permitted by law, this platform:`,
      disclaimers: [
        'Excludes all representations and warranties relating to this website and its contents',
        'Excludes all liability for damages arising out of or in connection with your use of this website'
      ]
    },
    {
      title: '8. Limitations',
      content: `In no event shall MyDub.AI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use MyDub.AI.`
    },
    {
      title: '9. Governing Law',
      content: `These terms and conditions are governed by and construed in accordance with the laws of the United Arab Emirates and you irrevocably submit to the exclusive jurisdiction of the courts in that location.`
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('legal.termsOfService')}</h1>
        <p className="text-muted-foreground">
          {t('legal.lastUpdated')}: {lastUpdated}
        </p>
      </div>

      <Alert className="mb-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please read these Terms of Service carefully before using MyDub.AI. Your access to and use 
          of the service is conditioned on your acceptance of and compliance with these terms.
        </AlertDescription>
      </Alert>

      <div className="space-y-8">
        {sections.map((section, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-xl">{section.title}</CardTitle>
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
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Termination</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            We may terminate or suspend your account and bar access to the service immediately, 
            without prior notice or liability, under our sole discretion, for any reason whatsoever 
            and without limitation, including but not limited to a breach of the Terms.
          </p>
          <p>
            If you wish to terminate your account, you may simply discontinue using the service or 
            contact us at support@mydub.ai.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Changes to Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any 
            time. If a revision is material, we will provide at least 30 days notice prior to any 
            new terms taking effect.
          </p>
          <p>
            By continuing to access or use our service after any revisions become effective, you 
            agree to be bound by the revised terms.
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
          By using MyDub.AI, you signify your acceptance of these Terms of Service.
        </p>
      </div>
    </div>
  );
}

export default TermsOfServicePage;