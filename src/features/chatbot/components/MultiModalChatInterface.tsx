import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Mic, Camera, Paperclip, Image, FileText, MapPin, Loader2, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { useMultiModalAI, MultiModalMessage, VisionAnalysisResult } from '@/shared/lib/ai/multimodalClient';
import { useToast } from '@/shared/hooks/use-toast';

interface MediaAttachment {
  id: string;
  type: 'image' | 'audio' | 'document';
  file: File;
  url: string;
  analysis?: VisionAnalysisResult | any;
}

interface MultiModalChatProps {
  onMessage?: (message: MultiModalMessage) => void;
  initialMessages?: MultiModalMessage[];
  showLocationContext?: boolean;
  enableVoice?: boolean;
  enableCamera?: boolean;
  enableFileUpload?: boolean;
}

export function MultiModalChatInterface({
  onMessage,
  initialMessages = [],
  showLocationContext = true,
  enableVoice = true,
  enableCamera = true,
  enableFileUpload = true
}: MultiModalChatProps) {
  const [messages, setMessages] = useState<MultiModalMessage[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const { analyzeImage, analyzeAudio, processMessage, analyzeDocument } = useMultiModalAI();
  const { toast } = useToast();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user location if enabled
  useEffect(() => {
    if (showLocationContext && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
                  }
      );
    }
  }, [showLocationContext]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() && attachments.length === 0) return;

    setIsProcessing(true);
    
    try {
      // Create user message
      const userMessage: MultiModalMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: [],
        timestamp: new Date(),
        metadata: {
          location,
          language: 'en' // TODO: Detect language
        }
      };

      // Add text content
      if (inputText.trim()) {
        userMessage.content.push({
          type: 'text',
          text: inputText
        });
      }

      // Add attachments
      for (const attachment of attachments) {
        if (attachment.type === 'image') {
          userMessage.content.push({
            type: 'image',
            image: {
              url: attachment.url,
              detail: 'high'
            }
          });
        } else if (attachment.type === 'audio') {
          userMessage.content.push({
            type: 'audio',
            audio: {
              url: attachment.url,
              transcript: attachment.analysis?.transcript
            }
          });
        } else if (attachment.type === 'document') {
          userMessage.content.push({
            type: 'document',
            document: {
              url: attachment.url,
              type: attachment.file.type,
              content: attachment.analysis?.content
            }
          });
        }
      }

      // Add to messages
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Get AI response
      const aiResponse = await processMessage(updatedMessages, {
        language: 'en',
        context: 'dubai'
      });

      setMessages(prev => [...prev, aiResponse]);

      // Notify parent
      onMessage?.(aiResponse);

      // Clear inputs
      setInputText('');
      setAttachments([]);

    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, attachments, messages, location, processMessage, onMessage, toast]);

  const handleVoiceRecord = useCallback(async () => {
    if (!enableVoice) return;

    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          try {
            // Analyze audio
            const analysis = await analyzeAudio(audioBlob, {
              language: 'en', // TODO: Detect language
              detectIntent: true,
              sentiment: true
            });

            // Create attachment
            const attachment: MediaAttachment = {
              id: crypto.randomUUID(),
              type: 'audio',
              file: new File([audioBlob], 'recording.webm', { type: 'audio/webm' }),
              url: URL.createObjectURL(audioBlob),
              analysis
            };

            setAttachments(prev => [...prev, attachment]);

            // Auto-fill text input with transcript
            if (analysis.transcript) {
              setInputText(prev => prev + ' ' + analysis.transcript);
            }

            toast({
              title: 'Voice recorded',
              description: 'Audio has been transcribed and added to your message.'
            });

          } catch (error) {
            console.error('Voice analysis failed:', error);
            toast({
              title: 'Error',
              description: 'Failed to process voice recording.',
              variant: 'destructive'
            });
          }

          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);

      } catch (error) {
        console.error('Failed to start recording:', error);
        toast({
          title: 'Error',
          description: 'Unable to access microphone.',
          variant: 'destructive'
        });
      }
    }
  }, [isRecording, enableVoice, analyzeAudio, toast]);

  const handleImageCapture = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = URL.createObjectURL(file);
      
      // Analyze image
      const analysis = await analyzeImage(url, undefined, {
        detectLandmarks: true,
        extractText: true,
        identifyObjects: true,
        dubaiContext: true
      });

      const attachment: MediaAttachment = {
        id: crypto.randomUUID(),
        type: 'image',
        file,
        url,
        analysis
      };

      setAttachments(prev => [...prev, attachment]);

      toast({
        title: 'Image analyzed',
        description: 'Image has been processed and will be included in your message.'
      });

    } catch (error) {
      console.error('Image analysis failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze image.',
        variant: 'destructive'
      });
    }
  }, [analyzeImage, toast]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = URL.createObjectURL(file);
      let analysis;

      // Analyze document if it's a supported type
      if (file.type === 'application/pdf' || file.type.startsWith('text/')) {
        analysis = await analyzeDocument(file);
      }

      const attachment: MediaAttachment = {
        id: crypto.randomUUID(),
        type: 'document',
        file,
        url,
        analysis
      };

      setAttachments(prev => [...prev, attachment]);

      toast({
        title: 'Document uploaded',
        description: 'Document has been processed and will be included in your message.'
      });

    } catch (error) {
      console.error('Document analysis failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to process document.',
        variant: 'destructive'
      });
    }
  }, [analyzeDocument, toast]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id);
      if (attachment) {
        URL.revokeObjectURL(attachment.url);
      }
      return prev.filter(a => a.id !== id);
    });
  }, []);

  const renderMessage = (message: MultiModalMessage) => (
    <div
      key={message.id}
      className={`flex mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <Card className={`max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
        <CardContent className="p-3">
          {message.content.map((content, index) => (
            <div key={index} className="mb-2 last:mb-0">
              {content.type === 'text' && (
                <p className="whitespace-pre-wrap">{content.text}</p>
              )}
              {content.type === 'image' && (
                <img
                  src={content.image?.url}
                  alt="Uploaded image"
                  className="max-w-full h-auto rounded-md"
                />
              )}
              {content.type === 'audio' && (
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  <span className="text-sm">Voice message</span>
                  {content.audio?.transcript && (
                    <Badge variant="outline">{content.audio.transcript}</Badge>
                  )}
                </div>
              )}
              {content.type === 'document' && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Document</span>
                </div>
              )}
            </div>
          ))}
          <div className="text-xs opacity-70 mt-2">
            {message.timestamp.toLocaleTimeString()}
            {message.metadata?.location && showLocationContext && (
              <span className="ml-2 inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAttachment = (attachment: MediaAttachment) => (
    <div key={attachment.id} className="relative bg-muted p-2 rounded-md">
      <Button
        variant="ghost"
        size="sm"
        className="absolute -top-2 -right-2 h-6 w-6 p-0"
        onClick={() => removeAttachment(attachment.id)}
      >
        <X className="h-3 w-3" />
      </Button>
      
      {attachment.type === 'image' && (
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          <span className="text-sm truncate">{attachment.file.name}</span>
          {attachment.analysis?.description && (
            <Badge variant="outline" className="text-xs">
              {attachment.analysis.description.slice(0, 30)}...
            </Badge>
          )}
        </div>
      )}
      
      {attachment.type === 'audio' && (
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4" />
          <span className="text-sm">Voice recording</span>
          {attachment.analysis?.transcript && (
            <Badge variant="outline" className="text-xs">
              {attachment.analysis.transcript.slice(0, 30)}...
            </Badge>
          )}
        </div>
      )}
      
      {attachment.type === 'document' && (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="text-sm truncate">{attachment.file.name}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Multi-Modal AI Chat</p>
            <p className="text-sm">Send text, images, voice, or documents</p>
          </div>
        )}
        
        {messages.map(renderMessage)}
        
        {isProcessing && (
          <div className="flex justify-start">
            <Card className="max-w-[80%]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="border-t p-4">
          <div className="flex flex-wrap gap-2">
            {attachments.map(renderAttachment)}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          {/* Voice Recording */}
          {enableVoice && (
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              onClick={handleVoiceRecord}
              disabled={isProcessing}
            >
              <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
            </Button>
          )}

          {/* Camera */}
          {enableCamera && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessing}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageCapture}
              />
            </>
          )}

          {/* File Upload */}
          {enableFileUpload && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt,.doc,.docx"
                className="hidden"
                onChange={handleFileUpload}
              />
            </>
          )}

          {/* Text Input */}
          <div className="flex-1">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message or attach media..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isProcessing}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={(!inputText.trim() && attachments.length === 0) || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Location Context */}
        {location && showLocationContext && (
          <div className="mt-2">
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Using your location for contextual responses
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}

export default MultiModalChatInterface;