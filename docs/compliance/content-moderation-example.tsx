// Example: How to integrate content moderation into a chat component

import { useState } from 'react'
import { contentModerationService } from '@/shared/services/content-moderation.service'
import { useToast } from '@/shared/hooks/use-toast'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { AlertCircle } from 'lucide-react'

export function ChatWithModeration() {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const userId = 'current-user-id' // Get from auth context

  const handleSubmit = async () => {
    if (!message.trim()) return

    try {
      setIsSubmitting(true)

      // Step 1: Check content with moderation service
      const moderationResult = await contentModerationService.moderateContent(
        message,
        userId,
        'chat'
      )

      // Step 2: Handle moderation results
      if (moderationResult.action === 'blocked') {
        // Content is blocked - show error
        toast({
          title: 'Content Blocked',
          description: `Your message violates our content policy: ${moderationResult.reason}`,
          variant: 'destructive',
        })
        return
      }

      if (moderationResult.action === 'warning') {
        // Content has warnings but is allowed
        toast({
          title: 'Content Warning',
          description: 'Please ensure your content follows our community guidelines.',
          variant: 'default',
        })
      }

      // Step 3: If content passes moderation, proceed with sending
      // Your existing chat send logic here
      await sendChatMessage(message)
      
      // Clear the input
      setMessage('')
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Example report content function
  const handleReportContent = async (contentId: string) => {
    try {
      await contentModerationService.reportContent(
        contentId,
        'chat',
        userId,
        'inappropriate',
        'User reported this content as inappropriate'
      )
      
      toast({
        title: 'Content Reported',
        description: 'Thank you for helping keep our community safe.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to report content.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="min-h-[100px]"
          disabled={isSubmitting}
        />
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Messages are moderated for safety
          </div>
          
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
          >
            {isSubmitting ? 'Checking...' : 'Send'}
          </Button>
        </div>
      </div>

      {/* Example of how to add report button to existing messages */}
      <div className="text-xs text-muted-foreground">
        All messages include a report option for community safety
      </div>
    </div>
  )
}

// Mock function - replace with your actual implementation
async function sendChatMessage(message: string) {
  // Your existing logic to send the message
  console.log('Sending message:', message)
}