/**
 * Real-time Collaboration Client for MyDub.AI
 * Supports real-time document editing, live chat, presence awareness, and collaborative features
 */

import { supabase } from '@/shared/lib/supabase'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'

export interface CollaborationSession {
  id: string
  type: 'document' | 'chat' | 'planning' | 'review'
  title: string
  created_by: string
  participants: Participant[]
  permissions: SessionPermissions
  metadata?: {
    document_id?: string
    content_type?: string
    privacy_level?: 'public' | 'private' | 'team'
  }
  created_at: Date
  updated_at: Date
}

export interface Participant {
  user_id: string
  name: string
  avatar?: string
  role: 'owner' | 'editor' | 'viewer' | 'commenter'
  status: 'online' | 'offline' | 'away'
  last_seen: Date
  cursor_position?: {
    x: number
    y: number
    element_id?: string
  }
}

export interface SessionPermissions {
  can_edit: boolean
  can_comment: boolean
  can_invite: boolean
  can_manage: boolean
}

export interface CollaborativeOperation {
  id: string
  session_id: string
  user_id: string
  type: 'insert' | 'delete' | 'format' | 'move' | 'comment'
  position: number
  content?: string
  metadata?: any
  timestamp: Date
}

export interface RealtimeMessage {
  id: string
  session_id: string
  user_id: string
  user_name: string
  content: string
  type: 'text' | 'system' | 'notification'
  timestamp: Date
  reply_to?: string
  attachments?: Array<{
    type: 'image' | 'file' | 'link'
    url: string
    name: string
  }>
}

export interface PresenceData {
  user_id: string
  name: string
  avatar?: string
  status: 'online' | 'away'
  current_page?: string
  cursor_position?: { x: number; y: number }
  last_activity: string
}

class CollaborationClient {
  private channels: Map<string, RealtimeChannel> = new Map()
  private sessions: Map<string, CollaborationSession> = new Map()
  private eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map()

  constructor() {
    this.setupGlobalPresence()
  }

  /**
   * Join a collaboration session
   */
  async joinSession(
    sessionId: string,
    userInfo: { id: string; name: string; avatar?: string }
  ): Promise<CollaborationSession> {
    try {
      // Get session details
      const { data: session, error } = await supabase
        .from('collaboration_sessions')
        .select(
          `
          *,
          participants:collaboration_participants(*)
        `
        )
        .eq('id', sessionId)
        .single()

      if (error) throw error

      // Set up real-time channel
      const channel = supabase.channel(`collaboration:${sessionId}`, {
        config: {
          presence: { key: userInfo.id },
        },
      })

      // Track presence
      channel.on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        this.handlePresenceUpdate(sessionId, presenceState)
      })

      // Listen for operations
      channel.on('broadcast', { event: 'operation' }, (payload) => {
        this.handleOperation(sessionId, payload.data)
      })

      // Listen for messages
      channel.on('broadcast', { event: 'message' }, (payload) => {
        this.handleMessage(sessionId, payload.data)
      })

      // Listen for cursor movements
      channel.on('broadcast', { event: 'cursor' }, (payload) => {
        this.handleCursorUpdate(sessionId, payload.data)
      })

      // Subscribe and track presence
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userInfo.id,
            name: userInfo.name,
            avatar: userInfo.avatar,
            status: 'online',
            last_activity: new Date().toISOString(),
          })
        }
      })

      this.channels.set(sessionId, channel)
      this.sessions.set(sessionId, session)

      // Add user as participant
      await this.addParticipant(sessionId, userInfo.id, 'viewer')

      return session
    } catch (error) {
      console.error('Failed to join collaboration session:', error)
      throw new Error('Failed to join session')
    }
  }

  /**
   * Leave a collaboration session
   */
  async leaveSession(sessionId: string): Promise<void> {
    const channel = this.channels.get(sessionId)
    if (channel) {
      await channel.untrack()
      await channel.unsubscribe()
      this.channels.delete(sessionId)
    }
    this.sessions.delete(sessionId)
  }

  /**
   * Create a new collaboration session
   */
  async createSession(
    type: CollaborationSession['type'],
    title: string,
    userId: string,
    options?: {
      privacy_level?: 'public' | 'private' | 'team'
      document_id?: string
      content_type?: string
    }
  ): Promise<CollaborationSession> {
    try {
      const { data: session, error } = await supabase
        .from('collaboration_sessions')
        .insert({
          type,
          title,
          created_by: userId,
          permissions: {
            can_edit: true,
            can_comment: true,
            can_invite: true,
            can_manage: true,
          },
          metadata: options,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      return session
    } catch (error) {
      console.error('Failed to create collaboration session:', error)
      throw new Error('Failed to create session')
    }
  }

  /**
   * Send a collaborative operation (for document editing)
   */
  async sendOperation(
    sessionId: string,
    operation: Omit<CollaborativeOperation, 'id' | 'session_id' | 'timestamp'>
  ): Promise<void> {
    const channel = this.channels.get(sessionId)
    if (!channel) {
      throw new Error('Not connected to session')
    }

    const fullOperation: CollaborativeOperation = {
      ...operation,
      id: crypto.randomUUID(),
      session_id: sessionId,
      timestamp: new Date(),
    }

    // Broadcast to other participants
    await channel.send({
      type: 'broadcast',
      event: 'operation',
      data: fullOperation,
    })

    // Store in database for persistence
    await supabase.from('collaboration_operations').insert(fullOperation)
  }

  /**
   * Send a chat message
   */
  async sendMessage(
    sessionId: string,
    content: string,
    userId: string,
    userName: string,
    options?: {
      type?: 'text' | 'system' | 'notification'
      reply_to?: string
      attachments?: RealtimeMessage['attachments']
    }
  ): Promise<void> {
    const channel = this.channels.get(sessionId)
    if (!channel) {
      throw new Error('Not connected to session')
    }

    const message: RealtimeMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      user_id: userId,
      user_name: userName,
      content,
      type: options?.type || 'text',
      timestamp: new Date(),
      reply_to: options?.reply_to,
      attachments: options?.attachments,
    }

    // Broadcast to other participants
    await channel.send({
      type: 'broadcast',
      event: 'message',
      data: message,
    })

    // Store in database
    await supabase.from('collaboration_messages').insert(message)
  }

  /**
   * Update cursor position
   */
  async updateCursor(
    sessionId: string,
    position: { x: number; y: number; element_id?: string }
  ): Promise<void> {
    const channel = this.channels.get(sessionId)
    if (!channel) return

    await channel.send({
      type: 'broadcast',
      event: 'cursor',
      data: {
        user_id: supabase.auth.getUser().then((u) => u.data.user?.id),
        position,
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Invite user to session
   */
  async inviteUser(
    sessionId: string,
    userId: string,
    role: Participant['role'] = 'viewer'
  ): Promise<void> {
    await this.addParticipant(sessionId, userId, role)

    // Send notification
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'collaboration_invite',
      title: 'Collaboration Invitation',
      content: `You've been invited to collaborate on a ${this.sessions.get(sessionId)?.type}`,
      data: { session_id: sessionId },
      created_at: new Date().toISOString(),
    })
  }

  /**
   * Update participant role
   */
  async updateParticipantRole(
    sessionId: string,
    userId: string,
    role: Participant['role']
  ): Promise<void> {
    await supabase
      .from('collaboration_participants')
      .update({ role })
      .eq('session_id', sessionId)
      .eq('user_id', userId)

    // Broadcast role change
    const channel = this.channels.get(sessionId)
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'role_change',
        data: { user_id: userId, role },
      })
    }
  }

  /**
   * Get session history
   */
  async getSessionHistory(
    sessionId: string,
    options?: {
      include_operations?: boolean
      include_messages?: boolean
      limit?: number
      before?: Date
    }
  ): Promise<{
    operations?: CollaborativeOperation[]
    messages?: RealtimeMessage[]
  }> {
    const result: any = {}

    if (options?.include_operations !== false) {
      const { data: operations } = await supabase
        .from('collaboration_operations')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false })
        .limit(options?.limit || 100)

      result.operations = operations || []
    }

    if (options?.include_messages !== false) {
      const { data: messages } = await supabase
        .from('collaboration_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false })
        .limit(options?.limit || 100)

      result.messages = messages || []
    }

    return result
  }

  /**
   * Event listeners
   */
  on(event: string, listener: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)
  }

  off(event: string, listener: (...args: any[]) => void): void {
    this.eventListeners.get(event)?.delete(listener)
  }

  private emit(event: string, data: any): void {
    this.eventListeners.get(event)?.forEach((listener) => {
      try {
        listener(data)
      } catch (error) {
        console.error('Event listener error:', error)
      }
    })
  }

  private setupGlobalPresence(): void {
    // Global presence for user activity across the app
    const globalChannel = supabase.channel('global-presence')

    globalChannel.on('presence', { event: 'sync' }, () => {
      const state = globalChannel.presenceState()
      this.emit('global_presence_sync', state)
    })

    globalChannel.subscribe()
  }

  private handlePresenceUpdate(sessionId: string, presenceState: RealtimePresenceState): void {
    const participants: Participant[] = []

    Object.entries(presenceState).forEach(([key, presence]) => {
      const presenceData = presence[0] as PresenceData
      participants.push({
        user_id: presenceData.user_id,
        name: presenceData.name,
        avatar: presenceData.avatar,
        role: 'viewer', // Would be fetched from database
        status: presenceData.status === 'online' ? 'online' : 'offline',
        last_seen: new Date(presenceData.last_activity),
      })
    })

    this.emit('participants_changed', { sessionId, participants })
  }

  private handleOperation(sessionId: string, operation: CollaborativeOperation): void {
    this.emit('operation_received', { sessionId, operation })
  }

  private handleMessage(sessionId: string, message: RealtimeMessage): void {
    this.emit('message_received', { sessionId, message })
  }

  private handleCursorUpdate(sessionId: string, data: any): void {
    this.emit('cursor_updated', { sessionId, ...data })
  }

  private async addParticipant(
    sessionId: string,
    userId: string,
    role: Participant['role']
  ): Promise<void> {
    await supabase.from('collaboration_participants').upsert({
      session_id: sessionId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString(),
    })
  }
}

// Export singleton instance
let collaborationClient: CollaborationClient | null = null

export function getCollaborationClient(): CollaborationClient {
  if (!collaborationClient) {
    collaborationClient = new CollaborationClient()
  }
  return collaborationClient
}

// Operational Transform utilities for conflict resolution
export class OperationalTransform {
  /**
   * Transform two concurrent operations
   */
  static transform(
    op1: CollaborativeOperation,
    op2: CollaborativeOperation
  ): [CollaborativeOperation, CollaborativeOperation] {
    // Simple transformation for insert/delete operations
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return [op1, { ...op2, position: op2.position + (op1.content?.length || 0) }]
      } else {
        return [{ ...op1, position: op1.position + (op2.content?.length || 0) }, op2]
      }
    }

    if (op1.type === 'delete' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return [
          op1,
          { ...op2, position: Math.max(op1.position, op2.position - (op1.content?.length || 0)) },
        ]
      } else {
        return [
          { ...op1, position: Math.max(op2.position, op1.position - (op2.content?.length || 0)) },
          op2,
        ]
      }
    }

    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return [op1, { ...op2, position: op2.position + (op1.content?.length || 0) }]
      } else {
        return [{ ...op1, position: op1.position - (op2.content?.length || 0) }, op2]
      }
    }

    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op2.position <= op1.position) {
        return [{ ...op1, position: op1.position + (op2.content?.length || 0) }, op2]
      } else {
        return [op1, { ...op2, position: op2.position - (op1.content?.length || 0) }]
      }
    }

    // Default: return operations as-is
    return [op1, op2]
  }

  /**
   * Apply operation to text content
   */
  static applyOperation(content: string, operation: CollaborativeOperation): string {
    switch (operation.type) {
      case 'insert':
        return (
          content.slice(0, operation.position) +
          (operation.content || '') +
          content.slice(operation.position)
        )

      case 'delete': {
        const deleteLength = operation.content?.length || 0
        return (
          content.slice(0, operation.position) + content.slice(operation.position + deleteLength)
        )
      }

      default:
        return content
    }
  }
}
