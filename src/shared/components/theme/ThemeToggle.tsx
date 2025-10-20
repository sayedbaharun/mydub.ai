import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { useTheme } from './ThemeProvider'
import { cn } from '@/shared/lib/utils'

interface ThemeToggleProps {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({
  variant = 'ghost',
  size = 'icon',
  className,
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, setTheme, effectiveTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn('gap-2', className)}
          aria-label="Toggle theme"
        >
          {effectiveTheme === 'dark' ? (
            <>
              <Moon className="h-[1.2rem] w-[1.2rem]" />
              {showLabel && <span className="sr-only lg:not-sr-only">Dark</span>}
            </>
          ) : (
            <>
              <Sun className="h-[1.2rem] w-[1.2rem]" />
              {showLabel && <span className="sr-only lg:not-sr-only">Light</span>}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={cn(
            'gap-2 cursor-pointer',
            theme === 'light' && 'bg-gray-100 dark:bg-gray-800'
          )}
        >
          <Sun className="h-4 w-4" />
          <span>Light</span>
          {theme === 'light' && (
            <span className="ml-auto text-xs text-dubai-gold-600">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={cn(
            'gap-2 cursor-pointer',
            theme === 'dark' && 'bg-gray-100 dark:bg-gray-800'
          )}
        >
          <Moon className="h-4 w-4" />
          <span>Dark</span>
          {theme === 'dark' && (
            <span className="ml-auto text-xs text-dubai-gold-600">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={cn(
            'gap-2 cursor-pointer',
            theme === 'system' && 'bg-gray-100 dark:bg-gray-800'
          )}
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
          {theme === 'system' && (
            <span className="ml-auto text-xs text-dubai-gold-600">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
