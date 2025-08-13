import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getCollaborationClient, 
  CollaborationSession, 
  Participant, 
  RealtimeMessage, 
  CollaborativeOperation 
} from '@/shared/lib/realtime/collaborationClient';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/shared/hooks/use-toast';

interface UseCollaborationSessionOptions {
  sessionId: string;
  autoJoin?: boolean;
  onParticipantsChanged?: (participants: Participant[]) => void;
  onMessageReceived?: (message: RealtimeMessage) => void;
  onOperationReceived?: (operation: CollaborativeOperation) => void;
}

/**
 * Hook for managing collaboration sessions
 */
export function useCollaborationSession(options: UseCollaborationSessionOptions) {
  const { user } = useAuth();
  const { toast } = useToast();
  const client = getCollaborationClient();
  
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const { sessionId, autoJoin = true } = options;

  // Join session
  const joinSession = useCallback(async () => {
    if (!user) return;

    try {
      setConnectionError(null);
      const sessionData = await client.joinSession(sessionId, {
        id: user.id,
        name: user.full_name || user.email,
        avatar: user.avatar_url
      });
      
      setSession(sessionData);
      setIsConnected(true);
      
      toast({
        title: 'Connected',
        description: 'Successfully joined collaboration session'
      });

    } catch (error) {
      console.error('Failed to join session:', error);
      setConnectionError('Failed to connect to collaboration session');
      
      toast({
        title: 'Connection Error',
        description: 'Failed to join collaboration session',
        variant: 'destructive'
      });
    }
  }, [user, sessionId, client, toast]);

  // Leave session
  const leaveSession = useCallback(async () => {
    try {
      await client.leaveSession(sessionId);
      setSession(null);
      setIsConnected(false);
      setParticipants([]);
    } catch (error) {
      console.error('Failed to leave session:', error);
    }
  }, [sessionId, client]);

  // Send message
  const sendMessage = useCallback(async (
    content: string,
    options?: {
      type?: 'text' | 'system' | 'notification';
      reply_to?: string;
    }
  ) => {
    if (!user || !isConnected) return;

    try {
      await client.sendMessage(
        sessionId,
        content,
        user.id,
        user.full_name || user.email,
        options
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  }, [user, sessionId, client, isConnected, toast]);

  // Send operation
  const sendOperation = useCallback(async (operation: Omit<CollaborativeOperation, 'id' | 'session_id' | 'timestamp'>) => {
    if (!user || !isConnected) return;

    try {
      await client.sendOperation(sessionId, {
        ...operation,
        user_id: user.id
      });
    } catch (error) {
      console.error('Failed to send operation:', error);
    }
  }, [user, sessionId, client, isConnected]);

  // Update cursor position
  const updateCursor = useCallback(async (position: { x: number; y: number; element_id?: string }) => {
    if (!isConnected) return;

    try {
      await client.updateCursor(sessionId, position);
    } catch (error) {
      console.error('Failed to update cursor:', error);
    }
  }, [sessionId, client, isConnected]);

  // Set up event listeners
  useEffect(() => {
    const handleParticipantsChanged = (data: { sessionId: string; participants: Participant[] }) => {
      if (data.sessionId === sessionId) {
        setParticipants(data.participants);
        options.onParticipantsChanged?.(data.participants);
      }
    };

    const handleMessageReceived = (data: { sessionId: string; message: RealtimeMessage }) => {
      if (data.sessionId === sessionId) {
        setMessages(prev => [data.message, ...prev]);
        options.onMessageReceived?.(data.message);
      }
    };

    const handleOperationReceived = (data: { sessionId: string; operation: CollaborativeOperation }) => {
      if (data.sessionId === sessionId) {
        options.onOperationReceived?.(data.operation);
      }
    };

    client.on('participants_changed', handleParticipantsChanged);
    client.on('message_received', handleMessageReceived);
    client.on('operation_received', handleOperationReceived);

    return () => {
      client.off('participants_changed', handleParticipantsChanged);
      client.off('message_received', handleMessageReceived);
      client.off('operation_received', handleOperationReceived);
    };
  }, [sessionId, client, options]);

  // Auto-join on mount
  useEffect(() => {
    if (autoJoin && user) {
      joinSession();
    }

    return () => {
      if (isConnected) {
        leaveSession();
      }
    };
  }, [autoJoin, user, joinSession, leaveSession, isConnected]);

  return {
    session,
    participants,
    messages,
    isConnected,
    connectionError,
    joinSession,
    leaveSession,
    sendMessage,
    sendOperation,
    updateCursor
  };
}

/**
 * Hook for collaborative document editing
 */
export function useCollaborativeDocument(
  sessionId: string,
  initialContent: string = ''
) {
  const [content, setContent] = useState(initialContent);
  const [operations, setOperations] = useState<CollaborativeOperation[]>([]);
  const [cursors, setCursors] = useState<Map<string, { x: number; y: number; user: string }>>(new Map());
  
  const operationQueueRef = useRef<CollaborativeOperation[]>([]);

  const { sendOperation, updateCursor } = useCollaborationSession({
    sessionId,
    onOperationReceived: (operation) => {
      // Apply operation to content using operational transform
      setOperations(prev => [...prev, operation]);
      
      // Simple text transformation (would be more sophisticated in production)
      if (operation.type === 'insert' && operation.content) {
        setContent(prev => 
          prev.slice(0, operation.position) + 
          operation.content + 
          prev.slice(operation.position)
        );
      } else if (operation.type === 'delete' && operation.content) {
        setContent(prev => 
          prev.slice(0, operation.position) + 
          prev.slice(operation.position + operation.content!.length)
        );
      }
    }
  });

  const insertText = useCallback((position: number, text: string) => {
    // Apply locally first
    setContent(prev => 
      prev.slice(0, position) + text + prev.slice(position)
    );

    // Send operation
    sendOperation({
      type: 'insert',
      position,
      content: text,
      user_id: '', // Will be set by sendOperation
      metadata: {}
    });
  }, [sendOperation]);

  const deleteText = useCallback((position: number, length: number) => {
    const deletedText = content.slice(position, position + length);
    
    // Apply locally first
    setContent(prev => 
      prev.slice(0, position) + prev.slice(position + length)
    );

    // Send operation
    sendOperation({
      type: 'delete',
      position,
      content: deletedText,
      user_id: '', // Will be set by sendOperation
      metadata: {}
    });
  }, [content, sendOperation]);

  return {
    content,
    operations,
    cursors,
    insertText,
    deleteText,
    updateCursor
  };
}

/**
 * Hook for real-time chat
 */
export function useRealtimeChat(sessionId: string) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const { messages, sendMessage, participants } = useCollaborationSession({
    sessionId,
    onMessageReceived: (message) => {
      // Remove from typing when message is received
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(message.user_id);
        return newSet;
      });
    }
  });

  const sendTypingIndicator = useCallback((userId: string) => {
    setTypingUsers(prev => new Set(prev).add(userId));
    
    // Clear existing timeout
    const existingTimeout = typingTimeoutRef.current.get(userId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout to remove typing indicator
    const timeout = setTimeout(() => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      typingTimeoutRef.current.delete(userId);
    }, 3000);

    typingTimeoutRef.current.set(userId, timeout);
  }, []);

  return {
    messages,
    participants,
    typingUsers,
    sendMessage,
    sendTypingIndicator
  };
}

/**
 * Hook for presence awareness
 */
export function usePresenceAwareness() {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, any>>(new Map());
  const client = getCollaborationClient();

  useEffect(() => {
    const handleGlobalPresence = (presenceState: any) => {
      const users = new Map();
      
      Object.entries(presenceState).forEach(([key, presence]: [string, any]) => {
        const presenceData = presence[0];
        users.set(presenceData.user_id, presenceData);
      });
      
      setOnlineUsers(users);
    };

    client.on('global_presence_sync', handleGlobalPresence);

    return () => {
      client.off('global_presence_sync', handleGlobalPresence);
    };
  }, [client]);

  return {
    onlineUsers: Array.from(onlineUsers.values()),
    isUserOnline: (userId: string) => onlineUsers.has(userId)
  };
}

/**
 * Hook for managing collaboration sessions (create, list, etc.)
 */
export function useCollaborationManagement() {
  const { user } = useAuth();
  const client = getCollaborationClient();
  const queryClient = useQueryClient();

  // Get user's sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['collaboration-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await client['supabase']
        .from('collaboration_sessions')
        .select(`
          *,
          participants:collaboration_participants(*)
        `)
        .or(`created_by.eq.${user.id},participants.user_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Create session mutation
  const createSession = useMutation({
    mutationFn: async (params: {
      type: CollaborationSession['type'];
      title: string;
      options?: any;
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      return client.createSession(
        params.type,
        params.title,
        user.id,
        params.options
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration-sessions'] });
    }
  });

  // Invite user mutation
  const inviteUser = useMutation({
    mutationFn: async (params: {
      sessionId: string;
      userId: string;
      role?: string;
    }) => {
      return client.inviteUser(
        params.sessionId,
        params.userId,
        params.role as any
      );
    }
  });

  return {
    sessions: sessions || [],
    isLoading,
    createSession: createSession.mutate,
    isCreating: createSession.isPending,
    inviteUser: inviteUser.mutate,
    isInviting: inviteUser.isPending
  };
}

/**
 * Hook for collaborative annotations
 */
export function useCollaborativeAnnotations(contentId: string) {
  const [annotations, setAnnotations] = useState<any[]>([]);
  const { sendOperation } = useCollaborationSession({
    sessionId: `annotations:${contentId}`,
    onOperationReceived: (operation) => {
      if (operation.type === 'comment') {
        setAnnotations(prev => [...prev, operation.metadata]);
      }
    }
  });

  const addAnnotation = useCallback((annotation: {
    x: number;
    y: number;
    text: string;
    element_id?: string;
  }) => {
    sendOperation({
      type: 'comment',
      position: 0,
      user_id: '',
      metadata: {
        ...annotation,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      }
    });
  }, [sendOperation]);

  return {
    annotations,
    addAnnotation
  };
}