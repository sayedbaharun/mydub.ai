import React, { useState } from 'react';
import { Bell, BellOff, Settings, X, Check, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Separator } from '@/shared/components/ui/separator';
import { useNotifications } from '@/shared/hooks/usePWA';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const {
    notificationPermission,
    queuedCount,
    requestPermission,
    processQueue,
    clearQueue
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    newsUpdates: true,
    weatherAlerts: true,
    trafficUpdates: true,
    governmentNotices: true,
    touristAlerts: true,
    appUpdates: true
  });

  const handlePermissionRequest = async () => {
    const permission = await requestPermission();
    if (permission === 'granted' && queuedCount > 0) {
      await processQueue();
    }
  };

  const getPermissionStatus = () => {
    switch (notificationPermission) {
      case 'granted':
        return { icon: CheckCircle, text: 'Enabled', color: 'text-green-600' };
      case 'denied':
        return { icon: X, text: 'Blocked', color: 'text-red-600' };
      default:
        return { icon: AlertCircle, text: 'Not set', color: 'text-yellow-600' };
    }
  };

  const status = getPermissionStatus();
  const StatusIcon = status.icon;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${className}`}>
          {notificationPermission === 'granted' ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
          
          {queuedCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {queuedCount > 9 ? '9+' : queuedCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Notifications</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-4 w-4 ${status.color}`} />
                <span className="text-sm">Status: {status.text}</span>
              </div>
              
              {notificationPermission !== 'granted' && (
                <Button size="sm" onClick={handlePermissionRequest}>
                  Enable
                </Button>
              )}
            </div>

            {queuedCount > 0 && (
              <NotificationQueue 
                count={queuedCount}
                onProcess={processQueue}
                onClear={clearQueue}
              />
            )}

            <Separator />

            <NotificationSettings 
              settings={settings}
              onSettingsChange={setSettings}
              disabled={notificationPermission !== 'granted'}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface NotificationQueueProps {
  count: number;
  onProcess: () => void;
  onClear: () => void;
}

function NotificationQueue({ count, onProcess, onClear }: NotificationQueueProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-3 bg-blue-50 rounded-lg border"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            {count} Queued Notification{count !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      <p className="text-xs text-blue-700 mb-3">
        These notifications are waiting to be delivered when you enable notifications.
      </p>
      
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onProcess}>
          <Check className="h-3 w-3 mr-1" />
          Process
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear}>
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>
    </motion.div>
  );
}

interface NotificationSettingsProps {
  settings: Record<string, boolean>;
  onSettingsChange: (settings: Record<string, boolean>) => void;
  disabled: boolean;
}

function NotificationSettings({ settings, onSettingsChange, disabled }: NotificationSettingsProps) {
  const settingsConfig = [
    {
      key: 'newsUpdates',
      label: 'News Updates',
      description: 'Breaking news and important updates'
    },
    {
      key: 'weatherAlerts',
      label: 'Weather Alerts',
      description: 'Severe weather warnings and forecasts'
    },
    {
      key: 'trafficUpdates',
      label: 'Traffic Updates',
      description: 'Road closures and traffic incidents'
    },
    {
      key: 'governmentNotices',
      label: 'Government Notices',
      description: 'Official announcements and services'
    },
    {
      key: 'touristAlerts',
      label: 'Tourist Information',
      description: 'Events, attractions, and travel tips'
    },
    {
      key: 'appUpdates',
      label: 'App Updates',
      description: 'New features and improvements'
    }
  ];

  const handleSettingChange = (key: string, value: boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4" />
        <span className="text-sm font-medium">Notification Types</span>
      </div>

      <div className="space-y-3">
        {settingsConfig.map((config) => (
          <div key={config.key} className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Label 
                htmlFor={config.key}
                className={`text-sm ${disabled ? 'text-muted-foreground' : ''}`}
              >
                {config.label}
              </Label>
              <p className="text-xs text-muted-foreground">
                {config.description}
              </p>
            </div>
            
            <Switch
              id={config.key}
              checked={settings[config.key]}
              onCheckedChange={(value) => handleSettingChange(config.key, value)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      {disabled && (
        <p className="text-xs text-muted-foreground">
          Enable notifications to customize these settings
        </p>
      )}
    </div>
  );
}

export function NotificationPermissionPrompt() {
  const { notificationPermission, requestPermission, queuedCount } = useNotifications();
  const [isDismissed, setIsDismissed] = useState(false);

  if (notificationPermission === 'granted' || 
      notificationPermission === 'denied' || 
      isDismissed) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-800">Stay Updated</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-blue-700">
            Get timely alerts about weather, traffic, news, and government updates in Dubai
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex gap-2">
            <Button 
              className="flex-1"
              onClick={async () => {
                await requestPermission();
                setIsDismissed(true);
              }}
            >
              <Bell className="h-4 w-4 mr-2" />
              Enable Notifications
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsDismissed(true)}
            >
              Not now
            </Button>
          </div>
          
          {queuedCount > 0 && (
            <p className="text-xs text-blue-600 mt-2">
              {queuedCount} notifications are waiting to be delivered
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function NotificationBadge({ className = '' }: { className?: string }) {
  const { notificationPermission, queuedCount } = useNotifications();

  if (notificationPermission === 'granted' && queuedCount === 0) {
    return null;
  }

  return (
    <Badge 
      variant={notificationPermission === 'granted' ? 'default' : 'secondary'}
      className={`text-xs ${className}`}
    >
      {notificationPermission === 'granted' ? (
        queuedCount > 0 ? `${queuedCount} queued` : 'Enabled'
      ) : (
        'Disabled'
      )}
    </Badge>
  );
}

export default NotificationCenter;