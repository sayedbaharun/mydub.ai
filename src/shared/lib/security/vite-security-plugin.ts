/**
 * Vite plugin for applying security headers in development
 */

import type { Plugin } from 'vite'
import { getSecurityHeaders } from './headers'

export function securityHeadersPlugin(): Plugin {
  return {
    name: 'security-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Apply security headers to all responses
        const headers = getSecurityHeaders(true) // development mode
        
        Object.entries(headers).forEach(([key, value]) => {
          res.setHeader(key, value)
        })
        
        next()
      })
    },
    // For preview mode
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        // Apply production-like headers in preview
        const headers = getSecurityHeaders(false) // production mode
        
        Object.entries(headers).forEach(([key, value]) => {
          res.setHeader(key, value)
        })
        
        next()
      })
    }
  }
}