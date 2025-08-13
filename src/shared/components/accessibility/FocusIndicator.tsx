/**
 * Focus Indicator Component
 * Enhances focus visibility for keyboard navigation
 */

import { useEffect } from 'react'

export function FocusIndicator() {
  useEffect(() => {
    let lastKeyboardEvent = 0

    // Track keyboard usage
    const handleKeyDown = () => {
      lastKeyboardEvent = Date.now()
      document.documentElement.classList.add('keyboard-nav')
    }

    // Remove keyboard nav class on mouse usage
    const handleMouseDown = () => {
      // Only remove if no recent keyboard event
      if (Date.now() - lastKeyboardEvent > 100) {
        document.documentElement.classList.remove('keyboard-nav')
      }
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return null
}

// CSS to be added to index.css
export const focusIndicatorStyles = `
/* Enhanced Focus Indicators */
.keyboard-nav *:focus {
  outline: 3px solid var(--ring, #3b82f6) !important;
  outline-offset: 2px !important;
}

/* Custom focus styles for different elements */
.keyboard-nav button:focus,
.keyboard-nav [role="button"]:focus {
  outline-offset: 4px !important;
}

.keyboard-nav input:focus,
.keyboard-nav textarea:focus,
.keyboard-nav select:focus {
  outline-offset: 0 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.keyboard-nav a:focus {
  outline-offset: 2px !important;
  text-decoration: underline;
}

/* Focus within containers */
.keyboard-nav .focus-within\\:ring-2:focus-within {
  ring-width: 3px;
}

/* Consistent focus colors */
:root {
  --focus-ring-color: #3b82f6;
  --focus-ring-color-dark: #60a5fa;
}

.dark {
  --focus-ring-color: var(--focus-ring-color-dark);
}

/* Remove focus indicators for mouse users */
:not(.keyboard-nav) *:focus {
  outline: none;
}

/* Ensure focus is visible in high contrast mode */
.high-contrast *:focus {
  outline: 3px solid currentColor !important;
  outline-offset: 2px !important;
}
`