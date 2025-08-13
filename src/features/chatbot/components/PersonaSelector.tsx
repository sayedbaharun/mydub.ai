import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { AIPersona } from '../types'
import { AI_PERSONAS } from '../data/personas'
import { cn } from '@/shared/lib/utils'

interface PersonaSelectorProps {
  selectedPersona: AIPersona
  onPersonaChange: (persona: AIPersona) => void
  isRTL: boolean
}

export function PersonaSelector({
  selectedPersona,
  onPersonaChange,
  isRTL,
}: PersonaSelectorProps) {
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  return (
    <Select
      value={selectedPersona.id}
      onValueChange={(value) => {
        const persona = AI_PERSONAS.find(p => p.id === value)
        if (persona) onPersonaChange(persona)
      }}
    >
      <SelectTrigger className={cn("w-full", isRTL && "text-right")}>
        <SelectValue>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-sm">
                {selectedPersona.avatar}
              </AvatarFallback>
            </Avatar>
            <span>{isArabic ? selectedPersona.nameAr : selectedPersona.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {AI_PERSONAS.map((persona) => (
          <SelectItem key={persona.id} value={persona.id}>
            <div className="flex items-center gap-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{persona.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {isArabic ? persona.nameAr : persona.name}
                  </span>
                  {selectedPersona.id === persona.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {isArabic ? persona.descriptionAr : persona.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {persona.specialties.slice(0, 3).map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}