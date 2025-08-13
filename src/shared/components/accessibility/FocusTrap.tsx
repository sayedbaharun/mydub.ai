/**
 * Focus Trap Component for MyDub.ai
 * Traps focus within modal dialogs and other overlay components
 */

import React, { useEffect, useRef, ReactNode } from 'react'
import { FocusManager } from '@/shared/lib/accessibility'

interface FocusTrapProps {
  /** Content to render inside the focus trap */
  children: ReactNode
  /** Whether the focus trap is active */
  active: boolean
  /** Element to focus when trap becomes active (defaults to first focusable) */
  initialFocus?: HTMLElement | string
  /** Element to focus when trap becomes inactive (usually the trigger) */
  restoreFocus?: HTMLElement
  /** Whether to restore focus when trap is deactivated */
  shouldRestoreFocus?: boolean
  /** Callback when user attempts to escape the trap */
  onEscape?: () => void
  /** Additional class names */
  className?: string
}

export function FocusTrap({
  children,
  active,
  initialFocus,
  restoreFocus,
  shouldRestoreFocus = true,
  onEscape,
  className
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const focusManager = useRef(new FocusManager())
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return

    const container = containerRef.current
    if (!container) return

    // Store the currently focused element to restore later
    previousActiveElement.current = document.activeElement as HTMLElement

    // Set initial focus
    const setInitialFocus = () => {
      let elementToFocus: HTMLElement | null = null

      if (typeof initialFocus === 'string') {
        elementToFocus = container.querySelector(initialFocus)
      } else if (initialFocus instanceof HTMLElement) {
        elementToFocus = initialFocus
      } else {
        // Default to first focusable element
        elementToFocus = focusManager.current.getFirstFocusable(container)
      }

      if (elementToFocus) {
        elementToFocus.focus()
      }
    }

    // Small delay to ensure the modal is fully rendered
    const focusTimeout = setTimeout(setInitialFocus, 100)

    // Handle keyboard events
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault()
        onEscape()
        return
      }

      // Handle Tab key for focus trapping
      if (event.key === 'Tab') {
        focusManager.current.trapFocus(container, event)
      }
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      clearTimeout(focusTimeout)
      document.removeEventListener('keydown', handleKeyDown)

      // Restore focus if needed
      if (shouldRestoreFocus) {
        const elementToRestore = restoreFocus || previousActiveElement.current
        if (elementToRestore && document.contains(elementToRestore)) {
          elementToRestore.focus()
        }
      }
    }
  }, [active, initialFocus, restoreFocus, shouldRestoreFocus, onEscape])

  if (!active) {
    return <>{children}</>
  }

  return (
    <div
      ref={containerRef}
      className={className}
      // Ensure the trap container doesn't interfere with screen readers
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  )
}

/**
 * Hook to create a focus trap
 */
export function useFocusTrap(active: boolean) {
  const containerRef = useRef<HTMLElement>(null)
  const focusManager = useRef(new FocusManager())
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Focus the first focusable element
    const firstFocusable = focusManager.current.getFirstFocusable(container)
    if (firstFocusable) {
      firstFocusable.focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        focusManager.current.trapFocus(container, event)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      
      // Restore focus
      if (previousActiveElement.current && document.contains(previousActiveElement.current)) {
        previousActiveElement.current.focus()
      }
    }
  }, [active])

  return containerRef
}

/**
 * Portal Focus Trap for components that render outside the main DOM tree
 */
export function PortalFocusTrap({
  children,
  active,
  onEscape,
  ...props
}: Omit<FocusTrapProps, 'children'> & {
  children: (trapRef: React.RefObject<HTMLDivElement>) => ReactNode
}) {
  const trapRef = useFocusTrap(active)

  useEffect(() => {
    if (!active) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault()
        onEscape()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [active, onEscape])

  return <>{children(trapRef as React.RefObject<HTMLDivElement>)}</>
}

/**
 * Modal wrapper with focus trap
 */
interface ModalFocusTrapProps extends Omit<FocusTrapProps, 'active'> {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Modal title for accessibility */
  title?: string
  /** Modal description for accessibility */
  description?: string
}

export function ModalFocusTrap({
  children,
  open,
  onClose,
  title,
  description,
  className,
  ...focusTrapProps
}: ModalFocusTrapProps) {
  const titleId = React.useId()
  const descriptionId = React.useId()

  return (
    <FocusTrap
      active={open}
      onEscape={onClose}
      className={className}
      {...focusTrapProps}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
      >
        {title && (
          <div id={titleId} className="sr-only">
            {title}
          </div>
        )}
        {description && (
          <div id={descriptionId} className="sr-only">
            {description}
          </div>
        )}
        {children}
      </div>
    </FocusTrap>
  )
}

export default FocusTrap