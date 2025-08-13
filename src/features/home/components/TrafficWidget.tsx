import { useState } from 'react'
import { Card } from '@/shared/components/ui/card'
import { Car, Navigation, AlertTriangle } from 'lucide-react'

interface TrafficRoute {
  road: string
  status: 'smooth' | 'moderate' | 'heavy' | 'blocked'
  description: string
}

export function TrafficWidget() {
  const [trafficData] = useState<TrafficRoute[]>([
    {
      road: 'Sheikh Zayed Rd',
      status: 'moderate',
      description: 'Moderate traffic to Downtown'
    },
    {
      road: 'Al Khaleej Rd',
      status: 'smooth',
      description: 'Clear traffic flow'
    },
    {
      road: 'Jumeirah Beach Rd',
      status: 'heavy',
      description: 'Heavy near Mall of Emirates'
    },
    {
      road: 'Mohammed Bin Zayed Rd',
      status: 'blocked',
      description: 'Construction work ongoing'
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

  return (
    <Card className="p-6 bg-gradient-to-br from-desert-gold/10 to-ai-blue/10 border border-desert-gold/20 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Navigation className="h-5 w-5 text-ai-blue" />
        <h3 className="text-lg font-semibold text-midnight-black">Live Traffic</h3>
      </div>
      
      <div className="space-y-3">
        {trafficData.slice(0, 3).map((route, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-midnight-black text-sm">{route.road}</div>
              <div className="text-xs text-quartz-gray">{route.description}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(route.status)}`}></div>
              <span className="text-xs font-medium text-quartz-gray">
                {getStatusText(route.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-quartz-gray">
          <Car className="h-3 w-3" />
          <span>Updated 2 minutes ago</span>
        </div>
      </div>
      
      {/* Alert for blocked road */}
      <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-800">
            Road closure on MBZ Road - Allow extra travel time
          </p>
        </div>
      </div>
    </Card>
  )
} 