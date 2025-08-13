import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  FileText, 
  Lock, 
  Database, 
  Globe, 
  CheckCircle,
  AlertTriangle,
  Building,
  Users,
  Key,
  Server,
  Download,
  ChevronRight,
  Scale,
  Info
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

import { GDPRService } from '@/features/legal/services/gdpr.service';
import { LegalDocument } from '@/features/legal/types';

interface ProcessingActivity {
  category: string;
  purpose: string;
  legalBasis: string;
  dataTypes: string[];
  retention: string;
  recipients: string[];
}

const processingActivities: ProcessingActivity[] = [
  {
    category: 'Account Management',
    purpose: 'User registration, authentication, and account management',
    legalBasis: 'Performance of contract',
    dataTypes: ['Name', 'Email', 'Password hash', 'Profile information'],
    retention: 'Duration of account + 30 days',
    recipients: ['Supabase (authentication provider)', 'Internal staff']
  },
  {
    category: 'Service Provision',
    purpose: 'Providing AI-powered chat and information services',
    legalBasis: 'Performance of contract',
    dataTypes: ['Chat history', 'Search queries', 'User preferences', 'Usage patterns'],
    retention: 'Active account period + 2 years',
    recipients: ['OpenAI/Anthropic (AI providers)', 'Internal systems']
  },
  {
    category: 'Analytics & Improvement',
    purpose: 'Understanding usage patterns and improving services',
    legalBasis: 'Legitimate interests',
    dataTypes: ['Anonymous usage data', 'Performance metrics', 'Error logs'],
    retention: '2 years (anonymized)',
    recipients: ['Google Analytics', 'Sentry', 'Internal analytics team']
  },
  {
    category: 'Security & Compliance',
    purpose: 'Ensuring platform security and legal compliance',
    legalBasis: 'Legal obligation / Legitimate interests',
    dataTypes: ['IP addresses', 'Access logs', 'Security events'],
    retention: '6 months - 7 years (depending on legal requirements)',
    recipients: ['Security team', 'Legal authorities (when required)']
  },
  {
    category: 'Communications',
    purpose: 'Sending service updates and responding to inquiries',
    legalBasis: 'Consent / Legitimate interests',
    dataTypes: ['Email', 'Communication preferences', 'Support tickets'],
    retention: '1 year after last communication',
    recipients: ['Email service providers', 'Support team']
  }
];

const securityMeasures = [
  {
    icon: Lock,
    title: 'Encryption',
    description: 'All data is encrypted in transit (TLS/SSL) and at rest (AES-256)'
  },
  {
    icon: Shield,
    title: 'Access Controls',
    description: 'Role-based access control with principle of least privilege'
  },
  {
    icon: Key,
    title: 'Authentication',
    description: 'Multi-factor authentication and secure session management'
  },
  {
    icon: Server,
    title: 'Infrastructure',
    description: 'Secure cloud infrastructure with regular security audits'
  },
  {
    icon: Users,
    title: 'Training',
    description: 'Regular data protection training for all staff members'
  },
  {
    icon: AlertTriangle,
    title: 'Incident Response',
    description: '24-hour breach notification and comprehensive incident response plan'
  }
];

export function DataProcessingAgreementPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [dpaDocument, setDpaDocument] = useState<LegalDocument | null>(null);

  useEffect(() => {
    loadDPA();
  }, [i18n.language]);

  const loadDPA = async () => {
    try {
      setLoading(true);
      const document = await GDPRService.getActiveLegalDocument('data_processing_agreement', i18n.language);
      setDpaDocument(document);
    } catch (error) {
      console.error('Failed to load DPA:', error);
      // Use static content if no document in database
    } finally {
      setLoading(false);
    }
  };

  const downloadDPA = () => {
    const content = generateDPAContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-processing-agreement-${i18n.language}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Data Processing Agreement has been downloaded.'
    });
  };

  const generateDPAContent = () => {
    return `DATA PROCESSING AGREEMENT

This Data Processing Agreement ("DPA") forms part of the Terms of Service between MyDub.AI ("Data Processor") and the user ("Data Controller") for the provision of services.

1. DEFINITIONS
- "Personal Data" means any information relating to an identified or identifiable natural person
- "Processing" means any operation performed on Personal Data
- "Data Subject" means the individual to whom Personal Data relates
- "GDPR" means the EU General Data Protection Regulation 2016/679

2. SCOPE AND ROLES
- The Data Controller determines the purposes and means of Processing Personal Data
- The Data Processor processes Personal Data on behalf of the Data Controller
- This DPA applies to all Processing of Personal Data by the Data Processor

3. DATA PROCESSOR OBLIGATIONS
The Data Processor shall:
- Process Personal Data only on documented instructions from the Data Controller
- Ensure persons authorized to process Personal Data are committed to confidentiality
- Implement appropriate technical and organizational security measures
- Assist the Data Controller in responding to data subject requests
- Delete or return all Personal Data after the end of service provision
- Make available all information necessary to demonstrate compliance

4. SUB-PROCESSORS
- The Data Processor may engage sub-processors with prior written consent
- Current authorized sub-processors include: Supabase, OpenAI, Anthropic, Google Analytics
- The Data Processor shall impose equivalent data protection obligations on sub-processors

5. SECURITY MEASURES
Technical and organizational measures include:
- Encryption of data in transit and at rest
- Regular security assessments and penetration testing
- Access controls and authentication mechanisms
- Regular backups and disaster recovery procedures
- Employee training on data protection

6. DATA BREACH NOTIFICATION
- The Data Processor shall notify the Data Controller without undue delay upon becoming aware of a Personal Data breach
- Notification shall include the nature of the breach, categories of data affected, and measures taken

7. INTERNATIONAL TRANSFERS
- Personal Data may be transferred outside the EEA with appropriate safeguards
- Standard Contractual Clauses or other approved mechanisms will be used

8. AUDIT RIGHTS
- The Data Controller has the right to audit the Data Processor's compliance
- Audits shall be conducted with reasonable notice and during business hours

9. LIABILITY AND INDEMNIFICATION
- Each party shall be liable for its own non-compliance with data protection laws
- The Data Processor shall indemnify the Data Controller for damages caused by the Data Processor's breach

10. DURATION AND TERMINATION
- This DPA remains in effect for the duration of the service agreement
- Upon termination, Personal Data shall be deleted or returned as instructed

Last Updated: ${new Date().toLocaleDateString()}
Version: 1.0`;
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

  const lastUpdated = dpaDocument?.effective_date 
    ? new Date(dpaDocument.effective_date).toLocaleDateString(i18n.language)
    : new Date().toLocaleDateString(i18n.language);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Data Processing Agreement</h1>
          <Button variant="outline" size="sm" onClick={downloadDPA}>
            <Download className="h-4 w-4 mr-2" />
            Download DPA
          </Button>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <p>Last updated: {lastUpdated}</p>
          <Badge variant="outline">GDPR Compliant</Badge>
        </div>
      </div>

      {/* Introduction */}
      <Alert className="mb-8">
        <FileText className="h-4 w-4" />
        <AlertTitle>About This Agreement</AlertTitle>
        <AlertDescription>
          This Data Processing Agreement (DPA) supplements our Terms of Service and applies when we process 
          personal data on your behalf. It ensures compliance with GDPR and other data protection laws.
        </AlertDescription>
      </Alert>

      {/* Key Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Data Controller
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium mb-2">You (The User/Organization)</p>
            <p className="text-sm text-muted-foreground">
              Determines the purposes and means of processing personal data. 
              Responsible for ensuring lawful basis for processing.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Data Processor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium mb-2">MyDub.AI</p>
            <p className="text-sm text-muted-foreground">
              Processes personal data on behalf of the controller. 
              Acts only on documented instructions.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Processing Activities */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Processing Activities
          </CardTitle>
          <CardDescription>
            Details of how we process personal data on your behalf
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Legal Basis</TableHead>
                  <TableHead>Data Types</TableHead>
                  <TableHead>Retention</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processingActivities.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{activity.category}</TableCell>
                    <TableCell className="text-sm">{activity.purpose}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {activity.legalBasis}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {activity.dataTypes.slice(0, 2).map((type, i) => (
                          <div key={i} className="text-xs">{type}</div>
                        ))}
                        {activity.dataTypes.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{activity.dataTypes.length - 2} more
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{activity.retention}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Technical and Organizational Measures */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Measures
          </CardTitle>
          <CardDescription>
            Technical and organizational measures to protect personal data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securityMeasures.map((measure, index) => {
              const Icon = measure.icon;
              return (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{measure.title}</h4>
                    <p className="text-sm text-muted-foreground">{measure.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sub-processors */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Authorized Sub-processors
          </CardTitle>
          <CardDescription>
            Third-party services that may process personal data on our behalf
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-1">Supabase</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Database and authentication services
                </p>
                <Badge variant="secondary" className="text-xs">USA</Badge>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-1">OpenAI / Anthropic</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  AI language model services
                </p>
                <Badge variant="secondary" className="text-xs">USA</Badge>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-1">Google Analytics</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Website analytics (anonymized)
                </p>
                <Badge variant="secondary" className="text-xs">USA</Badge>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-1">Sentry</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Error tracking and monitoring
                </p>
                <Badge variant="secondary" className="text-xs">USA</Badge>
              </div>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                All sub-processors are bound by data processing agreements and must comply with GDPR. 
                We will notify you of any changes to our sub-processors with 30 days notice.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Data Subject Rights */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Supporting Data Subject Rights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We will assist you in fulfilling your obligations to respond to data subject requests:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Access Requests</p>
                <p className="text-xs text-muted-foreground">
                  Export user data within 30 days
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Rectification</p>
                <p className="text-xs text-muted-foreground">
                  Update incorrect personal data
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Erasure</p>
                <p className="text-xs text-muted-foreground">
                  Delete data upon request
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Portability</p>
                <p className="text-xs text-muted-foreground">
                  Provide data in machine-readable format
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Breach Procedures */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Data Breach Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            In the event of a personal data breach, we will:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium">Notify without undue delay</p>
                <p className="text-sm text-muted-foreground">
                  Maximum 24 hours after becoming aware of the breach
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium">Provide detailed information</p>
                <p className="text-sm text-muted-foreground">
                  Nature of breach, data categories, affected individuals, likely consequences
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium">Assist with mitigation</p>
                <p className="text-sm text-muted-foreground">
                  Implement measures to address the breach and prevent recurrence
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* International Transfers */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            International Data Transfers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            When transferring personal data outside the EEA, we ensure appropriate safeguards:
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Scale className="h-4 w-4 text-primary mt-0.5" />
              <p className="text-sm">
                <strong>Standard Contractual Clauses (SCCs)</strong> - EU-approved contracts for data transfers
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-primary mt-0.5" />
              <p className="text-sm">
                <strong>Supplementary Measures</strong> - Additional technical protections where required
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
              <p className="text-sm">
                <strong>Adequacy Decisions</strong> - Transfers to countries with adequate protection levels
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Data Protection Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            For questions about this DPA or our data processing practices:
          </p>
          <div className="space-y-2">
            <p>
              <strong>Data Protection Officer:</strong>{' '}
              <a href="mailto:dpo@mydub.ai" className="text-primary hover:underline">
                dpo@mydub.ai
              </a>
            </p>
            <p>
              <strong>Legal Department:</strong>{' '}
              <a href="mailto:legal@mydub.ai" className="text-primary hover:underline">
                legal@mydub.ai
              </a>
            </p>
            <p>
              <strong>Emergency Breach Hotline:</strong> +971 4 123 4567 (24/7)
            </p>
          </div>
          <Button 
            variant="outline" 
            className="mt-4 w-full"
            onClick={() => window.location.href = '/dashboard/compliance'}
          >
            View Compliance Dashboard
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default DataProcessingAgreementPage;