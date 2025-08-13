import { useTranslation } from 'react-i18next';
import { Shield, Lock, Eye, Database, Globe, Mail, Phone, AlertCircle, FileText, Users, Building, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export function PrivacyPolicyPageUAE() {
  const { t, i18n } = useTranslation();
  const lastUpdated = new Date('2025-01-23').toLocaleDateString(i18n.language);
  const isArabic = i18n.language === 'ar';

  const sections = [
    {
      icon: <Building className="h-5 w-5" />,
      title: 'UAE Data Protection Compliance',
      badge: 'UAE Federal Law No. 45 of 2021',
      content: [
        'Full compliance with UAE Federal Law No. 45 of 2021 on the Protection of Personal Data',
        'Registered data controller with appropriate UAE authorities',
        'Data processing in accordance with TDRA guidelines',
        'Compliance with Dubai Data Law (Law No. 26 of 2015) for government data',
        'Adherence to DIFC Data Protection Law where applicable',
        'Regular compliance audits by certified UAE data protection officers'
      ]
    },
    {
      icon: <Database className="h-5 w-5" />,
      title: 'Information We Collect',
      content: [
        'Personal identification (name, Emirates ID number with consent)',
        'Contact information (email, UAE phone number, Dubai/UAE address)',
        'Government service preferences and usage',
        'Location data within UAE (only with explicit permission)',
        'Device information and IP addresses',
        'Language preferences (Arabic, English, Hindi, Urdu)',
        'Tourism and cultural interest data',
        'AI chat interaction history'
      ]
    },
    {
      icon: <Eye className="h-5 w-5" />,
      title: 'How We Use Your Information',
      content: [
        'To provide Dubai government service information',
        'To offer personalized tourism recommendations',
        'To facilitate AI-powered assistance in multiple languages',
        'To send important updates about Dubai services and events',
        'To ensure platform security and prevent misuse',
        'To comply with UAE federal and local laws',
        'To improve our services based on usage patterns',
        'To provide emergency notifications when necessary'
      ]
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: 'Data Localization & Transfer',
      badge: 'UAE Data Residency',
      content: [
        'Primary data storage within UAE borders',
        'Data centers located in Dubai and Abu Dhabi',
        'Cross-border transfers only with explicit consent',
        'Transfers to countries with adequate protection levels',
        'Standard Contractual Clauses for international transfers',
        'No data transfers to countries without data protection laws',
        'Regular audits of data location and access'
      ]
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Data Protection & Security',
      content: [
        'AES-256 encryption for all personal data',
        'Secure data centers certified to UAE standards',
        'Regular security assessments by UAE-approved auditors',
        '24/7 security monitoring and incident response',
        'Employee background checks and security training',
        'Multi-factor authentication for data access',
        'Regular penetration testing and vulnerability assessments',
        'Compliance with UAE Cybersecurity standards'
      ]
    },
    {
      icon: <Scale className="h-5 w-5" />,
      title: 'Legal Basis for Processing',
      content: [
        'Explicit consent for personal data collection',
        'Legitimate interests for service improvement',
        'Legal obligations under UAE law',
        'Performance of services requested by you',
        'Vital interests in emergency situations',
        'Public interest for government service information'
      ]
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Data Sharing & Disclosure',
      content: [
        'No sale of personal data under any circumstances',
        'Sharing with UAE government entities as required by law',
        'Disclosure to law enforcement with valid legal requests',
        'Service providers under strict confidentiality agreements',
        'Partners only with your explicit consent',
        'Anonymized data for research with ethics approval',
        'Emergency services in life-threatening situations'
      ]
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: 'Your Rights Under UAE Law',
      badge: 'Data Subject Rights',
      content: [
        'Right to access your personal data within 30 days',
        'Right to rectify inaccurate or incomplete data',
        'Right to erasure ("right to be forgotten")',
        'Right to restrict processing of your data',
        'Right to data portability in common formats',
        'Right to object to automated decision-making',
        'Right to withdraw consent at any time',
        'Right to lodge complaints with UAE data protection authorities',
        'Right to compensation for damages from violations'
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('legal.privacyPolicy')}</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <p className="text-muted-foreground">
            {t('legal.lastUpdated')}: {lastUpdated}
          </p>
          <Badge variant="secondary">UAE Compliant</Badge>
          <Badge variant="secondary">GDPR Compliant</Badge>
        </div>
      </div>

      <Alert className="mb-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>UAE Federal Law No. 45 of 2021 Compliance Notice:</strong> This privacy policy complies with the 
          UAE Federal Data Protection Law. We are committed to protecting your personal data in accordance with 
          the highest standards of data protection under UAE law.
        </AlertDescription>
      </Alert>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <p className="text-lg leading-relaxed mb-4">
            MyDub.AI is committed to protecting your privacy in accordance with the UAE Federal Law No. 45 of 2021 
            on the Protection of Personal Data and international best practices. This Privacy Policy explains how 
            we collect, use, disclose, and safeguard your information when you use our platform in the United Arab Emirates.
          </p>
          <p className="text-lg leading-relaxed">
            يلتزم MyDub.AI بحماية خصوصيتك وفقًا للقانون الاتحادي الإماراتي رقم 45 لسنة 2021 بشأن حماية البيانات 
            الشخصية وأفضل الممارسات الدولية.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {sections.map((section, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 flex-wrap">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {section.icon}
                </div>
                <span className="flex-1">{section.title}</span>
                {section.badge && (
                  <Badge variant="outline">{section.badge}</Badge>
                )}
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
          <CardTitle>AI Usage Disclosure</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>AI Transparency Notice:</strong> MyDub.AI uses artificial intelligence to provide personalized 
              assistance. Your interactions with our AI assistant are processed to improve responses but are never 
              used to make automated decisions affecting your legal rights.
            </AlertDescription>
          </Alert>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>AI models used: OpenAI GPT-4, Anthropic Claude, Google Gemini</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Your chat data is processed locally in UAE data centers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>You can opt-out of AI features while still using other services</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>AI responses are not legal or medical advice</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Data Retention Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            In compliance with UAE data protection laws, we retain your personal data according to the following schedule:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Account data: Duration of account + 1 year</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Chat history: 90 days (unless saved by user)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Analytics data: 2 years</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Legal compliance records: 7 years</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Age Restrictions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            In accordance with UAE regulations:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Minimum age: 13 years</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Users aged 13-18 require parental consent</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Age verification required during registration</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Contact Our Data Protection Officer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            For any questions about this Privacy Policy or to exercise your data protection rights:
          </p>
          <div className="space-y-3">
            <div>
              <p className="font-semibold mb-2">Data Protection Officer</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href="mailto:dpo@mydub.ai" className="text-primary hover:underline">
                    dpo@mydub.ai
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>+971 4 123 4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>Dubai, United Arab Emirates</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <p className="font-semibold mb-2">Regulatory Authorities</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">UAE Data Office</p>
                    <p className="text-muted-foreground">For federal data protection complaints</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">TDRA</p>
                    <p className="text-muted-foreground">Telecommunications and Digital Government Regulatory Authority</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          This privacy policy is effective as of January 23, 2025 and complies with UAE Federal Law No. 45 of 2021. 
          We reserve the right to update this policy to reflect changes in law or our practices.
        </p>
      </div>
    </div>
  );
}

export default PrivacyPolicyPageUAE;