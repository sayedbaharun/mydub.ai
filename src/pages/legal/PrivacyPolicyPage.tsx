import { useTranslation } from 'react-i18next';
import { Shield, Lock, Eye, Database, Globe, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function PrivacyPolicyPage() {
  const { t, i18n } = useTranslation();
  const lastUpdated = new Date('2025-01-15').toLocaleDateString(i18n.language);

  const sections = [
    {
      icon: <Database className="h-5 w-5" />,
      title: 'Information We Collect',
      content: [
        'Personal information (name, email, phone number)',
        'Usage data and analytics',
        'Location data (with your permission)',
        'Device information and IP addresses',
        'Cookies and similar technologies'
      ]
    },
    {
      icon: <Eye className="h-5 w-5" />,
      title: 'How We Use Your Information',
      content: [
        'To provide and improve our services',
        'To personalize your experience',
        'To send important updates and notifications',
        'To ensure security and prevent fraud',
        'To comply with legal obligations'
      ]
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Data Protection',
      content: [
        'Industry-standard encryption for data transmission',
        'Secure servers with regular security audits',
        'Limited access to personal information',
        'Regular security training for our team',
        'Compliance with international data protection laws'
      ]
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: 'Data Sharing',
      content: [
        'We do not sell your personal information',
        'Sharing with service providers under strict agreements',
        'Disclosure when required by law',
        'With your explicit consent only',
        'Anonymized data for research and analytics'
      ]
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: 'Your Rights',
      content: [
        'Access your personal data',
        'Correct inaccurate information',
        'Request deletion of your data',
        'Opt-out of marketing communications',
        'Data portability upon request'
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('legal.privacyPolicy')}</h1>
        <p className="text-muted-foreground">
          {t('legal.lastUpdated')}: {lastUpdated}
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <p className="text-lg leading-relaxed">
            At MyDub.AI, we take your privacy seriously. This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you use our platform. Please read this 
            privacy policy carefully. If you do not agree with the terms of this privacy policy, 
            please do not access the platform.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {sections.map((section, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {section.icon}
                </div>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-8" />

      <Card>
        <CardHeader>
          <CardTitle>Data Retention</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            We retain your personal information only for as long as necessary to provide you with our 
            services and as described in this Privacy Policy. However, we may also be required to retain 
            this information to comply with legal obligations, resolve disputes, and enforce our agreements.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Children's Privacy</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Our services are not intended for children under 13 years of age. We do not knowingly collect 
            personal information from children under 13. If you are a parent or guardian and believe your 
            child has provided us with personal information, please contact us.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href="mailto:privacy@mydub.ai" className="text-primary hover:underline">
                privacy@mydub.ai
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>+971 4 123 4567</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          This privacy policy is effective as of January 15, 2025 and will remain in effect except 
          with respect to any changes in its provisions in the future, which will be in effect 
          immediately after being posted on this page.
        </p>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;