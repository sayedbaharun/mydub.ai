import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className
}: StatsCardProps) {
  return (
    <Card 
      className={cn(
        "bg-white border border-gray-100 hover:shadow-sm transition-all duration-300 ease-out",
        "hover:border-gray-200 group cursor-default",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-6 px-6">
        <CardTitle className="text-sm font-light text-gray-600 tracking-wide">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-gray-400 group-hover:text-gray-500 transition-colors duration-200">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="text-3xl font-light text-midnight-black mb-1 tracking-tight">
          {value}
        </div>
        {description && (
          <p className="text-sm font-light text-gray-600 mt-2 leading-relaxed">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-4 pt-2">
            {trend.isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-green-500 mr-2 opacity-80" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500 mr-2 opacity-80" />
            )}
            <span
              className={cn(
                "text-sm font-light tracking-wide",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}