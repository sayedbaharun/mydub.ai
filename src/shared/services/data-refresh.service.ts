// Automated data refresh and caching mechanisms with background job processing
// Ensures data stays current automatically with intelligent caching and refresh strategies

import { supabase } from '@/shared/lib/supabase'
import { ExternalAPIsService } from './external-apis'
import { DataValidationService } from './data-validation.service'

export interface RefreshJob {
  id: string
  name: string
  type: 'news' | 'tourism' | 'government' | 'weather' | 'analytics'
  schedule: string // cron expression
  lastRun?: string
  nextRun?: string
  status: 'active' | 'paused' | 'failed'
  interval: number // minutes
  retryCount: number
  maxRetries: number
  isRunning: boolean
}

export interface RefreshResult {
  jobId: string
  success: boolean
  recordsProcessed: number
  recordsAdded: number
  recordsUpdated: number
  recordsRemoved: number
  errors: string[]
  duration: number
  timestamp: string
}

export interface CacheEntry {
  key: string
  data: any
  expires: number
  size: number
  hits: number
  created: number
}

export class DataRefreshService {
  private static jobs = new Map<string, RefreshJob>()
  private static cache = new Map<string, CacheEntry>()
  private static intervals = new Map<string, NodeJS.Timeout>()

  // Cache configuration
  private static readonly DEFAULT_CACHE_TTL = 15 * 60 * 1000 // 15 minutes
  private static readonly MAX_CACHE_SIZE = 100 // Max number of cache entries
  private static readonly CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes

  // Initialize the refresh service
  static async initialize(): Promise<void> {
    try {
      // Load existing jobs from database
      await this.loadJobs()

      // Start default refresh jobs
      await this.createDefaultJobs()

      // Start cache cleanup
      this.startCacheCleanup()
    } catch (error) {
      console.error('Failed to initialize data refresh service:', error)
    }
  }

  // Load jobs from database
  private static async loadJobs(): Promise<void> {
    try {
      const { data, error } = await supabase.from('refresh_jobs').select('*').eq('is_active', true)

      if (error) throw error
      ;(data || []).forEach((job) => {
        const refreshJob: RefreshJob = {
          id: job.id,
          name: job.name,
          type: job.type,
          schedule: job.schedule,
          lastRun: job.last_run,
          nextRun: job.next_run,
          status: job.status,
          interval: job.interval_minutes,
          retryCount: 0,
          maxRetries: job.max_retries || 3,
          isRunning: false,
        }

        this.jobs.set(job.id, refreshJob)
        this.scheduleJob(refreshJob)
      })
    } catch (error) {
      console.error('Failed to load jobs from database:', error)
    }
  }

  // Create default refresh jobs
  private static async createDefaultJobs(): Promise<void> {
    const defaultJobs: Partial<RefreshJob>[] = [
      {
        id: 'news-refresh',
        name: 'News Articles Refresh',
        type: 'news',
        schedule: '*/30 * * * *', // Every 30 minutes
        interval: 30,
        status: 'active',
        maxRetries: 3,
      },
      {
        id: 'tourism-events-refresh',
        name: 'Tourism Events Refresh',
        type: 'tourism',
        schedule: '0 */6 * * *', // Every 6 hours
        interval: 360,
        status: 'active',
        maxRetries: 3,
      },
      {
        id: 'government-services-refresh',
        name: 'Government Services Refresh',
        type: 'government',
        schedule: '0 8 * * *', // Daily at 8 AM
        interval: 1440,
        status: 'active',
        maxRetries: 3,
      },
      {
        id: 'weather-refresh',
        name: 'Weather Data Refresh',
        type: 'weather',
        schedule: '*/15 * * * *', // Every 15 minutes
        interval: 15,
        status: 'active',
        maxRetries: 3,
      },
    ]

    for (const jobData of defaultJobs) {
      if (!this.jobs.has(jobData.id!)) {
        const job = await this.createJob(jobData as RefreshJob)
        this.scheduleJob(job)
      }
    }
  }

  // Create a new refresh job
  static async createJob(jobData: Partial<RefreshJob>): Promise<RefreshJob> {
    const job: RefreshJob = {
      id: jobData.id || `job-${Date.now()}`,
      name: jobData.name || 'Unnamed Job',
      type: jobData.type || 'news',
      schedule: jobData.schedule || '0 * * * *',
      interval: jobData.interval || 60,
      status: jobData.status || 'active',
      retryCount: 0,
      maxRetries: jobData.maxRetries || 3,
      isRunning: false,
    }

    // Save to database
    try {
      await supabase.from('refresh_jobs').upsert({
        id: job.id,
        name: job.name,
        type: job.type,
        schedule: job.schedule,
        interval_minutes: job.interval,
        status: job.status,
        max_retries: job.maxRetries,
        is_active: true,
        created_at: new Date().toISOString(),
      })

      this.jobs.set(job.id, job)
      return job
    } catch (error) {
      console.error('Failed to create job:', error)
      throw error
    }
  }

  // Schedule a job to run at intervals
  private static scheduleJob(job: RefreshJob): void {
    if (job.status !== 'active') return

    // Clear existing interval if any
    const existingInterval = this.intervals.get(job.id)
    if (existingInterval) {
      clearInterval(existingInterval)
    }

    // Calculate next run time
    const nextRun = new Date(Date.now() + job.interval * 60 * 1000)
    job.nextRun = nextRun.toISOString()

    // Schedule the job
    const interval = setInterval(
      async () => {
        await this.executeJob(job.id)
      },
      job.interval * 60 * 1000
    )

    this.intervals.set(job.id, interval)
  }

  // Execute a specific job
  static async executeJob(jobId: string): Promise<RefreshResult> {
    const job = this.jobs.get(jobId)
    if (!job) {
      throw new Error(`Job ${jobId} not found`)
    }

    if (job.isRunning) {
      return {
        jobId,
        success: false,
        recordsProcessed: 0,
        recordsAdded: 0,
        recordsUpdated: 0,
        recordsRemoved: 0,
        errors: ['Job already running'],
        duration: 0,
        timestamp: new Date().toISOString(),
      }
    }

    const startTime = Date.now()
    job.isRunning = true
    job.lastRun = new Date().toISOString()

    try {
      let result: RefreshResult

      switch (job.type) {
        case 'news':
          result = await this.refreshNewsData(jobId)
          break
        case 'tourism':
          result = await this.refreshTourismData(jobId)
          break
        case 'government':
          result = await this.refreshGovernmentData(jobId)
          break
        case 'weather':
          result = await this.refreshWeatherData(jobId)
          break
        case 'analytics':
          result = await this.refreshAnalyticsData(jobId)
          break
        default:
          throw new Error(`Unknown job type: ${job.type}`)
      }

      result.duration = Date.now() - startTime
      result.timestamp = new Date().toISOString()

      // Update job status
      job.status = 'active'
      job.retryCount = 0
      job.nextRun = new Date(Date.now() + job.interval * 60 * 1000).toISOString()

      // Log successful execution
      await this.logJobExecution(result)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Job ${job.name} failed:`, errorMessage)

      job.retryCount += 1
      if (job.retryCount >= job.maxRetries) {
        job.status = 'failed'
        console.error(`Job ${job.name} failed after ${job.maxRetries} retries`)
      }

      const result: RefreshResult = {
        jobId,
        success: false,
        recordsProcessed: 0,
        recordsAdded: 0,
        recordsUpdated: 0,
        recordsRemoved: 0,
        errors: [errorMessage],
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      }

      await this.logJobExecution(result)
      return result
    } finally {
      job.isRunning = false

      // Update job in database
      await supabase
        .from('refresh_jobs')
        .update({
          last_run: job.lastRun,
          next_run: job.nextRun,
          status: job.status,
          retry_count: job.retryCount,
        })
        .eq('id', jobId)
    }
  }

  // Refresh news data
  private static async refreshNewsData(jobId: string): Promise<RefreshResult> {
    const result = await ExternalAPIsService.syncNewsToDatabase()

    return {
      jobId,
      success: result.success,
      recordsProcessed: result.synced + result.errors.length,
      recordsAdded: result.synced,
      recordsUpdated: 0,
      recordsRemoved: 0,
      errors: result.errors,
      duration: 0,
      timestamp: new Date().toISOString(),
    }
  }

  // Refresh tourism data
  private static async refreshTourismData(jobId: string): Promise<RefreshResult> {
    try {
      const [events, attractions] = await Promise.all([
        ExternalAPIsService.fetchTourismEvents(),
        ExternalAPIsService.fetchAttractions(),
      ])

      let recordsAdded = 0
      let recordsUpdated = 0
      const errors: string[] = []

      // Process events
      if (events && events.length > 0) {
        for (const event of events) {
          try {
            const validationResult = DataValidationService.validateData(event, [
              { field: 'title', type: 'string', required: true },
              { field: 'description', type: 'string', required: true },
              { field: 'startDate', type: 'date', required: true },
            ])

            if (validationResult.isValid) {
              const { error } = await supabase.from('tourism_events').upsert({
                id: event.id,
                title: event.title,
                description: event.description,
                category: event.category,
                start_date: event.startDate,
                end_date: event.endDate,
                venue: event.venue,
                ticket_price: event.price?.min || 0,
                ticket_url: event.bookingUrl,
                image_url: event.imageUrl,
                tags: event.tags,
                source: event.source,
                is_active: true,
                updated_at: new Date().toISOString(),
              })

              if (error) {
                errors.push(`Event ${event.title}: ${error.message}`)
              } else {
                recordsAdded++
              }
            } else {
              errors.push(`Event validation failed: ${validationResult.errors.join(', ')}`)
            }
          } catch (error) {
            errors.push(
              `Event processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          }
        }
      }

      // Process attractions
      if (attractions && attractions.length > 0) {
        for (const attraction of attractions) {
          try {
            const { error } = await supabase.from('tourism_attractions').upsert({
              id: attraction.id,
              name: attraction.name,
              description: attraction.description,
              category: attraction.category,
              location_lat: attraction.location?.lat,
              location_lng: attraction.location?.lng,
              address: attraction.location?.address,
              rating: attraction.rating,
              review_count: attraction.reviewCount,
              admission_fee: attraction.priceLevel * 50, // Convert price level to estimated fee
              images: attraction.images,
              is_featured: false,
              is_active: true,
              updated_at: new Date().toISOString(),
            })

            if (error) {
              errors.push(`Attraction ${attraction.name}: ${error.message}`)
            } else {
              recordsAdded++
            }
          } catch (error) {
            errors.push(
              `Attraction processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          }
        }
      }

      return {
        jobId,
        success: errors.length === 0,
        recordsProcessed: recordsAdded + errors.length,
        recordsAdded,
        recordsUpdated,
        recordsRemoved: 0,
        errors,
        duration: 0,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new Error(
        `Tourism data refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Refresh government data
  private static async refreshGovernmentData(jobId: string): Promise<RefreshResult> {
    try {
      // This would fetch from Dubai government APIs
      const governmentData = await ExternalAPIsService.fetchGovernmentData('dubai-services')

      let recordsAdded = 0
      const errors: string[] = []

      if (governmentData.success && governmentData.result?.records) {
        for (const record of governmentData.result.records) {
          try {
            const { error } = await supabase.from('government_services').upsert({
              id: record.id || `gov-${Date.now()}-${Math.random()}`,
              title: record.title || record.name,
              description: record.description,
              category: record.category || 'general',
              department_id: record.department_id,
              fees: parseFloat(record.fees || '0'),
              processing_time: record.processing_time,
              is_online: record.is_online || false,
              requirements: record.requirements || [],
              is_active: true,
              updated_at: new Date().toISOString(),
            })

            if (error) {
              errors.push(`Government service ${record.title}: ${error.message}`)
            } else {
              recordsAdded++
            }
          } catch (error) {
            errors.push(
              `Government data processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          }
        }
      }

      return {
        jobId,
        success: errors.length === 0,
        recordsProcessed: recordsAdded + errors.length,
        recordsAdded,
        recordsUpdated: 0,
        recordsRemoved: 0,
        errors,
        duration: 0,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new Error(
        `Government data refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Refresh weather data
  private static async refreshWeatherData(jobId: string): Promise<RefreshResult> {
    try {
      const weatherData = await ExternalAPIsService.fetchWeatherData()

      if (weatherData && !weatherData.isMock) {
        const { error } = await supabase.from('weather_data').upsert({
          id: 'dubai-current',
          city: 'Dubai',
          temperature: weatherData.current.main.temp,
          feels_like: weatherData.current.main.feels_like,
          humidity: weatherData.current.main.humidity,
          description: weatherData.current.weather[0].description,
          icon: weatherData.current.weather[0].icon,
          wind_speed: weatherData.current.wind.speed,
          updated_at: new Date().toISOString(),
        })

        if (error) {
          throw new Error(`Weather data update failed: ${error.message}`)
        }

        return {
          jobId,
          success: true,
          recordsProcessed: 1,
          recordsAdded: 0,
          recordsUpdated: 1,
          recordsRemoved: 0,
          errors: [],
          duration: 0,
          timestamp: new Date().toISOString(),
        }
      }

      return {
        jobId,
        success: false,
        recordsProcessed: 0,
        recordsAdded: 0,
        recordsUpdated: 0,
        recordsRemoved: 0,
        errors: ['No weather data available'],
        duration: 0,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new Error(
        `Weather data refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Refresh analytics data
  private static async refreshAnalyticsData(jobId: string): Promise<RefreshResult> {
    try {
      // Calculate various analytics metrics
      const today = new Date().toISOString().split('T')[0]
      const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [dailyViews, weeklySignups, popularContent, searchQueries] = await Promise.all([
        // Daily page views
        supabase.from('page_views').select('page_path').gte('created_at', today),

        // Weekly user signups
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', week),

        // Most viewed content
        supabase
          .from('news_articles')
          .select('id, title, view_count')
          .order('view_count', { ascending: false })
          .limit(10),

        // Popular search queries
        supabase.from('search_logs').select('query').gte('created_at', week),
      ])

      // Aggregate analytics data
      const analytics = {
        daily_page_views: dailyViews.data?.length || 0,
        weekly_signups: weeklySignups.count || 0,
        popular_content: popularContent.data || [],
        search_trends: this.aggregateSearchQueries(searchQueries.data || []),
        updated_at: new Date().toISOString(),
      }

      // Store aggregated analytics
      const { error } = await supabase.from('analytics_summary').upsert({
        id: today,
        date: today,
        data: analytics,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        throw new Error(`Analytics update failed: ${error.message}`)
      }

      return {
        jobId,
        success: true,
        recordsProcessed: 4,
        recordsAdded: 0,
        recordsUpdated: 1,
        recordsRemoved: 0,
        errors: [],
        duration: 0,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new Error(
        `Analytics refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Helper method to aggregate search queries
  private static aggregateSearchQueries(
    queries: Array<{ query: string }>
  ): Array<{ query: string; count: number }> {
    const queryCount = new Map<string, number>()

    queries.forEach((q) => {
      const query = q.query.toLowerCase().trim()
      queryCount.set(query, (queryCount.get(query) || 0) + 1)
    })

    return Array.from(queryCount.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
  }

  // Log job execution
  private static async logJobExecution(result: RefreshResult): Promise<void> {
    try {
      await supabase.from('refresh_job_logs').insert({
        job_id: result.jobId,
        success: result.success,
        records_processed: result.recordsProcessed,
        records_added: result.recordsAdded,
        records_updated: result.recordsUpdated,
        records_removed: result.recordsRemoved,
        errors: result.errors,
        duration: result.duration,
        executed_at: result.timestamp,
      })
    } catch (error) {
      console.error('Failed to log job execution:', error)
    }
  }

  // Cache management
  static setCache(key: string, data: any, ttl?: number): void {
    const expires = Date.now() + (ttl || this.DEFAULT_CACHE_TTL)
    const size = JSON.stringify(data).length

    this.cache.set(key, {
      key,
      data,
      expires,
      size,
      hits: 0,
      created: Date.now(),
    })

    // Cleanup if cache is too large
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      this.evictOldestEntries()
    }
  }

  static getCache(key: string): any | null {
    const entry = this.cache.get(key)

    if (!entry) return null

    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }

    entry.hits++
    return entry.data
  }

  static clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern)
      for (const [key] of this.cache) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  // Evict oldest cache entries
  private static evictOldestEntries(): void {
    const entries = Array.from(this.cache.entries()).sort(([, a], [, b]) => a.created - b.created)

    const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE + 10)
    toRemove.forEach(([key]) => this.cache.delete(key))
  }

  // Start cache cleanup interval
  private static startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.cache) {
        if (now > entry.expires) {
          this.cache.delete(key)
        }
      }
    }, this.CACHE_CLEANUP_INTERVAL)
  }

  // Get cache statistics
  static getCacheStats(): {
    size: number
    totalSize: number
    hitRate: number
    entries: Array<{
      key: string
      size: number
      hits: number
      age: number
      expires: number
    }>
  } {
    const entries = Array.from(this.cache.values())
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0)
    const totalRequests = totalHits + entries.length // Approximation

    return {
      size: this.cache.size,
      totalSize: entries.reduce((sum, entry) => sum + entry.size, 0),
      hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
      entries: entries.map((entry) => ({
        key: entry.key,
        size: entry.size,
        hits: entry.hits,
        age: Date.now() - entry.created,
        expires: entry.expires,
      })),
    }
  }

  // Manual job execution
  static async runJob(jobId: string): Promise<RefreshResult> {
    return await this.executeJob(jobId)
  }

  // Get all jobs
  static getJobs(): RefreshJob[] {
    return Array.from(this.jobs.values())
  }

  // Pause/resume job
  static async pauseJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (job) {
      job.status = 'paused'

      const interval = this.intervals.get(jobId)
      if (interval) {
        clearInterval(interval)
        this.intervals.delete(jobId)
      }

      await supabase.from('refresh_jobs').update({ status: 'paused' }).eq('id', jobId)
    }
  }

  static async resumeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (job) {
      job.status = 'active'
      this.scheduleJob(job)

      await supabase.from('refresh_jobs').update({ status: 'active' }).eq('id', jobId)
    }
  }

  // Cleanup and shutdown
  static shutdown(): void {
    // Clear all intervals
    for (const interval of this.intervals.values()) {
      clearInterval(interval)
    }
    this.intervals.clear()

    // Clear cache
    this.cache.clear()
  }
}
