/**
 * Story Assignment Panel - Manage story assignments
 * Interface for editors to assign stories to journalists
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { 
  Plus, 
  Clock, 
  User, 
  FileText, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Edit3
} from 'lucide-react';
import { useAssignments, useCreateAssignment, useJournalists } from '../hooks/useEditorialWorkflow';
import { toast } from '@/shared/hooks/use-toast';
import type { CreateAssignmentForm, PriorityLevel } from '../types/editorial.types';

export function StoryAssignmentPanel() {
  const { assignments, isLoading } = useAssignments();
  const { data: journalists } = useJournalists();
  const createAssignment = useCreateAssignment();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState<CreateAssignmentForm>({
    title: '',
    description: '',
    brief: '',
    deadline: '',
    priority: 'medium',
    category: '',
    assigned_to: '',
    estimated_word_count: 500,
    source_leads: [],
    research_notes: ''
  });

  const handleCreateAssignment = async () => {
    if (!newAssignment.title.trim() || !newAssignment.assigned_to) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createAssignment.mutateAsync(newAssignment);
      toast({
        title: 'Assignment Created',
        description: 'Story has been assigned to journalist',
      });
      setIsCreateDialogOpen(false);
      // Reset form
      setNewAssignment({
        title: '',
        description: '',
        brief: '',
        deadline: '',
        priority: 'medium',
        category: '',
        assigned_to: '',
        estimated_word_count: 500,
        source_leads: [],
        research_notes: ''
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create assignment',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-blue-600" />
            Story Assignments
          </h2>
          <p className="text-gray-600 mt-1">Manage story assignments and journalist workload</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <CreateAssignmentDialog 
            newAssignment={newAssignment}
            setNewAssignment={setNewAssignment}
            journalists={journalists || []}
            onSubmit={handleCreateAssignment}
            isSubmitting={createAssignment.isPending}
          />
        </Dialog>
      </div>

      {/* Assignment List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Assignments ({assignments.length})</CardTitle>
          <CardDescription>Current story assignments and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No assignments yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first story assignment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AssignmentCard({ assignment }: { assignment: any }) {
  const isOverdue = assignment.deadline && new Date(assignment.deadline) < new Date();
  const isDueSoon = assignment.deadline && 
    new Date(assignment.deadline) > new Date() && 
    new Date(assignment.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
            <PriorityBadge priority={assignment.priority} />
            <StatusBadge status={assignment.status} />
            {isOverdue && (
              <Badge className="bg-red-100 text-red-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
            {isDueSoon && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <Clock className="h-3 w-3 mr-1" />
                Due Soon
              </Badge>
            )}
          </div>
          
          <p className="text-gray-600 mb-3">{assignment.description}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{assignment.journalist?.full_name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>
                {assignment.deadline 
                  ? new Date(assignment.deadline).toLocaleDateString()
                  : 'No deadline'
                }
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>{assignment.category}</span>
            </div>
            {assignment.estimated_word_count && (
              <span>{assignment.estimated_word_count} words</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CreateAssignmentDialog({ 
  newAssignment, 
  setNewAssignment, 
  journalists, 
  onSubmit, 
  isSubmitting 
}: {
  newAssignment: CreateAssignmentForm;
  setNewAssignment: (assignment: CreateAssignmentForm) => void;
  journalists: any[];
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create Story Assignment</DialogTitle>
        <DialogDescription>
          Assign a new story to a journalist with all necessary details
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Story Title *</Label>
            <Input
              id="title"
              placeholder="Breaking: Dubai announces..."
              value={newAssignment.title}
              onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select 
              value={newAssignment.category} 
              onValueChange={(value) => setNewAssignment({ ...newAssignment, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breaking">Breaking News</SelectItem>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="lifestyle">Lifestyle</SelectItem>
                <SelectItem value="tourism">Tourism</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Brief description of the story..."
            value={newAssignment.description}
            onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
            rows={2}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="brief">Editorial Brief</Label>
          <Textarea
            id="brief"
            placeholder="Angle, key points to cover, target audience..."
            value={newAssignment.brief}
            onChange={(e) => setNewAssignment({ ...newAssignment, brief: e.target.value })}
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assign to Journalist *</Label>
            <Select 
              value={newAssignment.assigned_to} 
              onValueChange={(value) => setNewAssignment({ ...newAssignment, assigned_to: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select journalist" />
              </SelectTrigger>
              <SelectContent>
                {journalists.map((journalist) => (
                  <SelectItem key={journalist.id} value={journalist.id}>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={journalist.avatar_url} />
                        <AvatarFallback>{journalist.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{journalist.full_name}</span>
                      {journalist.specialization && (
                        <Badge variant="outline" className="text-xs">
                          {journalist.specialization}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select 
              value={newAssignment.priority} 
              onValueChange={(value: PriorityLevel) => setNewAssignment({ ...newAssignment, priority: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={newAssignment.deadline}
              onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="estimated_word_count">Estimated Word Count</Label>
          <Input
            id="estimated_word_count"
            type="number"
            placeholder="500"
            value={newAssignment.estimated_word_count}
            onChange={(e) => setNewAssignment({ ...newAssignment, estimated_word_count: parseInt(e.target.value) || 0 })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="research_notes">Research Notes & Sources</Label>
          <Textarea
            id="research_notes"
            placeholder="Initial research, source contacts, background information..."
            value={newAssignment.research_notes}
            onChange={(e) => setNewAssignment({ ...newAssignment, research_notes: e.target.value })}
            rows={3}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={() => setNewAssignment({
          title: '',
          description: '',
          brief: '',
          deadline: '',
          priority: 'medium',
          category: '',
          assigned_to: '',
          estimated_word_count: 500,
          source_leads: [],
          research_notes: ''
        })}>
          Clear
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitting || !newAssignment.title.trim() || !newAssignment.assigned_to}
        >
          {isSubmitting ? 'Creating...' : 'Create Assignment'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// Helper components
function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-800' },
    accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800' },
    in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.assigned;

  return (
    <Badge className={`text-xs ${config.color}`}>
      {config.label}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  const priorityConfig = {
    low: { label: 'Low', color: 'bg-green-100 text-green-800' },
    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
    urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800' }
  };

  const config = priorityConfig[priority];

  return (
    <Badge className={`text-xs ${config.color}`}>
      {config.label}
    </Badge>
  );
}