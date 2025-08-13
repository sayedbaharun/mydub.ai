/**
 * High Contrast Mode Component
 * Provides high contrast theme for better visibility
 */

import { useEffect, useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Contrast } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export function HighContrastMode() {
  const [isHighContrast, setIsHighContrast] = useState(false)

  useEffect(() => {
    // Check if user has high contrast preference saved
    const savedPreference = localStorage.getItem('highContrastMode')
    if (savedPreference === 'true') {
      enableHighContrast()
    }

    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    if (mediaQuery.matches) {
      enableHighContrast()
    }

    // Listen for system preference changes
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        enableHighContrast()
      } else if (!localStorage.getItem('highContrastMode')) {
        disableHighContrast()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const enableHighContrast = () => {
    document.documentElement.classList.add('high-contrast')
    setIsHighContrast(true)
    localStorage.setItem('highContrastMode', 'true')
  }

  const disableHighContrast = () => {
    document.documentElement.classList.remove('high-contrast')
    setIsHighContrast(false)
    localStorage.removeItem('highContrastMode')
  }

  const toggleHighContrast = () => {
    if (isHighContrast) {
      disableHighContrast()
    } else {
      enableHighContrast()
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleHighContrast}
      className={cn(
        'relative',
        isHighContrast && 'text-blue-600 bg-blue-50'
      )}
      aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
      aria-pressed={isHighContrast}
    >
      <Contrast className="h-5 w-5" />
    </Button>
  )
}

// High contrast CSS to be added to index.css
export const highContrastStyles = `
/* High Contrast Mode Styles */
.high-contrast {
  /* Increase contrast for text */
  --tw-text-opacity: 1;
  
  /* Background colors */
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  
  /* Stronger borders */
  --border: 0 0% 0%;
  
  /* High contrast colors */
  --primary: 0 0% 0%;
  --primary-foreground: 0 0% 100%;
  
  --secondary: 0 0% 90%;
  --secondary-foreground: 0 0% 0%;
  
  --muted: 0 0% 85%;
  --muted-foreground: 0 0% 0%;
  
  --accent: 0 0% 80%;
  --accent-foreground: 0 0% 0%;
  
  --destructive: 0 84% 40%;
  --destructive-foreground: 0 0% 100%;
}

.high-contrast.dark {
  /* Dark mode high contrast */
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
  
  --border: 0 0% 100%;
  
  --primary: 0 0% 100%;
  --primary-foreground: 0 0% 0%;
  
  --secondary: 0 0% 10%;
  --secondary-foreground: 0 0% 100%;
  
  --muted: 0 0% 15%;
  --muted-foreground: 0 0% 100%;
  
  --accent: 0 0% 20%;
  --accent-foreground: 0 0% 100%;
}

/* High contrast specific overrides */
.high-contrast * {
  /* Remove all shadows */
  box-shadow: none !important;
  text-shadow: none !important;
  
  /* Stronger focus indicators */
  &:focus {
    outline: 3px solid currentColor !important;
    outline-offset: 2px !important;
  }
}

.high-contrast img,
.high-contrast video {
  /* Increase image contrast */
  filter: contrast(1.2);
}

.high-contrast a {
  /* Underline all links */
  text-decoration: underline !important;
  text-decoration-thickness: 2px !important;
}

.high-contrast button,
.high-contrast [role="button"] {
  /* Stronger button borders */
  border: 2px solid currentColor !important;
}

.high-contrast input,
.high-contrast textarea,
.high-contrast select {
  /* Stronger form field borders */
  border: 2px solid currentColor !important;
}

/* Ensure sufficient contrast for placeholders */
.high-contrast ::placeholder {
  opacity: 0.8;
}

/* High contrast loading states */
.high-contrast .animate-pulse {
  animation: none;
  background-color: var(--muted);
  border: 2px dashed currentColor;
}

/* High contrast for disabled elements */
.high-contrast [disabled],
.high-contrast [aria-disabled="true"] {
  opacity: 0.6;
  cursor: not-allowed;
  text-decoration: line-through;
}
`