/**
 * Aria Label Provider Component
 * Automatically adds ARIA labels to form elements
 */

import { useEffect } from 'react'
import { generateId } from '@/shared/lib/accessibility-utils'

export function AriaLabelProvider() {
  useEffect(() => {
    // Function to add ARIA labels to form elements
    const addAriaLabels = () => {
      // Add IDs and aria-describedby to form fields
      const formFields = document.querySelectorAll('input, textarea, select')
      formFields.forEach((field) => {
        const element = field as HTMLElement
        
        // Skip if already has proper ARIA attributes
        if (element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')) {
          return
        }

        // Find associated label
        const label = document.querySelector(`label[for="${element.id}"]`) as HTMLLabelElement
        if (label && !element.id) {
          // Generate ID if missing
          const id = generateId('field')
          element.id = id
          label.setAttribute('for', id)
        }

        // Add aria-required for required fields
        if (element.hasAttribute('required')) {
          element.setAttribute('aria-required', 'true')
        }

        // Add aria-invalid for fields with errors
        const errorElement = element.parentElement?.querySelector('[role="alert"]')
        if (errorElement) {
          const errorId = errorElement.id || generateId('error')
          errorElement.id = errorId
          element.setAttribute('aria-invalid', 'true')
          element.setAttribute('aria-describedby', errorId)
        }
      })

      // Add role="button" to clickable elements
      const clickableElements = document.querySelectorAll('[onclick], [data-clickable]')
      clickableElements.forEach((element) => {
        if (!element.getAttribute('role') && 
            !['BUTTON', 'A', 'INPUT'].includes(element.tagName)) {
          element.setAttribute('role', 'button')
          if (!element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '0')
          }
        }
      })

      // Add proper ARIA labels to icon buttons
      const iconButtons = document.querySelectorAll('button:not([aria-label])')
      iconButtons.forEach((button) => {
        const buttonEl = button as HTMLButtonElement
        // Check if button only contains an icon (no text)
        if (!buttonEl.textContent?.trim() && buttonEl.querySelector('svg')) {
          // Try to infer purpose from class names or data attributes
          const className = buttonEl.className
          let label = ''
          
          if (className.includes('close')) label = 'Close'
          else if (className.includes('menu')) label = 'Menu'
          else if (className.includes('search')) label = 'Search'
          else if (className.includes('settings')) label = 'Settings'
          else if (className.includes('edit')) label = 'Edit'
          else if (className.includes('delete')) label = 'Delete'
          else if (className.includes('save')) label = 'Save'
          else if (className.includes('cancel')) label = 'Cancel'
          
          if (label) {
            buttonEl.setAttribute('aria-label', label)
          }
        }
      })

      // Add ARIA labels to links that only contain images
      const imageLinks = document.querySelectorAll('a:not([aria-label])')
      imageLinks.forEach((link) => {
        const linkEl = link as HTMLAnchorElement
        const img = linkEl.querySelector('img')
        if (img && !linkEl.textContent?.trim()) {
          const altText = img.getAttribute('alt')
          if (altText) {
            linkEl.setAttribute('aria-label', altText)
          }
        }
      })

      // Add proper headings hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      let lastLevel = 0
      headings.forEach((heading) => {
        const level = parseInt(heading.tagName[1])
        if (lastLevel > 0 && level > lastLevel + 1) {
          console.warn(`Heading hierarchy issue: ${heading.tagName} follows h${lastLevel}`)
        }
        lastLevel = level
      })
    }

    // Run on mount
    addAriaLabels()

    // Set up mutation observer to handle dynamic content
    const observer = new MutationObserver(() => {
      addAriaLabels()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}