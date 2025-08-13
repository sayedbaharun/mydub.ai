import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { LANGUAGES } from '@/shared/lib/constants'
import { useLanguageSwitcher } from '@/shared/hooks/useRTL'
import { cn } from '@/shared/lib/utils'

interface LanguageSwitcherProps {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
  className?: string
}

export function LanguageSwitcher({
  variant = 'ghost',
  size = 'default',
  showLabel = true,
  className,
}: LanguageSwitcherProps) {
  const { t } = useTranslation()
  const { currentLanguage, changeLanguage } = useLanguageSwitcher()
  const [isOpen, setIsOpen] = useState(false)
  
  const currentLang = LANGUAGES.find((lang) => lang.code === currentLanguage) || LANGUAGES[0]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn('gap-2', className)}
        >
          {size === 'icon' ? (
            <Globe className="h-4 w-4" />
          ) : (
            <>
              <span className="text-lg">{currentLang.flag}</span>
              {showLabel && (
                <>
                  <span className="hidden sm:inline">{currentLang.name}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </>
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className="gap-2"
          >
            <span className="text-lg">{language.flag}</span>
            <div className="flex-1">
              <div className="font-medium">{language.name}</div>
              <div className="text-xs text-muted-foreground">
                {language.nativeName}
              </div>
            </div>
            {currentLanguage === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Compact version for mobile
export function LanguageSwitcherCompact() {
  const { currentLanguage, changeLanguage } = useLanguageSwitcher()

  return (
    <div className="flex items-center gap-1">
      {LANGUAGES.map((language) => (
        <Button
          key={language.code}
          variant={currentLanguage === language.code ? 'default' : 'ghost'}
          size="sm"
          onClick={() => changeLanguage(language.code)}
          className="px-2"
        >
          <span className="text-lg">{language.flag}</span>
        </Button>
      ))}
    </div>
  )
}