/**
 * Mobile Accessibility Utilities
 * Ensures WCAG 2.1 AA compliance for touch targets and mobile interactions
 */

import { cn } from '@/shared/lib/utils'

/**
 * Minimum touch target size according to WCAG 2.1 AA
 * 44x44 CSS pixels minimum
 */
export const MINIMUM_TOUCH_TARGET = 44

/**
 * Touch target size classes for consistent mobile accessibility
 */
export const touchTargetClasses = {
  small: 'min-h-[44px] min-w-[44px] touch-manipulation',
  medium: 'min-h-[48px] min-w-[48px] touch-manipulation',
  large: 'min-h-[56px] min-w-[56px] touch-manipulation',
} as const

/**
 * Get touch-optimized classes for interactive elements
 */
export function getTouchTargetClasses(
  size: keyof typeof touchTargetClasses = 'small',
  className?: string
): string {
  return cn(touchTargetClasses[size], className)
}

/**
 * Mobile-optimized button classes with proper touch targets
 */
export const mobileButtonClasses = {
  primary: cn(
    getTouchTargetClasses('medium'),
    'flex items-center justify-center px-6 py-3',
    'text-base font-medium',
    'rounded-lg',
    'transition-all duration-200',
    'active:scale-95',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Focus styles for keyboard navigation
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
  ),
  secondary: cn(
    getTouchTargetClasses('medium'),
    'flex items-center justify-center px-4 py-2',
    'text-sm font-medium',
    'rounded-md',
    'transition-all duration-200',
    'active:scale-95',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
  ),
  icon: cn(
    getTouchTargetClasses('small'),
    'flex items-center justify-center',
    'rounded-full',
    'transition-all duration-200',
    'active:scale-95',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
  ),
}

/**
 * Mobile-optimized spacing classes
 */
export const mobileSpacing = {
  // Minimum spacing between touch targets
  gap: 'gap-2', // 8px minimum
  // Padding for mobile screens
  pagePadding: 'px-4 sm:px-6 md:px-8',
  // Section spacing
  sectionSpacing: 'py-4 sm:py-6 md:py-8',
}

/**
 * Hook to detect touch device
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  )
}

/**
 * Mobile viewport utilities
 */
export const mobileViewport = {
  // Safe area insets for notched devices
  safeArea: 'pb-safe pt-safe px-safe',
  // Full viewport height accounting for mobile browsers
  fullHeight: 'h-[100dvh]',
  // Responsive text sizing
  responsiveText: {
    heading: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
    subheading: 'text-xl sm:text-2xl md:text-3xl',
    body: 'text-base sm:text-lg',
    small: 'text-sm sm:text-base',
  },
}

/**
 * Mobile-optimized form input classes
 */
export const mobileInputClasses = cn(
  'w-full',
  'min-h-[44px]', // Touch target
  'px-4 py-3',
  'text-base', // 16px minimum to prevent zoom on iOS
  'rounded-lg',
  'border border-gray-300',
  'transition-colors duration-200',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  // iOS specific styles
  'appearance-none',
  '[&::-webkit-search-cancel-button]:hidden',
  '[&::-webkit-search-decoration]:hidden'
)

/**
 * Mobile menu classes with proper spacing
 */
export const mobileMenuClasses = {
  menuItem: cn(
    getTouchTargetClasses('medium'),
    'flex items-center justify-between',
    'w-full px-4 py-3',
    'text-base font-medium',
    'transition-colors duration-200',
    'hover:bg-gray-50',
    'focus:outline-none focus:bg-gray-50',
    'active:bg-gray-100'
  ),
  menuDivider: 'my-2 border-t border-gray-200',
}

/**
 * Responsive breakpoint utilities
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

/**
 * Get current breakpoint
 */
export function getCurrentBreakpoint(): keyof typeof breakpoints | 'xs' {
  if (typeof window === 'undefined') return 'xs'
  
  const width = window.innerWidth
  
  if (width < breakpoints.sm) return 'xs'
  if (width < breakpoints.md) return 'sm'
  if (width < breakpoints.lg) return 'md'
  if (width < breakpoints.xl) return 'lg'
  if (width < breakpoints['2xl']) return 'xl'
  return '2xl'
}

/**
 * Mobile gesture utilities
 */
export const mobileGestures = {
  // Swipeable area classes
  swipeable: cn(
    'touch-pan-y',
    'select-none',
    'cursor-grab active:cursor-grabbing'
  ),
  // Prevent accidental taps
  tapDelay: 'touch-manipulation',
  // Smooth scrolling
  smoothScroll: 'scroll-smooth overscroll-contain',
}

/**
 * Accessibility announcements for mobile interactions
 */
export const mobileAnnouncements = {
  menuOpened: 'Navigation menu opened. Swipe to explore menu items.',
  menuClosed: 'Navigation menu closed.',
  tabChanged: (tabName: string) => `${tabName} tab selected.`,
  formError: (fieldName: string) => `Error in ${fieldName} field. Please review.`,
  loadingStart: 'Loading content, please wait.',
  loadingComplete: 'Content loaded successfully.',
}

/**
 * Mobile-optimized card classes
 */
export const mobileCardClasses = cn(
  'w-full',
  'p-4 sm:p-6',
  'rounded-lg',
  'bg-white',
  'border border-gray-200',
  'shadow-sm',
  'transition-shadow duration-200',
  'hover:shadow-md',
  'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2'
)

/**
 * Touch feedback utilities
 */
export const touchFeedback = {
  ripple: 'relative overflow-hidden [&::after]:absolute [&::after]:inset-0 [&::after]:bg-current [&::after]:opacity-0 [&::after]:transition-opacity active:[&::after]:opacity-10',
  press: 'transition-transform active:scale-95',
  highlight: 'transition-colors active:bg-gray-100',
}