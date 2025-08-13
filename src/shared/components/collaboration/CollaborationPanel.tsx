import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  MessageCircle, 
  Share2, 
  Settings, 
  UserPlus, 
  Circle, 
  Send, 
  MoreVertical,
  Edit3,
  Eye,
  Crown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { useCollaborationSession, useRealtimeChat, usePresenceAwareness } from '@/shared/hooks/useCollaboration';
import { Participant, RealtimeMessage } from '@/shared/lib/realtime/collaborationClient';
import { formatDistanceToNow } from 'date-fns';

interface CollaborationPanelProps {
  sessionId: string;
  className?: string;
  compact?: boolean;
}

export function CollaborationPanel({ 
  sessionId, 
  className = '',
  compact = false 
}: CollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState('participants');
  
  const {
    session,
    participants,
    isConnected
  } = useCollaborationSession({
    sessionId,
    autoJoin: true
  });

  if (!isConnected || !session) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">
            <Circle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Connecting...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <CompactCollaborationPanel 
        sessionId={sessionId}
        participants={participants}
        className={className}
      />
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Collaboration
            </CardTitle>
            <CardDescription>{session.title}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Users
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Session Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Share Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-muted-foreground">
            {participants.length} participant{participants.length !== 1 ? 's' : ''} active
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="participants" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              People
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-xs">
              <MessageCircle className="h-3 w-3 mr-1" />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants" className="m-0">
            <ParticipantsList participants={participants} />
          </TabsContent>

          <TabsContent value="chat" className="m-0">
            <ChatPanel sessionId={sessionId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface CompactCollaborationPanelProps {
  sessionId: string;
  participants: Participant[];
  className?: string;
}

function CompactCollaborationPanel({ 
  sessionId, 
  participants, 
  className 
}: CompactCollaborationPanelProps) {
  const { onlineUsers } = usePresenceAwareness();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex -space-x-2">
        {participants.slice(0, 5).map((participant) => (
          <ParticipantAvatar
            key={participant.user_id}
            participant={participant}
            size="sm"
            showStatus
          />
        ))}
        {participants.length > 5 && (
          <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
            +{participants.length - 5}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
        <span className="text-xs text-muted-foreground">
          {participants.length} active
        </span>
      </div>
    </div>
  );
}

interface ParticipantsListProps {
  participants: Participant[];
}

function ParticipantsList({ participants }: ParticipantsListProps) {
  return (
    <ScrollArea className="h-64">
      <div className="p-4 space-y-3">
        {participants.map((participant) => (
          <div key={participant.user_id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ParticipantAvatar participant={participant} showStatus />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{participant.name}</p>
                <div className="flex items-center gap-2">
                  <ParticipantRoleBadge role={participant.role} />
                  <span className="text-xs text-muted-foreground">
                    {participant.status === 'online' ? 'Active now' : 
                     `Last seen ${formatDistanceToNow(participant.last_seen, { addSuffix: true })}`}
                  </span>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>View Profile</DropdownMenuItem>
                <DropdownMenuItem>Change Role</DropdownMenuItem>
                <DropdownMenuItem>Remove</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
        
        {participants.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No participants yet</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

interface ChatPanelProps {
  sessionId: string;
}

function ChatPanel({ sessionId }: ChatPanelProps) {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    sendMessage, 
    typingUsers,
    sendTypingIndicator 
  } = useRealtimeChat(sessionId);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    await sendMessage(messageInput);
    setMessageInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-80">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {typingUsers.size > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span>
                {Array.from(typingUsers).length === 1 
                  ? 'Someone is typing...'
                  : `${Array.from(typingUsers).length} people are typing...`
                }
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <Separator />
      
      <div className="p-4">
        <div className="flex gap-2">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ChatMessageProps {
  message: RealtimeMessage;
}

function ChatMessage({ message }: ChatMessageProps) {
  const isSystem = message.type === 'system';
  
  if (isSystem) {
    return (
      <div className="text-center">
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <Avatar className="h-6 w-6">
        <AvatarFallback className="text-xs">
          {message.user_name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">{message.user_name}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </span>
        </div>
        
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((attachment, index) => (
              <div key={index} className="text-xs text-muted-foreground border rounded p-2">
                📎 {attachment.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ParticipantAvatarProps {
  participant: Participant;
  size?: 'sm' | 'default';
  showStatus?: boolean;
}

function ParticipantAvatar({ 
  participant, 
  size = 'default',
  showStatus = false 
}: ParticipantAvatarProps) {
  const sizeClasses = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  
  return (
    <div className="relative">
      <Avatar className={sizeClasses}>
        {participant.avatar && (
          <AvatarImage src={participant.avatar} alt={participant.name} />
        )}
        <AvatarFallback className={size === 'sm' ? 'text-xs' : 'text-sm'}>
          {participant.name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      {showStatus && (
        <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${
          participant.status === 'online' ? 'bg-green-500' : 
          participant.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
        }`} />
      )}
    </div>
  );
}

interface ParticipantRoleBadgeProps {
  role: Participant['role'];
}

function ParticipantRoleBadge({ role }: ParticipantRoleBadgeProps) {
  const roleConfig = {
    owner: { icon: Crown, label: 'Owner', variant: 'default' as const },
    editor: { icon: Edit3, label: 'Editor', variant: 'secondary' as const },
    viewer: { icon: Eye, label: 'Viewer', variant: 'outline' as const },
    commenter: { icon: MessageCircle, label: 'Commenter', variant: 'outline' as const }
  };

  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="text-xs flex items-center gap-1">
      <Icon className="h-2 w-2" />
      {config.label}
    </Badge>
  );
}

export default CollaborationPanel;