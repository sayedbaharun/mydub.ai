import { useState } from 'react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { 
  Navigation, 
  Car, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  RefreshCw,
  Route,
  Construction,
  Zap,
  Timer
} from 'lucide-react'

interface TrafficRoute {
  road: string
  road_ar: string
  area: string
  area_ar: string
  status: 'smooth' | 'moderate' | 'heavy' | 'blocked'
  description: string
  description_ar: string
  travelTime: string
  distance: string
  incidents?: string[]
}

interface TrafficIncident {
  id: string
  type: 'accident' | 'construction' | 'event' | 'closure'
  road: string
  description: string
  time: string
  severity: 'low' | 'medium' | 'high'
}

export default function TrafficPage() {
  const [trafficRoutes] = useState<TrafficRoute[]>([
    {
      road: 'Sheikh Zayed Road',
      road_ar: 'شارع الشيخ زايد',
      area: 'Downtown to Dubai Marina',
      area_ar: 'من وسط المدينة إلى مرسى دبي',
      status: 'moderate',
      description: 'Moderate traffic flow, expect 5-10 minute delays',
      description_ar: 'حركة مرور متوسطة، توقع تأخير 5-10 دقائق',
      travelTime: '25 min',
      distance: '18 km',
      incidents: ['Lane closure near DIFC']
    },
    {
      road: 'Al Khaleej Road',
      road_ar: 'شارع الخليج',
      area: 'Dubai International to Deira',
      area_ar: 'من دبي الدولي إلى ديرة',
      status: 'smooth',
      description: 'Clear traffic conditions',
      description_ar: 'ظروف مرورية واضحة',
      travelTime: '15 min',
      distance: '12 km'
    },
    {
      road: 'Jumeirah Beach Road',
      road_ar: 'شارع شاطئ جميرا',
      area: 'Jumeirah to Dubai Marina',
      area_ar: 'من جميرا إلى مرسى دبي',
      status: 'heavy',
      description: 'Heavy traffic near Mall of the Emirates',
      description_ar: 'ازدحام شديد بالقرب من مول الإمارات',
      travelTime: '35 min',
      distance: '15 km',
      incidents: ['Heavy congestion near MOE', 'Event traffic']
    },
    {
      road: 'Mohammed Bin Zayed Road',
      road_ar: 'شارع محمد بن زايد',
      area: 'Dubai South to Dubai Marina',
      area_ar: 'من دبي الجنوب إلى مرسى دبي',
      status: 'blocked',
      description: 'Road closure due to construction work',
      description_ar: 'إغلاق الطريق بسبب أعمال البناء',
      travelTime: '45 min',
      distance: '25 km',
      incidents: ['Major construction', 'Detour recommended']
    },
    {
      road: 'Emirates Road',
      road_ar: 'شارع الإمارات',
      area: 'Sharjah Border to Dubai',
      area_ar: 'من حدود الشارقة إلى دبي',
      status: 'smooth',
      description: 'Good traffic flow with minor slowdowns',
      description_ar: 'تدفق مروري جيد مع تباطؤ طفيف',
      travelTime: '20 min',
      distance: '22 km'
    },
    {
      road: 'Al Wasl Road',
      road_ar: 'شارع الوصل',
      area: 'Business Bay to Dubai Mall',
      area_ar: 'من خليج الأعمال إلى دبي مول',
      status: 'moderate',
      description: 'Moderate traffic with school zone delays',
      description_ar: 'حركة مرور متوسطة مع تأخير منطقة المدارس',
      travelTime: '18 min',
      distance: '8 km'
    }
  ])

  const [incidents] = useState<TrafficIncident[]>([
    {
      id: '1',
      type: 'construction',
      road: 'Mohammed Bin Zayed Road',
      description: 'Major construction work ongoing - Use alternative routes',
      time: '2 hours ago',
      severity: 'high'
    },
    {
      id: '2',
      type: 'accident',
      road: 'Sheikh Zayed Road',
      description: 'Minor accident cleared - Some delays remain',
      time: '30 minutes ago',
      severity: 'medium'
    },
    {
      id: '3',
      type: 'event',
      road: 'Jumeirah Beach Road',
      description: 'Event traffic near Dubai Marina - Allow extra time',
      time: '1 hour ago',
      severity: 'medium'
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'smooth':
        return 'bg-green-500'
      case 'moderate':
        return 'bg-yellow-500'
      case 'heavy':
        return 'bg-orange-500'
      case 'blocked':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'smooth':
        return 'Smooth'
      case 'moderate':
        return 'Moderate'
      case 'heavy':
        return 'Heavy'
      case 'blocked':
        return 'Blocked'
      default:
        return 'Unknown'
    }
  }

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'accident':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'construction':
        return <Construction className="h-4 w-4 text-orange-500" />
      case 'event':
        return <Zap className="h-4 w-4 text-blue-500" />
      case 'closure':
        return <Route className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'border-green-200 bg-green-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      case 'high':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-midnight-black">Dubai Traffic</h1>
          <div className="flex items-center gap-2 mt-2 text-quartz-gray">
            <MapPin className="h-4 w-4" />
            <span>Live traffic conditions across Dubai</span>
            <Clock className="h-4 w-4 ml-4" />
            <span>Updated 2 minutes ago</span>
          </div>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Traffic Status Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-semibold text-midnight-black">Smooth</span>
          </div>
          <div className="text-2xl font-bold text-green-600">2</div>
          <div className="text-sm text-quartz-gray">routes</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="font-semibold text-midnight-black">Moderate</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600">2</div>
          <div className="text-sm text-quartz-gray">routes</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="font-semibold text-midnight-black">Heavy</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">1</div>
          <div className="text-sm text-quartz-gray">route</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="font-semibold text-midnight-black">Blocked</span>
          </div>
          <div className="text-2xl font-bold text-red-600">1</div>
          <div className="text-sm text-quartz-gray">route</div>
        </Card>
      </div>

      {/* Current Incidents */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-midnight-black mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Current Traffic Incidents
        </h3>
        <div className="space-y-3">
          {incidents.map((incident) => (
            <div key={incident.id} className={`p-4 rounded-lg border ${getSeverityColor(incident.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getIncidentIcon(incident.type)}
                  <div className="flex-1">
                    <div className="font-medium text-midnight-black">{incident.road}</div>
                    <div className="text-sm text-quartz-gray mt-1">{incident.description}</div>
                  </div>
                </div>
                <div className="text-xs text-quartz-gray">{incident.time}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Major Routes */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-midnight-black mb-6 flex items-center gap-2">
          <Navigation className="h-5 w-5 text-ai-blue" />
          Major Routes
        </h3>
        
        <div className="space-y-4">
          {trafficRoutes.map((route, index) => (
            <div key={index} className="p-4 rounded-lg border border-gray-200 bg-gradient-to-r from-pearl-white to-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(route.status)}`}></div>
                    <div>
                      <div className="font-semibold text-midnight-black">{route.road}</div>
                      <div className="text-sm text-quartz-gray">{route.area}</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-quartz-gray mb-2">
                    {route.description}
                  </div>
                  
                  {route.incidents && route.incidents.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      <span className="text-xs text-amber-700">
                        {route.incidents.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="text-right ml-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Timer className="h-4 w-4 text-ai-blue" />
                    <span className="font-semibold text-midnight-black">{route.travelTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 text-quartz-gray" />
                    <span className="text-sm text-quartz-gray">{route.distance}</span>
                  </div>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      route.status === 'smooth' ? 'bg-green-100 text-green-700' :
                      route.status === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                      route.status === 'heavy' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {getStatusText(route.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Traffic Tips */}
      <Card className="p-6 bg-gradient-to-r from-ai-blue/5 to-desert-gold/5 border border-ai-blue/20">
        <h3 className="text-xl font-semibold text-midnight-black mb-4">Traffic Tips</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-ai-blue mt-0.5" />
              <div>
                <div className="font-medium text-midnight-black">Peak Hours</div>
                <div className="text-sm text-quartz-gray">Avoid 7-9 AM and 5-7 PM for better travel times.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Route className="h-5 w-5 text-desert-gold mt-0.5" />
              <div>
                <div className="font-medium text-midnight-black">Alternative Routes</div>
                <div className="text-sm text-quartz-gray">Use Emirates Road or Al Khaleej Road for fewer delays.</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Car className="h-5 w-5 text-quartz-gray mt-0.5" />
              <div>
                <div className="font-medium text-midnight-black">Public Transport</div>
                <div className="text-sm text-quartz-gray">Metro and bus services offer reliable alternatives during peak traffic.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Navigation className="h-5 w-5 text-ai-blue mt-0.5" />
              <div>
                <div className="font-medium text-midnight-black">Real-time Updates</div>
                <div className="text-sm text-quartz-gray">Check traffic conditions before leaving for the best route planning.</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
} 