import { useState } from 'react'
import { 
  Phone, 
  AlertTriangle, 
  Heart, 
  Flame, 
  Shield,
  Building,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { EMERGENCY_CONTACTS, getContactsByCategory } from '../data/emergency'
import { EmergencyContact } from '../types'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export function EmergencyContacts() {
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null)
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'police':
        return <Shield className="h-5 w-5" />
      case 'medical':
        return <Heart className="h-5 w-5" />
      case 'fire':
        return <Flame className="h-5 w-5" />
      case 'utility':
        return <Building className="h-5 w-5" />
      case 'embassy':
        return <Building className="h-5 w-5" />
      case 'helpline':
        return <HelpCircle className="h-5 w-5" />
      default:
        return <Phone className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'police':
        return 'bg-blue-500'
      case 'medical':
        return 'bg-red-500'
      case 'fire':
        return 'bg-orange-500'
      case 'utility':
        return 'bg-yellow-500'
      case 'embassy':
        return 'bg-purple-500'
      case 'helpline':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const copyNumber = async (number: string, name: string) => {
    try {
      await navigator.clipboard.writeText(number)
      setCopiedNumber(number)
      toast.success(t('practical.emergency.numberCopied', { name }))
      setTimeout(() => setCopiedNumber(null), 2000)
    } catch (error) {
      toast.error(t('practical.emergency.copyError'))
    }
  }

  const callNumber = (number: string) => {
    window.location.href = `tel:${number}`
  }

  const EmergencyCard = ({ contact }: { contact: EmergencyContact }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className={cn(
          "flex items-start gap-3",
          isRTL && "flex-row-reverse"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            getCategoryColor(contact.category),
            "text-white"
          )}>
            {getCategoryIcon(contact.category)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-semibold text-sm mb-1",
              isRTL && "text-right"
            )}>
              {isRTL ? contact.nameAr : contact.name}
            </h4>
            <p className={cn(
              "text-xs text-muted-foreground mb-2",
              isRTL && "text-right"
            )}>
              {isRTL ? contact.descriptionAr : contact.description}
            </p>
            
            <div className={cn(
              "flex items-center gap-2 mb-2",
              isRTL && "flex-row-reverse"
            )}>
              <span className="font-mono text-lg font-bold text-primary">
                {contact.number}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyNumber(contact.number, contact.name)}
              >
                {copiedNumber === contact.number ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>

            <div className={cn(
              "flex items-center gap-2 text-xs",
              isRTL && "flex-row-reverse"
            )}>
              {contact.available24Hours && (
                <Badge variant="secondary" className="text-xs">
                  {t('practical.emergency.available24h')}
                </Badge>
              )}
              {contact.languages.length > 0 && (
                <span className="text-muted-foreground">
                  {contact.languages.join(', ')}
                </span>
              )}
            </div>

            <Button
              className={cn(
                "w-full mt-3 gap-2",
                isRTL && "flex-row-reverse"
              )}
              size="sm"
              onClick={() => callNumber(contact.number)}
            >
              <Phone className="h-4 w-4" />
              {t('practical.emergency.callNow')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Get main emergency numbers
  const mainEmergencies = EMERGENCY_CONTACTS.filter(c => 
    ['police', 'ambulance', 'fire'].includes(c.id)
  )

  return (
    <div className="space-y-6">
      {/* Main Emergency Numbers */}
      <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className={cn(
            "flex items-center gap-2 text-red-700 dark:text-red-400",
            isRTL && "flex-row-reverse"
          )}>
            <AlertTriangle className="h-5 w-5" />
            {t('practical.emergency.mainNumbers')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {mainEmergencies.map((contact) => (
              <div
                key={contact.id}
                className="text-center p-4 rounded-lg bg-white dark:bg-gray-900 shadow-sm"
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2",
                  getCategoryColor(contact.category),
                  "text-white"
                )}>
                  {getCategoryIcon(contact.category)}
                </div>
                <h4 className="font-semibold text-sm mb-1">
                  {isRTL ? contact.nameAr : contact.name}
                </h4>
                <p className="font-mono text-2xl font-bold text-primary mb-2">
                  {contact.number}
                </p>
                <Button
                  size="sm"
                  className={cn(
                    "w-full gap-2",
                    isRTL && "flex-row-reverse"
                  )}
                  onClick={() => callNumber(contact.number)}
                >
                  <Phone className="h-4 w-4" />
                  {t('practical.emergency.call')}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Other Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle>{t('practical.emergency.otherContacts')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="helpline" className="w-full">
            <TabsList className={cn(
              "grid w-full grid-cols-4",
              isRTL && "flex-row-reverse"
            )}>
              <TabsTrigger value="helpline">{t('practical.emergency.category.helpline')}</TabsTrigger>
              <TabsTrigger value="utility">{t('practical.emergency.category.utility')}</TabsTrigger>
              <TabsTrigger value="embassy">{t('practical.emergency.category.embassy')}</TabsTrigger>
              <TabsTrigger value="police">{t('practical.emergency.category.police')}</TabsTrigger>
            </TabsList>

            <TabsContent value="helpline" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                {getContactsByCategory('helpline').map((contact) => (
                  <EmergencyCard key={contact.id} contact={contact} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="utility" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                {getContactsByCategory('utility').map((contact) => (
                  <EmergencyCard key={contact.id} contact={contact} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="embassy" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                {getContactsByCategory('embassy').map((contact) => (
                  <EmergencyCard key={contact.id} contact={contact} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="police" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                {getContactsByCategory('police')
                  .filter(c => !['police', 'ambulance', 'fire'].includes(c.id))
                  .map((contact) => (
                    <EmergencyCard key={contact.id} contact={contact} />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}