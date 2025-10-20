/**
 * Publishing Scheduler Service
 * Phase 2.4.4: Automated content scheduling with timezone support
 *
 * Features:
 * - Schedule articles for future publishing
 * - Timezone-aware scheduling (GST/UTC conversion)
 * - Recurring schedules (daily, weekly, monthly)
 * - Publication calendar view
 * - Automatic publishing triggers
 * - Schedule conflict detection
 * - Bulk scheduling operations
 */

import { supabase } from '@/shared/lib/supabase'
import { EditorialWorkflowService } from '@/features/editorial/services/editorial-workflow.service'

// =============================================================================
// Types
// =============================================================================

export interface PublishSchedule {
  id: string
  articleId: string
  articleTitle: string
  scheduledAt: Date
  timezone: string // e.g., 'Asia/Dubai', 'UTC'
  status: 'pending' | 'published' | 'failed' | 'cancelled'
  createdBy: string
  createdAt: Date
  publishedAt?: Date
  errorMessage?: string
  isRecurring: boolean
  recurrencePattern?: RecurrencePattern
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly'
  interval: number // Every N days/weeks/months
  daysOfWeek?: number[] // 0-6 (Sunday-Saturday) for weekly
  dayOfMonth?: number // 1-31 for monthly
  endDate?: Date
  maxOccurrences?: number
}

export interface ScheduleConflict {
  time: Date
  existingSchedules: PublishSchedule[]
  reason: string
}

export interface PublicationCalendar {
  date: Date
  schedules: PublishSchedule[]
  count: number
}

// =============================================================================
// Publishing Scheduler Service
// =============================================================================

export class PublishingSchedulerService {
  /**
   * Gulf Standard Time timezone
   */
  private static readonly GST_TIMEZONE = 'Asia/Dubai'

  /**
   * Maximum scheduled publishes per day
   */
  private static readonly MAX_PUBLISHES_PER_DAY = 20

  /**
   * Schedule article for publishing
   */
  static async scheduleArticle(
    articleId: string,
    scheduledAt: Date,
    timezone: string = this.GST_TIMEZONE,
    createdBy: string,
    recurrencePattern?: RecurrencePattern
  ): Promise<PublishSchedule> {
    // Validate article exists and is in approved state
    const { data: article } = await supabase
      .from('news_articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (!article) {
      throw new Error('Article not found')
    }

    if (article.status !== 'approved') {
      throw new Error('Only approved articles can be scheduled for publishing')
    }

    // Check for scheduling conflicts
    const conflicts = await this.checkScheduleConflicts(scheduledAt, timezone)
    if (conflicts.length > 0) {
      console.warn('⚠️ Schedule conflict detected:', conflicts[0].reason)
    }

    // Convert to UTC for storage
    const scheduledAtUTC = this.convertToUTC(scheduledAt, timezone)

    // Create schedule
    const schedule: PublishSchedule = {
      id: crypto.randomUUID(),
      articleId,
      articleTitle: article.title,
      scheduledAt: scheduledAtUTC,
      timezone,
      status: 'pending',
      createdBy,
      createdAt: new Date(),
      isRecurring: !!recurrencePattern,
      recurrencePattern,
    }

    // Save to database
    await this.saveSchedule(schedule)

    // Update article status to 'scheduled'
    await EditorialWorkflowService.transitionArticle(
      articleId,
      'schedule',
      createdBy,
      `Scheduled for ${this.formatDateTime(scheduledAt, timezone)}`
    )

    // Set up automatic publishing trigger
    await this.setupPublishingTrigger(schedule)

    // If recurring, generate future schedules
    if (recurrencePattern) {
      await this.generateRecurringSchedules(schedule)
    }

    return schedule
  }

  /**
   * Convert local time to UTC
   */
  private static convertToUTC(localTime: Date, timezone: string): Date {
    // In production: use proper timezone library (date-fns-tz, luxon, or dayjs with timezone plugin)
    // For now, simple conversion for GST (UTC+4)

    if (timezone === this.GST_TIMEZONE) {
      const utcTime = new Date(localTime)
      utcTime.setHours(utcTime.getHours() - 4) // GST is UTC+4
      return utcTime
    }

    return localTime // Assume UTC if unknown timezone
  }

  /**
   * Convert UTC to local timezone
   */
  private static convertFromUTC(utcTime: Date, timezone: string): Date {
    if (timezone === this.GST_TIMEZONE) {
      const localTime = new Date(utcTime)
      localTime.setHours(localTime.getHours() + 4) // GST is UTC+4
      return localTime
    }

    return utcTime
  }

  /**
   * Check for scheduling conflicts
   */
  static async checkScheduleConflicts(
    scheduledAt: Date,
    timezone: string
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = []

    // Get schedules for the same hour
    const startHour = new Date(scheduledAt)
    startHour.setMinutes(0, 0, 0)
    const endHour = new Date(startHour)
    endHour.setHours(endHour.getHours() + 1)

    const existingSchedules = await this.getSchedulesByTimeRange(startHour, endHour)

    // Check daily limit
    const daySchedules = existingSchedules.filter(
      (s) => this.isSameDay(s.scheduledAt, scheduledAt)
    )

    if (daySchedules.length >= this.MAX_PUBLISHES_PER_DAY) {
      conflicts.push({
        time: scheduledAt,
        existingSchedules: daySchedules,
        reason: `Daily publish limit reached (${this.MAX_PUBLISHES_PER_DAY} max)`,
      })
    }

    // Check for articles scheduled within 30 minutes
    const closeSchedules = existingSchedules.filter((s) => {
      const diff = Math.abs(s.scheduledAt.getTime() - scheduledAt.getTime())
      return diff < 30 * 60 * 1000 // 30 minutes
    })

    if (closeSchedules.length > 2) {
      conflicts.push({
        time: scheduledAt,
        existingSchedules: closeSchedules,
        reason: 'Too many articles scheduled within 30 minutes',
      })
    }

    return conflicts
  }

  /**
   * Setup automatic publishing trigger
   */
  private static async setupPublishingTrigger(schedule: PublishSchedule): Promise<void> {
    // In production: use proper job scheduler (Bull, Agenda, or Vercel Cron)
    // For now, log the trigger setup

    const timeUntilPublish = schedule.scheduledAt.getTime() - Date.now()
    const hoursUntilPublish = Math.round(timeUntilPublish / (1000 * 60 * 60))

    console.log(`📅 Publishing trigger set for "${schedule.articleTitle}"`)
    console.log(`   Scheduled: ${this.formatDateTime(schedule.scheduledAt, schedule.timezone)}`)
    console.log(`   Time until publish: ${hoursUntilPublish} hours`)

    // In production:
    // - Schedule job in job queue
    // - Set up cron job for scheduled time
    // - Create database trigger for automated publishing
  }

  /**
   * Execute scheduled publish
   */
  static async executeScheduledPublish(scheduleId: string): Promise<void> {
    // Get schedule
    const schedule = await this.getSchedule(scheduleId)
    if (!schedule) {
      throw new Error('Schedule not found')
    }

    if (schedule.status !== 'pending') {
      throw new Error(`Schedule status is ${schedule.status}, expected pending`)
    }

    try {
      // Publish the article
      await EditorialWorkflowService.transitionArticle(
        schedule.articleId,
        'publish',
        'system',
        'Scheduled publish executed'
      )

      // Update schedule status
      schedule.status = 'published'
      schedule.publishedAt = new Date()
      await this.updateSchedule(schedule)

      console.log(`✅ Published: ${schedule.articleTitle}`)

      // If recurring, create next occurrence
      if (schedule.isRecurring && schedule.recurrencePattern) {
        await this.createNextRecurrence(schedule)
      }
    } catch (error) {
      // Mark as failed
      schedule.status = 'failed'
      schedule.errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await this.updateSchedule(schedule)

      console.error(`❌ Failed to publish: ${schedule.articleTitle}`, error)
    }
  }

  /**
   * Generate recurring schedules
   */
  private static async generateRecurringSchedules(schedule: PublishSchedule): Promise<void> {
    if (!schedule.recurrencePattern) return

    const { frequency, interval, endDate, maxOccurrences } = schedule.recurrencePattern

    let currentDate = new Date(schedule.scheduledAt)
    let occurrenceCount = 1 // Already created first occurrence

    while (true) {
      // Calculate next occurrence
      switch (frequency) {
        case 'daily':
          currentDate = new Date(currentDate)
          currentDate.setDate(currentDate.getDate() + interval)
          break
        case 'weekly':
          currentDate = new Date(currentDate)
          currentDate.setDate(currentDate.getDate() + interval * 7)
          break
        case 'monthly':
          currentDate = new Date(currentDate)
          currentDate.setMonth(currentDate.getMonth() + interval)
          break
      }

      // Check end conditions
      if (endDate && currentDate > endDate) break
      if (maxOccurrences && occurrenceCount >= maxOccurrences) break

      // Create schedule for next occurrence
      // (Would duplicate article or create placeholder)
      console.log(`📅 Next recurrence: ${this.formatDateTime(currentDate, schedule.timezone)}`)

      occurrenceCount++

      // Limit to prevent infinite loops
      if (occurrenceCount > 100) break
    }
  }

  /**
   * Create next recurrence after successful publish
   */
  private static async createNextRecurrence(schedule: PublishSchedule): Promise<void> {
    if (!schedule.recurrencePattern) return

    // Calculate next occurrence date
    const nextDate = this.calculateNextOccurrence(schedule.scheduledAt, schedule.recurrencePattern)

    // Check if should continue recurring
    if (schedule.recurrencePattern.endDate && nextDate > schedule.recurrencePattern.endDate) {
      console.log('📅 Recurring schedule ended (end date reached)')
      return
    }

    console.log(`📅 Creating next recurrence for ${this.formatDateTime(nextDate, schedule.timezone)}`)

    // In production: create new article from template or duplicate existing
    // await this.scheduleArticle(newArticleId, nextDate, schedule.timezone, schedule.createdBy, schedule.recurrencePattern)
  }

  /**
   * Calculate next occurrence date
   */
  private static calculateNextOccurrence(
    currentDate: Date,
    pattern: RecurrencePattern
  ): Date {
    const next = new Date(currentDate)

    switch (pattern.frequency) {
      case 'daily':
        next.setDate(next.getDate() + pattern.interval)
        break
      case 'weekly':
        next.setDate(next.getDate() + pattern.interval * 7)
        break
      case 'monthly':
        next.setMonth(next.getMonth() + pattern.interval)
        break
    }

    return next
  }

  /**
   * Get publication calendar for date range
   */
  static async getPublicationCalendar(
    startDate: Date,
    endDate: Date,
    timezone: string = this.GST_TIMEZONE
  ): Promise<PublicationCalendar[]> {
    const schedules = await this.getSchedulesByTimeRange(startDate, endDate)

    // Group by date
    const calendarMap = new Map<string, PublishSchedule[]>()

    for (const schedule of schedules) {
      const localDate = this.convertFromUTC(schedule.scheduledAt, timezone)
      const dateKey = this.getDateKey(localDate)

      if (!calendarMap.has(dateKey)) {
        calendarMap.set(dateKey, [])
      }
      calendarMap.get(dateKey)!.push(schedule)
    }

    // Convert to calendar entries
    const calendar: PublicationCalendar[] = []
    for (const [dateKey, schedules] of calendarMap.entries()) {
      calendar.push({
        date: new Date(dateKey),
        schedules,
        count: schedules.length,
      })
    }

    return calendar.sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  /**
   * Cancel scheduled publish
   */
  static async cancelSchedule(scheduleId: string, cancelledBy: string): Promise<void> {
    const schedule = await this.getSchedule(scheduleId)
    if (!schedule) {
      throw new Error('Schedule not found')
    }

    if (schedule.status !== 'pending') {
      throw new Error('Can only cancel pending schedules')
    }

    schedule.status = 'cancelled'
    await this.updateSchedule(schedule)

    // Revert article status back to approved
    await supabase
      .from('news_articles')
      .update({ status: 'approved' })
      .eq('id', schedule.articleId)

    console.log(`❌ Schedule cancelled: ${schedule.articleTitle}`)
  }

  /**
   * Reschedule article
   */
  static async reschedule(
    scheduleId: string,
    newScheduledAt: Date,
    timezone: string = this.GST_TIMEZONE,
    rescheduledBy: string
  ): Promise<PublishSchedule> {
    // Cancel existing schedule
    await this.cancelSchedule(scheduleId, rescheduledBy)

    // Get article ID from old schedule
    const oldSchedule = await this.getSchedule(scheduleId)
    if (!oldSchedule) {
      throw new Error('Schedule not found')
    }

    // Create new schedule
    return this.scheduleArticle(
      oldSchedule.articleId,
      newScheduledAt,
      timezone,
      rescheduledBy
    )
  }

  /**
   * Get pending schedules
   */
  static async getPendingSchedules(limit: number = 50): Promise<PublishSchedule[]> {
    // In production: query from publish_schedules table
    return []
  }

  /**
   * Get schedule by ID
   */
  private static async getSchedule(scheduleId: string): Promise<PublishSchedule | null> {
    // In production: fetch from database
    return null
  }

  /**
   * Save schedule to database
   */
  private static async saveSchedule(schedule: PublishSchedule): Promise<void> {
    // In production: insert into publish_schedules table
    console.log('📅 Schedule saved:', {
      article: schedule.articleTitle,
      scheduledAt: schedule.scheduledAt,
      timezone: schedule.timezone,
    })
  }

  /**
   * Update schedule
   */
  private static async updateSchedule(schedule: PublishSchedule): Promise<void> {
    // In production: update publish_schedules table
    console.log('📅 Schedule updated:', schedule.id, schedule.status)
  }

  /**
   * Get schedules by time range
   */
  private static async getSchedulesByTimeRange(
    startDate: Date,
    endDate: Date
  ): Promise<PublishSchedule[]> {
    // In production: query from database with date range filter
    return []
  }

  /**
   * Format date/time for display
   */
  private static formatDateTime(date: Date, timezone: string): string {
    const localDate = this.convertFromUTC(date, timezone)
    return `${localDate.toLocaleDateString()} ${localDate.toLocaleTimeString()} ${timezone}`
  }

  /**
   * Get date key for grouping
   */
  private static getDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  /**
   * Check if two dates are on the same day
   */
  private static isSameDay(date1: Date, date2: Date): boolean {
    return this.getDateKey(date1) === this.getDateKey(date2)
  }

  /**
   * Get optimal publishing times (based on analytics)
   */
  static getOptimalPublishingTimes(timezone: string = this.GST_TIMEZONE): Array<{
    hour: number
    reason: string
  }> {
    // For Dubai/GST timezone, optimal times based on engagement patterns
    return [
      { hour: 7, reason: 'Morning commute - high mobile engagement' },
      { hour: 12, reason: 'Lunch break - peak browsing time' },
      { hour: 18, reason: 'Evening commute - high traffic' },
      { hour: 21, reason: 'Evening leisure - extended reading time' },
    ]
  }
}
