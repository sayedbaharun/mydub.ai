import React, { useState } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Settings, 
  HardDrive,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Separator } from '@/shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Input } from '@/shared/components/ui/input';
import { 
  useOffline, 
  useOfflineSettings, 
  useOfflineBackup,
  useOfflineArticles 
} from '@/shared/hooks/useOffline';
import { formatDistanceToNow } from 'date-fns';

interface OfflineDataManagerProps {
  className?: string;
}

export function OfflineDataManager({ className = '' }: OfflineDataManagerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'data'>('overview');
  
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Offline Data Manager
          </h2>
          <p className="text-muted-foreground">
            Manage your offline data storage and synchronization
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SettingsTab />
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <DataManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab() {
  const { isOnline, syncStats, hasPendingSync, hasFailedSync, forceSync } = useOffline();

  const getSyncProgress = () => {
    if (syncStats.totalItems === 0) return 100;
    return (syncStats.syncedItems / syncStats.totalItems) * 100;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Badge 
              variant={isOnline ? 'default' : 'destructive'}
              className="w-full justify-center"
            >
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            
            {isOnline && hasPendingSync && (
              <Button
                variant="outline"
                size="sm"
                onClick={forceSync}
                className="w-full"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Sync Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Synced Items</span>
              <span>{syncStats.syncedItems}/{syncStats.totalItems}</span>
            </div>
            
            <Progress value={getSyncProgress()} />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pending: {syncStats.pendingSync}</span>
              <span>Failed: {syncStats.failedSync}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-2xl font-bold">
              {syncStats.totalItems}
            </div>
            <div className="text-sm text-muted-foreground">
              Items stored offline
            </div>
            
            {syncStats.queueSize > 0 && (
              <Badge variant="outline">
                {syncStats.queueSize} in queue
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {(hasFailedSync || syncStats.queueSize > 10) && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hasFailedSync && (
                <div className="text-sm text-red-600">
                  Some items failed to sync. Check your internet connection and try again.
                </div>
              )}
              
              {syncStats.queueSize > 10 && (
                <div className="text-sm text-orange-600">
                  Large sync queue detected ({syncStats.queueSize} items). 
                  Consider syncing soon to avoid data loss.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SettingsTab() {
  const { settings, updateSettings } = useOfflineSettings();

  if (!settings) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Storage Settings</CardTitle>
          <CardDescription>
            Configure how offline data is stored and managed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-sync when online</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically sync data when connection is restored
                </div>
              </div>
              <Switch
                checked={settings.syncOnConnection}
                onCheckedChange={(checked) => 
                  updateSettings({ syncOnConnection: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable compression</Label>
                <div className="text-sm text-muted-foreground">
                  Compress data to save storage space
                </div>
              </div>
              <Switch
                checked={settings.enableCompression}
                onCheckedChange={(checked) => 
                  updateSettings({ enableCompression: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Priority sync</Label>
                <div className="text-sm text-muted-foreground">
                  Sync high-priority items first
                </div>
              </div>
              <Switch
                checked={settings.prioritySync}
                onCheckedChange={(checked) => 
                  updateSettings({ prioritySync: checked })
                }
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max-cache-size">
                Maximum cache size (MB)
              </Label>
              <Input
                id="max-cache-size"
                type="number"
                value={settings.maxCacheSize}
                onChange={(e) => 
                  updateSettings({ maxCacheSize: parseInt(e.target.value) })
                }
                min="10"
                max="1000"
              />
              <div className="text-sm text-muted-foreground">
                Maximum amount of storage to use for offline data
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-age">
                Data retention (hours)
              </Label>
              <Input
                id="max-age"
                type="number"
                value={settings.maxAge}
                onChange={(e) => 
                  updateSettings({ maxAge: parseInt(e.target.value) })
                }
                min="1"
                max="168"
              />
              <div className="text-sm text-muted-foreground">
                How long to keep offline data before cleanup
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DataManagementTab() {
  const { getAllArticles } = useOfflineArticles();
  const { exportData, importData } = useOfflineBackup();
  const { clearAllData } = useOffline();
  
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const offlineArticles = await getAllArticles();
      setArticles(offlineArticles);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadArticles();
  }, []);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importData(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export, import, or clear your offline data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            
            <div>
              <Input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
                id="import-file"
              />
              <Label htmlFor="import-file" asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
              </Label>
            </div>
            
            <Button 
              variant="destructive" 
              onClick={clearAllData}
              className="ml-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Offline Articles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Offline Articles</CardTitle>
              <CardDescription>
                Articles saved for offline reading
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadArticles}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No offline articles found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.slice(0, 10).map((article, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {article.title || 'Untitled Article'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Saved {formatDistanceToNow(new Date(article.created_at || Date.now()), { addSuffix: true })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {article.category || 'General'}
                    </Badge>
                    
                    {article.synced ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                </div>
              ))}
              
              {articles.length > 10 && (
                <div className="text-center text-sm text-muted-foreground">
                  +{articles.length - 10} more articles
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default OfflineDataManager;