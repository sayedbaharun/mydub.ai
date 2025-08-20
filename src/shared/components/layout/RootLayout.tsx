import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { Breadcrumb } from '@/shared/components/Breadcrumb'
 

function DebugZeroWatch() {
  useEffect(() => {
    const zeroInserts: Array<{ time: number; selectorPath: string; preview: string }> = []

    const buildSelectorPath = (el: Element | null) => {
      const path: string[] = []
      let cur: Element | null = el
      while (cur && cur !== document.body) {
        let sel = cur.tagName.toLowerCase()
        if ((cur as HTMLElement).id) sel += '#' + (cur as HTMLElement).id
        if ((cur as HTMLElement).classList && (cur as HTMLElement).classList.length) {
          sel += '.' + Array.from((cur as HTMLElement).classList).join('.')
        }
        path.unshift(sel)
        cur = cur.parentElement
      }
      return path.join(' > ')
    }

    const highlight = (el: HTMLElement | null) => {
      if (!el) return
      const prevOutline = el.style.outline
      el.style.outline = '2px solid red'
      el.style.outlineOffset = '2px'
      setTimeout(() => {
        el.style.outline = prevOutline
        el.style.outlineOffset = ''
      }, 2000)
    }

    const matchesZero = (s: string) => {
      const stripped = s.replace(/[\s\u200B-\u200D\uFEFF]/g, '')
      return stripped === '0'
    }

    const recordNode = (textNode: Node) => {
      const parent = (textNode.parentElement as HTMLElement) || null
      const selectorPath = buildSelectorPath(parent)
      const preview = parent && parent.textContent ? parent.textContent.trim().slice(0, 120) : ''
      // Try to get bounding rect of text node via range
      let rectInfo = null as null | { x: number; y: number; w: number; h: number }
      try {
        const range = document.createRange()
        range.selectNodeContents(textNode)
        const rect = range.getBoundingClientRect()
        rectInfo = { x: rect.x, y: rect.y, w: rect.width, h: rect.height }
      } catch {}
      const nearHeader = !!rectInfo && rectInfo.y <= 120
      zeroInserts.push({ time: Date.now(), selectorPath, preview })
      // eslint-disable-next-line no-console
      console.warn('[DebugZeroWatch] Zero-like text node detected:', { selectorPath, preview, rect: rectInfo, nearHeader })
      highlight(parent)
    }

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === Node.TEXT_NODE) {
            const text = (n.textContent || '')
            if (matchesZero(text)) recordNode(n)
          }
        })
      }
    })

    try {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[DebugZeroWatch] Failed to start observer', e)
    }

    // Initial scan for existing '0' text nodes present at first paint
    try {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null)
      let node: Node | null
      // eslint-disable-next-line no-cond-assign
      while ((node = walker.nextNode())) {
        const text = (node.textContent || '')
        if (matchesZero(text)) recordNode(node)
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[DebugZeroWatch] Initial scan failed', e)
    }

    ;(window as any).dumpZeroInserts = () => {
      // eslint-disable-next-line no-console
      console.log('[DebugZeroWatch] Captured zero insertions:', zeroInserts)
      return zeroInserts
    }

    return () => {
      observer.disconnect()
      try {
        delete (window as any).dumpZeroInserts
      } catch {
        // ignore
      }
    }
  }, [])

  return null
}

function ZeroHotfix() {
  useEffect(() => {
    const isDev = import.meta.env.DEV
    if (isDev) return // dev uses DebugZeroWatch instead

    const matchesZero = (s: string) => s.replace(/[\s\u200B-\u200D\uFEFF]/g, '') === '0'

    const safeRemove = (n: Node) => {
      if (n.parentNode) {
        try {
          n.parentNode.removeChild(n)
        } catch {}
      }
    }

    const scrubber = (root: Element | Document) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
      let node: Node | null
      // eslint-disable-next-line no-cond-assign
      while ((node = walker.nextNode())) {
        const text = node.textContent || ''
        if (!matchesZero(text)) continue
        // only act on small, top header area to avoid unintended removals
        try {
          const range = document.createRange()
          range.selectNodeContents(node)
          const rect = range.getBoundingClientRect()
          if (rect.height <= 20 && rect.width <= 20 && rect.top <= 140) {
            safeRemove(node)
          }
        } catch {}
      }
    }

    // Initial scrub on mount
    scrubber(document)

    const header = document.querySelector('header') || document.body
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === Node.TEXT_NODE) {
            const t = n.textContent || ''
            if (matchesZero(t)) {
              try {
                const r = document.createRange()
                r.selectNodeContents(n)
                const rect = r.getBoundingClientRect()
                if (rect.height <= 20 && rect.width <= 20 && rect.top <= 140) {
                  safeRemove(n)
                }
              } catch {}
            }
          } else if (n.nodeType === Node.ELEMENT_NODE) {
            scrubber(n as Element)
          }
        })
      }
    })

    try {
      observer.observe(header, { childList: true, subtree: true, characterData: true })
    } catch {}

    return () => observer.disconnect()
  }, [])

  return null
}

export function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {import.meta.env.DEV && <DebugZeroWatch />}
      {!import.meta.env.DEV && <ZeroHotfix />}
      <Header />
      <main id="main-content" className="flex-1 container mx-auto px-4 py-4 sm:py-6">
        <Breadcrumb />
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

// Alternative layout for auth pages (no header/nav)
export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  )
}

// Dashboard layout with same styling as main
export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="w-full">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}