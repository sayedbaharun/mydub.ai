import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Home,
  Building,
  Newspaper,
  MapPin,
  MessageSquare,
  UtensilsCrossed,
  Moon,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { getTouchTargetClasses, touchFeedback } from '@/shared/lib/mobile-accessibility'
import { useAnnouncer } from '@/shared/lib/accessibility'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    title: 'Today',
    href: '/news',
    icon: Home,
  },
  {
    title: 'Dining',
    href: '/eatanddrink',
    icon: UtensilsCrossed,
  },
  {
    title: 'Tourism',
    href: '/tourism',
    icon: MapPin,
  },
  {
    title: 'Night',
    href: '/nightlife',
    icon: Moon,
  },
  {
    title: 'Ayyan',
    href: '/chat',
    icon: MessageSquare,
  },
]

export function MobileNav() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const announce = useAnnouncer()
  const isRTL = i18n.dir() === 'rtl'

  const handleNavClick = (title: string) => {
    announce(`Navigating to ${t(title)}`, 'polite')
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden pb-safe"
      role="navigation"
      aria-label={t('navigation.mobile.bottomNav')}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="grid h-16 grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => handleNavClick(item.title)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs transition-colors',
                getTouchTargetClasses('medium'),
                touchFeedback.highlight,
                isActive
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={item.title}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="truncate">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Mobile drawer for additional navigation
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Button } from '@/shared/components/ui/button'
import { Separator } from '@/shared/components/ui/separator'
import { useAuth } from '@/features/auth/context/AuthContext'

interface MobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()

  const additionalItems = [
    { title: 'Events', href: '/events', icon: Home },
    { title: 'Traffic', href: '/traffic', icon: Home },
    { title: 'Weather', href: '/weather', icon: Home },
    { title: 'Settings', href: '/settings', icon: Home },
    { title: 'Help', href: '/help', icon: Home },
  ]

  const adminItems = [
    { title: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin', 'editor', 'curator'] },
    { title: 'Editorial', href: '/editorial', icon: Newspaper, roles: ['admin', 'editor', 'publisher'] },
    { title: 'Content', href: '/dashboard/content', icon: Home, roles: ['admin', 'editor'] },
    { title: 'Users', href: '/dashboard/users', icon: Home, roles: ['admin'] },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>{t('app.name')}</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="my-4 h-[calc(100vh-8rem)]">
          <div className="space-y-4">
            {/* Main Navigation */}
            <div className="space-y-1">
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Navigation
              </h3>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href

                return (
                  <Button
                    key={item.href}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link to={item.href} onClick={() => onOpenChange(false)}>
                      <Icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </Link>
                  </Button>
                )
              })}
            </div>

            <Separator />

            {/* Additional Items */}
            <div className="space-y-1">
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                More
              </h3>
              {additionalItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href

                return (
                  <Button
                    key={item.href}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link to={item.href} onClick={() => onOpenChange(false)}>
                      <Icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </Link>
                  </Button>
                )
              })}
            </div>

            {/* Admin Section */}
            {isAuthenticated && (user?.role === 'admin' || user?.role === 'editor' || user?.role === 'curator' || user?.role === 'publisher') && (
              <>
                <Separator />
                <div className="space-y-1">
                  <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Admin
                  </h3>
                  {adminItems
                    .filter(item => !item.roles || item.roles.includes(user.role))
                    .map((item) => {
                      const Icon = item.icon
                      const isActive = location.pathname === item.href

                      return (
                        <Button
                          key={item.href}
                          variant={isActive ? 'secondary' : 'ghost'}
                          className="w-full justify-start"
                          asChild
                        >
                          <Link to={item.href} onClick={() => onOpenChange(false)}>
                            <Icon className="mr-2 h-4 w-4" />
                            {item.title}
                          </Link>
                        </Button>
                      )
                    })}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}