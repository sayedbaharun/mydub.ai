/**
 * Government Service Status Monitor for MyDub.ai
 * Real-time monitoring of all government API integrations
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  ExternalLink,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  Server,
  Database,
  Globe,
  MapPin,
  Users,
  FileText,
  Car,
  Home,
  Heart,
  Building
} from 'lucide-react'
import { useScreenReader } from '@/shared/components/accessibility/ScreenReaderAnnouncer'
import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/lib/utils'

export interface ServiceStatus {
  id: string
  name: string
  displayName: string
  category: 'transport' | 'utilities' | 'health' | 'immigration' | 'municipal' | 'general'
  status: 'operational' | 'degraded' | 'outage' | 'maintenance'
  responseTime: number
  uptime: number
  lastChecked: Date
  url?: string
  description: string
  endpoints: ServiceEndpoint[]
  incidents: ServiceIncident[]
  icon: React.ReactNode
}

export interface ServiceEndpoint {
  name: string
  url: string
  status: 'operational' | 'degraded' | 'outage'
  responseTime: number
  lastChecked: Date
}

export interface ServiceIncident {
  id: string
  title: string
  description: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  severity: 'low' | 'medium' | 'high' | 'critical'
  startTime: Date
  resolvedTime?: Date
  updates: IncidentUpdate[]
}

export interface IncidentUpdate {
  timestamp: Date
  message: string
  status: string
}

export function GovernmentServiceMonitor() {
  const { announce } = useScreenReader()
  const { toast } = useToast()
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [selectedService, setSelectedService] = useState<ServiceStatus | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Mock service data - in real implementation, this would come from API
  const mockServices: ServiceStatus[] = [
    {
      id: 'rta',
      name: 'RTA',
      displayName: 'Roads & Transport Authority',
      category: 'transport',
      status: 'operational',
      responseTime: 285,
      uptime: 99.8,
      lastChecked: new Date(Date.now() - 1000 * 30),
      url: 'https://www.rta.ae',
      description: 'Public transport schedules, traffic data, and parking information',
      icon: <Car className="h-5 w-5" />,
      endpoints: [
        {
          name: 'Bus Routes API',
          url: '/api/rta/routes',
          status: 'operational',
          responseTime: 245,
          lastChecked: new Date(Date.now() - 1000 * 30)
        },
        {
          name: 'Metro Status API',
          url: '/api/rta/metro',
          status: 'operational',
          responseTime: 320,
          lastChecked: new Date(Date.now() - 1000 * 45)
        }
      ],
      incidents: []
    },
    {
      id: 'dewa',
      name: 'DEWA',
      displayName: 'Dubai Electricity & Water Authority',
      category: 'utilities',
      status: 'operational',
      responseTime: 420,
      uptime: 99.5,
      lastChecked: new Date(Date.now() - 1000 * 60),
      url: 'https://www.dewa.gov.ae',
      description: 'Utility services, bill payments, and outage information',
      icon: <Zap className="h-5 w-5" />,
      endpoints: [
        {
          name: 'Account Services',
          url: '/api/dewa/account',
          status: 'operational',
          responseTime: 380,
          lastChecked: new Date(Date.now() - 1000 * 60)
        },
        {
          name: 'Outage Reports',
          url: '/api/dewa/outages',
          status: 'degraded',
          responseTime: 680,
          lastChecked: new Date(Date.now() - 1000 * 90)
        }
      ],
      incidents: [
        {
          id: 'dewa-001',
          title: 'Slow API Response Times',
          description: 'Some DEWA API endpoints experiencing higher than normal response times',
          status: 'monitoring',
          severity: 'low',
          startTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
          updates: [
            {
              timestamp: new Date(Date.now() - 1000 * 60 * 30),
              message: 'Response times improving, continuing to monitor',
              status: 'monitoring'
            }
          ]
        }
      ]
    },
    {
      id: 'dha',
      name: 'DHA',
      displayName: 'Dubai Health Authority',
      category: 'health',
      status: 'operational',
      responseTime: 350,
      uptime: 99.9,
      lastChecked: new Date(Date.now() - 1000 * 45),
      url: 'https://www.dha.gov.ae',
      description: 'Health services, medical facilities, and appointment booking',
      icon: <Heart className="h-5 w-5" />,
      endpoints: [
        {
          name: 'Facility Locator',
          url: '/api/dha/facilities',
          status: 'operational',
          responseTime: 290,
          lastChecked: new Date(Date.now() - 1000 * 45)
        }
      ],
      incidents: []
    },
    {
      id: 'gdrfa',
      name: 'GDRFA',
      displayName: 'General Directorate of Residency',
      category: 'immigration',
      status: 'maintenance',
      responseTime: 0,
      uptime: 95.2,
      lastChecked: new Date(Date.now() - 1000 * 120),
      url: 'https://gdrfad.gov.ae',
      description: 'Visa services, residence permits, and immigration information',
      icon: <FileText className="h-5 w-5" />,
      endpoints: [
        {
          name: 'Visa Status API',
          url: '/api/gdrfa/visa-status',
          status: 'maintenance',
          responseTime: 0,
          lastChecked: new Date(Date.now() - 1000 * 120)
        }
      ],
      incidents: [
        {
          id: 'gdrfa-001',
          title: 'Scheduled Maintenance',
          description: 'GDRFA systems undergoing scheduled maintenance for upgrades',
          status: 'identified',
          severity: 'medium',
          startTime: new Date(Date.now() - 1000 * 60 * 60),
          updates: [
            {
              timestamp: new Date(Date.now() - 1000 * 60 * 60),
              message: 'Maintenance started as scheduled, expected duration 2 hours',
              status: 'identified'
            }
          ]
        }
      ]
    },
    {
      id: 'dm',
      name: 'DM',
      displayName: 'Dubai Municipality',
      category: 'municipal',
      status: 'operational',
      responseTime: 310,
      uptime: 99.7,
      lastChecked: new Date(Date.now() - 1000 * 20),
      url: 'https://www.dm.gov.ae',
      description: 'Municipal services, permits, and city information',
      icon: <Building className="h-5 w-5" />,
      endpoints: [
        {
          name: 'Permits API',
          url: '/api/dm/permits',
          status: 'operational',
          responseTime: 280,
          lastChecked: new Date(Date.now() - 1000 * 20)
        }
      ],
      incidents: []
    }
  ]

  useEffect(() => {
    setServices(mockServices)
    
    // Set up auto-refresh
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshServiceStatus()
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const refreshServiceStatus = async () => {
    setLoading(true)
    announce('Refreshing service status', 'polite')

    try {
      // In real implementation, this would make API calls to check service status
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      // Update last checked times
      const updatedServices = services.map(service => ({
        ...service,
        lastChecked: new Date(),
        // Simulate some variation in response times
        responseTime: service.status === 'operational' ? 
          Math.max(200, service.responseTime + (Math.random() - 0.5) * 100) : 
          service.responseTime
      }))
      
      setServices(updatedServices)
      setLastUpdated(new Date())
      
      announce('Service status updated', 'polite')
    } catch (error) {
      console.error('Error refreshing service status:', error)
      toast({
        title: 'Refresh Failed',
        description: 'Unable to refresh service status. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-50'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50'
      case 'maintenance':
        return 'text-blue-600 bg-blue-50'
      case 'outage':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'maintenance':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'outage':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getOverallStatus = () => {
    const operationalCount = services.filter(s => s.status === 'operational').length
    const totalCount = services.length
    
    if (operationalCount === totalCount) return 'All Systems Operational'
    if (operationalCount >= totalCount * 0.8) return 'Minor Issues'
    if (operationalCount >= totalCount * 0.5) return 'Service Degradation'
    return 'Major Outage'
  }

  const getOverallStatusColor = () => {
    const operationalCount = services.filter(s => s.status === 'operational').length
    const totalCount = services.length
    
    if (operationalCount === totalCount) return 'text-green-600'
    if (operationalCount >= totalCount * 0.8) return 'text-yellow-600'
    if (operationalCount >= totalCount * 0.5) return 'text-orange-600'
    return 'text-red-600'
  }

  const averageResponseTime = services.reduce((sum, service) => sum + service.responseTime, 0) / services.length
  const averageUptime = services.reduce((sum, service) => sum + service.uptime, 0) / services.length

  return (
    <div className="space-y-6" role="main" aria-label="Government Service Monitor">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            Government Service Monitor
          </h1>
          <p className="text-gray-600">Real-time status of Dubai government API integrations</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshServiceStatus}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                services.filter(s => s.status === 'operational').length === services.length ? 
                'bg-green-100' : 'bg-yellow-100'
              )}>
                {services.filter(s => s.status === 'operational').length === services.length ? 
                  <CheckCircle className="h-6 w-6 text-green-600" /> :
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                }
              </div>
              <div>
                <h2 className={cn("text-lg font-semibold", getOverallStatusColor())}>
                  {getOverallStatus()}
                </h2>
                <p className="text-sm text-gray-600">
                  {services.filter(s => s.status === 'operational').length} of {services.length} services operational
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="font-semibold">{averageResponseTime.toFixed(0)}ms</div>
                <div className="text-gray-500">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{averageUptime.toFixed(1)}%</div>
                <div className="text-gray-500">Avg Uptime</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card 
            key={service.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedService(service)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {service.icon}
                  <CardTitle className="text-base">{service.displayName}</CardTitle>
                </div>
                <Badge className={getStatusColor(service.status)}>
                  {getStatusIcon(service.status)}
                  <span className="ml-1">{service.status}</span>
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {service.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Response Time */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Response Time</span>
                  <span className={cn(
                    "font-medium",
                    service.responseTime < 500 ? "text-green-600" :
                    service.responseTime < 1000 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {service.status === 'maintenance' ? 'N/A' : `${service.responseTime}ms`}
                  </span>
                </div>

                {/* Uptime */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Uptime (30 days)</span>
                    <span className="font-medium">{service.uptime}%</span>
                  </div>
                  <Progress value={service.uptime} className="h-2" />
                </div>

                {/* Last Checked */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Last checked</span>
                  <span>{service.lastChecked.toLocaleTimeString()}</span>
                </div>

                {/* Incidents */}
                {service.incidents.length > 0 && (
                  <Alert className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-sm">Active Incident</AlertTitle>
                    <AlertDescription className="text-xs">
                      {service.incidents[0].title}
                    </AlertDescription>
                  </Alert>
                )}

                {/* External Link */}
                {service.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(service.url, '_blank')
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Service
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Auto-refresh toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Auto-refresh</span>
              <span className="text-sm text-gray-500">Updates every 30 seconds</span>
            </div>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <span className="ml-2">{autoRefresh ? 'Enabled' : 'Disabled'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedService.icon}
                  <CardTitle>{selectedService.displayName}</CardTitle>
                  <Badge className={getStatusColor(selectedService.status)}>
                    {getStatusIcon(selectedService.status)}
                    <span className="ml-1">{selectedService.status}</span>
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedService(null)}
                >
                  ×
                </Button>
              </div>
              <CardDescription>{selectedService.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Endpoints */}
              <div>
                <h4 className="font-medium mb-2">API Endpoints</h4>
                <div className="space-y-2">
                  {selectedService.endpoints.map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium text-sm">{endpoint.name}</div>
                        <div className="text-xs text-gray-500">{endpoint.url}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(endpoint.status)}
                        <span className="text-sm">{endpoint.responseTime}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incidents */}
              {selectedService.incidents.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Recent Incidents</h4>
                  <div className="space-y-2">
                    {selectedService.incidents.map((incident) => (
                      <div key={incident.id} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-sm">{incident.title}</h5>
                          <Badge variant="outline">{incident.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                        <div className="text-xs text-gray-500">
                          Started: {incident.startTime.toLocaleString()}
                          {incident.resolvedTime && (
                            <span> • Resolved: {incident.resolvedTime.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default GovernmentServiceMonitor