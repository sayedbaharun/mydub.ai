/**
 * Accessibility Utilities
 * Helper functions for improving accessibility
 */

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0
export function generateId(prefix = 'mydub'): string {
  return `${prefix}-${++idCounter}-${Date.now()}`
}

/**
 * Check if an element is visible
 */
export function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)
  
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  )
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ')

  const elements = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
  return elements.filter(isElementVisible)
}

/**
 * Manage focus restoration
 */
export class FocusManager {
  private previousFocus: HTMLElement | null = null

  save(): void {
    this.previousFocus = document.activeElement as HTMLElement
  }

  restore(): void {
    if (this.previousFocus && this.previousFocus.focus) {
      this.previousFocus.focus()
    }
  }
}

/**
 * Debounce function for screen reader announcements
 */
export function debounceAnnouncement(
  func: (message: string) => void,
  delay: number
): (message: string) => void {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (message: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      func(message)
      timeoutId = null
    }, delay)
  }
}

/**
 * Format time for screen readers
 */
export function formatTimeForScreenReader(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj)
}

/**
 * Create descriptive text for images
 */
export function createImageDescription(
  alt: string,
  context?: {
    isDecorative?: boolean
    caption?: string
    credit?: string
  }
): string {
  if (context?.isDecorative) {
    return ''
  }
  
  let description = alt
  
  if (context?.caption) {
    description += `. Caption: ${context.caption}`
  }
  
  if (context?.credit) {
    description += `. Credit: ${context.credit}`
  }
  
  return description
}

/**
 * ARIA live region priorities
 */
export const ARIA_LIVE_PRIORITIES = {
  LOW: 'polite',
  MEDIUM: 'polite',
  HIGH: 'assertive',
  URGENT: 'assertive'
} as const

/**
 * Common ARIA labels
 */
export const ARIA_LABELS = {
  CLOSE: 'Close',
  MENU: 'Menu',
  NAVIGATION: 'Navigation',
  SEARCH: 'Search',
  LOADING: 'Loading',
  ERROR: 'Error',
  SUCCESS: 'Success',
  WARNING: 'Warning',
  INFO: 'Information',
  PREVIOUS: 'Previous',
  NEXT: 'Next',
  PLAY: 'Play',
  PAUSE: 'Pause',
  MUTE: 'Mute',
  UNMUTE: 'Unmute',
  EXPAND: 'Expand',
  COLLAPSE: 'Collapse',
  MORE_OPTIONS: 'More options',
  SHARE: 'Share',
  BOOKMARK: 'Bookmark',
  REMOVE_BOOKMARK: 'Remove bookmark',
  FILTER: 'Filter',
  SORT: 'Sort',
  SETTINGS: 'Settings',
  PROFILE: 'Profile',
  LOGOUT: 'Log out',
  LOGIN: 'Log in',
  REGISTER: 'Register'
} as const

/**
 * Keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace'
} as const

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  // Convert hex to RGB
  const getRGB = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0]
  }

  // Calculate relative luminance
  const getLuminance = (rgb: [number, number, number]): number => {
    const [r, g, b] = rgb.map((val) => {
      val = val / 255
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const lum1 = getLuminance(getRGB(color1))
  const lum2 = getLuminance(getRGB(color2))
  
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  
  return (brightest + 0.05) / (darkest + 0.05)
}

/**
 * Check if contrast ratio meets WCAG standards
 */
export function meetsContrastStandard(
  ratio: number,
  level: 'AA' | 'AAA' = 'AA',
  fontSize: 'normal' | 'large' = 'normal'
): boolean {
  if (level === 'AA') {
    return fontSize === 'large' ? ratio >= 3 : ratio >= 4.5
  } else {
    return fontSize === 'large' ? ratio >= 4.5 : ratio >= 7
  }
}

/**
 * Setup focus visible tracking
 * Tracks keyboard vs mouse navigation
 */
export function setupFocusVisible() {
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

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('mousedown', handleMouseDown)
  }
}