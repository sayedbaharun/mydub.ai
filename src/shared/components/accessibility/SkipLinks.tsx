/**
 * Skip Links Component for MyDub.ai
 * Provides keyboard navigation shortcuts to main content areas
 */

import React from 'react'
import { cn } from '@/shared/lib/utils'

interface SkipLink {
  href: string
  label: string
  id: string
}

interface SkipLinksProps {
  links?: SkipLink[]
  className?: string
}

const defaultSkipLinks: SkipLink[] = [
  {
    id: 'skip-to-main',
    href: '#main-content',
    label: 'Skip to main content'
  },
  {
    id: 'skip-to-nav',
    href: '#main-navigation',
    label: 'Skip to navigation'
  },
  {
    id: 'skip-to-search',
    href: '#search-input',
    label: 'Skip to search'
  },
  {
    id: 'skip-to-footer',
    href: '#footer-content',
    label: 'Skip to footer'
  }
]

export function SkipLinks({ links = defaultSkipLinks, className }: SkipLinksProps) {
  const handleSkipClick = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault()
    
    // Remove the # from the href to get the element ID
    const elementId = targetId.replace('#', '')
    const targetElement = document.getElementById(elementId)
    
    if (targetElement) {
      // Set focus on the target element
      targetElement.focus()
      
      // If the element is not naturally focusable, make it focusable temporarily
      if (!targetElement.hasAttribute('tabindex')) {
        targetElement.setAttribute('tabindex', '-1')
        targetElement.addEventListener('blur', () => {
          targetElement.removeAttribute('tabindex')
        }, { once: true })
      }
      
      // Smooth scroll to the element
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
      
      // Announce the navigation to screen readers
      const announcement = `Navigated to ${targetElement.getAttribute('aria-label') || targetElement.textContent?.slice(0, 50) || 'content section'}`
      
      // Create a live region announcement
      const announcer = document.createElement('div')
      announcer.setAttribute('aria-live', 'assertive')
      announcer.setAttribute('aria-atomic', 'true')
      announcer.className = 'sr-only'
      announcer.textContent = announcement
      
      document.body.appendChild(announcer)
      setTimeout(() => {
        document.body.removeChild(announcer)
      }, 1000)
    }
  }

  return (
    <nav
      aria-label="Skip navigation links"
      className={cn(
        'skip-links fixed top-0 left-0 z-[9999] pointer-events-none',
        className
      )}
    >
      <ul className="flex flex-col">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={link.href}
              onClick={(e) => handleSkipClick(e, link.href)}
              className={cn(
                // Initially hidden but accessible to screen readers
                'sr-only absolute',
                // Visible when focused
                'focus:not-sr-only focus:relative focus:block',
                // Styling when visible
                'focus:bg-blue-600 focus:text-white',
                'focus:px-4 focus:py-2 focus:m-2',
                'focus:rounded focus:shadow-lg',
                'focus:font-medium focus:text-sm',
                'focus:border-2 focus:border-blue-800',
                'focus:outline-none focus:ring-2 focus:ring-blue-300',
                // Enable pointer events when focused
                'focus:pointer-events-auto',
                // Smooth transitions
                'transition-all duration-200',
                // Ensure proper z-index
                'focus:z-[10000]'
              )}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * Hook to register skip link targets
 * Ensures proper IDs and ARIA labels are set on target elements
 */
export function useSkipLinkTarget(
  elementRef: React.RefObject<HTMLElement>,
  targetId: string,
  ariaLabel?: string
) {
  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Set the ID for skip link targeting
    element.id = targetId
    
    // Add appropriate ARIA label if provided
    if (ariaLabel && !element.getAttribute('aria-label')) {
      element.setAttribute('aria-label', ariaLabel)
    }
    
    // Ensure the element can receive focus
    if (!element.hasAttribute('tabindex') && 
        !['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].includes(element.tagName)) {
      element.setAttribute('tabindex', '-1')
    }

    return () => {
      // Cleanup: remove ID if we set it
      if (element.id === targetId) {
        element.removeAttribute('id')
      }
    }
  }, [elementRef, targetId, ariaLabel])
}

/**
 * Component to mark main content area
 */
export function MainContent({ 
  children, 
  className,
  ...props 
}: React.HTMLAttributes<HTMLElement>) {
  const mainRef = React.useRef<HTMLElement>(null)
  
  useSkipLinkTarget(mainRef, 'main-content', 'Main content area')

  return (
    <main
      ref={mainRef}
      className={cn('focus:outline-none', className)}
      {...props}
    >
      {children}
    </main>
  )
}

/**
 * Component to mark navigation area
 */
export function NavigationArea({ 
  children, 
  className,
  ...props 
}: React.HTMLAttributes<HTMLElement>) {
  const navRef = React.useRef<HTMLElement>(null)
  
  useSkipLinkTarget(navRef, 'main-navigation', 'Main navigation')

  return (
    <nav
      ref={navRef}
      className={cn('focus:outline-none', className)}
      {...props}
    >
      {children}
    </nav>
  )
}

/**
 * Component to mark footer area
 */
export function FooterArea({ 
  children, 
  className,
  ...props 
}: React.HTMLAttributes<HTMLElement>) {
  const footerRef = React.useRef<HTMLElement>(null)
  
  useSkipLinkTarget(footerRef, 'footer-content', 'Footer content')

  return (
    <footer
      ref={footerRef}
      className={cn('focus:outline-none', className)}
      {...props}
    >
      {children}
    </footer>
  )
}

export default SkipLinks