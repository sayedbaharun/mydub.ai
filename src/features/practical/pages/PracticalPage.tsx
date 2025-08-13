import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { 
  Car, 
  Cloud, 
  Train, 
  Phone,
  Info
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { WeatherWidget } from '../components/WeatherWidget'
import { TrafficMap } from '../components/TrafficMap'
import { TransitSchedules } from '../components/TransitSchedules'
import { EmergencyContacts } from '../components/EmergencyContacts'
import { useTranslation } from 'react-i18next'

export function PracticalPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className={cn(
          "text-3xl font-bold mb-2",
          isRTL && "text-right"
        )}>
          {t('practical.title')}
        </h1>
        <p className={cn(
          "text-muted-foreground",
          isRTL && "text-right"
        )}>
          {t('practical.subtitle')}
        </p>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="weather" className="space-y-4">
        <TabsList className={cn(
          "grid w-full grid-cols-2 lg:grid-cols-4",
          isRTL && "flex-row-reverse"
        )}>
          <TabsTrigger value="weather" className={cn(
            "gap-2",
            isRTL && "flex-row-reverse"
          )}>
            <Cloud className="h-4 w-4" />
            {t('practical.tabs.weather')}
          </TabsTrigger>
          <TabsTrigger value="traffic" className={cn(
            "gap-2",
            isRTL && "flex-row-reverse"
          )}>
            <Car className="h-4 w-4" />
            {t('practical.tabs.traffic')}
          </TabsTrigger>
          <TabsTrigger value="transit" className={cn(
            "gap-2",
            isRTL && "flex-row-reverse"
          )}>
            <Train className="h-4 w-4" />
            {t('practical.tabs.transit')}
          </TabsTrigger>
          <TabsTrigger value="emergency" className={cn(
            "gap-2",
            isRTL && "flex-row-reverse"
          )}>
            <Phone className="h-4 w-4" />
            {t('practical.tabs.emergency')}
          </TabsTrigger>
        </TabsList>

        {/* Weather Tab */}
        <TabsContent value="weather" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <WeatherWidget />
            
            {/* Weather Tips */}
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className={cn(
                  "font-semibold mb-2 flex items-center gap-2",
                  isRTL && "flex-row-reverse"
                )}>
                  <Info className="h-4 w-4" />
                  {t('practical.weather.tips.title')}
                </h3>
                <ul className={cn(
                  "space-y-2 text-sm text-muted-foreground",
                  isRTL && "text-right"
                )}>
                  <li>• {t('practical.weather.tips.sunProtection')}</li>
                  <li>• {t('practical.weather.tips.hydration')}</li>
                  <li>• {t('practical.weather.tips.airConditioning')}</li>
                  <li>• {t('practical.weather.tips.dustStorms')}</li>
                </ul>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className={cn(
                  "font-semibold mb-2",
                  isRTL && "text-right"
                )}>
                  {t('practical.weather.seasonal.title')}
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className={cn(
                      "font-medium",
                      isRTL && "text-right"
                    )}>
                      {t('practical.weather.seasonal.summer')}
                    </p>
                    <p className={cn(
                      "text-muted-foreground",
                      isRTL && "text-right"
                    )}>
                      {t('practical.weather.seasonal.summerDesc')}
                    </p>
                  </div>
                  <div>
                    <p className={cn(
                      "font-medium",
                      isRTL && "text-right"
                    )}>
                      {t('practical.weather.seasonal.winter')}
                    </p>
                    <p className={cn(
                      "text-muted-foreground",
                      isRTL && "text-right"
                    )}>
                      {t('practical.weather.seasonal.winterDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Traffic Tab */}
        <TabsContent value="traffic" className="space-y-4">
          <TrafficMap />
          
          {/* Traffic Tips */}
          <div className="rounded-lg border p-4 mt-4">
            <h3 className={cn(
              "font-semibold mb-2 flex items-center gap-2",
              isRTL && "flex-row-reverse"
            )}>
              <Info className="h-4 w-4" />
              {t('practical.traffic.tips.title')}
            </h3>
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <ul className={cn(
                "space-y-2 text-muted-foreground",
                isRTL && "text-right"
              )}>
                <li>• {t('practical.traffic.tips.peakHours')}</li>
                <li>• {t('practical.traffic.tips.salik')}</li>
                <li>• {t('practical.traffic.tips.parking')}</li>
              </ul>
              <ul className={cn(
                "space-y-2 text-muted-foreground",
                isRTL && "text-right"
              )}>
                <li>• {t('practical.traffic.tips.alternativeRoutes')}</li>
                <li>• {t('practical.traffic.tips.publicTransport')}</li>
                <li>• {t('practical.traffic.tips.carpooling')}</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        {/* Transit Tab */}
        <TabsContent value="transit" className="space-y-4">
          <TransitSchedules />
          
          {/* Transit Cards Info */}
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <div className="rounded-lg border p-4">
              <h3 className={cn(
                "font-semibold mb-2",
                isRTL && "text-right"
              )}>
                {t('practical.transit.nolCard.title')}
              </h3>
              <p className={cn(
                "text-sm text-muted-foreground mb-3",
                isRTL && "text-right"
              )}>
                {t('practical.transit.nolCard.description')}
              </p>
              <ul className={cn(
                "space-y-1 text-sm text-muted-foreground",
                isRTL && "text-right"
              )}>
                <li>• {t('practical.transit.nolCard.benefit1')}</li>
                <li>• {t('practical.transit.nolCard.benefit2')}</li>
                <li>• {t('practical.transit.nolCard.benefit3')}</li>
              </ul>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className={cn(
                "font-semibold mb-2",
                isRTL && "text-right"
              )}>
                {t('practical.transit.fares.title')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className={cn(
                  "flex justify-between",
                  isRTL && "flex-row-reverse"
                )}>
                  <span className="text-muted-foreground">{t('practical.transit.fares.metro')}</span>
                  <span className="font-medium">AED 3-8.50</span>
                </div>
                <div className={cn(
                  "flex justify-between",
                  isRTL && "flex-row-reverse"
                )}>
                  <span className="text-muted-foreground">{t('practical.transit.fares.bus')}</span>
                  <span className="font-medium">AED 3-5</span>
                </div>
                <div className={cn(
                  "flex justify-between",
                  isRTL && "flex-row-reverse"
                )}>
                  <span className="text-muted-foreground">{t('practical.transit.fares.tram')}</span>
                  <span className="font-medium">AED 3</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Emergency Tab */}
        <TabsContent value="emergency" className="space-y-4">
          <EmergencyContacts />
          
          {/* Emergency Tips */}
          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-4 mt-4">
            <h3 className={cn(
              "font-semibold mb-2 text-red-700 dark:text-red-400",
              isRTL && "text-right"
            )}>
              {t('practical.emergency.tips.title')}
            </h3>
            <ul className={cn(
              "space-y-2 text-sm text-red-600 dark:text-red-300",
              isRTL && "text-right"
            )}>
              <li>• {t('practical.emergency.tips.stayCalm')}</li>
              <li>• {t('practical.emergency.tips.clearInfo')}</li>
              <li>• {t('practical.emergency.tips.location')}</li>
              <li>• {t('practical.emergency.tips.followInstructions')}</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}