import { useState } from 'react'
import { ApprovalItem, ApprovalAction } from '../types'
import { useProcessApproval } from '../hooks/useApprovalQueue'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Button } from '@/shared/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/shared/components/ui/dialog'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Input } from '@/shared/components/ui/input'
import { Calendar } from '@/shared/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { 
  CheckCircle, 
  XCircle, 
  Edit, 
  Calendar as CalendarIcon,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/shared/lib/utils'

interface ApprovalActionsProps {
  item: ApprovalItem
  onAction?: () => void
  showLabels?: boolean
}

export function ApprovalActions({ item, onAction, showLabels = false }: ApprovalActionsProps) {
  const { user } = useAuth()
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [comments, setComments] = useState('')
  const [scheduledDate, setScheduledDate] = useState<Date>()
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [editedTitle, setEditedTitle] = useState(item.title)
  const [editedExcerpt, setEditedExcerpt] = useState(item.excerpt)

  const processApproval = useProcessApproval()

  const handleAction = async (action: ApprovalAction) => {
    if (!user) return

    await processApproval.mutateAsync({
      action,
      userId: user.id
    })

    // Reset states
    setComments('')
    setScheduledDate(undefined)
    setScheduledTime('09:00')
    setEditedTitle(item.title)
    setEditedExcerpt(item.excerpt)

    // Close dialogs
    setShowRejectDialog(false)
    setShowScheduleDialog(false)
    setShowEditDialog(false)

    // Callback
    onAction?.()
  }

  const handleApprove = () => {
    handleAction({
      action: 'approve',
      item_id: item.id,
      comments: comments || undefined
    })
  }

  const handleReject = () => {
    if (!comments.trim()) return
    
    handleAction({
      action: 'reject',
      item_id: item.id,
      comments
    })
  }

  const handleSchedule = () => {
    if (!scheduledDate) return

    const dateTime = new Date(scheduledDate)
    const [hours, minutes] = scheduledTime.split(':')
    dateTime.setHours(parseInt(hours), parseInt(minutes))

    handleAction({
      action: 'schedule',
      item_id: item.id,
      scheduled_time: dateTime.toISOString(),
      comments: comments || undefined
    })
  }

  const handleEdit = () => {
    handleAction({
      action: 'edit',
      item_id: item.id,
      edited_content: {
        title: editedTitle,
        excerpt: editedExcerpt
      },
      comments: comments || undefined
    })
  }

  const buttonSize = showLabels ? 'default' : 'sm'

  return (
    <>
      <div className={cn(
        "flex items-center gap-2",
        showLabels && "flex-col w-full"
      )}>
        <Button
          size={buttonSize}
          variant="default"
          onClick={handleApprove}
          disabled={item.status !== 'pending'}
          className={showLabels ? "w-full" : ""}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {showLabels ? 'Approve' : ''}
        </Button>

        <Button
          size={buttonSize}
          variant="destructive"
          onClick={() => setShowRejectDialog(true)}
          disabled={item.status !== 'pending'}
          className={showLabels ? "w-full" : ""}
        >
          <XCircle className="h-4 w-4 mr-2" />
          {showLabels ? 'Reject' : ''}
        </Button>

        <Button
          size={buttonSize}
          variant="outline"
          onClick={() => setShowScheduleDialog(true)}
          disabled={item.status !== 'pending'}
          className={showLabels ? "w-full" : ""}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          {showLabels ? 'Schedule' : ''}
        </Button>

        <Button
          size={buttonSize}
          variant="outline"
          onClick={() => setShowEditDialog(true)}
          disabled={item.status !== 'pending'}
          className={showLabels ? "w-full" : ""}
        >
          <Edit className="h-4 w-4 mr-2" />
          {showLabels ? 'Edit & Approve' : ''}
        </Button>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Article</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this article. This will help the AI improve.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Rejection Reason *</Label>
              <Textarea
                id="reject-reason"
                placeholder="Enter the reason for rejection..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!comments.trim()}
            >
              Reject Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Article</DialogTitle>
            <DialogDescription>
              Choose when this article should be automatically published.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Publication Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="scheduled-time">Publication Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="scheduled-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="schedule-notes">Notes (Optional)</Label>
              <Textarea
                id="schedule-notes"
                placeholder="Any notes about the scheduling..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSchedule}
              disabled={!scheduledDate}
            >
              Schedule Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit & Approve Article</DialogTitle>
            <DialogDescription>
              Make quick edits to the article before approving it for publication.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="edit-excerpt">Excerpt</Label>
              <Textarea
                id="edit-excerpt"
                value={editedExcerpt}
                onChange={(e) => setEditedExcerpt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="edit-notes">Editorial Notes (Optional)</Label>
              <Textarea
                id="edit-notes"
                placeholder="Notes about the changes made..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>
              Save & Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}