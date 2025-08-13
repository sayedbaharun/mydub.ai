import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/shared/lib/supabase';
import { format } from 'date-fns';

interface ExportData {
  profile: any;
  preferences: any;
  favorites: any;
  searchHistory: any;
  chatSessions: any;
  notifications: any;
  feedback: any;
}

export function DataExport() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchUserData = async (): Promise<ExportData> => {
    if (!user?.id) throw new Error('User not authenticated');

    // Fetch all user data in parallel
    const [
      profileData,
      preferencesData,
      favoritesData,
      searchHistoryData,
      chatSessionsData,
      notificationsData,
      feedbackData
    ] = await Promise.all([
      // Profile data
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),

      // User preferences
      supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single(),

      // Favorites
      supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id),

      // Search history
      supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000),

      // Chat sessions with messages
      supabase
        .from('chat_sessions')
        .select(`
          *,
          chat_messages (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      // Notifications
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000),

      // Feedback
      supabase
        .from('feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ]);

    return {
      profile: profileData.data,
      preferences: preferencesData.data,
      favorites: favoritesData.data || [],
      searchHistory: searchHistoryData.data || [],
      chatSessions: chatSessionsData.data || [],
      notifications: notificationsData.data || [],
      feedback: feedbackData.data || []
    };
  };

  const generateExportFile = (data: ExportData): string => {
    const exportDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    
    const exportContent = {
      exportInfo: {
        exportDate,
        userId: user?.id,
        email: user?.email,
        appName: 'MyDub.AI',
        dataRetentionPolicy: 'Data is retained as per our Privacy Policy'
      },
      userData: {
        profile: {
          ...data.profile,
          email: user?.email,
          createdAt: user?.createdAt
        },
        preferences: data.preferences,
        favorites: data.favorites.map((fav: any) => ({
          contentType: fav.content_type,
          contentId: fav.content_id,
          createdAt: fav.created_at
        })),
        searchHistory: data.searchHistory.map((search: any) => ({
          query: search.query,
          resultsCount: search.results_count,
          clickedResult: search.clicked_result,
          createdAt: search.created_at
        })),
        chatSessions: data.chatSessions.map((session: any) => ({
          sessionId: session.id,
          title: session.title,
          persona: session.persona_id,
          messages: session.chat_messages?.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            createdAt: msg.created_at
          })) || [],
          createdAt: session.created_at
        })),
        notifications: data.notifications.map((notif: any) => ({
          title: notif.title,
          message: notif.message,
          type: notif.type,
          isRead: notif.is_read,
          createdAt: notif.created_at
        })),
        feedback: data.feedback.map((fb: any) => ({
          type: fb.type,
          subject: fb.subject,
          message: fb.message,
          status: fb.status,
          createdAt: fb.created_at
        }))
      }
    };

    return JSON.stringify(exportContent, null, 2);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportData = async () => {
    if (!user) return;

    setIsExporting(true);
    setExportStatus('idle');
    setErrorMessage('');

    try {
      // Fetch all user data
      const userData = await fetchUserData();

      // Generate export file
      const exportContent = generateExportFile(userData);

      // Download the file
      const filename = `mydubai_data_export_${format(new Date(), 'yyyy-MM-dd')}.json`;
      downloadFile(exportContent, filename);

      setExportStatus('success');
    } catch (error) {
      console.error('Data export error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to export data');
      setExportStatus('error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t('dataExport.title')}
        </CardTitle>
        <CardDescription>
          {t('dataExport.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t('dataExport.includes')}</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• {t('dataExport.includesProfile')}</li>
            <li>• {t('dataExport.includesPreferences')}</li>
            <li>• {t('dataExport.includesFavorites')}</li>
            <li>• {t('dataExport.includesSearchHistory')}</li>
            <li>• {t('dataExport.includesChats')}</li>
            <li>• {t('dataExport.includesNotifications')}</li>
            <li>• {t('dataExport.includesFeedback')}</li>
          </ul>
        </div>

        {exportStatus === 'success' && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              {t('dataExport.success')}
            </AlertDescription>
          </Alert>
        )}

        {exportStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage || t('dataExport.error')}
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleExportData}
          disabled={isExporting || !user}
          className="w-full"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('dataExport.exporting')}
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              {t('dataExport.exportButton')}
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          {t('dataExport.note')}
        </p>
      </CardContent>
    </Card>
  );
}

// Account deletion component
export function AccountDeletion() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDeleteAccount = async () => {
    if (!user || confirmText !== 'DELETE') return;

    setIsDeleting(true);

    try {
      // Call Supabase Edge Function to handle account deletion
      const { error } = await supabase.functions.invoke('delete-user-account', {
        body: { userId: user.id }
      });

      if (error) throw error;

      // Sign out the user
      await signOut();

      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Account deletion error:', error);
      // Show error message
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">
          {t('accountDeletion.title')}
        </CardTitle>
        <CardDescription>
          {t('accountDeletion.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('accountDeletion.warning')}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t('accountDeletion.consequences')}</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• {t('accountDeletion.consequenceData')}</li>
            <li>• {t('accountDeletion.consequenceAccess')}</li>
            <li>• {t('accountDeletion.consequenceContent')}</li>
            <li>• {t('accountDeletion.consequenceReversible')}</li>
          </ul>
        </div>

        {!showConfirmation ? (
          <Button
            variant="destructive"
            onClick={() => setShowConfirmation(true)}
            className="w-full"
          >
            {t('accountDeletion.deleteButton')}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="confirm-delete" className="text-sm font-medium">
                {t('accountDeletion.confirmPrompt')}
              </label>
              <input
                id="confirm-delete"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmation(false);
                  setConfirmText('');
                }}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={confirmText !== 'DELETE' || isDeleting}
                className="flex-1"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('accountDeletion.deleting')}
                  </>
                ) : (
                  t('accountDeletion.confirmDelete')
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}