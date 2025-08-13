/**
 * Accessibility utilities for MyDub.ai
 * Provides keyboard navigation, focus management, and ARIA support
 */

import { RefObject, useCallback, useEffect, useRef } from 'react'

// Focus management utilities
export class FocusManager {
  private focusableElements: string = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ')

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableElements))
  }

  /**
   * Get the first focusable element in a container
   */
  getFirstFocusable(container: HTMLElement): HTMLElement | null {
    const focusable = this.getFocusableElements(container)
    return focusable.length > 0 ? focusable[0] : null
  }

  /**
   * Get the last focusable element in a container
   */
  getLastFocusable(container: HTMLElement): HTMLElement | null {
    const focusable = this.getFocusableElements(container)
    return focusable.length > 0 ? focusable[focusable.length - 1] : null
  }

  /**
   * Move focus to the next focusable element
   */
  focusNext(container: HTMLElement, currentElement: HTMLElement): boolean {
    const focusable = this.getFocusableElements(container)
    const currentIndex = focusable.indexOf(currentElement)
    
    if (currentIndex !== -1 && currentIndex < focusable.length - 1) {
      focusable[currentIndex + 1].focus()
      return true
    }
    return false
  }

  /**
   * Move focus to the previous focusable element
   */
  focusPrevious(container: HTMLElement, currentElement: HTMLElement): boolean {
    const focusable = this.getFocusableElements(container)
    const currentIndex = focusable.indexOf(currentElement)
    
    if (currentIndex > 0) {
      focusable[currentIndex - 1].focus()
      return true
    }
    return false
  }

  /**
   * Trap focus within a container (for modals/dialogs)
   */
  trapFocus(container: HTMLElement, event: KeyboardEvent): void {
    if (event.key !== 'Tab') return

    const focusable = this.getFocusableElements(container)
    if (focusable.length === 0) return

    const firstFocusable = focusable[0]
    const lastFocusable = focusable[focusable.length - 1]

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        event.preventDefault()
        lastFocusable.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        event.preventDefault()
        firstFocusable.focus()
      }
    }
  }
}

// Keyboard navigation utilities
export class KeyboardNavigator {
  /**
   * Handle arrow key navigation in lists/grids
   */
  static handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    orientation: 'horizontal' | 'vertical' | 'both' = 'vertical'
  ): number {
    let nextIndex = currentIndex

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault()
          nextIndex = (currentIndex + 1) % items.length
        }
        break
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault()
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        }
        break
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault()
          nextIndex = (currentIndex + 1) % items.length
        }
        break
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault()
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        }
        break
      case 'Home':
        event.preventDefault()
        nextIndex = 0
        break
      case 'End':
        event.preventDefault()
        nextIndex = items.length - 1
        break
    }

    if (nextIndex !== currentIndex && items[nextIndex]) {
      items[nextIndex].focus()
    }

    return nextIndex
  }

  /**
   * Handle Enter/Space activation
   */
  static handleActivation(event: KeyboardEvent, callback: () => void): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      callback()
    }
  }
}

// ARIA utilities
export class AriaManager {
  /**
   * Announce content to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.setAttribute('class', 'sr-only')
    announcer.textContent = message

    document.body.appendChild(announcer)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer)
    }, 1000)
  }

  /**
   * Create unique IDs for ARIA relationships
   */
  static generateId(prefix: string = 'aria'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Set up ARIA relationships between elements
   */
  static linkElements(control: HTMLElement, target: HTMLElement, relationship: string): void {
    const id = target.id || this.generateId()
    target.id = id
    control.setAttribute(relationship, id)
  }
}

// React hooks for accessibility
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null)
  const focusManager = useRef(new FocusManager())

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const handleKeyDown = (event: KeyboardEvent) => {
      focusManager.current.trapFocus(container, event)
    }

    // Focus first element when activated
    const firstFocusable = focusManager.current.getFirstFocusable(container)
    if (firstFocusable) {
      firstFocusable.focus()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive])

  return containerRef
}

export function useKeyboardNavigation(
  items: HTMLElement[],
  orientation: 'horizontal' | 'vertical' | 'both' = 'vertical'
) {
  const currentIndex = useRef(0)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    currentIndex.current = KeyboardNavigator.handleArrowNavigation(
      event,
      items,
      currentIndex.current,
      orientation
    )
  }, [items, orientation])

  return { handleKeyDown, currentIndex: currentIndex.current }
}

export function useAnnouncer() {
  return useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    AriaManager.announce(message, priority)
  }, [])
}

// Skip link utilities
export function createSkipLink(targetId: string, label: string): HTMLElement {
  const skipLink = document.createElement('a')
  skipLink.href = `#${targetId}`
  skipLink.textContent = label
  skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded'
  
  skipLink.addEventListener('click', (e) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })

  return skipLink
}

// Screen reader utilities
export const screenReaderOnly = 'sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0'

export function addScreenReaderText(element: HTMLElement, text: string): void {
  const srText = document.createElement('span')
  srText.className = screenReaderOnly
  srText.textContent = text
  element.appendChild(srText)
}

// Focus visible utilities for custom styling
export function setupFocusVisible(): void {
  let hadKeyboardEvent = true
  const keyboardThrottleTimeout = 100

  function onPointerDown() {
    hadKeyboardEvent = false
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.metaKey || e.altKey || e.ctrlKey) {
      return
    }
    hadKeyboardEvent = true
  }

  function onFocus(e: FocusEvent) {
    if (hadKeyboardEvent || (e.target as HTMLElement).matches(':focus-visible')) {
      (e.target as HTMLElement).classList.add('focus-visible')
    }
  }

  function onBlur(e: FocusEvent) {
    (e.target as HTMLElement).classList.remove('focus-visible')
  }

  document.addEventListener('keydown', onKeyDown, true)
  document.addEventListener('mousedown', onPointerDown, true)
  document.addEventListener('pointerdown', onPointerDown, true)
  document.addEventListener('touchstart', onPointerDown, true)
  document.addEventListener('focus', onFocus, true)
  document.addEventListener('blur', onBlur, true)
}

export default {
  FocusManager,
  KeyboardNavigator,
  AriaManager,
  useFocusTrap,
  useKeyboardNavigation,
  useAnnouncer,
  createSkipLink,
  addScreenReaderText,
  setupFocusVisible,
  screenReaderOnly
}