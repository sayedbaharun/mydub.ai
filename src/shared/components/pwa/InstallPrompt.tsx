import React from 'react';
import { X, Download, Smartphone, Monitor, Zap, Wifi, Bell } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { useInstallPrompt } from '@/shared/hooks/usePWA';
import { motion, AnimatePresence } from 'framer-motion';

interface InstallPromptProps {
  variant?: 'banner' | 'card' | 'modal';
  className?: string;
}

export function InstallPrompt({ variant = 'banner', className = '' }: InstallPromptProps) {
  const { isVisible, isInstalling, install, dismiss, installStats } = useInstallPrompt();

  if (!isVisible) return null;

  if (variant === 'banner') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={`fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-4 shadow-lg ${className}`}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5" />
              <div>
                <div className="font-medium">Install MyDub.AI</div>
                <div className="text-sm opacity-90">
                  Get faster access and offline features
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={install}
                disabled={isInstalling}
              >
                {isInstalling ? 'Installing...' : 'Install'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismiss}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (variant === 'modal') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    <CardTitle>Install MyDub.AI</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={dismiss}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Install our app for the best experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InstallFeatures />
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={install}
                    disabled={isInstalling}
                  >
                    {isInstalling ? 'Installing...' : 'Install App'}
                  </Button>
                  <Button variant="outline" onClick={dismiss}>
                    Not now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Install MyDub.AI</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={dismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Install our progressive web app for a native experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InstallFeatures />
          
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={install}
              disabled={isInstalling}
            >
              <Download className="h-4 w-4 mr-2" />
              {isInstalling ? 'Installing...' : 'Install Now'}
            </Button>
            <Button variant="outline" onClick={dismiss}>
              Maybe later
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InstallFeatures() {
  const features = [
    {
      icon: Zap,
      title: 'Faster Performance',
      description: 'Lightning-fast loading and navigation'
    },
    {
      icon: Wifi,
      title: 'Offline Access',
      description: 'Use key features without internet'
    },
    {
      icon: Bell,
      title: 'Push Notifications',
      description: 'Get timely updates and alerts'
    },
    {
      icon: Smartphone,
      title: 'Native Experience',
      description: 'App-like interface on your device'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {features.map((feature, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="p-1 rounded-full bg-primary/10">
            <feature.icon className="h-3 w-3 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium">{feature.title}</div>
            <div className="text-xs text-muted-foreground">
              {feature.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function InstallButton({ 
  variant = "default",
  size = "default",
  className = "",
  children 
}: {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}) {
  const { isInstallPromptAvailable, isInstalling, install } = useInstallPrompt();

  if (!isInstallPromptAvailable) return null;

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={install}
      disabled={isInstalling}
    >
      <Download className="h-4 w-4 mr-2" />
      {children || (isInstalling ? 'Installing...' : 'Install App')}
    </Button>
  );
}

export function PWAStatus() {
  const { installStats } = useInstallPrompt();

  if (installStats.isInstalled) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <span>App installed</span>
        {installStats.isStandalone && (
          <Badge variant="secondary" className="text-xs">
            Standalone
          </Badge>
        )}
      </div>
    );
  }

  if (installStats.isInstallable) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <span>Ready to install</span>
        <InstallButton variant="outline" size="sm">
          Install
        </InstallButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="w-2 h-2 bg-gray-400 rounded-full" />
      <span>Web app</span>
    </div>
  );
}

export default InstallPrompt;