import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PerformanceData {
  timestamp: string
  url: string
  userAgent: string
  metrics: {
    CLS?: number
    FCP?: number
    FID?: number
    LCP?: number
    TTFB?: number
    INP?: number
    navigationTiming?: any
    resourceTiming?: any[]
  }
  viewport: {
    width: number
    height: number
  }
  connection?: {
    effectiveType: string
    downlink: number
    rtt: number
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.url.endsWith('/performance')) {
      return handlePerformanceMetrics(req, supabase)
    } else if (req.url.endsWith('/errors')) {
      return handleErrorTracking(req, supabase)
    } else if (req.url.endsWith('/events')) {
      return handleCustomEvents(req, supabase)
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    )

  } catch (error) {
    console.error('Analytics error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function handlePerformanceMetrics(req: Request, supabase: any) {
  try {
    const data: PerformanceData = await req.json()
    
    // Extract key metrics
    const webVitals = {
      cls: data.metrics.CLS,
      fcp: data.metrics.FCP,
      fid: data.metrics.FID,
      lcp: data.metrics.LCP,
      ttfb: data.metrics.TTFB,
      inp: data.metrics.INP,
    }

    // Parse user agent for device info
    const deviceInfo = parseUserAgent(data.userAgent)
    
    // Store in analytics_performance table
    const { error } = await supabase
      .from('analytics_performance')
      .insert({
        timestamp: data.timestamp,
        url: data.url,
        page_path: new URL(data.url).pathname,
        ...webVitals,
        viewport_width: data.viewport.width,
        viewport_height: data.viewport.height,
        device_type: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        connection_type: data.connection?.effectiveType,
        connection_speed: data.connection?.downlink,
        connection_rtt: data.connection?.rtt,
        raw_metrics: data.metrics,
      })

    if (error) throw error

    // Check for performance violations
    const violations = checkPerformanceViolations(webVitals)
    if (violations.length > 0) {
      // Store violations for alerting
      await supabase
        .from('performance_violations')
        .insert(violations.map(v => ({
          timestamp: data.timestamp,
          url: data.url,
          metric: v.metric,
          value: v.value,
          threshold: v.threshold,
          severity: v.severity,
        })))
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Performance metrics error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to store metrics' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

async function handleErrorTracking(req: Request, supabase: any) {
  try {
    const data = await req.json()
    
    // Store error in analytics_errors table
    const { error } = await supabase
      .from('analytics_errors')
      .insert({
        timestamp: data.timestamp,
        error_type: data.errorType,
        error_message: data.message,
        error_stack: data.stack,
        url: data.url,
        user_agent: data.userAgent,
        user_id: data.userId,
        session_id: data.sessionId,
        context: data.context,
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error tracking error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to store error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

async function handleCustomEvents(req: Request, supabase: any) {
  try {
    const data = await req.json()
    
    // Store custom event
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        timestamp: data.timestamp,
        event_name: data.eventName,
        event_category: data.category,
        event_value: data.value,
        event_data: data.data,
        url: data.url,
        user_id: data.userId,
        session_id: data.sessionId,
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Event tracking error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to store event' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

function parseUserAgent(userAgent: string) {
  // Simple user agent parsing
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent)
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent)
  
  let browser = 'Unknown'
  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'
  
  let os = 'Unknown'
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS')) os = 'iOS'
  
  return {
    deviceType: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
    browser,
    os,
  }
}

function checkPerformanceViolations(metrics: any) {
  const violations = []
  
  // Check Web Vitals thresholds
  if (metrics.lcp && metrics.lcp > 2500) {
    violations.push({
      metric: 'LCP',
      value: metrics.lcp,
      threshold: 2500,
      severity: metrics.lcp > 4000 ? 'critical' : 'warning',
    })
  }
  
  if (metrics.fid && metrics.fid > 100) {
    violations.push({
      metric: 'FID',
      value: metrics.fid,
      threshold: 100,
      severity: metrics.fid > 300 ? 'critical' : 'warning',
    })
  }
  
  if (metrics.cls && metrics.cls > 0.1) {
    violations.push({
      metric: 'CLS',
      value: metrics.cls,
      threshold: 0.1,
      severity: metrics.cls > 0.25 ? 'critical' : 'warning',
    })
  }
  
  if (metrics.inp && metrics.inp > 200) {
    violations.push({
      metric: 'INP',
      value: metrics.inp,
      threshold: 200,
      severity: metrics.inp > 500 ? 'critical' : 'warning',
    })
  }
  
  return violations
}