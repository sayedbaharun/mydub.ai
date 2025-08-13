import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { 
  CreditCard, 
  UserCheck, 
  Car, 
  Zap, 
  Home, 
  Phone,
  Clock,
  DollarSign,
  FileText,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { useRTL } from '@/shared/hooks/useRTL'
import { cn } from '@/shared/lib/utils'

interface EssentialServiceCardProps {
  service: {
    id: string
    title: string
    title_ar?: string
    description: string
    description_ar?: string
    category: string
    department: {
      name: string
      name_ar?: string
    }
    fees?: string
    processing_time?: string
    processing_time_ar?: string
    requirements?: string[]
    requirements_ar?: string[]
    official_url?: string
    tips?: string[]
    tips_ar?: string[]
    icon?: string
  }
  onClick?: () => void
}

const iconMap: Record<string, React.ComponentType<any>> = {
  CreditCard,
  UserCheck,
  Car,
  Zap,
  Home,
  Phone
}

const categoryColors: Record<string, string> = {
  documents: 'bg-blue-100 text-blue-800',
  visa: 'bg-purple-100 text-purple-800',
  housing: 'bg-green-100 text-green-800',
  transport: 'bg-orange-100 text-orange-800',
  utilities: 'bg-yellow-100 text-yellow-800',
  emergency: 'bg-red-100 text-red-800',
  business: 'bg-indigo-100 text-indigo-800',
  permits: 'bg-gray-100 text-gray-800'
}

export function EssentialServiceCard({ service, onClick }: EssentialServiceCardProps) {
  const { language, isRTL } = useRTL()
  
  const title = isRTL && service.title_ar ? service.title_ar : service.title
  const description = isRTL && service.description_ar ? service.description_ar : service.description
  const departmentName = isRTL && service.department.name_ar ? service.department.name_ar : service.department.name
  const processingTime = isRTL && service.processing_time_ar ? service.processing_time_ar : service.processing_time
  
  const Icon = service.icon ? iconMap[service.icon] || FileText : FileText

  return (
    <Card 
      className={cn(
        "hover:shadow-lg transition-all duration-200 cursor-pointer",
        "border-l-4",
        service.category === 'emergency' ? 'border-l-red-500' : 'border-l-blue-500'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              categoryColors[service.category] || 'bg-gray-100'
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{departmentName}</p>
            </div>
          </div>
          <Badge variant="outline" className="ml-2">
            {service.category}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        
        {/* Key Information */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {service.fees && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{service.fees}</span>
            </div>
          )}
          {processingTime && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{processingTime}</span>
            </div>
          )}
        </div>

        {/* Requirements Preview */}
        {service.requirements && service.requirements.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">Requirements:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              {service.requirements.slice(0, 2).map((req, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span className="line-clamp-1">{req}</span>
                </li>
              ))}
              {service.requirements.length > 2 && (
                <li className="text-blue-600 font-medium">
                  +{service.requirements.length - 2} more...
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
          >
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          
          {service.official_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                window.open(service.official_url, '_blank')
              }}
            >
              Official Site
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}