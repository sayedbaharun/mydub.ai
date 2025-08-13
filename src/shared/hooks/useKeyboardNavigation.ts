/**
 * Keyboard Navigation Hook
 * Provides comprehensive keyboard navigation support
 */

import { useEffect, useRef, useCallback } from 'react'

interface UseKeyboardNavigationOptions {
  onEscape?: () => void
  onEnter?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: (shiftKey: boolean) => void
  onSpace?: () => void
  onHome?: () => void
  onEnd?: () => void
  onPageUp?: () => void
  onPageDown?: () => void
  enabled?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
}

export function useKeyboardNavigation({
  onEscape,
  onEnter,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onTab,
  onSpace,
  onHome,
  onEnd,
  onPageUp,
  onPageDown,
  enabled = true,
  preventDefault = true,
  stopPropagation = false
}: UseKeyboardNavigationOptions = {}) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    const handlers: Record<string, (() => void) | undefined> = {
      'Escape': onEscape,
      'Enter': onEnter,
      'ArrowUp': onArrowUp,
      'ArrowDown': onArrowDown,
      'ArrowLeft': onArrowLeft,
      'ArrowRight': onArrowRight,
      'Tab': onTab ? () => onTab(event.shiftKey) : undefined,
      ' ': onSpace,
      'Home': onHome,
      'End': onEnd,
      'PageUp': onPageUp,
      'PageDown': onPageDown
    }

    const handler = handlers[event.key]
    if (handler) {
      if (preventDefault) event.preventDefault()
      if (stopPropagation) event.stopPropagation()
      handler()
    }
  }, [
    enabled,
    preventDefault,
    stopPropagation,
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onSpace,
    onHome,
    onEnd,
    onPageUp,
    onPageDown
  ])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  return { handleKeyDown }
}

/**
 * Focus Trap Hook
 * Traps focus within a container element
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, enabled = true) {
  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    
    const firstFocusable = focusableElements[0] as HTMLElement
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

    // Focus first element on mount
    firstFocusable?.focus()

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    return () => container.removeEventListener('keydown', handleTabKey)
  }, [containerRef, enabled])
}

/**
 * Roving Tab Index Hook
 * Implements roving tabindex pattern for lists
 */
export function useRovingTabIndex(
  itemsRef: React.RefObject<HTMLElement[]>,
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both'
    loop?: boolean
    onSelect?: (index: number) => void
  } = {}
) {
  const { orientation = 'vertical', loop = true, onSelect } = options
  const currentIndexRef = useRef(0)

  const focusItem = useCallback((index: number) => {
    const items = itemsRef.current
    if (!items || items.length === 0) return

    // Clamp index
    let newIndex = index
    if (loop) {
      newIndex = ((index % items.length) + items.length) % items.length
    } else {
      newIndex = Math.max(0, Math.min(index, items.length - 1))
    }

    // Update tabindex
    items.forEach((item, i) => {
      item.setAttribute('tabindex', i === newIndex ? '0' : '-1')
    })

    // Focus the item
    items[newIndex]?.focus()
    currentIndexRef.current = newIndex
    onSelect?.(newIndex)
  }, [itemsRef, loop, onSelect])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const items = itemsRef.current
    if (!items || items.length === 0) return

    const currentIndex = currentIndexRef.current
    let handled = false

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          focusItem(currentIndex + 1)
          handled = true
        }
        break
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          focusItem(currentIndex - 1)
          handled = true
        }
        break
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          focusItem(currentIndex + 1)
          handled = true
        }
        break
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          focusItem(currentIndex - 1)
          handled = true
        }
        break
      case 'Home':
        focusItem(0)
        handled = true
        break
      case 'End':
        focusItem(items.length - 1)
        handled = true
        break
    }

    if (handled) {
      event.preventDefault()
      event.stopPropagation()
    }
  }, [itemsRef, orientation, focusItem])

  return {
    handleKeyDown,
    focusItem,
    currentIndex: currentIndexRef.current
  }
}

/**
 * Live Region Hook
 * Announces messages to screen readers
 */
export function useLiveRegion(ariaLive: 'polite' | 'assertive' = 'polite') {
  const regionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Create live region element
    const region = document.createElement('div')
    region.setAttribute('role', 'status')
    region.setAttribute('aria-live', ariaLive)
    region.setAttribute('aria-atomic', 'true')
    region.style.position = 'absolute'
    region.style.left = '-10000px'
    region.style.width = '1px'
    region.style.height = '1px'
    region.style.overflow = 'hidden'
    
    document.body.appendChild(region)
    regionRef.current = region

    return () => {
      document.body.removeChild(region)
    }
  }, [ariaLive])

  const announce = useCallback((message: string) => {
    if (regionRef.current) {
      regionRef.current.textContent = message
      // Clear after announcement
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = ''
        }
      }, 1000)
    }
  }, [])

  return announce
}