import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  Settings, 
  AlertTriangle,
  Check,
  Clock,
  FileText,
  Bell,
  Lock,
  Globe,
  Camera,
  MessageCircle
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Separator } from '@/shared/components/ui/separator';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/hooks/use-toast';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';

import { GDPRService } from '../services/gdpr.service';
import { useSession } from '@/features/auth/hooks/useSession';
import { PrivacySettings, DataSubjectRequest, DataExportRequest, UserConsent } from '../types';

export function PrivacyCenter() {
  const { t } = useTranslation();
  const { user } = useSession();
  const { toast } = useToast();

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [dataRequests, setDataRequests] = useState<DataSubjectRequest[]>([]);
  const [exportRequests, setExportRequests] = useState<DataExportRequest[]>([]);
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Dialog states
  const [showDataExportDialog, setShowDataExportDialog] = useState(false);
  const [showDataDeletionDialog, setShowDataDeletionDialog] = useState(false);
  const [showDataRequestDialog, setShowDataRequestDialog] = useState(false);

  // Form states
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [requestType, setRequestType] = useState<DataSubjectRequest['request_type']>('access');
  const [requestDescription, setRequestDescription] = useState('');

  useEffect(() => {
    if (user) {
      loadPrivacyData();
    }
  }, [user]);

  const loadPrivacyData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [settings, requests, exports, userConsents] = await Promise.all([
        GDPRService.getPrivacySettings(user.id),
        GDPRService.getUserDataSubjectRequests(user.id),
        // GDPRService.getUserDataExportRequests(user.id), // We'll need to implement this
        Promise.resolve([]), // Placeholder
        GDPRService.getUserConsents(user.id)
      ]);

      setPrivacySettings(settings);
      setDataRequests(requests);
      setExportRequests(exports);
      setConsents(userConsents);
    } catch (error) {
      console.error('Failed to load privacy data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load privacy settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacySetting = async (setting: string, value: any) => {
    if (!user || !privacySettings) return;

    try {
      setUpdating(true);
      const updatedSettings = await GDPRService.updatePrivacySettings(user.id, {
        ...privacySettings,
        [setting]: value
      });
      setPrivacySettings(updatedSettings);
      toast({
        title: 'Success',
        description: 'Privacy setting updated successfully'
      });
    } catch (error) {
      console.error('Failed to update privacy setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to update privacy setting',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const updateCookieConsent = async (category: keyof PrivacySettings['cookie_consent'], value: boolean) => {
    if (!privacySettings) return;

    const updatedConsent = {
      ...privacySettings.cookie_consent,
      [category]: value
    };

    await updatePrivacySetting('cookie_consent', updatedConsent);
  };

  const handleDataExport = async () => {
    if (!user) return;

    try {
      setUpdating(true);
      await GDPRService.requestDataExport(user.id, exportFormat);
      toast({
        title: 'Export Requested',
        description: 'Your data export request has been submitted. You will receive an email when it\'s ready.'
      });
      setShowDataExportDialog(false);
      await loadPrivacyData();
    } catch (error) {
      console.error('Failed to request data export:', error);
      toast({
        title: 'Error',
        description: 'Failed to request data export',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDataDeletion = async () => {
    if (!user) return;

    try {
      setUpdating(true);
      await GDPRService.deleteUserData(user.id);
      toast({
        title: 'Account Deletion Requested',
        description: 'Your account deletion request has been submitted. This action cannot be undone.'
      });
      setShowDataDeletionDialog(false);
      // Redirect to logout or home page
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to process deletion request',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDataRequest = async () => {
    if (!user || !requestDescription.trim()) return;

    try {
      setUpdating(true);
      await GDPRService.submitDataSubjectRequest(user.id, requestType, requestDescription);
      toast({
        title: 'Request Submitted',
        description: 'Your data subject request has been submitted successfully.'
      });
      setShowDataRequestDialog(false);
      setRequestDescription('');
      await loadPrivacyData();
    } catch (error) {
      console.error('Failed to submit data request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit data request',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      in_progress: 'outline',
      completed: 'default',
      rejected: 'destructive',
      processing: 'outline',
      failed: 'destructive'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Privacy Center</h1>
        <p className="text-muted-foreground">
          Manage your privacy settings and data rights
        </p>
      </div>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>
            Control how your data is used and shared
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {privacySettings && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Data Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow sharing anonymized data for research and improvement
                  </p>
                </div>
                <Switch
                  checked={privacySettings.data_sharing_enabled}
                  onCheckedChange={(checked) => updatePrivacySetting('data_sharing_enabled', checked)}
                  disabled={updating}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive promotional emails and updates
                  </p>
                </div>
                <Switch
                  checked={privacySettings.marketing_emails_enabled}
                  onCheckedChange={(checked) => updatePrivacySetting('marketing_emails_enabled', checked)}
                  disabled={updating}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Analytics Tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Help us improve the app with usage analytics
                  </p>
                </div>
                <Switch
                  checked={privacySettings.analytics_tracking_enabled}
                  onCheckedChange={(checked) => updatePrivacySetting('analytics_tracking_enabled', checked)}
                  disabled={updating}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Profile Visibility</Label>
                <Select
                  value={privacySettings.profile_visibility}
                  onValueChange={(value) => updatePrivacySetting('profile_visibility', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Public
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Private
                      </div>
                    </SelectItem>
                    <SelectItem value="friends_only">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Friends Only
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Data Retention Period</Label>
                <Select
                  value={privacySettings.data_retention_period}
                  onValueChange={(value) => updatePrivacySetting('data_retention_period', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_year">1 Year</SelectItem>
                    <SelectItem value="2_years">2 Years</SelectItem>
                    <SelectItem value="5_years">5 Years</SelectItem>
                    <SelectItem value="indefinite">Indefinite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cookie Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Cookie Preferences
          </CardTitle>
          <CardDescription>
            Manage your cookie consent preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {privacySettings?.cookie_consent && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Necessary Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    Required for basic functionality
                  </p>
                </div>
                <Switch checked={true} disabled />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Analytics Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    Help us understand how you use the app
                  </p>
                </div>
                <Switch
                  checked={privacySettings.cookie_consent.analytics}
                  onCheckedChange={(checked) => updateCookieConsent('analytics', checked)}
                  disabled={updating}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    Used for targeted advertising
                  </p>
                </div>
                <Switch
                  checked={privacySettings.cookie_consent.marketing}
                  onCheckedChange={(checked) => updateCookieConsent('marketing', checked)}
                  disabled={updating}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Preference Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    Remember your preferences and settings
                  </p>
                </div>
                <Switch
                  checked={privacySettings.cookie_consent.preferences}
                  onCheckedChange={(checked) => updateCookieConsent('preferences', checked)}
                  disabled={updating}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Rights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Data Rights
          </CardTitle>
          <CardDescription>
            Exercise your rights under GDPR and other privacy laws
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Data Export */}
            <Dialog open={showDataExportDialog} onOpenChange={setShowDataExportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <Download className="h-6 w-6" />
                  <span className="font-medium">Export Data</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Download a copy of your personal data
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Your Data</DialogTitle>
                  <DialogDescription>
                    Choose the format for your data export. We'll email you when it's ready.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Export Format</Label>
                    <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON (Recommended)</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDataExportDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleDataExport} disabled={updating}>
                    {updating ? 'Requesting...' : 'Request Export'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Data Request */}
            <Dialog open={showDataRequestDialog} onOpenChange={setShowDataRequestDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <Eye className="h-6 w-6" />
                  <span className="font-medium">Data Request</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Request access, correction, or restriction
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Data Request</DialogTitle>
                  <DialogDescription>
                    Submit a request regarding your personal data
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Request Type</Label>
                    <Select value={requestType} onValueChange={(value: any) => setRequestType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="access">Access my data</SelectItem>
                        <SelectItem value="rectification">Correct my data</SelectItem>
                        <SelectItem value="restriction">Restrict processing</SelectItem>
                        <SelectItem value="objection">Object to processing</SelectItem>
                        <SelectItem value="portability">Data portability</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={requestDescription}
                      onChange={(e) => setRequestDescription(e.target.value)}
                      placeholder="Please describe your request in detail..."
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDataRequestDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleDataRequest} disabled={!requestDescription.trim() || updating}>
                    {updating ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Account Deletion */}
            <Dialog open={showDataDeletionDialog} onOpenChange={setShowDataDeletionDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  <Trash2 className="h-6 w-6" />
                  <span className="font-medium">Delete Account</span>
                  <span className="text-xs text-center">
                    Permanently delete your account and data
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-destructive">Delete Your Account</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                  </DialogDescription>
                </DialogHeader>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> Account deletion is permanent and irreversible. All your data, including profile information, content, and interactions, will be permanently removed.
                  </AlertDescription>
                </Alert>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDataDeletionDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDataDeletion} disabled={updating}>
                    {updating ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Recent Requests */}
      {(dataRequests.length > 0 || exportRequests.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Requests
            </CardTitle>
            <CardDescription>
              Track the status of your data requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dataRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{request.request_type.replace('_', ' ')}</p>
                    <p className="text-sm text-muted-foreground">{request.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested on {new Date(request.request_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    {request.status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground" />}
                    {request.status === 'completed' && <Check className="h-4 w-4 text-green-600" />}
                  </div>
                </div>
              ))}

              {exportRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">Data Export ({request.export_format.toUpperCase()})</p>
                    <p className="text-sm text-muted-foreground">
                      Categories: {request.data_categories.join(', ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested on {new Date(request.request_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    {request.status === 'completed' && request.download_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={request.download_url} download>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consent History */}
      {consents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Consent History
            </CardTitle>
            <CardDescription>
              View your consent history for different data processing activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {consents.slice(0, 5).map((consent) => (
                <div key={consent.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{consent.consent_type.replace('_', ' ')}</p>
                    <p className="text-sm text-muted-foreground">
                      Document version: {consent.document_version}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {consent.consent_given ? 'Granted' : 'Withdrawn'} on{' '}
                      {new Date(consent.consent_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {consent.consent_given ? (
                      <Badge variant="default">
                        <Check className="h-3 w-3 mr-1" />
                        Granted
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Withdrawn
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PrivacyCenter;