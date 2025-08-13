/**
 * Source Monitoring Utilities
 * Health check, performance tracking, and alert management for data sources
 */

import { supabase } from '@/shared/lib/supabase';
import { sourceIntegrationService } from '@/shared/services/data-sources/sourceIntegration.service';

// Types
export interface SourceHealth {
  sourceId: string;
  sourceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  lastSuccess: Date | null;
  errorRate: number;
  avgResponseTime: number;
  consecutiveFailures: number;
  details?: {
    lastError?: string;
    totalRequests?: number;
    successfulRequests?: number;
    failedRequests?: number;
  };
}

export interface PerformanceMetrics {
  sourceId: string;
  period: '1h' | '24h' | '7d' | '30d';
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  totalRequests: number;
  successRate: number;
  dataPoints: Array<{
    timestamp: Date;
    responseTime: number;
    success: boolean;
  }>;
}

export interface AlertThreshold {
  metric: 'errorRate' | 'responseTime' | 'consecutiveFailures';
  operator: '>' | '<' | '>=' | '<=';
  value: number;
  severity: 'warning' | 'critical';
  notificationChannels: Array<'email' | 'webhook' | 'dashboard'>;
}

export interface Alert {
  id: string;
  sourceId: string;
  sourceName: string;
  metric: string;
  threshold: number;
  actualValue: number;
  severity: 'warning' | 'critical';
  status: 'active' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
  message: string;
}

// Default alert thresholds
const DEFAULT_ALERT_THRESHOLDS: AlertThreshold[] = [
  {
    metric: 'errorRate',
    operator: '>',
    value: 0.5, // 50% error rate
    severity: 'critical',
    notificationChannels: ['email', 'dashboard'],
  },
  {
    metric: 'errorRate',
    operator: '>',
    value: 0.2, // 20% error rate
    severity: 'warning',
    notificationChannels: ['dashboard'],
  },
  {
    metric: 'responseTime',
    operator: '>',
    value: 10000, // 10 seconds
    severity: 'warning',
    notificationChannels: ['dashboard'],
  },
  {
    metric: 'consecutiveFailures',
    operator: '>=',
    value: 5,
    severity: 'critical',
    notificationChannels: ['email', 'dashboard'],
  },
  {
    metric: 'consecutiveFailures',
    operator: '>=',
    value: 3,
    severity: 'warning',
    notificationChannels: ['dashboard'],
  },
];

/**
 * Check health of a specific source
 */
export async function checkSourceHealth(sourceId: string): Promise<SourceHealth> {
  try {
    // Get source details
    const { data: source, error: sourceError } = await supabase
      .from('agent_sources')
      .select('*')
      .eq('id', sourceId)
      .single();
    
    if (sourceError || !source) {
      return {
        sourceId,
        sourceName: 'Unknown',
        status: 'unknown',
        lastCheck: new Date(),
        lastSuccess: null,
        errorRate: 1,
        avgResponseTime: 0,
        consecutiveFailures: 0,
      };
    }
    
    // Get recent task history
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: tasks, error: tasksError } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('source_url', source.url)
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (tasksError || !tasks || tasks.length === 0) {
      return {
        sourceId,
        sourceName: source.name,
        status: 'unknown',
        lastCheck: new Date(),
        lastSuccess: source.last_fetched ? new Date(source.last_fetched) : null,
        errorRate: 0,
        avgResponseTime: 0,
        consecutiveFailures: 0,
      };
    }
    
    // Calculate metrics
    const failedTasks = tasks.filter(t => t.status === 'failed');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const errorRate = tasks.length > 0 ? failedTasks.length / tasks.length : 0;
    
    // Calculate average response time
    const responseTimes = completedTasks
      .filter(t => t.completed_at)
      .map(t => {
        const start = new Date(t.created_at).getTime();
        const end = new Date(t.completed_at).getTime();
        return end - start;
      });
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    // Count consecutive failures
    let consecutiveFailures = 0;
    for (const task of tasks) {
      if (task.status === 'failed') {
        consecutiveFailures++;
      } else if (task.status === 'completed') {
        break;
      }
    }
    
    // Find last success
    const lastSuccessTask = tasks.find(t => t.status === 'completed');
    const lastSuccess = lastSuccessTask ? new Date(lastSuccessTask.completed_at) : null;
    
    // Determine overall status
    let status: SourceHealth['status'];
    if (errorRate > 0.5 || consecutiveFailures >= 5) {
      status = 'unhealthy';
    } else if (errorRate > 0.2 || consecutiveFailures >= 3 || avgResponseTime > 10000) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }
    
    // Get last error details
    const lastError = failedTasks[0]?.error_details?.message;
    
    return {
      sourceId,
      sourceName: source.name,
      status,
      lastCheck: new Date(),
      lastSuccess,
      errorRate,
      avgResponseTime,
      consecutiveFailures,
      details: {
        lastError,
        totalRequests: tasks.length,
        successfulRequests: completedTasks.length,
        failedRequests: failedTasks.length,
      },
    };
  } catch (error) {
    console.error('Error checking source health:', error);
    return {
      sourceId,
      sourceName: 'Unknown',
      status: 'unknown',
      lastCheck: new Date(),
      lastSuccess: null,
      errorRate: 1,
      avgResponseTime: 0,
      consecutiveFailures: 0,
      details: {
        lastError: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Check health of all active sources
 */
export async function checkAllSourcesHealth(): Promise<SourceHealth[]> {
  try {
    // Get all active sources
    const { data: sources, error } = await supabase
      .from('agent_sources')
      .select('id')
      .eq('is_active', true);
    
    if (error || !sources) {
      
      return [];
    }
    
    // Check health for each source in parallel
    const healthChecks = await Promise.all(
      sources.map(source => checkSourceHealth(source.id))
    );
    
    return healthChecks;
  } catch (error) {
    console.error('Error checking all sources health:', error);
    return [];
  }
}

/**
 * Get performance metrics for a source
 */
export async function getSourcePerformanceMetrics(
  sourceId: string,
  period: PerformanceMetrics['period'] = '24h'
): Promise<PerformanceMetrics | null> {
  try {
    // Calculate time range
    const periodMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    
    const startTime = new Date(Date.now() - periodMs[period]).toISOString();
    
    // Get source URL
    const { data: source } = await supabase
      .from('agent_sources')
      .select('url')
      .eq('id', sourceId)
      .single();
    
    if (!source) return null;
    
    // Get tasks for the period
    const { data: tasks, error } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('source_url', source.url)
      .gte('created_at', startTime)
      .order('created_at', { ascending: false });
    
    if (error || !tasks || tasks.length === 0) return null;
    
    // Calculate metrics
    const dataPoints: PerformanceMetrics['dataPoints'] = [];
    const responseTimes: number[] = [];
    let successfulRequests = 0;
    
    tasks.forEach(task => {
      if (task.completed_at) {
        const responseTime = new Date(task.completed_at).getTime() - new Date(task.created_at).getTime();
        responseTimes.push(responseTime);
        
        dataPoints.push({
          timestamp: new Date(task.created_at),
          responseTime,
          success: task.status === 'completed',
        });
        
        if (task.status === 'completed') {
          successfulRequests++;
        }
      }
    });
    
    // Sort response times for percentile calculation
    responseTimes.sort((a, b) => a - b);
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    
    return {
      sourceId,
      period,
      avgResponseTime,
      p95ResponseTime: responseTimes[p95Index] || avgResponseTime,
      p99ResponseTime: responseTimes[p99Index] || avgResponseTime,
      totalRequests: tasks.length,
      successRate: tasks.length > 0 ? successfulRequests / tasks.length : 0,
      dataPoints,
    };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return null;
  }
}

/**
 * Check for alert conditions and create alerts
 */
export async function checkAlertConditions(
  health: SourceHealth,
  thresholds: AlertThreshold[] = DEFAULT_ALERT_THRESHOLDS
): Promise<Alert[]> {
  const alerts: Alert[] = [];
  
  for (const threshold of thresholds) {
    let shouldAlert = false;
    let actualValue = 0;
    
    switch (threshold.metric) {
      case 'errorRate':
        actualValue = health.errorRate;
        break;
      case 'responseTime':
        actualValue = health.avgResponseTime;
        break;
      case 'consecutiveFailures':
        actualValue = health.consecutiveFailures;
        break;
    }
    
    switch (threshold.operator) {
      case '>':
        shouldAlert = actualValue > threshold.value;
        break;
      case '<':
        shouldAlert = actualValue < threshold.value;
        break;
      case '>=':
        shouldAlert = actualValue >= threshold.value;
        break;
      case '<=':
        shouldAlert = actualValue <= threshold.value;
        break;
    }
    
    if (shouldAlert) {
      alerts.push({
        id: `${health.sourceId}-${threshold.metric}-${Date.now()}`,
        sourceId: health.sourceId,
        sourceName: health.sourceName,
        metric: threshold.metric,
        threshold: threshold.value,
        actualValue,
        severity: threshold.severity,
        status: 'active',
        createdAt: new Date(),
        message: `Source ${health.sourceName} ${threshold.metric} is ${actualValue} (threshold: ${threshold.operator} ${threshold.value})`,
      });
    }
  }
  
  return alerts;
}

/**
 * Run health checks and create alerts for all sources
 */
export async function runHealthCheckCycle(): Promise<{
  healthStatuses: SourceHealth[];
  alerts: Alert[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    unknown: number;
  };
}> {
  const healthStatuses = await checkAllSourcesHealth();
  const allAlerts: Alert[] = [];
  
  // Check alert conditions for each source
  for (const health of healthStatuses) {
    const alerts = await checkAlertConditions(health);
    allAlerts.push(...alerts);
  }
  
  // Calculate summary
  const summary = {
    total: healthStatuses.length,
    healthy: healthStatuses.filter(h => h.status === 'healthy').length,
    degraded: healthStatuses.filter(h => h.status === 'degraded').length,
    unhealthy: healthStatuses.filter(h => h.status === 'unhealthy').length,
    unknown: healthStatuses.filter(h => h.status === 'unknown').length,
  };
  
  // Store health check results in database
  if (healthStatuses.length > 0) {
    const healthRecords = healthStatuses.map(health => ({
      source_id: health.sourceId,
      status: health.status,
      error_rate: health.errorRate,
      avg_response_time: health.avgResponseTime,
      consecutive_failures: health.consecutiveFailures,
      last_success: health.lastSuccess?.toISOString() || null,
      details: health.details || {},
      checked_at: health.lastCheck.toISOString(),
    }));
    
    // Store in a health_checks table (would need to be created)
    // await supabase.from('source_health_checks').insert(healthRecords);
  }
  
  return {
    healthStatuses,
    alerts: allAlerts,
    summary,
  };
}

/**
 * Test source connectivity with detailed diagnostics
 */
export async function testSourceConnectivity(sourceId: string): Promise<{
  success: boolean;
  diagnostics: {
    dns: boolean;
    connection: boolean;
    authentication: boolean;
    dataFetch: boolean;
    parsing: boolean;
  };
  errors: string[];
  recommendations: string[];
}> {
  const errors: string[] = [];
  const recommendations: string[] = [];
  const diagnostics = {
    dns: false,
    connection: false,
    authentication: false,
    dataFetch: false,
    parsing: false,
  };
  
  try {
    // Get source details
    const { data: source, error } = await supabase
      .from('agent_sources')
      .select('*')
      .eq('id', sourceId)
      .single();
    
    if (error || !source) {
      errors.push('Source not found');
      return { success: false, diagnostics, errors, recommendations };
    }
    
    // Test DNS resolution
    try {
      const url = new URL(source.url);
      diagnostics.dns = true;
    } catch (e) {
      errors.push('Invalid URL format');
      recommendations.push('Check the source URL configuration');
      return { success: false, diagnostics, errors, recommendations };
    }
    
    // Test connection and fetch
    const testResult = await sourceIntegrationService.testSource(
      source.url,
      source.type,
      source.credentials
    );
    
    if (testResult.success) {
      diagnostics.connection = true;
      diagnostics.authentication = true;
      diagnostics.dataFetch = true;
      diagnostics.parsing = true;
    } else {
      errors.push(testResult.message);
      
      // Provide specific recommendations based on error
      if (testResult.message.includes('401') || testResult.message.includes('403')) {
        recommendations.push('Check API credentials or authentication configuration');
      } else if (testResult.message.includes('404')) {
        recommendations.push('Verify the source URL is correct and accessible');
      } else if (testResult.message.includes('timeout')) {
        recommendations.push('Source is slow to respond. Consider increasing timeout or checking network connectivity');
      } else if (testResult.message.includes('rate limit')) {
        recommendations.push('Rate limit exceeded. Reduce fetch frequency or upgrade API plan');
      }
    }
    
    return {
      success: testResult.success,
      diagnostics,
      errors,
      recommendations,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return { success: false, diagnostics, errors, recommendations };
  }
}

/**
 * Export monitoring data for analysis
 */
export async function exportMonitoringData(
  startDate: Date,
  endDate: Date,
  sourceIds?: string[]
): Promise<{
  sources: any[];
  tasks: any[];
  healthChecks: SourceHealth[];
  performanceMetrics: PerformanceMetrics[];
}> {
  try {
    // Build source query
    let sourceQuery = supabase
      .from('agent_sources')
      .select('*');
    
    if (sourceIds && sourceIds.length > 0) {
      sourceQuery = sourceQuery.in('id', sourceIds);
    }
    
    const { data: sources } = await sourceQuery;
    
    // Get tasks
    const { data: tasks } = await supabase
      .from('agent_tasks')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    // Get health checks
    const healthChecks = sourceIds 
      ? await Promise.all(sourceIds.map(id => checkSourceHealth(id)))
      : await checkAllSourcesHealth();
    
    // Get performance metrics
    const performanceMetrics = sourceIds
      ? await Promise.all(sourceIds.map(id => getSourcePerformanceMetrics(id, '7d')))
      : [];
    
    return {
      sources: sources || [],
      tasks: tasks || [],
      healthChecks,
      performanceMetrics: performanceMetrics.filter(m => m !== null) as PerformanceMetrics[],
    };
  } catch (error) {
    console.error('Error exporting monitoring data:', error);
    return {
      sources: [],
      tasks: [],
      healthChecks: [],
      performanceMetrics: [],
    };
  }
}