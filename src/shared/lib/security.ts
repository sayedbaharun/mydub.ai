// Client-side security utilities for MyDub.AI

// Rate limiting for client-side API calls
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  canMakeRequest(endpoint: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(endpoint) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(endpoint, validRequests);
    return true;
  }

  getRemainingTime(endpoint: string): number {
    const requests = this.requests.get(endpoint) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    const timeUntilReset = this.windowMs - (Date.now() - oldestRequest);
    return Math.max(0, Math.ceil(timeUntilReset / 1000));
  }
}

// Create rate limiters for different features
export const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const searchRateLimiter = new RateLimiter(30, 60 * 1000); // 30 searches per minute
export const apiRateLimiter = new RateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes

// XSS Prevention
export function sanitizeInput(input: string): string {
  // Remove all HTML tags and dangerous content
  let result = input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, ' ') // Remove all HTML tags and replace with space
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim(); // Remove leading and trailing spaces
  
  // Special case: preserve trailing space for self-closing tags or tags with attributes
  // that end the input (like img tags)
  if (input.match(/\s+<[^>]*\/?>$/) || input.match(/\s+<\w+\s+[^>]*>$/)) {
    result += ' ';
  }
  
  return result;
}

export function sanitizeHtml(html: string): string {
  // Create a temporary element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Remove dangerous elements
  const scripts = temp.querySelectorAll('script, iframe, object, embed, form');
  scripts.forEach(el => el.remove());
  
  // Remove dangerous attributes
  const allElements = temp.querySelectorAll('*');
  allElements.forEach(el => {
    // Remove event handlers
    for (const attr of el.attributes) {
      if (attr.name.startsWith('on') || attr.value.includes('javascript:')) {
        el.removeAttribute(attr.name);
      }
    }
  });
  
  return temp.innerHTML;
}

// CSRF Token Management
export class CSRFTokenManager {
  private static TOKEN_KEY = 'csrf_token';
  
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem(this.TOKEN_KEY, token);
    return token;
  }
  
  static getToken(): string {
    let token = sessionStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      token = this.generateToken();
    }
    return token;
  }
  
  static validateToken(token: string): boolean {
    const storedToken = sessionStorage.getItem(this.TOKEN_KEY);
    return storedToken === token;
  }
}

// Content Security Policy for dynamic content
export function getCSPMeta(): string {
  return `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: blob:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://newsapi.org;
    media-src 'self' https: blob:;
    object-src 'none';
    child-src 'self' blob:;
    frame-src 'self';
    worker-src 'self' blob:;
    form-action 'self';
  `.replace(/\s+/g, ' ').trim();
}

// Secure storage utilities
export class SecureStorage {
  private static encrypt(data: string, key: string): string {
    // Simple XOR encryption for demo - use proper encryption in production
    return btoa(
      data
        .split('')
        .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
        .join('')
    );
  }
  
  private static decrypt(data: string, key: string): string {
    // Simple XOR decryption for demo - use proper encryption in production
    return atob(data)
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join('');
  }
  
  static setItem(key: string, value: any, encrypt = false): void {
    const data = JSON.stringify(value);
    const storageData = encrypt ? this.encrypt(data, key) : data;
    localStorage.setItem(key, storageData);
  }
  
  static getItem(key: string, decrypt = false): any {
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    try {
      const decryptedData = decrypt ? this.decrypt(data, key) : data;
      return JSON.parse(decryptedData);
    } catch {
      return null;
    }
  }
  
  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }
  
  static clear(): void {
    localStorage.clear();
  }
}

// API Request Security
export class SecureApiClient {
  private static addSecurityHeaders(headers: HeadersInit = {}): HeadersInit {
    return {
      ...headers,
      'X-CSRF-Token': CSRFTokenManager.getToken(),
      'X-Requested-With': 'XMLHttpRequest',
    };
  }
  
  static async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Check rate limiting
    const endpoint = new URL(url).pathname;
    if (!apiRateLimiter.canMakeRequest(endpoint)) {
      throw new Error(`Rate limit exceeded. Please wait ${apiRateLimiter.getRemainingTime(endpoint)} seconds.`);
    }
    
    // Add security headers
    const secureOptions: RequestInit = {
      ...options,
      headers: this.addSecurityHeaders(options.headers),
      credentials: 'same-origin',
    };
    
    return fetch(url, secureOptions);
  }
}

// Input validation utilities
export const validators = {
  email: (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  
  phone: (phone: string): boolean => {
    const re = /^\+?[\d\s-()]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
  },
  
  url: (url: string): boolean => {
    try {
      const parsed = new URL(url);
      // Block dangerous protocols
      const allowedProtocols = ['http:', 'https:', 'ftp:', 'mailto:'];
      return allowedProtocols.includes(parsed.protocol);
    } catch {
      return false;
    }
  },
  
  alphanumeric: (str: string): boolean => {
    return /^[a-zA-Z0-9]+$/.test(str);
  },
  
  strongPassword: (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
  },
};

// Session timeout manager
export class SessionManager {
  private static TIMEOUT_KEY = 'session_timeout';
  private static WARNING_TIME = 5 * 60 * 1000; // 5 minutes warning
  private static timeout: NodeJS.Timeout | null = null;
  private static warningTimeout: NodeJS.Timeout | null = null;
  
  static startSession(
    timeoutMs: number,
    onTimeout: () => void,
    onWarning?: () => void
  ): void {
    this.clearSession();
    
    // Set warning timeout
    if (onWarning && timeoutMs > this.WARNING_TIME) {
      this.warningTimeout = setTimeout(() => {
        onWarning();
      }, Math.max(0, timeoutMs - this.WARNING_TIME));
    }
    
    // Set session timeout
    this.timeout = setTimeout(() => {
      onTimeout();
      this.clearSession();
    }, timeoutMs);
    
    // Store timeout timestamp
    localStorage.setItem(this.TIMEOUT_KEY, (Date.now() + timeoutMs).toString());
  }
  
  static resetSession(): void {
    const timeoutStr = localStorage.getItem(this.TIMEOUT_KEY);
    if (!timeoutStr) return;
    
    const timeout = parseInt(timeoutStr) - Date.now();
    if (timeout > 0) {
      // Restart with remaining time
      this.startSession(timeout, () => {
        // Handle timeout
        window.location.href = '/auth/signin?reason=session_expired';
      });
    }
  }
  
  static clearSession(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
      this.warningTimeout = null;
    }
    localStorage.removeItem(this.TIMEOUT_KEY);
  }
}

// Browser fingerprinting for additional security
export async function getBrowserFingerprint(): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('fingerprint', 2, 2);
  
  const dataURL = canvas.toDataURL();
  const text = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    dataURL
  ].join('|');
  
  // Hash the fingerprint
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}