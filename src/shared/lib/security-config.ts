/**
 * Security Configuration for MyDub.AI
 * 
 * This module contains comprehensive security configurations including:
 * - Content Security Policy (CSP)
 * - HTTP Security Headers
 * - Rate limiting
 * - Input validation
 * - Authentication security
 */

// Content Security Policy Configuration
export const getCSPDirectives = (env: 'development' | 'production' = 'production') => {
  const isDev = env === 'development'
  
  const baseDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Vite in development and some components
      "'unsafe-eval'", // Required for development and some dynamic imports
      'https://vercel.live',
      'https://va.vercel-scripts.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://static.cloudflareinsights.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind and styled components
      'https://fonts.googleapis.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'http:', // Allow for development and external images
      '*.supabase.co',
      '*.googleapis.com',
      '*.googleusercontent.com'
    ],
    'media-src': [
      "'self'",
      'blob:',
      'data:',
      '*.supabase.co'
    ],
    'connect-src': [
      "'self'",
      'wss:',
      'https://api.openai.com',
      'https://api.anthropic.com',
      'https://generativelanguage.googleapis.com',
      'https://openrouter.ai',
      'https://*.supabase.co',
      'https://vercel.live',
      'https://vitals.vercel-insights.com',
      'https://www.google-analytics.com',
      'https://region1.google-analytics.com'
    ],
    'worker-src': [
      "'self'",
      'blob:'
    ],
    'frame-src': [
      "'self'",
      'https:'
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': isDev ? [] : ['']
  }
  
  // Development-specific adjustments
  if (isDev) {
    baseDirectives['connect-src'].push(
      'ws://localhost:*',
      'http://localhost:*',
      'ws://127.0.0.1:*',
      'http://127.0.0.1:*'
    )
    baseDirectives['script-src'].push(
      'http://localhost:*',
      'ws://localhost:*'
    )
  }
  
  return baseDirectives
}

// Generate CSP header string
export const generateCSPHeader = (env: 'development' | 'production' = 'production') => {
  const directives = getCSPDirectives(env)
  
  return Object.entries(directives)
    .filter(([_, values]) => values.length > 0)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ')
}

// Security Headers Configuration
export const getSecurityHeaders = (env: 'development' | 'production' = 'production') => {
  const isDev = env === 'development'
  
  return {
    // Content Security Policy
    'Content-Security-Policy': generateCSPHeader(env),
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'picture-in-picture=()'
    ].join(', '),
    
    // Strict Transport Security (HTTPS only)
    ...(isDev ? {} : {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }),
    
    // Cross-Origin policies
    'Cross-Origin-Embedder-Policy': 'credentialless',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    
    // Additional security headers
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-Download-Options': 'noopen',
    'X-DNS-Prefetch-Control': 'off'
  }
}

// Rate Limiting Configuration
export const rateLimitConfig = {
  // General API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // requests per window
    message: 'Too many API requests, please try again later'
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // login attempts per window
    message: 'Too many authentication attempts, please try again later'
  },
  
  // AI chat endpoints
  aiChat: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // messages per minute
    message: 'Too many chat messages, please slow down'
  },
  
  // Search endpoints
  search: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // searches per minute
    message: 'Too many search requests, please try again later'
  },
  
  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // uploads per hour
    message: 'Upload limit exceeded, please try again later'
  }
}

// Input Validation Rules
export const validationRules = {
  // User input validation
  user: {
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      maxLength: 254,
      required: true
    },
    password: {
      minLength: 8,
      maxLength: 128,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      required: true
    },
    name: {
      minLength: 1,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+$/,
      required: true
    },
    phone: {
      pattern: /^\+?[1-9]\d{1,14}$/,
      maxLength: 20,
      required: false
    }
  },
  
  // Content validation
  content: {
    title: {
      minLength: 1,
      maxLength: 200,
      required: true
    },
    description: {
      minLength: 0,
      maxLength: 1000,
      required: false
    },
    message: {
      minLength: 1,
      maxLength: 4000,
      required: true
    }
  },
  
  // File validation
  file: {
    image: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maxWidth: 4096,
      maxHeight: 4096
    },
    document: {
      maxSize: 25 * 1024 * 1024, // 25MB
      allowedTypes: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    }
  }
}

// Sanitization Functions
export const sanitizeInput = {
  // Remove potentially dangerous characters
  text: (input: string): string => {
    return input
      .trim()
      .replace(/[<>"'%;()&+]/g, '') // Remove potentially dangerous characters
      .slice(0, 1000) // Limit length
  },
  
  // Sanitize HTML content
  html: (input: string): string => {
    // This is a basic sanitization - use DOMPurify for production
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
  },
  
  // Sanitize SQL injection attempts
  sql: (input: string): string => {
    return input
      .replace(/['";\\]/g, '')
      .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '')
  },
  
  // Sanitize file names
  filename: (input: string): string => {
    return input
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 255)
  }
}

// Authentication Security Configuration
export const authSecurityConfig = {
  // Session configuration
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    rolling: true, // Reset expiry on activity
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const
  },
  
  // Password requirements
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true,
    preventReuse: 5 // Number of previous passwords to prevent reuse
  },
  
  // Account lockout
  lockout: {
    maxAttempts: 5,
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
    resetOnSuccess: true
  },
  
  // Two-factor authentication
  twoFactor: {
    issuer: 'MyDub.AI',
    window: 2, // Allow 2 windows of time drift
    step: 30 // 30-second windows
  },
  
  // JWT configuration
  jwt: {
    expiresIn: '24h',
    issuer: 'mydub.ai',
    audience: 'mydub.ai',
    algorithm: 'HS256' as const
  }
}

// API Security Configuration
export const apiSecurityConfig = {
  // Request size limits
  limits: {
    json: '10mb',
    urlencoded: '10mb',
    text: '10mb',
    raw: '10mb'
  },
  
  // CORS configuration
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://mydub.ai', 'https://www.mydub.ai']
      : true,
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
  },
  
  // API key validation
  apiKey: {
    header: 'X-API-Key',
    required: false, // Only for specific endpoints
    length: 32
  },
  
  // Request logging
  logging: {
    enabled: true,
    includeBody: process.env.NODE_ENV !== 'production',
    excludePaths: ['/health', '/metrics'],
    sanitizeHeaders: ['authorization', 'x-api-key', 'cookie']
  }
}

// Security Monitoring Configuration
export const securityMonitoringConfig = {
  // Threat detection
  threats: {
    // SQL injection patterns
    sqlInjection: [
      /(\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
      /('|"|;|--|\*|%|\/\*|\*\/)/i
    ],
    
    // XSS patterns
    xss: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ],
    
    // Path traversal patterns
    pathTraversal: [
      /\.\.\//g,
      /\.\.\\/g,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi
    ],
    
    // Command injection patterns
    commandInjection: [
      /[;&|`$(){}[\]]/g,
      /\b(cat|ls|dir|type|copy|move|del|rm|chmod|chown)\b/i
    ]
  },
  
  // Alert thresholds
  alerts: {
    failedLoginAttempts: 5,
    suspiciousRequests: 10,
    rateLimitExceeded: 3,
    errorRate: 0.1 // 10% error rate
  },
  
  // Response actions
  actions: {
    blockDuration: 24 * 60 * 60 * 1000, // 24 hours
    notifyAdmins: true,
    logToSecurity: true,
    enableCaptcha: true
  }
}

// Export all configurations
export const securityConfig = {
  headers: getSecurityHeaders,
  csp: getCSPDirectives,
  rateLimit: rateLimitConfig,
  validation: validationRules,
  sanitization: sanitizeInput,
  auth: authSecurityConfig,
  api: apiSecurityConfig,
  monitoring: securityMonitoringConfig
}

export default securityConfig