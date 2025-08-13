import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Edit, 
  Save, 
  X, 
  Globe,
  Calendar,
  CheckCircle,
  AlertTriangle,
  History,
  Upload,
  Download,
  Eye,
  Copy
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { useToast } from '@/shared/hooks/use-toast';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';

import { GDPRService } from '../services/gdpr.service';
import { LegalDocument } from '../types';

const documentTypes = [
  { value: 'privacy_policy', label: 'Privacy Policy', icon: FileText },
  { value: 'terms_of_service', label: 'Terms of Service', icon: FileText },
  { value: 'cookie_policy', label: 'Cookie Policy', icon: FileText },
  { value: 'data_processing_agreement', label: 'Data Processing Agreement', icon: FileText }
];

const languages = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'ar', label: 'Arabic', flag: '🇦🇪' },
  { value: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { value: 'ur', label: 'Urdu', flag: '🇵🇰' }
];

export function LegalDocumentManager() {
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<LegalDocument['type']>('privacy_policy');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  
  // Edit/Create dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Partial<LegalDocument> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'privacy_policy' as LegalDocument['type'],
    version: '',
    content: '',
    language: 'en',
    effective_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadDocuments();
  }, [selectedType, selectedLanguage]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      // This would need to be implemented in the GDPR service
      // For now, we'll simulate with the active document
      const activeDoc = await GDPRService.getActiveLegalDocument(selectedType, selectedLanguage);
      if (activeDoc) {
        setDocuments([activeDoc]);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load legal documents',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingDocument(null);
    setFormData({
      type: selectedType,
      version: '',
      content: '',
      language: selectedLanguage,
      effective_date: new Date().toISOString().split('T')[0]
    });
    setShowEditDialog(true);
  };

  const handleEdit = (document: LegalDocument) => {
    setIsCreating(false);
    setEditingDocument(document);
    setFormData({
      type: document.type,
      version: document.version,
      content: document.content,
      language: document.language,
      effective_date: new Date(document.effective_date).toISOString().split('T')[0]
    });
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!formData.version || !formData.content) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      
      const documentData: Omit<LegalDocument, 'id' | 'created_at' | 'updated_at'> = {
        type: formData.type,
        version: formData.version,
        content: formData.content,
        effective_date: new Date(formData.effective_date),
        is_active: true,
        language: formData.language
      };

      await GDPRService.createLegalDocument(documentData);
      
      toast({
        title: 'Success',
        description: `${isCreating ? 'Created' : 'Updated'} ${formData.type.replace('_', ' ')} successfully`
      });
      
      setShowEditDialog(false);
      await loadDocuments();
      
      // Log the update
      await GDPRService.logComplianceEvent(
        'policy_updated',
        undefined,
        {
          document_type: formData.type,
          version: formData.version,
          language: formData.language
        }
      );
    } catch (error) {
      console.error('Failed to save document:', error);
      toast({
        title: 'Error',
        description: 'Failed to save document',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImportTemplate = () => {
    // Load a template based on document type
    const templates = {
      privacy_policy: `PRIVACY POLICY

Last Updated: ${new Date().toLocaleDateString()}

1. INTRODUCTION
We respect your privacy and are committed to protecting your personal data...

2. INFORMATION WE COLLECT
- Personal identification information
- Usage data
- Device information...

3. HOW WE USE YOUR INFORMATION
We use the information we collect to...

4. DATA PROTECTION
We implement appropriate security measures...

5. YOUR RIGHTS
Under GDPR, you have the following rights...

6. CONTACT US
If you have any questions about this Privacy Policy...`,
      
      terms_of_service: `TERMS OF SERVICE

Last Updated: ${new Date().toLocaleDateString()}

1. ACCEPTANCE OF TERMS
By accessing and using this service...

2. USE LICENSE
Permission is granted to...

3. PROHIBITED USES
You may not use our service to...

4. TERMINATION
We may terminate or suspend...

5. GOVERNING LAW
These terms shall be governed by...`,
      
      cookie_policy: `COOKIE POLICY

Last Updated: ${new Date().toLocaleDateString()}

1. WHAT ARE COOKIES
Cookies are small text files...

2. HOW WE USE COOKIES
We use cookies to...

3. TYPES OF COOKIES
- Necessary cookies
- Analytics cookies
- Marketing cookies...

4. MANAGING COOKIES
You can control cookies through...

5. CONTACT US
For questions about our cookie policy...`,
      
      data_processing_agreement: `DATA PROCESSING AGREEMENT

Last Updated: ${new Date().toLocaleDateString()}

1. DEFINITIONS
"Personal Data" means...

2. PROCESSING OF PERSONAL DATA
The Processor shall...

3. SECURITY MEASURES
The Processor shall implement...

4. SUB-PROCESSORS
The Processor may engage...

5. DATA BREACH
In case of a personal data breach...`
    };

    setFormData(prev => ({
      ...prev,
      content: templates[formData.type as keyof typeof templates] || ''
    }));

    toast({
      title: 'Template Loaded',
      description: 'A template has been loaded. Please customize it for your needs.'
    });
  };

  const downloadDocument = (document: LegalDocument) => {
    const blob = new Blob([document.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${document.type}-v${document.version}-${document.language}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied',
      description: 'Document content copied to clipboard'
    });
  };

  if (loading && documents.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Legal Document Management</h2>
          <p className="text-muted-foreground">
            Create and manage legal documents with version control
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Document
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Document Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Document Type</Label>
              <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        {lang.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="grid gap-4">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Documents Found</h3>
              <p className="text-muted-foreground mb-4">
                No {selectedType.replace('_', ' ')} found for {selectedLanguage.toUpperCase()}.
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Version
              </Button>
            </CardContent>
          </Card>
        ) : (
          documents.map(document => (
            <Card key={document.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {document.type.replace('_', ' ').split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                      <Badge>v{document.version}</Badge>
                      {document.is_active && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {languages.find(l => l.value === document.language)?.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Effective: {new Date(document.effective_date).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(document)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(document.content)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(document)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4">
                  <pre className="text-sm whitespace-pre-wrap font-mono line-clamp-6">
                    {document.content}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Create New' : 'Edit'} {formData.type.replace('_', ' ')}
            </DialogTitle>
            <DialogDescription>
              {isCreating 
                ? 'Create a new version of this legal document.'
                : 'Edit this legal document. A new version will be created.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Document Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                  disabled={!isCreating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Language</Label>
                <Select 
                  value={formData.language} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                  disabled={!isCreating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          {lang.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Version</Label>
                <Input
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="e.g., 2.0"
                />
              </div>
              <div>
                <Label>Effective Date</Label>
                <Input
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, effective_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Document Content</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportTemplate}
                  type="button"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Load Template
                </Button>
              </div>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter the full document content..."
                className="min-h-[400px] font-mono text-sm"
              />
            </div>

            {!isCreating && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Saving will create a new version and make it active. The previous version will be archived.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LegalDocumentManager;