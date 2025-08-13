import { useState } from 'react'
import { AIAgent } from '../types'
import { useUpdateAgentConfig } from '../hooks/useAgentStatus'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Slider } from '@/shared/components/ui/slider'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'
import { Clock, Globe, BarChart, Zap, FileText } from 'lucide-react'

interface AgentConfigDialogProps {
  agent: AIAgent
  onClose: () => void
}

export function AgentConfigDialog({ agent, onClose }: AgentConfigDialogProps) {
  const updateConfig = useUpdateAgentConfig()
  const [config, setConfig] = useState(agent.configuration)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSave = async () => {
    setIsUpdating(true)
    try {
      await updateConfig.mutateAsync({
        agentId: agent.id,
        config
      })
      onClose()
    } finally {
      setIsUpdating(false)
    }
  }

  const updateConfigField = (field: keyof AIAgent['configuration'], value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">
            Configure {agent.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Update Frequency */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <h3 className="font-medium">Update Frequency</h3>
            </div>
            <div className="pl-7">
              <Label>Check for new content every</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="number"
                  value={config.update_frequency}
                  onChange={(e) => updateConfigField('update_frequency', parseInt(e.target.value))}
                  className="w-24"
                  min={5}
                  max={1440}
                />
                <span className="text-sm text-gray-600">minutes</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Minimum: 5 minutes, Maximum: 24 hours (1440 minutes)
              </p>
            </div>
          </div>

          <Separator />

          {/* Quality Threshold */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-gray-500" />
              <h3 className="font-medium">Quality Settings</h3>
            </div>
            <div className="pl-7 space-y-4">
              <div>
                <Label>Minimum Quality Threshold</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[config.quality_threshold]}
                    onValueChange={([value]) => updateConfigField('quality_threshold', value)}
                    min={0}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm font-medium">{config.quality_threshold}%</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Articles below this threshold will be automatically rejected
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-publish High Quality</Label>
                  <p className="text-sm text-gray-500">
                    Automatically publish articles with quality score above 90%
                  </p>
                </div>
                <Switch
                  checked={config.auto_publish}
                  onCheckedChange={(checked) => updateConfigField('auto_publish', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Content Limits */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              <h3 className="font-medium">Content Limits</h3>
            </div>
            <div className="pl-7">
              <Label>Maximum Articles Per Day</Label>
              <Input
                type="number"
                value={config.max_articles_per_day}
                onChange={(e) => updateConfigField('max_articles_per_day', parseInt(e.target.value))}
                className="w-32 mt-2"
                min={1}
                max={100}
              />
              <p className="text-sm text-gray-500 mt-1">
                Prevents the agent from generating too much content
              </p>
            </div>
          </div>

          <Separator />

          {/* Languages */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-500" />
              <h3 className="font-medium">Languages</h3>
            </div>
            <div className="pl-7">
              <Label>Supported Languages</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['en', 'ar', 'hi', 'ur'].map((lang) => (
                  <Badge
                    key={lang}
                    variant={config.languages.includes(lang) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const newLanguages = config.languages.includes(lang)
                        ? config.languages.filter(l => l !== lang)
                        : [...config.languages, lang]
                      updateConfigField('languages', newLanguages)
                    }}
                  >
                    {lang.toUpperCase()}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Click to toggle language support
              </p>
            </div>
          </div>

          <Separator />

          {/* Sources */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-gray-500" />
              <h3 className="font-medium">Content Sources</h3>
            </div>
            <div className="pl-7">
              <Label>Active Sources</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {config.sources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{source}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const newSources = config.sources.filter((_, i) => i !== index)
                        updateConfigField('sources', newSources)
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Manage sources in the Source Manager
              </p>
            </div>
          </div>

          {/* Agent Capabilities */}
          <div className="space-y-4">
            <h3 className="font-medium">Agent Capabilities</h3>
            <div className="flex flex-wrap gap-2">
              {agent.capabilities.map((capability, index) => (
                <Badge key={index} variant="secondary">
                  {capability}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}