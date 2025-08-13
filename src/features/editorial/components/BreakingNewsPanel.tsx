/**
 * Breaking News Panel - Manage breaking news alerts
 * Real-time creation and management of breaking news alerts
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { AlertTriangle, Clock, Eye, EyeOff, Plus, Zap, Users, TrendingUp } from 'lucide-react';
import { useBreakingNews, useCreateBreakingNews, useDeactivateBreakingNews } from '../hooks/useEditorialWorkflow';
import { toast } from '@/shared/hooks/use-toast';
import type { CreateBreakingNewsForm, AlertLevel } from '../types/editorial.types';

export function BreakingNewsPanel() {
  const { data: breakingNewsAlerts, isLoading } = useBreakingNews();
  const createBreakingNews = useCreateBreakingNews();
  const deactivateBreakingNews = useDeactivateBreakingNews();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState<CreateBreakingNewsForm>({
    title: '',
    content: '',
    alert_level: 'medium',
  });

  const handleCreateAlert = async () => {
    if (!newAlert.title.trim() || !newAlert.content.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createBreakingNews.mutateAsync(newAlert);
      toast({
        title: 'Breaking News Alert Created',
        description: 'Alert has been sent to all subscribers',
      });
      setIsCreateDialogOpen(false);
      setNewAlert({
        title: '',
        content: '',
        alert_level: 'medium',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create breaking news alert',
        variant: 'destructive',
      });
    }
  };

  const handleDeactivateAlert = async (id: string) => {
    try {
      await deactivateBreakingNews.mutateAsync(id);
      toast({
        title: 'Alert Deactivated',
        description: 'Breaking news alert has been deactivated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate alert',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  const activeAlerts = breakingNewsAlerts?.filter(alert => alert.is_active) || [];
  const inactiveAlerts = breakingNewsAlerts?.filter(alert => !alert.is_active) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Zap className="h-6 w-6 mr-2 text-red-600" />
            Breaking News Management
          </h2>
          <p className="text-gray-600 mt-1">Create and manage breaking news alerts</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Breaking News
            </Button>
          </DialogTrigger>
          <CreateBreakingNewsDialog 
            newAlert={newAlert}
            setNewAlert={setNewAlert}
            onSubmit={handleCreateAlert}
            isSubmitting={createBreakingNews.isPending}
          />
        </Dialog>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2 text-red-600" />
            Active Breaking News ({activeAlerts.length})
          </CardTitle>
          <CardDescription>Currently live alerts being shown to users</CardDescription>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No active breaking news alerts</p>
              <p className="text-sm text-gray-400 mt-1">Create one to notify users of urgent news</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <BreakingNewsCard 
                  key={alert.id} 
                  alert={alert} 
                  onDeactivate={handleDeactivateAlert}
                  isDeactivating={deactivateBreakingNews.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Alerts History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <EyeOff className="h-5 w-5 mr-2 text-gray-600" />
            Recent Alerts History ({inactiveAlerts.length})
          </CardTitle>
          <CardDescription>Previously sent breaking news alerts</CardDescription>
        </CardHeader>
        <CardContent>
          {inactiveAlerts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No previous alerts</p>
          ) : (
            <div className="space-y-3">
              {inactiveAlerts.slice(0, 10).map((alert) => (
                <div key={alert.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{alert.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{alert.content}</p>
                      <div className="flex items-center space-x-4 mt-3">
                        <AlertLevelBadge level={alert.alert_level} />
                        <span className="text-xs text-gray-500">
                          Sent {new Date(alert.sent_at).toLocaleString()}
                        </span>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Users className="h-3 w-3" />
                          <span>{alert.recipient_count} recipients</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <TrendingUp className="h-3 w-3" />
                          <span>{alert.click_count} clicks</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BreakingNewsCard({ 
  alert, 
  onDeactivate, 
  isDeactivating 
}: { 
  alert: any; 
  onDeactivate: (id: string) => void; 
  isDeactivating: boolean;
}) {
  const timeElapsed = Math.floor((Date.now() - new Date(alert.sent_at).getTime()) / (1000 * 60));
  
  return (
    <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <AlertLevelBadge level={alert.alert_level} />
            <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
              LIVE
            </Badge>
            <span className="text-xs text-red-600 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {timeElapsed < 60 ? `${timeElapsed}m ago` : `${Math.floor(timeElapsed / 60)}h ago`}
            </span>
          </div>
          
          <h4 className="font-semibold text-red-900 text-lg mb-2">{alert.title}</h4>
          <p className="text-red-800 mb-3">{alert.content}</p>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2 text-red-700">
              <Users className="h-4 w-4" />
              <span>{alert.recipient_count} notified</span>
            </div>
            <div className="flex items-center space-x-2 text-red-700">
              <TrendingUp className="h-4 w-4" />
              <span>{alert.click_count} clicks</span>
            </div>
            {alert.expires_at && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Expires {new Date(alert.expires_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onDeactivate(alert.id)}
          disabled={isDeactivating}
          className="ml-4"
        >
          <EyeOff className="h-4 w-4 mr-2" />
          Deactivate
        </Button>
      </div>
    </div>
  );
}

function CreateBreakingNewsDialog({ 
  newAlert, 
  setNewAlert, 
  onSubmit, 
  isSubmitting 
}: {
  newAlert: CreateBreakingNewsForm;
  setNewAlert: (alert: CreateBreakingNewsForm) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2 text-red-600" />
          Create Breaking News Alert
        </DialogTitle>
        <DialogDescription>
          Send an urgent notification to all subscribers. Use sparingly for truly breaking news.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="title">Alert Title *</Label>
          <Input
            id="title"
            placeholder="BREAKING: Dubai announces new..."
            value={newAlert.title}
            onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
            className="font-medium"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="content">Alert Content *</Label>
          <Textarea
            id="content"
            placeholder="Brief description of the breaking news..."
            value={newAlert.content}
            onChange={(e) => setNewAlert({ ...newAlert, content: e.target.value })}
            rows={3}
          />
          <p className="text-xs text-gray-500">Keep it concise - this will appear in push notifications</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="alert_level">Alert Level</Label>
            <Select 
              value={newAlert.alert_level} 
              onValueChange={(value: AlertLevel) => setNewAlert({ ...newAlert, alert_level: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select alert level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - General news</SelectItem>
                <SelectItem value="medium">Medium - Important news</SelectItem>
                <SelectItem value="high">High - Urgent news</SelectItem>
                <SelectItem value="critical">Critical - Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expires_at">Expires At (Optional)</Label>
            <Input
              id="expires_at"
              type="datetime-local"
              value={newAlert.expires_at || ''}
              onChange={(e) => setNewAlert({ ...newAlert, expires_at: e.target.value || undefined })}
            />
          </div>
        </div>
        
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Breaking News Guidelines</p>
              <ul className="text-yellow-700 mt-1 list-disc list-inside space-y-1">
                <li>Only use for truly urgent, developing news</li>
                <li>Keep titles under 60 characters for mobile notifications</li>
                <li>Verify all information before sending</li>
                <li>Consider the time of day and user experience</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={() => setNewAlert({ title: '', content: '', alert_level: 'medium' })}>
          Clear
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitting || !newAlert.title.trim() || !newAlert.content.trim()}
          className="bg-red-600 hover:bg-red-700"
        >
          {isSubmitting ? 'Sending...' : 'Send Breaking News Alert'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function AlertLevelBadge({ level }: { level: string }) {
  const levelConfig = {
    low: { label: 'Low', color: 'bg-blue-100 text-blue-800' },
    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
    critical: { label: 'Critical', color: 'bg-red-100 text-red-800' }
  };

  const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.medium;

  return (
    <Badge className={`text-xs ${config.color}`}>
      {config.label}
    </Badge>
  );
}