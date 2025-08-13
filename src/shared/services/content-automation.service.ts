// Automated Content Management System
// Handles content creation, scheduling, approval workflows, and distribution

import { supabase } from '@/shared/lib/supabase'
import { ExternalAPIsService } from './external-apis'

export interface ContentSchedule {
  id: string
  content_type: 'news' | 'tourism' | 'government' | 'general'
  title: string
  title_ar?: string
  content: string
  content_ar?: string
  summary: string
  summary_ar?: string
  category: string
  tags: string[]
  scheduled_at: string
  status: 'scheduled' | 'published' | 'failed' | 'cancelled'
  author_id: string
  image_url?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ContentTemplate {
  id: string
  name: string
  name_ar?: string
  description: string
  content_type: string
  template_data: {
    title_template: string
    content_template: string
    default_tags: string[]
    default_category: string
    required_fields: string[]
  }
  is_active: boolean
  created_by: string
  created_at: string
}

export interface ApprovalWorkflow {
  id: string
  content_id: string
  content_type: string
  workflow_step: number
  approver_id: string
  status: 'pending' | 'approved' | 'rejected'
  comments?: string
  approved_at?: string
  created_at: string
}

export interface ContentRule {
  id: string
  name: string
  description: string
  rule_type: 'auto_publish' | 'auto_categorize' | 'auto_tag' | 'content_filter'
  conditions: Record<string, any>
  actions: Record<string, any>
  is_active: boolean
  priority: number
  created_by: string
  created_at: string
}

export class ContentAutomationService {
  // Content Scheduling System
  static async scheduleContent(contentData: Partial<ContentSchedule>): Promise<ContentSchedule> {
    try {
      const { data, error } = await supabase
        .from('content_schedule')
        .insert({
          ...contentData,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to schedule content:', error)
      throw error
    }
  }

  static async getScheduledContent(filters?: {
    content_type?: string
    status?: string
    date_from?: string
    date_to?: string
  }): Promise<ContentSchedule[]> {
    try {
      let query = supabase
        .from('content_schedule')
        .select('*')
        .order('scheduled_at', { ascending: true })

      if (filters?.content_type) {
        query = query.eq('content_type', filters.content_type)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.date_from) {
        query = query.gte('scheduled_at', filters.date_from)
      }
      if (filters?.date_to) {
        query = query.lte('scheduled_at', filters.date_to)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get scheduled content:', error)
      return []
    }
  }

  // Process scheduled content for publishing
  static async processScheduledContent(): Promise<{
    processed: number
    published: number
    failed: number
    errors: string[]
  }> {
    const result = {
      processed: 0,
      published: 0,
      failed: 0,
      errors: [] as string[]
    }

    try {
      // Get content scheduled for now or earlier
      const now = new Date().toISOString()
      const { data: scheduledContent } = await supabase
        .from('content_schedule')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_at', now)

      if (!scheduledContent || scheduledContent.length === 0) {
        return result
      }

      result.processed = scheduledContent.length

      for (const content of scheduledContent) {
        try {
          // Apply content rules before publishing
          const processedContent = await this.applyContentRules(content)
          
          // Check if content needs approval
          const needsApproval = await this.requiresApproval(processedContent)
          
          if (needsApproval) {
            await this.createApprovalWorkflow(processedContent)
            continue
          }

          // Publish content
          await this.publishContent(processedContent)
          
          // Update schedule status
          await supabase
            .from('content_schedule')
            .update({
              status: 'published',
              updated_at: new Date().toISOString()
            })
            .eq('id', content.id)

          result.published++
        } catch (error) {
          result.failed++
          result.errors.push(`Content ${content.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          
          // Update schedule status to failed
          await supabase
            .from('content_schedule')
            .update({
              status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', content.id)
        }
      }

      return result
    } catch (error) {
      result.errors.push(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }

  // Content Templates System
  static async createTemplate(templateData: Partial<ContentTemplate>): Promise<ContentTemplate> {
    try {
      const { data, error } = await supabase
        .from('content_templates')
        .insert({
          ...templateData,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to create template:', error)
      throw error
    }
  }

  static async getTemplates(contentType?: string): Promise<ContentTemplate[]> {
    try {
      let query = supabase
        .from('content_templates')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (contentType) {
        query = query.eq('content_type', contentType)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get templates:', error)
      return []
    }
  }

  static async generateContentFromTemplate(
    templateId: string,
    data: Record<string, any>
  ): Promise<Partial<ContentSchedule>> {
    try {
      const { data: template, error } = await supabase
        .from('content_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error) throw error

      // Generate content using template
      const title = this.processTemplate(template.template_data.title_template, data)
      const content = this.processTemplate(template.template_data.content_template, data)

      return {
        content_type: template.content_type as any,
        title,
        content,
        summary: content.substring(0, 200) + '...',
        category: template.template_data.default_category,
        tags: [...template.template_data.default_tags, ...(data.additional_tags || [])],
        metadata: {
          template_id: templateId,
          generation_data: data
        }
      }
    } catch (error) {
      console.error('Failed to generate content from template:', error)
      throw error
    }
  }

  private static processTemplate(template: string, data: Record<string, any>): string {
    let processed = template
    
    // Replace placeholders with actual data
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      processed = processed.replace(new RegExp(placeholder, 'g'), String(value))
    })

    return processed
  }

  // Approval Workflow System
  static async createApprovalWorkflow(content: ContentSchedule): Promise<ApprovalWorkflow> {
    try {
      // Get the first approver based on content type and rules
      const approverId = await this.getNextApprover(content)

      const { data, error } = await supabase
        .from('approval_workflows')
        .insert({
          content_id: content.id,
          content_type: content.content_type,
          workflow_step: 1,
          approver_id: approverId,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Notify approver
      await this.notifyApprover(approverId, content)

      return data
    } catch (error) {
      console.error('Failed to create approval workflow:', error)
      throw error
    }
  }

  static async processApproval(
    workflowId: string,
    approverId: string,
    decision: 'approved' | 'rejected',
    comments?: string
  ): Promise<void> {
    try {
      // Update workflow status
      await supabase
        .from('approval_workflows')
        .update({
          status: decision,
          comments,
          approved_at: new Date().toISOString()
        })
        .eq('id', workflowId)
        .eq('approver_id', approverId)

      // Get workflow details
      const { data: workflow } = await supabase
        .from('approval_workflows')
        .select('*, content_schedule(*)')
        .eq('id', workflowId)
        .single()

      if (!workflow) throw new Error('Workflow not found')

      if (decision === 'approved') {
        // Check if there are more approval steps
        const hasMoreSteps = await this.hasMoreApprovalSteps(workflow)
        
        if (hasMoreSteps) {
          // Create next approval step
          const nextApproverId = await this.getNextApprover(workflow.content_schedule, workflow.workflow_step + 1)
          await this.createApprovalWorkflow({
            ...workflow.content_schedule,
            id: workflow.content_id
          })
        } else {
          // Final approval - publish content
          await this.publishContent(workflow.content_schedule)
          
          // Update schedule status
          await supabase
            .from('content_schedule')
            .update({
              status: 'published',
              updated_at: new Date().toISOString()
            })
            .eq('id', workflow.content_id)
        }
      } else {
        // Rejected - update schedule status
        await supabase
          .from('content_schedule')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', workflow.content_id)
      }
    } catch (error) {
      console.error('Failed to process approval:', error)
      throw error
    }
  }

  // Content Rules Engine
  static async createContentRule(ruleData: Partial<ContentRule>): Promise<ContentRule> {
    try {
      const { data, error } = await supabase
        .from('content_rules')
        .insert({
          ...ruleData,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to create content rule:', error)
      throw error
    }
  }

  static async applyContentRules(content: ContentSchedule): Promise<ContentSchedule> {
    try {
      // Get active rules sorted by priority
      const { data: rules } = await supabase
        .from('content_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })

      if (!rules || rules.length === 0) {
        return content
      }

      let processedContent = { ...content }

      for (const rule of rules) {
        if (this.evaluateRuleConditions(rule, processedContent)) {
          processedContent = this.applyRuleActions(rule, processedContent)
        }
      }

      return processedContent
    } catch (error) {
      console.error('Failed to apply content rules:', error)
      return content
    }
  }

  private static evaluateRuleConditions(rule: ContentRule, content: ContentSchedule): boolean {
    try {
      const conditions = rule.conditions

      // Check content type condition
      if (conditions.content_type && conditions.content_type !== content.content_type) {
        return false
      }

      // Check category condition
      if (conditions.category && conditions.category !== content.category) {
        return false
      }

      // Check tag conditions
      if (conditions.required_tags && Array.isArray(conditions.required_tags)) {
        const hasRequiredTags = conditions.required_tags.every((tag: string) =>
          content.tags.includes(tag)
        )
        if (!hasRequiredTags) return false
      }

      // Check keyword conditions
      if (conditions.keywords && Array.isArray(conditions.keywords)) {
        const text = `${content.title} ${content.content}`.toLowerCase()
        const hasKeywords = conditions.keywords.some((keyword: string) =>
          text.includes(keyword.toLowerCase())
        )
        if (!hasKeywords) return false
      }

      return true
    } catch (error) {
      console.error('Failed to evaluate rule conditions:', error)
      return false
    }
  }

  private static applyRuleActions(rule: ContentRule, content: ContentSchedule): ContentSchedule {
    try {
      const actions = rule.actions
      let updatedContent = { ...content }

      // Auto-publish action
      if (actions.auto_publish === true) {
        updatedContent.metadata = {
          ...updatedContent.metadata,
          auto_publish: true
        }
      }

      // Auto-categorize action
      if (actions.set_category) {
        updatedContent.category = actions.set_category
      }

      // Add tags action
      if (actions.add_tags && Array.isArray(actions.add_tags)) {
        updatedContent.tags = [...new Set([...updatedContent.tags, ...actions.add_tags])]
      }

      // Set priority action
      if (actions.set_priority) {
        updatedContent.metadata = {
          ...updatedContent.metadata,
          priority: actions.set_priority
        }
      }

      return updatedContent
    } catch (error) {
      console.error('Failed to apply rule actions:', error)
      return content
    }
  }

  // Publishing System
  private static async publishContent(content: ContentSchedule): Promise<void> {
    try {
      const tableName = this.getContentTable(content.content_type)
      
      // Prepare content data for the specific table
      const contentData = this.prepareContentForPublishing(content)

      const { error } = await supabase
        .from(tableName)
        .insert(contentData)

      if (error) throw error

      // Log activity
      await this.logActivity({
        action: 'content_published',
        content_id: content.id,
        content_type: content.content_type,
        user_id: content.author_id
      })
    } catch (error) {
      console.error('Failed to publish content:', error)
      throw error
    }
  }

  private static getContentTable(contentType: string): string {
    const tableMap: Record<string, string> = {
      'news': 'news_articles',
      'tourism': 'tourism_attractions',
      'government': 'government_services',
      'general': 'content_items'
    }
    return tableMap[contentType] || 'content_items'
  }

  private static prepareContentForPublishing(content: ContentSchedule): Record<string, any> {
    const baseData = {
      title: content.title,
      title_ar: content.title_ar,
      summary: content.summary,
      summary_ar: content.summary_ar,
      content: content.content,
      content_ar: content.content_ar,
      category: content.category,
      tags: content.tags,
      image_url: content.image_url,
      published_at: new Date().toISOString(),
      is_active: true,
      metadata: content.metadata
    }

    // Add content-type specific fields
    switch (content.content_type) {
      case 'news':
        return {
          ...baseData,
          source_name: 'MyDub.AI',
          source_id: 'mydub-ai',
          author: content.metadata?.author || 'MyDub.AI',
          is_breaking: content.metadata?.is_breaking || false,
          sentiment: content.metadata?.sentiment || 'neutral',
          language: 'en'
        }
      case 'tourism':
        return {
          ...baseData,
          name: content.title,
          name_ar: content.title_ar,
          description: content.content,
          description_ar: content.content_ar,
          is_featured: content.metadata?.is_featured || false
        }
      case 'government':
        return {
          ...baseData,
          description: content.content,
          description_ar: content.content_ar,
          department_id: content.metadata?.department_id,
          is_online: content.metadata?.is_online || false
        }
      default:
        return baseData
    }
  }

  // Helper methods
  private static async getNextApprover(
    content: ContentSchedule,
    step: number = 1
  ): Promise<string> {
    try {
      // Get approval configuration based on content type
      const { data: config } = await supabase
        .from('approval_configs')
        .select('approvers')
        .eq('content_type', content.content_type)
        .eq('step', step)
        .single()

      if (config && config.approvers && config.approvers.length > 0) {
        return config.approvers[0] // Return first approver
      }

      // Fallback to admin users
      const { data: adminUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)

      return adminUsers?.[0]?.id || 'system'
    } catch (error) {
      console.error('Failed to get next approver:', error)
      return 'system'
    }
  }

  private static async requiresApproval(content: ContentSchedule): Promise<boolean> {
    // Check if content type requires approval
    const approvalRequiredTypes = ['news', 'government']
    if (!approvalRequiredTypes.includes(content.content_type)) {
      return false
    }

    // Check if auto-publish is enabled for this content
    if (content.metadata?.auto_publish === true) {
      return false
    }

    return true
  }

  private static async hasMoreApprovalSteps(workflow: ApprovalWorkflow): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('approval_configs')
        .select('step')
        .eq('content_type', workflow.content_type)
        .gt('step', workflow.workflow_step)
        .limit(1)

      return (data && data.length > 0) || false
    } catch (error) {
      return false
    }
  }

  private static async notifyApprover(approverId: string, content: ContentSchedule): Promise<void> {
    try {
      // Create notification in database
      await supabase
        .from('notifications')
        .insert({
          user_id: approverId,
          type: 'approval_request',
          title: 'Content Approval Required',
          message: `Please review and approve: ${content.title}`,
          data: {
            content_id: content.id,
            content_type: content.content_type
          },
          created_at: new Date().toISOString()
        })

      // TODO: Send email notification if configured
    } catch (error) {
      console.error('Failed to notify approver:', error)
    }
  }

  private static async logActivity(activity: {
    action: string
    content_id: string
    content_type: string
    user_id: string
  }): Promise<void> {
    try {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: activity.user_id,
          action: activity.action,
          resource: 'content',
          resource_id: activity.content_id,
          details: {
            content_type: activity.content_type
          },
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }

  // Automated Content Generation
  static async generateContentFromExternalSources(): Promise<{
    generated: number
    scheduled: number
    errors: string[]
  }> {
    const result = {
      generated: 0,
      scheduled: 0,
      errors: [] as string[]
    }

    try {
      // Get fresh news from external APIs
      const latestNews = await ExternalAPIsService.fetchDubaiNews()
      
      // Filter for news suitable for automatic content generation
      const suitableNews = latestNews.filter(article => 
        article.category === 'government' || 
        article.category === 'business' ||
        article.is_breaking
      )

      result.generated = suitableNews.length

      // Create scheduled content from news articles
      for (const newsItem of suitableNews) {
        try {
          await this.scheduleContent({
            content_type: 'news',
            title: newsItem.title,
            title_ar: newsItem.title_ar,
            content: newsItem.content,
            content_ar: newsItem.content_ar,
            summary: newsItem.summary,
            summary_ar: newsItem.summary_ar,
            category: newsItem.category,
            tags: newsItem.tags,
            scheduled_at: new Date(Date.now() + 60000).toISOString(), // Schedule for 1 minute from now
            author_id: 'system',
            image_url: newsItem.image_url,
            metadata: {
              source: 'external_api',
              original_id: newsItem.id,
              auto_generated: true
            }
          })

          result.scheduled++
        } catch (error) {
          result.errors.push(`Failed to schedule content from ${newsItem.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return result
    } catch (error) {
      result.errors.push(`Content generation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }

  // Start automated content processing (background job)
  static async startAutomatedProcessing(): Promise<void> {
    const processInterval = 5 * 60 * 1000 // 5 minutes
    const generationInterval = 30 * 60 * 1000 // 30 minutes

    // Process scheduled content every 5 minutes
    const processScheduled = async () => {
      try {
        const result = await this.processScheduledContent()
        } catch (error) {
        console.error('Scheduled content processing failed:', error)
      }
    }

    // Generate new content every 30 minutes
    const generateContent = async () => {
      try {
        const result = await this.generateContentFromExternalSources()
        } catch (error) {
        console.error('Content generation failed:', error)
      }
    }

    // Start intervals
    setInterval(processScheduled, processInterval)
    setInterval(generateContent, generationInterval)

    // Run initial processing
    await processScheduled()
    await generateContent()

    }

  // Get automation statistics
  static async getAutomationStats(): Promise<{
    scheduledContent: number
    pendingApprovals: number
    publishedToday: number
    activeRules: number
    templateCount: number
  }> {
    try {
      const today = new Date().toISOString().split('T')[0]

      const [
        scheduledResult,
        approvalsResult,
        publishedResult,
        rulesResult,
        templatesResult
      ] = await Promise.all([
        supabase.from('content_schedule').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
        supabase.from('approval_workflows').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('content_schedule').select('id', { count: 'exact', head: true }).eq('status', 'published').gte('updated_at', today),
        supabase.from('content_rules').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('content_templates').select('id', { count: 'exact', head: true }).eq('is_active', true)
      ])

      return {
        scheduledContent: scheduledResult.count || 0,
        pendingApprovals: approvalsResult.count || 0,
        publishedToday: publishedResult.count || 0,
        activeRules: rulesResult.count || 0,
        templateCount: templatesResult.count || 0
      }
    } catch (error) {
      console.error('Failed to get automation stats:', error)
      return {
        scheduledContent: 0,
        pendingApprovals: 0,
        publishedToday: 0,
        activeRules: 0,
        templateCount: 0
      }
    }
  }
}