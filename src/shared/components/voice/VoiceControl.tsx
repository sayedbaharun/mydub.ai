import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Languages, 
  Settings,
  HelpCircle,
  Loader2,
  Waves,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Separator } from '@/shared/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { useVoiceInterface, useTextToSpeech, useVoiceCommands } from '@/shared/hooks/useVoiceInterface';
import { VoiceCommand } from '@/shared/lib/voice/voiceInterface';

interface VoiceControlProps {
  variant?: 'floating' | 'compact' | 'full';
  className?: string;
  showTranscript?: boolean;
  showCommands?: boolean;
}

export function VoiceControl({ 
  variant = 'floating', 
  className = '',
  showTranscript = true,
  showCommands = true
}: VoiceControlProps) {
  const {
    isListening,
    isSpeaking,
    isSupported,
    currentLanguage,
    recognizedText,
    confidence,
    lastCommand,
    error,
    startListening,
    stopListening,
    speak,
    switchLanguage,
    toggleListening
  } = useVoiceInterface();

  const [showSettings, setShowSettings] = useState(false);
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);

  // Track command history
  useEffect(() => {
    if (lastCommand) {
      setCommandHistory(prev => [lastCommand, ...prev.slice(0, 9)]); // Keep last 10
    }
  }, [lastCommand]);

  if (!isSupported) {
    return (
      <Card className={`${className} border-dashed`}>
        <CardContent className="p-4 text-center">
          <MicOff className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Voice control not supported in this browser
          </p>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'floating') {
    return (
      <FloatingVoiceControl
        isListening={isListening}
        isSpeaking={isSpeaking}
        currentLanguage={currentLanguage}
        onToggleListening={toggleListening}
        onSwitchLanguage={switchLanguage}
        className={className}
      />
    );
  }

  if (variant === 'compact') {
    return (
      <CompactVoiceControl
        isListening={isListening}
        isSpeaking={isSpeaking}
        currentLanguage={currentLanguage}
        recognizedText={recognizedText}
        confidence={confidence}
        onToggleListening={toggleListening}
        onSwitchLanguage={switchLanguage}
        className={className}
      />
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Control
            </CardTitle>
            <CardDescription>
              Speak commands in English or Arabic
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <LanguageBadge language={currentLanguage} />
            <Popover open={showSettings} onOpenChange={setShowSettings}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <VoiceSettings 
                  currentLanguage={currentLanguage}
                  onLanguageChange={switchLanguage}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isListening ? "destructive" : "default"}
            size="lg"
            onClick={toggleListening}
            disabled={isSpeaking}
            className="h-16 w-16 rounded-full"
          >
            {isListening ? (
              <div className="flex items-center justify-center">
                <Waves className="h-6 w-6 animate-pulse" />
              </div>
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
          
          <div className="text-center">
            <div className="text-sm font-medium">
              {isListening ? 'Listening...' : 
               isSpeaking ? 'Speaking...' : 
               'Click to start'}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentLanguage === 'ar' ? 'Arabic' : 'English'}
            </div>
          </div>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}

        {showTranscript && recognizedText && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Recognized:</div>
            <div className="bg-muted p-3 rounded text-sm">
              {recognizedText}
            </div>
            {confidence > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Confidence:</span>
                <Progress value={confidence * 100} className="flex-1" />
                <span className="text-xs">{Math.round(confidence * 100)}%</span>
              </div>
            )}
          </div>
        )}

        {showCommands && (
          <>
            <Separator />
            <VoiceCommandsHelp language={currentLanguage} />
          </>
        )}

        {commandHistory.length > 0 && (
          <>
            <Separator />
            <CommandHistory commands={commandHistory} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface FloatingVoiceControlProps {
  isListening: boolean;
  isSpeaking: boolean;
  currentLanguage: 'en' | 'ar';
  onToggleListening: () => void;
  onSwitchLanguage: (lang: 'en' | 'ar') => void;
  className?: string;
}

function FloatingVoiceControl({
  isListening,
  isSpeaking,
  currentLanguage,
  onToggleListening,
  onSwitchLanguage,
  className
}: FloatingVoiceControlProps) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <div className="flex flex-col gap-2">
        <Button
          variant={isListening ? "destructive" : "default"}
          size="lg"
          onClick={onToggleListening}
          disabled={isSpeaking}
          className="h-14 w-14 rounded-full shadow-lg"
        >
          {isListening ? (
            <Waves className="h-6 w-6 animate-pulse" />
          ) : isSpeaking ? (
            <Volume2 className="h-6 w-6 animate-pulse" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSwitchLanguage(currentLanguage === 'en' ? 'ar' : 'en')}
          className="text-xs"
        >
          {currentLanguage === 'ar' ? 'AR' : 'EN'}
        </Button>
      </div>
    </div>
  );
}

interface CompactVoiceControlProps {
  isListening: boolean;
  isSpeaking: boolean;
  currentLanguage: 'en' | 'ar';
  recognizedText: string;
  confidence: number;
  onToggleListening: () => void;
  onSwitchLanguage: (lang: 'en' | 'ar') => void;
  className?: string;
}

function CompactVoiceControl({
  isListening,
  isSpeaking,
  currentLanguage,
  recognizedText,
  confidence,
  onToggleListening,
  onSwitchLanguage,
  className
}: CompactVoiceControlProps) {
  return (
    <Card className={`${className} border-l-4 border-l-primary`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Button
            variant={isListening ? "destructive" : "ghost"}
            size="sm"
            onClick={onToggleListening}
            disabled={isSpeaking}
            className="h-10 w-10 rounded-full"
          >
            {isListening ? (
              <Waves className="h-4 w-4 animate-pulse" />
            ) : isSpeaking ? (
              <Volume2 className="h-4 w-4 animate-pulse" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">Voice Control</span>
              <LanguageBadge language={currentLanguage} />
            </div>
            
            {recognizedText ? (
              <div className="text-xs text-muted-foreground truncate">
                {recognizedText}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                {isListening ? 'Listening...' : 'Click to start'}
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSwitchLanguage(currentLanguage === 'en' ? 'ar' : 'en')}
          >
            <Languages className="h-4 w-4" />
          </Button>
        </div>
        
        {confidence > 0 && (
          <Progress value={confidence * 100} className="mt-2 h-1" />
        )}
      </CardContent>
    </Card>
  );
}

function LanguageBadge({ language }: { language: 'en' | 'ar' }) {
  return (
    <Badge variant={language === 'ar' ? 'default' : 'secondary'}>
      {language === 'ar' ? 'العربية' : 'English'}
    </Badge>
  );
}

interface VoiceSettingsProps {
  currentLanguage: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
}

function VoiceSettings({ currentLanguage, onLanguageChange }: VoiceSettingsProps) {
  const [autoSwitch, setAutoSwitch] = useState(false);
  const [voiceResponses, setVoiceResponses] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Voice Settings</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="language" className="text-sm">Language</Label>
          <div className="flex gap-1">
            <Button
              variant={currentLanguage === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onLanguageChange('en')}
            >
              EN
            </Button>
            <Button
              variant={currentLanguage === 'ar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onLanguageChange('ar')}
            >
              AR
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-switch" className="text-sm">Auto-detect language</Label>
          <Switch
            id="auto-switch"
            checked={autoSwitch}
            onCheckedChange={setAutoSwitch}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="voice-responses" className="text-sm">Voice responses</Label>
          <Switch
            id="voice-responses"
            checked={voiceResponses}
            onCheckedChange={setVoiceResponses}
          />
        </div>
      </div>
    </div>
  );
}

function VoiceCommandsHelp({ language }: { language: 'en' | 'ar' }) {
  const commands = language === 'ar' ? [
    { command: 'ابحث عن...', description: 'البحث عن المحتوى' },
    { command: 'اذهب إلى...', description: 'التنقل إلى صفحة' },
    { command: 'ما هو...', description: 'طرح سؤال' },
    { command: 'احفظ هذا', description: 'حفظ المحتوى الحالي' },
    { command: 'توقف عن الاستماع', description: 'إيقاف التحكم الصوتي' }
  ] : [
    { command: 'Search for...', description: 'Search for content' },
    { command: 'Go to...', description: 'Navigate to page' },
    { command: 'What is...', description: 'Ask a question' },
    { command: 'Save this', description: 'Save current content' },
    { command: 'Stop listening', description: 'Turn off voice control' }
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-4 w-4" />
        <span className="text-sm font-medium">
          {language === 'ar' ? 'الأوامر المتاحة' : 'Available Commands'}
        </span>
      </div>
      
      <div className="space-y-1">
        {commands.map((cmd, index) => (
          <div key={index} className="flex justify-between text-xs">
            <span className="font-mono">{cmd.command}</span>
            <span className="text-muted-foreground">{cmd.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommandHistory({ commands }: { commands: VoiceCommand[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Recent Commands</span>
      </div>
      
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {commands.slice(0, 5).map((command) => (
          <div key={command.id} className="text-xs bg-muted p-2 rounded">
            <div className="font-medium">{command.command}</div>
            <div className="text-muted-foreground flex justify-between">
              <span>{command.intent}</span>
              <span>{Math.round(command.confidence * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VoiceControl;