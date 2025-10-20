import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  LayoutDashboard,
  Newspaper,
  Menu,
  X,
  Bookmark
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { EnhancedSearchBar } from '@/features/search/components/EnhancedSearchBar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { NotificationCenter } from '@/shared/components/pwa/NotificationCenter'
import { MobileDrawer } from './MobileNav'
import { HighContrastMode } from '@/shared/components/accessibility/HighContrastMode'
import { ThemeToggle } from '@/shared/components/theme/ThemeToggle'
import { useAuth, useRole } from '@/features/auth/context/AuthContext'
import { useAnnouncer } from '@/shared/lib/accessibility'
import { cn } from '@/shared/lib/utils'

interface HeaderProps {
  className?: string
}

const navigationItems = [
  { 
    label: 'Today', 
    shortLabel: 'Today',
    href: '/news',
    priority: 1 
  },
  { 
    label: 'Dining', 
    shortLabel: 'Dining',
    href: '/eatanddrink',
    priority: 2 
  },
  { 
    label: 'Experiences', 
    shortLabel: 'Tourism',
    href: '/tourism',
    priority: 3 
  },
  { 
    label: 'Nightlife', 
    shortLabel: 'Night',
    href: '/nightlife',
    priority: 4 
  },
  { 
    label: 'Luxury', 
    shortLabel: 'Luxury',
    href: '/luxurylife',
    priority: 5 
  },
  { 
    label: 'Practical', 
    shortLabel: 'Gov',
    href: '/government',
    priority: 6 
  },
]

export function Header({ className }: HeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut, isAuthenticated } = useAuth()
  const canAccessDashboard = useRole(['curator', 'editor', 'admin'])
  const canAccessEditorial = useRole(['editor', 'admin', 'publisher'])
  const announce = useAnnouncer()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      announce('You have been signed out successfully', 'polite')
      navigate('/')
    } catch (error) {
      announce('Error signing out. Please try again.', 'assertive')
    }
  }

  const userInitials = user?.fullName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <header 
      className={cn(
        'sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm',
        className
      )}
      role="banner"
      aria-label="Site header with navigation and user tools"
    >
      <div className="container mx-auto px-4">
        {/* Row 1: Functional Tools - Logo, Search, AI, Language, Notifications, User Menu */}
        <div className="flex h-14 items-center justify-between">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden h-9 w-9 p-0 flex-shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 flex-shrink-0"
            aria-label="MyDub.AI homepage"
          >
            <img 
              src="/mydub-logo-200.png" 
              alt="MyDub.AI" 
              className="h-12 sm:h-14 md:h-16 w-auto object-contain"
              onLoad={() => console.log('Logo loaded successfully')}
              onError={(e) => {
                console.error('Logo failed to load:', e);
              }}
            />
          </Link>

          {/* Center: Search Bar - Properly Sized */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4 md:mx-8">
            <EnhancedSearchBar
              placeholder="Search for news, events, dining, and more..."
              showSuggestions={true}
              size="sm"
              className="w-full md:hidden"
            />
            <EnhancedSearchBar
              placeholder="Search for news, events, dining, and more..."
              showSuggestions={true}
              size="md"
              className="w-full hidden md:block"
            />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
            {/* AI Assistant Button */}
            <Button
              onClick={() => {
                announce('Opening AI assistant chat', 'polite')
                navigate('/chat')
              }}
              size="sm"
              className="flex items-center gap-1 sm:gap-2 bg-ai-blue hover:bg-ai-blue/90 text-white shadow-sm rounded-xl transition-all duration-200 px-2 sm:px-3 py-1.5 sm:py-2"
              aria-label="Open AI assistant chat with Ayyan"
            >
              <span className="text-xs sm:text-sm" aria-hidden="true">🤖</span>
              <span className="hidden lg:inline text-xs sm:text-sm">Ask Ayyan</span>
              <span className="hidden sm:inline lg:hidden text-xs sm:text-sm">Ayyan</span>
            </Button>

            {/* Language Switcher - Hidden on mobile */}
            <div aria-label="Language selection" className="hidden sm:block">
              <LanguageSwitcher variant="ghost" size="sm" showLabel={false} />
            </div>

            {/* High Contrast Mode - Hidden on mobile */}
            <div className="hidden sm:block">
              <HighContrastMode />
            </div>

            {/* Theme Toggle - Hidden on mobile */}
            <div className="hidden sm:block">
              <ThemeToggle variant="ghost" size="sm" />
            </div>

            {/* Notifications - Hidden on mobile */}
            {isAuthenticated && (
              <div className="hidden sm:block">
                <NotificationCenter />
              </div>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full flex-shrink-0"
                    aria-label={`User menu for ${user?.fullName || 'current user'}`}
                    aria-haspopup="true"
                    aria-expanded={false}
                  >
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                      <AvatarImage 
                        src={user?.avatar} 
                        alt={`${user?.fullName}'s profile picture`} 
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs sm:text-sm">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-56" 
                  align="end"
                  role="menu"
                  aria-label="User account menu"
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {canAccessDashboard && (
                    <DropdownMenuItem 
                      onClick={() => {
                        announce('Navigating to dashboard', 'polite')
                        navigate('/dashboard')
                      }}
                      role="menuitem"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden="true" />
                      Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => {
                      announce('Navigating to profile', 'polite')
                      navigate('/profile')
                    }}
                    role="menuitem"
                  >
                    <User className="mr-2 h-4 w-4" aria-hidden="true" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      announce('Navigating to bookmarks', 'polite')
                      navigate('/bookmarks')
                    }}
                    role="menuitem"
                  >
                    <Bookmark className="mr-2 h-4 w-4" aria-hidden="true" />
                    Bookmarks
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      announce('Navigating to settings', 'polite')
                      navigate('/settings')
                    }}
                    role="menuitem"
                  >
                    <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    role="menuitem"
                  >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2" role="group" aria-label="Authentication actions">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    announce('Navigating to sign in', 'polite')
                    navigate('/auth/signin')
                  }}
                  className="hidden sm:flex text-xs sm:text-sm px-2 sm:px-3"
                  aria-label="Sign in to your account"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    announce('Navigating to sign up', 'polite')
                    navigate('/auth/signup')
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                  aria-label="Create a new account"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Content Navigation - Hidden on Mobile */}
        <div className="border-t border-gray-100 hidden md:block">
          <nav 
            className="flex h-12 items-center justify-center"
            role="navigation"
            aria-label="Main site navigation"
            id="main-navigation"
          >
            <div className="flex items-center gap-2 lg:gap-4" role="menubar">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== '/' && location.pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'relative px-3 md:px-4 lg:px-6 py-2 text-sm font-medium rounded-lg transition-all duration-300 whitespace-nowrap',
                      // Focus styles
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                    role="menuitem"
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={`Navigate to ${item.label} section`}
                  >
                    {/* Desktop (1024px+): Full Labels */}
                    <span className="hidden lg:inline">
                      {item.label}
                    </span>
                    
                    {/* Tablet (768px-1023px): Short Labels */}
                    <span className="inline lg:hidden">
                      {item.shortLabel}
                    </span>
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      </div>
      
      {/* Mobile Navigation Drawer */}
      <MobileDrawer 
        open={isMobileMenuOpen} 
        onOpenChange={setIsMobileMenuOpen} 
      />
    </header>
  )
}