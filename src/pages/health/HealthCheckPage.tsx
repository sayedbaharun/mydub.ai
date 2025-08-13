import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { 
  Activity, 
  Database, 
  Server, 
  Shield, 
  HardDrive, 
  Globe,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react'

interface HealthCheckResult {
  service: string
  status: 'healthy' | 'degraded' | 'down'
  responseTime: number
  timestamp: string
  details?: any
  error?: string
}

interface SystemMetrics {
  uptime: string
  version: string
  environment: string
  lastDeployment: string
  activeUsers: number
  requestsPerMinute: number
}

const HealthCheckPage: React.FC = () => {
  const [healthResults, setHealthResults] = useState<HealthCheckResult[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastCheck, setLastCheck] = useState<string>('')

  useEffect(() => {
    performHealthCheck()
    fetchSystemMetrics()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      performHealthCheck()
      fetchSystemMetrics()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const performHealthCheck = async () => {
    try {
      setLoading(true)
      
      // Perform various health checks
      const checks = await Promise.allSettled([
        checkDatabase(),
        checkAPI(),
        checkAuthentication(),
        checkStorage(),
        checkExternalServices()
      ])
      
      const results: HealthCheckResult[] = checks.map((check, index) => {
        const serviceNames = ['database', 'api', 'authentication', 'storage', 'external']
        
        if (check.status === 'fulfilled') {
          return check.value
        } else {
          return {
            service: serviceNames[index],
            status: 'down' as const,
            responseTime: 0,
            timestamp: new Date().toISOString(),
            error: check.reason.message
          }
        }
      })
      
      setHealthResults(results)
      setLastCheck(new Date().toISOString())
      
    } catch (error) {
      console.error('Health check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkDatabase = async (): Promise<HealthCheckResult> => {
    const startTime = Date.now()
    
    try {
      // Simple database connectivity test
      const response = await fetch('/api/health/database')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Database check failed')
      }
      
      return {
        service: 'database',
        status: data.status,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: data.details
      }
    } catch (error) {
      return {
        service: 'database',
        status: 'down',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      }
    }
  }

  const checkAPI = async (): Promise<HealthCheckResult> => {
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/health/api')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'API check failed')
      }
      
      return {
        service: 'api',
        status: data.status,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: data.details
      }
    } catch (error) {
      return {
        service: 'api',
        status: 'down',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      }
    }
  }

  const checkAuthentication = async (): Promise<HealthCheckResult> => {
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/health/auth')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Auth check failed')
      }
      
      return {
        service: 'authentication',
        status: data.status,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: data.details
      }
    } catch (error) {
      return {
        service: 'authentication',
        status: 'down',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      }
    }
  }

  const checkStorage = async (): Promise<HealthCheckResult> => {
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/health/storage')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Storage check failed')
      }
      
      return {
        service: 'storage',
        status: data.status,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: data.details
      }
    } catch (error) {
      return {
        service: 'storage',
        status: 'down',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      }
    }
  }

  const checkExternalServices = async (): Promise<HealthCheckResult> => {
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/health/external')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'External services check failed')
      }
      
      return {
        service: 'external',
        status: data.status,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: data.details
      }
    } catch (error) {
      return {
        service: 'external',
        status: 'down',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      }
    }
  }

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/api/health/metrics')
      if (response.ok) {
        const data = await response.json()
        setSystemMetrics(data)
      }
    } catch (error) {
      console.error('Failed to fetch system metrics:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'default',
      degraded: 'secondary',
      down: 'destructive'
    }
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'database':
        return <Database className="h-6 w-6" />
      case 'api':
        return <Server className="h-6 w-6" />
      case 'authentication':
        return <Shield className="h-6 w-6" />
      case 'storage':
        return <HardDrive className="h-6 w-6" />
      case 'external':
        return <Globe className="h-6 w-6" />
      default:
        return <Activity className="h-6 w-6" />
    }
  }

  const overallStatus = healthResults.length > 0 ? (
    healthResults.every(r => r.status === 'healthy') ? 'healthy' :
    healthResults.some(r => r.status === 'down') ? 'down' : 'degraded'
  ) : 'unknown'

  const averageResponseTime = healthResults.length > 0 
    ? healthResults.reduce((sum, r) => sum + r.responseTime, 0) / healthResults.length
    : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of MyDub.AI infrastructure
          </p>
        </div>
        
        <Button 
          onClick={performHealthCheck} 
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            Overall System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusBadge(overallStatus)}
              <span className="text-sm text-muted-foreground">
                Last checked: {lastCheck ? new Date(lastCheck).toLocaleString() : 'Never'}
              </span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {averageResponseTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-muted-foreground">
                Avg Response Time
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      {systemMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>System Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <div className="text-2xl font-bold">{systemMetrics.uptime}</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{systemMetrics.version}</div>
                <div className="text-sm text-muted-foreground">Version</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{systemMetrics.environment}</div>
                <div className="text-sm text-muted-foreground">Environment</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {new Date(systemMetrics.lastDeployment).toLocaleDateString()}
                </div>
                <div className="text-sm text-muted-foreground">Last Deploy</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{systemMetrics.activeUsers}</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{systemMetrics.requestsPerMinute}</div>
                <div className="text-sm text-muted-foreground">Req/Min</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthResults.map((result) => (
          <Card key={result.service}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {getServiceIcon(result.service)}
                {result.service.charAt(0).toUpperCase() + result.service.slice(1)}
              </CardTitle>
              {getStatusIcon(result.status)}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {getStatusBadge(result.status)}
                  <span className="text-sm text-muted-foreground">
                    {result.responseTime}ms
                  </span>
                </div>
                
                {result.error && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {typeof result.error === 'string' ? result.error : String(result.error)}
                  </div>
                )}
                
                {result.details && (
                  <div className="text-sm text-muted-foreground">
                    {typeof result.details === 'object' 
                      ? Object.entries(result.details).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span>{key}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))
                      : result.details
                    }
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Checked: {new Date(result.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Performing health checks...</span>
        </div>
      )}
    </div>
  )
}

export default HealthCheckPage