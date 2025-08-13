import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Switch } from '@/shared/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Plus, Edit, Trash2, Play, Pause, Settings, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { QualityRule, QualityThresholds, qualityRulesEngine } from '@/shared/services/quality-control/qualityRules'

interface QualityRulesManagerProps {
  className?: string
}

interface RuleFormData {
  name: string
  description: string
  rule_type: QualityRule['rule_type']
  category: QualityRule['category']
  content_types: string[]
  geographic_scope: string[]
  priority: QualityRule['priority']
  auto_action: QualityRule['auto_action']
  conditions: Array<{
    field: string
    operator: string
    value: any
    weight: number
  }>
  actions: Array<{
    action_type: string
    parameters: Record<string, any>
  }>
}

export const QualityRulesManager: React.FC<QualityRulesManagerProps> = ({ className }) => {
  const [rules, setRules] = useState<QualityRule[]>([])
  const [thresholds, setThresholds] = useState<Record<string, QualityThresholds>>({})
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<QualityRule | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    description: '',
    rule_type: 'threshold',
    category: 'quality',
    content_types: [],
    geographic_scope: [],
    priority: 'medium',
    auto_action: 'none',
    conditions: [],
    actions: []
  })

  useEffect(() => {
    loadRulesAndThresholds()
  }, [])

  const loadRulesAndThresholds = async () => {
    try {
      setLoading(true)
      
      await qualityRulesEngine.initialize()
      
      // Load rules from engine (would need to implement getter)
      // For now, we'll simulate
      const sampleRules: QualityRule[] = [
        {
          id: '1',
          name: 'Minimum Overall Quality Score',
          description: 'Content must meet minimum overall quality threshold',
          rule_type: 'threshold',
          category: 'quality',
          content_types: ['all'],
          geographic_scope: ['all'],
          priority: 'high',
          active: true,
          auto_action: 'flag',
          conditions: [{
            field: 'assessment.overall_score',
            operator: 'gte',
            value: 70,
            weight: 1.0
          }],
          actions: [{
            action_type: 'add_flag',
            parameters: { flag_type: 'low_quality', severity: 'medium' }
          }],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'system'
        },
        {
          id: '2',
          name: 'Cultural Sensitivity Check',
          description: 'Content must be culturally appropriate for UAE audience',
          rule_type: 'threshold',
          category: 'cultural',
          content_types: ['all'],
          geographic_scope: ['uae', 'gcc'],
          priority: 'critical',
          active: true,
          auto_action: 'review',
          conditions: [{
            field: 'assessment.cultural_sensitivity_score',
            operator: 'gte',
            value: 85,
            weight: 1.0
          }],
          actions: [{
            action_type: 'assign_reviewer',
            parameters: { reviewer_type: 'cultural_expert' }
          }],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'system'
        }
      ]
      
      setRules(sampleRules)
      
    } catch (error) {
      console.error('Error loading rules and thresholds:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = async () => {
    try {
      const newRule = await qualityRulesEngine.createRule({
        ...formData,
        active: true,
        created_by: 'admin' // Would get from auth context
      })
      
      setRules([...rules, newRule])
      setShowCreateDialog(false)
      resetForm()
    } catch (error) {
      console.error('Error creating rule:', error)
    }
  }

  const handleUpdateRule = async (ruleId: string, updates: Partial<QualityRule>) => {
    try {
      const updatedRule = await qualityRulesEngine.updateRule(ruleId, updates)
      setRules(rules.map(rule => rule.id === ruleId ? updatedRule : rule))
    } catch (error) {
      console.error('Error updating rule:', error)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await qualityRulesEngine.deleteRule(ruleId)
      setRules(rules.filter(rule => rule.id !== ruleId))
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  const handleToggleRule = async (ruleId: string, active: boolean) => {
    await handleUpdateRule(ruleId, { active })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rule_type: 'threshold',
      category: 'quality',
      content_types: [],
      geographic_scope: [],
      priority: 'medium',
      auto_action: 'none',
      conditions: [],
      actions: []
    })
    setEditingRule(null)
  }

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...formData.conditions,
        { field: '', operator: 'gte', value: '', weight: 1.0 }
      ]
    })
  }

  const updateCondition = (index: number, field: string, value: any) => {
    const newConditions = [...formData.conditions]
    newConditions[index] = { ...newConditions[index], [field]: value }
    setFormData({ ...formData, conditions: newConditions })
  }

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index)
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'quality':
        return <CheckCircle2 className="h-4 w-4" />
      case 'moderation':
        return <AlertTriangle className="h-4 w-4" />
      case 'cultural':
        return <Settings className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Settings className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading quality rules...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quality Rules Manager</h2>
          <p className="text-muted-foreground">
            Configure and manage quality control rules
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Quality Rule</DialogTitle>
              <DialogDescription>
                Configure a new quality control rule for content evaluation
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter rule name"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this rule checks for"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="rule_type">Rule Type</Label>
                  <Select value={formData.rule_type} onValueChange={(value) => setFormData({ ...formData, rule_type: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="threshold">Threshold</SelectItem>
                      <SelectItem value="condition">Condition</SelectItem>
                      <SelectItem value="pattern">Pattern</SelectItem>
                      <SelectItem value="composite">Composite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quality">Quality</SelectItem>
                      <SelectItem value="moderation">Moderation</SelectItem>
                      <SelectItem value="duplicate">Duplicate</SelectItem>
                      <SelectItem value="fact_check">Fact Check</SelectItem>
                      <SelectItem value="seo">SEO</SelectItem>
                      <SelectItem value="brand_voice">Brand Voice</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="auto_action">Auto Action</Label>
                  <Select value={formData.auto_action} onValueChange={(value) => setFormData({ ...formData, auto_action: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="approve">Approve</SelectItem>
                      <SelectItem value="reject">Reject</SelectItem>
                      <SelectItem value="flag">Flag</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Conditions</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Condition
                  </Button>
                </div>
                
                {formData.conditions.map((condition, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 mb-2">
                    <Input
                      placeholder="Field"
                      value={condition.field}
                      onChange={(e) => updateCondition(index, 'field', e.target.value)}
                    />
                    <Select value={condition.operator} onValueChange={(value) => updateCondition(index, 'operator', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gte">≥</SelectItem>
                        <SelectItem value="lte">≤</SelectItem>
                        <SelectItem value="eq">=</SelectItem>
                        <SelectItem value="neq">≠</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Value"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Weight"
                      min="0"
                      max="1"
                      step="0.1"
                      value={condition.weight}
                      onChange={(e) => updateCondition(index, 'weight', parseFloat(e.target.value))}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => removeCondition(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRule}>
                Create Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList>
          <TabsTrigger value="rules">Active Rules</TabsTrigger>
          <TabsTrigger value="thresholds">Quality Thresholds</TabsTrigger>
          <TabsTrigger value="performance">Rule Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {/* Rules Table */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Rules</CardTitle>
              <CardDescription>
                {rules.filter(r => r.active).length} active rules, {rules.filter(r => !r.active).length} inactive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Content Types</TableHead>
                    <TableHead>Auto Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-muted-foreground">{rule.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getCategoryIcon(rule.category)}
                          <span className="ml-2 capitalize">{rule.category}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(rule.priority) as any}>
                          {rule.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {rule.content_types.slice(0, 2).map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                          {rule.content_types.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{rule.content_types.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{rule.auto_action}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.active}
                          onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRule(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thresholds" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Quality thresholds determine the minimum acceptable scores for each content type. 
              Changes will affect future content evaluation.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {['news', 'tourism', 'government', 'events', 'practical'].map((contentType) => (
              <Card key={contentType}>
                <CardHeader>
                  <CardTitle className="capitalize">{contentType} Content Thresholds</CardTitle>
                  <CardDescription>
                    Quality thresholds for {contentType} content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Overall Score</Label>
                      <Input type="number" min="0" max="100" defaultValue="70" />
                    </div>
                    <div>
                      <Label>Grammar Score</Label>
                      <Input type="number" min="0" max="100" defaultValue="75" />
                    </div>
                    <div>
                      <Label>Cultural Sensitivity</Label>
                      <Input type="number" min="0" max="100" defaultValue="85" />
                    </div>
                    <div>
                      <Label>Auto Approve Threshold</Label>
                      <Input type="number" min="0" max="100" defaultValue="85" />
                    </div>
                    <div>
                      <Label>Manual Review Threshold</Label>
                      <Input type="number" min="0" max="100" defaultValue="60" />
                    </div>
                    <div>
                      <Label>Auto Reject Threshold</Label>
                      <Input type="number" min="0" max="100" defaultValue="40" />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline">Update Thresholds</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Most Triggered Rules</CardTitle>
                <CardDescription>Rules that trigger most frequently</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rules.slice(0, 5).map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between">
                      <span className="text-sm">{rule.name}</span>
                      <Badge variant="outline">{Math.floor(Math.random() * 50)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rule Effectiveness</CardTitle>
                <CardDescription>How well rules are performing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rules.slice(0, 5).map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between">
                      <span className="text-sm">{rule.name}</span>
                      <Badge variant={Math.random() > 0.5 ? "default" : "secondary"}>
                        {(Math.random() * 100).toFixed(1)}% accurate
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default QualityRulesManager