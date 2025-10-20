import { useState } from 'react'
import { Trash2, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Textarea } from '@/shared/components/ui/textarea'
import { DataDeletionService, type DataDeletionRequest } from '../services/data-deletion.service'
import { useAuth } from '@/features/auth/context/AuthContext'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'

export function DataDeletionRequestForm() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState<DataDeletionRequest[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all'])
  const [reason, setReason] = useState('')

  const loadRequests = async () => {
    if (!user) return
    try {
      const data = await DataDeletionService.getUserDeletionRequests(user.id)
      setRequests(data)
    } catch (error) {
      console.error('Error loading deletion requests:', error)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      loadRequests()
    }
  }

  const handleCategoryToggle = (category: string) => {
    if (category === 'all') {
      setSelectedCategories(['all'])
    } else {
      const newCategories = selectedCategories.includes(category)
        ? selectedCategories.filter(c => c !== category)
        : [...selectedCategories.filter(c => c !== 'all'), category]

      setSelectedCategories(newCategories.length === 0 ? ['all'] : newCategories)
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to request data deletion')
      return
    }

    setLoading(true)
    try {
      await DataDeletionService.requestDataDeletion(
        user.id,
        reason || undefined,
        selectedCategories
      )

      toast.success('Data deletion request submitted', {
        description: `Your data will be permanently deleted in ${DataDeletionService.POLICY.GRACE_PERIOD} days unless you cancel the request.`,
      })

      setOpen(false)
      setSelectedCategories(['all'])
      setReason('')
      loadRequests()
    } catch (error) {
      console.error('Error submitting deletion request:', error)
      toast.error('Failed to submit deletion request', {
        description: 'Please try again later or contact support.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    if (!user) return

    try {
      await DataDeletionService.cancelDeletionRequest(requestId, user.id)
      toast.success('Deletion request cancelled')
      loadRequests()
    } catch (error) {
      console.error('Error cancelling request:', error)
      toast.error('Failed to cancel deletion request')
    }
  }

  const getStatusIcon = (status: DataDeletionRequest['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'processing': return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      case 'completed': return <CheckCircle2 className="h-4 w-4" />
      case 'failed': return <XCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: DataDeletionRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'completed': return 'bg-green-100 text-green-800 border-green-300'
      case 'failed': return 'bg-red-100 text-red-800 border-red-300'
    }
  }

  const categories = [
    { id: 'all', label: 'All Data', description: 'Delete all personal data' },
    { id: 'reading_history', label: 'Reading History', description: 'Article views and reading patterns' },
    { id: 'bookmarks', label: 'Bookmarks', description: 'Saved articles and collections' },
    { id: 'preferences', label: 'Preferences', description: 'Settings and personalization' },
    { id: 'analytics', label: 'Analytics', description: 'Anonymize usage data (cannot fully delete)' },
  ]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Request Data Deletion
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-light">
            <Trash2 className="h-6 w-6 text-red-600" />
            Request Data Deletion
          </DialogTitle>
          <DialogDescription className="text-base">
            Exercise your right to be forgotten under GDPR. Your data will be permanently deleted after a {DataDeletionService.POLICY.GRACE_PERIOD}-day grace period.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-4">
          {/* Warning */}
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 mb-1">
                  This action cannot be undone
                </p>
                <p className="text-sm text-red-700">
                  Once the grace period expires, your data will be permanently deleted from our systems. You will have {DataDeletionService.POLICY.GRACE_PERIOD} days to cancel this request.
                </p>
              </div>
            </div>
          </Card>

          {/* Category Selection */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">What data would you like to delete?</h4>
            <div className="space-y-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    selectedCategories.includes(category.id)
                      ? 'bg-red-50 border-red-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <Checkbox
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{category.label}</p>
                    <p className="text-xs text-gray-600">{category.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Reason (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Reason (Optional)
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Help us improve by sharing why you're leaving..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Legal Note */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-1">
                  Legal Retention
                </p>
                <p className="text-sm text-blue-700">
                  Some records (consent logs, compliance audit trails) must be retained for 7 years for legal compliance and cannot be deleted.
                </p>
              </div>
            </div>
          </Card>

          {/* Previous Requests */}
          {requests.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Your Deletion Requests</h4>
              <div className="space-y-2">
                {requests.map((request) => (
                  <Card key={request.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(request.status)}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">
                              {new Date(request.request_date).toLocaleDateString()}
                            </p>
                            <Badge variant="outline" className={cn('text-xs', getStatusColor(request.status))}>
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            {request.status === 'pending' && `Scheduled for deletion: ${new Date(request.scheduled_deletion_date).toLocaleDateString()}`}
                            {request.status === 'completed' && request.actual_deletion_date && `Deleted on: ${new Date(request.actual_deletion_date).toLocaleDateString()}`}
                            {request.status === 'processing' && 'Deletion in progress...'}
                            {request.status === 'failed' && 'Request cancelled'}
                          </p>
                        </div>
                      </div>
                      {request.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelRequest(request.id)}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={loading || selectedCategories.length === 0}
            className="gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Submit Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
